/**
 * F7 — hooks de Cuentas por Cobrar: params por endpoint, paginación/tamaño,
 * normalización de slices nil de Go, serie semanal sin el bucket posterior al
 * rango y sin fallback silencioso cuando falta `data`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/receivablesService', () => ({
  receivablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getOverdue: vi.fn(),
    getClientReceivables: vi.fn(),
    getClientRisk: vi.fn(),
    getAgingReport: vi.fn(),
    getTopDebtors: vi.fn(),
    getStatistics: vi.fn(),
  },
}))

import { receivablesService } from '@/services/bi/receivablesService'
import {
  useClientReceivables,
  useClientRisk,
  useReceivableDetail,
  useReceivablesAgingReport,
  useReceivablesList,
  useReceivablesOverview,
  useReceivablesOverdue,
  useReceivablesRecent,
  useReceivablesStatistics,
  useReceivablesTopDebtors,
} from '../hooks/useReceivablesQueries'

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

describe('hooks de Cuentas por Cobrar (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overview devuelve el payload y falla si falta data', async () => {
    vi.mocked(receivablesService.getOverview).mockResolvedValue(
      envelope({ total_pending: 100, total_overdue: 50 }) as never,
    )
    const { result } = renderHook(() => useReceivablesOverview(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_pending).toBe(100)

    vi.mocked(receivablesService.getOverview).mockResolvedValue({ success: true } as never)
    const broken = renderHook(() => useReceivablesOverview(), { wrapper: createWrapper() })
    await waitFor(() => expect(broken.result.current.isError).toBe(true))
  })

  it('list omite el sentinela ALL y manda página/orden/tamaño; normaliza null', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(
      () =>
        useReceivablesList({
          status: 'ALL',
          page: 2,
          sort: { by: 'days_overdue', order: 'DESC' },
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getList).toHaveBeenCalledWith({
      status: undefined,
      page: 2,
      page_size: 10,
      sort_by: 'days_overdue',
      sort_order: 'DESC',
    })
    expect(result.current.data?.items).toEqual([])
    expect(result.current.data?.summary).toBeNull()
  })

  it('list propaga el filtro de estado cuando no es ALL', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(
      () =>
        useReceivablesList({
          status: 'OVERDUE',
          page: 1,
          sort: { by: 'date', order: 'DESC' },
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getList).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'OVERDUE' }),
    )
  })

  it('recent pide 5 filas ordenadas por fecha descendente', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(envelope(LIST) as never)
    const { result } = renderHook(() => useReceivablesRecent(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getList).toHaveBeenCalledWith({
      page: 1,
      page_size: 5,
      sort_by: 'date',
      sort_order: 'DESC',
    })
  })

  it('overdue pagina de a 10 y normaliza las listas null', async () => {
    vi.mocked(receivablesService.getOverdue).mockResolvedValue(
      envelope({ ...LIST, items: [{ id: 'SALE-1' }] }) as never,
    )
    const { result } = renderHook(() => useReceivablesOverdue(3), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getOverdue).toHaveBeenCalledWith({ page: 3, page_size: 10 })
    expect(result.current.data?.items).toHaveLength(1)
  })

  it('detail normaliza payment_history null', async () => {
    vi.mocked(receivablesService.getById).mockResolvedValue(
      envelope({ id: 'SALE-1', payment_history: null }) as never,
    )
    const { result } = renderHook(() => useReceivableDetail('SALE-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getById).toHaveBeenCalledWith('SALE-1')
    expect(result.current.data?.payments).toEqual([])
  })

  it('client normaliza receivables null y no consulta sin id', async () => {
    vi.mocked(receivablesService.getClientReceivables).mockResolvedValue(
      envelope({ client_id: 'CL-1', receivables: null }) as never,
    )
    const { result } = renderHook(() => useClientReceivables('CL-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.receivables).toEqual([])

    renderHook(() => useClientReceivables(''), { wrapper: createWrapper() })
    expect(receivablesService.getClientReceivables).toHaveBeenCalledTimes(1)
  })

  it('risk devuelve el análisis del cliente', async () => {
    vi.mocked(receivablesService.getClientRisk).mockResolvedValue(
      envelope({ client_id: 'CL-1', risk_level: 'HIGH', total_payments: 7 }) as never,
    )
    const { result } = renderHook(() => useClientRisk('CL-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getClientRisk).toHaveBeenCalledWith('CL-1')
    expect(result.current.data?.risk_level).toBe('HIGH')
  })

  it('aging report deriva filas, totales y no clasificado', async () => {
    vi.mocked(receivablesService.getAgingReport).mockResolvedValue(
      envelope({
        generated_at: '2026-10-20T20:51:46Z',
        summary: {
          current: { amount: 1000, count: 1, percentage: 25 },
          days_30_60: { amount: 0, count: 0, percentage: 0 },
          days_60_90: { amount: 0, count: 0, percentage: 0 },
          over_90_days: { amount: 3000, count: 1, percentage: 75 },
        },
        by_client: [
          {
            client_id: 'CL-1',
            client_name: 'Erika',
            current: 1000,
            days_30_60: 0,
            days_60_90: 0,
            over_90_days: 3000,
            total: 4000,
          },
          {
            client_id: 'CL-2',
            client_name: 'Rene',
            current: 0,
            days_30_60: 0,
            days_60_90: 0,
            over_90_days: 0,
            total: 500,
          },
        ],
        total_amount: 4500,
        total_clients: 2,
      }) as never,
    )
    const { result } = renderHook(() => useReceivablesAgingReport(1), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getAgingReport).toHaveBeenCalledWith({ page: 1, page_size: 10 })
    expect(result.current.data?.rows).toHaveLength(2)
    expect(result.current.data?.rows[1].unclassified).toBe(500)
    expect(result.current.data?.pageTotals.total).toBe(4500)
    expect(result.current.data?.unclassifiedAmount).toBe(500)
    expect(result.current.data?.summaryRows).toHaveLength(4)
  })

  it('top debtors pide 5 y normaliza null a lista vacía', async () => {
    vi.mocked(receivablesService.getTopDebtors).mockResolvedValue({
      success: true,
      data: null,
    } as never)
    const { result } = renderHook(() => useReceivablesTopDebtors(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getTopDebtors).toHaveBeenCalledWith(5)
    expect(result.current.data).toEqual([])
  })

  it('statistics parsea el rango y descarta el bucket posterior al fin', async () => {
    vi.mocked(receivablesService.getStatistics).mockResolvedValue(
      envelope({
        period: '2026-10-01 - 2026-11-01',
        total_billed: 100,
        total_collected: 80,
        collection_rate: 80,
        average_dso: 3,
        overdue_percentage: 10,
        top_debtors: null,
        collection_trend: [
          { date: '2026-10-05', billed: 10, collected: 5, balance: 5 },
          { date: '2026-11-02', billed: 0, collected: 0, balance: 5 },
        ],
      }) as never,
    )
    const { result } = renderHook(() => useReceivablesStatistics('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivablesService.getStatistics).toHaveBeenCalledWith('month')
    expect(result.current.data?.range).toEqual({ start: '2026-10-01', end: '2026-11-01' })
    expect(result.current.data?.trend.map((row) => row.date)).toEqual(['2026-10-05'])
  })
})
