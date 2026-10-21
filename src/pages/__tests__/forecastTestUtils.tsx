/**
 * Utilidades de los page tests de Pronósticos (F11). No es un archivo de test:
 * provee el wrapper router + react-query, el envelope BI y fixtures con la
 * forma real de `/forecast/*` (según `models/forecast.go` y el repo).
 */
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const forecastEnvelope = <T,>(data: T, metadata: Record<string, unknown> = {}) => ({
  success: true,
  data,
  metadata,
})

export const renderForecastPage = (
  ui: ReactElement,
  { route = '/bi/pronosticos/dashboard', path }: { route?: string; path?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        {path ? (
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        ) : (
          ui
        )}
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

export const forecastPeriod = (overrides: Record<string, unknown> = {}) => ({
  start_date: '2026-10-21T00:00:00-03:00',
  end_date: '2027-01-21T00:00:00-03:00',
  type: '',
  ...overrides,
})

export const salesForecastFixture = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: forecastPeriod(),
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
    average_historical: 166667,
    average_forecast: 2524016,
    growth_rate: 58.79,
    trend: 'INCREASING',
    confidence_level: 6.86,
  },
  historical_data: [
    { date: '2026-04-01T00:00:00Z', label: 'Apr 2026', value: 75000, is_actual: true, is_forecast: false },
    { date: '2026-05-01T00:00:00Z', label: 'May 2026', value: 92500, is_actual: true, is_forecast: false },
    { date: '2026-06-01T00:00:00Z', label: 'Jun 2026', value: 3757936, is_actual: true, is_forecast: false },
  ],
  forecast_data: [
    { date: '2026-10-01T00:00:00Z', label: '01 Oct', value: 2316356, is_actual: false, is_forecast: true },
    { date: '2026-11-01T00:00:00Z', label: '01 Nov', value: 2524016, is_actual: false, is_forecast: true },
  ],
  confidence: {
    level: 6.86,
    mae: 1166347,
    mape: 334.4,
    rmse: 1450000,
    r2: 0.07,
    lower_bound: 0.85,
    upper_bound: 1.15,
  },
  seasonality: {
    has_seasonality: true,
    seasonal_period: 'MONTHLY',
    peak_periods: ['Oct', 'Dic'],
    low_periods: ['Feb'],
    seasonal_factors: [
      { period: '2', factor: 0.8, label: 'Feb' },
      { period: '10', factor: 1.3, label: 'Oct' },
    ],
  },
  ...overrides,
})

export const inventoryForecastFixture = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: forecastPeriod({
    end_date: '2026-11-20T00:00:00-03:00',
  }),
  products: [
    {
      product_id: 'LAVADO-AUTO',
      product_name: 'Lavado de auto',
      current_stock: 0,
      average_daily_sales: 2,
      projected_demand: 60,
      days_until_stockout: 0,
      reorder_point: 14,
      suggested_reorder: 88,
      safety_stock: 28,
      stockout_risk: 'HIGH',
      reorder_date: '2026-10-18T10:00:00-03:00',
      trend: 'INCREASING',
    },
    {
      product_id: 'SIN-VENTAS',
      product_name: 'Producto sin ventas',
      current_stock: 10,
      average_daily_sales: 0,
      projected_demand: 0,
      days_until_stockout: 999,
      reorder_point: 0,
      suggested_reorder: 0,
      safety_stock: 0,
      stockout_risk: 'NONE',
      trend: 'STABLE',
    },
  ],
  summary: {
    total_products: 18,
    high_risk_products: 5,
    medium_risk_products: 1,
    low_risk_products: 2,
    total_projected_demand: 128,
    total_current_stock: 1070,
    overall_coverage: 10.5,
  },
  alerts: [
    {
      type: 'STOCKOUT_IMMINENT',
      severity: 'HIGH',
      product_id: 'LAVADO-AUTO',
      product_name: 'Lavado de auto',
      message: 'Stock se agotara en 0 dias',
      days_to_act: 0,
    },
    {
      type: 'LOW_STOCK',
      severity: 'MEDIUM',
      product_id: 'SHAMPOO',
      product_name: 'Shampoo',
      message: 'Stock bajo: 5 dias de cobertura',
      days_to_act: 2,
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 18, total_pages: 2 },
  ...overrides,
})

