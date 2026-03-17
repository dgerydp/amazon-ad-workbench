from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class PerformanceRuleGroup(TimestampMixin, Base):
    __tablename__ = "performance_rule_groups"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(default=0)


class PerformanceRule(TimestampMixin, Base):
    __tablename__ = "performance_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("performance_rule_groups.id"), index=True)
    name: Mapped[str] = mapped_column(String(64))
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    priority: Mapped[int] = mapped_column(default=0)
    conditions_json: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    action_advice: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class CombinationRule(TimestampMixin, Base):
    __tablename__ = "combination_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    priority: Mapped[int] = mapped_column(default=0)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    action_advice: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tag_conditions_json: Mapped[list] = mapped_column(JSON, default=list)


class PerformanceRuleHit(TimestampMixin, Base):
    __tablename__ = "performance_rule_hits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    search_term_token_id: Mapped[int] = mapped_column(ForeignKey("search_term_tokens.id"), index=True)
    hit_type: Mapped[str] = mapped_column(String(32), index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("performance_rule_groups.id"), nullable=True, index=True)
    rule_id: Mapped[int | None] = mapped_column(ForeignKey("performance_rules.id"), nullable=True, index=True)
    combination_rule_id: Mapped[int | None] = mapped_column(ForeignKey("combination_rules.id"), nullable=True, index=True)
    group_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    label_name: Mapped[str] = mapped_column(String(128))
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    action_advice: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    hit_payload: Mapped[dict] = mapped_column(JSON, default=dict)
