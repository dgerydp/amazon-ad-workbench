from __future__ import annotations

import base64

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.provider_config import ProviderConfig


DEFAULT_PROVIDERS = [
    {
        "provider": "openai",
        "label": "OpenAI",
        "mode": "native",
        "default_base_url": "https://api.openai.com/v1",
        "recommended_models": ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
    },
    {
        "provider": "claude",
        "label": "Claude",
        "mode": "native",
        "default_base_url": "https://api.anthropic.com/v1",
        "recommended_models": ["claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest"],
    },
    {
        "provider": "gemini",
        "label": "Gemini",
        "mode": "native",
        "default_base_url": "https://generativelanguage.googleapis.com/v1beta",
        "recommended_models": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
    },
    {
        "provider": "deepseek",
        "label": "DeepSeek",
        "mode": "openai_compatible",
        "default_base_url": "https://api.deepseek.com/v1",
        "recommended_models": ["deepseek-chat", "deepseek-reasoner"],
    },
    {
        "provider": "qwen",
        "label": "Qwen",
        "mode": "openai_compatible",
        "default_base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "recommended_models": ["qwen-plus", "qwen-turbo", "qwen-max"],
    },
    {
        "provider": "doubao",
        "label": "Doubao",
        "mode": "openai_compatible",
        "default_base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "recommended_models": ["doubao-seed-1-6-thinking", "doubao-seed-1-6-flash"],
    },
]


def get_provider_defaults_map() -> dict[str, dict]:
    return {item["provider"]: item for item in DEFAULT_PROVIDERS}


def encrypt_api_key(api_key: str | None) -> str | None:
    if not api_key:
        return None
    return base64.b64encode(api_key.encode("utf-8")).decode("utf-8")


def upsert_provider_config(
    db: Session,
    provider: str,
    base_url: str | None,
    model: str | None,
    api_key: str | None,
    enabled: bool,
) -> ProviderConfig:
    config = db.scalar(select(ProviderConfig).where(ProviderConfig.provider == provider))
    if config is None:
        config = ProviderConfig(provider=provider)
    defaults = get_provider_defaults_map().get(provider, {})
    config.base_url = base_url or defaults.get("default_base_url")
    config.model = model
    if api_key:
        config.api_key_encrypted = encrypt_api_key(api_key)
    config.enabled = enabled
    db.add(config)

    if enabled:
        other_configs = db.scalars(select(ProviderConfig).where(ProviderConfig.provider != provider, ProviderConfig.enabled.is_(True))).all()
        for item in other_configs:
            item.enabled = False
            db.add(item)

    db.commit()
    db.refresh(config)
    return config


def test_provider(provider: str, api_key: str | None, model: str | None, base_url: str | None) -> dict:
    defaults = get_provider_defaults_map().get(provider, {})
    return {
        "provider": provider,
        "ok": bool(api_key),
        "mode": defaults.get("mode"),
        "model": model,
        "base_url": base_url or defaults.get("default_base_url"),
        "message": "Config looks usable." if api_key else "API key missing.",
    }
