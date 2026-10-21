import { describe, expect, it } from 'vitest'
import type { ForecastDashboard } from '@/types/bi'
import {
  dashboardGroupSummaries,
  dashboardInsightViews,
  dashboardKpis,
  dashboardRecommendationViews,
} from './dashboard'

const dashboard = (overrides: Partial<ForecastDashboard> = {}): ForecastDashboard => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: {
    start_date: '2026-10-21T00:00:00-03:00',
    end_date: '2027-01-21T00:00:00-03:00',
  },
  sales_forecast: {
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
      total_forecast: 7572047,
      average_historical: 166666,
      average_forecast: 300000,
      growth_rate: 58.79,
      trend: 'DECREASING',
      confidence_level: 6.86,
    },
    historical_data: [],
    forecast_data: [],
    confidence: {
      level: 6.86,
      mae: 1000,
      mape: 10,
      rmse: 1000,
      r2: 0.07,
      lower_bound: 0.85,
      upper_bound: 1.15,
    },
    seasonality: {
      has_seasonality: true,
      seasonal_period: 'MONTHLY',
      peak_periods: ['Ene'],
      low_periods: ['Feb'],
      seasonal_factors: [{ period: '1', factor: 1.3, label: 'Ene' }],
    },
  },
  revenue_forecast: {
    generated_at: '2026-10-21T15:03:05-03:00',
    forecast_period: {
      start_date: '2026-10-21T00:00:00-03:00',
      end_date: '2027-01-21T00:00:00-03:00',
    },
    history_period: {
      start_date: '2025-10-21T00:00:00-03:00',
      end_date: '2026-10-21T00:00:00-03:00',
    },
    summary: {
      historical_revenue: 4837175,
      forecast_revenue: 1767000,
      annual_projection: 33521439,
      growth_rate: 58.79,
      confidence_level: 60,
      trend: 'INCREASING',
    },
    by_month: [],
    by_category: [],
    scenarios: [],
  },
  inventory_forecast: {
    generated_at: '2026-10-21T15:03:05-03:00',
    forecast_period: {
      start_date: '2026-10-21T00:00:00-03:00',
      end_date: '2026-11-20T00:00:00-03:00',
    },
    products: [],
    summary: {
      total_products: 18,
      high_risk_products: 5,
      medium_risk_products: 1,
      low_risk_products: 2,
      total_projected_demand: 128,
      total_current_stock: 1070,
      overall_coverage: 10.5,
    },
    alerts: [],
  },
  demand_forecast: {
    generated_at: '2026-10-21T15:03:05-03:00',
    forecast_period: {
      start_date: '2026-10-21T00:00:00-03:00',
      end_date: '2027-01-21T00:00:00-03:00',
    },
    categories: [
      {
        category_id: 'C1',
        category_name: 'Moda',
        historical_units: 31,
        forecast_units: 74,
        growth_rate: 250,
        trend: 'INCREASING',
        confidence: 75,
      },
      {
        category_id: 'C2',
        category_name: 'Alquiler',
        historical_units: 18,
        forecast_units: 3,
        growth_rate: -66.67,
        trend: 'DECREASING',
        confidence: 75,
      },
    ],
    top_products: [],
    trends: null,
  },
  key_insights: [
    { type: 'SALES_TREND', category: 'SALES', title: 'Tendencia', description: '', impact: 'HIGH', value: 58.79, trend: 'DECREASING' },
    { type: 'SEASONALITY', category: 'SALES', title: 'Estacionalidad', description: '', impact: 'MEDIUM' },
    { type: 'INVENTORY_RISK', category: 'INVENTORY', title: 'Riesgo', description: '', impact: 'HIGH', value: 5 },
    { type: 'INVENTORY_COVERAGE', category: 'INVENTORY', title: 'Cobertura', description: '', impact: 'HIGH', value: 10.5 },
    { type: 'REVENUE_PROJECTION', category: 'REVENUE', title: 'Ingresos', description: '', impact: 'HIGH', value: 33521439 },
    { type: 'UNKNOWN_KIND', category: 'SALES', title: 'Otro', description: '', impact: 'LOW' },
  ],
  recommendations: [
    { priority: 'HIGH', category: 'INVENTORY', title: 'Reabastecer', description: '', action: '', potential_impact: '' },
  ],
  ...overrides,
})

describe('forecast/dashboard', () => {
  it('arma los 5 KPIs con cifras embebidas del payload', () => {
    const kpis = Object.fromEntries(dashboardKpis(dashboard()).map((row) => [row.id, row]))
    expect(kpis.salesForecast.value).toBe(7572047)
    expect(kpis.annualRevenue.value).toBe(33521439)
    expect(kpis.riskProducts.value).toBe(5)
    expect(kpis.demandUnits.value).toBe(77)
    expect(kpis.coverage.value).toBe(10.5)
  })

  it('traduce insights conocidos y omite tipos desconocidos', () => {
    const insights = dashboardInsightViews(dashboard(), 'es')
    expect(insights.map((row) => row.type)).toEqual([
      'SALES_TREND',
      'SEASONALITY',
      'INVENTORY_RISK',
      'INVENTORY_COVERAGE',
      'REVENUE_PROJECTION',
    ])
    expect(insights[0].valueLabel).toBe('+58,8%')
    expect(insights[1].valueLabel.toLowerCase()).toContain('ene')
    expect(insights[2].valueLabel).toBe('5')
    expect(insights[3].valueLabel).toBe('10,5')
    expect(insights[4].valueLabel).toBe('Gs. 33.521.439')
  })

  it('deriva recomendaciones con los umbrales del BE, en su orden', () => {
    const recommendations = dashboardRecommendationViews(dashboard(), 'es')
    expect(recommendations.map((row) => row.id)).toEqual([
      'inventoryHighRisk',
      'inventoryCoverage',
      'salesDecline',
      'salesSeasonality',
      'revenueLowConfidence',
    ])
    expect(recommendations[0]).toMatchObject({
      priority: 'HIGH',
      values: { count: '5' },
      href: '/bi/pronosticos/inventario',
    })
    expect(recommendations[1].values).toEqual({ days: '10,5', threshold: '14' })
    expect(recommendations[2]).toMatchObject({
      values: { growth: '+58,8%' },
      href: '/bi/pronosticos/ventas',
    })
    expect(recommendations[4]).toMatchObject({
      priority: 'LOW',
      href: '/bi/pronosticos/ingresos',
    })
  })

  it('no emite recomendaciones si las condiciones reales no se cumplen', () => {
    const healthy = dashboard()
    healthy.inventory_forecast!.summary.high_risk_products = 0
    healthy.inventory_forecast!.summary.overall_coverage = 40
    healthy.sales_forecast!.summary.trend = 'STABLE'
    healthy.sales_forecast!.seasonality = null
    healthy.revenue_forecast!.summary.confidence_level = 90
    expect(dashboardRecommendationViews(healthy, 'es')).toEqual([])
  })

  it('resume cada pantalla del grupo con links reales', () => {
    const groups = dashboardGroupSummaries(dashboard())
    expect(groups.map((row) => row.id)).toEqual(['sales', 'revenue', 'inventory', 'demand'])
    expect(groups[0].valueLabel).toBe('Gs. 7.572.047')
    expect(groups[0].hintLabel).toBe('+58,8%')
    expect(groups[1].valueLabel).toBe('Gs. 1.767.000')
    expect(groups[2].valueLabel).toBe('10,5')
    expect(groups[3].valueLabel).toBe('77')
    expect(groups.every((row) => row.href.startsWith('/bi/pronosticos/'))).toBe(true)
  })
})
