import { http } from "./http";
import type {
  AnalysisJobResult,
  CombinationRule,
  OverviewStats,
  PerformanceRule,
  ProviderConfigResponse,
  ReportBatch,
  RuleGroup,
  Shop,
} from "../types/api";

export const api = {
  getOverview: async () => (await http.get<OverviewStats>("/insights/overview")).data,
  getSearchTerms: async () => (await http.get("/insights/search-terms")).data,
  getTokens: async () => (await http.get("/insights/tokens")).data,
  getSellerSkuInsights: async () => (await http.get("/insights/seller-skus")).data,
  getRuleHits: async () => (await http.get("/insights/rule-hits")).data,
  getTagSummary: async () => (await http.get("/insights/tag-summary")).data,

  listShops: async () => (await http.get<Shop[]>("/shops")).data,

  listBatches: async () => (await http.get<ReportBatch[]>("/report-batches")).data,
  deleteBatch: async (batchId: number) => (await http.delete(`/report-batches/${batchId}`)).data,
  clearBatches: async () => (await http.delete("/report-batches")).data,
  uploadSearchTerms: async (file: File, shopId?: number | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (shopId) {
      formData.append("shop_id", String(shopId));
    }
    return (await http.post<ReportBatch>("/report-batches/search-terms/upload", formData)).data;
  },
  uploadAdvertisedProducts: async (file: File, shopId?: number | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (shopId) {
      formData.append("shop_id", String(shopId));
    }
    return (await http.post<ReportBatch>("/report-batches/advertised-products/upload", formData)).data;
  },

  runAnalysis: async (payload: { shop_id?: number; batch_id?: number; use_ai?: boolean; provider?: string; model?: string }) =>
    (await http.post<AnalysisJobResult>("/analysis/run", payload)).data,
  listAnalysisJobs: async () => (await http.get("/analysis/jobs")).data,

  getRuleGroups: async () => (await http.get<{ field_options: Array<{ value: string; label: string }>; groups: RuleGroup[] }>("/rules/groups")).data,
  updateRuleGroup: async (groupId: number, payload: { description?: string | null; is_active: boolean; priority: number }) =>
    (await http.put<RuleGroup>(`/rules/groups/${groupId}`, payload)).data,
  createRule: async (payload: PerformanceRule & { group_id: number }) =>
    (await http.post<PerformanceRule>("/rules/rules", payload)).data,
  updateRule: async (ruleId: number, payload: PerformanceRule) =>
    (await http.put<PerformanceRule>(`/rules/rules/${ruleId}`, payload)).data,
  deleteRule: async (ruleId: number) => (await http.delete(`/rules/rules/${ruleId}`)).data,
  getCombinationRules: async () => (await http.get<{ rules: CombinationRule[] }>("/rules/combinations")).data,
  createCombinationRule: async (payload: CombinationRule) =>
    (await http.post<CombinationRule>("/rules/combinations", payload)).data,
  updateCombinationRule: async (ruleId: number, payload: CombinationRule) =>
    (await http.put<CombinationRule>(`/rules/combinations/${ruleId}`, payload)).data,
  deleteCombinationRule: async (ruleId: number) => (await http.delete(`/rules/combinations/${ruleId}`)).data,

  listProviders: async () => (await http.get("/providers")).data,
  testProvider: async (payload: { provider: string; api_key?: string; base_url?: string; model?: string }) =>
    (await http.post("/providers/test", payload)).data,
  saveProviderConfig: async (payload: {
    provider: string;
    base_url?: string;
    model?: string;
    api_key?: string;
    enabled?: boolean;
  }) => (await http.post<ProviderConfigResponse>("/providers/configs", payload)).data,

  testLingxing: async (payload: { app_id?: string; app_secret?: string; base_url?: string }) =>
    (await http.post("/connectors/lingxing/test", payload)).data,
  syncLingxingShops: async (payload: { app_id?: string; app_secret?: string; base_url?: string }) =>
    (await http.post("/connectors/lingxing/sync/shops", payload)).data,
  syncLingxingSellerSkus: async (payload: { app_id?: string; app_secret?: string; base_url?: string }, shopId?: number) =>
    (await http.post("/connectors/lingxing/sync/seller-skus", payload, { params: shopId ? { shop_id: shopId } : {} })).data,
  exportUrl: (type: "high-performance" | "negative-keywords" | "seller-sku-summary") =>
    `${http.defaults.baseURL}/exports/${type}`,
  excelExportUrl: () => `${http.defaults.baseURL}/exports/full-analysis.xlsx`,
};
