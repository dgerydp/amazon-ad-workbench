from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class RuleSet(TimestampMixin, Base):
    __tablename__ = "rule_sets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class RuleItem(TimestampMixin, Base):
    __tablename__ = "rule_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rule_set_id: Mapped[int] = mapped_column(ForeignKey("rule_sets.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    priority: Mapped[int] = mapped_column(default=0)
    conditions_json: Mapped[list] = mapped_column(JSON, default=list)
    action_type: Mapped[str] = mapped_column(String(128))
    action_advice: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RuleHit(TimestampMixin, Base):
    __tablename__ = "rule_hits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    target_type: Mapped[str] = mapped_column(String(64), index=True)
    target_id: Mapped[int] = mapped_column(index=True)
    rule_item_id: Mapped[int] = mapped_column(ForeignKey("rule_items.id"), index=True)
    hit_payload: Mapped[dict] = mapped_column(JSON, default=dict)
