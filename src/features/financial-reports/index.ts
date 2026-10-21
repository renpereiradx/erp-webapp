/**
 * Superficie pública del feature `financial-reports` (F9).
 * Las páginas importan de acá; la dirección de dependencias es
 * `pages → features → (domain, services)`.
 */

export { AllocationBadge, FinanceBadge, HealthRatingBadge, ProrrateoStatusBadge, VatStatusBadge } from './components/Badges'
export { BreakdownTable } from './components/BreakdownTable'
export { DailyCashFlowTable } from './components/DailyCashFlowTable'
export { FinanceKpiLedger } from './components/FinanceKpiLedger'
export { FinancialReportsPageLayout } from './components/FinancialReportsPageLayout'
export { FinanceRefreshButton } from './components/FinanceRefreshButton'
export { FinancePeriodSelector } from './components/FinancePeriodSelector'
export { FinanceTable } from './components/FinanceTable'
export { HealthScorePanel } from './components/HealthScorePanel'
export { LedgerFilters } from './components/LedgerFilters'
export { ProrrateoDetailsTable } from './components/ProrrateoDetailsTable'
export { ProrrateoHistoryTable } from './components/ProrrateoHistoryTable'
export { StatementTable } from './components/StatementTable'

export { useFinancePeriod } from './hooks/useFinancePeriod'
export {
  FINANCE_STALE_TIME,
  financeQueryKeys,
  useCashFlowStatement,
  useFinancialHealthScore,
  useFinancialOverview,
  useIncomeStatement,
  usePurchaseLedger,
  useProrrateoDetails,
  useProrrateoHistory,
  useSalesLedger,
  useTaxSummary,
  useVatReport,
} from './hooks/useFinancialReportsQueries'

export type {
  BreakdownRow,
  CashFlowView,
  DailyCashFlowRow,
  FinanceBadgeTone,
  FinanceColumn,
  FinanceKpiItem,
  FinanceKpiTone,
  FinanceKpiValue,
  FinancialOverviewView,
  HealthScoreView,
  IncomeComparisonView,
  IncomeStatementView,
  LedgerFilterValues,
  ProrrateoDetailRow,
  ProrrateoRow,
  PurchaseLedgerQueryParams,
  SalesLedgerQueryParams,
  SalesLedgerView,
  StatementRow,
  TaxSummaryView,
  VatView,
} from './types'
