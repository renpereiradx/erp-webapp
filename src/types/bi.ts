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

// `FinancialOverview` y `AgingReportItem` se eliminaron en F8: describían una
// forma que ningún endpoint de `/payables/*` devolvía y solo los consumía el
// servicio legacy reescrito en esta fase. El contrato real vive en la sección
// de Cuentas por Pagar al final del archivo.

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

// --- Cuentas por Cobrar (F7) ------------------------------------------------
//
// Contrato REAL de `/receivables/*`
// (`business_management/models/receivables.go` + `internal/analytics/dto.go` +
// `internal/analytics/http_receivables.go` + `internal/platform/postgres/
// analytics_receivables_repo.go`). Envelope `{success, data, metadata}` en
// todas las respuestas; gate del BE: `RequireModule('bi')` →
// `receivables:read` (`biChain("receivables:read", "receivables")`).
//
// Particularidades del contrato que la UI debe respetar:
//  - el "aging" de CxC mide días desde la VENTA, no desde el vencimiento;
//  - `due_date` del listado se sintetiza como `sale_date + 30 días` (el
//    vencimiento real solo alimenta `days_overdue`): no se muestra;
//  - `ClientReceivables.total_overdue` usa >30 días desde la venta, distinto de
//    `days_overdue` (que usa el vencimiento) del listado;
//  - `ClientRisk.collection_rate` puede superar 100 % (fórmula del repo): no se
//    muestra como tasa;
//  - `status` del listado solo acepta PENDING/PARTIAL/OVERDUE (se superponen) y
//    toda fila tiene saldo pendiente: PAID nunca aparece.

/** Estados que devuelve (y acepta como filtro) el listado de CxC. */
export type ReceivablesStatus = 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'PAID';

/** Comportamiento de pago calculado por el BE (EXCELLENT/GOOD/REGULAR/POOR). */
export type ReceivablesPaymentBehavior = 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'POOR';

/** Nivel de riesgo del análisis por cliente. */
export type ReceivablesRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Tramo de antigüedad (`models.AgingBucket`). */
export interface ReceivablesAgingBucket {
  amount: number;
  count: number;
  percentage: number;
}

/** `aging_summary` de overview/report: días desde la venta (0-30, 31-60, 61-90, >90). */
export interface ReceivablesAgingSummary {
  current: ReceivablesAgingBucket;
  days_30_60: ReceivablesAgingBucket;
  days_60_90: ReceivablesAgingBucket;
  over_90_days: ReceivablesAgingBucket;
}

/** `GET /receivables/overview`. */
export interface ReceivablesOverview {
  total_pending: number;
  total_overdue: number;
  total_count: number;
  overdue_count: number;
  /** Promedio de días desde la venta en las órdenes ya saldadas. */
  average_days_to_collect: number;
  /** Cobrado / facturado sobre todas las ventas no canceladas. */
  collection_rate: number;
  currency: string;
  aging_summary: ReceivablesAgingSummary;
}

/** `payment_history` de `GET /receivables/{id}`. */
export interface ReceivablePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  processed_by: string;
}

/** Cuenta por cobrar (una orden de venta con saldo pendiente). */
export interface Receivable {
  id: string;
  sale_order_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  sale_date: string;
  /** Sintetizado por el repo como sale_date + 30 días: no se muestra. */
  due_date: string;
  original_amount: number;
  paid_amount: number;
  pending_amount: number;
  /** Días desde el vencimiento (0 si aún no venció). */
  days_overdue: number;
  status: ReceivablesStatus | string;
  payment_history?: ReceivablePayment[] | null;
  currency: string;
}

/** `GET /receivables` (lista maestra paginada). */
export interface ReceivablesList {
  items: Receivable[] | null;
  pagination: BIPaginationInfo;
  summary: ReceivablesListSummary;
}

export interface ReceivablesListSummary {
  total_amount: number;
  total_pending: number;
  total_paid: number;
  /** Conteo global de cuentas con saldo (no el tamaño de la página). */
  item_count: number;
  /** Filas del set completo con más de 60 días vencidos. */
  high_priority_count: number;
}

/** `GET /receivables/client/{id}`. */
export interface ClientReceivables {
  client_id: string;
  client_name: string;
  client_phone?: string;
  total_pending: number;
  /** Pendiente con más de 30 días desde la venta (no el vencimiento real). */
  total_overdue: number;
  pending_count: number;
  /** Venta más antigua pendiente; cero de Go si no hay deuda. */
  oldest_debt: string;
  /** Nunca se completa: se omite del contrato visible. */
  credit_limit?: number;
  credit_available?: number;
  payment_behavior: ReceivablesPaymentBehavior | string;
  /** Promedio (payment_date - sale_date) de todos los pagos del cliente. */
  average_days_to_pay: number;
  /** Hasta 100 cuentas, ordenadas por fecha descendente. */
  receivables?: Receivable[] | null;
}

/** Fila de `GET /receivables/top-debtors` y de `statistics.top_debtors`. */
export interface ClientReceivablesSummary {
  client_id: string;
  client_name: string;
  total_pending: number;
  total_overdue: number;
  pending_count: number;
  payment_behavior: ReceivablesPaymentBehavior | string;
}

/** Fila por cliente de `GET /receivables/aging/report`. */
export interface ClientAgingDetail {
  client_id: string;
  client_name: string;
  current: number;
  days_30_60: number;
  days_60_90: number;
  over_90_days: number;
  total: number;
}

