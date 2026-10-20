/**
 * Tipos públicos del feature `profitability` (F6).
 *
 * Re-exporta los tipos del dominio que las páginas necesitan para tipar sus
 * mapas de KPI/columnas; la fuente de verdad de los payloads sigue siendo
 * `@/types/bi`.
 */
export type { ProfitabilityKpiKind, ProfitabilityKpiRow } from '@/domain/profitability/kpis'
export type { PerformanceKey, PerformanceTone } from '@/domain/profitability/performance'
export type {
  ProfitabilityProductSortBy,
  ProfitabilitySortOrder,
} from '@/types/bi'
export type { CustomerSegmentKey, CustomerSegmentTone } from '@/domain/profitability/customers'
export type {
  ProfitabilityAlertKey,
  ProfitabilityAlertTone,
  ProfitabilityAlertValueKind,
  AlertView,
} from '@/domain/profitability/alerts'
export type { TrendDirection, TrendInsight, TrendRow } from '@/domain/profitability/trends'
export type {
  ProfitabilityDashboardView,
  ProfitabilityProductsView,
  ProfitabilityCustomersView,
  ProfitabilityCategoriesView,
  ProfitabilityTrendsView,
  ProfitabilitySellersView,
  ProfitabilityProductsParams,
} from '../hooks/useProfitabilityQueries'
export type { ProfitabilityColumn } from '../components/ProfitabilityTable'
export type {
  ProfitabilityKpiItem,
  ProfitabilityKpiTone,
} from '../components/ProfitabilityKpiLedger'
export type { ProfitabilityBadgeTone } from '../components/ProfitabilityBadge'
