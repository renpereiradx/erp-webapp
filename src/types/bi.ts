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

// Los tipos legacy `StockLevelItem`/`InventoryTurnover` se eliminaron en F5:
// describían una forma que ningún endpoint devolvía y quedaron sin consumidores
// tras el teardown F1. El contrato real vive en la sección de Analítica de
// Inventario al final del archivo.

// --- Analítica de Ventas (F4) ----------------------------------------------
//
// Contrato REAL de `/sales-analytics/*`
// (`business_management/models/sales_analytics.go` + `internal/analytics/http.go`
// + `internal/analytics/http_discounts.go`). El envelope es `BIEnvelope<T>`;
// `metadata` solo agrega los campos que el handler correspondiente escribe.
//
// Campos que el backend NO completa (viajan con el zero-value de Go y por eso
// la UI no los muestra): `ProductSalesData.growth_pct`,
// `CategorySalesData.growth/growth_pct`, `SalesAnalyticsKPIs.*_growth_pct`,
// `SalesPerformance.returns`, `TrendSummary.volatility`,
// `SellerSalesData.target_progress/conversion_rate` y
// `SalesAnalyticsDashboard.alerts`.

/** Rango de fechas de un reporte (`models.ReportPeriod`). */
export interface BIReportPeriod {
  start_date: string;
  end_date: string;
  type?: string;
}

export interface BIPaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

// Performance -----------------------------------------------------------------

export interface SalesReturns {
  total_returns: number;
  return_count: number;
  return_rate: number;
}

export interface SalesPerformanceComparison {
  previous_period: BIReportPeriod;
  sales_change: number;
  sales_change_pct: number;
  transactions_change: number;
  transactions_change_pct: number;
  ticket_change: number;
  ticket_change_pct: number;
}

/** Respuesta de `GET /sales-analytics/performance` (con `compare=true`). */
export interface SalesPerformance {
  period: BIReportPeriod;
  total_sales: number;
  total_transactions: number;
  average_ticket: number;
  total_units: number;
  unique_customers: number;
  /** Utilidad bruta en moneda base (no confundir con `gross_margin_pct`). */
  gross_margin: number;
  gross_margin_pct: number;
  returns: SalesReturns;
  comparison?: SalesPerformanceComparison;
}

// Tendencias ------------------------------------------------------------------

export interface SalesTrendPoint {
  timestamp: string;
  /** Etiqueta cruda del BE; la UI prefiere formatear `timestamp` con su locale. */
  label: string;
  sales: number;
  transactions: number;
  units: number;
  average_ticket: number;
}

export interface SalesTrendSummary {
  trend_direction: 'UP' | 'DOWN' | 'STABLE' | string;
  /** Variación entre el primer y el último punto de la serie. */
  growth_rate: number;
  peak_period: string;
  peak_value: number;
  low_period: string;
  low_value: number;
  volatility: number;
}

export type SalesTrendGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface SalesTrends {
  period: BIReportPeriod;
  granularity: SalesTrendGranularity | string;
  data_points: SalesTrendPoint[];
  summary: SalesTrendSummary;
}

// Categorías ------------------------------------------------------------------

export interface CategorySalesData {
  category_id: string;
  category_name: string;
  sales: number;
  percentage: number;
  transactions: number;
  units_sold: number;
  average_price: number;
  gross_margin: number;
  gross_margin_pct: number;
  growth: number;
  growth_pct: number;
  top_product: string;
  top_product_sales: number;
}

export interface SalesByCategory {
  period: BIReportPeriod;
  categories: CategorySalesData[];
  /** Suma de las categorías devueltas (no necesariamente el total de la empresa). */
  total_sales: number;
}

// Productos -------------------------------------------------------------------

export interface ProductSalesData {
  product_id: string;
  product_name: string;
  /** Drift del BE: `sku` es el id del producto, no un SKU real. No mostrarlo. */
  sku: string;
  category_name: string;
  sales: number;
  units_sold: number;
  average_price: number;
  cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  transactions: number;
  last_sale_date: string;
  /** Rank por ventas (no por el `sort_by` pedido). No mostrarlo como columna. */
  rank: number;
  growth_pct: number;
  variant_id?: string | null;
  variant_name?: string | null;
  variant_sku?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  tags?: string[];
}

