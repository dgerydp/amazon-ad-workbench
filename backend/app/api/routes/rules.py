from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.performance_rule import CombinationRule, PerformanceRule, PerformanceRuleGroup
from app.schemas.rule_config import (
    CombinationRuleCreate,
    CombinationRuleUpdate,
    PerformanceRuleCreate,
    PerformanceRuleGroupUpdate,
    PerformanceRuleUpdate,
)
from app.services.rule_engine import (
    RULE_FIELD_OPTIONS,
    ensure_default_rule_config,
    list_combination_rules,
    list_rule_groups,
    serialize_combination_rule,
    serialize_rule_group,
)


router = APIRouter()


@router.get("/groups")
def get_rule_groups(db: Session = Depends(get_db)) -> dict:
    return {"field_options": RULE_FIELD_OPTIONS, "groups": list_rule_groups(db)}


@router.put("/groups/{group_id}")
def update_rule_group(group_id: int, payload: PerformanceRuleGroupUpdate, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    group = db.get(PerformanceRuleGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Rule group not found")
    group.description = payload.description
    group.is_active = payload.is_active
    group.priority = payload.priority
    db.add(group)
    db.commit()
    db.refresh(group)
    rules = db.scalars(
        select(PerformanceRule)
        .where(PerformanceRule.group_id == group.id)
        .order_by(PerformanceRule.priority.asc(), PerformanceRule.id.asc())
    ).all()
    return serialize_rule_group(group, list(rules))


@router.post("/rules")
def create_rule(payload: PerformanceRuleCreate, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    group = db.get(PerformanceRuleGroup, payload.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Rule group not found")
    rule = PerformanceRule(
        group_id=payload.group_id,
        name=payload.name,
        icon=payload.icon,
        color=payload.color,
        priority=payload.priority,
        conditions_json=[item.model_dump() for item in payload.conditions],
        description=payload.description,
        action_advice=payload.action_advice,
        is_active=payload.is_active,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {
        "id": rule.id,
        "group_id": rule.group_id,
        "name": rule.name,
        "icon": rule.icon,
        "color": rule.color,
        "priority": rule.priority,
        "conditions": rule.conditions_json or [],
        "description": rule.description,
        "action_advice": rule.action_advice,
        "is_active": rule.is_active,
    }


@router.put("/rules/{rule_id}")
def update_rule(rule_id: int, payload: PerformanceRuleUpdate, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    rule = db.get(PerformanceRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.name = payload.name
    rule.icon = payload.icon
    rule.color = payload.color
    rule.priority = payload.priority
    rule.conditions_json = [item.model_dump() for item in payload.conditions]
    rule.description = payload.description
    rule.action_advice = payload.action_advice
    rule.is_active = payload.is_active
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {
        "id": rule.id,
        "group_id": rule.group_id,
        "name": rule.name,
        "icon": rule.icon,
        "color": rule.color,
        "priority": rule.priority,
        "conditions": rule.conditions_json or [],
        "description": rule.description,
        "action_advice": rule.action_advice,
        "is_active": rule.is_active,
    }


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    rule = db.get(PerformanceRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}


@router.get("/combinations")
def get_combination_rules(db: Session = Depends(get_db)) -> dict:
    return {"rules": list_combination_rules(db)}


@router.post("/combinations")
def create_combination_rule(payload: CombinationRuleCreate, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    rule = CombinationRule(
        name=payload.name,
        icon=payload.icon,
        color=payload.color,
        priority=payload.priority,
        description=payload.description,
        action_advice=payload.action_advice,
        is_active=payload.is_active,
        tag_conditions_json=[item.model_dump() for item in payload.tag_conditions],
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return serialize_combination_rule(rule)


@router.put("/combinations/{rule_id}")
def update_combination_rule(rule_id: int, payload: CombinationRuleUpdate, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    rule = db.get(CombinationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Combination rule not found")
    rule.name = payload.name
    rule.icon = payload.icon
    rule.color = payload.color
    rule.priority = payload.priority
    rule.description = payload.description
    rule.action_advice = payload.action_advice
    rule.is_active = payload.is_active
    rule.tag_conditions_json = [item.model_dump() for item in payload.tag_conditions]
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return serialize_combination_rule(rule)


@router.delete("/combinations/{rule_id}")
def delete_combination_rule(rule_id: int, db: Session = Depends(get_db)) -> dict:
    ensure_default_rule_config(db)
    rule = db.get(CombinationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Combination rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}
