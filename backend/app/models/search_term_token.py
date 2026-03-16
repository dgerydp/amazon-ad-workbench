from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class SearchTermToken(TimestampMixin, Base):
    __tablename__ = "search_term_tokens"
    __table_args__ = (
        UniqueConstraint(
            "search_term_report_id",
            "seller_sku",
            "token_normalized",
            name="uq_search_term_token",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    search_term_report_id: Mapped[int] = mapped_column(ForeignKey("search_term_reports.id"), index=True)
    shop_id: Mapped[int | None] = mapped_column(ForeignKey("shops.id"), nullable=True, index=True)
    seller_sku: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    token: Mapped[str] = mapped_column(String(255), index=True)
    token_normalized: Mapped[str] = mapped_column(String(255), index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    spend: Mapped[float] = mapped_column(Float, default=0)
    sales: Mapped[float] = mapped_column(Float, default=0)
    orders: Mapped[int] = mapped_column(Integer, default=0)
    action_label: Mapped[str | None] = mapped_column(String(128), nullable=True)