/** `GET /receivables/aging/report` (by_client paginado; totales globales). */
export interface ReceivablesAgingReport {
  generated_at: string;
  summary: ReceivablesAgingSummary;
  by_client: ClientAgingDetail[] | null;
  /** Suma global del set completo, no de la página. */
  total_amount: number;
  /** Clientes del set completo, no de la página. */
  total_clients: number;
}

/** `GET /receivables/client/{id}/risk` (`analytics.ClientRisk`). */
export interface ClientRisk {
  client_id: string;
  risk_level: ReceivablesRiskLevel | string;
  payment_behavior: ReceivablesPaymentBehavior | string;
  total_pending_orders: number;
  total_pending_amount: number;
  total_overdue_amount: number;
  total_over_90_amount: number;
  /** Ratio 0-1 (pendiente vencido / pendiente total). */
  overdue_ratio: number;
  /** Días desde la venta de la cuenta más antigua (no días vencidos). */
  max_days_overdue: number;
  avg_days_outstanding: number;
  avg_days_to_pay: number;
  total_payments: number;
  /** Fórmula del repo; puede superar 100: no se muestra como tasa. */
  collection_rate: number;
  analyzed_at: string;
}

/** Punto semanal de `statistics.collection_trend`. */
export interface ReceivablesCollectionTrendPoint {
  /** Fecha date-only (lunes de la semana). */
  date: string;
  billed: number;
  collected: number;
  /** Diferencia acumulada facturado − cobrado calculada por el BE. */
  balance: number;
}

/** `GET /receivables/statistics` y `/statistics/date-range`. */
export interface ReceivablesStatistics {
  /** Rango aplicado "YYYY-MM-DD - YYYY-MM-DD" (fin EXCLUSIVO). */
  period: string;
  total_billed: number;
  total_collected: number;
  /** Cobrado / facturado del período (flujos, no cohortes). */
  collection_rate: number;
  /** Días promedio desde la venta hasta el primer pago (sin pago: hasta hoy). */
  average_dso: number;
  /** Saldo vencido de las ventas del período / facturación del período. */
  overdue_percentage: number;
  top_debtors: ClientReceivablesSummary[] | null;
  collection_trend: ReceivablesCollectionTrendPoint[] | null;
}

/** Whitelist real de `sort_by` de `GET /receivables` (T3). */
export type ReceivablesSortBy = 'date' | 'amount' | 'client' | 'days_overdue';

export interface ReceivablesSortParams {
  status?: ReceivablesStatus;
  client_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: ReceivablesSortBy;
  sort_order?: 'ASC' | 'DESC';
}

/** Params de `/overdue`: solo pagina (el BE fija status y orden). */
export interface ReceivablesPageParams {
  page?: number;
  page_size?: number;
}

// --- Cuentas por Pagar (F8) -------------------------------------------------
//
// Contrato REAL de `/payables/*` (`business_management/models/payables.go` +
// `internal/analytics/http_payables.go` +
// `internal/platform/postgres/analytics_payables_repo.go`). El envelope es
// `BIEnvelope<T>`.
//
// Convenciones del backend que la UI debe decir en pantalla (no "corregir"):
//  - el vencimiento NO es contractual: el repositorio usa
//    `order_date + INTERVAL '30 days'` en todos los cálculos;
//  - la antigüedad (`aging`) se mide desde la FECHA DE COMPRA (`NOW() -
//    order_date`), no desde el vencimiento;
//  - `days_until_due`/`days_overdue` son días calendario con piso 0;
//  - `supplier_name` es `parties.first_name` (el repo no concatena apellido) y
//    `supplier_contact` es el JSON crudo del partido.

export type PayablesStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type PayablesPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PayablesPaymentHistory = 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'POOR';
export type PayablesImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PayablesAgingBucket {
  amount: number;
  count: number;
  percentage: number;
}

/** Buckets por antigüedad desde la compra: 0-30, 31-60, 61-90 y >90 días. */
export interface PayablesAgingSummary {
  current: PayablesAgingBucket;
  days_30_60: PayablesAgingBucket;
  days_60_90: PayablesAgingBucket;
  over_90_days: PayablesAgingBucket;
}

/** `GET /payables/overview` (snapshot a hoy, sin período). */
export interface PayablesOverview {
  total_pending: number;
  total_overdue: number;
  total_count: number;
  overdue_count: number;
  due_this_week: number;
  due_this_month: number;
  /** Días desde la compra de las órdenes YA SALDADAS (no días hasta pagar). */
  average_days_to_pay: number;
  /** Pagado / facturado histórico sobre todas las órdenes no canceladas. */
  payment_rate: number;
  currency: string;
  aging_summary: PayablesAgingSummary;
}

export interface SupplierPaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  processed_by: string;
}

/** Cuenta por pagar individual (`GET /payables/{id}` y filas del listado). */
export interface Payable {
  id: string;
  purchase_order_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_contact?: string;
  purchase_date: string;
  /** Sintético del BE: `purchase_date + 30 días`. */
  due_date: string;
  original_amount: number;
  paid_amount: number;
  pending_amount: number;
  days_until_due: number;
  days_overdue: number;
  status: PayablesStatus | string;
  /** Calculada por el BE: URGENT si venció; luego por días hasta vencer. */
  priority: PayablesPriority | string;
  payment_history?: SupplierPaymentRecord[] | null;
  currency: string;
}

export interface PayablesListSummary {
  total_amount: number;
  total_pending: number;
  total_paid: number;
  /** Filas de la página (no del set filtrado). */
  item_count: number;
}

