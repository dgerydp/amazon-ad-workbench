from __future__ import annotations

import operator

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.performance_rule import CombinationRule, PerformanceRule, PerformanceRuleGroup, PerformanceRuleHit
from app.models.search_term_token import SearchTermToken


OPS = {
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt,
    "==": operator.eq,
    "!=": operator.ne,
}

SQLITE_CHUNK_SIZE = 800


def _iter_chunks(ids: list[int], chunk_size: int = SQLITE_CHUNK_SIZE) -> list[list[int]]:
    chunks: list[list[int]] = []
    for start in range(0, len(ids), chunk_size):
        chunks.append(ids[start : start + chunk_size])
    return chunks


RULE_FIELD_OPTIONS = [
    {"value": "total_impressions", "label": "总曝光量"},
    {"value": "total_clicks", "label": "总点击量"},
    {"value": "total_spend", "label": "总花费"},
    {"value": "total_sales", "label": "总销售额"},
    {"value": "total_orders", "label": "总订单数"},
    {"value": "ctr", "label": "CTR"},
    {"value": "acos", "label": "ACOS"},
    {"value": "conversion_rate", "label": "转化率"},
]

DEFAULT_RULE_GROUPS = [
    {
        "name": "转化表现",
        "priority": 1,
        "description": "从点击到订单的实际转化质量。每个词元在这个分组里只会命中一条优先级最高的规则。",
        "rules": [
            {
                "name": "高效转化",
                "icon": "A",
                "color": "#2f855a",
                "priority": 1,
                "conditions_json": [
                    {"field": "clicks", "op": ">=", "value": 20},
                    {"field": "orders", "op": ">=", "value": 2},
                    {"field": "acos", "op": "<=", "value": 0.25},
                ],
                "description": "点击和订单都已形成样本，且 ACOS 处于较优水平。",
                "action_advice": "适合加预算、加竞价，优先拉成独立精准词。",
            },
            {
                "name": "有单可放量",
                "icon": "B",
                "color": "#3182ce",
                "priority": 2,
                "conditions_json": [
                    {"field": "clicks", "op": ">=", "value": 10},
                    {"field": "orders", "op": ">=", "value": 1},
                    {"field": "acos", "op": "<=", "value": 0.4},
                ],
                "description": "已经有稳定转化，但还没到最优利润区间。",
                "action_advice": "先小幅放量，再观察 ACOS 是否恶化。",
            },
            {
                "name": "有点击无转化",
                "icon": "C",
                "color": "#dd6b20",
                "priority": 3,
                "conditions_json": [
                    {"field": "clicks", "op": ">=", "value": 12},
                    {"field": "orders", "op": "==", "value": 0},
                ],
                "description": "点击已足够，但没有订单产出。",
                "action_advice": "优先排查词意图、Listing 转化和匹配方式。",
            },
            {
                "name": "低样本观察",
                "icon": "D",
                "color": "#d69e2e",
                "priority": 4,
                "conditions_json": [
                    {"field": "clicks", "op": ">=", "value": 1},
                    {"field": "clicks", "op": "<", "value": 12},
                ],
                "description": "有少量点击，但样本还不够判断。",
                "action_advice": "继续积累数据，暂时不要下结论。",
            },
            {
                "name": "零点击",
                "icon": "E",
                "color": "#718096",
                "priority": 5,
                "conditions_json": [{"field": "clicks", "op": "==", "value": 0}],
                "description": "尚未形成点击数据。",
                "action_advice": "先看曝光是否足够，再决定是否处理。",
            },
        ],
    },
    {
        "name": "流量质量",
        "priority": 2,
        "description": "看曝光到点击这一层，判断词元是吃量、精准还是流量效率偏弱。",
        "rules": [
            {
                "name": "高曝光高点击",
                "icon": "A",
                "color": "#805ad5",
                "priority": 1,
                "conditions_json": [
                    {"field": "impressions", "op": ">=", "value": 1000},
                    {"field": "ctr", "op": ">=", "value": 0.005},
                ],
                "description": "量级已经起来，CTR 也不差。",
                "action_advice": "属于典型主力流量词，重点盯后链路表现。",
            },
            {
                "name": "低曝光高点击",
                "icon": "B",
                "color": "#2b6cb0",
                "priority": 2,
                "conditions_json": [
                    {"field": "impressions", "op": "<", "value": 1000},
                    {"field": "ctr", "op": ">=", "value": 0.005},
                ],
                "description": "点击率不错，但总曝光偏少。",
                "action_advice": "适合加竞价或争取更前排位置。",
            },
            {
                "name": "高曝光低点击",
                "icon": "C",
                "color": "#c05621",
                "priority": 3,
                "conditions_json": [
                    {"field": "impressions", "op": ">=", "value": 1000},
                    {"field": "ctr", "op": "<", "value": 0.005},
                ],
                "description": "曝光足够，但点击意愿不足。",
                "action_advice": "重点看主图、标题、价格和搜索意图匹配。",
            },
            {
                "name": "低曝光低点击",
                "icon": "D",
                "color": "#718096",
                "priority": 4,
                "conditions_json": [
                    {"field": "impressions", "op": "<", "value": 1000},
                    {"field": "ctr", "op": "<", "value": 0.005},
                ],
                "description": "流量和点击都偏弱，通常优先级较低。",
                "action_advice": "先放着，等样本起来再判断。",
            },
        ],
    },
    {
        "name": "投入产出",
        "priority": 3,
        "description": "从花费和产出角度看当前词元对预算是否友好。",
        "rules": [
            {
                "name": "利润型",
                "icon": "A",
                "color": "#2f855a",
                "priority": 1,
                "conditions_json": [
                    {"field": "spend", "op": ">=", "value": 10},
                    {"field": "orders", "op": ">=", "value": 1},
                    {"field": "acos", "op": "<=", "value": 0.25},
                ],
                "description": "花费已经起来且产出表现较优。",
                "action_advice": "优先保证预算，适合做利润型核心词。",
            },
            {
                "name": "控本型",
                "icon": "B",
                "color": "#d69e2e",
                "priority": 2,
                "conditions_json": [
                    {"field": "spend", "op": ">=", "value": 10},
                    {"field": "orders", "op": ">=", "value": 1},
                    {"field": "acos", "op": ">", "value": 0.25},
                    {"field": "acos", "op": "<=", "value": 0.45},
                ],
                "description": "能出单，但利润一般。",
                "action_advice": "继续投放，但需要控 ACOS。",
            },
            {
                "name": "亏损型",
                "icon": "C",
                "color": "#c53030",
                "priority": 3,
                "conditions_json": [
                    {"field": "spend", "op": ">=", "value": 10},
                    {"field": "orders", "op": ">=", "value": 1},
                    {"field": "acos", "op": ">", "value": 0.45},
                ],
                "description": "有订单，但投入产出已经偏差。",
                "action_advice": "需要降价竞价或改匹配方式止损。",
            },
            {
                "name": "纯烧钱",
                "icon": "D",
                "color": "#e53e3e",
                "priority": 4,
                "conditions_json": [
                    {"field": "spend", "op": ">=", "value": 10},
                    {"field": "orders", "op": "==", "value": 0},
                ],
                "description": "已经有较明显花费，但没有订单。",
                "action_advice": "优先进入否词或强控名单。",
            },
            {
                "name": "低花费观察",
                "icon": "E",
                "color": "#718096",
                "priority": 5,
                "conditions_json": [{"field": "spend", "op": "<", "value": 10}],
                "description": "花费样本还不足够。",
                "action_advice": "先继续观察，不要过早处理。",
            },
        ],
    },
]

