from __future__ import annotations

from io import BytesIO

import pandas as pd


SEARCH_TERM_COLUMN_MAP = {
    "Date": "date",
    "Campaign Name": "campaign_name",
    "Ad Group Name": "ad_group_name",
    "Customer Search Term": "search_term",
    "Impressions": "impressions",
    "Clicks": "clicks",
    "Spend": "spend",
    "7 Day Total Sales": "sales",
    "7 Day Total Orders": "orders",
    "7 Day Total Units": "units",
}

ADVERTISED_PRODUCT_COLUMN_MAP = {
    "Date": "date",
    "Campaign Name": "campaign_name",
    "Ad Group Name": "ad_group_name",
    "Advertised SKU": "seller_sku",
    "Advertised ASIN": "asin",
    "Impressions": "impressions",
    "Clicks": "clicks",
    "Spend": "spend",
    "7 Day Total Sales": "sales",
    "7 Day Total Orders": "orders",
    "7 Day Total Units": "units",
}


def load_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        try:
            return pd.read_csv(BytesIO(content))
        except UnicodeDecodeError:
            return pd.read_csv(BytesIO(content), encoding="utf-8-sig")
    return pd.read_excel(BytesIO(content))


def normalize_columns(df: pd.DataFrame, report_type: str) -> pd.DataFrame:
    mapping = SEARCH_TERM_COLUMN_MAP if report_type == "search_term" else ADVERTISED_PRODUCT_COLUMN_MAP
    renamed = {}
    for column in df.columns:
        stripped = str(column).strip()
        if stripped in mapping:
            renamed[column] = mapping[stripped]
    normalized = df.rename(columns=renamed)
    normalized.columns = [str(column).strip() for column in normalized.columns]
    return normalized


def parse_number(value, default: float = 0) -> float:
    if pd.isna(value):
        return default
    if isinstance(value, str):
        value = value.replace("$", "").replace(",", "").replace("%", "").strip()
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_int(value) -> int:
    return int(parse_number(value, default=0))

