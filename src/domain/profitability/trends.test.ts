import { describe, expect, it } from 'vitest'
import {
  buildTrendInsight,
  revenueBarWidth,
  trendPoints,
  trendRows,
} from './trends'
import type { ProfitabilityTrendPoint } from '@/types/bi'

const point = (overrides: Partial<ProfitabilityTrendPoint>): ProfitabilityTrendPoint => ({
  date: '2026-10-01T00:00:00Z',
  label: '01 Oct',
  revenue: 1000,
  cost: 600,
  gross_profit: 400,
  gross_margin_pct: 40,
  net_profit: 400,
  net_margin_pct: 40,
  transactions: 1,
  units_sold: 1,
  ...overrides,
})

describe('trendPoints / trendRows', () => {
  it('normaliza el slice nil de Go', () => {
    expect(trendPoints({ data_points: null } as never)).toEqual([])
    expect(trendPoints(null)).toEqual([])
  })

  it('deriva la etiqueta del date, no del label inglés del BE', () => {
    const rows = trendRows(
      [point({ date: '2026-10-01T00:00:00Z', label: '01 Oct' })],
      'daily',
      'es',
    )
    expect(rows[0].label).toBe('01 oct')
    expect(rows[0].key).toBe('2026-10-01T00:00:00Z')
  })

  it('mensual usa mes/año y semanal el día del bucket', () => {
    expect(trendRows([point({})], 'monthly', 'es')[0].label).toBe('oct 2026')
    expect(
      trendRows([point({ date: '2026-09-28T00:00:00Z' })], 'weekly', 'es')[0].label,
    ).toBe('28 sept')
  })
})

describe('buildTrendInsight', () => {
  it('replica el resumen del BE (crecimiento primera→última, dirección 5 %)', () => {
    const insight = buildTrendInsight([
      point({ date: '2026-10-01T00:00:00Z', revenue: 1254100, gross_profit: 347100, gross_margin_pct: 27.677 }),
      point({ date: '2026-10-05T00:00:00Z', revenue: 26000, gross_profit: 16000, gross_margin_pct: 61.538 }),
      point({ date: '2026-10-14T00:00:00Z', revenue: 75400, gross_profit: 47400, gross_margin_pct: 62.865 }),
      point({ date: '2026-10-20T00:00:00Z', revenue: 120000, gross_profit: 120000, gross_margin_pct: 100 }),
    ])
    expect(insight.totalRevenue).toBe(1475500)
    expect(insight.totalProfit).toBe(530500)
    expect(insight.growthRate).toBeCloseTo(-65.4278, 3)
    expect(insight.direction).toBe('down')
    expect(insight.peakRevenue?.date).toBe('2026-10-01T00:00:00Z')
    expect(insight.peakRevenue?.value).toBe(1254100)
    expect(insight.peakProfit?.date).toBe('2026-10-01T00:00:00Z')
    expect(insight.lowestMargin?.date).toBe('2026-10-01T00:00:00Z')
    expect(insight.averageMargin).toBeCloseTo(63.02, 2)
  })

  it('sin base positiva no hay crecimiento (null, no 0 %)', () => {
    const insight = buildTrendInsight([
      point({ gross_profit: 0 }),
      point({ date: '2026-10-02T00:00:00Z', gross_profit: 100 }),
    ])
    expect(insight.growthRate).toBeNull()
    expect(insight.direction).toBe('up')
  })

  it('un solo punto: sin dirección ni crecimiento; extremos reales', () => {
    const insight = buildTrendInsight([
      point({ revenue: 500, gross_profit: 100, gross_margin_pct: 20 }),
    ])
    expect(insight.direction).toBeNull()
    expect(insight.growthRate).toBeNull()
    expect(insight.peakRevenue?.value).toBe(500)
    expect(insight.peakProfit?.value).toBe(100)
    expect(insight.lowestMargin?.value).toBe(20)
  })

  it('lista vacía: totales 0 y extremos null', () => {
    const insight = buildTrendInsight([])
    expect(insight.totalRevenue).toBe(0)
    expect(insight.totalProfit).toBe(0)
    expect(insight.averageMargin).toBeNull()
    expect(insight.peakRevenue).toBeNull()
    expect(insight.peakProfit).toBeNull()
    expect(insight.lowestMargin).toBeNull()
  })

  it('ignora puntos con ventas 0 para extremos y dirección estable', () => {
    const insight = buildTrendInsight([
      point({ revenue: 0, gross_profit: 0, gross_margin_pct: 0 }),
      point({ date: '2026-10-02T00:00:00Z', revenue: 1000, gross_profit: 400, gross_margin_pct: 40 }),
    ])
    expect(insight.peakRevenue?.date).toBe('2026-10-02T00:00:00Z')
    expect(insight.lowestMargin?.date).toBe('2026-10-02T00:00:00Z')
    // Misma regla del BE: con primera base 0, cualquier beneficio positivo es UP.
    expect(insight.direction).toBe('up')
    expect(insight.growthRate).toBeNull()
  })

  it('variación dentro de ±5 % es estable', () => {
    const insight = buildTrendInsight([
      point({ gross_profit: 400 }),
      point({ date: '2026-10-02T00:00:00Z', gross_profit: 410 }),
    ])
    expect(insight.direction).toBe('stable')
    expect(insight.growthRate).toBeCloseTo(2.5, 5)
  })
})

describe('revenueBarWidth', () => {
  it.each([
    [1254100, 1254100, 100],
    [627050, 1254100, 50],
    [0, 1254100, 0],
    [100, 0, 0],
    [null, 100, 0],
  ])('%s / %s → %s%%', (value, max, expected) => {
    expect(revenueBarWidth(value, max)).toBe(expected)
  })

  it('un valor positivo mínimo conserva visibilidad', () => {
    expect(revenueBarWidth(1, 1000000)).toBe(2)
  })
})
