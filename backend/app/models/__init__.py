from app.models.advertised_product import AdvertisedProduct
from app.models.analysis_job import AnalysisJob
from app.models.performance_rule import CombinationRule, PerformanceRule, PerformanceRuleGroup, PerformanceRuleHit
from app.models.provider_config import ProviderConfig
from app.models.report_batch import ReportBatch
from app.models.rule import RuleHit, RuleItem, RuleSet
from app.models.search_term_link import SearchTermLink
from app.models.search_term_report import SearchTermReport
from app.models.search_term_token import SearchTermToken
from app.models.semantic_tag import SemanticTag
from app.models.seller_sku import SellerSKU
from app.models.shop import Shop

all_models = [
    Shop,
    SellerSKU,
    ReportBatch,
    AdvertisedProduct,
    SearchTermReport,
    SearchTermLink,
    SearchTermToken,
    SemanticTag,
    PerformanceRuleGroup,
    PerformanceRule,
    CombinationRule,
    PerformanceRuleHit,
    RuleSet,
    RuleItem,
    RuleHit,
    ProviderConfig,
    AnalysisJob,
]
