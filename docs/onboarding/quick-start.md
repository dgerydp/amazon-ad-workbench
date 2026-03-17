# Quick Start

## Before You Start

Clone the repository first:

```bash
git clone https://github.com/dongerydp/amazon-ad-workbench.git
cd amazon-ad-workbench
```

If you do not want to use Git, you can also download the repository ZIP from GitHub and extract it locally.

## Fastest Beginner Path

The simplest path is:

1. start the backend
2. start the frontend
3. open the app
4. upload a `Search Term Report`
5. upload an `Advertised Product Report`
6. review `Reports`, `Analysis`, `Tags`, and `Exports`

You do not need:

- AI keys
- Lingxing credentials
- Amazon SP-API
- internal SKU mappings

## Windows

From the repository root:

```powershell
.\start-backend.ps1
.\start-frontend.ps1
```

Or run both:

```powershell
.\start-all.ps1
```

## Manual Startup

### Backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

Windows PowerShell:

```powershell
.\.venv\Scripts\activate
```

macOS / Linux:

```bash
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8080
```

Health check:

- `http://127.0.0.1:8080/health`

### Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Typical local URL:

- `http://127.0.0.1:5173`

## Real Data Flow

If you want to use your own data, prepare:

- one `Search Term Report`
- one `Advertised Product Report`

Then:

1. open `Reports`
2. upload both reports
3. open `Analysis`
4. click `Run Analysis`
5. open `Tags`
6. open `Exports`

## Optional Enhancements

### AI

Open `AI Providers` and add:

- provider
- API key
- optional base URL
- optional model

Then go back to `Analysis` and enable `Enable AI Tagging`.

### Lingxing

Open `Lingxing` and fill:

- `App ID`
- `App Secret`
- `Base URL`

Then use:

- `Test Connection`
- `Sync Shops`
- `Sync sellerSKU`

## Expected Outputs

- high performance terms
- potential terms
- expensive no-order terms
- negative keyword suggestions
- sellerSKU summary
- full Excel workbook
