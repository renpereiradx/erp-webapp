/**
 * Tipos de presentación del feature Reportes Financieros (F9).
 * Los payloads reales viven en `src/types/bi.ts`; acá se re-exportan los
 * tipos derivados que consumen páginas y componentes.
 */
export type {
  FinanceKpiItem,
  FinanceKpiTone,
} from '../components/FinanceKpiLedger'
export type { FinanceBadgeTone } from '../components/Badges'
export type { FinanceColumn } from '../components/FinanceTable'
export type { StatementRow } from '../components/StatementTable'
export type { BreakdownRow } from '../components/BreakdownTable'
export type { LedgerFilterValues } from '../components/LedgerFilters'
export type {
  DailyCashFlowRow,
  CashFlowView,
} from '@/domain/finance/cashFlow'
export type { VatView, TaxSummaryView } from '@/domain/finance/vat'
export type {
  IncomeStatementView,
  IncomeComparisonView,
} from '@/domain/finance/incomeStatement'
export type {
  FinancialOverviewView,
  HealthScoreView,
} from '@/domain/finance/overview'
export type {
  ProrrateoRow,
  ProrrateoDetailRow,
} from '@/domain/finance/prorrateo'
export type { FinanceKpiValue } from '@/domain/finance/kpis'
export type { SalesLedgerQueryParams, PurchaseLedgerQueryParams, SalesLedgerView } from '../hooks/useFinancialReportsQueries'
