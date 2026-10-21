/**
 * F8 — hooks de Cuentas por Pagar: params por endpoint, paginación/tamaño,
 * normalización de slices nil de Go, ventanas de días y sin fallback silencioso
 * cuando falta `data`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/payablesService', () => ({
  payablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getTopSuppliers: vi.fn(),
    getSchedule: vi.fn(),
    getAgingReport: vi.fn(),
    getStatistics: vi.fn(),
    getCashFlowProjection: vi.fn(),
    getSupplierAnalysis: vi.fn(),
  },
}))

import { payablesService } from '@/services/bi/payablesService'
import {
  useCashFlowProjection,
  usePayableDetail,
  usePayablesAgingReport,
  usePayablesList,
  usePayablesOverview,
  usePayablesSchedule,
  usePayablesStatistics,
  useSupplierAnalysis,
  useSupplierInvoices,
  useTopSuppliers,
} from '../hooks/usePayablesQueries'

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

const LIST = {
  items: null,
  pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
  summary: null,
}

const baseListParams = {
  page: 2,
  sort: { by: 'due_date' as const, order: 'ASC' as const },
  status: 'ALL' as const,
  priority: 'ALL' as const,
  search: '',
  startDate: '',
  endDate: '',
}

describe('hooks de Cuentas por Pagar (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overview devuelve el payload y falla si falta data', async () => {
    vi.mocked(payablesService.getOverview).mockResolvedValue(
      envelope({ total_pending: 100, total_overdue: 50 }) as never,
    )
    const { result } = renderHook(() => usePayablesOverview(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_pending).toBe(100)

    vi.mocked(payablesService.getOverview).mockResolvedValue({ success: true } as never)
    const broken = renderHook(() => usePayablesOverview(), { wrapper: createWrapper() })
    await waitFor(() => expect(broken.result.current.isError).toBe(true))
  })

  it('list omite los sentinelas ALL y manda página/orden/tamaño; normaliza null', async () => {
    vi.mocked(payablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(
      () => usePayablesList(baseListParams),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getList).toHaveBeenCalledWith({
      status: undefined,
      priority: undefined,
      search: undefined,
      start_date: undefined,
      end_date: undefined,
      page: 2,
      page_size: 10,
      sort_by: 'due_date',
      sort_order: 'ASC',
    })
    expect(result.current.data?.items).toEqual([])
    expect(result.current.data?.summary).toBeNull()
  })

  it('list manda filtros reales recortando el texto', async () => {
    vi.mocked(payablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(
      () =>
        usePayablesList({
          ...baseListParams,
          status: 'OVERDUE',
          priority: 'URGENT',
          search: '  acme  ',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          sort: { by: 'amount', order: 'DESC' },
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getList).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'OVERDUE',
        priority: 'URGENT',
        search: 'acme',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        sort_by: 'amount',
        sort_order: 'DESC',
      }),
    )
  })

  it('list con rango inválido no consulta al BE', async () => {
    renderHook(
      () => usePayablesList({ ...baseListParams, startDate: '2026-10-05', endDate: '2026-10-01' }),
      { wrapper: createWrapper() },
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(payablesService.getList).not.toHaveBeenCalled()
  })

  it('facturas de proveedor filtran por supplier_id y fecha desc', async () => {
    vi.mocked(payablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(() => useSupplierInvoices('SP-1', 2), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getList).toHaveBeenCalledWith({
      supplier_id: 'SP-1',
      page: 2,
      page_size: 10,
      sort_by: 'date',
      sort_order: 'DESC',
    })
  })

  it('top suppliers y schedule usan sus límites/ventanas y normalizan null', async () => {
    vi.mocked(payablesService.getTopSuppliers).mockResolvedValue(
      envelope(null) as never,
    )
    vi.mocked(payablesService.getSchedule).mockResolvedValue(
      envelope({
        start_date: '2026-10-20',
        end_date: '2026-11-19',
        total_due: 0,
        schedule: null,
      }) as never,
    )

    const suppliers = renderHook(() => useTopSuppliers(7), { wrapper: createWrapper() })
    await waitFor(() => expect(suppliers.result.current.isSuccess).toBe(true))
    expect(payablesService.getTopSuppliers).toHaveBeenCalledWith(7)
    expect(suppliers.result.current.data).toEqual([])

    const schedule = renderHook(() => usePayablesSchedule(60), { wrapper: createWrapper() })
    await waitFor(() => expect(schedule.result.current.isSuccess).toBe(true))
    expect(payablesService.getSchedule).toHaveBeenCalledWith(60)
    expect(schedule.result.current.data?.schedule).toEqual([])
  })

  it('aging report pagina por proveedor y deriva la paginación del total', async () => {
    vi.mocked(payablesService.getAgingReport).mockResolvedValue(
      envelope({
        generated_at: '2026-10-20T10:00:00Z',
        summary: {},
        by_supplier: null,
        total_amount: 100,
        total_suppliers: 23,
      }) as never,
    )
    const { result } = renderHook(() => usePayablesAgingReport(2), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getAgingReport).toHaveBeenCalledWith({ page: 2, page_size: 10 })
    expect(result.current.data?.suppliers).toEqual([])
    expect(result.current.data?.pagination).toEqual({
      page: 2,
      page_size: 10,
      total_items: 23,
      total_pages: 3,
    })
  })

  it('statistics manda el período y normaliza los arrays null', async () => {
    vi.mocked(payablesService.getStatistics).mockResolvedValue(
      envelope({
        period: '2026-10-01 - 2026-11-01',
        total_purchased: 0,
        total_paid: 0,
        payment_rate: 0,
        average_dpo: 0,
        overdue_percentage: 0,
        top_suppliers: null,
        payment_trend: null,
      }) as never,
    )
    const { result } = renderHook(() => usePayablesStatistics('week'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getStatistics).toHaveBeenCalledWith('week')
    expect(result.current.data?.top_suppliers).toEqual([])
    expect(result.current.data?.payment_trend).toEqual([])
  })

  it('cash-flow manda la ventana y normaliza projection_days null', async () => {
    vi.mocked(payablesService.getCashFlowProjection).mockResolvedValue(
      envelope({
        period: '90 days',
        expected_inflows: 0,
        expected_outflows: 0,
        net_cash_flow: 0,
        cumulative_flow: 0,
        projection_days: null,
      }) as never,
    )
    const { result } = renderHook(() => useCashFlowProjection(90), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(payablesService.getCashFlowProjection).toHaveBeenCalledWith(90)
    expect(result.current.data?.projection_days).toEqual([])
  })

  it('detail y supplier analysis devuelven el payload (y fallan sin data)', async () => {
    vi.mocked(payablesService.getById).mockResolvedValue(
      envelope({ id: 'PO-1', payment_history: null }) as never,
    )
    vi.mocked(payablesService.getSupplierAnalysis).mockResolvedValue(
      envelope({ supplier_id: 'SP-1', supplier_name: 'Protek' }) as never,
    )

    const detail = renderHook(() => usePayableDetail('PO-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    expect(detail.result.current.data?.payment_history).toEqual([])

    const analysis = renderHook(() => useSupplierAnalysis('SP-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(analysis.result.current.isSuccess).toBe(true))
    expect(analysis.result.current.data?.supplier_name).toBe('Protek')

    vi.mocked(payablesService.getById).mockResolvedValue({ success: true } as never)
    const broken = renderHook(() => usePayableDetail('PO-2'), { wrapper: createWrapper() })
    await waitFor(() => expect(broken.result.current.isError).toBe(true))
  })
})
