/**
 * Contratos de la API de rentabilidad (envelope crudo del BE, documentado
 * por endpoint). Los campos son tolerantes (opcionales) porque el hook
 * desenvuelve `response.data ?? response`; los componentes leen con
 * fallbacks. PLAN_ALINEACION_BI_FRONTEND FASE 2.
 */

/** Recurso del servicio (antes era dispatch por string libre). */
export type ProfitabilityResource =
  | 'getDashboard'
  | 'getProducts'
  | 'getCustomers'
  | 'getCategories'
  | 'getTrends'
  | 'getSellers'

/** `'month'` o el objeto de params de las listas ({period, page, page_size}). */
export type ProfitabilityParams = string | Record<string, unknown>

export interface ProfitabilityPagination {
  page?: number
  page_size?: number
  total_items?: number
  total_pages?: number
}

// ---------------------------------------------------------------------------
// GET /profitability/dashboard?period=
// ---------------------------------------------------------------------------

export interface DashboardKpis {
  total_revenue?: number
  revenue_growth?: number
  total_profit?: number
  profit_growth?: number
  gross_margin_pct?: number
  gross_margin_growth?: number
  net_margin_pct?: number
  net_margin_growth?: number
  roi?: number
  roi_growth?: number
  profit_per_transaction?: number
  profit_per_tx_growth?: number
  [key: string]: unknown
}

export interface BreakEvenStatus {
  has_reached_break_even?: boolean
  coverage_required?: number
  current_progress?: number
  [key: string]: unknown
}

export interface ProfitabilityAlert {
  severity?: string
  time_ago?: string
  type?: string
  message?: string
  [key: string]: unknown
}

export interface EfficiencyTrendPoint {
  label?: string
  performance?: number
  profit_pct?: number
  [key: string]: unknown
}

export interface DashboardData {
  kpis?: DashboardKpis
  break_even_status?: BreakEvenStatus
  alerts?: ProfitabilityAlert[]
  efficiency_trend?: { data_points?: EfficiencyTrendPoint[] } | null
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// GET /profitability/products?period=&page=&page_size=
// ---------------------------------------------------------------------------

export type PerformanceLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'LOSS'

export interface ProductProfitabilityItem {
  product_id?: string | number
  product_name?: string
  sku?: string
  units_sold?: number
  revenue?: number
  gross_profit?: number
  gross_margin_pct?: number
  markup?: number
  performance?: string
  [key: string]: unknown
}

/** Campos de resumen compartidos por las vistas de lista. */
export interface ProfitabilityListSummary {
  total_products?: number
  total_products_growth?: number
  average_margin?: number
  margin_growth?: number
  total_profit?: number
  profit_growth?: number
  total_revenue?: number
  revenue_growth?: number
  total_customers?: number
  total_customers_growth?: number
  total_categories?: number
  average_customer_value?: number
  avg_value_growth?: number
  [key: string]: unknown
}

export interface ProductProfitabilityData {
  products?: ProductProfitabilityItem[]
  summary?: ProfitabilityListSummary
  pagination?: ProfitabilityPagination
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// GET /profitability/customers?period=&page=&page_size=
// ---------------------------------------------------------------------------

export interface CustomerProfitabilityItem {
  customer_id?: string | number
  customer_name?: string
  segment?: string
  total_revenue?: number
  gross_profit?: number
  gross_margin_pct?: number
  total_purchases?: number
  [key: string]: unknown
}

export interface CustomerProfitabilityData {
  customers?: CustomerProfitabilityItem[]
  summary?: ProfitabilityListSummary
  pagination?: ProfitabilityPagination
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// GET /profitability/categories?period=
// ---------------------------------------------------------------------------

export interface CategoryProfitabilityItem {
  id?: string | number
  label?: string
  revenue?: number
  gross_profit?: number
  gross_margin_pct?: number
  transactions?: number
  [key: string]: unknown
}

export interface CategoryProfitabilityData {
  categories?: CategoryProfitabilityItem[]
  summary?: ProfitabilityListSummary
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// GET /profitability/trends?period=&granularity=
// ---------------------------------------------------------------------------

export interface TrendsDataPoint {
  label?: string
  revenue?: number
  gross_profit?: number
  transactions?: number
  [key: string]: unknown
}

export interface ProfitabilityInsight {
  type?: string
  title?: string
  message?: string
  [key: string]: unknown
}

export interface TrendsData {
  data_points?: TrendsDataPoint[]
  summary?: {
    insights?: ProfitabilityInsight[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// GET /profitability/sellers?period=
// ---------------------------------------------------------------------------

export interface SellerSummary {
  total_profit?: number
  average_operating_margin?: number
  margin_objective?: number
  average_profit_per_seller?: number
  profit_growth?: number
  [key: string]: unknown
}

export interface ContributionShareItem {
  label?: string
  pct?: number
  [key: string]: unknown
}

export interface SellerProfitabilityData {
  sellers?: Array<{
    rank?: number
    seller_name?: string
    gross_profit?: number
    gross_margin_pct?: number
    transactions?: number
    revenue?: number
    total_sales?: number
    total_revenue?: number
    [key: string]: unknown
  }>
  summary?: SellerSummary
  contribution_share?: ContributionShareItem[]
  [key: string]: unknown
}
