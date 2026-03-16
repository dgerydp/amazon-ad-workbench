# API Outline

## Health

- `GET /health`

## Report Upload

- `POST /api/report-batches/search-terms/upload`
- `POST /api/report-batches/advertised-products/upload`
- `GET /api/report-batches`
- `GET /api/report-batches/{batch_id}`

## Analysis

- `POST /api/analysis/run`
- `GET /api/analysis/jobs`
- `GET /api/analysis/jobs/{job_id}`

## Shops and sellerSKU

- `GET /api/shops`
- `POST /api/shops`
- `GET /api/seller-skus`
- `GET /api/seller-skus/{seller_sku_id}`

## Lingxing

- `POST /api/connectors/lingxing/test`
- `POST /api/connectors/lingxing/token`
- `POST /api/connectors/lingxing/sync/shops`
- `POST /api/connectors/lingxing/sync/seller-skus`
- `POST /api/connectors/lingxing/sync/inventory`

## AI Providers

- `GET /api/providers`
- `POST /api/providers/test`
- `POST /api/providers/configs`
- `GET /api/providers/configs`

## Rules

- `GET /api/rulesets`
- `POST /api/rulesets`
- `POST /api/rulesets/{ruleset_id}/activate`

## Insights

- `GET /api/insights/search-terms`
- `GET /api/insights/tokens`
- `GET /api/insights/seller-skus`

## Exports

- `POST /api/exports/high-performance`
- `POST /api/exports/negative-keywords`
- `POST /api/exports/seller-sku-summary`