/** `sort_by` aceptado por `GET /sales-analytics/by-product` (whitelist BE). */
export type SalesProductSort = 'sales' | 'units' | 'margin' | 'name' | 'last_sale';
export type SalesSortOrder = 'asc' | 'desc';

export interface SalesByProduct {
  period: BIReportPeriod;
  products: ProductSalesData[];
  pagination: BIPaginationInfo;
}

export interface TopBottomProducts {
  period: BIReportPeriod;
  top_sellers: ProductSalesData[];
  bottom_sellers: ProductSalesData[];
  top_by_margin: ProductSalesData[];
  top_by_volume: ProductSalesData[];
}

// Clientes --------------------------------------------------------------------

export interface CustomerSalesSummary {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  /** Histórico acotado al fin del período (BC-9). */
  average_lifetime_value: number;
  /** Mayor valor histórico de un cliente, acotado al fin del período. */
  top_customer_revenue: number;
  /** Recurrentes / clientes del período × 100. */
  customer_retention_rate: number;
}

export interface CustomerSalesData {
  customer_id: string;
  customer_name: string;
  customer_ruc?: string;
  total_purchases: number;
  transaction_count: number;
  average_ticket: number;
  last_purchase: string;
  first_purchase: string;
  frequency: 'FREQUENT' | 'REGULAR' | 'OCCASIONAL' | 'NEW' | string;
  segment: 'VIP' | 'PREMIUM' | 'STANDARD' | 'NEW' | string;
  growth_pct: number;
  top_category: string;
  top_product: string;
}

export interface SalesByCustomer {
  period: BIReportPeriod;
  customers: CustomerSalesData[];
  summary: CustomerSalesSummary;
  pagination: BIPaginationInfo;
}

// Vendedores ------------------------------------------------------------------

export interface SellerSalesData {
  seller_id: string;
  seller_name: string;
  total_sales: number;
  transaction_count: number;
  units_sold: number;
  average_ticket: number;
  gross_margin: number;
  gross_margin_pct: number;
  /** Rank por ventas (el listado siempre viene ordenado por ventas). */
  rank: number;
  target_progress?: number;
  top_category: string;
  conversion_rate?: number;
}

export interface SalesBySeller {
  period: BIReportPeriod;
  sellers: SellerSalesData[];
  /** El repo copia la página actual: no son rankings independientes. */
  rankings: {
    by_sales: SellerSalesData[];
    by_transactions: SellerSalesData[];
    by_margin: SellerSalesData[];
  };
  pagination: BIPaginationInfo;
}

// Métodos de pago -------------------------------------------------------------

export interface PaymentMethodSales {
  method: string;
  display_name: string;
  sales: number;
  percentage: number;
  transaction_count: number;
  average_ticket: number;
  growth_pct: number;
}

export interface SalesByPaymentMethod {
  period: BIReportPeriod;
  payment_methods: PaymentMethodSales[];
  total_sales: number;
}

// Dashboard consolidado -------------------------------------------------------

export interface SalesAnalyticsKPIs {
  total_sales: number;
  sales_growth_pct: number;
  total_transactions: number;
  transactions_growth_pct: number;
  average_ticket: number;
  ticket_growth_pct: number;
  gross_margin_pct: number;
  margin_growth_pct: number;
  unique_customers: number;
  customers_growth_pct: number;
  sales_per_employee?: number;
}

export interface SalesAlert {
  type: string;
  category: string;
  message: string;
  value?: number;
  threshold?: number;
  severity: string;
}

export interface SalesAnalyticsDashboard {
  generated_at: string;
  period: BIReportPeriod;
  kpis: SalesAnalyticsKPIs;
  trends: SalesTrendPoint[];
  top_products: ProductSalesData[];
  top_categories: CategorySalesData[];
  payment_mix: PaymentMethodSales[];
  /** El repo lo devuelve siempre vacío: la UI no renderiza alertas. */
  alerts: SalesAlert[];
}

// Comparación de períodos -----------------------------------------------------

export interface SalesComparisonPeriod {
  period: BIReportPeriod;
  total_sales: number;
  total_transactions: number;
  total_units: number;
  average_ticket: number;
  unique_customers: number;
  /** Utilidad bruta en moneda base. */
  gross_margin: number;
}

