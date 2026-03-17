from fastapi import APIRouter

from app.api.routes import analysis, exports, insights, lingxing, providers, report_batches, rules, seller_skus, shops


api_router = APIRouter()
api_router.include_router(shops.router, prefix="/shops", tags=["shops"])
api_router.include_router(seller_skus.router, prefix="/seller-skus", tags=["seller-skus"])
api_router.include_router(report_batches.router, prefix="/report-batches", tags=["report-batches"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(rules.router, prefix="/rules", tags=["rules"])
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_router.include_router(lingxing.router, prefix="/connectors/lingxing", tags=["lingxing"])
