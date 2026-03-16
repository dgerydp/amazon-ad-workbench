from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class SellerSKU(TimestampMixin, Base):
    __tablename__ = "seller_skus"
    __table_args__ = (UniqueConstraint("shop_id", "seller_sku", name="uq_shop_seller_sku"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), index=True)
    seller_sku: Mapped[str] = mapped_column(String(255), index=True)
    asin: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    inventory_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="manual")

    shop = relationship("Shop", back_populates="seller_skus")