/** `GET /payables` — listado paginado con totales globales del filtro. */
export interface PayablesList {
  items: Payable[] | null;
  pagination: BIPaginationInfo;
  summary: PayablesListSummary;
}

export interface SupplierPayablesSummary {
  supplier_id: string;
  supplier_name: string;
  total_pending: number;
  total_overdue: number;
  pending_count: number;
  /** Derivado del % vencido de ESTE endpoint (no del historial de pagos). */
  payment_history: PayablesPaymentHistory | string;
}

/** `GET /payables/supplier/{id}` (no consumido por las pantallas de F8). */
export interface SupplierPayables extends SupplierPayablesSummary {
  supplier_contact?: string;
  oldest_debt: string;
  /** Literal 30 del repositorio (no es una condición negociada). */
  credit_terms: number;
  average_days_to_pay: number;
  payables?: Payable[] | null;
}

export interface PaymentScheduleItem {
  payable_id: string;
  supplier_name: string;
  amount: number;
  priority: PayablesPriority | string;
  days_until_due: number;
}

export interface PaymentSchedule {
  /** Fecha date-only `YYYY-MM-DD`. */
  date: string;
  /** Nombre del día en español que emite el BE (la UI lo deriva del locale). */
  day_of_week: string;
  total_due: number;
  item_count: number;
  items: PaymentScheduleItem[] | null;
}

/**
 * `GET /payables/schedule?days=N`: solo vencimientos ENTRE hoy y hoy+N.
 * El slice `schedule` sale de un map de Go: llega SIN ordenar.
 */
export interface PaymentCalendar {
  start_date: string;
  end_date: string;
  total_due: number;
  schedule: PaymentSchedule[] | null;
}

export interface CashFlowProjectionDay {
  date: string;
  inflows: number;
  outflows: number;
  net_flow: number;
  cumulative_flow: number;
}

/**
 * `GET /payables/cash-flow?days=N`. `expected_inflows` son cuentas por cobrar
 * pendientes que vencen en la ventana y `expected_outflows` cuentas por pagar
 * pendientes: no son saldos bancarios.
 */
export interface CashFlowProjection {
  period: string;
  expected_inflows: number;
  expected_outflows: number;
  net_cash_flow: number;
  cumulative_flow: number;
  projection_days: CashFlowProjectionDay[] | null;
}

export interface SupplierAgingDetail {
  supplier_id: string;
  supplier_name: string;
  current: number;
  days_30_60: number;
  days_60_90: number;
  over_90_days: number;
  total: number;
}

/** `GET /payables/aging/report?page&page_size` (paginado por proveedor). */
export interface PayablesAgingReport {
  generated_at: string;
  summary: PayablesAgingSummary;
  by_supplier: SupplierAgingDetail[] | null;
  /** Totales GLOBALES (ventanas del SQL), no de la página. */
  total_amount: number;
  total_suppliers: number;
}

/** Punto semanal de `statistics.payment_trend` (compras vs pagos). */
export interface PaymentTrendPoint {
  /** Fecha date-only (lunes de la semana). */
  date: string;
  purchased: number;
  paid: number;
  /** Acumulado compras − pagos calculado por el BE. */
  balance: number;
}

/** `GET /payables/statistics` y `/statistics/date-range`. */
export interface PayablesStatistics {
  /** Rango aplicado "YYYY-MM-DD - YYYY-MM-DD" (fin EXCLUSIVO). */
  period: string;
  total_purchased: number;
  total_paid: number;
  /** Pagado / comprado del período (flujos). */
  payment_rate: number;
  /** Días desde la compra hasta el primer pago; sin pago cuenta hasta hoy. */
  average_dpo: number;
  /** Saldo vencido de las órdenes del período / total comprado del período. */
  overdue_percentage: number;
  /** Top proveedores del catálogo a HOY: el endpoint no lo acota al período. */
  top_suppliers: SupplierPayablesSummary[] | null;
  payment_trend: PaymentTrendPoint[] | null;
}

/** `GET /payables/supplier/{id}/analysis`. */
export interface SupplierAnalysis {
  supplier_id: string;
  supplier_name: string;
  total_pending: number;
  total_overdue: number;
  pending_count: number;
  payment_history: PayablesPaymentHistory | string;
  /** Promedio de días compra→pago de TODOS los pagos del proveedor. */
  avg_days_to_pay: number;
  /** Peso del saldo pendiente del proveedor sobre el total de CxP. */
  share_percentage: number;
  importance: PayablesImportance | string;
  /** Literal 30 del repositorio. */
  credit_terms: number;
  oldest_debt: string;
}

/** Whitelist real de `sort_by` de `GET /payables` (T3). */
export type PayablesSortBy = 'due_date' | 'date' | 'amount' | 'supplier' | 'priority';

export interface PayablesListParams {
  status?: PayablesStatus;
  supplier_id?: string;
  priority?: PayablesPriority;
  search?: string;
  /** `YYYY-MM-DD`; `end_date` es EXCLUSIVO en el BE (suma 1 día). */
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  sort_by?: PayablesSortBy;
  sort_order?: 'ASC' | 'DESC';
}

/** Params de `/payables/aging/report`: solo pagina. */
export interface PayablesPageParams {
  page?: number;
  page_size?: number;
}

