import { describe, expect, it } from 'vitest'
import type { SalesPerformance } from '@/types/bi'
import { buildSalesKpiRows, buildTrendView } from './kpis'

const PERFORMANCE: SalesPerformance = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  total_sales: 551760,
  total_transactions: 8,
  average_ticket: 68970,
  total_units: 15,
  unique_customers: 4,
  gross_margin: 289260,
  gross_margin_pct: 56.17659852109613,
  returns: { total_returns: 0, return_count: 0, return_rate: 0 },
  comparison: {
    previous_period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    sales_change: 240260,
    sales_change_pct: 77.1,
    transactions_change: 3,
    transactions_change_pct: 60,
    ticket_change: -116224,
    ticket_change_pct: -62.7,
  },
}

describe('buildTrendView', () => {
  it('deriva la dirección del porcentaje', () => {
    expect(buildTrendView(240260, 77.1)).toEqual({
      direction: 'up',
      percentage: 77.1,
      change: 240260,
    })
    expect(buildTrendView(-100, -5)?.direction).toBe('down')
    expect(buildTrendView(0, 0)?.direction).toBe('stable')
  })

  it('sin base comparable (previo en 0) devuelve null en vez de +0%', () => {
    expect(buildTrendView(500, 0)).toBeNull()
  })

  it('valores no numéricos devuelven null', () => {
    expect(buildTrendView(Number.NaN, 10)).toBeNull()
    expect(buildTrendView(10, undefined)).toBeNull()
  })
})

describe('buildSalesKpiRows', () => {
  it('arma las 6 filas en orden con sus tipos', () => {
    const rows = buildSalesKpiRows(PERFORMANCE)
    expect(rows.map((row) => row.id)).toEqual([
      'sales',
      'transactions',
      'ticket',
      'units',
      'customers',
      'margin',
    ])
    expect(rows.map((row) => row.kind)).toEqual([
      'money',
      'count',
      'money',
      'units',
      'count',
      'percent',
    ])
  })

  it('solo ventas, transacciones y ticket traen comparación real', () => {
    const rows = buildSalesKpiRows(PERFORMANCE)
    expect(rows.filter((row) => row.trend).map((row) => row.id)).toEqual([
      'sales',
      'transactions',
      'ticket',
    ])
    expect(rows.find((row) => row.id === 'ticket')?.trend?.direction).toBe('down')
  })

  it('el margen expone el porcentaje y la utilidad en moneda', () => {
    const margin = buildSalesKpiRows(PERFORMANCE).find((row) => row.id === 'margin')
    expect(margin?.value).toBeCloseTo(56.17659852109613)
    expect(margin?.secondaryMoney).toBe(289260)
  })

  it('sin performance no inventa filas', () => {
    expect(buildSalesKpiRows(null)).toEqual([])
    expect(buildSalesKpiRows(undefined)).toEqual([])
  })
})
