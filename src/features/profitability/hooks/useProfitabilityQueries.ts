/**
 * Hooks de datos de Rentabilidad (F6).
 *
 * Única frontera de orquestación HTTP del feature: los componentes reciben
 * props y no llaman servicios. Cada query se keyea por período/página/orden/
 * granularidad para no mezclar respuestas. El BE cachea las agregaciones
 * 60-120 s, así que `staleTime` de 60 s no promete frescura.
 *
 * Los payloads BI traen slices nil de Go serializados como `null`: los hooks
 * normalizan a `[]` y el dominio re-deriva etiquetas/fechas en el locale de la
 * UI (los `label` del BE vienen en inglés).
 */
import { useQuery } from '@tanstack/react-query'
import { profitabilityService } from '@/services/bi/profitabilityService'
import type {
  BIMetadata,
  CategoryProfitabilityReport,
  CustomerProfitabilityReport,
  DashboardPeriod,
  ProductProfitabilityReport,
  ProductProfitabilityRow,
  ProfitabilityAlert,
  ProfitabilityDashboard,
  ProfitabilityReportPagination,
  ProfitabilitySortOrder,
  ProfitabilityReportPeriod,
  ProfitabilityTrendGranularity,
  ProfitabilityTrendPoint,
  SellerProfitabilityReport,
} from '@/types/bi'
import { PROFITABILITY_PAGE_SIZE } from '@/domain/profitability/constants'
import { productRows } from '@/domain/profitability/products'
import { customerRows } from '@/domain/profitability/customers'
import { categoryRows } from '@/domain/profitability/categories'
import { trendPoints, buildTrendInsight, type TrendInsight } from '@/domain/profitability/trends'
import { sellerRows } from '@/domain/profitability/sellers'

export const PROFITABILITY_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

export const profitabilityQueryKeys = {
  all: ['bi', 'profitability'] as const,
  dashboard: (period: DashboardPeriod) =>
    ['bi', 'profitability', 'dashboard', period] as const,
  products: (period: DashboardPeriod, page: number, sort: ProfitabilitySortOrder) =>
    [
      'bi',
      'profitability',
      'products',
      period,
      page,
      sort.by,
      sort.order,
    ] as const,
  customers: (period: DashboardPeriod, page: number) =>
    ['bi', 'profitability', 'customers', period, page] as const,
  categories: (period: DashboardPeriod) =>
    ['bi', 'profitability', 'categories', period] as const,
  trends: (period: DashboardPeriod, granularity: ProfitabilityTrendGranularity) =>
    ['bi', 'profitability', 'trends', period, granularity] as const,
  sellers: (period: DashboardPeriod) =>
    ['bi', 'profitability', 'sellers', period] as const,
}

const emptyPagination: ProfitabilityReportPagination = {
  page: 1,
  page_size: PROFITABILITY_PAGE_SIZE,
  total_items: 0,
  total_pages: 0,
}

// --- Dashboard --------------------------------------------------------------

export interface ProfitabilityDashboardView {
  dashboard: ProfitabilityDashboard
  topProducts: NonNullable<ProfitabilityDashboard['top_products']>
  topCustomers: NonNullable<ProfitabilityDashboard['top_customers']>
  topCategories: NonNullable<ProfitabilityDashboard['top_categories']>
  trends: ProfitabilityTrendPoint[]
  alerts: ProfitabilityAlert[]
  /** `metadata.partial` del envelope (T8/BR-4a): sección ensamblada con fallos. */
  metadata?: BIMetadata
}

