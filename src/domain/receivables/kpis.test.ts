import { describe, expect, it } from 'vitest'
import {
  buildAgingKpis,
  buildClientKpis,
  buildListKpis,
  buildOverdueKpis,
  buildPeriodKpis,
  buildPortfolioKpis,
  formatKpiValue,
} from './kpis'
import type {
  ClientReceivables,
  ClientRisk,
  ReceivablesAgingReport,
  ReceivablesListSummary,
  ReceivablesOverview,
  ReceivablesStatistics,
} from '@/types/bi'

const OVERVIEW: ReceivablesOverview = {
  total_pending: 315249.88,
  total_overdue: 315250.38,
  total_count: 3,
  overdue_count: 3,
  average_days_to_collect: 115.86206896551724,
  collection_rate: 93.75181450150714,
  currency: 'PYG',
  aging_summary: {
    current: { amount: 0, count: 0, percentage: 0 },
    days_30_60: { amount: 0, count: 0, percentage: 0 },
    days_60_90: { amount: 0, count: 0, percentage: 0 },
    over_90_days: { amount: 315250.38, count: 3, percentage: 100 },
  },
}

const SUMMARY: ReceivablesListSummary = {
  total_amount: 477890.38,
  total_pending: 315250.38,
  total_paid: 162640,
  item_count: 3,
  high_priority_count: 3,
}

const STATS: ReceivablesStatistics = {
  period: '2026-10-01 - 2026-11-01',
  total_billed: 1475500,
  total_collected: 1475500,
  collection_rate: 100,
  average_dso: 0,
  overdue_percentage: 0,
  top_debtors: null,
  collection_trend: null,
}

const CLIENT: ClientReceivables = {
  client_id: 'CL-1',
  client_name: 'Erika Maciel',
  total_pending: 314600,
  total_overdue: 314600,
  pending_count: 1,
  oldest_debt: '2026-06-01T15:24:44.766356Z',
  payment_behavior: 'EXCELLENT',
  average_days_to_pay: 0,
  receivables: null,
}

const RISK: ClientRisk = {
  client_id: 'CL-1',
  risk_level: 'HIGH',
  payment_behavior: 'EXCELLENT',
  total_pending_orders: 1,
  total_pending_amount: 314600,
  total_overdue_amount: 314600,
  total_over_90_amount: 314600,
  overdue_ratio: 1,
  max_days_overdue: 141,
  avg_days_outstanding: 141,
  avg_days_to_pay: 0,
  total_payments: 7,
  collection_rate: 286.9,
  analyzed_at: '2026-10-20T20:52:34-03:00',
}

const find = (rows: ReturnType<typeof buildPortfolioKpis>, id: string) =>
  rows.find((row) => row.id === id)

