from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Shop(TimestampMixin, Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(32), default="manual")
    external_shop_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    marketplace: Mapped[str] = mapped_column(String(32), index=True)
    currency: Mapped[str] = mapped_column(String(16), default="USD")

    seller_skus = relationship("SellerSKU", back_populates="shop", cascade="all, delete-orphan")
    report_batches = relationship("ReportBatch", back_populates="shop", cascade="all, delete-orphan")

