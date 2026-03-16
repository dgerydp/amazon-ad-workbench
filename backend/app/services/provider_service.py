from __future__ import annotations

import base64

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.provider_config import ProviderConfig


DEFAULT_PROVIDERS = [
    {"provider": "openai", "mode": "native"},
    {"provider": "claude", "mode": "native"},
    {"provider": "gemini", "mode": "native"},
    {"provider": "deepseek", "mode": "openai_compatible"},
    {"provider": "qwen", "mode": "openai_compatible"},
    {"provider": "doubao", "mode": "openai_compatible"},
]


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
        "mode": "openai_compatible" if provider in {"deepseek", "qwen", "doubao"} else "native",
        "model": model,
        "base_url": base_url,
        "message": "Config looks usable." if api_key else "API key missing.",
    }

