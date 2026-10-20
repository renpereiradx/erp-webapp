/**
 * Hook de datos de los drill-downs relacionales (F3): contrato de params,
 * draft-vs-aplicado, sort whitelist, paginación server-side, rango de fechas
 * inválido y aislamiento de placeholder entre entidades.
 */
import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDrilldownQuery } from '../hooks/useDrilldownQuery'
import type { DrilldownFetcher } from '../hooks/useDrilldownQuery'
import type { ProductBuyerRow } from '@/domain/relational-analytics/types'

const envelope = (rows: ProductBuyerRow[], total = rows.length, excluded = 0) => ({
  success: true,
  data: { rows, total, page: 1, page_size: 10, excluded_other_currency: excluded },
})

const ROW: ProductBuyerRow = {
  client_id: 'CLI-1',
  client_name: 'Maria Gomez',
  client_doc: '1234567',
  purchases: 3,
  units: 9,
  total: 1_500_000,
  avg_unit_price: 166_667,
  last_purchase_at: '2026-09-20T12:00:00Z',
}

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const renderDrilldown = (
  fetcher: DrilldownFetcher<ProductBuyerRow>,
  entityId: string | null = 'PRD-1',
) =>
  renderHook(
    ({ id }: { id: string | null }) =>
      useDrilldownQuery<ProductBuyerRow>({
        endpoint: 'product-buyers',
        entityId: id,
        fetcher,
        defaultSort: '-total',
      }),
    { initialProps: { id: entityId }, wrapper: createWrapper() },
  )

describe('useDrilldownQuery', () => {
  let fetcher: Mock<DrilldownFetcher<ProductBuyerRow>>

  beforeEach(() => {
    fetcher = vi.fn<DrilldownFetcher<ProductBuyerRow>>().mockResolvedValue(envelope([ROW], 12))
  })

  it('sin entidad no fetcha y devuelve una vista vacía', () => {
    const { result } = renderDrilldown(fetcher, null)
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.view.rows).toEqual([])
    expect(result.current.view.totalPages).toBe(1)
    expect(result.current.isLoading).toBe(false)
  })

  it('con entidad fetcha el sort default y normaliza la vista', async () => {
    const { result } = renderDrilldown(fetcher)

    await waitFor(() => expect(result.current.view.rows).toHaveLength(1))
    expect(fetcher).toHaveBeenCalledWith(
      'PRD-1',
      expect.objectContaining({ sort: '-total', page: 1, page_size: 10 }),
    )
    expect(result.current.view.total).toBe(12)
    expect(result.current.view.totalPages).toBe(2)
    expect(result.current.view.rows[0]?.client_name).toBe('Maria Gomez')
  })

  it('tipear la búsqueda no fetcha; applyFilters aplica el término y resetea página', async () => {
    const { result } = renderDrilldown(fetcher)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => result.current.setQDraft('  gomez  '))
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => result.current.applyFilters())
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ q: 'gomez', page: 1 }),
      ),
    )
  })

  it('toggleSort alterna el campo activo y usa la dirección natural en uno nuevo', async () => {
    const { result } = renderDrilldown(fetcher)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => result.current.toggleSort('total'))
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ sort: '+total', page: 1 }),
      ),
    )

    act(() => result.current.toggleSort('client_name'))
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ sort: '+client_name' }),
      ),
    )
  })

  it('cambiar de página refetchea con page=2', async () => {
    const { result } = renderDrilldown(fetcher)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => result.current.setPage(2))
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('un rango invertido bloquea la query y expone dateRangeInvalid', async () => {
    const { result } = renderDrilldown(fetcher)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.setDateFrom('2026-09-30')
      result.current.setDateTo('2026-09-01')
    })

    await waitFor(() => expect(result.current.dateRangeInvalid).toBe(true))
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('clearFilters limpia draft, aplicado y fechas', async () => {
    const { result } = renderDrilldown(fetcher)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.setQDraft('gomez')
      result.current.applyFilters()
      result.current.setDateFrom('2026-09-01')
    })
    await waitFor(() => expect(result.current.hasActiveFilters).toBe(true))

    act(() => result.current.clearFilters())
    await waitFor(() => expect(result.current.hasActiveFilters).toBe(false))
    expect(result.current.qDraft).toBe('')
    expect(result.current.q).toBe('')
    expect(result.current.dateFrom).toBe('')
    expect(result.current.dateTo).toBe('')
  })

  it('un envelope sin data es un error, no una tabla vacía silenciosa', async () => {
    const broken = vi
      .fn<DrilldownFetcher<ProductBuyerRow>>()
      .mockResolvedValue({ success: true } as never)
    const { result } = renderDrilldown(broken)

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.isLoading).toBe(false)
  })

  it('al cambiar de entidad no muestra las filas de la entidad anterior', async () => {
    type FetchResult = Awaited<ReturnType<DrilldownFetcher<ProductBuyerRow>>>
    let resolveSecond: (value: FetchResult) => void = () => {}
    const switching = vi
      .fn<DrilldownFetcher<ProductBuyerRow>>()
      .mockResolvedValueOnce(envelope([ROW]))
      .mockImplementationOnce(
        () => new Promise<FetchResult>((resolve) => {
          resolveSecond = resolve
        }),
      )

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) =>
        useDrilldownQuery<ProductBuyerRow>({
          endpoint: 'product-buyers',
          entityId: id,
          fetcher: switching,
          defaultSort: '-total',
        }),
      { initialProps: { id: 'PRD-1' }, wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.view.rows).toHaveLength(1))

    rerender({ id: 'PRD-2' })
    await waitFor(() => expect(switching).toHaveBeenCalledTimes(2))
    expect(result.current.view.rows).toEqual([])

    await act(async () => {
      resolveSecond(
        envelope([{ ...ROW, client_id: 'CLI-2', client_name: 'Otro Cliente' }]),
      )
    })
    await waitFor(() => expect(result.current.view.rows[0]?.client_name).toBe('Otro Cliente'))
  })
})
