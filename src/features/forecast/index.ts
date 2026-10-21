/**
 * Superficie pública del feature `forecast` (F11).
 * Las páginas importan de acá; la dirección de dependencias es
 * `pages → features → (domain, services)`.
 */

export { ForecastAlertsPanel } from './components/ForecastAlertsPanel'
export {
  ForecastBadge,
  ForecastImpactBadge,
  ForecastPriorityBadge,
  ForecastRiskBadge,
  ForecastTrendBadge,
} from './components/ForecastBadges'
export { ForecastControlGroup } from './components/ForecastControlGroup'
export { ForecastGroupLinks } from './components/ForecastGroupLinks'
export { ForecastHorizonSelector } from './components/ForecastHorizonSelector'
export { ForecastInsightsPanel } from './components/ForecastInsightsPanel'
export { ForecastKpiLedger } from './components/ForecastKpiLedger'
export { ForecastMethodSelector } from './components/ForecastMethodSelector'
export { ForecastPageLayout } from './components/ForecastPageLayout'
export { ForecastRecommendationsPanel } from './components/ForecastRecommendationsPanel'
export { ForecastRefreshButton } from './components/ForecastRefreshButton'
export { ForecastScenariosPanel } from './components/ForecastScenariosPanel'
export { ForecastSeriesTable } from './components/ForecastSeriesTable'
export { ForecastTable } from './components/ForecastTable'
export type { ForecastColumn } from './components/ForecastTable'

export {
  useDashboardForecastParams,
  useDemandForecastParams,
  useInventoryForecastParams,
  useRevenueForecastParams,
  useSalesForecastParams,
} from './hooks/useForecastParams'
export {
  FORECAST_STALE_TIME,
  forecastQueryKeys,
  useDemandForecast,
  useForecastDashboard,
  useForecastRefresh,
  useInventoryForecast,
  useRevenueForecast,
  useSalesForecast,
} from './hooks/useForecastQueries'

export type {
  DashboardGroupSummary,
  DashboardInsightView,
  DashboardRecommendationId,
  DashboardRecommendationView,
  ForecastKpiItem,
  ForecastKpiTone,
  ForecastSeriesRow,
  InventoryAlertView,
  RevenueCategoryRow,
  RevenueScenarioRow,
  RevenueSeriesRow,
  SalesModelMetric,
} from './types'
