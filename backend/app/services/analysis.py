from __future__ import annotations

import re
from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.advertised_product import AdvertisedProduct
from app.models.analysis_job import AnalysisJob
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.services.llm_tagging import tag_tokens
from app.services.rule_engine import run_performance_rules


STOP_WORDS = {"a", "an", "and", "the", "of", "for", "with", "to", "in", "on", "by"}
SQLITE_CHUNK_SIZE = 800


def _iter_chunks(ids: list[int], chunk_size: int = SQLITE_CHUNK_SIZE) -> list[list[int]]:
    chunks: list[list[int]] = []
    for start in range(0, len(ids), chunk_size):
        chunks.append(ids[start : start + chunk_size])
    return chunks


def _delete_in_chunks(db: Session, model, column, ids: list[int]) -> None:
    if not ids:
        return
    for chunk in _iter_chunks(ids):
        db.execute(delete(model).where(column.in_(chunk)))


def tokenize(search_term: str) -> list[str]:
    lowered = (search_term or "").lower().strip()
    cleaned = re.sub(r"[^a-z0-9\\s]", " ", lowered)
    return [part for part in cleaned.split() if len(part) > 1 and part not in STOP_WORDS]


def build_seller_sku_map(
    db: Session, shop_id: int | None = None
) -> dict[tuple[int | None, str, str | None, str], list[AdvertisedProduct]]:
    query = select(AdvertisedProduct)
    if shop_id is not None:
        query = query.where(AdvertisedProduct.shop_id == shop_id)
    products = db.scalars(query).all()
    grouped: dict[tuple[int | None, str, str | None, str], list[AdvertisedProduct]] = defaultdict(list)
    for product in products:
        key = (product.shop_id, product.campaign_name, product.ad_group_name, product.date)
        grouped[key].append(product)
    return grouped


def link_search_terms(db: Session, shop_id: int | None = None) -> dict[str, int]:
    query = select(SearchTermReport)
    if shop_id is not None:
        query = query.where(SearchTermReport.shop_id == shop_id)
    reports = db.scalars(query).all()
    sku_map = build_seller_sku_map(db, shop_id)

    report_ids = [report.id for report in reports]
    if report_ids:
        _delete_in_chunks(db, SearchTermLink, SearchTermLink.search_term_report_id, report_ids)

    linked_rows = 0
    expanded_reports = 0
    unlinked = 0

    for report in reports:
        candidates = sku_map.get((report.shop_id, report.campaign_name, report.ad_group_name, report.date), [])
        if candidates:
            if len(candidates) > 1:
                expanded_reports += 1
            for candidate in candidates:
                db.add(
                    SearchTermLink(
                        search_term_report_id=report.id,
                        seller_sku=candidate.seller_sku,
                        asin=candidate.asin,
                        link_method="ad_group_product_expand" if len(candidates) > 1 else "unique_ad_group_match",
                        confidence=1 if len(candidates) == 1 else 0.8,
                    )
                )
                linked_rows += 1
        else:
            db.add(
                SearchTermLink(
                    search_term_report_id=report.id,
                    seller_sku=None,
                    asin=None,
                    link_method="unlinked",
                    confidence=0,
                )
            )
            unlinked += 1

    db.commit()
    return {"linked_rows": linked_rows, "expanded_reports": expanded_reports, "unlinked": unlinked}


def build_tokens(db: Session, shop_id: int | None = None) -> dict[str, int]:
    query = select(SearchTermReport)
    if shop_id is not None:
        query = query.where(SearchTermReport.shop_id == shop_id)
    reports = db.scalars(query).all()

    report_ids = [report.id for report in reports]
    if report_ids:
        _delete_in_chunks(db, SearchTermToken, SearchTermToken.search_term_report_id, report_ids)

    links: list[SearchTermLink] = []
    if report_ids:
        for chunk in _iter_chunks(report_ids):
            links.extend(
                db.scalars(select(SearchTermLink).where(SearchTermLink.search_term_report_id.in_(chunk))).all()
            )
    link_map: dict[int, list[SearchTermLink]] = defaultdict(list)
    for link in links:
        link_map[link.search_term_report_id].append(link)

    created = 0
    for report in reports:
        report_links = link_map.get(report.id) or [None]
        tokens = tokenize(report.search_term)
        for token in tokens:
            for link in report_links:
                db.add(
                    SearchTermToken(
                        search_term_report_id=report.id,
                        shop_id=report.shop_id,
                        seller_sku=link.seller_sku if link else None,
                        token=token,
                        token_normalized=token,
                        impressions=report.impressions,
                        clicks=report.clicks,
                        spend=report.spend,
                        sales=report.sales,
                        orders=report.orders,
                    )
                )
                created += 1
    db.commit()
    return {"tokens_created": created}


def run_full_analysis(
    db: Session,
    shop_id: int | None = None,
    batch_id: int | None = None,
    use_ai: bool = False,
    provider: str | None = None,
    model: str | None = None,
) -> AnalysisJob:
    job = AnalysisJob(
        status="running",
        scope="shop" if shop_id else "all",
        payload={"shop_id": shop_id, "batch_id": batch_id, "use_ai": use_ai, "provider": provider, "model": model},
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        link_result = link_search_terms(db, shop_id=shop_id)
        token_result = build_tokens(db, shop_id=shop_id)
        tag_result = tag_tokens(db, shop_id=shop_id, use_ai=use_ai, provider=provider, model=model)
        rule_result = run_performance_rules(db, shop_id=shop_id)
        job.status = "completed"
        job.result = {
            "linking": link_result,
            "tokenization": token_result,
            "tagging": tag_result,
            "rules": rule_result,
        }
    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)[:500]
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
