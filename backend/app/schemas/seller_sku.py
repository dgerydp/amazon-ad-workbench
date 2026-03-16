from pydantic import BaseModel

from app.schemas.common import TimestampedResponse


class SellerSKUCreate(BaseModel):
    shop_id: int
    seller_sku: str
    asin: str | None = None
    title: str | None = None
    status: str = "active"
    cost: float | None = None
    inventory_qty: int | None = None
    source: str = "manual"


class SellerSKUResponse(TimestampedResponse):
    shop_id: int
    seller_sku: str
    asin: str | None = None
    title: str | None = None
    status: str
    cost: float | None = None
    inventory_qty: int | None = None
    source: str

