from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.provider_config import ProviderConfig
from app.schemas.provider import ProviderConfigCreate, ProviderTestRequest
from app.services.provider_service import DEFAULT_PROVIDERS, test_provider, upsert_provider_config


router = APIRouter()


@router.get("")
def list_providers(db: Session = Depends(get_db)) -> dict:
    configs = list(db.scalars(select(ProviderConfig).order_by(ProviderConfig.provider.asc())).all())
    return {
        "defaults": DEFAULT_PROVIDERS,
        "configs": [
            {
                "id": config.id,
                "provider": config.provider,
                "base_url": config.base_url,
                "model": config.model,
                "enabled": config.enabled,
                "has_api_key": bool(config.api_key_encrypted),
            }
            for config in configs
        ],
    }


@router.post("/test")
def provider_test(payload: ProviderTestRequest) -> dict:
    return test_provider(payload.provider, payload.api_key, payload.model, payload.base_url)


@router.post("/configs")
def save_provider_config(payload: ProviderConfigCreate, db: Session = Depends(get_db)) -> dict:
    config = upsert_provider_config(
        db=db,
        provider=payload.provider,
        base_url=payload.base_url,
        model=payload.model,
        api_key=payload.api_key,
        enabled=payload.enabled,
    )
    return {"id": config.id, "provider": config.provider, "enabled": config.enabled}
