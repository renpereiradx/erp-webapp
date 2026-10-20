import { describe, expect, it } from 'vitest'
import type { SalesTrends } from '@/types/bi'
import {
  buildTrendSeries,
  buildTrendSummary,
  getTrendMaxSales,
  trendDirectionKey,
} from './trends'

const TRENDS: SalesTrends = {
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-09-14T12:00:00Z',
      label: '14 Sep',
      sales: 301150,
      transactions: 3,
      units: 8,
      average_ticket: 100383.33,
    },
    {
      timestamp: '2026-09-15T12:00:00Z',
      label: '15 Sep',
      sales: 0,
      transactions: 0,
      units: 0,
      average_ticket: 0,
    },
    {
      timestamp: '2026-09-16T12:00:00Z',
      label: '16 Sep',
      sales: 250610,
      transactions: 5,
      units: 7,
      average_ticket: 50122,
    },
  ],
  summary: {
    trend_direction: 'DOWN',
    growth_rate: -16.78,
    peak_period: '14 Sep',
    peak_value: 301150,
    low_period: '16 Sep',
    low_value: 250610,
    volatility: 0,
  },
}

describe('trendDirectionKey', () => {
  it('mapea las direcciones del BE', () => {
    expect(trendDirectionKey('UP')).toBe('up')
    expect(trendDirectionKey('DOWN')).toBe('down')
    expect(trendDirectionKey('STABLE')).toBe('stable')
    expect(trendDirectionKey('')).toBe('stable')
  })
})

describe('buildTrendSeries', () => {
  it('convierte cada punto en una fila con label localizado', () => {
    const rows = buildTrendSeries(TRENDS, 'daily', 'es-AR')
    expect(rows).toHaveLength(3)
    expect(rows[0].sales).toBe(301150)
    expect(rows[0].transactions).toBe(3)
    // El label sale del timestamp con el locale de la UI (no del label del BE).
    expect(rows[0].label).toMatch(/sep/i)
  })

  it('sin payload devuelve lista vacía', () => {
    expect(buildTrendSeries(null, 'daily')).toEqual([])
    expect(buildTrendSeries(undefined, 'daily')).toEqual([])
  })

  it('las horas se muestran HH:00 sin inventar rangos', () => {
    const hourly: SalesTrends = {
      ...TRENDS,
      granularity: 'hourly',
      data_points: [
        {
          timestamp: '2026-09-14T17:00:00Z',
          label: '14:00',
          sales: 1000,
          transactions: 1,
          units: 1,
          average_ticket: 1000,
        },
      ],
    }
    const rows = buildTrendSeries(hourly, 'hourly', 'es-AR')
    expect(rows[0].label).toMatch(/^\d{2}:00$/)
  })
})

describe('getTrendMaxSales', () => {
  it('devuelve el máximo real y 0 sin filas', () => {
    expect(getTrendMaxSales(buildTrendSeries(TRENDS, 'daily'))).toBe(301150)
    expect(getTrendMaxSales([])).toBe(0)
  })
})

describe('buildTrendSummary', () => {
  it('expone dirección, crecimiento y pico/mínimo', () => {
    const summary = buildTrendSummary(TRENDS, 'daily', 'es-AR')
    expect(summary?.direction).toBe('down')
    expect(summary?.growthRate).toBe(-16.8)
    expect(summary?.peakValue).toBe(301150)
    expect(summary?.lowValue).toBe(250610)
    expect(summary?.peakLabel).toMatch(/sep/i)
  })

  it('sin puntos no hay resumen', () => {
    expect(buildTrendSummary(null, 'daily')).toBeNull()
    expect(
      buildTrendSummary({ ...TRENDS, data_points: [] }, 'daily'),
    ).toBeNull()
  })
})
