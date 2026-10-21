/**
 * Superficie pública del feature `receivables` (F7).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { AgingBucketsPanel } from './components/AgingBucketsPanel'
export { ClientRiskPanel } from './components/ClientRiskPanel'
export { CollectionTrendTable } from './components/CollectionTrendTable'
export { PaymentHistoryTable } from './components/PaymentHistoryTable'
export { ReceivableSummaryPanel } from './components/ReceivableSummaryPanel'
export { ReceivablesBadge } from './components/ReceivablesBadge'
export { ReceivablesBehaviorBadge } from './components/ReceivablesBehaviorBadge'
export { ReceivablesKpiLedger } from './components/ReceivablesKpiLedger'
export { ReceivablesPageLayout } from './components/ReceivablesPageLayout'
export { ReceivablesPeriodSelector } from './components/ReceivablesPeriodSelector'
export { ReceivablesPriorityBadge } from './components/ReceivablesPriorityBadge'
export { ReceivablesRefreshButton } from './components/ReceivablesRefreshButton'
export { ReceivablesStatusBadge } from './components/ReceivablesStatusBadge'
export { ReceivablesStatusFilterControl } from './components/ReceivablesStatusFilterControl'
export { ReceivablesTable } from './components/ReceivablesTable'
export { SortableHeader } from './components/SortableHeader'
export { TopDebtorsTable } from './components/TopDebtorsTable'

export { useReceivablesPeriod } from './hooks/useReceivablesPeriod'
export {
  RECEIVABLES_STALE_TIME,
  receivablesQueryKeys,
  useClientReceivables,
  useClientRisk,
  useReceivableDetail,
  useReceivablesAgingReport,
  useReceivablesList,
  useReceivablesOverview,
  useReceivablesOverdue,
  useReceivablesRecent,
  useReceivablesStatistics,
  useReceivablesTopDebtors,
} from './hooks/useReceivablesQueries'

export type {
  AgingBucketRow,
  ClientAgingRow,
  ClientReceivablesView,
  ReceivableDetailView,
  ReceivablesAgingView,
  ReceivablesBadgeTone,
  ReceivablesColumn,
  ReceivablesKpiItem,
  ReceivablesKpiTone,
  ReceivablesListParams,
  ReceivablesListView,
  ReceivablesSort,
  ReceivablesStatisticsView,
  ReceivablesStatusFilter,
} from './types'
