from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_full_smoke_flow():
    with TestClient(app) as client:
        suffix = uuid4().hex[:8]
        shop = client.post("/api/shops", json={"name": f"Smoke Shop {suffix}", "marketplace": "US", "currency": "USD"})
        assert shop.status_code == 200
        shop_id = shop.json()["id"]

        sku = client.post(
            "/api/seller-skus",
            json={"shop_id": shop_id, "seller_sku": f"SMOKE-SKU-{suffix}", "asin": f"B00{suffix.upper()}"},
        )
        assert sku.status_code == 200

        product_csv = (
            b"Date,Campaign Name,Ad Group Name,Advertised SKU,Advertised ASIN,Impressions,Clicks,Spend,7 Day Total Sales,7 Day Total Orders,7 Day Total Units\n"
            + f"2026-03-01,Smoke Campaign {suffix},Smoke Group,SMOKE-SKU-{suffix},B00{suffix.upper()},1200,22,28.5,130,4,4\n".encode("utf-8")
        )
        search_csv = (
            b"Date,Campaign Name,Ad Group Name,Customer Search Term,Impressions,Clicks,Spend,7 Day Total Sales,7 Day Total Orders,7 Day Total Units\n"
            + f"2026-03-01,Smoke Campaign {suffix},Smoke Group,red toddler outfit {suffix},900,14,19.0,100,2,2\n".encode("utf-8")
        )

        product_upload = client.post(
            "/api/report-batches/advertised-products/upload",
            files={"file": ("advertised.csv", product_csv, "text/csv")},
            data={"shop_id": str(shop_id)},
        )
        assert product_upload.status_code == 200

        search_upload = client.post(
            "/api/report-batches/search-terms/upload",
            files={"file": ("search.csv", search_csv, "text/csv")},
            data={"shop_id": str(shop_id)},
        )
        assert search_upload.status_code == 200

        analysis = client.post("/api/analysis/run", json={"shop_id": shop_id, "use_ai": False})
        assert analysis.status_code == 200
        assert analysis.json()["status"] == "completed"

        tokens = client.get("/api/insights/tokens")
        assert tokens.status_code == 200
        assert len(tokens.json()) >= 1

        export = client.get("/api/exports/full-analysis.xlsx")
        assert export.status_code == 200
        assert export.headers["content-disposition"].startswith('attachment; filename="full-analysis.xlsx"')

def test_health_and_rules_available():
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        rules = client.get("/api/rules/groups")
        assert rules.status_code == 200
        payload = rules.json()
        assert isinstance(payload.get("field_options"), list)
        assert isinstance(payload.get("groups"), list)
        assert len(payload["groups"]) >= 1
