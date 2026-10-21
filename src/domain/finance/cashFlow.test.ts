import { describe, expect, it } from 'vitest'
import { cashFlowKpis, cashFlowView, hasFinancingActivity, hasInvestingActivity } from './cashFlow'
import type { CashFlowStatement } from '@/types/bi'

const statement = (overrides: Partial<CashFlowStatement> = {}): CashFlowStatement => ({
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  beginning_cash: 337260,
  operating_activities: {
    cash_from_sales: 1475500,
    cash_from_receivables: 41860,
    cash_paid_to_suppliers: 275000,
    cash_paid_for_expenses: 0,
    cash_paid_for_salaries: 0,
    other_operating: 0,
    net_operating_cash_flow: 1242360,
  },
  investing_activities: {
    equipment_purchases: 0,
    equipment_sales: 0,
    other_investing: 0,
    net_investing_cash_flow: 0,
  },
  financing_activities: {
    loan_proceeds: 0,
    loan_payments: 0,
    owner_contributions: 0,
    owner_withdrawals: 0,
    other_financing: 0,
    net_financing_cash_flow: 0,
  },
  ending_cash: 1579620,
  net_cash_change: 1242360,
  daily_breakdown: [
    { date: '2026-10-14', inflows: 117260, outflows: 0, net_flow: 117260, balance: 1521020 },
    { date: '2026-10-06', inflows: 0, outflows: 275000, net_flow: -275000, balance: 62260 },
    { date: '2026-10-01', inflows: 1254100, outflows: 0, net_flow: 1254100, balance: 1591360 },
    { date: '2026-10-05', inflows: 26000, outflows: 0, net_flow: 26000, balance: 1617360 },
    { date: '2026-10-20', inflows: 120000, outflows: 0, net_flow: 120000, balance: 1579620 },
  ],
  ...overrides,
})

describe('finance/cashFlow', () => {
  it('conserva los importes del payload y ordena el desglose diario', () => {
    const view = cashFlowView(statement())!
    expect(view.totalInflows).toBe(1517360)
    expect(view.totalOutflows).toBe(275000)
    expect(view.netCashChange).toBe(1242360)
    expect(view.endingCash).toBe(1579620)
    expect(view.daily.map((row) => row.date)).toEqual([
      '2026-10-01',
      '2026-10-05',
      '2026-10-06',
      '2026-10-14',
      '2026-10-20',
    ])
    expect(view.dailyNet).toBe(1242360)
    expect(view.reconciled).toBe(true)
    expect(cashFlowView(null)).toBeNull()
  })

  it('marca una conciliación rota sin re-derivar las cifras', () => {
    const view = cashFlowView(statement({ ending_cash: 62260 }))!
    expect(view.reconciled).toBe(false)
    expect(view.endingCash).toBe(62260)
  })

  it('no inventa actividades de inversión/financiación', () => {
    const view = cashFlowView(statement())!
    expect(hasInvestingActivity(view)).toBe(false)
    expect(hasFinancingActivity(view)).toBe(false)
  })

  it('arma los KPIs del flujo', () => {
    const kpis = cashFlowKpis(cashFlowView(statement())!)
    expect(kpis.map((kpi) => kpi.id)).toEqual([
      'beginningCash',
      'inflows',
      'outflows',
      'netCashChange',
      'endingCash',
    ])
  })
})
