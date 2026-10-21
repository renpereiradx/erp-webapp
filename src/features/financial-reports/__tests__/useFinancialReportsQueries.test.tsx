/**
 * F9 — hooks de Reportes Financieros: params por endpoint, normalización de
 * slices nil, selección período/date-range y fallo cuando falta `data`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/financialReportsService', () => ({
  financialReportsService: {
    getIncomeStatement: vi.fn(),
    getCashFlow: vi.fn(),
    getVat: vi.fn(),
    getTaxSummary: vi.fn(),
    getOverview: vi.fn(),
    getHealthScore: vi.fn(),
    getSalesLedger: vi.fn(),
    getPurchaseLedger: vi.fn(),
    getProrrateoHistory: vi.fn(),
    getProrrateoDetails: vi.fn(),
  },
}))

import { financialReportsService } from '@/services/bi/financialReportsService'
import {
  useCashFlowStatement,
  useFinancialHealthScore,
  useFinancialOverview,
  useIncomeStatement,
  useProrrateoDetails,
  useProrrateoHistory,
  usePurchaseLedger,
  useSalesLedger,
  useTaxSummary,
  useVatReport,
} from '../hooks/useFinancialReportsQueries'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const ledger = {
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  summary: {},
  entries: null,
  pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
}

describe('hooks de Reportes Financieros (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overview e income mandan el período y normalizan arrays null', async () => {
    vi.mocked(financialReportsService.getOverview).mockResolvedValue(
      envelope({ revenue: 100 }) as never,
    )
    vi.mocked(financialReportsService.getIncomeStatement).mockResolvedValue(
      envelope({
        revenue: { by_category: null, by_payment_method: null },
        expenses: { by_category: null },
      }) as never,
    )

    const overview = renderHook(() => useFinancialOverview('week'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(overview.result.current.isSuccess).toBe(true))
    expect(financialReportsService.getOverview).toHaveBeenCalledWith('week')

    const income = renderHook(() => useIncomeStatement('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(income.result.current.isSuccess).toBe(true))
    expect(financialReportsService.getIncomeStatement).toHaveBeenCalledWith('month')
    expect(income.result.current.data?.revenue.by_category).toEqual([])
    expect(income.result.current.data?.revenue.by_payment_method).toEqual([])
    expect(income.result.current.data?.expenses.by_category).toEqual([])
  })

  it('falla si el endpoint no trae data', async () => {
    vi.mocked(financialReportsService.getOverview).mockResolvedValue({ success: true } as never)
    const { result } = renderHook(() => useFinancialOverview('month'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('cash flow, vat y tax normalizan sus slices mensuales/diarios', async () => {
    vi.mocked(financialReportsService.getCashFlow).mockResolvedValue(
      envelope({ daily_breakdown: null }) as never,
    )
    vi.mocked(financialReportsService.getVat).mockResolvedValue(
      envelope({ monthly_breakdown: null }) as never,
    )
    vi.mocked(financialReportsService.getTaxSummary).mockResolvedValue(
      envelope({ monthly_detail: null }) as never,
    )

    const cash = renderHook(() => useCashFlowStatement('year'), { wrapper: createWrapper() })
    const vat = renderHook(() => useVatReport('year'), { wrapper: createWrapper() })
    const tax = renderHook(() => useTaxSummary('year'), { wrapper: createWrapper() })

    await waitFor(() => expect(cash.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(vat.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(tax.result.current.isSuccess).toBe(true))
    expect(cash.result.current.data?.daily_breakdown).toEqual([])
    expect(vat.result.current.data?.monthly_breakdown).toEqual([])
    expect(tax.result.current.data?.monthly_detail).toEqual([])
  })

  it('health-score usa el período', async () => {
    vi.mocked(financialReportsService.getHealthScore).mockResolvedValue(
      envelope({ score: 95 }) as never,
    )
    const { result } = renderHook(() => useFinancialHealthScore('today'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(financialReportsService.getHealthScore).toHaveBeenCalledWith('today')
  })

  it('libro de ventas por período no manda fechas ni filtros SIFEN', async () => {
    vi.mocked(financialReportsService.getSalesLedger).mockResolvedValue(
      envelope(ledger) as never,
    )
    const { result } = renderHook(
      () =>
        useSalesLedger({
          period: 'month',
          page: 2,
          startDate: '',
          endDate: '',
          estado: 'APROBADO',
          cdc: 'x',
          timbrado: 'y',
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(financialReportsService.getSalesLedger).toHaveBeenCalledWith({
      period: 'month',
      page: 2,
      page_size: 10,
      start_date: undefined,
      end_date: undefined,
      estado: undefined,
      cdc: undefined,
      timbrado: undefined,
    })
    expect(result.current.data?.entries).toEqual([])
  })

  it('libro de ventas con rango manda los filtros', async () => {
    vi.mocked(financialReportsService.getSalesLedger).mockResolvedValue(
      envelope(ledger) as never,
    )
    const { result } = renderHook(
      () =>
        useSalesLedger({
          period: 'month',
          page: 1,
          startDate: '2026-09-01',
          endDate: '2026-10-01',
          estado: 'APROBADO',
          cdc: '123',
          timbrado: '8000',
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(financialReportsService.getSalesLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: '2026-09-01',
        end_date: '2026-10-01',
        estado: 'APROBADO',
        cdc: '123',
        timbrado: '8000',
      }),
    )
  })

  it('con una sola fecha no consulta (rango incompleto)', async () => {
    renderHook(
      () =>
        usePurchaseLedger({
          period: 'month',
          page: 1,
          startDate: '2026-09-01',
          endDate: '',
        }),
      { wrapper: createWrapper() },
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(financialReportsService.getPurchaseLedger).not.toHaveBeenCalled()
  })

  it('libro de compras normaliza entries null y usa date-range con rango', async () => {
    vi.mocked(financialReportsService.getPurchaseLedger).mockResolvedValue(
      envelope(ledger) as never,
    )
    const { result } = renderHook(
      () =>
        usePurchaseLedger({
          period: 'month',
          page: 1,
          startDate: '2026-09-01',
          endDate: '2026-10-01',
        }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(financialReportsService.getPurchaseLedger).toHaveBeenCalledWith({
      period: 'month',
      page: 1,
      page_size: 10,
      start_date: '2026-09-01',
      end_date: '2026-10-01',
    })
    expect(result.current.data?.entries).toEqual([])
  })

  it('prorrateo history normaliza null y details solo consulta con id', async () => {
    vi.mocked(financialReportsService.getProrrateoHistory).mockResolvedValue(
      envelope(null) as never,
    )
    vi.mocked(financialReportsService.getProrrateoDetails).mockResolvedValue(
      envelope([{ id: 1 }]) as never,
    )

    const history = renderHook(() => useProrrateoHistory(), { wrapper: createWrapper() })
    await waitFor(() => expect(history.result.current.isSuccess).toBe(true))
    expect(financialReportsService.getProrrateoHistory).toHaveBeenCalledWith(20)
    expect(history.result.current.data).toEqual([])

    const noId = renderHook(() => useProrrateoDetails(null), { wrapper: createWrapper() })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(financialReportsService.getProrrateoDetails).not.toHaveBeenCalled()
    expect(noId.result.current.fetchStatus).toBe('idle')

    const withId = renderHook(() => useProrrateoDetails(7), { wrapper: createWrapper() })
    await waitFor(() => expect(withId.result.current.isSuccess).toBe(true))
    expect(financialReportsService.getProrrateoDetails).toHaveBeenCalledWith(7)
  })
})
