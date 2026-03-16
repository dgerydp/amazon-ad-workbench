from __future__ import annotations

from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.advertised_product import AdvertisedProduct
from app.models.report_batch import ReportBatch
from app.models.rule import RuleHit
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag
from app.models.seller_sku import SellerSKU
from app.models.shop import Shop
from app.services.analysis import run_full_analysis
from app.services.report_ingest import create_batch_and_ingest


DEMO_SHOP_NAME = "Demo Baby Apparel Shop"
DEMO_SHOP_SOURCE = "demo"


def _examples_dir() -> Path:
    return Path(__file__).resolve().parents[3] / "examples" / "reports"


def _load_example(name: str) -> bytes:
    return (_examples_dir() / name).read_bytes()


def _remove_demo_dataset(db: Session) -> None:
    demo_shop_ids = list(db.scalars(select(Shop.id).where(Shop.source == DEMO_SHOP_SOURCE)).all())
    if not demo_shop_ids:
        return

    report_ids = list(
        db.scalars(select(SearchTermReport.id).where(SearchTermReport.shop_id.in_(demo_shop_ids))).all()
    )
    token_ids = list(
        db.scalars(select(SearchTermToken.id).where(SearchTermToken.shop_id.in_(demo_shop_ids))).all()
    )

    if token_ids:
        db.execute(delete(RuleHit).where(RuleHit.target_type == "search_term_token", RuleHit.target_id.in_(token_ids)))
        db.execute(delete(SemanticTag).where(SemanticTag.token_id.in_(token_ids)))
        db.execute(delete(SearchTermToken).where(SearchTermToken.id.in_(token_ids)))
    if report_ids:
        db.execute(delete(SearchTermLink).where(SearchTermLink.search_term_report_id.in_(report_ids)))
        db.execute(delete(SearchTermReport).where(SearchTermReport.id.in_(report_ids)))

    db.execute(delete(AdvertisedProduct).where(AdvertisedProduct.shop_id.in_(demo_shop_ids)))
    db.execute(delete(ReportBatch).where(ReportBatch.shop_id.in_(demo_shop_ids)))
    db.execute(delete(SellerSKU).where(SellerSKU.shop_id.in_(demo_shop_ids)))
    db.execute(delete(Shop).where(Shop.id.in_(demo_shop_ids)))
    db.commit()


def bootstrap_demo_data(
    db: Session,
    reset: bool = False,
    use_ai: bool = False,
    provider: str | None = None,
    model: str | None = None,
) -> dict:
    if reset:
        _remove_demo_dataset(db)

    demo_shop = db.scalar(select(Shop).where(Shop.source == DEMO_SHOP_SOURCE).order_by(Shop.id.desc()))
    if demo_shop is None:
        demo_shop = Shop(
            source=DEMO_SHOP_SOURCE,
            external_shop_id="demo-us",
            name=DEMO_SHOP_NAME,
            marketplace="US",
            currency="USD",
        )
        db.add(demo_shop)
        db.commit()
        db.refresh(demo_shop)

        db.add_all(
            [
                SellerSKU(
                    shop_id=demo_shop.id,
                    seller_sku="DEMO-BABY-RED-001",
                    asin="B0DEMO0001",
                    title="Demo Baby Outfit Set Red",
                    cost=8.5,
                    inventory_qty=128,
                    source=DEMO_SHOP_SOURCE,
                ),
                SellerSKU(
                    shop_id=demo_shop.id,
                    seller_sku="DEMO-BABY-BLUE-002",
                    asin="B0DEMO0002",
                    title="Demo Baby Outfit Set Blue",
                    cost=8.8,
                    inventory_qty=92,
                    source=DEMO_SHOP_SOURCE,
                ),
            ]
        )
        db.commit()

    existing_search_terms = db.scalar(
        select(SearchTermReport.id).where(SearchTermReport.shop_id == demo_shop.id).limit(1)
    )
    if existing_search_terms is None:
        create_batch_and_ingest(
            db=db,
            report_type="advertised_product",
            filename="advertised-product-sample.csv",
            content=_load_example("advertised-product-sample.csv"),
            shop_id=demo_shop.id,
        )
        create_batch_and_ingest(
            db=db,
            report_type="search_term",
            filename="search-term-sample.csv",
            content=_load_example("search-term-sample.csv"),
            shop_id=demo_shop.id,
        )

    job = run_full_analysis(db, shop_id=demo_shop.id, use_ai=use_ai, provider=provider, model=model)
    return {
        "ok": True,
        "shop_id": demo_shop.id,
        "shop_name": demo_shop.name,
        "analysis_job_id": job.id,
        "analysis_status": job.status,
        "analysis_result": job.result,
    }
