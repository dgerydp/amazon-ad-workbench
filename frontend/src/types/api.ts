export interface Shop {
  id: number;
  name: string;
  marketplace: string;
  currency: string;
  source: string;
  external_shop_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerSku {
  id: number;
  shop_id: number;
  seller_sku: string;
  asin?: string | null;
  title?: string | null;
  status: string;
  cost?: number | null;
  inventory_qty?: number | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ReportBatch {
  id: number;
  shop_id?: number | null;
  report_type: string;
  filename: string;
  status: string;
  date_range_start?: string | null;
  date_range_end?: string | null;
  row_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJobResult {
  job_id: number;
  status: string;
  result?: Record<string, unknown> | null;
  error_message?: string | null;
}

export interface OverviewStats {
  search_term_reports: number;
  advertised_products: number;
  tokens: number;
  rule_hits: number;
}

export interface ProviderConfigResponse {
  id: number;
  provider: string;
  enabled: boolean;
}

export interface RuleCondition {
  field: string;
  op: string;
  value: number;
}

export interface PerformanceRule {
  id?: number;
  group_id?: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  priority: number;
  conditions: RuleCondition[];
  description?: string | null;
  action_advice?: string | null;
  is_active: boolean;
}

export interface RuleGroup {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  priority: number;
  rules: PerformanceRule[];
}

export interface CombinationTagCondition {
  group_name: string;
  tags: string[];
}

export interface CombinationRule {
  id?: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  priority: number;
  description?: string | null;
  action_advice?: string | null;
  is_active: boolean;
  tag_conditions: CombinationTagCondition[];
}
