BUILTIN_RULESET_NAME = "Built-in sellerSKU rules"

BUILTIN_RULES = [
    {
        "name": "High performance term",
        "priority": 1,
        "conditions_json": [
            {"field": "orders", "op": ">=", "value": 3},
            {"field": "acos", "op": "<=", "value": 0.25},
        ],
        "action_type": "promote",
        "action_advice": "Increase bid carefully or isolate into exact match.",
    },
    {
        "name": "Expensive no-order term",
        "priority": 2,
        "conditions_json": [
            {"field": "clicks", "op": ">=", "value": 12},
            {"field": "orders", "op": "==", "value": 0},
            {"field": "spend", "op": ">=", "value": 20},
        ],
        "action_type": "negative_exact",
        "action_advice": "Review for negative exact unless strategically important.",
    },
    {
        "name": "Potential term",
        "priority": 3,
        "conditions_json": [
            {"field": "clicks", "op": ">=", "value": 5},
            {"field": "orders", "op": "==", "value": 0},
            {"field": "spend", "op": "<", "value": 20},
        ],
        "action_type": "observe",
        "action_advice": "Keep observing and validate listing relevance before negating.",
    },
]

