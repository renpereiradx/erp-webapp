/**
 * F6 — hooks de Rentabilidad: contrato de params por endpoint, normalización
 * de slices nil de Go, re-derivación del resumen de tendencias y sin fallback
 * silencioso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/profitabilityService', () => ({
  profitabilityService: {
    getDashboard: vi.fn(),
    getProducts: vi.fn(),
    getCustomers: vi.fn(),
    getCategories: vi.fn(),
    getTrends: vi.fn(),
    getSellers: vi.fn(),
  },
}))

import { profitabilityService } from '@/services/bi/profitabilityService'
import {
  useProfitabilityCategories,
  useProfitabilityCustomers,
  useProfitabilityDashboard,
  useProfitabilityProducts,
  useProfitabilitySellers,
  useProfitabilityTrends,
} from '../hooks/useProfitabilityQueries'

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

describe('hooks de Rentabilidad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dashboard normaliza sus 5 listas null', async () => {
    vi.mocked(profitabilityService.getDashboard).mockResolvedValue(
      envelope({
        kpis: { total_revenue: 100 },
        top_products: null,
        top_customers: null,
        top_categories: null,
        trends: null,
        alerts: null,
      }) as never,
    )
    const { result } = renderHook(() => useProfitabilityDashboard('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getDashboard).toHaveBeenCalledWith('month')
    expect(result.current.data?.topProducts).toEqual([])
    expect(result.current.data?.topCustomers).toEqual([])
    expect(result.current.data?.topCategories).toEqual([])
    expect(result.current.data?.trends).toEqual([])
    expect(result.current.data?.alerts).toEqual([])
  })

  it('products manda página/tamaño/orden y normaliza listas null', async () => {
    vi.mocked(profitabilityService.getProducts).mockResolvedValue(
      envelope({
        summary: { total_profit: 0 },
        products: null,
        top_profitable: null,
        losers: null,
        pagination: { page: 2, total_pages: 3 },
      }) as never,
    )
    const { result } = renderHook(
      () =>
        useProfitabilityProducts({
          period: 'week',
          page: 2,
          sort: { by: 'name', order: 'ASC' },
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getProducts).toHaveBeenCalledWith({
      period: 'week',
      page: 2,
      page_size: 10,
      sort_by: 'name',
      sort_order: 'ASC',
    })
    expect(result.current.data?.products).toEqual([])
    expect(result.current.data?.topProfitable).toEqual([])
    expect(result.current.data?.losers).toEqual([])
    expect(result.current.data?.pagination.page).toBe(2)
  })

  it('customers manda página y tamaño; normaliza null', async () => {
    vi.mocked(profitabilityService.getCustomers).mockResolvedValue(
      envelope({ summary: {}, customers: null, pagination: { page: 1 } }) as never,
    )
    const { result } = renderHook(() => useProfitabilityCustomers('month', 1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getCustomers).toHaveBeenCalledWith({
      period: 'month',
      page: 1,
      page_size: 10,
    })
    expect(result.current.data?.customers).toEqual([])
  })

  it('categories manda el período y normaliza null', async () => {
    vi.mocked(profitabilityService.getCategories).mockResolvedValue(
      envelope({ summary: {}, categories: null }) as never,
    )
    const { result } = renderHook(() => useProfitabilityCategories('year'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getCategories).toHaveBeenCalledWith('year')
    expect(result.current.data?.categories).toEqual([])
  })

  it('trends manda período/granularidad y re-deriva el insight de los puntos', async () => {
    vi.mocked(profitabilityService.getTrends).mockResolvedValue(
      envelope({
        granularity: 'weekly',
        data_points: [
          {
            date: '2026-10-01T00:00:00Z',
            label: '01 Oct',
            revenue: 1000,
            cost: 600,
            gross_profit: 400,
            gross_margin_pct: 40,
            net_profit: 400,
            net_margin_pct: 40,
            transactions: 1,
            units_sold: 1,
          },
          {
            date: '2026-10-08T00:00:00Z',
            label: '08 Oct',
            revenue: 2000,
            cost: 1000,
            gross_profit: 1000,
            gross_margin_pct: 50,
            net_profit: 1000,
            net_margin_pct: 50,
            transactions: 2,
            units_sold: 2,
          },
        ],
      }) as never,
    )
    const { result } = renderHook(() => useProfitabilityTrends('month', 'weekly'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getTrends).toHaveBeenCalledWith({
      period: 'month',
      granularity: 'weekly',
    })
    expect(result.current.data?.granularity).toBe('weekly')
    expect(result.current.data?.insight.totalRevenue).toBe(3000)
    expect(result.current.data?.insight.totalProfit).toBe(1400)
    expect(result.current.data?.insight.direction).toBe('up')
  })

  it('trends usa la granularidad pedida si el BE no la ecoa', async () => {
    vi.mocked(profitabilityService.getTrends).mockResolvedValue(
      envelope({ data_points: null }) as never,
    )
    const { result } = renderHook(() => useProfitabilityTrends('year', 'monthly'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.granularity).toBe('monthly')
    expect(result.current.data?.points).toEqual([])
    expect(result.current.data?.insight.totalRevenue).toBe(0)
  })

  it('sellers manda el período y normaliza null', async () => {
    vi.mocked(profitabilityService.getSellers).mockResolvedValue(
      envelope({ summary: {}, sellers: null }) as never,
    )
    const { result } = renderHook(() => useProfitabilitySellers('today'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(profitabilityService.getSellers).toHaveBeenCalledWith('today')
    expect(result.current.data?.sellers).toEqual([])
  })
})