export interface SalesComparisonDiff {
  sales_change: number;
  sales_change_pct: number;
  transactions_change: number;
  transactions_change_pct: number;
  units_change: number;
  units_change_pct: number;
  ticket_change: number;
  ticket_change_pct: number;
  customers_change: number;
  customers_change_pct: number;
  margin_change: number;
  margin_change_pct: number;
}

/**
 * Respuesta de `GET /sales-analytics/compare`.
 * `period_1` es el período A (actual o el primero de la lista) y `period_2` el
 * B; las diferencias son `A − B`, todas en la unidad de cada métrica (las
 * variaciones son porcentajes relativos, no puntos porcentuales).
 */
export interface SalesComparison {
  period_1: SalesComparisonPeriod;
  period_2: SalesComparisonPeriod;
  differences: SalesComparisonDiff;
}

// Velocidad -------------------------------------------------------------------

export interface VelocityMetrics {
  sales_per_day: number;
  sales_per_hour: number;
  transactions_per_day: number;
  transactions_per_hour: number;
  units_per_day: number;
  units_per_hour: number;
  avg_minutes_between_sales: number;
}

export interface CategoryVelocity {
  category_id: string;
  category_name: string;
  units_per_day: number;
  sales_per_day: number;
  days_to_sellout?: number;
}

export interface ProductVelocity {
  product_id: string;
  product_name: string;
  units_per_day: number;
  sales_per_day: number;
  current_stock: number;
  days_to_sellout?: number;
  velocity: 'FAST' | 'MEDIUM' | 'SLOW' | string;
}

export interface SalesVelocity {
  period: BIReportPeriod;
  overall: VelocityMetrics;
  by_category: CategoryVelocity[];
  by_product: ProductVelocity[];
}

// Ventas por hora / día de la semana -----------------------------------------

export interface HourlySales {
  hour: number;
  sales: number;
  transactions: number;
  percentage: number;
}

export interface SalesByHour {
  period: BIReportPeriod;
  hourly_data: HourlySales[];
  peak_hour: number;
  peak_sales: number;
}

export interface DayOfWeekSales {
  /** 0=Domingo … 6=Sábado. */
  day_of_week: number;
  /** Nombre en español emitido por el BE; la UI traduce por índice. */
  day_name: string;
  sales: number;
  transactions: number;
  average_ticket: number;
  percentage: number;
}

export interface SalesByDayOfWeek {
  period: BIReportPeriod;
  daily_data: DayOfWeekSales[];
  best_day: string;
  best_sales: number;
}

// Heatmap (contrato conservado; F4 no lo consume) -----------------------------

export interface SalesHeatmapData {
  period: BIReportPeriod;
  /** [day][hour] — siempre 7×24, sin ventas = 0. */
  data: number[][];
  labels: { days: string[]; hours: string[] };
  summary: {
    peak_day: string;
    peak_hour: number;
    peak_value: number;
    quiet_day: string;
    quiet_hour: number;
    /** -1 cuando no hubo ninguna venta en el período. */
    quiet_value: number;
  };
}

// Descuentos ------------------------------------------------------------------

export interface DiscountLine {
  sale_id: string;
  sale_date: string;
  branch_id: number | null;
  seller_user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  /** Precio unitario antes del descuento. */
  unit_price_original: number;
  /** Precio unitario final. */
  unit_price: number;
  /** Descuento de la LÍNEA (no unitario). */
  discount_amount: number;
  discount_percent: number | null;
  discount_reason: string | null;
  discount_applied_by: string;
  applied_by_name: string;
}

export interface DiscountSummaryRow {
  group_key: string;
  group_name: string;
  discount_count: number;
  total_discount: number;
}

export type DiscountGroupBy = 'seller' | 'applier' | 'branch';

/** `metadata` de `GET /sales-analytics/discounts`. */
export interface DiscountLinesMetadata extends BIMetadata {
  start_date: string;
  end_date: string;
  total_count: number;
}

/** `metadata` de `GET /sales-analytics/discounts/summary`. */
export interface DiscountSummaryMetadata extends BIMetadata {
  group_by: DiscountGroupBy;
  start_date: string;
  end_date: string;
}

// Parámetros ------------------------------------------------------------------

export interface SalesPeriodParams {
  period?: DashboardPeriod;
}

export interface SalesLimitParams extends SalesPeriodParams {
  limit?: number;
}

export interface SalesPageParams extends SalesPeriodParams {
  page?: number;
  page_size?: number;
}

