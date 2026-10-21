/**
 * F11 — hooks de Pronósticos: params por endpoint, normalización de slices nil
 * de Go, fallo cuando falta `data` y refetch del grupo.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/forecastService', () => ({
  forecastService: {
    getDashboard: vi.fn(),
    getSalesForecast: vi.fn(),
    getInventoryForecast: vi.fn(),
    getDemandForecast: vi.fn(),
    getRevenueForecast: vi.fn(),
  },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  useDemandForecast,
  useForecastDashboard,
  useForecastRefresh,
  useInventoryForecast,
  useRevenueForecast,
  useSalesForecast,
} from '../hooks/useForecastQueries'

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

const createWrapper = (client = createClient()) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { Wrapper, client }
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const salesFixture = {
  generated_at: '2026-10-21T15:03:05-03:00',
  method: 'LINEAR',
  granularity: 'MONTHLY',
  summary: { total_forecast: 100 },
  confidence: { level: 10 },
  historical_data: null,
  forecast_data: null,
  seasonality: {
    has_seasonality: true,
    peak_periods: null,
    low_periods: null,
    seasonal_factors: null,
  },
}

describe('hooks de Pronósticos (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dashboard: horizonte + normalización de los arrays anidados null', async () => {
    vi.mocked(forecastService.getDashboard).mockResolvedValue(
      envelope({
        sales_forecast: salesFixture,
        revenue_forecast: null,
        inventory_forecast: {
          summary: {},
          products: null,
          alerts: null,
        },
        demand_forecast: { categories: null, top_products: null, trends: null },
        key_insights: null,
        recommendations: null,
      }) as never,
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useForecastDashboard(6), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(forecastService.getDashboard).toHaveBeenCalledWith({ months: 6 })
    expect(result.current.data?.key_insights).toEqual([])
    expect(result.current.data?.recommendations).toEqual([])
    expect(result.current.data?.sales_forecast?.historical_data).toEqual([])
    expect(result.current.data?.sales_forecast?.seasonality?.peak_periods).toEqual([])
    expect(result.current.data?.inventory_forecast?.products).toEqual([])
    expect(result.current.data?.demand_forecast?.categories).toEqual([])
  })

  it('dashboard: falla si el endpoint no trae data', async () => {
    vi.mocked(forecastService.getDashboard).mockResolvedValue({ success: true } as never)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useForecastDashboard(3), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('ventas: envía la selección completa y normaliza la estacionalidad', async () => {
    vi.mocked(forecastService.getSalesForecast).mockResolvedValue(
      envelope(salesFixture) as never,
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useSalesForecast({
          historyMonths: 12,
          forecastMonths: 6,
          method: 'SEASONAL',
          granularity: 'MONTHLY',
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(forecastService.getSalesForecast).toHaveBeenCalledWith({
      history_months: 12,
      forecast_months: 6,
      method: 'SEASONAL',
      granularity: 'MONTHLY',
    })
    expect(result.current.data?.historical_data).toEqual([])
    expect(result.current.data?.forecast_data).toEqual([])
    expect(result.current.data?.seasonality?.seasonal_factors).toEqual([])
  })

  it('inventario: página server-side y slices null normalizados', async () => {
    vi.mocked(forecastService.getInventoryForecast).mockResolvedValue(
      envelope({ summary: {}, products: null, alerts: null }) as never,
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useInventoryForecast(90, 2), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(forecastService.getInventoryForecast).toHaveBeenCalledWith({
      forecast_days: 90,
      page: 2,
      page_size: 10,
    })
    expect(result.current.data?.products).toEqual([])
    expect(result.current.data?.alerts).toEqual([])
  })

  it('demanda: historial fijo de 6, horizonte y página', async () => {
    vi.mocked(forecastService.getDemandForecast).mockResolvedValue(
      envelope({ categories: null, top_products: null, trends: null }) as never,
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDemandForecast(12, 3), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(forecastService.getDemandForecast).toHaveBeenCalledWith({
      history_months: 6,
      forecast_months: 12,
      page: 3,
      page_size: 10,
    })
    expect(result.current.data?.categories).toEqual([])
    expect(result.current.data?.top_products).toEqual([])
  })

  it('ingresos: pide escenarios y normaliza los slices null', async () => {
    vi.mocked(forecastService.getRevenueForecast).mockResolvedValue(
      envelope({ summary: {}, by_month: null, by_category: null, scenarios: null }) as never,
    )
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRevenueForecast(12), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(forecastService.getRevenueForecast).toHaveBeenCalledWith({
      history_months: 12,
      forecast_months: 12,
      include_scenarios: true,
    })
    expect(result.current.data?.by_month).toEqual([])
    expect(result.current.data?.by_category).toEqual([])
    expect(result.current.data?.scenarios).toEqual([])
  })

  it('refetch del grupo invalida las queries de pronósticos', async () => {
    const { Wrapper, client } = createWrapper()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useForecastRefresh(), { wrapper: Wrapper })

    await result.current()
    expect(spy).toHaveBeenCalledWith({ queryKey: ['bi', 'forecast'] })
  })
})
