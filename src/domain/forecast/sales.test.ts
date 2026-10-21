import { describe, expect, it } from 'vitest'
import type { SalesForecast } from '@/types/bi'
import {
  formatSalesModelMetric,
  salesBandKind,
  salesConfidenceHint,
  salesForecastKpis,
  salesHistoryPoints,
  salesModelMetrics,
  salesPointBounds,
  salesSeasonality,
  salesSeries,
  translateSeasonMonth,
} from './sales'

const salesForecast = (overrides: Partial<SalesForecast> = {}): SalesForecast => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: {
    start_date: '2026-10-21T00:00:00-03:00',
    end_date: '2027-01-21T00:00:00-03:00',
  },
  history_period: {
    start_date: '2026-04-21T00:00:00-03:00',
    end_date: '2026-10-21T00:00:00-03:00',
  },
  method: 'LINEAR',
  method_effective: 'LINEAR',
  granularity: 'MONTHLY',
  summary: {
    total_historical: 1000000,
    total_forecast: 900000,
    average_historical: 166666.67,
    average_forecast: 300000,
    growth_rate: 80,
    trend: 'INCREASING',
    confidence_level: 6.86,
  },
  historical_data: [
    { date: '2026-04-01T00:00:00Z', label: 'Apr 2026', value: 75000, is_actual: true, is_forecast: false },
    { date: '2026-05-01T00:00:00Z', label: 'May 2026', value: 92500, is_actual: true, is_forecast: false },
  ],
  forecast_data: [
    { date: '2026-10-01T00:00:00Z', label: '01 Oct', value: 100000, is_actual: false, is_forecast: true },
    { date: '2026-11-01T00:00:00Z', label: '01 Nov', value: 120000, is_actual: false, is_forecast: true },
  ],
  confidence: {
    level: 6.86,
    mae: 1166347,
    mape: 334.4,
    rmse: 1500000,
    r2: 0.07,
    lower_bound: 0.85,
    upper_bound: 1.15,
  },
  seasonality: {
    has_seasonality: true,
    seasonal_period: 'MONTHLY',
    peak_periods: ['Ene', 'Dic'],
    low_periods: ['Feb'],
    seasonal_factors: [
      { period: '1', factor: 1.3, label: 'Ene' },
      { period: '2', factor: 0.8, label: 'Feb' },
    ],
  },
  ...overrides,
})

describe('forecast/sales', () => {
  it('distingue bandas multiplicadoras de bandas absolutas', () => {
    expect(salesBandKind('LINEAR')).toBe('multiplier')
    expect(salesBandKind('MOVING_AVG')).toBe('absolute')
    const confidence = { lower_bound: 0.85, upper_bound: 1.15 } as SalesForecast['confidence']
    expect(salesPointBounds(100000, 'LINEAR', confidence)).toEqual({ lower: 85000, upper: 115000 })

    const absolute = { lower_bound: 50000, upper_bound: 150000 } as SalesForecast['confidence']
    expect(salesPointBounds(100000, 'MOVING_AVG', absolute)).toEqual({
      lower: 50000,
      upper: 150000,
    })
  })

  it('arma series de historial y proyección con etiquetas del locale', () => {
    const { history, projection } = salesSeries(salesForecast(), 'es')
    expect(history).toHaveLength(2)
    expect(projection).toHaveLength(2)
    expect(history[0].kind).toBe('history')
    expect(history[0].lowerLabel).toBe('—')
    expect(history[0].label.toLowerCase()).toContain('abr')
    expect(projection[0].valueLabel).toBe('Gs. 100.000')
    expect(projection[0].lowerLabel).toBe('Gs. 85.000')
    expect(projection[0].upperLabel).toBe('Gs. 115.000')
    expect(projection[1].label.toLowerCase()).toContain('nov')
  })

  it('no completa puntos ausentes de la serie', () => {
    const { history, projection } = salesSeries(
      salesForecast({ historical_data: null, forecast_data: null }),
      'es',
    )
    expect(history).toEqual([])
    expect(projection).toEqual([])
  })

  it('expone los KPIs que calcula el BE', () => {
    const kpis = Object.fromEntries(salesForecastKpis(salesForecast()).map((row) => [row.id, row]))
    expect(kpis.historicalTotal.value).toBe(1000000)
    expect(kpis.projectedTotal.value).toBe(900000)
    expect(kpis.projectedAverage.value).toBe(300000)
    expect(kpis.growth.value).toBe(80)
    expect(kpis.confidence.value).toBe(6.86)
  })

  it('formatea las métricas del modelo sin maquillar el fit', () => {
    const metrics = Object.fromEntries(
      salesModelMetrics(salesForecast()).map((row) => [row.id, row]),
    )
    expect(formatSalesModelMetric(metrics.confidence)).toBe('6,9%')
    expect(formatSalesModelMetric(metrics.r2)).toBe('0,07')
    expect(formatSalesModelMetric(metrics.mae)).toMatch(/^Gs\. 1\.166\.347$/)
    expect(formatSalesModelMetric(metrics.mape)).toBe('334,4%')
    expect(salesConfidenceHint(salesForecast())).toBe('6,9% · R² 0,07')
    expect(salesHistoryPoints(salesForecast())).toBe('2')
  })

  it('traduce los meses de estacionalidad del BE', () => {
    expect(translateSeasonMonth('Ene', 'es').toLowerCase()).toContain('ene')
    expect(translateSeasonMonth('Ene', 'en')).toBe('Jan')
    expect(translateSeasonMonth('Desconocido', 'es')).toBe('Desconocido')
    const seasonality = salesSeasonality(salesForecast().seasonality, 'es')
    expect(seasonality.hasSeasonality).toBe(true)
    expect(seasonality.peaks).toHaveLength(2)
    expect(seasonality.factors[0].factor).toBe(1.3)
  })

  it('no declara estacionalidad sin factores', () => {
    const seasonality = salesSeasonality(
      {
        has_seasonality: true,
        seasonal_period: 'MONTHLY',
        peak_periods: null,
        low_periods: null,
        seasonal_factors: null,
      },
      'es',
    )
    expect(seasonality.hasSeasonality).toBe(false)
    expect(seasonality.peaks).toEqual([])
  })
})
