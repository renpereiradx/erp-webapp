/**
 * Superficie pública del feature `payables` (F8).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { AgingBucketsPanel } from './components/AgingBucketsPanel'
export { CashFlowTable } from './components/CashFlowTable'
export { CoveragePanel } from './components/CoveragePanel'
export { PayablesBadge, PayablesBehaviorBadge, PayablesImportanceBadge, PayablesPriorityBadge, PayablesStatusBadge } from './components/PayablesBadges'
export { PayablesFilters } from './components/PayablesFilters'
export { PayablesKpiLedger } from './components/PayablesKpiLedger'
export { PayablesPageLayout } from './components/PayablesPageLayout'
export { PayablesRefreshButton } from './components/PayablesRefreshButton'
export { PayablesSummaryPanel } from './components/PayablesSummaryPanel'
export { PayablesTable } from './components/PayablesTable'
export { PaymentHistoryTable } from './components/PaymentHistoryTable'
export { PaymentSchedulePanel } from './components/PaymentSchedulePanel'
export { PaymentTrendTable } from './components/PaymentTrendTable'
export { SortableHeader } from './components/SortableHeader'
export { TopSuppliersTable } from './components/TopSuppliersTable'

export { usePayablesPeriod } from './hooks/usePayablesPeriod'
export {
  PAYABLES_STALE_TIME,
  payablesQueryKeys,
  useCashFlowProjection,
  usePayableDetail,
  usePayablesAgingReport,
  usePayablesList,
  usePayablesOverview,
  usePayablesSchedule,
  usePayablesStatistics,
  useSupplierAnalysis,
  useSupplierInvoices,
  useTopSuppliers,
} from './hooks/usePayablesQueries'

export type {
  PayablesAgingView,
  PayablesBadgeTone,
  PayablesCashFlowDays,
  PayablesColumn,
  PayablesKpiItem,
  PayablesKpiTone,
  PayablesListFilters,
  PayablesListParams,
  PayablesListView,
  PayablesPriorityFilter,
  PayablesSort,
  PayablesSortOrder,
  PayablesStatusFilter,
  PayablesAgingBucketRow,
  SupplierAgingRow,
} from './types'
