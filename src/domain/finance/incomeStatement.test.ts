import { describe, expect, it } from 'vitest'
import { incomeComparisonView, incomeStatementKpis, incomeStatementView } from './incomeStatement'
import type { IncomeStatement } from '@/types/bi'

const statement = (overrides: Partial<IncomeStatement> = {}): IncomeStatement => ({
  period: { start_date: '2026-10-01T00:00:00-03:00', end_date: '2026-11-01T00:00:00-03:00' },
  revenue: {
    gross_sales: 1475500,
    returns: 0,
    discounts: 0,
    net_sales: 1475500,
    by_category: [{ category_id: '1', category_name: 'Electrónicos', amount: 1050000, percentage: 71.16 }],
    by_payment_method: [{ method: 'unknown', amount: 1475500, percentage: 100 }],
  },
  cost_of_sales: {
    beginning_inventory: 0,
    purchases: 275000,
    purchase_returns: 0,
    ending_inventory: 13377100,
    cost_of_goods_sold: 945000,
  },
  gross_profit: { amount: 530500, margin: 35.95, percentage: 35.95 },
  expenses: {
    operating: 0,
    salaries: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    other: 0,
    total: 0,
    by_category: null,
  },
  operating_income: 530500,
  other_income: 0,
  other_expenses: 0,
  net_income: 530500,
  ...overrides,
})

describe('finance/incomeStatement', () => {
  it('expone las ausencias del contrato (gastos/devoluciones en 0)', () => {
    const view = incomeStatementView(statement())!
    expect(view.netSales).toBe(1475500)
    expect(view.cogs).toBe(945000)
    expect(view.grossProfit).toBe(530500)
    expect(view.hasModeledExpenses).toBe(false)
    expect(view.hasReturnsOrDiscounts).toBe(false)
    expect(view.categories).toHaveLength(1)
    expect(incomeStatementView(null)).toBeNull()
  })

  it('no ofrece el KPI de gastos si el backend no los modela', () => {
    const kpis = incomeStatementKpis(incomeStatementView(statement())!)
    expect(kpis.map((kpi) => kpi.id)).toEqual([
      'netSales',
      'cogs',
      'grossProfit',
      'grossMargin',
    ])
  })

  it('incluye gastos cuando el backend los calcula', () => {
    const view = incomeStatementView(
      statement({
        expenses: {
          operating: 100,
          salaries: 50,
          rent: 0,
          utilities: 0,
          marketing: 0,
          other: 0,
          total: 150,
        },
        operating_income: 530350,
        net_income: 530350,
      }),
    )!
    expect(view.hasModeledExpenses).toBe(true)
    expect(incomeStatementKpis(view).map((kpi) => kpi.id)).toContain('operatingExpenses')
  })

  it('lee la comparación solo cuando existe', () => {
    expect(incomeComparisonView(statement())).toBeNull()
    const comparison = incomeComparisonView(
      statement({
        comparison: {
          previous_period: { start_date: '2026-08-31', end_date: '2026-10-01' },
          revenue_change: 555355,
          revenue_change_pct: 60.35,
          expense_change: 0,
          expense_change_pct: 0,
          net_income_change: 555355,
          net_income_change_pct: 60.35,
        },
      }),
    )!
    expect(comparison.revenueChangePct).toBe(60.35)
  })
})
