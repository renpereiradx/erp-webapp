/**
 * Superficie pública del feature `profitability` (F6).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { CategoriesTable } from './components/CategoriesTable'
export { CustomersTable } from './components/CustomersTable'
export { GranularitySelector } from './components/GranularitySelector'
export { PerformanceBadge } from './components/ProfitabilityBadge'
export { ProfitabilityBadge } from './components/ProfitabilityBadge'
export { ProductHighlights } from './components/ProductHighlights'
export { ProductsTable } from './components/ProductsTable'
export { ProfitabilityAlertsPanel } from './components/ProfitabilityAlertsPanel'
export { ProfitabilityKpiLedger } from './components/ProfitabilityKpiLedger'
export { ProfitabilityPageLayout } from './components/ProfitabilityPageLayout'
export { ProfitabilityPeriodSelector } from './components/ProfitabilityPeriodSelector'
export { ProfitabilityRefreshButton } from './components/ProfitabilityRefreshButton'
export { ProfitabilityTable } from './components/ProfitabilityTable'
export { SellersTable } from './components/SellersTable'
export { TopProductsTable } from './components/TopProductsTable'
export { TrendsSummary } from './components/TrendsSummary'
export { TrendsTable } from './components/TrendsTable'

export { useProfitabilityGranularity } from './hooks/useProfitabilityGranularity'
export { useProfitabilityPeriod } from './hooks/useProfitabilityPeriod'
export {
  PROFITABILITY_STALE_TIME,
  profitabilityQueryKeys,
  useProfitabilityCategories,
  useProfitabilityCustomers,
  useProfitabilityDashboard,
  useProfitabilityProducts,
  useProfitabilitySellers,
  useProfitabilityTrends,
} from './hooks/useProfitabilityQueries'

export type {
  AlertView,
  CustomerSegmentKey,
  CustomerSegmentTone,
  PerformanceKey,
  PerformanceTone,
  ProfitabilityAlertKey,
  ProfitabilityAlertTone,
  ProfitabilityAlertValueKind,
  ProfitabilityBadgeTone,
  ProfitabilityCategoriesView,
  ProfitabilityColumn,
  ProfitabilityCustomersView,
  ProfitabilityDashboardView,
  ProfitabilityKpiItem,
  ProfitabilityKpiKind,
  ProfitabilityKpiRow,
  ProfitabilityKpiTone,
  ProfitabilityProductSortBy,
  ProfitabilityProductsParams,
  ProfitabilityProductsView,
  ProfitabilitySellersView,
  ProfitabilitySortOrder,
  ProfitabilityTrendsView,
  TrendDirection,
  TrendInsight,
  TrendRow,
} from './types'
