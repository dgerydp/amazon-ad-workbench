from __future__ import annotations

from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advertised_product import AdvertisedProduct
from app.models.report_batch import ReportBatch
from app.models.search_term_report import SearchTermReport
from app.services.report_parser import load_dataframe, normalize_columns, normalize_date_value, parse_int, parse_number


def persist_batch_rows(
    db: Session,
    batch: ReportBatch,
    report_type: str,
    filename: str,
    content: bytes,
) -> ReportBatch:
    df = normalize_columns(load_dataframe(filename, content), report_type)
    required_columns = {
        "search_term": {"date", "campaign_name", "ad_group_name", "search_term"},
        "advertised_product": {"date", "campaign_name", "ad_group_name", "seller_sku"},
    }[report_type]
    missing = sorted(required_columns - set(df.columns))
    if missing:
        found = sorted(df.columns.tolist())
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}. Found columns: {', '.join(found)}",
        )

    dates: list[str] = []
    grouped_rows: dict[tuple, dict] = defaultdict(
        lambda: {
            "impressions": 0,
            "clicks": 0,
            "spend": 0.0,
            "sales": 0.0,
            "orders": 0,
            "units": 0,
        }
    )

    for _, row in df.iterrows():
        date_value = normalize_date_value(row.get("date"))
        if not date_value:
            continue
        dates.append(date_value)
        campaign_name = str(row.get("campaign_name", "")).strip()
        ad_group_name = str(row.get("ad_group_name", "")).strip() or None
        if report_type == "search_term":
            search_term = str(row.get("search_term", "")).strip()
            key = (batch.shop_id, campaign_name, ad_group_name, search_term, date_value)
            payload = grouped_rows[key]
            payload.update(
                {
                    "campaign_name": campaign_name,
                    "ad_group_name": ad_group_name,
                    "search_term": search_term,
                    "date": date_value,
                }
            )
        else:
            seller_sku = str(row.get("seller_sku", "")).strip()
            asin = str(row.get("asin", "")).strip() or None
            key = (batch.shop_id, campaign_name, ad_group_name, seller_sku, date_value)
            payload = grouped_rows[key]
            payload.update(
                {
                    "campaign_name": campaign_name,
                    "ad_group_name": ad_group_name,
                    "seller_sku": seller_sku,
                    "asin": asin,
                    "date": date_value,
                }
            )

        payload["impressions"] += parse_int(row.get("impressions"))
        payload["clicks"] += parse_int(row.get("clicks"))
        payload["spend"] += parse_number(row.get("spend"))
        payload["sales"] += parse_number(row.get("sales"))
        payload["orders"] += parse_int(row.get("orders"))
        payload["units"] += parse_int(row.get("units"))

    created = 0
    for key, payload in grouped_rows.items():
        if report_type == "search_term":
            existing = db.scalar(
                select(SearchTermReport).where(
                    SearchTermReport.shop_id == key[0],
                    SearchTermReport.campaign_name == key[1],
                    SearchTermReport.ad_group_name == key[2],
                    SearchTermReport.search_term == key[3],
                    SearchTermReport.date == key[4],
                )
            )
            row = existing or SearchTermReport(
                shop_id=batch.shop_id,
                campaign_name=payload["campaign_name"],
                ad_group_name=payload["ad_group_name"],
                search_term=payload["search_term"],
                date=payload["date"],
            )
        else:
            existing = db.scalar(
                select(AdvertisedProduct).where(
                    AdvertisedProduct.shop_id == key[0],
                    AdvertisedProduct.campaign_name == key[1],
                    AdvertisedProduct.ad_group_name == key[2],
                    AdvertisedProduct.seller_sku == key[3],
                    AdvertisedProduct.date == key[4],
                )
            )
            row = existing or AdvertisedProduct(
                shop_id=batch.shop_id,
                campaign_name=payload["campaign_name"],
                ad_group_name=payload["ad_group_name"],
                seller_sku=payload["seller_sku"],
                asin=payload.get("asin"),
                date=payload["date"],
            )
            row.asin = payload.get("asin")

        row.batch_id = batch.id
        row.impressions = payload["impressions"]
        row.clicks = payload["clicks"]
        row.spend = payload["spend"]
        row.sales = payload["sales"]
        row.orders = payload["orders"]
        row.units = payload["units"]
        db.add(row)
        created += 1

    batch.status = "completed"
    batch.row_count = created
    batch.date_range_start = min(dates) if dates else None
    batch.date_range_end = max(dates) if dates else None
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def create_batch_and_ingest(
    db: Session,
    report_type: str,
    filename: str,
    content: bytes,
    shop_id: int | None = None,
) -> ReportBatch:
    batch = ReportBatch(shop_id=shop_id, report_type=report_type, filename=filename, status="processing")
    db.add(batch)
    db.commit()
    db.refresh(batch)
    try:
        return persist_batch_rows(db, batch, report_type, filename, content)
    except Exception as exc:
        db.rollback()
        batch.status = "failed"
        batch.error_message = str(exc)[:500]
        db.add(batch)
        db.commit()
        raise
