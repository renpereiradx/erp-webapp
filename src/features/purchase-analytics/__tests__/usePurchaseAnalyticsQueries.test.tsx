/**
 * Hooks de datos de Analítica de Compras: contrato de params por endpoint y
 * normalización de slices nil de Go (`null` → `[]`). El servicio va mockeado
 * en su módulo (frontera del módulo consumido, PLAN_TEST_DESIGN §2).
 */
import { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/services/bi/purchaseAnalyticsService', () => ({
  purchaseAnalyticsService: {
    getPerformance: vi.fn(),
    getTrends: vi.fn(),
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getBySupplier: vi.fn(),
    getByBuyer: vi.fn(),
    getByPaymentMethod: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
    getComparison: vi.fn(),
  },
}))

import { purchaseAnalyticsService } from '@/services/bi/purchaseAnalyticsService'
import {
  usePurchasesByBuyer,
  usePurchasesByCategory,
  usePurchasesByPaymentMethod,
  usePurchasesByProduct,
  usePurchasesBySupplier,
  usePurchaseComparison,
  usePurchasePerformance,
  usePurchaseTrends,
} from '../hooks/usePurchaseAnalyticsQueries'

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('usePurchaseAnalyticsQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usePurchasePerformance pide compare=true y devuelve performance+metadata', async () => {
    vi.mocked(purchaseAnalyticsService.getPerformance).mockResolvedValue(
      envelope({ total_purchases: 275000 }) as never,
    )
    const { result } = renderHook(() => usePurchasePerformance('month'), { wrapper })
    await waitFor(() => expect(result.current.data?.performance?.total_purchases).toBe(275000))
    expect(purchaseAnalyticsService.getPerformance).toHaveBeenCalledWith({
      period: 'month',
      compare: true,
    })
  })

  it('usePurchaseTrends deriva la granularidad del período (year → monthly)', async () => {
    vi.mocked(purchaseAnalyticsService.getTrends).mockResolvedValue(envelope({ data_points: [] }) as never)
    renderHook(() => usePurchaseTrends('year'), { wrapper })
    await waitFor(() =>
      expect(purchaseAnalyticsService.getTrends).toHaveBeenCalledWith({
        period: 'year',
        granularity: 'monthly',
      }),
    )
  })

  it('usePurchasesByProduct manda paginación y sort; normaliza slices nil', async () => {
    vi.mocked(purchaseAnalyticsService.getByProduct).mockResolvedValue(
      envelope({ products: null, pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1 } }) as never,
    )
    const { result } = renderHook(
      () => usePurchasesByProduct('month', 1, 'units', 'asc'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.products).toEqual([])
    expect(purchaseAnalyticsService.getByProduct).toHaveBeenCalledWith({
      period: 'month',
      page: 1,
      page_size: 10,
      sort_by: 'units',
      sort_order: 'asc',
    })
  })

  it('usePurchasesBySupplier usa page_size del proyecto y sort propio', async () => {
    vi.mocked(purchaseAnalyticsService.getBySupplier).mockResolvedValue(envelope({ suppliers: null, pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1 } }) as never)
    const { result } = renderHook(
      () => usePurchasesBySupplier('week', 2, 'amount', 'desc'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data?.suppliers).toEqual([]))
    expect(purchaseAnalyticsService.getBySupplier).toHaveBeenCalledWith({
      period: 'week',
      page: 2,
      page_size: 10,
      sort_by: 'amount',
      sort_order: 'desc',
    })
  })

  it('usePurchasesByBuyer/Category/PaymentMethod normalizan sus listas', async () => {
    vi.mocked(purchaseAnalyticsService.getByBuyer).mockResolvedValue(envelope({ buyers: null, pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1 } }) as never)
    vi.mocked(purchaseAnalyticsService.getByCategory).mockResolvedValue(envelope({ categories: null }) as never)
    vi.mocked(purchaseAnalyticsService.getByPaymentMethod).mockResolvedValue(envelope({ payment_methods: null }) as never)

    const buyers = renderHook(() => usePurchasesByBuyer('month', 1), { wrapper })
    const categories = renderHook(() => usePurchasesByCategory('month'), { wrapper })
    const methods = renderHook(() => usePurchasesByPaymentMethod('month'), { wrapper })

    await waitFor(() => expect(buyers.result.current.data?.buyers).toEqual([]))
    await waitFor(() => expect(categories.result.current.data?.categories).toEqual([]))
    await waitFor(() => expect(methods.result.current.data?.methods).toEqual([]))
  })

  it('usePurchaseComparison respeta enabled=false (rango inválido no dispara request)', async () => {
    vi.mocked(purchaseAnalyticsService.getComparison).mockResolvedValue(envelope({}) as never)
    const { result } = renderHook(
      () => usePurchaseComparison({ start1: '2026-10-15', end1: '2026-09-01', start2: '2026-08-01', end2: '2026-08-31' }, false),
      { wrapper },
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(purchaseAnalyticsService.getComparison).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})
