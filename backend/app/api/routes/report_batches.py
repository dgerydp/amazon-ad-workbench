from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.report_batch import ReportBatch
from app.schemas.report_batch import ReportBatchResponse
from app.services.report_ingest import create_batch_and_ingest


router = APIRouter()


@router.get("", response_model=list[ReportBatchResponse])
def list_batches(db: Session = Depends(get_db)) -> list[ReportBatch]:
    return list(db.scalars(select(ReportBatch).order_by(ReportBatch.id.desc())).all())
@router.post("/search-terms/upload", response_model=ReportBatchResponse)
async def upload_search_terms(
    file: UploadFile = File(...),
    shop_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
) -> ReportBatch:
    content = await file.read()
    return create_batch_and_ingest(db, "search_term", file.filename, content, shop_id=shop_id)


@router.post("/advertised-products/upload", response_model=ReportBatchResponse)
async def upload_advertised_products(
    file: UploadFile = File(...),
    shop_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
) -> ReportBatch:
    content = await file.read()
    return create_batch_and_ingest(db, "advertised_product", file.filename, content, shop_id=shop_id)
