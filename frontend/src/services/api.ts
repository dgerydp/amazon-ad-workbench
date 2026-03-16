import { http } from "./http";
import type {
  AnalysisJobResult,
  DemoBootstrapResult,
  OverviewStats,
  ProviderConfigResponse,
  ReportBatch,
  SellerSku,
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
  createShop: async (payload: Partial<Shop>) => (await http.post<Shop>("/shops", payload)).data,

  listSellerSkus: async (shopId?: number) =>
    (await http.get<SellerSku[]>("/seller-skus", { params: shopId ? { shop_id: shopId } : {} })).data,
  createSellerSku: async (payload: Partial<SellerSku>) =>
    (await http.post<SellerSku>("/seller-skus", payload)).data,

  listBatches: async () => (await http.get<ReportBatch[]>("/report-batches")).data,
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
  bootstrapDemo: async (payload?: { reset?: boolean; use_ai?: boolean; provider?: string; model?: string }) =>
    (await http.post<DemoBootstrapResult>("/demo/bootstrap", payload ?? {})).data,

  runAnalysis: async (payload: { shop_id?: number; batch_id?: number; use_ai?: boolean; provider?: string; model?: string }) =>
    (await http.post<AnalysisJobResult>("/analysis/run", payload)).data,
  listAnalysisJobs: async () => (await http.get("/analysis/jobs")).data,

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
