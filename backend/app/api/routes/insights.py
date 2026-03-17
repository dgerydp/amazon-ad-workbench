from collections import defaultdict

from sqlalchemy import func, select
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.advertised_product import AdvertisedProduct
from app.models.performance_rule import PerformanceRuleHit
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag
from app.services.rule_engine import ensure_default_rule_config


router = APIRouter()


def _dedupe_strings(items: list[str]) -> list[str]:
    seen: set[str] = set()
    values: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            values.append(item)
    return values


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    search_term_count = db.scalar(select(func.count()).select_from(SearchTermReport)) or 0
    advertised_count = db.scalar(select(func.count()).select_from(AdvertisedProduct)) or 0
    token_count = db.scalar(select(func.count()).select_from(SearchTermToken)) or 0
    hit_count = db.scalar(select(func.count()).select_from(PerformanceRuleHit)) or 0
    return {
        "search_term_reports": search_term_count,
        "advertised_products": advertised_count,
        "tokens": token_count,
        "rule_hits": hit_count,
    }


@router.get("/search-terms")
def search_terms(db: Session = Depends(get_db), limit: int = 100) -> list[dict]:
    rows = db.execute(
        select(
            SearchTermReport.id,
            SearchTermReport.campaign_name,
            SearchTermReport.ad_group_name,
            SearchTermReport.search_term,
            SearchTermReport.clicks,
            SearchTermReport.orders,
            SearchTermReport.spend,
            SearchTermReport.sales,
            SearchTermReport.date,
        )
        .order_by(SearchTermReport.id.desc())
        .limit(limit)
    ).all()

    report_ids = [row.id for row in rows]
    link_rows = (
        db.execute(
            select(
                SearchTermLink.search_term_report_id,
                SearchTermLink.seller_sku,
                SearchTermLink.link_method,
            )
            .where(SearchTermLink.search_term_report_id.in_(report_ids))
            .order_by(SearchTermLink.id.asc())
        ).all()
        if report_ids
        else []
    )
    token_rows = (
        db.execute(
            select(
                SearchTermToken.search_term_report_id,
                SearchTermToken.token,
                SearchTermToken.action_label,
            )
            .where(SearchTermToken.search_term_report_id.in_(report_ids))
            .order_by(SearchTermToken.id.asc())
        ).all()
        if report_ids
        else []
    )

    links_by_report: dict[int, list[dict]] = defaultdict(list)
    for item in link_rows:
        links_by_report[item.search_term_report_id].append(dict(item._mapping))

    tokens_by_report: dict[int, list[dict]] = defaultdict(list)
    for item in token_rows:
        tokens_by_report[item.search_term_report_id].append(dict(item._mapping))

    result: list[dict] = []
    for row in rows:
        links = links_by_report.get(row.id, [])
        tokens = tokens_by_report.get(row.id, [])
        seller_skus = _dedupe_strings([str(item["seller_sku"]) for item in links if item["seller_sku"]])
        split_terms = _dedupe_strings([str(item["token"]) for item in tokens if item["token"]])
        action_labels = _dedupe_strings([str(item["action_label"]) for item in tokens if item["action_label"]])
        link_methods = _dedupe_strings([str(item["link_method"]) for item in links if item["link_method"]])
        result.append(
            {
                "id": row.id,
                "campaign_name": row.campaign_name,
                "ad_group_name": row.ad_group_name,
                "search_term": row.search_term,
                "clicks": row.clicks,
                "orders": row.orders,
                "spend": row.spend,
                "sales": row.sales,
                "date": row.date,
                "seller_skus": seller_skus,
                "seller_sku_count": len(seller_skus),
                "link_methods": link_methods,
                "split_terms": split_terms,
                "token_count": len(split_terms),
                "action_labels": action_labels,
            }
        )
    return result


