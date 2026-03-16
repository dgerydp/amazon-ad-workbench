from __future__ import annotations

import re
from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.advertised_product import AdvertisedProduct
from app.models.analysis_job import AnalysisJob
from app.models.rule import RuleHit, RuleItem, RuleSet
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.rules.builtin import BUILTIN_RULESET_NAME, BUILTIN_RULES
from app.rules.evaluator import evaluate_rule
from app.services.llm_tagging import tag_tokens


STOP_WORDS = {"a", "an", "and", "the", "of", "for", "with", "to", "in", "on", "by"}


def ensure_builtin_rules(db: Session) -> RuleSet:
    ruleset = db.scalar(select(RuleSet).where(RuleSet.name == BUILTIN_RULESET_NAME))
    if ruleset:
        return ruleset

    ruleset = RuleSet(name=BUILTIN_RULESET_NAME, is_builtin=True, is_active=True)
    db.add(ruleset)
    db.flush()
    for rule in BUILTIN_RULES:
        db.add(RuleItem(rule_set_id=ruleset.id, **rule))
    db.commit()
    db.refresh(ruleset)
    return ruleset


def _acos(spend: float, sales: float) -> float:
    if not sales:
        return 999 if spend else 0
    return round(spend / sales, 4)


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

    if reports:
        db.execute(delete(SearchTermLink).where(SearchTermLink.search_term_report_id.in_([report.id for report in reports])))

    linked = 0
    ambiguous = 0
    unlinked = 0

    for report in reports:
        candidates = sku_map.get((report.shop_id, report.campaign_name, report.ad_group_name, report.date), [])
        if len(candidates) == 1:
            candidate = candidates[0]
            db.add(
                SearchTermLink(
                    search_term_report_id=report.id,
                    seller_sku=candidate.seller_sku,
                    asin=candidate.asin,
                    link_method="unique_ad_group_match",
                    confidence=1,
                )
            )
            linked += 1
        elif len(candidates) > 1:
            db.add(
                SearchTermLink(
                    search_term_report_id=report.id,
                    seller_sku=None,
                    asin=None,
                    link_method="ambiguous_ad_group_match",
                    confidence=0,
                )
            )
            ambiguous += 1
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
    return {"linked": linked, "ambiguous": ambiguous, "unlinked": unlinked}


def build_tokens(db: Session, shop_id: int | None = None) -> dict[str, int]:
    query = select(SearchTermReport)
    if shop_id is not None:
        query = query.where(SearchTermReport.shop_id == shop_id)
    reports = db.scalars(query).all()

    if reports:
        db.execute(delete(SearchTermToken).where(SearchTermToken.search_term_report_id.in_([report.id for report in reports])))

    link_query = select(SearchTermLink)
    if reports:
        link_query = link_query.where(SearchTermLink.search_term_report_id.in_([report.id for report in reports]))
    links = db.scalars(link_query).all()
    link_map = {link.search_term_report_id: link for link in links}

    created = 0
    for report in reports:
        link = link_map.get(report.id)
        for token in tokenize(report.search_term):
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


def run_rules(db: Session, shop_id: int | None = None) -> dict[str, int]:
    ruleset = ensure_builtin_rules(db)
    rules = db.scalars(
        select(RuleItem).where(RuleItem.rule_set_id == ruleset.id).order_by(RuleItem.priority.asc(), RuleItem.id.asc())
    ).all()
    query = select(SearchTermToken)
    if shop_id is not None:
        query = query.where(SearchTermToken.shop_id == shop_id)
    tokens = db.scalars(query).all()

    if tokens:
        db.execute(
            delete(RuleHit).where(
                RuleHit.target_type == "search_term_token",
                RuleHit.target_id.in_([token.id for token in tokens]),
            )
        )

    hit_count = 0
    for token in tokens:
        record = {
            "clicks": token.clicks,
            "orders": token.orders,
            "spend": token.spend,
            "sales": token.sales,
            "acos": _acos(token.spend, token.sales),
        }
        for rule in rules:
            if evaluate_rule(record, rule.conditions_json):
                token.action_label = rule.action_type
                db.add(
                    RuleHit(
                        target_type="search_term_token",
                        target_id=token.id,
                        rule_item_id=rule.id,
                        hit_payload=record,
                    )
                )
                hit_count += 1
                break
        else:
            token.action_label = "none"

    db.commit()
    return {"rule_hits": hit_count}


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
        rule_result = run_rules(db, shop_id=shop_id)
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
