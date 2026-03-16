from fastapi import APIRouter

from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.connectors.lingxing.client import LingxingClient
from app.schemas.lingxing import LingxingTestRequest
from app.services.lingxing_sync import sync_lingxing_seller_skus, sync_lingxing_shops


router = APIRouter()


@router.post("/test")
async def test_lingxing(payload: LingxingTestRequest) -> dict:
    client = LingxingClient(
        app_id=payload.app_id,
        app_secret=payload.app_secret,
        base_url=payload.base_url,
    )
    return await client.test_connection()


@router.post("/sync/shops")
async def sync_shops(payload: LingxingTestRequest, db: Session = Depends(get_db)) -> dict:
    return await sync_lingxing_shops(
        db=db,
        app_id=payload.app_id,
        app_secret=payload.app_secret,
        base_url=payload.base_url,
    )


@router.post("/sync/seller-skus")
async def sync_seller_skus(
    payload: LingxingTestRequest,
    db: Session = Depends(get_db),
    shop_id: int | None = None,
) -> dict:
    return await sync_lingxing_seller_skus(
        db=db,
        shop_id=shop_id,
        app_id=payload.app_id,
        app_secret=payload.app_secret,
        base_url=payload.base_url,
    )
