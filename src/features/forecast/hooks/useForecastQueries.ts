/**
 * Hooks de datos de Pronósticos (F11).
 *
 * Única frontera HTTP del feature: los componentes reciben props y no llaman
 * servicios. Cada query se keyea por horizonte/historial/método/página para no
 * mezclar respuestas.
 *
 * Los slices nil de Go llegan como `null` (`historical_data`, `forecast_data`,
 * `products`, `alerts`, `categories`, `top_products`, `trends`, `by_month`,
 * `by_category`, `scenarios`, `key_insights`, `recommendations`): se
 * normalizan a `[]`. Un `data` ausente rompe la query — nunca una pantalla
 * vacía silenciosa. El BE cachea BI 60-120 s; el `staleTime` no promete
 * frescura.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { forecastService } from '@/services/bi/forecastService'
import type {
  DemandForecast,
  ForecastDashboard,
  InventoryForecast,
  RevenueForecast,
  SalesForecast,
} from '@/types/bi'
import type { SalesForecastSelection } from '@/domain/forecast/params'

export const FORECAST_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

const requireData = <T,>(data: T | null | undefined, endpoint: string): T => {
  if (!data) throw new Error(`Respuesta vacía de ${endpoint}`)
  return data
}

export const forecastQueryKeys = {
  all: ['bi', 'forecast'] as const,
  dashboard: (months: number) => ['bi', 'forecast', 'dashboard', months] as const,
  sales: (selection: SalesForecastSelection) =>
    [
      'bi',
      'forecast',
      'sales',
      selection.historyMonths,
      selection.forecastMonths,
      selection.method,
      selection.granularity,
    ] as const,
  inventory: (days: number, page: number) =>
    ['bi', 'forecast', 'inventory', days, page] as const,
  demand: (months: number, page: number) =>
    ['bi', 'forecast', 'demand', months, page] as const,
  revenue: (months: number) => ['bi', 'forecast', 'revenue', months] as const,
}

const normalizeSeasonality = (sales: SalesForecast): SalesForecast => {
  const seasonality = sales.seasonality
  return {
    ...sales,
    historical_data: toArray(sales.historical_data),
    forecast_data: toArray(sales.forecast_data),
    seasonality: seasonality
      ? {
          ...seasonality,
          peak_periods: toArray(seasonality.peak_periods),
          low_periods: toArray(seasonality.low_periods),
          seasonal_factors: toArray(seasonality.seasonal_factors),
        }
      : seasonality,
  }
}

const normalizeRevenue = (revenue: RevenueForecast): RevenueForecast => ({
  ...revenue,
  by_month: toArray(revenue.by_month),
  by_category: toArray(revenue.by_category),
  scenarios: toArray(revenue.scenarios),
})

const normalizeInventory = (inventory: InventoryForecast): InventoryForecast => ({
  ...inventory,
  products: toArray(inventory.products),
  alerts: toArray(inventory.alerts),
})

const normalizeDemand = (demand: DemandForecast): DemandForecast => ({
  ...demand,
  categories: toArray(demand.categories),
  top_products: toArray(demand.top_products),
  trends: toArray(demand.trends),
})

const normalizeDashboard = (dashboard: ForecastDashboard): ForecastDashboard => ({
  ...dashboard,
  sales_forecast: dashboard.sales_forecast
    ? normalizeSeasonality(dashboard.sales_forecast)
    : dashboard.sales_forecast,
  revenue_forecast: dashboard.revenue_forecast
    ? normalizeRevenue(dashboard.revenue_forecast)
    : dashboard.revenue_forecast,
  inventory_forecast: dashboard.inventory_forecast
    ? normalizeInventory(dashboard.inventory_forecast)
    : dashboard.inventory_forecast,
  demand_forecast: dashboard.demand_forecast
    ? normalizeDemand(dashboard.demand_forecast)
    : dashboard.demand_forecast,
  key_insights: toArray(dashboard.key_insights),
  recommendations: toArray(dashboard.recommendations),
})

/** Dashboard consolidado del horizonte pedido (default 3 meses en el BE). */
export const useForecastDashboard = (months: number) =>
  useQuery({
    queryKey: forecastQueryKeys.dashboard(months),
    queryFn: async (): Promise<ForecastDashboard> =>
      normalizeDashboard(
        requireData(
          (await forecastService.getDashboard({ months }))?.data,
          '/forecast/dashboard',
        ),
      ),
    staleTime: FORECAST_STALE_TIME,
  })

/** Pronóstico de ventas con la selección validada (método/granularidad incluidos). */
export const useSalesForecast = (selection: SalesForecastSelection) =>
  useQuery({
    queryKey: forecastQueryKeys.sales(selection),
    queryFn: async (): Promise<SalesForecast> =>
      normalizeSeasonality(
        requireData(
          (
            await forecastService.getSalesForecast({
              history_months: selection.historyMonths,
              forecast_months: selection.forecastMonths,
              method: selection.method,
              granularity: selection.granularity,
            })
          )?.data,
          '/forecast/sales',
        ),
      ),
    staleTime: FORECAST_STALE_TIME,
  })

/** Salud de inventario: página server-side y summary sobre el set completo. */
export const useInventoryForecast = (days: number, page: number) =>
  useQuery({
    queryKey: forecastQueryKeys.inventory(days, page),
    queryFn: async (): Promise<InventoryForecast> =>
      normalizeInventory(
        requireData(
          (
            await forecastService.getInventoryForecast({
              forecast_days: days,
              page,
              page_size: 10,
            })
          )?.data,
          '/forecast/inventory',
        ),
      ),
    staleTime: FORECAST_STALE_TIME,
  })

/** Demanda: categorías completas + top de productos paginado server-side. */
export const useDemandForecast = (months: number, page: number) =>
  useQuery({
    queryKey: forecastQueryKeys.demand(months, page),
    queryFn: async (): Promise<DemandForecast> =>
      normalizeDemand(
        requireData(
          (
            await forecastService.getDemandForecast({
              history_months: 6,
              forecast_months: months,
              page,
              page_size: 10,
            })
          )?.data,
          '/forecast/demand',
        ),
      ),
    staleTime: FORECAST_STALE_TIME,
  })

/** Ingresos: siempre con escenarios (el BE los devuelve vacíos si se omiten). */
export const useRevenueForecast = (months: number) =>
  useQuery({
    queryKey: forecastQueryKeys.revenue(months),
    queryFn: async (): Promise<RevenueForecast> =>
      normalizeRevenue(
        requireData(
          (
            await forecastService.getRevenueForecast({
              history_months: 12,
              forecast_months: months,
              include_scenarios: true,
            })
          )?.data,
          '/forecast/revenue',
        ),
      ),
    staleTime: FORECAST_STALE_TIME,
  })

/** Refetch de todas las queries del grupo (acción real del botón Actualizar). */
export const useForecastRefresh = () => {
  const queryClient = useQueryClient()
  return async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: forecastQueryKeys.all })
  }
}
