/**
 * Hooks de datos de Analítica de Ventas (F4).
 *
 * Única frontera de orquestación HTTP del feature: los componentes reciben
 * props y no llaman servicios. Cada query se keyea por período/página/orden
 * para no mezclar respuestas. El BE cachea las agregaciones 60-120 s, así que
 * `staleTime` de 60 s no promete frescura.
 *
 * Los payloads BI traen slices nil de Go serializados como `null`: los hooks
 * normalizan a `[]` para que la UI nunca reciba `undefined` donde el contrato
 * promete una lista.
 */
import { useQuery } from '@tanstack/react-query'
import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import type {
  BIPaginationInfo,
  DashboardPeriod,
  DiscountGroupBy,
  DiscountLine,
  DiscountSummaryRow,
  SalesComparisonParams,
  SalesProductSort,
  SalesSortOrder,
  SalesTrendGranularity,
} from '@/types/bi'
import { SALES_PAGE_SIZE } from '@/domain/sales-analytics/constants'
import { granularityForPeriod } from '@/domain/sales-analytics/periods'

export const SALES_STALE_TIME = 60_000

export const salesQueryKeys = {
  all: ['bi', 'sales-analytics'] as const,
  performance: (period: DashboardPeriod) =>
    ['bi', 'sales-analytics', 'performance', period] as const,
  dashboard: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'dashboard', period] as const,
  trends: (period: DashboardPeriod, granularity: SalesTrendGranularity) =>
    ['bi', 'sales-analytics', 'trends', period, granularity] as const,
  categories: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'categories', period] as const,
  products: (
    period: DashboardPeriod,
    page: number,
    sortBy: SalesProductSort,
    sortOrder: SalesSortOrder,
  ) => ['bi', 'sales-analytics', 'products', period, page, sortBy, sortOrder] as const,
  topBottom: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'top-bottom', period] as const,
  customers: (period: DashboardPeriod, page: number) =>
    ['bi', 'sales-analytics', 'customers', period, page] as const,
  sellers: (period: DashboardPeriod, page: number) =>
    ['bi', 'sales-analytics', 'sellers', period, page] as const,
  hourly: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'hourly', period] as const,
  weekday: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'weekday', period] as const,
  velocity: (period: DashboardPeriod) => ['bi', 'sales-analytics', 'velocity', period] as const,
  comparison: (params: SalesComparisonParams) =>
    ['bi', 'sales-analytics', 'comparison', params] as const,
  discounts: (startDate: string, endDate: string, page: number) =>
    ['bi', 'sales-analytics', 'discounts', startDate, endDate, page] as const,
  discountSummary: (startDate: string, endDate: string, groupBy: DiscountGroupBy) =>
    ['bi', 'sales-analytics', 'discount-summary', startDate, endDate, groupBy] as const,
}

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

