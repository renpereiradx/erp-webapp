import { describe, expect, it } from 'vitest'
import {
  buildAgingBars,
  buildAgingStats,
  buildPayablesKpis,
  buildSuppliersDebtRows,
  buildUpcomingPayments,
} from './dashboard'

const OVERVIEW = {
  total_pending: 1200000,
  total_overdue: 300000,
  overdue_count: 4,
  due_this_week: 150000,
  payment_rate: 82.5,
  currency: 'PYG',
  average_days_to_pay: 42.4,
  aging_summary: {
    current: { amount: 700000, percentage: 58 },
    days_30_60: { amount: 300000, percentage: 25 },
    days_60_90: { amount: 150000, percentage: 13 },
    over_90_days: { amount: 50000, percentage: 4 },
  },
}

describe('buildPayablesKpis', () => {
  it('[] sin overview', () => {
    expect(buildPayablesKpis(null)).toEqual([])
  })

  it('4 tarjetas con la marca critical solo en vencido y % en cumplimiento', () => {
    const kpis = buildPayablesKpis(OVERVIEW)
    expect(kpis.map((k) => k.id)).toEqual([
      'total-pending',
      'total-overdue',
      'weekly-payments',
      'compliance-rate',
    ])
    expect(kpis[1]).toMatchObject({ critical: true, trend: '4 facturas', trendType: 'danger' })
    expect(kpis[3]).toMatchObject({ isPercentage: true, progress: 82.5 })
  })
})

describe('buildAgingBars', () => {
  it('[] sin aging_summary', () => {
    expect(buildAgingBars(null)).toEqual([])
    expect(buildAgingBars({})).toEqual([])
  })

  it('4 barras, solo la última critical', () => {
    const bars = buildAgingBars(OVERVIEW)
    expect(bars.map((b) => b.label)).toEqual([
      '0 - 30 Días',
      '31 - 60 Días',
      '61 - 90 Días',
      'Más de 90 Días',
    ])
    expect(bars.map((b) => b.critical ?? false)).toEqual([false, false, false, true])
    expect(bars[0].color).toBe('bg-primary')
  })
})

describe('buildAgingStats', () => {
  it('{} sin overview', () => {
    expect(buildAgingStats(null)).toEqual({})
  })

  it('total compacto, % onTime/critical y días redondeados', () => {
    const stats = buildAgingStats(OVERVIEW)
    expect(stats.onTime).toBe('82,5%')
    expect(stats.critical).toBe('4%')
    expect(stats.avgDays).toBe('42 Días')
    expect(stats.total).toContain('M') // compacto 1,2M
  })
})

describe('buildUpcomingPayments', () => {
  it('[] con schedule vacío o null', () => {
    expect(buildUpcomingPayments(null)).toEqual([])
    expect(buildUpcomingPayments([])).toEqual([])
  })

  it('mapea entradas con prioridad urgente y fallback de factura', () => {
    const cards = buildUpcomingPayments([
      {
        date: '2026-09-20',
        items: [{ payable_id: 'pay_123', supplier_name: 'Alpha', purchase_order_id: 77, amount: 1000, priority: 'HIGH' }],
      },
      {
        date: '2026-10-01',
        items: [{ payable_id: 'pay_456', supplier_name: 'Beta', amount: 2000, priority: 'LOW' }],
      },
      { date: '2026-10-02', items: [] },
    ])
    expect(cards).toHaveLength(2)
    expect(cards[0]).toMatchObject({
      id: 'pay_123',
      vendor: 'Alpha',
      invoice: '#77',
      status: 'Urgente',
      statusType: 'danger',
    })
    expect(cards[0].date.day).toBe('20')
    expect(cards[1]).toMatchObject({ invoice: '#FAC-456', status: 'Programado', statusType: 'info' })
  })
})

describe('buildSuppliersDebtRows', () => {
  const SUPPLIERS = [
    { supplier_id: 's1', supplier_name: 'Alpha', supplier_ruc: '80012345-6', total_pending: 500, total_overdue: 100, next_due_date: '2026-09-25' },
    { supplier_id: 's2', supplier_name: 'Beta', total_pending: 200, total_overdue: 0 },
  ]

  it('[] sin proveedores', () => {
    expect(buildSuppliersDebtRows(null, '')).toEqual([])
  })

  it('mapea filas con prioridad por deuda vencida', () => {
    const rows = buildSuppliersDebtRows(SUPPLIERS, '')
    expect(rows[0]).toMatchObject({
      id: 's1',
      rfc: '80012345-6',
      overdueAmount: 100,
      priority: 'Alta',
      priorityType: 'warning',
    })
    expect(rows[0].nextPayment).toBe(new Date('2026-09-25').toLocaleDateString('es-PY'))
    expect(rows[1]).toMatchObject({ rfc: 'N/A', priority: 'Media', nextPayment: 'Sin pagos pdtes.' })
  })

  it('filtra por búsqueda local', () => {
    expect(buildSuppliersDebtRows(SUPPLIERS, 'bet')).toHaveLength(1)
    expect(buildSuppliersDebtRows(SUPPLIERS, 'bet')[0].id).toBe('s2')
  })
})
