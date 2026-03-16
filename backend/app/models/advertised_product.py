from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class AdvertisedProduct(TimestampMixin, Base):
    __tablename__ = "advertised_products"
    __table_args__ = (
        UniqueConstraint(
            "shop_id",
            "campaign_name",
            "ad_group_name",
            "seller_sku",
            "date",
            name="uq_advertised_product_daily",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("report_batches.id"), nullable=True, index=True)
    shop_id: Mapped[int | None] = mapped_column(ForeignKey("shops.id"), nullable=True, index=True)
    campaign_name: Mapped[str] = mapped_column(String(255), index=True)
    ad_group_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    seller_sku: Mapped[str] = mapped_column(String(255), index=True)
    asin: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    date: Mapped[str] = mapped_column(String(32), index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    spend: Mapped[float] = mapped_column(Float, default=0)
    sales: Mapped[float] = mapped_column(Float, default=0)
    orders: Mapped[int] = mapped_column(Integer, default=0)
    units: Mapped[int] = mapped_column(Integer, default=0)

