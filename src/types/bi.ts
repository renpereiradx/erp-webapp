/**
 * Tipos e interfaces para la suite de Business Intelligence (BI).
 *
 * Los payloads de `/dashboard/*` reflejan el contrato REAL del backend
 * (`business_management/models/dashboard.go`): `DashboardSummary` es un objeto
 * anidado por área, no la forma plana legacy `total_revenue/total_orders` que
 * nunca existió en el endpoint. Mantener este contrato es lo que evita el
 * drift NA-DB-1 (cifras en cero con la API llena) que motivó la
 * re-implementación del PLAN_REBUILD_BI_UI_FRONTEND.
 */

export interface BIParams {
  branch_id?: number;
  period?: string; // 'today' | 'week' | 'month' | 'year'
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  page?: number;
  page_size?: number;
  brand_id?: number;
  tag?: string[];
  compare?: boolean; // sales-analytics: incluye comparación con periodo anterior
  granularity?: string; // sales-analytics/trends: 'daily' | 'hourly'
}

export interface BIScope {
  consolidated: boolean;
  branch_id?: number;
}

/** Metadata común del envelope BI (`respondSuccess` en el backend). */
export interface BIMetadata {
  generated_at?: string;
  scope?: BIScope;
  period?: DashboardPeriod;
  /** true cuando alguna sub-consulta del payload falló (T8/BR-4a). */
  partial?: boolean;
  partial_errors?: string[];
}

/** Envelope uniforme de todos los endpoints BI. */
export interface BIEnvelope<T> {
  success?: boolean;
  data: T;
  metadata?: BIMetadata;
}

// --- Dashboard: períodos y resumen -----------------------------------------

/** Períodos aceptados por `/dashboard/*` (`parsePeriodQuery` del backend). */
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

export interface DashboardPeriodParams {
  period?: DashboardPeriod;
}

export interface SalesSummary {
  total: number;
  count: number;
  average_ticket: number;
  currency: string;
}

export interface PurchasesSummary {
  total: number;
  count: number;
  currency: string;
}

export interface ProfitSummary {
  gross: number;
  margin_percentage: number;
}

export interface InventorySummary {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_value: number;
}

export interface CashRegistersSummary {
  open_count: number;
  total_balance: number;
}

export interface ReceivablesSummary {
  total_pending: number;
  overdue_count: number;
}

export interface PayablesSummary {
  total_pending: number;
  due_this_week: number;
}

export interface ReservesSummary {
  today_count: number;
  pending_confirmation: number;
}

/** Respuesta de `GET /dashboard/summary` (objeto anidado por área). */
export interface DashboardSummary {
  sales: SalesSummary;
  purchases: PurchasesSummary;
  profit: ProfitSummary;
  inventory: InventorySummary;
  cash_registers: CashRegistersSummary;
  receivables: ReceivablesSummary;
  payables: PayablesSummary;
  reserves: ReservesSummary;
}

// --- Dashboard: KPIs --------------------------------------------------------

export interface SalesKPIs {
  average_ticket: number;
  sales_per_day: number;
  conversion_rate: number;
  repeat_customer_rate: number;
}

export interface InventoryKPIs {
  turnover_rate: number;
  days_of_inventory: number;
  stockout_rate: number;
}

export interface FinancialKPIs {
  gross_margin: number;
  net_margin: number;
  operating_expense_ratio: number;
}

export interface CustomerKPIs {
  new_customers: number;
  active_customers: number;
  total_customers: number;
  average_purchase_frequency: number;
}

export interface BudgetKPIs {
  budget_to_sale_conversion: number;
  average_budget_value: number;
  expired_budgets: number;
}

/** Respuesta de `GET /dashboard/kpis` (5 grupos anidados). */
export interface DashboardKPIs {
  sales_kpis: SalesKPIs;
  inventory_kpis: InventoryKPIs;
  financial_kpis: FinancialKPIs;
  customer_kpis: CustomerKPIs;
  budget_kpis: BudgetKPIs;
}

// --- Dashboard: tendencias --------------------------------------------------

export interface TrendData {
  current: number;
  previous: number;
  change_amount: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable' | string;
}

export interface DashboardTrends {
  sales: TrendData;
  purchases: TrendData;
  gross_margin: TrendData;
  average_ticket: TrendData;
  customer_count: TrendData;
}

// --- Dashboard: alertas -----------------------------------------------------

export interface OutOfStockProduct {
  id: string;
  name: string;
}

/** Payload heterogéneo de `Alert.details`; cada tipo llena solo sus campos. */
export interface AlertDetails {
  count?: number;
  total?: number;
  products?: OutOfStockProduct[];
}

export interface DashboardAlert {
  id: string;
  category: string; // inventory | financial | sales | ...
  severity: string; // critical | warning | info
  title: string;
  message: string;
  details?: AlertDetails;
  action_url?: string;
  created_at?: string;
}

export interface AlertSummary {
  total: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
}

export interface DashboardAlerts {
  alerts: DashboardAlert[];
  summary: AlertSummary;
}

// --- Dashboard: top products ------------------------------------------------

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
  margin_percentage: number;
  trend: 'up' | 'down' | 'stable' | string;
  trend_percentage: number;
  variant_id?: string;
  variant_name?: string;
  variant_sku?: string;
  brand_id?: number;
  brand_name?: string;
  tags?: string[];
}

export interface TopProductsResponse {
  products: TopProduct[];
  total_revenue: number;
  total_profit: number;
}

/** Ordenamientos aceptados por `GET /dashboard/top-products?sort_by=`. */
export type TopProductSort = 'revenue' | 'quantity' | 'profit';

// --- Dashboard: heatmap -----------------------------------------------------

export interface SalesHeatmapEntry {
  day: number; // 0=domingo, 1=lunes, … 6=sábado
  hour: number; // 0-23
  sales_count: number;
  sales_total: number;
}

export interface HeatmapPeakTime {
  day: string; // el backend emite el nombre en español ("Martes")
  hour: number;
  average_sales: number;
}

export interface SalesHeatmapResponse {
  heatmap: SalesHeatmapEntry[];
  peak_times: HeatmapPeakTime[];
  slow_times: HeatmapPeakTime[];
}

// --- Dashboard: actividad reciente -----------------------------------------

export interface RecentActivityDetails {
  entity_id?: string;
  entity_type?: string;
}

export interface RecentActivityItem {
  id: string;
  type: string; // sale | purchase | payment | adjustment
  description: string;
  amount: number;
  user: string;
  timestamp: string;
  details?: RecentActivityDetails;
}

export interface RecentActivityResponse {
  activities: RecentActivityItem[];
}

// --- Otros contextos BI (conservados para las fases F3-F11) -----------------

export interface FinancialOverview {
  total_amount: number;
  overdue_amount: number;
  pending_amount: number;
  count: number;
}

export interface AgingReportItem {
  range: '0-30' | '31-60' | '61-90' | '90+';
  amount: number;
  percentage: number;
}

export interface SalesPerformance {
  period: string;
  revenue: number;
  orders: number;
  cost: number;
  profit: number;
}

export interface StockLevelItem {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  is_low_stock: boolean;
}

export interface InventoryTurnover {
  product_id: string;
  product_name: string;
  turnover_rate: number;
  days_in_stock: number;
}
