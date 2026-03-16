# Amazon Ad Workbench

An open-source Amazon advertising analysis workbench built around `sellerSKU`.

中文说明见：

- [快速开始（中文）](./docs/onboarding/quick-start-zh.md)
- [部署说明（中文）](./docs/onboarding/deployment-zh.md)

## 中文简介

这是一个围绕 `sellerSKU` 的亚马逊广告分析开源项目，核心目标是让没有内部 ERP 映射、没有内部 SKU 体系的小团队也能直接用起来。

项目重点：

- 搜索词报表分析
- 投放商品报表分析
- sellerSKU 维度归因
- 搜索词拆词和语义打标
- 规则引擎建议
- 领星 API 补充店铺和 sellerSKU 信息
- 多模型 AI 支持

## For Beginners

If you want to try the project with the least amount of setup:

1. Start the backend.
2. Start the frontend.
3. Open the app.
4. Click `Load Demo Data`.
5. Review `Reports`, `Analysis`, `Tags`, and `Exports`.

You do not need:

- AI keys
- Lingxing credentials

## Why This Repo Exists

Most internal ad-analysis systems are tightly coupled to ERP mappings, internal SKU trees, and private operational logic. This repository keeps only the open-source core:

- import ad reports
- link terms to sellerSKU where possible
- split search terms into tokens
- tag tokens with AI or a heuristic fallback
- apply built-in rules
- export actionable files

## Current Status

This repository is already usable as a local open-source project.

Implemented:

- FastAPI backend
- React frontend
- SQLite default local startup
- optional PostgreSQL via Docker Compose
- report upload
- demo data bootstrap
- sellerSKU management
- rule engine
- AI provider configuration
- Lingxing connection test and basic sync
- CSV and Excel exports
- backend smoke tests
- GitHub Actions CI

## Supported AI Providers

- OpenAI
- Claude
- Gemini
- DeepSeek
- Qwen
- Doubao

Notes:

- OpenAI, DeepSeek, Qwen, and Doubao are handled through an OpenAI-compatible flow where possible.
- Claude and Gemini use native HTTP request shapes.
- If AI is disabled or unavailable, the system automatically falls back to heuristic tagging.

## Quick Start

Clone first:

```bash
git clone https://github.com/dongerydp/amazon-ad-workbench.git
cd amazon-ad-workbench
```

### Option 1: Fastest local startup

Backend:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\activate
```

macOS / Linux:

```bash
source .venv/bin/activate
```

Then:

```bash
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8080
```

Frontend:

```bash
cd ../frontend
npm install
npm run dev
```

Then open the frontend and click `Load Demo Data`.

### Option 2: PowerShell helpers

From the repository root:

```powershell
.\start-backend.ps1
.\start-frontend.ps1
```

Or:

```powershell
.\start-all.ps1
```

### Option 3: Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:

- frontend: `http://127.0.0.1:3000`
- backend: `http://127.0.0.1:8080`
- postgres: `localhost:5432`
- redis: `localhost:6379`

## First-Time User Flow

1. Open the dashboard.
2. Click `Load Demo Data` to bootstrap a demo shop, sample sellerSKU records, sample reports, and a completed analysis job.
3. Review:
   - `Reports`
   - `Analysis`
   - `Tags`
   - `Exports`
4. If you want to use real data, upload:
   - `Search Term Report`
   - `Advertised Product Report`
5. Optionally configure:
   - AI provider key
   - Lingxing connector

## Configuration

Backend env example: [backend/.env.example](./backend/.env.example)

Frontend env example: [frontend/.env.example](./frontend/.env.example)

Useful variables:

- `DATABASE_URL`
- `LINGXING_APP_ID`
- `LINGXING_APP_SECRET`
- `LINGXING_BASE_URL`
- `VITE_API_BASE_URL`

## Repository Layout

```text
backend/   FastAPI app, models, services, connectors, tests
frontend/  React app
docs/      PRD, architecture, API, onboarding docs
examples/  sample input reports
```

## Key Backend Endpoints

- `POST /api/demo/bootstrap`
- `POST /api/report-batches/search-terms/upload`
- `POST /api/report-batches/advertised-products/upload`
- `POST /api/analysis/run`
- `GET /api/insights/overview`
- `GET /api/insights/tokens`
- `POST /api/providers/configs`
- `POST /api/connectors/lingxing/test`
- `POST /api/connectors/lingxing/sync/shops`
- `POST /api/connectors/lingxing/sync/seller-skus`
- `GET /api/exports/full-analysis.xlsx`

## Example Files

- [examples/reports/search-term-sample.csv](./examples/reports/search-term-sample.csv)
- [examples/reports/advertised-product-sample.csv](./examples/reports/advertised-product-sample.csv)

## Documentation

- [docs/prd/project-overview.md](./docs/prd/project-overview.md)
- [docs/architecture/system-design.md](./docs/architecture/system-design.md)
- [docs/architecture/data-model-outline.md](./docs/architecture/data-model-outline.md)
- [docs/api/api-outline.md](./docs/api/api-outline.md)
- [docs/onboarding/quick-start.md](./docs/onboarding/quick-start.md)
- [docs/onboarding/quick-start-zh.md](./docs/onboarding/quick-start-zh.md)
- [docs/onboarding/deployment.md](./docs/onboarding/deployment.md)
- [docs/onboarding/deployment-zh.md](./docs/onboarding/deployment-zh.md)

## Development Checks

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```bash
cd frontend
npm run build
```

## Open Source Guardrails

- Do not commit real customer reports.
- Do not commit real API keys.
- Do not introduce internal SKU mapping logic into this repo.
- Keep the product usable without AI and without Lingxing.

## License

[Apache-2.0](./LICENSE)
