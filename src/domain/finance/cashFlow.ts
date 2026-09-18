/**
 * Cash-flow statement view model for CashFlowAnalysisDashboard.
 * Extracted verbatim from the page's 140-line useMemo
 * (PLAN_ALINEACION_BI_FRONTEND F1 — prioridad máxima del plan).
 *
 * Tolerancias del contrato API conservadas: los totales resueltos prefieren
 * el desglose diario y caen a la suma de actividades; ending/net caen a
 * valores derivados cuando el BE no los reporta.
 */
import { formatPYG } from '@/utils/currencyUtils'

export const toNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

/** es-PY 'dd mmm' label; raw value (or '-') for invalid dates. */
export const toDateLabel = (value: string | null | undefined): string => {
  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    return value || '-'
  }

  return date.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
  })
}

/** '+Gs. 1.000' for positives, plain format otherwise. */
export const formatSignedPYG = (amount: number): string =>
  `${amount > 0 ? '+' : ''}${formatPYG(amount)}`

interface CashFlowActivities {
  cash_from_sales?: unknown
  cash_from_receivables?: unknown
  cash_paid_to_suppliers?: unknown
  cash_paid_for_expenses?: unknown
  cash_paid_for_salaries?: unknown
  net_operating_cash_flow?: unknown
  equipment_purchases?: unknown
  net_investing_cash_flow?: unknown
  loan_payments?: unknown
  net_financing_cash_flow?: unknown
  [key: string]: unknown
}

export interface CashFlowSource {
  beginning_cash?: unknown
  ending_cash?: unknown
  net_cash_change?: unknown
  operating_activities?: CashFlowActivities | null
  investing_activities?: CashFlowActivities | null
  financing_activities?: CashFlowActivities | null
  daily_breakdown?: Array<Record<string, unknown>> | null
  [key: string]: unknown
}

export interface CashFlowDailyRow {
  date: string
  inflows: number
  outflows: number
  netFlow: number
  balance: number
}

export interface CashFlowConceptRow {
  concept: string
  inflows?: number
  outflows?: number
  amount?: number
}

export interface CashFlowView {
  beginningCash: number
  endingCash: number
  netCashChange: number
  totalInflows: number
  totalOutflows: number
  operatingRows: CashFlowConceptRow[]
  operatingNet: number
  investingRows: CashFlowConceptRow[]
  investingNet: number
  financingRows: CashFlowConceptRow[]
  financingNet: number
  dailyData: CashFlowDailyRow[]
  maxBarValue: number
  minBalance: number
  maxBalance: number
}

/** Builds the full page view model from the raw /financial-reports/cash-flow payload. */
export const buildCashFlowView = (cashFlow: CashFlowSource | null | undefined): CashFlowView => {
  const source = cashFlow || {}
  const operating = source.operating_activities || {}
  const investing = source.investing_activities || {}
  const financing = source.financing_activities || {}

  const beginning = toNumber(source.beginning_cash)
  const reportedEnding = toNumber(source.ending_cash)
  const reportedNetChange = toNumber(source.net_cash_change)

  const salesInflow = toNumber(operating.cash_from_sales)
  const receivablesInflow = toNumber(operating.cash_from_receivables)
  const suppliersOutflow = toNumber(operating.cash_paid_to_suppliers)
  const expensesOutflow = toNumber(operating.cash_paid_for_expenses)
  const salariesOutflow = toNumber(operating.cash_paid_for_salaries)

  const equipmentOutflow = toNumber(investing.equipment_purchases)
  const loanOutflow = toNumber(financing.loan_payments)

  const normalizedDaily = (
    Array.isArray(source.daily_breakdown) ? source.daily_breakdown : []
  )
    .slice(-7)
    .map((entry) => ({
      date: toDateLabel(entry.date as string),
      inflows: toNumber(entry.inflows),
      outflows: toNumber(entry.outflows),
      netFlow: toNumber(entry.net_flow),
      balance: toNumber(entry.balance),
    }))

  const totalInflowsFromDaily = normalizedDaily.reduce(
    (sum, row) => sum + row.inflows,
    0,
  )
  const totalOutflowsFromDaily = normalizedDaily.reduce(
    (sum, row) => sum + row.outflows,
    0,
  )

  const inflowsFromActivities = salesInflow + receivablesInflow
  const outflowsFromActivities =
    suppliersOutflow +
    expensesOutflow +
    salariesOutflow +
    equipmentOutflow +
    loanOutflow

  const resolvedInflows =
    totalInflowsFromDaily > 0 ? totalInflowsFromDaily : inflowsFromActivities
  const resolvedOutflows =
    totalOutflowsFromDaily > 0
      ? totalOutflowsFromDaily
      : outflowsFromActivities
  const resolvedNetChange =
    reportedNetChange !== 0
      ? reportedNetChange
      : resolvedInflows - resolvedOutflows
  const resolvedEnding =
    reportedEnding !== 0 ? reportedEnding : beginning + resolvedNetChange

  const computedOperatingNet =
    toNumber(operating.net_operating_cash_flow) ||
    salesInflow +
      receivablesInflow -
      suppliersOutflow -
      expensesOutflow -
      salariesOutflow

  const computedInvestingNet =
    toNumber(investing.net_investing_cash_flow) || -Math.abs(equipmentOutflow)

  const computedFinancingNet =
    toNumber(financing.net_financing_cash_flow) || -Math.abs(loanOutflow)

  const balances = normalizedDaily.length
    ? normalizedDaily.map((row) => row.balance)
    : [beginning, resolvedEnding]

  const minBal = Math.min(...balances)
  const maxBal = Math.max(...balances)
  const maxBar = Math.max(
    1,
    ...normalizedDaily.flatMap((row) => [
      row.inflows,
      row.outflows,
      Math.abs(row.netFlow),
    ]),
  )

  return {
    beginningCash: beginning,
    endingCash: resolvedEnding,
    netCashChange: resolvedNetChange,
    totalInflows: resolvedInflows,
    totalOutflows: resolvedOutflows,
    operatingRows: [
      {
        concept: 'Cobros por ventas',
        inflows: salesInflow,
        outflows: 0,
      },
      {
        concept: 'Cobros por cuentas por cobrar',
        inflows: receivablesInflow,
        outflows: 0,
      },
      {
        concept: 'Pagos a proveedores',
        inflows: 0,
        outflows: suppliersOutflow,
      },
      {
        concept: 'Pagos de gastos operativos',
        inflows: 0,
        outflows: expensesOutflow,
      },
      {
        concept: 'Pagos de salarios',
        inflows: 0,
        outflows: salariesOutflow,
      },
    ],
    operatingNet: computedOperatingNet,
    investingRows: [
      {
        concept: 'Compra de equipos',
        amount: -Math.abs(equipmentOutflow),
      },
    ],
    investingNet: computedInvestingNet,
    financingRows: [
      {
        concept: 'Pago de préstamos',
        amount: -Math.abs(loanOutflow),
      },
    ],
    financingNet: computedFinancingNet,
    dailyData: normalizedDaily,
    maxBarValue: maxBar,
    minBalance: minBal,
    maxBalance: maxBal,
  }
}

/**
 * Vertical position (0-100, clamped to 5-95) of a balance dot on the daily
 * chart; 50 when the balance range is flat.
 */
export const getBalancePosition = (
  value: number,
  minBalance: number,
  maxBalance: number,
): number => {
  if (maxBalance === minBalance) {
    return 50
  }
  return clampNumber(
    ((value - minBalance) / (maxBalance - minBalance)) * 100,
    5,
    95,
  )
}