export interface SalesProductParams extends SalesPageParams {
  sort_by?: SalesProductSort;
  sort_order?: SalesSortOrder;
}

export interface SalesTrendsParams extends SalesPeriodParams {
  granularity?: SalesTrendGranularity;
}

export interface SalesComparisonParams {
  /** Modo período: el BE compara contra la ventana previa equivalente. */
  period?: DashboardPeriod;
  /** Modo rangos: los 4 extremos son obligatorios (YYYY-MM-DD). */
  start1?: string;
  end1?: string;
  start2?: string;
  end2?: string;
}

export interface DiscountsParams {
  start_date: string;
  end_date: string;
  branch_id?: number;
  page?: number;
  page_size?: number;
}

export interface DiscountSummaryParams {
  start_date: string;
  end_date: string;
  group_by?: DiscountGroupBy;
  branch_id?: number;
}

// --- Analítica de Inventario (F5) -------------------------------------------
//
// Contrato REAL de `/inventory-analytics/*` (`business_management/models/
// inventory_analytics.go` + `internal/analytics/http_inventory.go`). Envelope
// `BIEnvelope<T>`. El grupo va detrás de `RequireModule('bi')` →
// `analytics:read` en el backend.
//
// Campos que el BE NO completa y por eso la UI no muestra:
//   - `InventoryStockStatus` es un conteo por umbrales que se superponen
//     (`in_stock` > 5 incluye `overstock` > 15): no se grafica como torta.
//   - `ProductStockLevel.min_stock/max_stock/reorder_point` son constantes
//     (5/15/5) del SQL, no configuración real del producto.
//   - `StockLevelsReport.summary.total_units/total_value/average_stock/
//     median_stock` suman SOLO la página (o no se calculan): la UI los rotula
//     "en esta página" o no los muestra.
//   - `TurnoverMetrics.average_inventory` es el valor ACTUAL del stock a costo,
//     no un promedio del período.
//   - `ABCSummary.total_value`/`class_*_value` son ventas del período, no valor
//     de inventario; `ABCProduct.turnover_rate` viaja siempre en 0 (el SELECT
//     no lo calcula) y `sku` es el id del producto.
//   - `DeadStockSummary.potential_loss` es `total_value * 0.3` hardcodeado;
//     no es una pérdida medida y la UI no lo presenta como tal.
//   - `ReorderSummary.average_lead_time_days` y `ReorderAnalysis.by_supplier`
//     nunca se completan; `ReorderProduct.days_until_stockout` usa 999 como
//     centinela de "sin ventas en 30 días".
//   - `InventoryAnalyticsDashboard.kpis.value_change_pct/turnover_change_pct`,
//     `.trends` y `.slow_movers` (turnover/days) son valores de relleno: solo
//     se muestran los campos reales.

export type InventoryStatusFilter =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'OVERSTOCK';

export type InventorySortBy = 'stock' | 'name' | 'value' | 'category' | 'days';

export type InventorySortOrder = 'ASC' | 'DESC';

export interface InventoryPeriodParams {
  period?: DashboardPeriod;
}

export interface InventoryStockLevelsParams {
  page?: number;
  page_size?: number;
  status?: InventoryStatusFilter;
  sort_by?: InventorySortBy;
  sort_order?: InventorySortOrder;
  brand_id?: number;
}

export interface InventoryDeadStockParams {
  days?: number;
}

export interface InventoryStockStatus {
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  overstock: number;
  in_stock_pct: number;
  low_stock_pct: number;
  out_of_stock_pct: number;
  overstock_pct: number;
}

export interface InventoryValuation {
  total_cost_value: number;
  total_retail_value: number;
  potential_margin: number;
  potential_margin_pct: number;
  average_cost: number;
  average_retail: number;
}

export interface InventoryTurnoverKPIs {
  turnover_rate: number;
  days_of_inventory: number;
  stockout_rate: number;
  fill_rate: number;
}

/** Alerta del `/overview` (el repo no las completa: viaja `[]`). */
export interface InventoryAlert {
  type: string;
  product_id: string;
  product_name: string;
  message: string;
  current_stock: number;
  threshold?: number;
  severity: string;
}

export interface InventoryOverview {
  generated_at: string;
  total_products: number;
  total_units: number;
  total_value: number;
  total_cost: number;
  potential_profit: number;
  stock_status: InventoryStockStatus;
  valuation: InventoryValuation;
  turnover: InventoryTurnoverKPIs;
  alerts: InventoryAlert[] | null;
}

