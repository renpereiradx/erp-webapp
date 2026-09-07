/**
 * CatalogBoard (PLAN_CATALOGO_VENDEDOR 3.3) — contrato UI:
 *
 * - Renderiza precio de venta (P.V.P.) y datos no sensibles; NUNCA texto de
 *   costo/margen (el catálogo no los consume ni antes ni después del strip
 *   server-side).
 * - Búsqueda con debounce contra /products/search/advanced; filtros de
 *   categoría/marca; paginación prev/next.
 * - Estados de datos obligatorios (DESIGN.md §6.7): skeleton, error con
 *   retry, empty.
 *
 * Mocks en la frontera: productService, categoryService, brandService,
 * variantService e i18n (firma real, fallback español). lucide-react NO se
 * mockea (PLAN_TEST_DESIGN_FRONTEND).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/services/productService', () => ({
  productService: {
    searchAdvanced: vi.fn(),
  },
}))

vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, name: 'Bebidas', is_active: true },
      { id: 2, name: 'Limpieza', is_active: true },
    ]),
  },
}))

vi.mock('@/services/brandService', () => ({
  brandService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 7, name: 'Acme', is_active: true },
    ]),
  },
}))

vi.mock('@/services/variantService', () => ({
  variantService: {
    getVariantsByProductId: vi.fn(),
  },
}))

import { productService } from '@/services/productService'
import { variantService } from '@/services/variantService'
import { CatalogBoard } from '../components/CatalogBoard'
import type { CatalogProduct } from '../types'

const searchAdvanced = vi.mocked(productService.searchAdvanced)
const getVariantsByProductId = vi.mocked(variantService.getVariantsByProductId)

const card = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  id: 'p1',
  name: 'Harina 000',
  barcode: '7501234567890',
  base_unit: 'kg',
  current_price: 15000,
  stock_quantity: 42,
  stock_status: 'in_stock',
  brand_name: 'Acme',
  category_name: 'Bebidas',
  has_variant: false,
  variant_count: 0,
  image_url: null,
  state: true,
  ...overrides,
})

const advancedResponse = (products: CatalogProduct[]) => ({
  products: products as unknown as Array<Record<string, unknown>>,
  total_count: products.length,
  page: 1,
  page_size: 12,
  total_pages: 1,
})

function renderBoard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CatalogBoard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  searchAdvanced.mockResolvedValue(advancedResponse([card({})]))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CatalogBoard', () => {
  it('renderiza la tarjeta con nombre y precio de venta, sin costo', async () => {
    renderBoard()

    expect(await screen.findByTestId('catalog-card-p1')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-price-p1')).toHaveTextContent('15.000')

    // Ni rastro de datos de costo en la página completa.
    expect(screen.queryByText(/costo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/margen/i)).not.toBeInTheDocument()
  })

  it('consulta la búsqueda avanzada con paginación y orden por nombre', async () => {
    renderBoard()

    await waitFor(() => expect(searchAdvanced).toHaveBeenCalled())
    expect(searchAdvanced).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'name_asc', page: 1, page_size: 12 })
    )
  })

  it('debouncea el término de búsqueda antes de consultar', async () => {
    const user = userEvent.setup()
    renderBoard()
    await screen.findByTestId('catalog-card-p1')

    searchAdvanced.mockClear()
    await user.type(screen.getByTestId('catalog-search'), 'ha')
    // Sin esperar el debounce no se disparó ninguna consulta nueva.
    expect(searchAdvanced).not.toHaveBeenCalled()

    await waitFor(
      () => expect(searchAdvanced).toHaveBeenCalled(),
      { timeout: 1500 }
    )
    expect(searchAdvanced).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'ha' })
    )
  })

  it('muestra el estado vacío cuando no hay resultados', async () => {
    searchAdvanced.mockResolvedValue(
      advancedResponse([]) as unknown as { products: Array<Record<string, unknown>> }
    )
    renderBoard()

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })

  it('muestra ErrorState con reintento cuando la consulta falla', async () => {
    searchAdvanced.mockRejectedValue(new Error('boom'))
    renderBoard()

    expect(await screen.findByTestId('error-state')).toBeInTheDocument()
  })

  it('expande variantes bajo demanda', async () => {
    const user = userEvent.setup()
    getVariantsByProductId.mockResolvedValue([
      {
        id: 'v1',
        parent_product_id: 'p1',
        sku: 'HAR-1KG',
        variant_name: 'Paquete 1kg',
        variant_attributes: {},
        is_active: true,
        display_order: 0,
        stock_quantity: 10,
        current_price: 16000,
        created_at: '',
        updated_at: '',
      },
    ])
    searchAdvanced.mockResolvedValue(
      advancedResponse([card({ has_variant: true, variant_count: 1 })])
    )
    renderBoard()

    await screen.findByTestId('catalog-card-p1')
    // Las variantes no se piden hasta expandir la tarjeta.
    expect(getVariantsByProductId).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /variantes/i }))
    expect(await screen.findByTestId('catalog-variants-p1')).toHaveTextContent('Paquete 1kg')
    expect(getVariantsByProductId).toHaveBeenCalledWith('p1', false)
  })

  it('pagina con prev/next', async () => {
    const user = userEvent.setup()
    searchAdvanced.mockResolvedValue({
      products: [card({})] as unknown as Array<Record<string, unknown>>,
      total_count: 24,
      page: 1,
      page_size: 12,
      total_pages: 2,
    })
    renderBoard()
    await screen.findByTestId('catalog-card-p1')

    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await waitFor(() =>
      expect(searchAdvanced).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    )
  })
})
