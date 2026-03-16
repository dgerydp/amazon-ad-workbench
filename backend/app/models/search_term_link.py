from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class SearchTermLink(TimestampMixin, Base):
    __tablename__ = "search_term_links"
    __table_args__ = (UniqueConstraint("search_term_report_id", "seller_sku", name="uq_search_term_link"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    search_term_report_id: Mapped[int] = mapped_column(ForeignKey("search_term_reports.id"), index=True)
    seller_sku: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    asin: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    link_method: Mapped[str] = mapped_column(String(64), default="unlinked")
    confidence: Mapped[float] = mapped_column(Float, default=0)