// Stock levels ---------------------------------------------------------------

export interface ProductStockLevel {
  product_id: string;
  product_name: string;
  /** El repo devuelve el id del producto en este campo (no hay SKU real). */
  sku: string;
  category_name: string;
  product_type: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | string;
  /** 999 = sin ventas en los últimos 30 días (centinela del SQL). */
  days_of_stock: number;
  unit_cost: number;
  unit_price: number;
  stock_value: number;
  last_movement: string;
  last_sale: string;
  variant_id?: string | null;
  variant_name?: string | null;
  variant_sku?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  tags?: string[];
}

export interface StockLevelsSummary {
  total_products: number;
  /** Suma de la PÁGINA, no del filtro completo. */
  total_units: number;
  /** Suma de la PÁGINA, no del filtro completo. */
  total_value: number;
  average_stock: number;
  median_stock: number;
}

export interface StockLevelsReport {
  generated_at: string;
  summary: StockLevelsSummary;
  products: ProductStockLevel[] | null;
  pagination: BIPaginationInfo;
}

// Turnover -------------------------------------------------------------------

export interface CategoryTurnover {
  category_id: string;
  category_name: string;
  turnover_rate: number;
  days_of_inventory: number;
  total_units: number;
  total_value: number;
  units_sold: number;
  performance: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | string;
}

export interface ProductTurnover {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  product_type: string;
  turnover_rate: number;
  days_of_inventory: number;
  current_stock: number;
  units_sold: number;
  /** El SQL escanea el stock actual, no un promedio. */
  average_stock: number;
  performance: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | string;
}

export interface TurnoverMetrics {
  turnover_rate: number;
  days_of_inventory: number;
  /** Valor actual del stock a costo (nombre heredado del modelo). */
  average_inventory: number;
  cost_of_goods_sold: number;
  inventory_efficiency: number;
}

export interface TurnoverTrendPoint {
  date: string;
  label: string;
  turnover_rate: number;
  inventory_value: number;
  cost_of_goods_sold: number;
}

export interface TurnoverAnalysis {
  period: BIReportPeriod;
  overall: TurnoverMetrics;
  by_category: CategoryTurnover[] | null;
  by_product: ProductTurnover[] | null;
  trends: TurnoverTrendPoint[] | null;
}

// ABC ------------------------------------------------------------------------

export interface ABCSummary {
  total_products: number;
  /** Ventas del período (no valor de inventario). */
  total_value: number;
  class_a_count: number;
  class_a_value: number;
  class_a_value_pct: number;
  class_b_count: number;
  class_b_value: number;
  class_b_value_pct: number;
  class_c_count: number;
  class_c_value: number;
  class_c_value_pct: number;
}

export interface ABCProduct {
  product_id: string;
  product_name: string;
  /** Id del producto (el repo no tiene SKU en esta consulta). */
  sku: string;
  category_name: string;
  product_type: string;
  class: 'A' | 'B' | 'C' | string;
  total_sales: number;
  sales_percentage: number;
  cumulative_pct: number;
  units_sold: number;
  current_stock: number;
  stock_value: number;
  /** Siempre 0: el SELECT del repo no lo calcula. */
  turnover_rate: number;
  rank: number;
}

export interface ABCAnalysis {
  generated_at: string;
  period: BIReportPeriod;
  summary: ABCSummary;
  class_a: ABCProduct[] | null;
  class_b: ABCProduct[] | null;
  class_c: ABCProduct[] | null;
}

// Dead stock -----------------------------------------------------------------

export interface DeadStockSummary {
  total_products: number;
  total_units: number;
  total_value: number;
  percentage_of_stock: number;
  average_days_idle: number;
  /** `total_value * 0.3` hardcodeado: la UI no lo muestra como pérdida. */
  potential_loss: number;
}

export interface DeadStockProduct {
  product_id: string;
  product_name: string;
  /** Id del producto. */
  sku: string;
  category_name: string;
  product_type: string;
  current_stock: number;
  stock_value: number;
  /** Si nunca se vendió, el BE usa la fecha de alta del producto. */
  last_sale_date: string;
  days_since_last_sale: number;
  /** Si nunca se movió, el BE usa la fecha de alta del producto. */
  last_movement_date: string;
  days_since_movement: number;
  /** Texto en español del BE; la UI deriva la recomendación con i18n. */
  recommendation: string;
}

