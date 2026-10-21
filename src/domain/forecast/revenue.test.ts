import { describe, expect, it } from 'vitest'
import type { RevenueForecast } from '@/types/bi'
import {
  revenueCategoryRows,
  revenueCategoryTotal,
  revenueKpis,
  revenueScenarios,
  revenueSeries,
} from './revenue'

const revenueForecast = (overrides: Partial<RevenueForecast> = {}): RevenueForecast => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: {
    start_date: '2026-10-21T00:00:00-03:00',
    end_date: '2027-04-21T00:00:00-03:00',
  },
  history_period: {
    start_date: '2025-10-21T00:00:00-03:00',
    end_date: '2026-10-21T00:00:00-03:00',
  },
  summary: {
    historical_revenue: 4837175,
    forecast_revenue: 1767000,
    annual_projection: 3534000,
    growth_rate: 58.79,
    confidence_level: 6.86,
    trend: 'INCREASING',
  },
  by_month: [
    {
      month: '2026-12-01T00:00:00Z',
      label: 'Dec 2026',
      actual: 0,
      forecast: 2731675,
      lower_bound: 2321923.75,
      upper_bound: 3141426.25,
      is_forecast: true,
    },
    {
      month: '2026-09-01T00:00:00Z',
      label: 'Sep 2026',
      actual: 551760,
      forecast: 0,
      lower_bound: 0,
      upper_bound: 0,
      is_forecast: false,
    },
  ],
  by_category: [
    {
      category_id: 'C1',
      category_name: 'Electrónicos',
      historical: 300000,
      forecast: 476370,
      growth_rate: 58.79,
      percentage: 56.6,
    },
    {
      category_id: 'C2',
      category_name: 'Bebidas',
      historical: 2400,
      forecast: 3811,
      growth_rate: 58.79,
      percentage: 0.45,
    },
  ],
  scenarios: [
    {
      name: 'OPTIMISTIC',
      probability: 20,
      forecast_amount: 2032050,
      growth_rate: 73.79,
      description: 'Escenario optimista con condiciones favorables',
    },
    {
      name: 'PESSIMISTIC',
      probability: 20,
      forecast_amount: 1501950,
      growth_rate: 43.79,
      description: 'Escenario conservador considerando posibles factores adversos',
    },
    {
      name: 'BASELINE',
      probability: 60,
      forecast_amount: 1767000,
      growth_rate: 58.79,
      description: 'Proyeccion basada en tendencias actuales',
    },
  ],
  ...overrides,
})

describe('forecast/revenue', () => {
  it('ordena la serie mensual y distingue histórico de proyección', () => {
    const rows = revenueSeries(revenueForecast(), 'es')
    expect(rows.map((row) => row.kind)).toEqual(['history', 'forecast'])
    expect(rows[0].label.toLowerCase()).toContain('sep')
    expect(rows[0].valueLabel).toBe('Gs. 551.760')
    expect(rows[0].lowerLabel).toBe('—')
    expect(rows[1].label.toLowerCase()).toContain('dic')
    expect(rows[1].valueLabel).toBe('Gs. 2.731.675')
    expect(rows[1].lowerLabel).toBe('Gs. 2.321.924')
    expect(rows[1].upperLabel).toBe('Gs. 3.141.426')
  })

  it('ordena los escenarios conocidos y descarta nombres desconocidos', () => {
    const scenarios = revenueScenarios(revenueForecast())
    expect(scenarios.map((row) => row.name)).toEqual([
      'PESSIMISTIC',
      'BASELINE',
      'OPTIMISTIC',
    ])
    expect(scenarios[1]).toMatchObject({ probability: 60, growth: 58.79 })
    expect(
      revenueScenarios(
        revenueForecast({
          scenarios: [{ name: 'AGGRESSIVE', probability: 10, forecast_amount: 1, growth_rate: 1, description: '' }],
        }),
      ),
    ).toEqual([])
    expect(revenueScenarios(revenueForecast({ scenarios: null }))).toEqual([])
  })

  it('no presenta la copia de growth global como pronóstico por categoría', () => {
    const rows = revenueCategoryRows(revenueForecast())
    expect(rows[0]).toEqual({
      key: expect.any(String),
      name: 'Electrónicos',
      historical: 300000,
      percentage: 56.6,
    })
    expect(rows[0]).not.toHaveProperty('forecast')
    expect(rows[0]).not.toHaveProperty('growth_rate')
    expect(revenueCategoryTotal(rows)).toBe(302400)
  })

  it('expone los KPIs del resumen', () => {
    const kpis = Object.fromEntries(
      revenueKpis(revenueForecast().summary).map((row) => [row.id, row]),
    )
    expect(kpis.historicalRevenue.value).toBe(4837175)
    expect(kpis.forecastRevenue.value).toBe(1767000)
    expect(kpis.annualProjection.value).toBe(3534000)
    expect(kpis.growth.value).toBe(58.79)
    expect(kpis.confidence.value).toBe(6.86)
  })
})
