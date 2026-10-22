/**
 * Hooks de datos de Analítica de Compras (PLAN_ANALITICA_COMPRAS).
 *
 * Única frontera de orquestación HTTP del feature: los componentes reciben
 * props y no llaman servicios. Cada query se keyea por período/página/orden
 * para no mezclar respuestas.
 *
 * Los payloads BI traen slices nil de Go serializados como `null`: los hooks
 * normalizan a `[]` para que la UI nunca reciba `undefined` donde el contrato
 * promete una lista.
 */
import { useQuery } from '@tanstack/react-query'
import { purchaseAnalyticsService } from '@/services/bi/purchaseAnalyticsService'
import type {
  BIPaginationInfo,
  DashboardPeriod,
  PurchaseComparisonParams,
  PurchaseProductSort,
  PurchaseSortOrder,
  PurchaseSupplierSort,
  SalesTrendGranularity,
} from '@/types/bi'
import { PURCHASE_PAGE_SIZE } from '@/domain/purchase-analytics/constants'
import { purchaseGranularityForPeriod } from '@/domain/purchase-analytics/periods'

export const PURCHASE_STALE_TIME = 60_000

export const purchaseQueryKeys = {
  all: ['bi', 'purchase-analytics'] as const,
  performance: (period: DashboardPeriod) =>
    ['bi', 'purchase-analytics', 'performance', period] as const,
  trends: (period: DashboardPeriod, granularity: SalesTrendGranularity) =>
    ['bi', 'purchase-analytics', 'trends', period, granularity] as const,
  categories: (period: DashboardPeriod) =>
    ['bi', 'purchase-analytics', 'categories', period] as const,
  products: (
    period: DashboardPeriod,
    page: number,
    sortBy: PurchaseProductSort,
    sortOrder: PurchaseSortOrder,
  ) => ['bi', 'purchase-analytics', 'products', period, page, sortBy, sortOrder] as const,
  suppliers: (
    period: DashboardPeriod,
    page: number,
    sortBy: PurchaseSupplierSort,
    sortOrder: PurchaseSortOrder,
  ) => ['bi', 'purchase-analytics', 'suppliers', period, page, sortBy, sortOrder] as const,
  buyers: (period: DashboardPeriod, page: number) =>
    ['bi', 'purchase-analytics', 'buyers', period, page] as const,
  paymentMethods: (period: DashboardPeriod) =>
    ['bi', 'purchase-analytics', 'payment-methods', period] as const,
  hourly: (period: DashboardPeriod) => ['bi', 'purchase-analytics', 'hourly', period] as const,
  weekday: (period: DashboardPeriod) => ['bi', 'purchase-analytics', 'weekday', period] as const,
  comparison: (params: PurchaseComparisonParams) =>
    ['bi', 'purchase-analytics', 'comparison', params] as const,
}

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

const fallbackPagination = (page: number): BIPaginationInfo => ({
  page,
  page_size: PURCHASE_PAGE_SIZE,
  total_items: 0,
  total_pages: 1,
})

/** KPIs + comparación con la ventana previa (crecimiento real). */
export const usePurchasePerformance = (period: DashboardPeriod) =>
  useQuery({
    queryKey: purchaseQueryKeys.performance(period),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getPerformance({ period, compare: true })
      return { performance: response.data, metadata: response.metadata }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Serie de compras del período con granularidad derivada. */
export const usePurchaseTrends = (
  period: DashboardPeriod,
  granularity: SalesTrendGranularity = purchaseGranularityForPeriod(period),
) =>
  useQuery({
    queryKey: purchaseQueryKeys.trends(period, granularity),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getTrends({ period, granularity })
      return { trends: response.data, metadata: response.metadata }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Compras por categoría (limit por defecto del BE: 20). */
export const usePurchasesByCategory = (period: DashboardPeriod) =>
  useQuery({
    queryKey: purchaseQueryKeys.categories(period),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByCategory({ period })
      return {
        categories: toArray(response.data?.categories),
        totalPurchases: Number(response.data?.total_purchases) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Productos comprados, con paginación y orden server-side. */
export const usePurchasesByProduct = (
  period: DashboardPeriod,
  page: number,
  sortBy: PurchaseProductSort,
  sortOrder: PurchaseSortOrder,
) =>
  useQuery({
    queryKey: purchaseQueryKeys.products(period, page, sortBy, sortOrder),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByProduct({
        period,
        page,
        page_size: PURCHASE_PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      return {
        products: toArray(response.data?.products),
        pagination: response.data?.pagination ?? fallbackPagination(page),
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Proveedores del período, con paginación y orden server-side. */
export const usePurchasesBySupplier = (
  period: DashboardPeriod,
  page: number,
  sortBy: PurchaseSupplierSort,
  sortOrder: PurchaseSortOrder,
) =>
  useQuery({
    queryKey: purchaseQueryKeys.suppliers(period, page, sortBy, sortOrder),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getBySupplier({
        period,
        page,
        page_size: PURCHASE_PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      return {
        suppliers: toArray(response.data?.suppliers),
        pagination: response.data?.pagination ?? fallbackPagination(page),
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Ranking de compradores (usuarios que registran las órdenes). */
export const usePurchasesByBuyer = (period: DashboardPeriod, page: number) =>
  useQuery({
    queryKey: purchaseQueryKeys.buyers(period, page),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByBuyer({
        period,
        page,
        page_size: PURCHASE_PAGE_SIZE,
      })
      return {
        buyers: toArray(response.data?.buyers),
        pagination: response.data?.pagination ?? fallbackPagination(page),
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Mix de medios de pago de las órdenes de compra. */
export const usePurchasesByPaymentMethod = (period: DashboardPeriod) =>
  useQuery({
    queryKey: purchaseQueryKeys.paymentMethods(period),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByPaymentMethod({ period })
      return {
        methods: toArray(response.data?.payment_methods),
        totalPurchases: Number(response.data?.total_purchases) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Distribución por hora + hora pico del BE. */
export const usePurchasesByHour = (period: DashboardPeriod) =>
  useQuery({
    queryKey: purchaseQueryKeys.hourly(period),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByHour({ period })
      return {
        hourly: toArray(response.data?.hourly_data),
        peakHour: Number(response.data?.peak_hour) || 0,
        peakPurchases: Number(response.data?.peak_purchases) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Distribución por día de la semana + mejor día del BE. */
export const usePurchasesByDayOfWeek = (period: DashboardPeriod) =>
  useQuery({
    queryKey: purchaseQueryKeys.weekday(period),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getByDayOfWeek({ period })
      return {
        daily: toArray(response.data?.daily_data),
        bestDay: response.data?.best_day || '',
        bestPurchases: Number(response.data?.best_purchases) || 0,
        metadata: response.metadata,
      }
    },
    staleTime: PURCHASE_STALE_TIME,
  })

/** Comparación A/B; `enabled` bloquea el request con un rango inválido. */
export const usePurchaseComparison = (params: PurchaseComparisonParams, enabled = true) =>
  useQuery({
    queryKey: purchaseQueryKeys.comparison(params),
    queryFn: async () => {
      const response = await purchaseAnalyticsService.getComparison(params)
      return { comparison: response.data, metadata: response.metadata }
    },
    enabled,
    staleTime: PURCHASE_STALE_TIME,
  })
