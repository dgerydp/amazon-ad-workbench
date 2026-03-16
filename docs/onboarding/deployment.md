# Deployment Notes

This repository can run locally out of the box, but a public URL requires actual deployment infrastructure.

## Minimum Production Topology

- one frontend host
- one backend host
- one PostgreSQL database
- one Redis instance
- one reverse proxy with HTTPS

Recommended shape:

- frontend: static build served by Nginx or a frontend hosting platform
- backend: FastAPI served by Uvicorn behind Nginx or Caddy
- database: managed PostgreSQL if possible
- cache/queue: managed Redis if possible

## Public URL Checklist

Before exposing the project on a public URL:

- switch `DATABASE_URL` from SQLite to PostgreSQL
- configure a public frontend URL
- configure a public backend API URL
- set backend CORS to include the frontend domain
- enable HTTPS
- store API keys and connector credentials in environment variables, not in code
- do not expose debug mode or local example credentials

## Simple Deployment Options

### Option 1: Single VPS

- deploy frontend build with Nginx
- run backend with a process manager
- run PostgreSQL and Redis locally or use managed services
- put Nginx in front with TLS

### Option 2: Split Hosting

- frontend on Vercel or Netlify
- backend on Railway, Render, or a VPS
- PostgreSQL and Redis as managed services

## Environment Variables

Frontend:

- `VITE_API_BASE_URL=https://your-api-domain/api`

Backend:

- `DATABASE_URL=postgresql+psycopg2://...`
- `REDIS_URL=redis://...`
- `LINGXING_APP_ID=...`
- `LINGXING_APP_SECRET=...`
- `LINGXING_BASE_URL=https://openapi.lingxing.com`

## Reverse Proxy Notes

For a production API URL, use a reverse proxy so the public endpoint is stable, for example:

- `https://app.example.com`
- `https://api.example.com`

## Persistence Notes

- SQLite is fine for local demo mode, not for public production use.
- Sample data bootstrap should remain available, but it should not be triggered automatically in production.
- Keep uploads and exports either on persistent storage or object storage if you expand file retention later.
