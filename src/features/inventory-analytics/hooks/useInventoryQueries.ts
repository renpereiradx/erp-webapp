/**
 * Hooks de datos de Analítica de Inventario (F5).
 *
 * Única frontera de orquestación HTTP del feature: los componentes reciben
 * props y no llaman servicios. Cada query se keyea por período/página/filtro/
 * orden para no mezclar respuestas. El BE cachea las agregaciones 60-120 s,
 * así que `staleTime` de 60 s no promete frescura.
 *
 * Los payloads BI traen slices nil de Go serializados como `null`: los hooks
 * normalizan a `[]` para que la UI nunca reciba `undefined` donde el contrato
 * promete una lista.
 */
import { useQuery } from '@tanstack/react-query'
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService'
import type {
  ABCAnalysis,
  ABCProduct,
  ABCSummary,
  CategoryTurnover,
  DashboardPeriod,
  DeadStockProduct,
  DeadStockSummary,
  InventoryAlert,
  InventoryAnalyticsDashboard,
  InventoryOverview,
  InventoryStockStatus,
  InventoryStatusFilter,
  ProductStockLevel,
  ProductTurnover,
  ReorderProduct,
  ReorderSummary,
  StockAgingBucket,
  StockAgingSummary,
  StockLevelsSummary,
  TurnoverMetrics,
} from '@/types/bi'
import { INVENTORY_PAGE_SIZE } from '@/domain/inventory-analytics/constants'
import { turnoverCategoryRows, turnoverProductRows } from '@/domain/inventory-analytics/turnover'
import { deadStockRows } from '@/domain/inventory-analytics/deadStock'
import { agingReportRows } from '@/domain/inventory-analytics/aging'
import type { StockSortState } from '@/domain/inventory-analytics/stock'

export const INVENTORY_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

export const inventoryQueryKeys = {
  all: ['bi', 'inventory-analytics'] as const,
  dashboard: () => ['bi', 'inventory-analytics', 'dashboard'] as const,
  overview: () => ['bi', 'inventory-analytics', 'overview'] as const,
  turnover: (period: DashboardPeriod) =>
    ['bi', 'inventory-analytics', 'turnover', period] as const,
  abc: (period: DashboardPeriod) => ['bi', 'inventory-analytics', 'abc', period] as const,
  stockLevels: (
    page: number,
    status: InventoryStatusFilter | undefined,
    sort: StockSortState,
  ) =>
    [
      'bi',
      'inventory-analytics',
      'stock-levels',
      page,
      status ?? 'all',
      sort.by,
      sort.order,
    ] as const,
  reorder: () => ['bi', 'inventory-analytics', 'reorder'] as const,
  deadStock: (days: number) => ['bi', 'inventory-analytics', 'dead-stock', days] as const,
  aging: () => ['bi', 'inventory-analytics', 'aging'] as const,
}

/** Dashboard consolidado con sus listas nil normalizadas. */
export interface InventoryDashboardView {
  dashboard: InventoryAnalyticsDashboard
  topMovers: ProductTurnover[]
  slowMovers: ProductTurnover[]
  reorderAlerts: ReorderProduct[]
  alerts: InventoryAlert[]
  stockStatus: InventoryStockStatus
}

export const useInventoryDashboard = () =>
  useQuery({
    queryKey: inventoryQueryKeys.dashboard(),
    queryFn: async (): Promise<InventoryDashboardView> => {
      const response = await inventoryAnalyticsService.getDashboard()
      const data = response.data
      return {
        dashboard: data,
        topMovers: toArray(data?.top_movers),
        slowMovers: toArray(data?.slow_movers),
        reorderAlerts: toArray(data?.reorder_alerts),
        alerts: toArray(data?.alerts),
        stockStatus: data?.stock_status,
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

/** Overview: valuación, ganancia potencial y rotación de 30 días. */
export const useInventoryOverview = () =>
  useQuery({
    queryKey: inventoryQueryKeys.overview(),
    queryFn: async (): Promise<InventoryOverview> => {
      const response = await inventoryAnalyticsService.getOverview()
      return response.data
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface InventoryTurnoverView {
  overall: TurnoverMetrics
  byCategory: CategoryTurnover[]
  byProduct: ProductTurnover[]
}

export const useInventoryTurnover = (period: DashboardPeriod) =>
  useQuery({
    queryKey: inventoryQueryKeys.turnover(period),
    queryFn: async (): Promise<InventoryTurnoverView> => {
      const response = await inventoryAnalyticsService.getTurnover({ period })
      const data = response.data
      return {
        overall: data?.overall,
        byCategory: turnoverCategoryRows(data?.by_category),
        byProduct: turnoverProductRows(data?.by_product),
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface InventoryAbcView {
  summary: ABCSummary
  classA: ABCProduct[]
  classB: ABCProduct[]
  classC: ABCProduct[]
}

export const useInventoryAbc = (period: DashboardPeriod) =>
  useQuery({
    queryKey: inventoryQueryKeys.abc(period),
    queryFn: async (): Promise<InventoryAbcView> => {
      const response = await inventoryAnalyticsService.getABC({ period })
      const data = response.data
      const analysis: ABCAnalysis | undefined = data
      return {
        summary: data?.summary,
        classA: toArray(analysis?.class_a),
        classB: toArray(analysis?.class_b),
        classC: toArray(analysis?.class_c),
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface StockLevelsQueryParams {
  page: number
  status?: InventoryStatusFilter
  sort: StockSortState
}

export interface StockLevelsView {
  products: ProductStockLevel[]
  summary: StockLevelsSummary
  pagination: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
  }
}

export const useStockLevels = ({ page, status, sort }: StockLevelsQueryParams) =>
  useQuery({
    queryKey: inventoryQueryKeys.stockLevels(page, status, sort),
    queryFn: async (): Promise<StockLevelsView> => {
      const response = await inventoryAnalyticsService.getStockLevels({
        page,
        page_size: INVENTORY_PAGE_SIZE,
        status,
        sort_by: sort.by,
        sort_order: sort.order,
      })
      const data = response.data
      return {
        products: toArray(data?.products),
        summary: data?.summary,
        pagination: data?.pagination,
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface ReorderView {
  summary: ReorderSummary
  urgent: ReorderProduct[]
  soon: ReorderProduct[]
}

export const useReorderAnalysis = () =>
  useQuery({
    queryKey: inventoryQueryKeys.reorder(),
    queryFn: async (): Promise<ReorderView> => {
      const response = await inventoryAnalyticsService.getReorder()
      const data = response.data
      return {
        summary: data?.summary,
        urgent: toArray(data?.urgent_reorders),
        soon: toArray(data?.soon_reorders),
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface DeadStockView {
  summary: DeadStockSummary
  products: DeadStockProduct[]
}

export const useDeadStock = (days: number) =>
  useQuery({
    queryKey: inventoryQueryKeys.deadStock(days),
    queryFn: async (): Promise<DeadStockView> => {
      const response = await inventoryAnalyticsService.getDeadStock({ days })
      const data = response.data
      return {
        summary: data?.summary,
        products: deadStockRows(data),
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })

export interface AgingView {
  summary: StockAgingSummary
  buckets: StockAgingBucket[]
}

export const useStockAging = () =>
  useQuery({
    queryKey: inventoryQueryKeys.aging(),
    queryFn: async (): Promise<AgingView> => {
      const response = await inventoryAnalyticsService.getStockAging()
      const data = response.data
      return {
        summary: data?.summary,
        buckets: agingReportRows(data),
      }
    },
    staleTime: INVENTORY_STALE_TIME,
  })