DEFAULT_COMBINATION_RULES = [
    {
        "name": "全力放量",
        "icon": "A",
        "color": "#2f855a",
        "priority": 1,
        "description": "转化、流量和投入产出三个维度都表现良好。",
        "action_advice": "优先加预算、加竞价，单独管理。",
        "tag_conditions_json": [
            {"group_name": "转化表现", "tags": ["高效转化"]},
            {"group_name": "流量质量", "tags": ["高曝光高点击", "低曝光高点击"]},
            {"group_name": "投入产出", "tags": ["利润型"]},
        ],
    },
    {
        "name": "重点培养",
        "icon": "B",
        "color": "#3182ce",
        "priority": 2,
        "description": "已经有正向产出，值得重点盯和继续优化。",
        "action_advice": "可适度加量，关注转化曲线变化。",
        "tag_conditions_json": [
            {"group_name": "转化表现", "tags": ["高效转化", "有单可放量"]},
            {"group_name": "流量质量", "tags": ["高曝光高点击", "低曝光高点击"]},
            {"group_name": "投入产出", "tags": ["利润型", "控本型"]},
        ],
    },
    {
        "name": "优化转化",
        "icon": "C",
        "color": "#dd6b20",
        "priority": 3,
        "description": "流量质量还行，但点击之后接不住。",
        "action_advice": "优先检查词意图、Listing 转化和落地页承接。",
        "tag_conditions_json": [
            {"group_name": "转化表现", "tags": ["有点击无转化"]},
            {"group_name": "流量质量", "tags": ["高曝光高点击", "低曝光高点击"]},
        ],
    },
    {
        "name": "优化引流",
        "icon": "D",
        "color": "#805ad5",
        "priority": 4,
        "description": "词元转化不差，但前链路拿量不够或者点击不够。",
        "action_advice": "优先优化点击率和流量入口，再决定是否放量。",
        "tag_conditions_json": [
            {"group_name": "转化表现", "tags": ["高效转化", "有单可放量"]},
            {"group_name": "流量质量", "tags": ["高曝光低点击", "低曝光低点击"]},
        ],
    },
    {
        "name": "控制花费",
        "icon": "E",
        "color": "#c53030",
        "priority": 5,
        "description": "已经出现明显的预算浪费，需要控本或否词。",
        "action_advice": "降竞价、收匹配，必要时直接否词。",
        "tag_conditions_json": [
            {"group_name": "投入产出", "tags": ["亏损型", "纯烧钱"]},
            {"group_name": "转化表现", "tags": ["有点击无转化"]},
        ],
    },
    {
        "name": "继续观察",
        "icon": "F",
        "color": "#d69e2e",
        "priority": 6,
        "description": "样本不足，先不要过度干预。",
        "action_advice": "继续积累样本，暂不做强动作。",
        "tag_conditions_json": [{"group_name": "转化表现", "tags": ["低样本观察"]}],
    },
    {
        "name": "暂不处理",
        "icon": "G",
        "color": "#718096",
        "priority": 99,
        "description": "默认兜底决策。",
        "action_advice": "当前没有足够信号触发更明确的动作。",
        "tag_conditions_json": [],
    },
]


