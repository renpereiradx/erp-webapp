import { describe, expect, it } from 'vitest'
import {
  financialOverviewKpis,
  financialOverviewView,
  financialRatioKpis,
  healthScoreView,
} from './overview'
import type { FinancialReportOverview } from '@/types/bi'

const overview: FinancialReportOverview = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  revenue: 1475500,
  expenses: 275000,
  net_income: 1200500,
  cash_position: 337260,
  receivables: 315250.38,
  payables: 3110450,
  working_capital: 10919160.38,
  key_ratios: {
    current_ratio: 4.5104,
    quick_ratio: 0.2097,
    gross_margin: 81.36,
    net_margin: 81.36,
    dso: 0,
    dpo: 0,
    inventory_turnover: 0,
    asset_turnover: 0,
  },
}

describe('finance/overview', () => {
  it('nombra compras y resultado sin llamarlos gastos/utilidad', () => {
    const view = financialOverviewView(overview)!
    expect(view.purchases).toBe(275000)
    expect(view.revenueMinusPurchases).toBe(1200500)
    expect(view.cashPosition).toBe(337260)
    expect(view.currentRatio).toBe(4.5104)
    expect(financialOverviewKpis(view).map((kpi) => kpi.id)).toEqual([
      'revenue',
      'purchases',
      'revenueMinusPurchases',
      'cashPosition',
      'receivables',
      'payables',
      'workingCapital',
    ])
    expect(financialRatioKpis(view).map((kpi) => kpi.id)).toEqual([
      'currentRatio',
      'quickRatio',
    ])
  })

  it('no expone DSO/DPO/rotaciones (el BE los deja en 0)', () => {
    const view = financialOverviewView(overview)!
    const ids = financialRatioKpis(view).map((kpi) => kpi.id)
    expect(ids).not.toContain('dso')
    expect(ids).not.toContain('dpo')
    expect(ids).not.toContain('inventoryTurnover')
  })

  it('vista del score conserva rating y ventana', () => {
    const view = healthScoreView({
      score: 95,
      rating: 'EXCELLENT',
      current_ratio: 4.5,
      quick_ratio: 0.2,
      net_margin: 81.3,
      working_capital: 100,
      period_start: '2026-10-01',
      period_end: '2026-11-01',
    })!
    expect(view.score).toBe(95)
    expect(view.rating).toBe('EXCELLENT')
    expect(healthScoreView(null)).toBeNull()
  })
})
