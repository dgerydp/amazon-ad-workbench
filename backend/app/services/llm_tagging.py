from __future__ import annotations

import json
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.provider_config import ProviderConfig
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag
from app.services.provider_service import DEFAULT_PROVIDERS


COLOR_WORDS = {"red", "blue", "black", "white", "green", "pink", "purple", "yellow", "orange", "grey", "gray"}
AUDIENCE_WORDS = {"baby", "toddler", "infant", "boy", "girl", "kids", "child", "newborn"}
SCENE_WORDS = {"christmas", "halloween", "valentine", "summer", "winter", "party", "school", "birthday"}
CORE_WORDS = {"outfit", "dress", "shirt", "pants", "clothes", "set", "romper", "onesie", "jacket", "shoes"}


def _provider_defaults() -> dict[str, dict[str, str]]:
    return {
        "openai": {"base_url": "https://api.openai.com/v1", "mode": "openai"},
        "deepseek": {"base_url": "https://api.deepseek.com/v1", "mode": "openai"},
        "qwen": {"base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1", "mode": "openai"},
        "doubao": {"base_url": "https://ark.cn-beijing.volces.com/api/v3", "mode": "openai"},
        "claude": {"base_url": "https://api.anthropic.com/v1", "mode": "anthropic"},
        "gemini": {"base_url": "https://generativelanguage.googleapis.com/v1beta", "mode": "gemini"},
    }


def _decode_key(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        import base64

        return base64.b64decode(value.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def _heuristic_tag(token: str) -> dict[str, Any]:
    lowered = token.lower().strip()
    if lowered in COLOR_WORDS:
        return {"tag_l1": "attribute", "tag_l2": "color", "tag_l3": lowered, "confidence": 0.7, "reason": "Color word"}
    if lowered in AUDIENCE_WORDS:
        return {"tag_l1": "audience", "tag_l2": "age_or_person", "tag_l3": lowered, "confidence": 0.75, "reason": "Audience word"}
    if lowered in SCENE_WORDS:
        return {"tag_l1": "scene", "tag_l2": "occasion", "tag_l3": lowered, "confidence": 0.7, "reason": "Scene word"}
    if lowered in CORE_WORDS:
        return {"tag_l1": "core", "tag_l2": "product_type", "tag_l3": lowered, "confidence": 0.7, "reason": "Core product word"}
    return {"tag_l1": "untagged", "tag_l2": "", "tag_l3": "", "confidence": 0.3, "reason": "Heuristic fallback"}


def _prompt(tokens: list[str]) -> str:
    joined = ", ".join(tokens)
    return (
        "Classify each token for Amazon advertising analysis. "
        "Return only JSON array. Each item must contain token, tag_l1, tag_l2, tag_l3, confidence, reason. "
        "Valid tag_l1 values: core, attribute, audience, scene, brand, competitor, irrelevant, untagged. "
        f"Tokens: {joined}"
    )


def _extract_json(text: str) -> list[dict]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        text = text.replace("json", "", 1).strip()
    start = text.find("[")
    end = text.rfind("]")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


def _call_openai_compatible(base_url: str, api_key: str, model: str, tokens: list[str]) -> list[dict]:
    response = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a JSON-only tagging engine."},
                {"role": "user", "content": _prompt(tokens)},
            ],
            "temperature": 0,
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return _extract_json(content)


def _call_anthropic(base_url: str, api_key: str, model: str, tokens: list[str]) -> list[dict]:
    response = httpx.post(
        f"{base_url.rstrip('/')}/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1024,
            "system": "You are a JSON-only tagging engine.",
            "messages": [{"role": "user", "content": _prompt(tokens)}],
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json()["content"][0]["text"]
    return _extract_json(content)


def _call_gemini(base_url: str, api_key: str, model: str, tokens: list[str]) -> list[dict]:
    response = httpx.post(
        f"{base_url.rstrip('/')}/models/{model}:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": _prompt(tokens)}]}],
            "generationConfig": {"temperature": 0},
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _extract_json(content)


def _resolve_provider(db: Session, provider: str | None, model: str | None) -> tuple[str | None, str | None, str | None]:
    config = None
    if provider:
        config = db.scalar(select(ProviderConfig).where(ProviderConfig.provider == provider, ProviderConfig.enabled.is_(True)))
    if config is None:
        config = db.scalar(select(ProviderConfig).where(ProviderConfig.enabled.is_(True)).order_by(ProviderConfig.id.asc()))
    if config is None:
        return None, None, None
    defaults = _provider_defaults().get(config.provider, {})
    return config.provider, config.model or model, config.base_url or defaults.get("base_url")


def tag_tokens(
    db: Session,
    shop_id: int | None = None,
    use_ai: bool = False,
    provider: str | None = None,
    model: str | None = None,
) -> dict[str, int | str]:
    query = select(SearchTermToken)
    if shop_id is not None:
        query = query.where(SearchTermToken.shop_id == shop_id)
    tokens = db.scalars(query).all()

    existing = db.scalars(select(SemanticTag)).all()
    existing_map = {tag.token_id: tag for tag in existing}

    provider_name, resolved_model, base_url = _resolve_provider(db, provider, model)
    provider_config = None
    if provider_name:
        provider_config = db.scalar(select(ProviderConfig).where(ProviderConfig.provider == provider_name))
    api_key = _decode_key(provider_config.api_key_encrypted if provider_config else None)

    unique_tokens = sorted({token.token_normalized for token in tokens})
    tag_map: dict[str, dict[str, Any]] = {}

    if use_ai and provider_name and api_key and resolved_model and base_url:
        defaults = _provider_defaults().get(provider_name, {})
        mode = defaults.get("mode")
        for start in range(0, len(unique_tokens), 20):
            batch = unique_tokens[start : start + 20]
            try:
                if mode == "openai":
                    results = _call_openai_compatible(base_url, api_key, resolved_model, batch)
                elif mode == "anthropic":
                    results = _call_anthropic(base_url, api_key, resolved_model, batch)
                elif mode == "gemini":
                    results = _call_gemini(base_url, api_key, resolved_model, batch)
                else:
                    results = []
                for item in results:
                    tag_map[item.get("token", "").lower()] = item
            except Exception:
                for token in batch:
                    tag_map[token] = _heuristic_tag(token)
    else:
        for token in unique_tokens:
            tag_map[token] = _heuristic_tag(token)

    tagged = 0
    for token in tokens:
        data = tag_map.get(token.token_normalized, _heuristic_tag(token.token_normalized))
        tag = existing_map.get(token.id) or SemanticTag(token_id=token.id)
        tag.tag_l1 = str(data.get("tag_l1", "untagged"))
        tag.tag_l2 = str(data.get("tag_l2", "")) or None
        tag.tag_l3 = str(data.get("tag_l3", "")) or None
        tag.reason = str(data.get("reason", "")) or None
        tag.confidence = float(data.get("confidence", 0) or 0)
        tag.provider = provider_name if use_ai and api_key else "heuristic"
        tag.model = resolved_model if use_ai and api_key else "heuristic"
        db.add(tag)
        tagged += 1

    db.commit()
    return {
        "tagged_tokens": tagged,
        "provider": provider_name or "heuristic",
        "model": resolved_model or "heuristic",
    }

