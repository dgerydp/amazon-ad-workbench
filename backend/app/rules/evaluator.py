from __future__ import annotations

import operator


OPS = {
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt,
    "==": operator.eq,
    "!=": operator.ne,
}


def evaluate_rule(record: dict, conditions: list[dict]) -> bool:
    for condition in conditions:
        field = condition["field"]
        op = condition["op"]
        value = condition["value"]
        actual = record.get(field, 0)
        fn = OPS.get(op)
        if fn is None:
            return False
        if not fn(float(actual), float(value)):
            return False
    return True

