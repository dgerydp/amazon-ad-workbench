from __future__ import annotations

from io import BytesIO, StringIO

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.search_term_token import SearchTermToken
from app.models.search_term_report import SearchTermReport
from app.models.semantic_tag import SemanticTag


router = APIRouter()


def _csv_response(filename: str, frame: pd.DataFrame) -> StreamingResponse:
    buffer = StringIO()
    frame.to_csv(buffer, index=False)
    buffer.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv", headers=headers)


def _xlsx_response(filename: str, sheets: dict[str, pd.DataFrame]) -> StreamingResponse:
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        for name, frame in sheets.items():
            frame.to_excel(writer, index=False, sheet_name=name[:31] or "Sheet1")
    buffer.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(iter([buffer.getvalue()]), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)


@router.get("/high-performance")
def export_high_performance(db: Session = Depends(get_db)) -> StreamingResponse:
    rows = db.execute(
        select(
            SearchTermToken.seller_sku,
            SearchTermToken.token,
            SearchTermToken.clicks,
            SearchTermToken.orders,
            SearchTermToken.spend,
            SearchTermToken.sales,
            SearchTermToken.action_label,
            SemanticTag.tag_l1,
            SemanticTag.tag_l2,
            SemanticTag.reason,
        )
        .outerjoin(SemanticTag, SemanticTag.token_id == SearchTermToken.id)
        .where(SearchTermToken.action_label == "promote")
    ).all()
    return _csv_response("high-performance-terms.csv", pd.DataFrame([dict(row._mapping) for row in rows]))


@router.get("/negative-keywords")
def export_negative_keywords(db: Session = Depends(get_db)) -> StreamingResponse:
    rows = db.execute(
        select(
            SearchTermToken.seller_sku,
            SearchTermToken.token,
            SearchTermToken.clicks,
            SearchTermToken.orders,
            SearchTermToken.spend,
            SearchTermToken.action_label,
            SemanticTag.tag_l1,
            SemanticTag.reason,
        )
        .outerjoin(SemanticTag, SemanticTag.token_id == SearchTermToken.id)
        .where(SearchTermToken.action_label == "negative_exact")
    ).all()
    return _csv_response("negative-keyword-suggestions.csv", pd.DataFrame([dict(row._mapping) for row in rows]))


@router.get("/seller-sku-summary")
def export_seller_sku_summary(db: Session = Depends(get_db)) -> StreamingResponse:
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
    ).all()
    return _csv_response("seller-sku-summary.csv", pd.DataFrame([dict(row._mapping) for row in rows]))


@router.get("/full-analysis.xlsx")
def export_full_analysis_xlsx(db: Session = Depends(get_db)) -> StreamingResponse:
    search_terms = pd.DataFrame(
        [
            dict(row._mapping)
            for row in db.execute(
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
                ).order_by(SearchTermReport.id.desc())
            ).all()
        ]
    )
    tokens = pd.DataFrame(
        [
            dict(row._mapping)
            for row in db.execute(
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
            ).all()
        ]
    )
    tag_summary = pd.DataFrame(
        [
            dict(row._mapping)
            for row in db.execute(
                select(
                    SemanticTag.tag_l1,
                    func.count(SemanticTag.id).label("count"),
                )
                .group_by(SemanticTag.tag_l1)
                .order_by(func.count(SemanticTag.id).desc())
            ).all()
        ]
    )
    seller_skus = pd.DataFrame(
        [
            dict(row._mapping)
            for row in db.execute(
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
            ).all()
        ]
    )
    return _xlsx_response(
        "full-analysis.xlsx",
        {
            "search_terms": search_terms,
            "tokens": tokens,
            "tag_summary": tag_summary,
            "seller_skus": seller_skus,
        },
    )
