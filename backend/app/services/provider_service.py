from __future__ import annotations

import base64
from typing import Any

import httpx

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.provider_config import ProviderConfig


PROVIDER_METADATA: dict[str, dict[str, Any]] = {
    "openai": {
        "label": "OpenAI",
        "mode": "native",
        "base_url": "https://api.openai.com/v1",
        "preset_models": ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini"],
    },
    "claude": {
        "label": "Claude",
        "mode": "native",
        "base_url": "https://api.anthropic.com/v1",
        "preset_models": ["claude-sonnet-4-5", "claude-sonnet-4", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"],
    },
    "gemini": {
        "label": "Gemini",
        "mode": "native",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "preset_models": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    },
    "deepseek": {
        "label": "DeepSeek",
        "mode": "openai_compatible",
        "base_url": "https://api.deepseek.com/v1",
        "preset_models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "qwen": {
        "label": "Qwen",
        "mode": "openai_compatible",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "preset_models": ["qwen-plus", "qwen-max", "qwen-turbo", "qwen3-coder-plus"],
    },
    "doubao": {
        "label": "Doubao",
        "mode": "openai_compatible",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "preset_models": ["doubao-seed-1-6", "doubao-seed-1-6-thinking", "doubao-lite"],
    },
}

DEFAULT_PROVIDERS = [
    {"provider": provider, "label": metadata["label"], "mode": metadata["mode"]}
    for provider, metadata in PROVIDER_METADATA.items()
]


def encrypt_api_key(api_key: str | None) -> str | None:
    if not api_key:
        return None
    return base64.b64encode(api_key.encode("utf-8")).decode("utf-8")


def decode_api_key(api_key_encrypted: str | None) -> str | None:
    if not api_key_encrypted:
        return None
    try:
        return base64.b64decode(api_key_encrypted.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def get_provider_defaults(provider: str) -> dict[str, Any]:
    return PROVIDER_METADATA.get(provider, {"label": provider, "mode": "native", "preset_models": []})


def get_provider_config(db: Session, provider: str) -> ProviderConfig | None:
    return db.scalar(select(ProviderConfig).where(ProviderConfig.provider == provider))


def upsert_provider_config(
    db: Session,
    provider: str,
    base_url: str | None,
    model: str | None,
    api_key: str | None,
    enabled: bool,
) -> ProviderConfig:
    config = get_provider_config(db, provider)
    if config is None:
        config = ProviderConfig(provider=provider)
    config.base_url = base_url
    config.model = model
    config.api_key_encrypted = encrypt_api_key(api_key)
    config.enabled = enabled
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def test_provider(provider: str, api_key: str | None, model: str | None, base_url: str | None) -> dict:
    return {
        "provider": provider,
        "ok": bool(api_key),
        "mode": get_provider_defaults(provider).get("mode"),
        "model": model,
        "base_url": base_url,
        "message": "Config looks usable." if api_key else "API key missing.",
    }


def _normalize_models(models: list[str]) -> list[str]:
    cleaned = []
    for model in models:
        value = str(model).strip()
        if not value:
            continue
        if value.startswith("models/"):
            value = value.split("/", 1)[1]
        cleaned.append(value)
    return sorted(set(cleaned), key=str.lower)


def _fetch_openai_compatible_models(base_url: str, api_key: str) -> list[str]:
    response = httpx.get(
        f"{base_url.rstrip('/')}/models",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=20,
    )
    response.raise_for_status()
    data = response.json().get("data") or []
    return _normalize_models([item.get("id") for item in data if item.get("id")])


def _fetch_anthropic_models(base_url: str, api_key: str) -> list[str]:
    response = httpx.get(
        f"{base_url.rstrip('/')}/models",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        timeout=20,
    )
    response.raise_for_status()
    data = response.json().get("data") or []
    return _normalize_models([item.get("id") for item in data if item.get("id")])


def _fetch_gemini_models(base_url: str, api_key: str) -> list[str]:
    response = httpx.get(
        f"{base_url.rstrip('/')}/models?key={api_key}",
        timeout=20,
    )
    response.raise_for_status()
    data = response.json().get("models") or []
    return _normalize_models([item.get("name") for item in data if item.get("name")])


def list_provider_models(db: Session, provider: str) -> dict[str, Any]:
    defaults = get_provider_defaults(provider)
    config = get_provider_config(db, provider)
    base_url = (config.base_url if config and config.base_url else defaults.get("base_url")) or ""
    selected_model = config.model if config else None
    preset_models = _normalize_models(defaults.get("preset_models", []))
    api_key = decode_api_key(config.api_key_encrypted if config else None)

    if api_key and base_url:
        try:
            mode = defaults.get("mode")
            if provider == "gemini":
                live_models = _fetch_gemini_models(base_url, api_key)
            elif provider == "claude":
                live_models = _fetch_anthropic_models(base_url, api_key)
            elif mode in {"native", "openai_compatible"}:
                live_models = _fetch_openai_compatible_models(base_url, api_key)
            else:
                live_models = []
            if live_models:
                merged = _normalize_models(live_models + preset_models + ([selected_model] if selected_model else []))
                return {
                    "provider": provider,
                    "source": "live",
                    "models": merged,
                    "selected_model": selected_model,
                    "message": "Fetched latest models from provider.",
                }
        except Exception as exc:
            fallback = _normalize_models(preset_models + ([selected_model] if selected_model else []))
            return {
                "provider": provider,
                "source": "preset",
                "models": fallback,
                "selected_model": selected_model,
                "message": f"Live model refresh failed, fallback presets used: {exc}",
            }

    fallback = _normalize_models(preset_models + ([selected_model] if selected_model else []))
    return {
        "provider": provider,
        "source": "preset",
        "models": fallback,
        "selected_model": selected_model,
        "message": "Saved API key not found. Showing built-in model presets.",
    }
