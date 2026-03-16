from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class SemanticTag(TimestampMixin, Base):
    __tablename__ = "semantic_tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token_id: Mapped[int] = mapped_column(ForeignKey("search_term_tokens.id"), unique=True, index=True)
    tag_l1: Mapped[str] = mapped_column(String(64), default="untagged", index=True)
    tag_l2: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tag_l3: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model: Mapped[str | None] = mapped_column(String(128), nullable=True)

