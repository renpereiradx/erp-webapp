import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProductSearch } from './useProductSearch'

// Mock en la frontera del módulo consumido (regla 2 de PLAN_TEST_DESIGN):
// el service, no internals del hook.
const searchAdvancedMock = vi.fn()
vi.mock('@/services/productService', () => ({
  productService: { searchAdvanced: (...args: unknown[]) => searchAdvancedMock(...args) },
}))
vi.mock('@/utils/ApiError', () => ({
  toApiError: (_err: unknown, fallback: string) => fallback,
}))

const ROWS = [
  { id: 'p1', name: 'Cemento Portland', sku: 'CEM-001', state: true, stock_quantity: 10 },
  { id: 'p2', name: 'Ladrillo hueco', sku: 'LAD-010', state: false, stock_quantity: 3 },
  { id: 'p3', name: 'Cemento bolsita', sku: 'CEM-002', stock_quantity: 0 },
]

const advanceDebounce = () => act(async () => { await vi.advanceTimersByTimeAsync(300) })

describe('useProductSearch (DESIGN.md §13 — hook canónico de búsqueda)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    searchAdvancedMock.mockReset()
    searchAdvancedMock.mockResolvedValue({ products: ROWS })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debouncea: no pide nada antes de 300ms y pide una sola vez al cumplirlos', async () => {
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('cemento'))
    expect(result.current.isSearching).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(299) })
    expect(searchAdvancedMock).not.toHaveBeenCalled()

    await advanceDebounce()
    expect(searchAdvancedMock).toHaveBeenCalledTimes(1)
    expect(searchAdvancedMock).toHaveBeenCalledWith(
      { search: 'cemento', granularity: 'variant', page: 1, page_size: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(result.current.results).toHaveLength(2) // la fila state:false se filtra
    expect(result.current.isSearching).toBe(false)
  })

  it('no dispara el request por debajo del mínimo de caracteres (2)', async () => {
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('c'))
    await advanceDebounce()

    expect(searchAdvancedMock).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  it('aborta el request anterior al re-tipear', async () => {
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('cem'))
    await advanceDebounce()
    const firstSignal = searchAdvancedMock.mock.calls[0][1].signal as AbortSignal

    act(() => result.current.search('cemento'))
    expect(firstSignal.aborted).toBe(true)

    await advanceDebounce()
    expect(searchAdvancedMock).toHaveBeenCalledTimes(2)
    expect(searchAdvancedMock.mock.calls[1][0].search).toBe('cemento')
  })

  it('guard de respuesta vieja: una respuesta tardía del término anterior no pisa los resultados', async () => {
    let resolveFirst!: (v: unknown) => void
    searchAdvancedMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce({ products: [{ id: 'p9', name: 'Cemento gris', sku: 'CEM-9' }] })

    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('cem'))
    await advanceDebounce()

    act(() => result.current.search('cemento'))
    await advanceDebounce()
    expect(result.current.results).toEqual([{ id: 'p9', name: 'Cemento gris', sku: 'CEM-9' }])

    // La respuesta vieja llega TARDE (el fetch mockeado no se entera del abort)
    await act(async () => { resolveFirst({ products: ROWS }) })
    expect(result.current.results).toEqual([{ id: 'p9', name: 'Cemento gris', sku: 'CEM-9' }])
  })

  it('clear() aborta lo pendiente y vacía resultados', async () => {
    let resolveSecond!: (v: unknown) => void
    searchAdvancedMock
      .mockResolvedValueOnce({ products: ROWS }) // llamada 1 ('cemento')
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveSecond = resolve }), // llamada 2 pendiente
      )
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('cemento'))
    await advanceDebounce()
    expect(result.current.results).toHaveLength(2)

    act(() => result.current.search('lad'))
    await advanceDebounce()
    const pendingSignal = searchAdvancedMock.mock.calls[1][1].signal as AbortSignal

    act(() => result.current.clear())
    void resolveSecond // la respuesta tardía de 'lad' no tiene adónde ir

    expect(pendingSignal.aborted).toBe(true)
    expect(result.current.results).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  it('error no-abort: vacía resultados y baja el spinner', async () => {
    searchAdvancedMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useProductSearch())

    act(() => result.current.search('cemento'))
    await advanceDebounce()

    expect(result.current.results).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })
})