// --- Reportes Financieros (F9) ----------------------------------------------
//
// Contrato REAL de `/financial-reports/*` y `/vat-prorrateo/*`
// (`business_management/models/financial_reports.go`, `models/vat_prorrateo.go`
// + `internal/analytics/http_financial.go` + `http_prorrateo.go` +
// `internal/platform/postgres/analytics_financial_repo.go`). Envelope
// `BIEnvelope<T>`.
//
// Semántica que la UI debe respetar (no "corregir" en el cliente):
//  - `IncomeStatement` es un estado de resultado BRUTO: el backend no modela
//    gastos operativos (`expenses.*` siempre 0, igual que returns/discounts);
//    `operating_income` y `net_income` espejan `gross_profit`.
//  - `CashFlowStatement` es base CAJA: cobros de `sale_payments` y pagos de
//    `purchase_payments` por fecha de pago; `cash_from_sales` son cobros de
//    ventas del período y `cash_from_receivables` cobros de ventas previas.
//    `beginning_cash` es el saldo de cajas ABIERTAS.
//  - `FinancialOverview.expenses` son COMPRAS del período (no gastos), y
//    `net_income = revenue - purchases` (no utilidad contable).
//  - `key_ratios.dso/dpo/inventory_turnover/asset_turnover` viajan en 0 porque
//    el repo no los calcula: la UI no los muestra.

export interface FinancialReportPeriod {
  start_date: string;
  end_date: string;
  type?: string;
}

export interface ReportPaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

// Income statement -----------------------------------------------------------

export interface IncomeCategoryRevenue {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
}

export interface IncomePaymentRevenue {
  method: string;
  amount: number;
  percentage: number;
}

export interface IncomeRevenueSection {
  gross_sales: number;
  returns: number;
  discounts: number;
  net_sales: number;
  by_category?: IncomeCategoryRevenue[] | null;
  by_payment_method?: IncomePaymentRevenue[] | null;
}

export interface IncomeCostOfSalesSection {
  beginning_inventory: number;
  purchases: number;
  purchase_returns: number;
  ending_inventory: number;
  cost_of_goods_sold: number;
}

export interface IncomeGrossProfitSection {
  amount: number;
  margin: number;
  percentage: number;
}

export interface IncomeExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface IncomeExpensesSection {
  operating: number;
  salaries: number;
  rent: number;
  utilities: number;
  marketing: number;
  other: number;
  total: number;
  by_category?: IncomeExpenseCategory[] | null;
}

export interface IncomeComparison {
  previous_period: FinancialReportPeriod;
  revenue_change: number;
  revenue_change_pct: number;
  expense_change: number;
  expense_change_pct: number;
  net_income_change: number;
  net_income_change_pct: number;
}

export interface IncomeStatement {
  period: FinancialReportPeriod;
  revenue: IncomeRevenueSection;
  cost_of_sales: IncomeCostOfSalesSection;
  gross_profit: IncomeGrossProfitSection;
  expenses: IncomeExpensesSection;
  operating_income: number;
  other_income: number;
  other_expenses: number;
  net_income: number;
  comparison?: IncomeComparison | null;
}

// Cash flow statement --------------------------------------------------------

export interface CashFlowOperatingSection {
  cash_from_sales: number;
  cash_from_receivables: number;
  cash_paid_to_suppliers: number;
  cash_paid_for_expenses: number;
  cash_paid_for_salaries: number;
  other_operating: number;
  net_operating_cash_flow: number;
}

export interface CashFlowInvestingSection {
  equipment_purchases: number;
  equipment_sales: number;
  other_investing: number;
  net_investing_cash_flow: number;
}

export interface CashFlowFinancingSection {
  loan_proceeds: number;
  loan_payments: number;
  owner_contributions: number;
  owner_withdrawals: number;
  other_financing: number;
  net_financing_cash_flow: number;
}

export interface DailyCashFlow {
  /** Fecha date-only serializada a medianoche UTC. */
  date: string;
  inflows: number;
  outflows: number;
  net_flow: number;
  balance: number;
}

/** `GET /financial-reports/cash-flow` (base caja, ver cabecera). */
export interface CashFlowStatement {
  period: FinancialReportPeriod;
  /** Saldo de cajas ABIERTAS al inicio (no un saldo bancario). */
  beginning_cash: number;
  operating_activities: CashFlowOperatingSection;
  investing_activities: CashFlowInvestingSection;
  financing_activities: CashFlowFinancingSection;
  ending_cash: number;
  net_cash_change: number;
  daily_breakdown?: DailyCashFlow[] | null;
}

// VAT ------------------------------------------------------------------------

export interface VatSalesSection {
  gross_sales_10: number;
  vat_10: number;
  gross_sales_5: number;
  vat_5: number;
  exempt_sales: number;
  total_gross_sales: number;
  total_vat_debito: number;
  transaction_count: number;
}

export interface VatPurchasesSection {
  gross_purchases_10: number;
  vat_10: number;
  gross_purchases_5: number;
  vat_5: number;
  exempt_purchases: number;
  total_gross_purchases: number;
  total_vat_credito: number;
  transaction_count: number;
}

export interface VatBalanceSection {
  vat_debito: number;
  vat_credito: number;
  vat_payable: number;
  credit_carryover: number;
  /** TO_PAY, CREDIT o BALANCED. */
  status: string;
}

export interface MonthlyVat {
  /** Fecha date-only (primer día del mes) serializada a medianoche UTC. */
  month: string;
  vat_debito: number;
  vat_credito: number;
  balance: number;
  status: string;
}

/** `GET /financial-reports/vat` y `/vat/monthly`. */
export interface VatReport {
  period: FinancialReportPeriod;
  sales_vat: VatSalesSection;
  purchases_vat: VatPurchasesSection;
  vat_balance: VatBalanceSection;
  monthly_breakdown?: MonthlyVat[] | null;
}