def _serialize_conditions(items: list[dict]) -> list[dict]:
    return [{"field": item["field"], "op": item["op"], "value": float(item["value"])} for item in items]


def ensure_default_rule_config(db: Session) -> None:
    has_groups = db.scalar(select(PerformanceRuleGroup.id).limit(1))
    if not has_groups:
        for group_data in DEFAULT_RULE_GROUPS:
            group = PerformanceRuleGroup(
                name=group_data["name"],
                description=group_data["description"],
                is_active=True,
                priority=group_data["priority"],
            )
            db.add(group)
            db.flush()
            for rule_data in group_data["rules"]:
                db.add(
                    PerformanceRule(
                        group_id=group.id,
                        name=rule_data["name"],
                        icon=rule_data["icon"],
                        color=rule_data["color"],
                        priority=rule_data["priority"],
                        conditions_json=_serialize_conditions(rule_data["conditions_json"]),
                        description=rule_data["description"],
                        action_advice=rule_data["action_advice"],
                        is_active=True,
                    )
                )

    has_combinations = db.scalar(select(CombinationRule.id).limit(1))
    if not has_combinations:
        for item in DEFAULT_COMBINATION_RULES:
            db.add(
                CombinationRule(
                    name=item["name"],
                    icon=item["icon"],
                    color=item["color"],
                    priority=item["priority"],
                    description=item["description"],
                    action_advice=item["action_advice"],
                    is_active=True,
                    tag_conditions_json=item["tag_conditions_json"],
                )
            )
    db.commit()