export interface CategoryDeadStock {
  category_id: string;
  category_name: string;
  product_count: number;
  total_units: number;
  total_value: number;
  percentage_of_category: number;
}

export interface DeadStockAnalysis {
  generated_at: string;
  summary: DeadStockSummary;
  products: DeadStockProduct[] | null;
  /** El repo no lo completa: viaja `null`/`[]`. */
  by_category: CategoryDeadStock[] | null;
  /** Textos en español del BE; la UI usa sus propias claves i18n. */
  recommendations: string[] | null;
}

// Reorder --------------------------------------------------------------------

export interface ReorderSummary {
  total_needing_reorder: number;
  urgent_count: number;
  soon_count: number;
  estimated_cost: number;
  /** Nunca se completa (viaja 0). */
  average_lead_time_days: number;
}

export interface ReorderProduct {
  product_id: string;
  product_name: string;
  /** Id del producto. */
  sku: string;
  category_name: string;
  product_type: string;
  supplier_id?: string;
  supplier_name?: string;
  current_stock: number;
  /** Constante 5 del SQL (no configuración real). */
  min_stock: number;
  /** Constante 5 del SQL. */
  reorder_point: number;
  /** Sugerencia del reporte: reponer hasta 10 unidades. */
  reorder_quantity: number;
  estimated_cost: number;
  /** 999 = sin ventas en 30 días (centinela del SQL). */
  days_until_stockout: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  last_order_date?: string;
}

export interface ReorderAnalysis {
  generated_at: string;
  summary: ReorderSummary;
  urgent_reorders: ReorderProduct[] | null;
  soon_reorders: ReorderProduct[] | null;
  /** El repo no lo completa. */
  by_supplier: unknown[] | null;
}

// Stock aging ----------------------------------------------------------------

export interface StockAgingSummary {
  total_products: number;
  total_units: number;
  total_value: number;
  average_age_days: number;
  old_stock_value: number;
  old_stock_pct: number;
}

export interface StockAgingBucket {
  label: string;
  min_days: number;
  max_days: number;
  product_count: number;
  total_units: number;
  total_value: number;
  percentage: number;
}

export interface StockAgingProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  product_type: string;
  current_stock: number;
  stock_value: number;
  age_days: number;
  age_bucket: string;
  last_received: string;
  last_sold: string;
}

export interface StockAgingReport {
  generated_at: string;
  summary: StockAgingSummary;
  buckets: StockAgingBucket[] | null;
  products: StockAgingProduct[] | null;
}

// Inventory dashboard --------------------------------------------------------

export interface InventoryKPIsDashboard {
  total_value: number;
  /** Nunca se completa. */
  value_change_pct: number;
  turnover_rate: number;
  /** Nunca se completa. */
  turnover_change_pct: number;
  days_of_inventory: number;
  stockout_rate: number;
  fill_rate: number;
  dead_stock_pct: number;
}

export interface InventoryTrendPoint {
  date: string;
  label: string;
  total_value: number;
  total_units: number;
  turnover_rate: number;
}

export interface InventoryAnalyticsDashboard {
  generated_at: string;
  kpis: InventoryKPIsDashboard;
  stock_status: InventoryStockStatus;
  top_movers: ProductTurnover[] | null;
  /** turnover_rate/days_of_inventory son relleno (0/999): no se muestran. */
  slow_movers: ProductTurnover[] | null;
  reorder_alerts: ReorderProduct[] | null;
  dead_stock_value: number;
  /** Nunca se completa. */
  trends: InventoryTrendPoint[] | null;
  abc_summary: ABCSummary;
  alerts: InventoryAlert[] | null;
}

// --- Rentabilidad (F6) ------------------------------------------------------

/** Período devuelto por el BE (`ReportPeriod`); `end_date` es exclusivo. */
export interface ProfitabilityReportPeriod {
  start_date: string;
  end_date: string;
  type?: string;
}

export interface ProfitabilitySummary {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  /** El BE no modela gastos operativos: espeja gross_profit. */
  operating_expenses: number;
  /** El BE no modela gastos operativos: espeja gross_profit. */
  operating_profit: number;
  /** El BE no modela gastos operativos: espeja gross_profit. */
  net_profit: number;
  total_transactions: number;
  total_units_sold: number;
  average_ticket: number;
  profit_per_unit: number;
}

