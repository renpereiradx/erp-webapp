/**
 * F5 — hooks de Analítica de Inventario: contrato de params por endpoint,
 * normalización de slices nil de Go y sin fallback silencioso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getOverview: vi.fn(),
    getDashboard: vi.fn(),
    getStockLevels: vi.fn(),
    getTurnover: vi.fn(),
    getABC: vi.fn(),
    getDeadStock: vi.fn(),
    getReorder: vi.fn(),
    getStockAging: vi.fn(),
  },
}))

import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService'
import {
  useDeadStock,
  useInventoryAbc,
  useInventoryDashboard,
  useInventoryOverview,
  useInventoryTurnover,
  useReorderAnalysis,
  useStockAging,
  useStockLevels,
} from '../hooks/useInventoryQueries'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const envelope = (data: unknown, metadata: Record<string, unknown> = {}) => ({
  success: true,
  data,
  metadata,
})

describe('hooks de Analítica de Inventario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useInventoryDashboard normaliza top_movers/slow_movers/reorder_alerts/alerts null', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockResolvedValue(
      envelope({
        kpis: {},
        stock_status: { in_stock: 1 },
        top_movers: null,
        slow_movers: null,
        reorder_alerts: null,
        alerts: null,
      }) as never,
    )
    const { result } = renderHook(() => useInventoryDashboard(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.topMovers).toEqual([])
    expect(result.current.data?.slowMovers).toEqual([])
    expect(result.current.data?.reorderAlerts).toEqual([])
    expect(result.current.data?.alerts).toEqual([])
    expect(result.current.data?.stockStatus).toEqual({ in_stock: 1 })
  })

  it('useInventoryOverview llama el endpoint sin params', async () => {
    vi.mocked(inventoryAnalyticsService.getOverview).mockResolvedValue(
      envelope({ total_value: 100 }) as never,
    )
    const { result } = renderHook(() => useInventoryOverview(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getOverview).toHaveBeenCalledWith()
    expect(result.current.data?.total_value).toBe(100)
  })

  it('useInventoryTurnover manda el período y normaliza listas null', async () => {
    vi.mocked(inventoryAnalyticsService.getTurnover).mockResolvedValue(
      envelope({ overall: { turnover_rate: 1 }, by_category: null, by_product: null }) as never,
    )
    const { result } = renderHook(() => useInventoryTurnover('week'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getTurnover).toHaveBeenCalledWith({ period: 'week' })
    expect(result.current.data?.byCategory).toEqual([])
    expect(result.current.data?.byProduct).toEqual([])
  })

  it('useInventoryAbc normaliza las 3 clases null', async () => {
    vi.mocked(inventoryAnalyticsService.getABC).mockResolvedValue(
      envelope({ summary: { total_products: 0 }, class_a: null, class_b: null, class_c: null }) as never,
    )
    const { result } = renderHook(() => useInventoryAbc('year'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getABC).toHaveBeenCalledWith({ period: 'year' })
    expect(result.current.data?.classA).toEqual([])
    expect(result.current.data?.classB).toEqual([])
    expect(result.current.data?.classC).toEqual([])
  })

  it('useStockLevels manda página, tamaño, estado y orden server-side', async () => {
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue(
      envelope({ products: null, summary: { total_products: 12 }, pagination: { page: 2 } }) as never,
    )
    const { result } = renderHook(
      () =>
        useStockLevels({
          page: 2,
          status: 'LOW_STOCK',
          sort: { by: 'value', order: 'ASC' },
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getStockLevels).toHaveBeenCalledWith({
      page: 2,
      page_size: 10,
      status: 'LOW_STOCK',
      sort_by: 'value',
      sort_order: 'ASC',
    })
    expect(result.current.data?.products).toEqual([])
    expect(result.current.data?.pagination.page).toBe(2)
  })

  it('useStockLevels sin filtro no manda status', async () => {
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue(
      envelope({ products: [], summary: {}, pagination: {} }) as never,
    )
    const { result } = renderHook(
      () => useStockLevels({ page: 1, sort: { by: 'stock', order: 'DESC' } }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getStockLevels).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, page_size: 10, status: undefined }),
    )
  })

  it('useReorderAnalysis normaliza urgentes y próximos', async () => {
    vi.mocked(inventoryAnalyticsService.getReorder).mockResolvedValue(
      envelope({
        summary: { total_needing_reorder: 2 },
        urgent_reorders: null,
        soon_reorders: [{ product_id: 'P-1' }],
      }) as never,
    )
    const { result } = renderHook(() => useReorderAnalysis(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.urgent).toEqual([])
    expect(result.current.data?.soon).toHaveLength(1)
  })

  it('useDeadStock manda el umbral y normaliza productos null', async () => {
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockResolvedValue(
      envelope({ summary: { total_products: 0 }, products: null }) as never,
    )
    const { result } = renderHook(() => useDeadStock(120), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryAnalyticsService.getDeadStock).toHaveBeenCalledWith({ days: 120 })
    expect(result.current.data?.products).toEqual([])
  })

  it('useStockAging normaliza buckets null', async () => {
    vi.mocked(inventoryAnalyticsService.getStockAging).mockResolvedValue(
      envelope({ summary: { total_products: 0 }, buckets: null }) as never,
    )
    const { result } = renderHook(() => useStockAging(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.buckets).toEqual([])
  })

  it('propaga el error del servicio (sin datos silenciosos)', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useInventoryDashboard(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
