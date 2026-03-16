from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.seller_sku import SellerSKU
from app.schemas.seller_sku import SellerSKUCreate, SellerSKUResponse


router = APIRouter()


@router.get("", response_model=list[SellerSKUResponse])
def list_seller_skus(db: Session = Depends(get_db), shop_id: int | None = None) -> list[SellerSKU]:
    query = select(SellerSKU).order_by(SellerSKU.id.desc())
    if shop_id is not None:
        query = query.where(SellerSKU.shop_id == shop_id)
    return list(db.scalars(query).all())


@router.post("", response_model=SellerSKUResponse)
def create_seller_sku(payload: SellerSKUCreate, db: Session = Depends(get_db)) -> SellerSKU:
    item = SellerSKU(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

