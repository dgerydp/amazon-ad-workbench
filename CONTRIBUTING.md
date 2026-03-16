# Contributing

## Ground Rules

- Keep the project sellerSKU-first. Do not introduce internal SKU mapping.
- Do not add Amazon SP-API dependencies to the MVP path.
- Prefer configuration and connectors that work in self-hosted open source setups.
- Never commit real customer data, real API keys, or private business mappings.

## Local Setup

1. Copy `backend/.env.example` to `backend/.env` if you want custom backend settings.
2. Copy `frontend/.env.example` to `frontend/.env` if you want a custom API base URL.
3. Start the backend from `backend`:
   `python -m venv .venv`
   `.venv\Scripts\activate`
   `pip install -r requirements.txt -r requirements-dev.txt`
   `uvicorn app.main:app --reload --port 8080`
4. Start the frontend from `frontend`:
   `npm install`
   `npm run dev`

## Validation

- Backend tests: `pytest -q`
- Frontend build: `npm run build`

## Pull Requests

- Keep PRs scoped to one change area.
- Update docs when behavior changes.
- Add or update tests when you touch ingestion, analysis, connectors, or exports.
- If you change provider behavior, include failure handling and a non-AI fallback path.
