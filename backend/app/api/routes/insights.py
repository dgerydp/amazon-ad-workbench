from sqlalchemy import func, select
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.advertised_product import AdvertisedProduct
from app.models.rule import RuleHit, RuleItem
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag


router = APIRouter()


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    search_term_count = db.scalar(select(func.count()).select_from(SearchTermReport)) or 0
    advertised_count = db.scalar(select(func.count()).select_from(AdvertisedProduct)) or 0
    token_count = db.scalar(select(func.count()).select_from(SearchTermToken)) or 0
    hit_count = db.scalar(select(func.count()).select_from(RuleHit)) or 0
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
    return [dict(row._mapping) for row in rows]


@router.get("/tokens")
def tokens(db: Session = Depends(get_db), limit: int = 200) -> list[dict]:
    rows = db.execute(
        select(
            SearchTermToken.id,
            SearchTermToken.seller_sku,
            SearchTermToken.token,
            SearchTermToken.clicks,
            SearchTermToken.orders,
            SearchTermToken.spend,
            SearchTermToken.sales,
            SearchTermToken.action_label,
            SemanticTag.tag_l1,
            SemanticTag.tag_l2,
            SemanticTag.tag_l3,
            SemanticTag.reason,
            SemanticTag.provider,
        )
        .outerjoin(SemanticTag, SemanticTag.token_id == SearchTermToken.id)
        .order_by(SearchTermToken.id.desc())
        .limit(limit)
    ).all()
    return [dict(row._mapping) for row in rows]


@router.get("/seller-skus")
def seller_sku_summary(db: Session = Depends(get_db), limit: int = 100) -> list[dict]:
    rows = db.execute(
        select(
            SearchTermToken.seller_sku,
            func.count(SearchTermToken.id).label("token_count"),
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
def rule_hits(db: Session = Depends(get_db), limit: int = 100) -> list[dict]:
    rows = db.execute(
        select(
            RuleHit.id,
            RuleHit.target_type,
            RuleHit.target_id,
            RuleItem.name.label("rule_name"),
            RuleItem.action_type,
            RuleItem.action_advice,
        )
        .join(RuleItem, RuleItem.id == RuleHit.rule_item_id)
        .order_by(RuleHit.id.desc())
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
