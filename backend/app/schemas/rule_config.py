from pydantic import BaseModel, Field


class RuleCondition(BaseModel):
    field: str
    op: str
    value: float


class PerformanceRuleGroupUpdate(BaseModel):
    description: str | None = None
    is_active: bool
    priority: int = 0


class PerformanceRuleCreate(BaseModel):
    group_id: int
    name: str
    icon: str | None = None
    color: str | None = None
    priority: int = 0
    conditions: list[RuleCondition] = Field(default_factory=list)
    description: str | None = None
    action_advice: str | None = None
    is_active: bool = True


class PerformanceRuleUpdate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    priority: int = 0
    conditions: list[RuleCondition] = Field(default_factory=list)
    description: str | None = None
    action_advice: str | None = None
    is_active: bool = True


class CombinationTagCondition(BaseModel):
    group_name: str
    tags: list[str] = Field(default_factory=list)


class CombinationRuleCreate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    priority: int = 0
    description: str | None = None
    action_advice: str | None = None
    is_active: bool = True
    tag_conditions: list[CombinationTagCondition] = Field(default_factory=list)


class CombinationRuleUpdate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    priority: int = 0
    description: str | None = None
    action_advice: str | None = None
    is_active: bool = True
    tag_conditions: list[CombinationTagCondition] = Field(default_factory=list)
