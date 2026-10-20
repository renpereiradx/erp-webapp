/**
 * Contexto de cabecera del drill-down (F3): nombre resuelto contra el
 * endpoint Core de la entidad, variante aparte y fallback honesto al id
 * cuando la resolución falla (la query BI no depende de esto).
 */
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import productService from '@/services/productService'
import clientService from '@/services/clientService'
import { variantService } from '@/services/variantService'
import { useDrilldownEntity } from '../hooks/useDrilldownEntity'

vi.mock('@/services/productService', () => ({ default: { getById: vi.fn() } }))
vi.mock('@/services/clientService', () => ({ default: { getById: vi.fn() } }))
vi.mock('@/services/supplierService', () => ({ default: { getById: vi.fn() } }))
vi.mock('@/services/variantService', () => ({ variantService: { getVariantById: vi.fn() } }))

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useDrilldownEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resuelve producto + variante y expone nombre, referencia y variante', async () => {
    vi.mocked(productService.getById).mockResolvedValue({
      name: 'CAMISETA ADIDAS',
      barcode: '7791',
    } as never)
    vi.mocked(variantService.getVariantById).mockResolvedValue({
      variant_name: 'Rojo M',
    } as never)

    const { result } = renderHook(() => useDrilldownEntity('product', 'PRD-1', 'VAR-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.display.label).toBe('CAMISETA ADIDAS'))
    expect(result.current.display.sub).toBe('7791')
    expect(result.current.variantLabel).toBe('Rojo M')
    expect(variantService.getVariantById).toHaveBeenCalledWith('VAR-1')
  })

  it('resuelve parties por nombre completo y documento', async () => {
    vi.mocked(clientService.getById).mockResolvedValue({
      first_name: 'Maria',
      last_name: 'Gomez',
      document_id: '1234567',
    } as never)

    const { result } = renderHook(() => useDrilldownEntity('client', 'CLI-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.display.label).toBe('Maria Gomez'))
    expect(result.current.display.sub).toBe('1234567')
    expect(result.current.variantLabel).toBeNull()
  })

  it('cae al id de la URL cuando la resolución falla', async () => {
    vi.mocked(productService.getById).mockRejectedValue(new Error('403'))

    const { result } = renderHook(() => useDrilldownEntity('product', 'PRD-9'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(productService.getById).toHaveBeenCalledWith('PRD-9'))
    expect(result.current.display).toEqual({ label: 'PRD-9' })
  })

  it('sin entidad no llama a ningún service', () => {
    const { result } = renderHook(() => useDrilldownEntity('supplier', null), {
      wrapper: createWrapper(),
    })
    expect(result.current.display.label).toBe('')
    expect(productService.getById).not.toHaveBeenCalled()
    expect(clientService.getById).not.toHaveBeenCalled()
  })
})
