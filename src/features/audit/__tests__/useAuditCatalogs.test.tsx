/**
 * BI-D10 — catálogo de tipos de entidad para el filtro del registro.
 * El catálogo es opcional: si falla, el filtro queda solo con "Todos" y el
 * registro sigue funcionando.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/bi/auditService', () => ({
  auditService: { getEntityTypes: vi.fn() },
}))

import { auditService } from '@/services/bi/auditService'
import { useAuditEntityTypes } from '../hooks/useAuditCatalogs'

const wrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuditEntityTypes (BI-D10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve el catálogo real y descarta entradas sin code', async () => {
    vi.mocked(auditService.getEntityTypes).mockResolvedValue({
      success: true,
      data: [
        { code: 'SALE', name: 'Venta' },
        { code: '', name: 'Inválida' },
      ],
      metadata: {},
    } as never)

    const { result } = renderHook(() => useAuditEntityTypes(), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current).toEqual([{ code: 'SALE', name: 'Venta' }])
  })

  it('degrada a lista vacía si el catálogo falla', async () => {
    vi.mocked(auditService.getEntityTypes).mockRejectedValue(new Error('down'))

    const { result } = renderHook(() => useAuditEntityTypes(), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(auditService.getEntityTypes).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })
})
