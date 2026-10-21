/**
 * Estado de resultados (P&L) — vista pura del contrato `IncomeStatement`.
 *
 * El backend NO modela gastos operativos: `expenses.*` viaja en 0 y
 * `operating_income`/`net_income` espejan `gross_profit`. Tampoco calcula
 * devoluciones ni descuentos (`returns`/`discounts` = 0). La vista expone esas
 * ausencias (`hasModeledExpenses`, `hasReturnsOrDiscounts`) para que la UI no
 * las presente como ceros medidos.
 */
import type { IncomeStatement } from '@/types/bi'
import { toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface IncomeStatementView {
  grossSales: number | null
  returns: number | null
  discounts: number | null
  netSales: number | null
  purchases: number | null
  cogs: number | null
  grossProfit: number | null
  grossMarginPct: number | null
  expensesTotal: number | null
  expensesByCategory: NonNullable<IncomeStatement['expenses']['by_category']>
  hasModeledExpenses: boolean
  hasReturnsOrDiscounts: boolean
  operatingIncome: number | null
  otherIncome: number | null
  otherExpenses: number | null
  netIncome: number | null
  categories: NonNullable<IncomeStatement['revenue']['by_category']>
  paymentMethods: NonNullable<IncomeStatement['revenue']['by_payment_method']>
}

export const incomeStatementView = (
  statement: IncomeStatement | null | undefined,
): IncomeStatementView | null => {
  if (!statement) return null
  const categories = Array.isArray(statement.revenue?.by_category)
    ? statement.revenue.by_category
    : []
  const paymentMethods = Array.isArray(statement.revenue?.by_payment_method)
    ? statement.revenue.by_payment_method
    : []
  const expensesByCategory = Array.isArray(statement.expenses?.by_category)
    ? statement.expenses.by_category
    : []
  const returns = toNumberOrNull(statement.revenue?.returns)
  const discounts = toNumberOrNull(statement.revenue?.discounts)
  const expensesTotal = toNumberOrNull(statement.expenses?.total)

  return {
    grossSales: toNumberOrNull(statement.revenue?.gross_sales),
    returns,
    discounts,
    netSales: toNumberOrNull(statement.revenue?.net_sales),
    purchases: toNumberOrNull(statement.cost_of_sales?.purchases),
    cogs: toNumberOrNull(statement.cost_of_sales?.cost_of_goods_sold),
    grossProfit: toNumberOrNull(statement.gross_profit?.amount),
    grossMarginPct: toNumberOrNull(statement.gross_profit?.margin),
    expensesTotal,
    expensesByCategory,
    hasModeledExpenses: (expensesTotal ?? 0) > 0 || expensesByCategory.length > 0,
    hasReturnsOrDiscounts: (returns ?? 0) > 0 || (discounts ?? 0) > 0,
    operatingIncome: toNumberOrNull(statement.operating_income),
    otherIncome: toNumberOrNull(statement.other_income),
    otherExpenses: toNumberOrNull(statement.other_expenses),
    netIncome: toNumberOrNull(statement.net_income),
    categories,
    paymentMethods,
  }
}

/**
 * KPIs del P&L: ventas netas, costo de ventas, utilidad bruta y margen. Los
 * gastos solo se ofrecen si el backend los modeló (`hasModeledExpenses`).
 */
export const incomeStatementKpis = (view: IncomeStatementView): FinanceKpiValue[] => {
  const kpis: FinanceKpiValue[] = [
    { id: 'netSales', kind: 'money', value: view.netSales },
    { id: 'cogs', kind: 'money', value: view.cogs },
    { id: 'grossProfit', kind: 'money', value: view.grossProfit },
    { id: 'grossMargin', kind: 'percent', value: view.grossMarginPct },
  ]
  if (view.hasModeledExpenses) {
    kpis.push({ id: 'operatingExpenses', kind: 'money', value: view.expensesTotal })
  }
  return kpis
}

export interface IncomeComparisonView {
  revenueChange: number | null
  revenueChangePct: number | null
  expenseChange: number | null
  expenseChangePct: number | null
  netIncomeChange: number | null
  netIncomeChangePct: number | null
}

/** Comparación contra la ventana previa, solo si el endpoint la adjuntó. */
export const incomeComparisonView = (
  statement: IncomeStatement | null | undefined,
): IncomeComparisonView | null => {
  const comparison = statement?.comparison
  if (!comparison) return null
  return {
    revenueChange: toNumberOrNull(comparison.revenue_change),
    revenueChangePct: toNumberOrNull(comparison.revenue_change_pct),
    expenseChange: toNumberOrNull(comparison.expense_change),
    expenseChangePct: toNumberOrNull(comparison.expense_change_pct),
    netIncomeChange: toNumberOrNull(comparison.net_income_change),
    netIncomeChangePct: toNumberOrNull(comparison.net_income_change_pct),
  }
}