export interface ProfitabilityMargins {
  gross_margin_pct: number;
  /** = gross_margin_pct (sin gastos operativos). */
  operating_margin_pct: number;
  /** = gross_margin_pct (sin gastos operativos). */
  net_margin_pct: number;
  average_markup: number;
  roi: number;
  /** = gross_profit (no es un margen de contribución calculado). */
  contribution_margin: number;
}

export interface ProfitabilityComparison {
  previous_period: ProfitabilityReportPeriod;
  revenue_change: number;
  revenue_change_pct: number;
  gross_profit_change: number;
  gross_profit_change_pct: number;
  net_profit_change: number;
  net_profit_change_pct: number;
  /** Diferencia en puntos porcentuales entre ambos márgenes brutos. */
  margin_change: number;
}

export interface ProfitabilityOverview {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  summary: ProfitabilitySummary;
  margins: ProfitabilityMargins;
  comparison?: ProfitabilityComparison | null;
}

/** Whitelist real de `sort_by` de `/profitability/products`. */
export type ProfitabilityProductSortBy =
  | 'profit'
  | 'margin'
  | 'revenue'
  | 'units'
  | 'name';

export interface ProfitabilitySortOrder {
  by: ProfitabilityProductSortBy;
  order: 'ASC' | 'DESC';
}

export interface ProfitabilityPageParams {
  period?: DashboardPeriod;
  page?: number;
  page_size?: number;
}

export interface ProfitabilityProductParams extends ProfitabilityPageParams {
  sort_by?: ProfitabilityProductSortBy;
  sort_order?: 'ASC' | 'DESC';
}

export interface ProfitabilityGranularityParams {
  period?: DashboardPeriod;
  granularity?: ProfitabilityTrendGranularity;
}

export type ProfitabilityTrendGranularity = 'daily' | 'weekly' | 'monthly';

export interface ProfitabilityReportPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

/** Campos de `ProductDimension` que el reporte de productos embebe. */
export interface ProfitabilityProductDimension {
  brand_id?: number | null;
  brand_name?: string | null;
  tags?: string[] | null;
}

export interface ProductProfitabilityRow extends ProfitabilityProductDimension {
  product_id: string;
  product_name: string;
  /** El SQL devuelve '' (no calcula SKU): no se muestra. */
  sku: string;
  category_id: string;
  category_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  average_price: number;
  average_cost: number;
  markup: number;
  contribution_pct: number;
  profit_per_unit: number;
  /** Rank por beneficio, no por el orden solicitado. */
  rank: number;
  /** EXCELLENT | GOOD | AVERAGE | POOR | LOSS (umbrales 40/25/10/0). */
  performance: string;
}

export interface ProductProfitabilitySummary {
  total_products: number;
  profitable_products: number;
  unprofitable_products: number;
  /** Promedio simple de los márgenes por producto, no un margen ponderado. */
  average_margin: number;
  total_profit: number;
  total_revenue: number;
}

export interface ProductProfitabilityReport {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  summary: ProductProfitabilitySummary;
  products: ProductProfitabilityRow[] | null;
  top_profitable: ProductProfitabilityRow[] | null;
  /** Nunca se completa. */
  low_profitable: ProductProfitabilityRow[] | null;
  losers: ProductProfitabilityRow[] | null;
  pagination: ProfitabilityReportPagination;
}

export interface CustomerProfitabilityRow {
  customer_id: string;
  customer_name: string;
  /** Constante 'REGULAR' en el SQL: no se muestra. */
  customer_type: string;
  total_purchases: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  average_ticket: number;
  average_profit_per_tx: number;
  contribution_pct: number;
  first_purchase: string;
  last_purchase: string;
  /** El SQL lo calculaba con EXTRACT(DAY): la UI lo deriva de last_purchase. */
  days_since_last_purchase: number;
  /** PLATINUM | GOLD | SILVER | BRONZE (participación sobre el beneficio). */
  segment: string;
  rank: number;
}

export interface CustomerProfitabilitySummary {
  total_customers: number;
  /** Igual a total_customers: el SQL los asigna en la misma línea. */
  active_customers: number;
  profitable_customers: number;
  average_customer_value: number;
  total_profit: number;
  /** Nunca se calcula (viaja 0): no se muestra. */
  top_customers_pct: number;
}