export const useProfitabilityDashboard = (period: DashboardPeriod) =>
  useQuery({
    queryKey: profitabilityQueryKeys.dashboard(period),
    queryFn: async (): Promise<ProfitabilityDashboardView> => {
      const response = await profitabilityService.getDashboard(period)
      const data = response.data
      return {
        dashboard: data,
        topProducts: toArray(data?.top_products),
        topCustomers: toArray(data?.top_customers),
        topCategories: toArray(data?.top_categories),
        trends: toArray(data?.trends),
        alerts: toArray(data?.alerts),
        metadata: response.metadata,
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })

// --- Productos --------------------------------------------------------------

export interface ProfitabilityProductsView {
  report: ProductProfitabilityReport
  products: ProductProfitabilityRow[]
  topProfitable: NonNullable<ProductProfitabilityReport['top_profitable']>
  losers: NonNullable<ProductProfitabilityReport['losers']>
  pagination: ProfitabilityReportPagination
}

export interface ProfitabilityProductsParams {
  period: DashboardPeriod
  page: number
  sort: ProfitabilitySortOrder
}

export const useProfitabilityProducts = ({ period, page, sort }: ProfitabilityProductsParams) =>
  useQuery({
    queryKey: profitabilityQueryKeys.products(period, page, sort),
    queryFn: async (): Promise<ProfitabilityProductsView> => {
      const response = await profitabilityService.getProducts({
        period,
        page,
        page_size: PROFITABILITY_PAGE_SIZE,
        sort_by: sort.by,
        sort_order: sort.order,
      })
      const data = response.data
      return {
        report: data,
        products: productRows(data?.products),
        topProfitable: productRows(data?.top_profitable),
        losers: productRows(data?.losers),
        pagination: data?.pagination ?? emptyPagination,
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })

// --- Clientes ---------------------------------------------------------------

export interface ProfitabilityCustomersView {
  report: CustomerProfitabilityReport
  customers: NonNullable<CustomerProfitabilityReport['customers']>
  pagination: ProfitabilityReportPagination
}

export const useProfitabilityCustomers = (period: DashboardPeriod, page: number) =>
  useQuery({
    queryKey: profitabilityQueryKeys.customers(period, page),
    queryFn: async (): Promise<ProfitabilityCustomersView> => {
      const response = await profitabilityService.getCustomers({
        period,
        page,
        page_size: PROFITABILITY_PAGE_SIZE,
      })
      const data = response.data
      return {
        report: data,
        customers: customerRows(data?.customers),
        pagination: data?.pagination ?? emptyPagination,
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })

// --- Categorías -------------------------------------------------------------

export interface ProfitabilityCategoriesView {
  report: CategoryProfitabilityReport
  categories: NonNullable<CategoryProfitabilityReport['categories']>
}

export const useProfitabilityCategories = (period: DashboardPeriod) =>
  useQuery({
    queryKey: profitabilityQueryKeys.categories(period),
    queryFn: async (): Promise<ProfitabilityCategoriesView> => {
      const response = await profitabilityService.getCategories(period)
      const data = response.data
      return {
        report: data,
        categories: categoryRows(data?.categories),
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })

// --- Tendencias -------------------------------------------------------------

export interface ProfitabilityTrendsView {
  points: ProfitabilityTrendPoint[]
  insight: TrendInsight
  granularity: ProfitabilityTrendGranularity
  /** Ventana real aplicada por el BE (fin exclusivo). */
  period: ProfitabilityReportPeriod | null | undefined
}

export const useProfitabilityTrends = (
  period: DashboardPeriod,
  granularity: ProfitabilityTrendGranularity,
) =>
  useQuery({
    queryKey: profitabilityQueryKeys.trends(period, granularity),
    queryFn: async (): Promise<ProfitabilityTrendsView> => {
      const response = await profitabilityService.getTrends({ period, granularity })
      const points = trendPoints(response.data)
      return {
        points,
        insight: buildTrendInsight(points),
        granularity: (response.data?.granularity as ProfitabilityTrendGranularity) || granularity,
        period: response.data?.period,
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })

// --- Vendedores -------------------------------------------------------------

export interface ProfitabilitySellersView {
  report: SellerProfitabilityReport
  sellers: NonNullable<SellerProfitabilityReport['sellers']>
}

export const useProfitabilitySellers = (period: DashboardPeriod) =>
  useQuery({
    queryKey: profitabilityQueryKeys.sellers(period),
    queryFn: async (): Promise<ProfitabilitySellersView> => {
      const response = await profitabilityService.getSellers(period)
      const data = response.data
      return {
        report: data,
        sellers: sellerRows(data?.sellers),
      }
    },
    staleTime: PROFITABILITY_STALE_TIME,
  })
