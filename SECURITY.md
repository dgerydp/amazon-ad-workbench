# Security Policy

## Supported Scope

This repository is intended for open-source, self-hosted use with sample data or your own local test data.

The following should never be committed:

- real customer reports
- production databases
- provider API keys
- Lingxing credentials
- private SKU mappings or internal business rules

## Reporting a Security or Privacy Issue

If you find a security issue or notice sensitive data committed by mistake, please do not open a public issue with the raw data attached.

Open a private report to the maintainer through GitHub security reporting if available, or contact the maintainer directly before publishing details.

When reporting, include:

- what file or endpoint is affected
- how the issue can be reproduced
- whether customer data, credentials, or infrastructure secrets may be exposed

## Data Hygiene

Before opening a pull request, verify that your branch does not include:

- `.env` files
- `.db` files
- local Excel or CSV report exports
- screenshots containing customer or account information

Use the files under `examples/` for safe public demos.