// Tax summary ----------------------------------------------------------------

export interface VatTaxSummary {
  total_debito: number;
  total_credito: number;
  net_vat: number;
  credit_balance: number;
}

export interface RetentionsSummary {
  retained_by_others: number;
  retained_to_others: number;
  net_retentions: number;
}

export interface MonthlyTax {
  month: string;
  vat_debito: number;
  vat_credito: number;
  net_vat: number;
  retentions: number;
  total_liability: number;
}

/** `GET /financial-reports/tax-summary`. */
export interface TaxSummary {
  period: FinancialReportPeriod;
  vat_summary: VatTaxSummary;
  retentions_summary?: RetentionsSummary | null;
  total_tax_liability: number;
  total_tax_credits: number;
  net_tax_position: number;
  monthly_detail?: MonthlyTax[] | null;
}

// Ledgers --------------------------------------------------------------------

export interface SalesLedgerSummary {
  total_transactions: number;
  total_gross: number;
  total_vat_10: number;
  total_vat_5: number;
  total_exempt: number;
  total_net: number;
}

export interface SalesLedgerEntry {
  date: string;
  invoice_number: string;
  timbrado: string;
  client_ruc: string;
  client_name: string;
  gross_amount: number;
  vat_10: number;
  vat_5: number;
  exempt: number;
  net_amount: number;
  payment_method: string;
  payment_status: string;
  /** CDC del DE SIFEN; vacío en ventas no fiscales. */
  cdc?: string;
  /** Estado del DE SIFEN; vacío en ventas no fiscales. */
  fiscal_estado?: string;
}

export interface PurchaseLedgerSummary {
  total_transactions: number;
  total_gross: number;
  total_vat_10: number;
  total_vat_5: number;
  total_exempt: number;
  total_net: number;
}

export interface PurchaseLedgerEntry {
  date: string;
  invoice_number: string;
  timbrado: string;
  supplier_ruc: string;
  supplier_name: string;
  gross_amount: number;
  vat_10: number;
  vat_5: number;
  exempt: number;
  net_amount: number;
  payment_status: string;
  expense_category?: string;
}

/** `GET /financial-reports/sales-ledger` (período o date-range). */
export interface SalesLedger {
  period: FinancialReportPeriod;
  summary: SalesLedgerSummary;
  entries: SalesLedgerEntry[] | null;
  pagination: ReportPaginationInfo;
}

/** `GET /financial-reports/purchase-ledger` (período o date-range). */
export interface PurchaseLedger {
  period: FinancialReportPeriod;
  summary: PurchaseLedgerSummary;
  entries: PurchaseLedgerEntry[] | null;
  pagination: ReportPaginationInfo;
}

export interface SalesLedgerParams {
  period?: DashboardPeriod;
  page?: number;
  page_size?: number;
  /** Solo con date-range. `YYYY-MM-DD`; fin EXCLUSIVO? El BE parsea ambos. */
  start_date?: string;
  end_date?: string;
  estado?: string;
  cdc?: string;
  timbrado?: string;
}

export interface PurchaseLedgerParams {
  period?: DashboardPeriod;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
}

// Financial overview + health score -----------------------------------------

export interface FinancialRatios {
  current_ratio: number;
  quick_ratio: number;
  gross_margin: number;
  net_margin: number;
  /** No calculados por el repo: viajan en 0 y no se muestran. */
  dso: number;
  dpo: number;
  inventory_turnover: number;
  asset_turnover: number;
}

export interface OverviewComparison {
  previous_period: FinancialReportPeriod;
  revenue_change: number;
  revenue_change_pct: number;
  expense_change: number;
  expense_change_pct: number;
  net_income_change: number;
  net_income_change_pct: number;
}

/** `GET /financial-reports/overview`. `expenses` = compras del período. */
export interface FinancialReportOverview {
  period: FinancialReportPeriod;
  revenue: number;
  expenses: number;
  net_income: number;
  cash_position: number;
  receivables: number;
  payables: number;
  working_capital: number;
  key_ratios: FinancialRatios;
  comparison?: OverviewComparison | null;
}

export interface FinancialHealthScore {
  score: number;
  /** EXCELLENT, GOOD, FAIR o POOR. */
  rating: string;
  current_ratio: number;
  quick_ratio: number;
  net_margin: number;
  working_capital: number;
  period_start: string;
  period_end: string;
}

// VAT prorrateo --------------------------------------------------------------

export type ProrrateoPeriodStatus = 'PENDING' | 'PROCESSED' | 'CLOSED' | 'CANCELLED';
export type ProrrateoAllocationType = 'DIRECT' | 'INDIRECT' | 'EXEMPT';

