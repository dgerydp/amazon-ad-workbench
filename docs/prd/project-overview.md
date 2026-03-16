# Project Overview

## Product Statement

Amazon Ad Workbench is an open source advertising analysis tool for Amazon operators who want actionable insights without maintaining internal SKU mapping.

The system uses `sellerSKU` as the core analysis key and combines:

- Search Term Report
- Advertised Product Report
- Lingxing API enrichment
- multi-provider AI tagging
- rule-based recommendations

## Target Users

- Amazon operators
- small seller teams
- agencies managing multiple shops
- data-minded beginners who need a guided workflow

## User Problems

- Search term reports are noisy and hard to operationalize.
- Many teams do not have a clean internal SKU mapping system.
- Existing internal systems are too heavy for small teams.
- Beginners need a guided experience instead of a blank BI backend.

## Product Principles

- sellerSKU-first
- zero internal mapping dependency
- useful without AI
- better with AI
- guided onboarding by default

## Main Use Cases

1. Upload two reports and get immediate term-level analysis.
2. Review token tags and performance labels.
3. Export negative keyword suggestions and high-performance terms.
4. Connect Lingxing to enrich sellerSKU metadata, cost, and inventory.
5. Plug in AI keys for richer semantic classification.

## Out of Scope

- internal SKU mapping
- internal category analytics
- SP-API
- ad account write-back in MVP
- advanced RBAC

## Success Criteria

- A new user can reach a useful result within 10 minutes.
- The platform can produce exports without any AI key configured.
- Lingxing connection can enrich sellerSKU data with minimal setup.
- AI integration remains optional and provider-agnostic.

