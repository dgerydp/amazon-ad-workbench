from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopResponse


router = APIRouter()


@router.get("", response_model=list[ShopResponse])
def list_shops(db: Session = Depends(get_db)) -> list[Shop]:
    return list(db.scalars(select(Shop).order_by(Shop.id.desc())).all())


@router.post("", response_model=ShopResponse)
def create_shop(payload: ShopCreate, db: Session = Depends(get_db)) -> Shop:
    shop = Shop(**payload.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop

