# Data Model Outline

## Core Tables

- `shops`
- `seller_skus`
- `report_batches`
- `advertised_products`
- `search_term_reports`
- `search_term_links`
- `search_term_tokens`
- `semantic_tags`
- `rule_sets`
- `rule_items`
- `rule_hits`
- `provider_configs`

## Primary Keys and Uniqueness

- `shops`: internal `id`
- `seller_skus`: unique on `shop_id + seller_sku`
- `report_batches`: internal `id`
- `advertised_products`: dedupe on `shop_id + campaign_name + ad_group_name + seller_sku + date`
- `search_term_reports`: dedupe on `shop_id + campaign_name + ad_group_name + search_term + date`

## Important Constraints

- No internal SKU mapping table
- No category mapping dependency
- sellerSKU remains the business identity
- ambiguous links must be stored explicitly, not guessed silently