describe('receivables/kpis (F7)', () => {
  it('la cartera usa el summary exacto del listado y el overview para vencidas', () => {
    const rows = buildPortfolioKpis(OVERVIEW, SUMMARY)
    expect(rows.map((row) => row.id)).toEqual([
      'pending',
      'overdue',
      'accounts',
      'overdueAccounts',
      'highPriority',
      'collectionRate',
      'settledAge',
    ])
    // `pending` sale del listado (suma de cuentas con saldo), no del overview.
    expect(find(rows, 'pending')?.value).toBe(315250.38)
    expect(find(rows, 'overdue')?.value).toBe(315250.38)
    expect(find(rows, 'highPriority')?.value).toBe(3)
    expect(find(rows, 'collectionRate')?.value).toBeCloseTo(93.75, 2)
    expect(find(rows, 'settledAge')?.value).toBeCloseTo(115.86, 2)
  })

  it('sin summary del listado deja las cifras en null (—), no en cero', () => {
    const rows = buildPortfolioKpis(OVERVIEW, null)
    expect(find(rows, 'pending')?.value).toBeNull()
    expect(find(rows, 'highPriority')?.value).toBeNull()
    expect(formatKpiValue(find(rows, 'pending')!)).toBe('—')
  })

  it('arma los KPIs del período con las cifras de statistics', () => {
    const rows = buildPeriodKpis(STATS)
    expect(rows.map((row) => [row.id, row.value])).toEqual([
      ['billed', 1475500],
      ['collected', 1475500],
      ['periodCollectionRate', 100],
      ['periodDso', 0],
      ['periodOverdueShare', 0],
    ])
    expect(formatKpiValue(find(rows, 'billed')!)).toBe('Gs. 1.475.500')
  })

  it('arma los KPIs de la lista con los totales globales del filtro', () => {
    const rows = buildListKpis(SUMMARY)
    expect(rows.map((row) => [row.id, row.value])).toEqual([
      ['listTotal', 477890.38],
      ['listPending', 315250.38],
      ['listPaid', 162640],
      ['listCount', 3],
      ['listHighPriority', 3],
    ])
    expect(buildListKpis(null)[1].value).toBeNull()
  })

  it('arma los KPIs de vencidas desde el summary global', () => {
    const rows = buildOverdueKpis(SUMMARY)
    expect(rows.map((row) => [row.id, row.value])).toEqual([
      ['overduePending', 315250.38],
      ['overdueAccounts', 3],
      ['overdueHighPriority', 3],
      ['overduePaid', 162640],
    ])
  })

  it('solo agrega el tramo sin clasificar cuando el total no cuadra', () => {
    const report: ReceivablesAgingReport = {
      generated_at: '2026-10-20T20:51:46Z',
      summary: OVERVIEW.aging_summary,
      by_client: null,
      total_amount: 315250.38,
      total_clients: 2,
    }
    expect(buildAgingKpis(report).map((row) => row.id)).toEqual([
      'agingTotal',
      'agingClients',
      'agingOver90',
    ])
    expect(
      buildAgingKpis({ ...report, total_amount: 400000 }).map((row) => row.id),
    ).toContain('agingUnclassified')
  })

  it('en la ficha cliente omite el promedio de pago cuando no hay pagos', () => {
    const rows = buildClientKpis(CLIENT, RISK)
    expect(find(rows, 'clientAvgDaysToPay')?.value).toBe(0)
    expect(formatKpiValue(find(rows, 'clientAvgDaysToPay')!)).toBe('0')

    const withoutPayments = buildClientKpis(CLIENT, { ...RISK, total_payments: 0 })
    expect(find(withoutPayments, 'clientAvgDaysToPay')?.value).toBeNull()
    expect(formatKpiValue(find(withoutPayments, 'clientAvgDaysToPay')!)).toBe('—')
  })

  it('no expone collection_rate del riesgo (puede superar 100%)', () => {
    const rows = buildClientKpis(CLIENT, RISK)
    expect(rows.some((row) => String(row.value).includes('286.9'))).toBe(false)
    expect(rows.map((row) => row.id)).not.toContain('clientCollectionRate')
  })

  it('formatea cada tipo de KPI', () => {
    expect(formatKpiValue({ id: 'a', kind: 'money', value: 0 })).toBe('Gs. 0')
    expect(formatKpiValue({ id: 'b', kind: 'percent', value: 93.7518 })).toBe('93,8%')
    expect(formatKpiValue({ id: 'c', kind: 'count', value: 3 })).toBe('3')
    expect(formatKpiValue({ id: 'd', kind: 'days', value: 115.86 })).toBe('116')
    expect(
      formatKpiValue({ id: 'e', kind: 'date', value: '2026-06-01T15:24:44Z' }, 'es'),
    ).toBe('01 jun 2026')
    expect(formatKpiValue({ id: 'f', kind: 'date', value: '0001-01-01T00:00:00Z' })).toBe('—')
    expect(formatKpiValue({ id: 'g', kind: 'money', value: null })).toBe('—')
  })
})
