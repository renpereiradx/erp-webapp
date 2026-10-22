/**
 * Superficie pública del feature `audit` (F10).
 * Las páginas importan de acá; la dirección de dependencias es
 * `pages → features → (domain, services)`.
 */

export { AuditBadge, AuditLevelBadge, AuditResultBadge, AuditSeverityBadge } from './components/AuditBadges'
export { AuditBreakdownTable } from './components/AuditBreakdownTable'
export { AuditDetailGrid } from './components/AuditDetailGrid'
export { AuditErrorSummaryTable } from './components/AuditErrorSummaryTable'
export { AuditFilters } from './components/AuditFilters'
export { AuditJsonPanel } from './components/AuditJsonPanel'
export { AuditKpiLedger } from './components/AuditKpiLedger'
export { AuditPageLayout } from './components/AuditPageLayout'
export { AuditPeriodSelector } from './components/AuditPeriodSelector'
export { AuditRecentActionsTable } from './components/AuditRecentActionsTable'
export { AuditRefreshButton } from './components/AuditRefreshButton'
export { AuditSecurityAlertsPanel } from './components/AuditSecurityAlertsPanel'
export { AuditSortHeader } from './components/AuditSortHeader'
export { AuditTable } from './components/AuditTable'
export { AuditTopUsersTable } from './components/AuditTopUsersTable'
export { AuditTrendChart } from './components/AuditTrendChart'

export { useAuditEntityTypes } from './hooks/useAuditCatalogs'
export { useAuditExport } from './hooks/useAuditExport'
export { useAuditPeriod } from './hooks/useAuditPeriod'
export {
  AUDIT_STALE_TIME,
  auditQueryKeys,
  useAuditDashboard,
  useAuditLog,
  useAuditLogs,
  useAuditRefresh,
  useAuditUserActivity,
} from './hooks/useAuditQueries'

export type {
  AuditBreakdownRow,
  AuditColumn,
  AuditDetailItem,
  AuditExportController,
  AuditKpiItem,
  AuditKpiTone,
  AuditLogFilters,
  AuditLogsQueryOptions,
  AuditLogsView,
  AuditRangeState,
  AuditResultFilter,
  AuditSort,
} from './types'
