/**
 * F4 — hooks de datos de Analítica de Ventas: contrato de params por endpoint
 * (período, granularidad, paginación, sort), normalización de slices nil de Go
 * y errores sin fallback silencioso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: {
    getPerformance: vi.fn(),
    getDashboard: vi.fn(),
    getTrends: vi.fn(),
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getTopBottomProducts: vi.fn(),
    getByCustomer: vi.fn(),
    getBySeller: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
    getVelocity: vi.fn(),
    getComparison: vi.fn(),
    getDiscounts: vi.fn(),
    getDiscountsSummary: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import {
  useDiscounts,
  useSalesByCustomer,
  useSalesByHour,
  useSalesByProduct,
  useSalesComparison,
  useSalesDashboard,
  useSalesPerformance,
  useSalesTopBottomProducts,
  useSalesTrends,
} from '../hooks/useSalesAnalyticsQueries'

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

describe('hooks de Analítica de Ventas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useSalesPerformance pide comparación real contra la ventana previa', async () => {
    vi.mocked(salesAnalyticsService.getPerformance).mockResolvedValue(
      envelope({ total_sales: 100 }) as never,
    )
    const { result } = renderHook(() => useSalesPerformance('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(salesAnalyticsService.getPerformance).toHaveBeenCalledWith({
      period: 'month',
      compare: true,
    })
  })

  it('useSalesDashboard normaliza los slices nil de Go a []', async () => {
    vi.mocked(salesAnalyticsService.getDashboard).mockResolvedValue(
      envelope({
        top_products: null,
        top_categories: null,
        payment_mix: null,
        period: { start_date: 'x', end_date: 'y' },
      }) as never,
    )
    const { result } = renderHook(() => useSalesDashboard('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.dashboard.topProducts).toEqual([])
    expect(result.current.data?.dashboard.topCategories).toEqual([])
    expect(result.current.data?.dashboard.paymentMix).toEqual([])
  })

  it('useSalesTrends deriva la granularidad del período', async () => {
    vi.mocked(salesAnalyticsService.getTrends).mockResolvedValue(envelope({}) as never)
    const { result } = renderHook(() => useSalesTrends('year'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(salesAnalyticsService.getTrends).toHaveBeenCalledWith({
      period: 'year',
      granularity: 'monthly',
    })
  })

  it('useSalesByProduct envía página y orden server-side', async () => {
    vi.mocked(salesAnalyticsService.getByProduct).mockResolvedValue(
      envelope({ products: null, pagination: null }) as never,
    )
    const { result } = renderHook(
      () => useSalesByProduct('month', 2, 'margin', 'asc'),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(salesAnalyticsService.getByProduct).toHaveBeenCalledWith({
      period: 'month',
      page: 2,
      page_size: 10,
      sort_by: 'margin',
      sort_order: 'asc',
    })
    expect(result.current.data?.products).toEqual([])
    expect(result.current.data?.pagination.page).toBe(2)
  })

  it('useSalesTopBottomProducts normaliza los 4 rankings', async () => {
    vi.mocked(salesAnalyticsService.getTopBottomProducts).mockResolvedValue(
      envelope({ top_sellers: null, bottom_sellers: null, top_by_margin: null, top_by_volume: null }) as never,
    )
    const { result } = renderHook(() => useSalesTopBottomProducts('month', 5), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(salesAnalyticsService.getTopBottomProducts).toHaveBeenCalledWith({
      period: 'month',
      limit: 5,
    })
    expect(result.current.data?.bottomSellers).toEqual([])
  })

  it('useSalesByCustomer expone resumen y paginación del BE', async () => {
    vi.mocked(salesAnalyticsService.getByCustomer).mockResolvedValue(
      envelope({
        customers: null,
        summary: { total_customers: 4 },
        pagination: { page: 1, page_size: 10, total_items: 4, total_pages: 1 },
      }) as never,
    )
    const { result } = renderHook(() => useSalesByCustomer('month', 1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.customers).toEqual([])
    expect(result.current.data?.summary?.total_customers).toBe(4)
  })

  it('useSalesByHour expone la hora pico del payload con fallback 0', async () => {
    vi.mocked(salesAnalyticsService.getByHour).mockResolvedValue(
      envelope({ hourly_data: null, peak_hour: 14, peak_sales: 200000 }) as never,
    )
    const { result } = renderHook(() => useSalesByHour('month'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.hourly).toEqual([])
    expect(result.current.data?.peakHour).toBe(14)
  })

  it('useSalesComparison no ejecuta la query cuando el rango es inválido', () => {
    const { result } = renderHook(
      () => useSalesComparison({ start1: '2026-09-30', end1: '2026-09-01' }, false),
      { wrapper: createWrapper() },
    )
    expect(result.current.fetchStatus).toBe('idle')
    expect(salesAnalyticsService.getComparison).not.toHaveBeenCalled()
  })

  it('useDiscounts trata el slice nil de Go (data:null) como lista vacía', async () => {
    vi.mocked(salesAnalyticsService.getDiscounts).mockResolvedValue(
      envelope(null, { total_count: 0 }) as never,
    )
    const { result } = renderHook(
      () => useDiscounts({ start_date: '2026-09-01', end_date: '2026-09-30', page: 1, page_size: 10 }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.lines).toEqual([])
    expect(result.current.data?.totalCount).toBe(0)
  })

  it('useDiscounts falla si el envelope no trae la clave data', async () => {
    vi.mocked(salesAnalyticsService.getDiscounts).mockResolvedValue({
      success: true,
      metadata: {},
    } as never)
    const { result } = renderHook(
      () => useDiscounts({ start_date: '2026-09-01', end_date: '2026-09-30', page: 1, page_size: 10 }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('sales-response-invalid')
  })
})
