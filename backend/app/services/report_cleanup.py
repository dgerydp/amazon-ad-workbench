from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.advertised_product import AdvertisedProduct
from app.models.analysis_job import AnalysisJob
from app.models.performance_rule import PerformanceRuleHit
from app.models.report_batch import ReportBatch
from app.models.rule import RuleHit
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag


def clear_derived_analysis_data(db: Session) -> None:
    db.execute(delete(SemanticTag))
    db.execute(delete(PerformanceRuleHit))
    db.execute(delete(RuleHit))
    db.execute(delete(SearchTermToken))
    db.execute(delete(SearchTermLink))
    db.execute(delete(AnalysisJob))


def delete_batch_and_related_data(db: Session, batch_id: int) -> bool:
    batch = db.get(ReportBatch, batch_id)
    if not batch:
        return False

    clear_derived_analysis_data(db)

    if batch.report_type == "search_term":
        db.execute(delete(SearchTermReport).where(SearchTermReport.batch_id == batch_id))
    elif batch.report_type == "advertised_product":
        db.execute(delete(AdvertisedProduct).where(AdvertisedProduct.batch_id == batch_id))

    db.delete(batch)
    db.commit()
    return True


def clear_all_batches_and_reports(db: Session) -> dict[str, int]:
    batches = db.scalars(select(ReportBatch.id)).all()
    search_rows = db.scalars(select(SearchTermReport.id)).all()
    product_rows = db.scalars(select(AdvertisedProduct.id)).all()

    clear_derived_analysis_data(db)
    db.execute(delete(SearchTermReport))
    db.execute(delete(AdvertisedProduct))
    db.execute(delete(ReportBatch))
    db.commit()

    return {
        "deleted_batches": len(batches),
        "deleted_search_term_rows": len(search_rows),
        "deleted_advertised_product_rows": len(product_rows),
    }