@router.get("/tokens")
def tokens(db: Session = Depends(get_db), limit: int = 200) -> list[dict]:
    rows = db.execute(
        select(
            SearchTermToken.id,
            SearchTermToken.search_term_report_id,
            SearchTermToken.seller_sku,
            SearchTermToken.token,
            SearchTermToken.clicks,
            SearchTermToken.orders,
            SearchTermToken.spend,
            SearchTermToken.sales,
            SearchTermToken.impressions,
            SearchTermToken.action_label,
            SearchTermReport.search_term,
            SemanticTag.tag_l1,
            SemanticTag.tag_l2,
            SemanticTag.tag_l3,
            SemanticTag.reason,
            SemanticTag.provider,
        )
        .join(SearchTermReport, SearchTermReport.id == SearchTermToken.search_term_report_id)
        .outerjoin(SemanticTag, SemanticTag.token_id == SearchTermToken.id)
        .order_by(SearchTermToken.id.desc())
        .limit(limit)
    ).all()
    token_ids = [row.id for row in rows]
    hit_rows = (
        db.execute(
            select(
                PerformanceRuleHit.search_term_token_id,
                PerformanceRuleHit.hit_type,
                PerformanceRuleHit.group_name,
                PerformanceRuleHit.label_name,
                PerformanceRuleHit.icon,
                PerformanceRuleHit.color,
                PerformanceRuleHit.action_advice,
            )
            .where(PerformanceRuleHit.search_term_token_id.in_(token_ids))
            .order_by(PerformanceRuleHit.id.asc())
        ).all()
        if token_ids
        else []
    )
    hit_map: dict[int, list[dict]] = defaultdict(list)
    for hit in hit_rows:
        hit_map[hit.search_term_token_id].append(dict(hit._mapping))

    result: list[dict] = []
    for row in rows:
        hits = hit_map.get(row.id, [])
        matched_labels = [
            {
                "group_name": hit["group_name"],
                "label_name": hit["label_name"],
                "icon": hit["icon"],
                "color": hit["color"],
            }
            for hit in hits
            if hit["hit_type"] == "group"
        ]
        decision = next((hit for hit in hits if hit["hit_type"] == "decision"), None)
        result.append(
            {
                **dict(row._mapping),
                "matched_labels": matched_labels,
                "decision_name": decision["label_name"] if decision else row.action_label,
                "decision_advice": decision["action_advice"] if decision else None,
            }
        )
    return result


@router.get("/seller-skus")
def seller_sku_summary(db: Session = Depends(get_db), limit: int = 100) -> list[dict]:
    rows = db.execute(
        select(
            SearchTermToken.seller_sku,
            func.count(SearchTermToken.id).label("token_count"),
            func.count(func.distinct(SearchTermToken.search_term_report_id)).label("search_term_count"),
            func.sum(SearchTermToken.clicks).label("clicks"),
            func.sum(SearchTermToken.orders).label("orders"),
            func.sum(SearchTermToken.spend).label("spend"),
            func.sum(SearchTermToken.sales).label("sales"),
        )
        .where(SearchTermToken.seller_sku.is_not(None))
        .group_by(SearchTermToken.seller_sku)
        .order_by(func.sum(SearchTermToken.spend).desc())
        .limit(limit)
    ).all()
    return [dict(row._mapping) for row in rows]


@router.get("/rule-hits")
def rule_hits(db: Session = Depends(get_db), limit: int = 200) -> list[dict]:
    ensure_default_rule_config(db)
    rows = db.execute(
        select(
            PerformanceRuleHit.id,
            PerformanceRuleHit.hit_type,
            PerformanceRuleHit.group_name,
            PerformanceRuleHit.label_name,
            PerformanceRuleHit.action_advice,
            PerformanceRuleHit.icon,
            PerformanceRuleHit.color,
            SearchTermToken.id.label("token_id"),
            SearchTermToken.token,
            SearchTermToken.seller_sku,
            SearchTermReport.search_term,
        )
        .join(SearchTermToken, SearchTermToken.id == PerformanceRuleHit.search_term_token_id)
        .join(SearchTermReport, SearchTermReport.id == SearchTermToken.search_term_report_id)
        .order_by(PerformanceRuleHit.id.desc())
        .limit(limit)
    ).all()
    return [dict(row._mapping) for row in rows]


@router.get("/tag-summary")
def tag_summary(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(
        select(
            SemanticTag.tag_l1,
            func.count(SemanticTag.id).label("count"),
        )
        .group_by(SemanticTag.tag_l1)
        .order_by(func.count(SemanticTag.id).desc())
    ).all()
    return [dict(row._mapping) for row in rows]