def serialize_rule_group(group: PerformanceRuleGroup, rules: list[PerformanceRule]) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "is_active": group.is_active,
        "priority": group.priority,
        "rules": [
            {
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
            for rule in sorted(rules, key=lambda item: (item.priority, item.id))
        ],
    }


def serialize_combination_rule(rule: CombinationRule) -> dict:
    return {
        "id": rule.id,
        "name": rule.name,
        "icon": rule.icon,
        "color": rule.color,
        "priority": rule.priority,
        "description": rule.description,
        "action_advice": rule.action_advice,
        "is_active": rule.is_active,
        "tag_conditions": rule.tag_conditions_json or [],
    }


def list_rule_groups(db: Session) -> list[dict]:
    ensure_default_rule_config(db)
    groups = db.scalars(select(PerformanceRuleGroup).order_by(PerformanceRuleGroup.priority.asc(), PerformanceRuleGroup.id.asc())).all()
    group_ids = [group.id for group in groups]
    rules = (
        db.scalars(
            select(PerformanceRule)
            .where(PerformanceRule.group_id.in_(group_ids))
            .order_by(PerformanceRule.priority.asc(), PerformanceRule.id.asc())
        ).all()
        if group_ids
        else []
    )
    rules_by_group: dict[int, list[PerformanceRule]] = {group.id: [] for group in groups}
    for rule in rules:
        rules_by_group.setdefault(rule.group_id, []).append(rule)
    return [serialize_rule_group(group, rules_by_group.get(group.id, [])) for group in groups]


def list_combination_rules(db: Session) -> list[dict]:
    ensure_default_rule_config(db)
    rules = db.scalars(select(CombinationRule).order_by(CombinationRule.priority.asc(), CombinationRule.id.asc())).all()
    return [serialize_combination_rule(rule) for rule in rules]


def _safe_metric(value: float | int | None) -> float:
    return float(value or 0)


def _build_record(token: SearchTermToken) -> dict:
    impressions = _safe_metric(token.impressions)
    clicks = _safe_metric(token.clicks)
    spend = _safe_metric(token.spend)
    sales = _safe_metric(token.sales)
    orders = _safe_metric(token.orders)
    ctr = round(clicks / impressions, 6) if impressions else 0
    acos = round(spend / sales, 6) if sales else (999 if spend else 0)
    conversion_rate = round(orders / clicks, 6) if clicks else 0
    return {
        "impressions": impressions,
        "clicks": clicks,
        "spend": spend,
        "sales": sales,
        "orders": orders,
        "total_impressions": impressions,
        "total_clicks": clicks,
        "total_spend": spend,
        "total_sales": sales,
        "total_orders": orders,
        "ctr": ctr,
        "acos": acos,
        "conversion_rate": conversion_rate,
    }


def _match_rule(record: dict, conditions: list[dict]) -> bool:
    for condition in conditions:
        field = condition.get("field")
        op = condition.get("op")
        threshold = condition.get("value", 0)
        fn = OPS.get(op)
        if not field or fn is None:
            return False
        actual = _safe_metric(record.get(field))
        if not fn(actual, float(threshold)):
            return False
    return True


