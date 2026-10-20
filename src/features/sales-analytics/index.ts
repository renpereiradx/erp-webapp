/**
 * Superficie pública del feature `sales-analytics` (F4).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { AnalyticsTable } from './components/AnalyticsTable'
export { BarColumns } from './components/BarColumns'
export { CategoryTable } from './components/CategoryTable'
export { ComparisonControls } from './components/ComparisonControls'
export { ComparisonResult } from './components/ComparisonResult'
export { CustomerSummaryCards } from './components/CustomerSummaryCards'
export { CustomersTable } from './components/CustomersTable'
export { DiscountsControls } from './components/DiscountsControls'
export { DiscountsSummary } from './components/DiscountsSummary'
export { DiscountsTable } from './components/DiscountsTable'
export { HourlyProfile } from './components/HourlyProfile'
export { KpiLedger } from './components/KpiLedger'
export { PaymentMixList } from './components/PaymentMixList'
export { ProductRankList } from './components/ProductRankList'
export { ProductsTable } from './components/ProductsTable'
export { ProductVelocityTable } from './components/ProductVelocityTable'
export { SalesKpis } from './components/SalesKpis'
export { SalesPageLayout } from './components/SalesPageLayout'
export { SalesPeriodSelector } from './components/SalesPeriodSelector'
export { SalesRefreshButton } from './components/SalesRefreshButton'
export { SellersTable } from './components/SellersTable'
export { TableCard } from './components/TableCard'
export { TopCategoriesTable } from './components/TopCategoriesTable'
export { TopProductsTable } from './components/TopProductsTable'
export { TrendChip } from './components/TrendChip'
export { TrendSection } from './components/TrendSection'
export { VelocityKpis } from './components/VelocityKpis'
export { WeekdayProfile } from './components/WeekdayProfile'

export { useSalesPeriod } from './hooks/useSalesPeriod'
export {
  SALES_STALE_TIME,
  salesQueryKeys,
  useDiscounts,
  useDiscountsSummary,
  useSalesByCategory,
  useSalesByCustomer,
  useSalesByDayOfWeek,
  useSalesByHour,
  useSalesByProduct,
  useSalesBySeller,
  useSalesComparison,
  useSalesDashboard,
  useSalesPerformance,
  useSalesTopBottomProducts,
  useSalesTrends,
  useSalesVelocity,
} from './hooks/useSalesAnalyticsQueries'

export type {
  AnalyticsColumn,
  ComparisonDraft,
  ComparisonMetricRow,
  ComparisonMode,
  CustomerSummaryItem,
  DiscountSummaryView,
  KpiLedgerItem,
  ProductRankItem,
  ProductSortState,
  SalesKpiRow,
  TrendSeriesRow,
  TrendView,
  VelocityKpiRow,
} from './types'
