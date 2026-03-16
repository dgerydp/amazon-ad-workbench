from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.connectors.lingxing.client import LingxingClient
from app.models.seller_sku import SellerSKU
from app.models.shop import Shop


def _is_success(payload: dict) -> bool:
    return str(payload.get("code")) in {"0", "200"}


async def sync_lingxing_shops(
    db: Session,
    app_id: str | None = None,
    app_secret: str | None = None,
    base_url: str | None = None,
) -> dict:
    client = LingxingClient(app_id=app_id, app_secret=app_secret, base_url=base_url)
    payload = await client.list_shops()
    if not _is_success(payload):
        return {"ok": False, "message": payload.get("message") or payload.get("msg") or "Lingxing shop sync failed."}

    synced = 0
    for item in payload.get("data") or []:
        external_id = str(item.get("sid"))
        shop = db.scalar(select(Shop).where(Shop.source == "lingxing", Shop.external_shop_id == external_id))
        if shop is None:
            shop = Shop(source="lingxing", external_shop_id=external_id, name=item.get("name") or f"Lingxing {external_id}", marketplace=item.get("country") or item.get("region") or "UNKNOWN", currency="USD")
        else:
            shop.name = item.get("name") or shop.name
            shop.marketplace = item.get("country") or item.get("region") or shop.marketplace
        db.add(shop)
        synced += 1
    db.commit()
    return {"ok": True, "synced_shops": synced}


async def sync_lingxing_seller_skus(
    db: Session,
    shop_id: int | None = None,
    app_id: str | None = None,
    app_secret: str | None = None,
    base_url: str | None = None,
) -> dict:
    client = LingxingClient(app_id=app_id, app_secret=app_secret, base_url=base_url)
    query = select(Shop).where(Shop.source == "lingxing")
    if shop_id is not None:
        query = query.where(Shop.id == shop_id)
    shops = db.scalars(query).all()

    synced = 0
    for shop in shops:
        if not shop.external_shop_id:
            continue
        payload = await client.list_listings(int(shop.external_shop_id))
        if not _is_success(payload):
            continue
        for item in payload.get("data") or []:
            seller_sku = str(item.get("seller_sku") or "").strip()
            if not seller_sku:
                continue
            row = db.scalar(select(SellerSKU).where(SellerSKU.shop_id == shop.id, SellerSKU.seller_sku == seller_sku))
            if row is None:
                row = SellerSKU(shop_id=shop.id, seller_sku=seller_sku, source="lingxing")
            row.asin = item.get("asin") or row.asin
            row.title = item.get("product_name") or item.get("title") or row.title
            row.status = "active"
            db.add(row)
            synced += 1
    db.commit()
    return {"ok": True, "synced_seller_skus": synced}