/** KPIs + comparación con la ventana previa (crecimiento real). */
export const useSalesPerformance = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.performance(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getPerformance({ period, compare: true })
      return { performance: response.data, metadata: response.metadata }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Dashboard consolidado (top productos/categorías y mix de pago). */
export const useSalesDashboard = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.dashboard(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getDashboard({ period })
      const data = response.data
      return {
        dashboard: {
          topProducts: toArray(data?.top_products),
          topCategories: toArray(data?.top_categories),
          paymentMix: toArray(data?.payment_mix),
          period: data?.period,
        },
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Serie del período con la granularidad que evita series truncadas. */
export const useSalesTrends = (
  period: DashboardPeriod,
  granularity: SalesTrendGranularity = granularityForPeriod(period),
) =>
  useQuery({
    queryKey: salesQueryKeys.trends(period, granularity),
    queryFn: async () => {
      const response = await salesAnalyticsService.getTrends({ period, granularity })
      return { trends: response.data, metadata: response.metadata }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Ventas por categoría (limit por defecto del BE: 20). */
export const useSalesByCategory = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.categories(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getByCategory({ period })
      return {
        categories: toArray(response.data?.categories),
        totalSales: Number(response.data?.total_sales) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Productos vendidos, con paginación y orden server-side. */
export const useSalesByProduct = (
  period: DashboardPeriod,
  page: number,
  sortBy: SalesProductSort,
  sortOrder: SalesSortOrder,
) =>
  useQuery({
    queryKey: salesQueryKeys.products(period, page, sortBy, sortOrder),
    queryFn: async () => {
      const response = await salesAnalyticsService.getByProduct({
        period,
        page,
        page_size: SALES_PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      const pagination: BIPaginationInfo = response.data?.pagination ?? {
        page,
        page_size: SALES_PAGE_SIZE,
        total_items: 0,
        total_pages: 1,
      }
      return { products: toArray(response.data?.products), pagination, metadata: response.metadata }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Rankings de productos (top/bottom/margen/volumen) del período. */
export const useSalesTopBottomProducts = (period: DashboardPeriod, limit?: number) =>
  useQuery({
    queryKey: [...salesQueryKeys.topBottom(period), limit ?? null] as const,
    queryFn: async () => {
      const response = await salesAnalyticsService.getTopBottomProducts({ period, limit })
      return {
        topSellers: toArray(response.data?.top_sellers),
        bottomSellers: toArray(response.data?.bottom_sellers),
        topByMargin: toArray(response.data?.top_by_margin),
        topByVolume: toArray(response.data?.top_by_volume),
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Clientes del período + resumen (retención/LTV reales). */
export const useSalesByCustomer = (period: DashboardPeriod, page: number) =>
  useQuery({
    queryKey: salesQueryKeys.customers(period, page),
    queryFn: async () => {
      const response = await salesAnalyticsService.getByCustomer({
        period,
        page,
        page_size: SALES_PAGE_SIZE,
      })
      const pagination: BIPaginationInfo = response.data?.pagination ?? {
        page,
        page_size: SALES_PAGE_SIZE,
        total_items: 0,
        total_pages: 1,
      }
      return {
        customers: toArray(response.data?.customers),
        summary: response.data?.summary,
        pagination,
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Ranking de vendedores por ventas (paginado). */
export const useSalesBySeller = (period: DashboardPeriod, page: number) =>
  useQuery({
    queryKey: salesQueryKeys.sellers(period, page),
    queryFn: async () => {
      const response = await salesAnalyticsService.getBySeller({
        period,
        page,
        page_size: SALES_PAGE_SIZE,
      })
      const pagination: BIPaginationInfo = response.data?.pagination ?? {
        page,
        page_size: SALES_PAGE_SIZE,
        total_items: 0,
        total_pages: 1,
      }
      return {
        sellers: toArray(response.data?.sellers),
        pagination,
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Distribución por hora + hora pico del BE. */
export const useSalesByHour = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.hourly(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getByHour({ period })
      return {
        hourly: toArray(response.data?.hourly_data),
        peakHour: Number(response.data?.peak_hour) || 0,
        peakSales: Number(response.data?.peak_sales) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Distribución por día de la semana + mejor día del BE. */
export const useSalesByDayOfWeek = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.weekday(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getByDayOfWeek({ period })
      return {
        daily: toArray(response.data?.daily_data),
        bestSales: Number(response.data?.best_sales) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Velocidad de venta global y por producto. */
export const useSalesVelocity = (period: DashboardPeriod) =>
  useQuery({
    queryKey: salesQueryKeys.velocity(period),
    queryFn: async () => {
      const response = await salesAnalyticsService.getVelocity({ period })
      return {
        overall: response.data?.overall,
        byProduct: toArray(response.data?.by_product),
        byCategory: toArray(response.data?.by_category),
        metadata: response.metadata,
      }
    },
    staleTime: SALES_STALE_TIME,
  })

/** Comparación A/B; `enabled` bloquea el request con un rango inválido. */
export const useSalesComparison = (params: SalesComparisonParams, enabled = true) =>
  useQuery({
    queryKey: salesQueryKeys.comparison(params),
    queryFn: async () => {
      const response = await salesAnalyticsService.getComparison(params)
      return { comparison: response.data, metadata: response.metadata }
    },
    enabled,
    staleTime: SALES_STALE_TIME,
  })

/** Líneas con descuento del rango aplicado. */
export const useDiscounts = (
  params: { start_date: string; end_date: string; page: number; page_size: number },
  enabled = true,
) =>
  useQuery({
    queryKey: salesQueryKeys.discounts(params.start_date, params.end_date, params.page),
    queryFn: async () => {
      const response = await salesAnalyticsService.getDiscounts(params)
      // `null` es un slice nil de Go (rango sin filas), NO un envelope roto:
      // solo una respuesta sin la clave `data` se trata como inválida.
      if (!response || response.data === undefined) throw new Error('sales-response-invalid')
      return {
        lines: (response.data ?? []) as DiscountLine[],
        totalCount: Number(response.metadata?.total_count) || 0,
        metadata: response.metadata,
      }
    },
    enabled,
    staleTime: SALES_STALE_TIME,
  })

/** Resumen de descuentos agrupado por el criterio elegido. */
export const useDiscountsSummary = (
  params: { start_date: string; end_date: string; group_by: DiscountGroupBy },
  enabled = true,
) =>
  useQuery({
    queryKey: salesQueryKeys.discountSummary(params.start_date, params.end_date, params.group_by),
    queryFn: async () => {
      const response = await salesAnalyticsService.getDiscountsSummary(params)
      if (!response || response.data === undefined) throw new Error('sales-response-invalid')
      return {
        rows: (response.data ?? []) as DiscountSummaryRow[],
        metadata: response.metadata,
      }
    },
    enabled,
    staleTime: SALES_STALE_TIME,
  })
