# System Design

## Architecture Summary

The system has four major layers:

1. Ingestion
2. Analysis
3. Enrichment
4. Presentation

## Logical Flow

```text
Search Term Report ----\
                        -> ingestion -> normalized storage -> sellerSKU linking -> tokenization -> AI tagging -> rule engine -> exports/UI
Advertised Product ----/

Lingxing API ----------> enrichment --------------------------------------------------------------/
```

## Backend Modules

### API

- upload endpoints
- analysis job endpoints
- provider config endpoints
- Lingxing connection endpoints
- export endpoints

### Services

- report normalization
- sellerSKU linking
- tokenization
- analysis aggregation
- export generation

### Connectors

- Lingxing auth
- Lingxing shop sync
- Lingxing sellerSKU sync
- Lingxing inventory/cost sync

### Providers

- OpenAI
- Claude
- Gemini
- DeepSeek
- Qwen
- Doubao

### Rules

- built-in rule sets
- custom rule definitions
- rule evaluation

## Data Strategy

Core fact tables:

- `advertised_products`
- `search_term_reports`
- `search_term_tokens`

Enrichment tables:

- `shops`
- `seller_skus`
- `provider_configs`

Decision tables:

- `semantic_tags`
- `rule_sets`
- `rule_items`
- `rule_hits`

## sellerSKU Linking Strategy

The project does not maintain internal mapping. Linking is heuristic and must remain explicit.

Priority:

1. unique `campaign + ad_group + date` match to one sellerSKU
2. ASIN-assisted match if available
3. ambiguous state when multiple sellerSKUs exist
4. unlinked search term retained as global term analysis

## MVP Deployment

- `frontend` on port 3000
- `backend` on port 8080
- `postgres`
- `redis`

## Planned Extension Points

- Amazon Ads API sync
- ad write-back
- SaaS auth and permissions
- trend and cohort analysis

