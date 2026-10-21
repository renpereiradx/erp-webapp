import { describe, expect, it } from 'vitest'
import {
  buildAgingKpis,
  buildCashFlowKpis,
  buildListKpis,
  buildPeriodKpis,
  buildPortfolioKpis,
  buildScheduleKpis,
  buildSupplierKpis,
  formatKpiValue,
  type PayablesKpiValue,
} from './overview'
import type {
  CashFlowProjection,
  PayablesAgingReport,
  PayablesOverview,
  PayablesStatistics,
  PaymentCalendar,
  SupplierAnalysis,
} from '@/types/bi'

const overview: PayablesOverview = {
  total_pending: 6014250,
  total_overdue: 6413250,
  total_count: 17,
  overdue_count: 9,
  due_this_week: 1000,
  due_this_month: 2000,
  average_days_to_pay: 14.75,
  payment_rate: 71.87,
  currency: 'PYG',
  aging_summary: {
    current: { amount: 100, count: 1, percentage: 1 },
    days_30_60: { amount: 2700, count: 2, percentage: 45 },
    days_60_90: { amount: 0, count: 0, percentage: 0 },
    over_90_days: { amount: 3300, count: 3, percentage: 55 },
  },
}

const statistics: PayablesStatistics = {
  period: '2026-10-01 - 2026-11-01',
  total_purchased: 1000,
  total_paid: 800,
  payment_rate: 80,
  average_dpo: 12.5,
  overdue_percentage: 40,
  top_suppliers: null,
  payment_trend: null,
}

const projection: CashFlowProjection = {
  period: '30 days',
  expected_inflows: 500,
  expected_outflows: 250,
  net_cash_flow: 250,
  cumulative_flow: 250,
  projection_days: null,
}

const calendar: PaymentCalendar = {
  start_date: '2026-10-20',
  end_date: '2026-11-19',
  total_due: 750,
  schedule: [
    {
      date: '2026-10-25',
      day_of_week: 'Domingo',
      total_due: 500,
      item_count: 2,
      items: null,
    },
    {
      date: '2026-11-02',
      day_of_week: 'Lunes',
      total_due: 250,
      item_count: 1,
      items: null,
    },
  ],
}

const agingReport: PayablesAgingReport = {
  generated_at: '2026-10-20T10:00:00Z',
  summary: overview.aging_summary,
  by_supplier: null,
  total_amount: 6200,
  total_suppliers: 4,
}

const analysis: SupplierAnalysis = {
  supplier_id: 'SP-1',
  supplier_name: 'Protek',
  total_pending: 500000,
  total_overdue: 500000,
  pending_count: 1,
  payment_history: 'EXCELLENT',
  avg_days_to_pay: 14.75,
  share_percentage: 8.31,
  importance: 'MEDIUM',
  credit_terms: 30,
  oldest_debt: '2026-06-01T00:00:00Z',
}

const ids = (kpis: PayablesKpiValue[]) => kpis.map((kpi) => kpi.id)

describe('payables/overview', () => {
  it('arma los KPIs de cartera desde el overview', () => {
    const kpis = buildPortfolioKpis(overview)
    expect(ids(kpis)).toEqual([
      'pending',
      'overdue',
      'accounts',
      'overdueAccounts',
      'dueThisWeek',
      'dueThisMonth',
      'paymentRate',
      'settledAge',
    ])
    // `total_pending` netea sobrepagos; el KPI usa el total clasificado del
    // aging (100 + 2700 + 0 + 3300).
    expect(kpis[0]).toEqual({ id: 'pending', kind: 'money', value: 6100 })
    expect(kpis[6]).toEqual({ id: 'paymentRate', kind: 'percent', value: 71.87 })
  })

  it('arma los KPIs del período y del listado', () => {
    expect(ids(buildPeriodKpis(statistics))).toEqual([
      'purchased',
      'paid',
      'periodPaymentRate',
      'periodDpo',
      'periodOverdueShare',
    ])
    expect(
      buildListKpis(
        { total_amount: 10, total_pending: 6, total_paid: 4, item_count: 2 },
        { page: 1, page_size: 10, total_items: 12, total_pages: 2 },
      ),
    ).toContainEqual({ id: 'listCount', kind: 'count', value: 12 })
  })

  it('arma calendario, flujo, aging y proveedor', () => {
    expect(buildScheduleKpis(calendar)).toEqual([
      { id: 'scheduleTotal', kind: 'money', value: 750 },
      { id: 'scheduleDays', kind: 'count', value: 2 },
      { id: 'scheduleItems', kind: 'count', value: 3 },
    ])
    expect(ids(buildCashFlowKpis(projection))).toEqual([
      'inflows',
      'outflows',
      'netFlow',
      'cumulative',
    ])
    expect(ids(buildAgingKpis(agingReport))).toEqual([
      'agingTotal',
      'agingSuppliers',
      'agingOver90',
      'agingUnclassified',
    ])
    expect(buildAgingKpis(agingReport)[3]).toEqual({
      id: 'agingUnclassified',
      kind: 'money',
      value: 100,
    })
    expect(ids(buildSupplierKpis(analysis))).toEqual([
      'supplierPending',
      'supplierOverdue',
      'supplierPendingCount',
      'supplierShare',
      'supplierAvgDays',
      'supplierOldest',
    ])
  })

  it('formatea cada tipo y usa — en ausencias', () => {
    expect(formatKpiValue({ id: 'a', kind: 'money', value: 1000 })).toContain('1.000')
    expect(formatKpiValue({ id: 'a', kind: 'percent', value: 71.87 })).toBe('71,9%')
    expect(formatKpiValue({ id: 'a', kind: 'days', value: 14.75 })).toBe('15')
    expect(formatKpiValue({ id: 'a', kind: 'count', value: null })).toBe('—')
    expect(formatKpiValue({ id: 'a', kind: 'date', value: '0001-01-01T00:00:00Z' })).toBe('—')
    expect(formatKpiValue({ id: 'a', kind: 'date', value: '2026-10-20T00:00:00Z' }, 'es')).toContain(
      '2026',
    )
  })
})
