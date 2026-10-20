import { describe, expect, it } from 'vitest'
import type { DashboardTrends } from '@/types/bi'
import { buildTrendViews, roundPercentage } from './trends'

const TRENDS: DashboardTrends = {
  sales: {
    current: 551760,
    previous: 311500,
    change_amount: 240260,
    change_percentage: 77.1,
    trend: 'up',
  },
  purchases: {
    current: 262500,
    previous: 135850,
    change_amount: 126650,
    change_percentage: 93.2,
    trend: 'up',
  },
  gross_margin: {
    current: 52.4,
    previous: 48.1,
    change_amount: 4.3,
    change_percentage: 8.9,
    trend: 'up',
  },
  average_ticket: {
    current: 68970,
    previous: 62250,
    change_amount: 6720,
    change_percentage: 10.8,
    trend: 'up',
  },
  customer_count: {
    current: 8,
    previous: 5,
    change_amount: 3,
    change_percentage: 60,
    trend: 'up',
  },
}

describe('buildTrendViews', () => {
  it('devuelve solo las métricas con semántica verificada (ventas, compras, ticket)', () => {
    const views = buildTrendViews(TRENDS)
    expect(views.map((view) => view.key)).toEqual(['sales', 'purchases', 'average_ticket'])
    expect(views.map((view) => view.kind)).toEqual(['money', 'money', 'money'])
  })

  it('copia los valores reales del payload', () => {
    const [sales] = buildTrendViews(TRENDS)
    expect(sales).toEqual({
      key: 'sales',
      kind: 'money',
      current: 551760,
      previous: 311500,
      changeAmount: 240260,
      changePercentage: 77.1,
      trend: 'up',
    })
  })

  it('normaliza una tendencia desconocida a partir del cambio porcentual', () => {
    const views = buildTrendViews({
      ...TRENDS,
      sales: { ...TRENDS.sales, trend: 'whatever', change_percentage: -12.5 },
      purchases: { ...TRENDS.purchases, trend: 'whatever', change_percentage: 0.5 },
    })
    expect(views[0]?.trend).toBe('down')
    expect(views[1]?.trend).toBe('stable')
  })

  it('devuelve [] sin payload', () => {
    expect(buildTrendViews(null)).toEqual([])
    expect(buildTrendViews(undefined)).toEqual([])
  })
})

describe('roundPercentage', () => {
  it.each([
    [-63.017946325668184, -63],
    [77.15, 77.2],
    [10.04, 10],
    [null, 0],
  ])('%s → %s', (value, expected) => {
    expect(roundPercentage(value, 1)).toBe(expected)
  })

  it('respeta los decimales pedidos', () => {
    expect(roundPercentage(63.0179, 2)).toBe(63.02)
  })
})