export const demandForecastFixture = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: forecastPeriod(),
  categories: [
    {
      category_id: 'MODA',
      category_name: 'Moda',
      historical_units: 31,
      forecast_units: 54,
      growth_rate: 250,
      trend: 'INCREASING',
      confidence: 75,
    },
    {
      category_id: 'ALQUILER',
      category_name: 'Alquiler',
      historical_units: 18,
      forecast_units: 3,
      growth_rate: -66.67,
      trend: 'DECREASING',
      confidence: 75,
    },
  ],
  top_products: [
    {
      product_id: 'CAMISETA-ADIDAS',
      product_name: 'Camiseta Adidas',
      category_name: 'Moda',
      historical_units: 87,
      forecast_units: 90,
      growth_rate: 12.5,
      trend: 'INCREASING',
      confidence: 70,
    },
  ],
  trends: null,
  pagination: { page: 1, page_size: 10, total_items: 12, total_pages: 2 },
  ...overrides,
})

export const revenueForecastFixture = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: forecastPeriod({
    end_date: '2027-04-21T00:00:00-03:00',
  }),
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
      month: '2026-09-01T00:00:00Z',
      label: 'Sep 2026',
      actual: 551760,
      forecast: 0,
      lower_bound: 0,
      upper_bound: 0,
      is_forecast: false,
    },
    {
      month: '2026-10-01T00:00:00Z',
      label: 'Oct 2026',
      actual: 0,
      forecast: 2316356,
      lower_bound: 1968902.6,
      upper_bound: 2663809.4,
      is_forecast: true,
    },
    {
      month: '2026-11-01T00:00:00Z',
      label: 'Nov 2026',
      actual: 0,
      forecast: 2524016,
      lower_bound: 2145413.6,
      upper_bound: 2902618.4,
      is_forecast: true,
    },
  ],
  by_category: [
    {
      category_id: 'ELECTRONICOS',
      category_name: 'Electrónicos',
      historical: 300000,
      forecast: 476370,
      growth_rate: 58.79,
      percentage: 56.6,
    },
    {
      category_id: 'BEBIDAS',
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

export const forecastDashboardFixture = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: forecastPeriod(),
  sales_forecast: salesForecastFixture(),
  revenue_forecast: revenueForecastFixture(),
  inventory_forecast: inventoryForecastFixture(),
  demand_forecast: demandForecastFixture(),
  key_insights: [
    {
      type: 'SALES_TREND',
      category: 'SALES',
      title: 'Tendencia de ventas: INCREASING',
      description: 'Se proyecta un crecimiento de 58.8% en ventas',
      impact: 'HIGH',
      value: 58.79,
      trend: 'INCREASING',
    },
    {
      type: 'SEASONALITY',
      category: 'SALES',
      title: 'Patron estacional detectado',
      description: 'Periodos pico: [Oct Dic]',
      impact: 'MEDIUM',
    },
    {
      type: 'INVENTORY_RISK',
      category: 'INVENTORY',
      title: 'Productos en riesgo de agotamiento',
      description: '5 productos con riesgo alto de quedarse sin stock',
      impact: 'HIGH',
      value: 5,
    },
    {
      type: 'INVENTORY_COVERAGE',
      category: 'INVENTORY',
      title: 'Cobertura de inventario',
      description: 'El inventario actual cubre 10 dias de demanda proyectada',
      impact: 'HIGH',
      value: 10.5,
    },
    {
      type: 'REVENUE_PROJECTION',
      category: 'REVENUE',
      title: 'Proyeccion de ingresos anual',
      description: 'Se proyectan $3534000.00 en ingresos anuales con 6.9% de confianza',
      impact: 'HIGH',
      value: 3534000,
      trend: 'INCREASING',
    },
  ],
  recommendations: [
    {
      priority: 'HIGH',
      category: 'INVENTORY',
      title: 'Reabastecer productos criticos',
      description: 'Hay 5 productos con riesgo alto de agotamiento',
      action: 'Generar ordenes de compra para productos en riesgo',
      potential_impact: 'Evitar perdida de ventas por falta de stock',
    },
  ],
  ...overrides,
})