export interface CustomerProfitabilityReport {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  summary: CustomerProfitabilitySummary;
  customers: CustomerProfitabilityRow[] | null;
  /** Copia de las primeras 5 filas de la página, no un ranking aparte. */
  top_customers: CustomerProfitabilityRow[] | null;
  /** Nunca se completa. */
  at_risk_customers: CustomerProfitabilityRow[] | null;
  pagination: ProfitabilityReportPagination;
}

export interface CategoryProfitabilityRow {
  category_id: string;
  category_name: string;
  product_count: number;
  units_sold: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  /** = profit_share (copia del SQL). */
  contribution_pct: number;
  average_markup: number;
  revenue_share: number;
  profit_share: number;
  /** EXCELLENT | GOOD | AVERAGE | POOR (umbrales 40/25/10). */
  performance: string;
  rank: number;
}

export interface CategoryProfitabilitySummary {
  total_categories: number;
  most_profitable_id: string;
  most_profitable_name: string;
  least_profitable_id: string;
  least_profitable_name: string;
  /** Promedio simple de los márgenes por categoría. */
  average_margin: number;
  total_profit: number;
}

export interface CategoryProfitabilityReport {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  summary: CategoryProfitabilitySummary;
  categories: CategoryProfitabilityRow[] | null;
}

export interface ProfitabilityTrendPoint {
  date: string;
  /** Etiqueta del servidor en inglés (to_char): la UI la deriva del `date`. */
  label: string;
  revenue: number;
  cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  /** = gross_profit (sin gastos operativos). */
  net_profit: number;
  /** = gross_margin_pct (sin gastos operativos). */
  net_margin_pct: number;
  transactions: number;
  units_sold: number;
}

export interface ProfitabilityTrendsSummary {
  average_revenue: number;
  average_profit: number;
  /** Promedio simple de los márgenes de los puntos. */
  average_margin: number;
  /** Etiqueta del servidor en inglés; la UI re-deriva la fecha. */
  highest_revenue_date: string;
  highest_profit_date: string;
  lowest_margin_date: string;
  trend_direction: string;
  growth_rate: number;
}

export interface ProfitabilityTrendsReport {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  granularity: string;
  data_points: ProfitabilityTrendPoint[] | null;
  summary: ProfitabilityTrendsSummary;
}

export interface SellerProfitabilityRow {
  seller_id: string;
  seller_name: string;
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  average_ticket: number;
  contribution_pct: number;
  rank: number;
}

export interface SellerProfitabilitySummary {
  total_sellers: number;
  total_profit: number;
  average_profit_per_seller: number;
  top_seller_id: string;
  top_seller_name: string;
}

export interface SellerProfitabilityReport {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  summary: SellerProfitabilitySummary;
  sellers: SellerProfitabilityRow[] | null;
}

export interface ProfitabilityKPIs {
  total_revenue: number;
  total_profit: number;
  gross_margin_pct: number;
  /** = gross_margin_pct (sin gastos operativos). */
  net_margin_pct: number;
  roi: number;
  profit_per_transaction: number;
  revenue_growth: number;
  profit_growth: number;
  /** Diferencia en puntos porcentuales contra la ventana previa. */
  margin_change: number;
}

export interface ProfitabilityAlert {
  /** LOW_MARGIN | DECLINING_PROFIT | UNPROFITABLE_PRODUCTS | PROFIT_GROWTH. */
  type: string;
  category: string;
  /** Texto en español del servidor: la UI usa claves i18n por tipo. */
  message: string;
  value: number;
  threshold: number;
  severity: string;
  product_id?: string;
  product_name?: string;
}

export interface ProfitabilityDashboard {
  generated_at: string;
  period: ProfitabilityReportPeriod;
  kpis: ProfitabilityKPIs;
  top_products: ProductProfitabilityRow[] | null;
  top_customers: CustomerProfitabilityRow[] | null;
  top_categories: CategoryProfitabilityRow[] | null;
  /** Últimos 7 puntos (o todos si hay menos). */
  trends: ProfitabilityTrendPoint[] | null;
  /** Nunca se completa (0/''): no se muestra. */
  break_even_status: {
    status: string;
    revenue_above_break_even: number;
    units_above_break_even: number;
    days_to_break_even: number;
    projected_month_end: number;
  };
  alerts: ProfitabilityAlert[] | null;
}
