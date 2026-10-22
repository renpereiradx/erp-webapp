/**
 * BI-D10 — catálogos de categorías y tipos de entidad para los filtros del
 * registro. Se piden con `?distinct=true` (valores históricos incluidos); si
 * fallan, categorías cae al vocabulario del modelo y entity types a [].
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/auditService', () => ({
  auditService: { getCategories: vi.fn(), getEntityTypes: vi.fn() },
}))

import { auditService } from '@/services/bi/auditService'
import { useAuditCatalogs } from '../hooks/useAuditCatalogs'

const wrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('useAuditCatalogs (BI-D10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve los catálogos reales y descarta entradas sin code', async () => {
    vi.mocked(auditService.getCategories).mockResolvedValue(
      envelope([
        { code: 'SALE', name: 'Ventas' },
        { code: 'LEGACY', name: 'LEGACY' },
        { code: '', name: 'Inválida' },
      ]) as never,
    )
    vi.mocked(auditService.getEntityTypes).mockResolvedValue(
      envelope([
        { code: 'SALE', name: 'Venta' },
        { code: 'SALE_PAYMENTS', name: 'SALE_PAYMENTS' },
      ]) as never,
    )

    const { result } = renderHook(() => useAuditCatalogs(), {
      wrapper: wrapper(),
    })

    await waitFor(() =>
      expect(result.current.entityTypes).toHaveLength(2),
    )
    expect(result.current.categories).toEqual([
      { code: 'SALE', name: 'Ventas' },
      { code: 'LEGACY', name: 'LEGACY' },
    ])
    expect(result.current.entityTypes).toEqual([
      { code: 'SALE', name: 'Venta' },
      { code: 'SALE_PAYMENTS', name: 'SALE_PAYMENTS' },
    ])
  })

  it('degrada a vocabulario estático y lista vacía si los catálogos fallan', async () => {
    vi.mocked(auditService.getCategories).mockRejectedValue(new Error('down'))
    vi.mocked(auditService.getEntityTypes).mockRejectedValue(new Error('down'))

    const { result } = renderHook(() => useAuditCatalogs(), {
      wrapper: wrapper(),
    })

    await waitFor(() =>
      expect(auditService.getEntityTypes).toHaveBeenCalled(),
    )
    expect(result.current.categories).toEqual(
      expect.arrayContaining([{ code: 'LEGACY', name: 'LEGACY' }]),
    )
    expect(result.current.entityTypes).toEqual([])
  })
})
