from pydantic import BaseModel

from app.schemas.common import TimestampedResponse


class ReportBatchResponse(TimestampedResponse):
    shop_id: int | None
    report_type: str
    filename: str
    status: str
    date_range_start: str | None = None
    date_range_end: str | None = None
    row_count: int
    error_message: str | None = None


class AnalysisRunRequest(BaseModel):
    shop_id: int | None = None
    batch_id: int | None = None
    use_ai: bool = False
    provider: str | None = None
    model: str | None = None

