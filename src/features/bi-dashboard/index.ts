/**
 * Superficie pública del feature `bi-dashboard` (F2).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { ActivityPanel } from './components/ActivityPanel'
export { AlertCard } from './components/AlertCard'
export { AlertsList } from './components/AlertsList'
export { AlertsPreview } from './components/AlertsPreview'
export { AlertsToolbar } from './components/AlertsToolbar'
export { AlertSeverityBadge } from './components/AlertSeverityBadge'
export { DashboardPeriodSelector } from './components/DashboardPeriodSelector'
export { DashboardRefreshButton } from './components/DashboardRefreshButton'
export { DashboardSection } from './components/DashboardSection'
export { DashboardWeeksSelector } from './components/DashboardWeeksSelector'
export { HeatmapGrid } from './components/HeatmapGrid'
export { HeatmapPeaksPanel } from './components/HeatmapPeaksPanel'
export { KpiCard } from './components/KpiCard'
export { KpiGroupsPanel } from './components/KpiGroupsPanel'
export { KpiValue } from './components/KpiValue'
export { OperationsPanel } from './components/OperationsPanel'
export { PanelSkeleton, CardGridSkeleton } from './components/Skeletons'
export { PartialDataBanner } from './components/PartialDataBanner'
export { QueryBoundary } from './components/QueryBoundary'
export { SummaryCards } from './components/SummaryCards'
export { TableEmptyState } from './components/TableEmptyState'
export { TopProductsPreview } from './components/TopProductsPreview'
export { TopProductsTable } from './components/TopProductsTable'
export { TrendIndicator } from './components/TrendIndicator'
export { TrendsPanel } from './components/TrendsPanel'
export { getErrorMessage } from './utils'
export {
  DASHBOARD_STALE_TIME,
  dashboardQueryKeys,
  useDashboardAlerts,
  useDashboardKpis,
  useDashboardRecentActivity,
  useDashboardSalesHeatmap,
  useDashboardSummary,
  useDashboardTopProducts,
  useDashboardTrends,
} from './hooks/useDashboardQueries'
