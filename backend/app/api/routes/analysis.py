from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.analysis_job import AnalysisJob
from app.schemas.report_batch import AnalysisRunRequest
from app.services.analysis import run_full_analysis


router = APIRouter()


@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db)) -> list[dict]:
    jobs = db.scalars(select(AnalysisJob).order_by(AnalysisJob.id.desc())).all()
    return [
        {
            "id": job.id,
            "status": job.status,
            "scope": job.scope,
            "payload": job.payload,
            "result": job.result,
            "error_message": job.error_message,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
        for job in jobs
    ]


@router.post("/run")
def run_analysis(payload: AnalysisRunRequest, db: Session = Depends(get_db)) -> dict:
    job = run_full_analysis(
        db,
        shop_id=payload.shop_id,
        batch_id=payload.batch_id,
        use_ai=payload.use_ai,
        provider=payload.provider,
        model=payload.model,
    )
    return {
        "job_id": job.id,
        "status": job.status,
        "result": job.result,
        "error_message": job.error_message,
    }
