import { describe, expect, it } from 'vitest'
import {
  buildPurchaseTrendSeries,
  buildPurchaseTrendSummary,
  getPurchaseTrendMax,
  purchaseTrendDirectionKey,
} from './trends'
import type { PurchaseTrends } from '@/types/bi'

const trends = (): PurchaseTrends => ({
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-10-01T10:00:00Z',
      label: '01 Oct',
      purchases: 100000,
      transactions: 1,
      units: 10,
      average_order: 100000,
    },
    {
      timestamp: '2026-10-06T10:45:47Z',
      label: '06 Oct',
      purchases: 275000,
      transactions: 2,
      units: 40,
      average_order: 137500,
    },
  ],
  summary: {
    trend_direction: 'UP',
    growth_rate: 175,
    peak_period: '06 Oct',
    peak_value: 275000,
    low_period: '01 Oct',
    low_value: 100000,
    volatility: 0,
  },
})

describe('buildPurchaseTrendSeries', () => {
  it('mapea los puntos con labels del locale y claves estables', () => {
    const rows = buildPurchaseTrendSeries(trends(), 'daily', 'es-PY')
    expect(rows).toHaveLength(2)
    expect(rows[1]).toMatchObject({ purchases: 275000, transactions: 2, units: 40 })
    expect(rows[1].key).toContain('2026-10-06')
  })

  it('getPurchaseTrendMax = máximo de compras de la serie', () => {
    expect(getPurchaseTrendMax(buildPurchaseTrendSeries(trends(), 'daily'))).toBe(275000)
    expect(getPurchaseTrendMax([])).toBe(0)
  })
})

describe('buildPurchaseTrendSummary', () => {
  it('expone dirección/crecimiento/pico/valle resueltos a labels visibles', () => {
    const summary = buildPurchaseTrendSummary(trends(), 'daily', 'es-PY')
    expect(summary).not.toBeNull()
    expect(summary?.direction).toBe('up')
    expect(summary?.growthRate).toBe(175)
    expect(summary?.peakValue).toBe(275000)
    expect(summary?.lowValue).toBe(100000)
  })

  it('sin puntos → null (no se inventa resumen)', () => {
    expect(
      buildPurchaseTrendSummary({ ...trends(), data_points: [] }, 'daily'),
    ).toBeNull()
  })
})

describe('purchaseTrendDirectionKey', () => {
  it('UP/DOWN/otro → up/down/stable', () => {
    expect(purchaseTrendDirectionKey('UP')).toBe('up')
    expect(purchaseTrendDirectionKey('down')).toBe('down')
    expect(purchaseTrendDirectionKey('')).toBe('stable')
    expect(purchaseTrendDirectionKey(undefined)).toBe('stable')
  })
})
