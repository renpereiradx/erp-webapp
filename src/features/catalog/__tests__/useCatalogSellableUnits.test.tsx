/**
 * useCatalogSellableUnits (PLAN_BUSQUEDA_VARIANTES_PLANAS F2) — contrato:
 *
 * - Pide POST /products/search/advanced con `granularity: "variant"` y mapea
 *   cada fila a CatalogSellableUnit (variant_id, is_base_row, sku,
 *   variant_name).
 * - `useCatalogProducts` (modo producto) NO envía granularity: cero
 *   regresión para catálogo/facets.
 *
 * Mock en la frontera: productService (regla §2 del plan de tests).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/productService', () => ({
  productService: {
    searchAdvanced: vi.fn(),
  },
}))

import { productService } from '@/services/productService'
import { useCatalogProducts, useCatalogSellableUnits } from '../hooks/useCatalogProducts'
import { DEFAULT_CATALOG_FILTERS } from '../types'

const searchAdvanced = vi.mocked(productService.searchAdvanced)

const rawVariantResponse = {
  products: [
    {
      id: 'prod_1',
      variant_id: 'var_roj',
      is_base_row: false,
      name: 'Camisa Oxford',
      variant_name: 'Rojo / M',
      sku: 'CAM-ROJ-M',
      barcode: '123',
      base_unit: 'unit',
      current_price: 150000,
      stock_quantity: 7,
      stock_status: 'in_stock',
      has_variant: true,
      variant_count: 2,
      state: true,
      variant_attributes: { color: 'rojo' },
    },
    {
      id: 'prod_1',
      variant_id: null,
      is_base_row: true,
      name: 'Camisa Oxford',
      current_price: 120000,
      stock_quantity: 3,
      stock_status: 'medium_stock',
      has_variant: true,
      variant_count: 2,
      state: true,
    },
  ],
  total_count: 2,
  page: 1,
  page_size: 12,
  total_pages: 1,
}

function renderUnitHook(search = '') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(() => useCatalogSellableUnits(search, DEFAULT_CATALOG_FILTERS, 1), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCatalogSellableUnits', () => {
  it('pide granularity=variant y mapea las filas planas', async () => {
    searchAdvanced.mockResolvedValue(rawVariantResponse)
    const { result } = renderUnitHook('camisa')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(searchAdvanced).toHaveBeenCalledWith(
      expect.objectContaining({ granularity: 'variant', search: 'camisa', page: 1 })
    )

    const { products, total } = result.current.data!
    expect(total).toBe(2)
    expect(products).toHaveLength(2)

    const [variantRow, baseRow] = products
    expect(variantRow.variant_id).toBe('var_roj')
    expect(variantRow.is_base_row).toBe(false)
    expect(variantRow.sku).toBe('CAM-ROJ-M')
    expect(variantRow.variant_name).toBe('Rojo / M')
    expect(variantRow.current_price).toBe(150000)
    expect(variantRow.name).toBe('Camisa Oxford')

    expect(baseRow.variant_id).toBeNull()
    expect(baseRow.is_base_row).toBe(true)
    expect(baseRow.sku).toBeNull()
  })

  it('arranca sin término (search undefined) y pagina contra el mismo endpoint', async () => {
    searchAdvanced.mockResolvedValue({ ...rawVariantResponse, total_count: 0, products: [] })
    const { result } = renderUnitHook('')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(searchAdvanced).toHaveBeenCalledWith(
      expect.objectContaining({ granularity: 'variant', search: undefined })
    )
    expect(result.current.data?.products).toEqual([])
  })
})

describe('useCatalogProducts (modo producto, regresión)', () => {
  it('NO envía granularity', async () => {
    searchAdvanced.mockResolvedValue({ ...rawVariantResponse, products: [] })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useCatalogProducts('', DEFAULT_CATALOG_FILTERS, 1), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(searchAdvanced).toHaveBeenCalledTimes(1)
    const payload = searchAdvanced.mock.calls[0][0] as Record<string, unknown>
    expect(payload.granularity).toBeUndefined()
  })
})