export interface ProrrateoPeriod {
  id: number;
  period_start: string;
  period_end: string;
  total_taxable_sales: number;
  total_exempt_sales: number;
  total_sales: number;
  /** Coeficiente 0-1 de deducibilidad. */
  deducibility_coefficient: number;
  total_vat_credit: number;
  deductible_vat_credit: number;
  non_deductible_vat_credit: number;
  status: ProrrateoPeriodStatus | string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProrrateoDetail {
  id: number;
  prorrateo_period_id: number;
  purchase_order_id: number;
  original_vat_credit: number;
  deductible_portion: number;
  non_deductible_portion: number;
  allocation_type: ProrrateoAllocationType | string;
  notes?: string;
  created_at: string;
}

// --- Auditoría (F10) --------------------------------------------------------
//
// Contrato REAL de `/api/v1/audit/*`
// (`business_management/models/audit.go`, `internal/analytics/http_audit.go`,
// `internal/platform/postgres/audit_repo.go`). Gate del BE:
// `RequireModule('bi')` → `audit:read` (`biChain("audit:read", "audit")`).
//
// Semántica que la UI debe respetar (no "corregir" en el cliente):
//  - `category`/`action`/`entity_type` son VARCHAR libres: el write path actual
//    usa el vocabulario del modelo, pero la migración
//    `20260916183127_backfill_legacy_audits_to_audit_logs` inserta filas con
//    `category = 'LEGACY'` y acciones heredadas (`INSERT`). Un código fuera del
//    vocabulario se muestra crudo, nunca se traduce a un nombre inventado.
//  - `security_alerts[].message` viene en español desde el SQL; la UI traduce
//    el `type` y muestra `count`, no el texto del servidor.
//  - `UserActivityReport.sessions` y `.security_events` NUNCA se completan
//    (el repo no los consulta): se tipan por contrato y no se renderizan.
//  - Los slices nil de Go llegan como `null` (`trends`, `alerts`,
//    `error_summary`, `logs`, `recent_actions`): los hooks normalizan a `[]`.

export type AuditLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/** `models.AuditLog` — timestamps con zona (`timestamptz`). */
export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user_id: string;
  username?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  category: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  /** JSONB crudo tal como lo devuelve el BE (objeto/array), no un string. */
  old_values?: unknown;
  new_values?: unknown;
  metadata?: unknown;
  level: AuditLevel | string;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  branch_id?: number;
}

export interface AuditCategoryStats {
  category: string;
  count: number;
  success_rate: number;
  percentage: number;
}

export interface AuditActionStats {
  action: string;
  count: number;
  success_rate: number;
  percentage: number;
}

export interface AuditUserActivitySummary {
  user_id: string;
  username: string;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  unique_categories: number;
  unique_sessions: number;
  /** `0001-01-01T00:00:00Z` (cero de Go) cuando el usuario no tiene eventos. */
  last_activity: string;
  /** Total de acciones / días del período (no días activos). */
  avg_actions_per_day: number;
}

/** `models.EntityActivityStats` — no lo emite ningún handler actual. */
export interface AuditEntityActivityStats {
  entity_type: string;
  entity_id: string;
  total_actions: number;
  creates: number;
  updates: number;
  deletes: number;
  reads: number;
}

export interface AuditErrorSummary {
  category: string;
  action: string;
  /** Puede venir vacío (`''`) cuando el productor no registró mensaje. */
  error_message: string;
  count: number;
  last_occurred: string;
}

export interface AuditHourlyDistribution {
  hour: number;
  count: number;
}

/** `type`: FAILED_LOGINS | UNUSUAL_ACTIVITY. `message`: texto del SQL (no se muestra). */
export interface AuditSecurityAlert {
  type: string;
  severity: string;
  message: string;
  details?: string;
  user_id?: string;
  ip_address?: string;
  occurred_at: string;
  count: number;
}

export interface AuditTrendPoint {
  /** Bucket: instante (hourly/weekly/monthly) o date-only a medianoche UTC (daily). */
  date: string;
  /** Etiqueta `to_char` en inglés del servidor; la UI la re-deriva. */
  label: string;
  total_actions: number;
  successful: number;
  failed: number;
  unique_users: number;
  error_rate: number;
}

export interface AuditKPIs {
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  success_rate: number;
  unique_users: number;
  unique_sessions: number;
  avg_actions_per_user: number;
  avg_actions_per_session: number;
  /** Hora del wall clock de negocio (0-23); 0 cuando no hubo acciones. */
  peak_hour: number;
  peak_hour_actions: number;
  critical_errors: number;
  security_incidents: number;
}

/** `GET /api/v1/audit/dashboard?period=`. */
export interface AuditDashboard {
  generated_at: string;
  period: BIReportPeriod;
  kpis: AuditKPIs;
  actions_by_category: AuditCategoryStats[] | null;
  actions_by_type: AuditActionStats[] | null;
  top_users: AuditUserActivitySummary[] | null;
  recent_activity: AuditLogEntry[] | null;
  trends: AuditTrendPoint[] | null;
  security_alerts: AuditSecurityAlert[] | null;
  error_summary: AuditErrorSummary[] | null;
}

/** Catálogo de auditoría (`/api/v1/audit/{categories,actions,levels,entity-types}`). */
export interface AuditCatalogOption {
  code: string;
  name: string;
}

