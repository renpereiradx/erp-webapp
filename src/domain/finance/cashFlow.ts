/**
 * Flujo de caja (F9) — vista pura del contrato `CashFlowStatement`.
 *
 * Base CAJA: `cash_from_sales` son cobros (sale_payments) de ventas del
 * período y `cash_from_receivables` cobros de ventas anteriores; los pagos son
 * purchase_payments por fecha de pago. `beginning_cash` es el saldo de cajas
 * ABIERTAS, no un saldo bancario.
 *
 * Los valores se muestran tal cual los reporta el backend (sin fallbacks ni
 * re-derivaciones). `reconciliation` solo advierte si el payload dejó de
 * cuadrar: neto ≠ salidas/entradas o cierre ≠ inicio + neto.
 */
import type { CashFlowStatement, DailyCashFlow } from '@/types/bi'
import { isMissingDate, toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface DailyCashFlowRow extends DailyCashFlow {
  date: string
}

export interface CashFlowView {
  beginningCash: number | null
  endingCash: number | null
  netCashChange: number | null
  salesCollections: number | null
  priorCollections: number | null
  totalInflows: number | null
  supplierPayments: number | null
  expensePayments: number | null
  salaryPayments: number | null
  otherOperating: number | null
  totalOutflows: number | null
  operatingNet: number | null
  investingNet: number | null
  financingNet: number | null
  daily: DailyCashFlowRow[]
  dailyInflows: number | null
  dailyOutflows: number | null
  dailyNet: number | null
  reconciled: boolean
}

const sortedDaily = (
  rows: DailyCashFlow[] | null | undefined,
): DailyCashFlowRow[] =>
  (Array.isArray(rows) ? rows : [])
    .filter((row) => !isMissingDate(row.date))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

export const cashFlowView = (
  statement: CashFlowStatement | null | undefined,
): CashFlowView | null => {
  if (!statement) return null
  const operating = statement.operating_activities
  const investing = statement.investing_activities
  const financing = statement.financing_activities

  const salesCollections = toNumberOrNull(operating?.cash_from_sales)
  const priorCollections = toNumberOrNull(operating?.cash_from_receivables)
  const supplierPayments = toNumberOrNull(operating?.cash_paid_to_suppliers)
  const expensePayments = toNumberOrNull(operating?.cash_paid_for_expenses)
  const salaryPayments = toNumberOrNull(operating?.cash_paid_for_salaries)
  const otherOperating = toNumberOrNull(operating?.other_operating)

  const totalInflows =
    salesCollections === null && priorCollections === null
      ? null
      : (salesCollections ?? 0) + (priorCollections ?? 0)
  const totalOutflows =
    supplierPayments === null &&
    expensePayments === null &&
    salaryPayments === null &&
    otherOperating === null
      ? null
      : (supplierPayments ?? 0) +
        (expensePayments ?? 0) +
        (salaryPayments ?? 0) +
        (otherOperating ?? 0)

  const beginningCash = toNumberOrNull(statement.beginning_cash)
  const endingCash = toNumberOrNull(statement.ending_cash)
  const netCashChange = toNumberOrNull(statement.net_cash_change)
  const operatingNet = toNumberOrNull(operating?.net_operating_cash_flow)

  const daily = sortedDaily(statement.daily_breakdown)
  const dailyInflows = daily.length
    ? daily.reduce((sum, row) => sum + (toNumberOrNull(row.inflows) ?? 0), 0)
    : null
  const dailyOutflows = daily.length
    ? daily.reduce((sum, row) => sum + (toNumberOrNull(row.outflows) ?? 0), 0)
    : null
  const dailyNet = daily.length
    ? daily.reduce((sum, row) => sum + (toNumberOrNull(row.net_flow) ?? 0), 0)
    : null

  const close = (a: number | null, b: number | null, tolerance = 0.5): boolean =>
    a !== null && b !== null && Math.abs(a - b) <= tolerance

  const reconciled =
    close(totalInflows, dailyInflows) &&
    close(totalOutflows, dailyOutflows) &&
    close(netCashChange, dailyNet) &&
    close(netCashChange, operatingNet) &&
    close(endingCash, beginningCash !== null && netCashChange !== null ? beginningCash + netCashChange : null)

  return {
    beginningCash,
    endingCash,
    netCashChange,
    salesCollections,
    priorCollections,
    totalInflows,
    supplierPayments,
    expensePayments,
    salaryPayments,
    otherOperating,
    totalOutflows,
    operatingNet,
    investingNet: toNumberOrNull(investing?.net_investing_cash_flow),
    financingNet: toNumberOrNull(financing?.net_financing_cash_flow),
    daily,
    dailyInflows,
    dailyOutflows,
    dailyNet,
    reconciled,
  }
}

/** KPIs del flujo: caja inicial, cobros, pagos, flujo neto y caja al cierre. */
export const cashFlowKpis = (view: CashFlowView): FinanceKpiValue[] => [
  { id: 'beginningCash', kind: 'money', value: view.beginningCash },
  { id: 'inflows', kind: 'money', value: view.totalInflows },
  { id: 'outflows', kind: 'money', value: view.totalOutflows },
  { id: 'netCashChange', kind: 'money', value: view.netCashChange },
  { id: 'endingCash', kind: 'money', value: view.endingCash },
]

/** Actividades de inversión/financiación: el BE las deja en 0 (no modeladas). */
export const hasInvestingActivity = (view: CashFlowView): boolean =>
  (view.investingNet ?? 0) !== 0

export const hasFinancingActivity = (view: CashFlowView): boolean =>
  (view.financingNet ?? 0) !== 0
