import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/dashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
    getKPIs: vi.fn(),
    getTrends: vi.fn(),
    getAlerts: vi.fn(),
    getRecentActivity: vi.fn(),
    getTopProducts: vi.fn(),
    getSalesHeatmap: vi.fn(),
  },
}))

import { dashboardService } from '@/services/bi/dashboardService'
import { useDashboardStore } from '@/store/useDashboardStore'
import {
  useDashboardAlerts,
  useDashboardRecentActivity,
  useDashboardSalesHeatmap,
  useDashboardSummary,
  useDashboardTopProducts,
  useDashboardTrends,
} from '../hooks/useDashboardQueries'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const envelope = <T,>(data: T, metadata: Record<string, unknown> = {}) => ({
  success: true,
  data,
  metadata,
})

describe('hooks del Dashboard BI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDashboardStore.getState().reset()
  })

  it('useDashboardSummary consulta el período del store y expone el payload', async () => {
    vi.mocked(dashboardService.getSummary).mockResolvedValue(
      envelope({ sales: { total: 551760 } }) as never,
    )

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getSummary).toHaveBeenCalledWith({ period: 'month' })
    expect(result.current.data?.summary).toEqual({ sales: { total: 551760 } })
  })

  it('cambiar el período en el store dispara la consulta del período nuevo', async () => {
    vi.mocked(dashboardService.getSummary).mockResolvedValue(envelope({ sales: { total: 1 } }) as never)

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => useDashboardStore.getState().setPeriod('year'))

    await waitFor(() =>
      expect(dashboardService.getSummary).toHaveBeenLastCalledWith({ period: 'year' }),
    )
  })

  it('useDashboardTopProducts pasa limit y sort_by al contrato del BE', async () => {
    vi.mocked(dashboardService.getTopProducts).mockResolvedValue(
      envelope({ products: [], total_revenue: 0, total_profit: 0 }) as never,
    )

    const { result } = renderHook(() => useDashboardTopProducts(10, 'profit'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getTopProducts).toHaveBeenCalledWith({
      period: 'month',
      limit: 10,
      sort_by: 'profit',
    })
  })

  it('useDashboardAlerts devuelve alertas + resumen del servidor', async () => {
    vi.mocked(dashboardService.getAlerts).mockResolvedValue(
      envelope({
        alerts: [{ id: 'a1' }],
        summary: { total: 1, by_severity: { critical: 1 }, by_category: { inventory: 1 } },
      }) as never,
    )

    const { result } = renderHook(() => useDashboardAlerts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.alerts).toHaveLength(1)
    expect(result.current.data?.summary.total).toBe(1)
  })

  it('useDashboardRecentActivity pide el límite indicado', async () => {
    vi.mocked(dashboardService.getRecentActivity).mockResolvedValue(
      envelope({ activities: [] }) as never,
    )

    const { result } = renderHook(() => useDashboardRecentActivity(3), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getRecentActivity).toHaveBeenCalledWith({ limit: 3 })
  })

  it('useDashboardSalesHeatmap sigue la ventana de semanas del store', async () => {
    vi.mocked(dashboardService.getSalesHeatmap).mockResolvedValue(
      envelope({ heatmap: [], peak_times: [], slow_times: [] }) as never,
    )

    const { result } = renderHook(() => useDashboardSalesHeatmap(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(dashboardService.getSalesHeatmap).toHaveBeenCalledWith({ weeks: 4 })

    act(() => useDashboardStore.getState().setHeatmapWeeks(12))
    await waitFor(() =>
      expect(dashboardService.getSalesHeatmap).toHaveBeenLastCalledWith({ weeks: 12 }),
    )
  })

  it('useDashboardTrends expone el error del servicio sin fallback silencioso', async () => {
    vi.mocked(dashboardService.getTrends).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useDashboardTrends(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('boom')
  })
})
