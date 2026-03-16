from pydantic import BaseModel

from app.schemas.common import TimestampedResponse


class ShopCreate(BaseModel):
    name: str
    marketplace: str
    currency: str = "USD"
    source: str = "manual"
    external_shop_id: str | None = None


class ShopResponse(TimestampedResponse):
    name: str
    marketplace: str
    currency: str
    source: str
    external_shop_id: str | None = None