def _evaluate_group_rules(record: dict, groups: list[PerformanceRuleGroup], rules_by_group: dict[int, list[PerformanceRule]]) -> list[dict]:
    labels: list[dict] = []
    for group in groups:
        if not group.is_active:
            continue
        for rule in rules_by_group.get(group.id, []):
            if not rule.is_active:
                continue
            if _match_rule(record, rule.conditions_json or []):
                labels.append(
                    {
                        "group_id": group.id,
                        "group_name": group.name,
                        "rule_id": rule.id,
                        "label_name": rule.name,
                        "icon": rule.icon,
                        "color": rule.color,
                        "description": rule.description,
                        "action_advice": rule.action_advice,
                    }
                )
                break
    return labels


def _evaluate_combination(labels: list[dict], rules: list[CombinationRule]) -> CombinationRule | None:
    label_map = {item["group_name"]: item["label_name"] for item in labels}
    for rule in rules:
        if not rule.is_active:
            continue
        conditions = rule.tag_conditions_json or []
        if not conditions:
            return rule
        matched = True
        for condition in conditions:
            actual_label = label_map.get(condition.get("group_name"))
            if not actual_label or actual_label not in (condition.get("tags") or []):
                matched = False
                break
        if matched:
            return rule
    return None


def run_performance_rules(db: Session, shop_id: int | None = None) -> dict[str, int]:
    ensure_default_rule_config(db)
    query = select(SearchTermToken)
    if shop_id is not None:
        query = query.where(SearchTermToken.shop_id == shop_id)
    tokens = db.scalars(query.order_by(SearchTermToken.id.asc())).all()
    token_ids = [token.id for token in tokens]

    if token_ids:
        for chunk in _iter_chunks(token_ids):
            db.execute(delete(PerformanceRuleHit).where(PerformanceRuleHit.search_term_token_id.in_(chunk)))

    groups = db.scalars(
        select(PerformanceRuleGroup).order_by(PerformanceRuleGroup.priority.asc(), PerformanceRuleGroup.id.asc())
    ).all()
    group_ids = [group.id for group in groups]
    rules = (
        db.scalars(
            select(PerformanceRule)
            .where(PerformanceRule.group_id.in_(group_ids))
            .order_by(PerformanceRule.priority.asc(), PerformanceRule.id.asc())
        ).all()
        if group_ids
        else []
    )
    rules_by_group: dict[int, list[PerformanceRule]] = {}
    for rule in rules:
        rules_by_group.setdefault(rule.group_id, []).append(rule)
    combinations = db.scalars(select(CombinationRule).order_by(CombinationRule.priority.asc(), CombinationRule.id.asc())).all()

    label_hits = 0
    decision_hits = 0
    for token in tokens:
        record = _build_record(token)
        matched_labels = _evaluate_group_rules(record, groups, rules_by_group)
        for label in matched_labels:
            db.add(
                PerformanceRuleHit(
                    search_term_token_id=token.id,
                    hit_type="group",
                    group_id=label["group_id"],
                    rule_id=label["rule_id"],
                    group_name=label["group_name"],
                    label_name=label["label_name"],
                    icon=label["icon"],
                    color=label["color"],
                    description=label["description"],
                    action_advice=label["action_advice"],
                    hit_payload=record,
                )
            )
            label_hits += 1

        decision = _evaluate_combination(matched_labels, combinations)
        token.action_label = decision.name if decision else None
        if decision:
            db.add(
                PerformanceRuleHit(
                    search_term_token_id=token.id,
                    hit_type="decision",
                    combination_rule_id=decision.id,
                    group_name="组合决策",
                    label_name=decision.name,
                    icon=decision.icon,
                    color=decision.color,
                    description=decision.description,
                    action_advice=decision.action_advice,
                    hit_payload=record,
                )
            )
            decision_hits += 1

    db.commit()
    return {"label_hits": label_hits, "decision_hits": decision_hits}