/** `GET /api/v1/audit/logs` — paginación real del BE. */
export interface AuditLogsResponse {
  logs: AuditLogEntry[] | null;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Whitelist real de `sort_by` del listado (`audit_repo.go`). */
export type AuditLogSortBy = 'category' | 'action' | 'level';

export interface AuditLogsParams {
  /** `YYYY-MM-DD`; el handler convierte el fin a `end_date + 1 día`. */
  start_date?: string;
  end_date?: string;
  user_id?: string;
  category?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  level?: string;
  search?: string;
  ip_address?: string;
  /** `true` → solo éxitos; `false` → solo fallos. */
  success?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: AuditLogSortBy;
  /** El BE solo reconoce `'asc'`; cualquier otro valor ordena DESC. */
  sort_order?: 'asc' | 'desc';
}

export interface AuditDailyActivity {
  /** `DATE(timestamp)` — date-only serializado a medianoche UTC. */
  date: string;
  label: string;
  actions: number;
  success: number;
  failed: number;
}

export interface AuditSessionEntry {
  id: number;
  session_id: string;
  user_id: string;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  started_at: string;
  last_activity_at: string;
  ended_at?: string;
  end_reason?: string;
  total_actions: number;
  total_duration_seconds: number;
  is_active: boolean;
}

/** `GET /api/v1/audit/users/{id}/activity?period=`. */
export interface AuditUserActivityReport {
  generated_at: string;
  period: BIReportPeriod;
  user_id: string;
  username: string;
  summary: AuditUserActivitySummary;
  actions_by_category: AuditCategoryStats[] | null;
  actions_by_day: AuditDailyActivity[] | null;
  /** Nunca poblado por el repo (siempre null): no se renderiza. */
  sessions: AuditSessionEntry[] | null;
  recent_actions: AuditLogEntry[] | null;
  /** Nunca poblado por el repo (siempre null): no se renderiza. */
  security_events: AuditSecurityAlert[] | null;
}

export interface AuditExportFilters {
  search?: string;
  category?: string;
  action?: string;
  entity_type?: string;
  level?: string;
  success?: 'true' | 'false';
  start_date?: string;
  end_date?: string;
}

export interface AuditExportOptions {
  format?: 'json' | 'csv';
  max_records?: number;
}

// --- Pronósticos (`/forecast/*`, F11) ---------------------------------------
// Contrato real: `models/forecast.go` + `internal/analytics/http_forecast.go`
// + `internal/platform/postgres/analytics_forecast_repo.go`. Gate del BE:
// `RequireModule('bi')` → `analytics:read` (`biChain("analytics:read",
// "forecast")`).
//
// Convenciones del contrato que la UI respeta:
//  - `confidence.level` NO es un intervalo de confianza: es R²×100 (LINEAR /
//    SEASONAL), 75−CV×100 (EXPONENTIAL) u 80−CV×100 (MOVING_AVG), topado en 95.
//  - `confidence.lower_bound/upper_bound` son MULTIPLICADORES (0.85/1.15) en
//    LINEAR / EXPONENTIAL / SEASONAL y valores ABSOLUTOS (media ± 2σ) en
//    MOVING_AVG. `MonthlyRevenue.lower_bound/upper_bound` ya vienen como
//    montos absolutos (forecast × multiplicador).
//  - Los `date`/`month` de buckets son date-only serializados por Go; se
//    formatean en UTC para no correr el mes.
//  - `demand.categories[].confidence` (75) y `top_products[].confidence` (70)
//    son constantes del modelo, no una confianza por fila.

export type ForecastMethod = 'LINEAR' | 'MOVING_AVG' | 'EXPONENTIAL' | 'SEASONAL';
export type ForecastGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ForecastTrend = 'INCREASING' | 'DECREASING' | 'STABLE';
export type ForecastStockoutRisk = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type ForecastInsightType =
  | 'SALES_TREND'
  | 'SEASONALITY'
  | 'INVENTORY_RISK'
  | 'INVENTORY_COVERAGE'
  | 'REVENUE_PROJECTION';
export type RevenueScenarioName = 'PESSIMISTIC' | 'BASELINE' | 'OPTIMISTIC';

export interface ForecastDataPoint {
  /** Bucket date-only (`DATE_TRUNC` del `sale_date`). */
  date: string;
  /** Etiqueta en inglés que emite `to_char`; la UI la re-deriva. */
  label: string;
  value: number;
  is_actual: boolean;
  is_forecast: boolean;
}

export interface ForecastConfidence {
  /** 0-95. Ver la nota de arriba: no es un intervalo de confianza. */
  level: number;
  mae: number;
  mape: number;
  rmse: number;
  r2: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ForecastSeasonalFactor {
  period: string;
  factor: number;
  /** Mes abreviado en español (`Ene`…`Dic`). */
  label: string;
}

export interface ForecastSeasonality {
  has_seasonality: boolean;
  seasonal_period: string;
  peak_periods: string[] | null;
  low_periods: string[] | null;
  seasonal_factors: ForecastSeasonalFactor[] | null;
}

export interface ForecastSalesSummary {
  total_historical: number;
  total_forecast: number;
  average_historical: number;
  average_forecast: number;
  /** Promedio proyectado vs. promedio histórico (no ventana contra ventana). */
  growth_rate: number;
  trend: ForecastTrend;
  confidence_level: number;
}

/** `GET /forecast/sales`. */
export interface SalesForecast {
  generated_at: string;
  /** Inicio = fin del historial; fin = hoy + forecast_months. */
  forecast_period: BIReportPeriod;
  history_period: BIReportPeriod;
  method: ForecastMethod;
  /** Algoritmo que corrió (hoy siempre igual a `method`). */
  method_effective: string;
  granularity: ForecastGranularity;
  summary: ForecastSalesSummary;
  historical_data: ForecastDataPoint[] | null;
  forecast_data: ForecastDataPoint[] | null;
  confidence: ForecastConfidence;
  seasonality?: ForecastSeasonality | null;
}

export interface ForecastInventorySummary {
  total_products: number;
  high_risk_products: number;
  medium_risk_products: number;
  low_risk_products: number;
  total_projected_demand: number;
  total_current_stock: number;
  /** Días de cobertura (stock / demanda diaria promedio). */
  overall_coverage: number;
}

export interface ForecastInventoryAlert {
  /** STOCKOUT_IMMINENT | LOW_STOCK. */
  type: string;
  /** HIGH | MEDIUM. */
  severity: string;
  product_id: string;
  product_name: string;
  /** Texto en español del repo; la UI traduce `type`, no lo muestra. */
  message: string;
  days_to_act: number;
}

export interface ProductInventoryForecast {
  product_id: string;
  product_name: string;
  current_stock: number;
  /** Ventas de los últimos 90 días / días con ventas (no /90). */
  average_daily_sales: number;
  projected_demand: number;
  /** 999 = sin velocidad de venta (centinela del SQL). */
  days_until_stockout: number;
  reorder_point: number;
  suggested_reorder: number;
  safety_stock: number;
  stockout_risk: ForecastStockoutRisk;
  /** hoy + (days_until_stockout − 3 días de lead time). */
  reorder_date?: string | null;
  trend: ForecastTrend;
}

/** `GET /forecast/inventory` (productos paginados; summary sobre el set completo). */
export interface InventoryForecast {
  generated_at: string;
  forecast_period: BIReportPeriod;
  products: ProductInventoryForecast[] | null;
  summary: ForecastInventorySummary;
  alerts: ForecastInventoryAlert[] | null;
  pagination?: BIPaginationInfo | null;
}

export interface CategoryDemand {
  category_id: string;
  category_name: string;
  historical_units: number;
  forecast_units: number;
  /** Últimos 30 días vs. 30 anteriores; 0 si no hay base previa. */
  growth_rate: number;
  trend: ForecastTrend;
  /** Constante 75 del modelo. */
  confidence: number;
}

export interface ProductDemand {
  product_id: string;
  product_name: string;
  category_name: string;
  historical_units: number;
  forecast_units: number;
  growth_rate: number;
  trend: ForecastTrend;
  /** Constante 70 del modelo. */
  confidence: number;
}

export interface DemandTrend {
  date: string;
  label: string;
  actual_demand: number;
  forecast_demand: number;
  is_forecast: boolean;
}

/** `GET /forecast/demand`. `trends` nunca se completa (no se renderiza). */
export interface DemandForecast {
  generated_at: string;
  forecast_period: BIReportPeriod;
  categories: CategoryDemand[] | null;
  top_products: ProductDemand[] | null;
  trends: DemandTrend[] | null;
  pagination?: BIPaginationInfo | null;
}

export interface MonthlyRevenue {
  month: string;
  /** Etiqueta en inglés (`Jan 2006`); la UI la re-deriva del `month`. */
  label: string;
  actual: number;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  is_forecast: boolean;
}

export interface ForecastCategoryRevenue {
  category_id: string;
  category_name: string;
  historical: number;
  /** Histórico × (1 + growth general): no es un pronóstico por categoría. */
  forecast: number;
  /** Copia del growth general del payload. */
  growth_rate: number;
  percentage: number;
}

export interface RevenueScenario {
  name: RevenueScenarioName | string;
  /** Peso declarado por el BE (20/60/20), no una probabilidad estadística. */
  probability: number;
  forecast_amount: number;
  growth_rate: number;
  /** Texto en español del repo; la UI traduce `name`, no lo muestra. */
  description: string;
}

export interface ForecastRevenueSummary {
  historical_revenue: number;
  forecast_revenue: number;
  /** forecast_revenue × (12 / forecast_months). */
  annual_projection: number;
  growth_rate: number;
  confidence_level: number;
  trend: ForecastTrend;
}

/** `GET /forecast/revenue`. */
export interface RevenueForecast {
  generated_at: string;
  forecast_period: BIReportPeriod;
  history_period: BIReportPeriod;
  summary: ForecastRevenueSummary;
  by_month: MonthlyRevenue[] | null;
  by_category: ForecastCategoryRevenue[] | null;
  scenarios: RevenueScenario[] | null;
}

export interface ForecastInsight {
  /** SALES_TREND | SEASONALITY | INVENTORY_RISK | INVENTORY_COVERAGE | REVENUE_PROJECTION. */
  type: ForecastInsightType | string;
  category: string;
  /** Texto en español del repo; la UI traduce `type` y usa `value`. */
  title: string;
  description: string;
  /** HIGH | MEDIUM | LOW. */
  impact: string;
  value?: number;
  trend?: ForecastTrend | string;
}

export interface ForecastRecommendation {
  /** HIGH | MEDIUM | LOW. */
  priority: string;
  category: string;
  /** Texto en español del repo; la UI deriva la recomendación en i18n. */
  title: string;
  description: string;
  action: string;
  potential_impact: string;
}

/** `GET /forecast/dashboard` (compone los 4 pronósticos + insights + recomendaciones). */
export interface ForecastDashboard {
  generated_at: string;
  forecast_period: BIReportPeriod;
  sales_forecast?: SalesForecast | null;
  revenue_forecast?: RevenueForecast | null;
  inventory_forecast?: InventoryForecast | null;
  demand_forecast?: DemandForecast | null;
  key_insights: ForecastInsight[] | null;
  recommendations: ForecastRecommendation[] | null;
}

export interface ForecastDashboardParams {
  /** Horizonte de los 4 pronósticos (default 3 en el BE). */
  months?: number;
}

export interface ForecastSalesParams {
  history_months?: number;
  forecast_months?: number;
  method?: ForecastMethod;
  granularity?: ForecastGranularity;
}

export interface ForecastInventoryParams {
  forecast_days?: number;
  category_id?: string;
  page?: number;
  page_size?: number;
}

export interface ForecastDemandParams {
  history_months?: number;
  forecast_months?: number;
  category_id?: string;
  page?: number;
  page_size?: number;
}

export interface ForecastRevenueParams {
  history_months?: number;
  forecast_months?: number;
  include_scenarios?: boolean;
}
