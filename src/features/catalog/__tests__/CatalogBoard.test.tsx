/**
 * CatalogBoard (PLAN_CATALOGO_VENDEDOR 3.3; filas planas:
 * PLAN_BUSQUEDA_VARIANTES_PLANAS F4) — contrato UI:
 *
 * - Renderiza precio de venta (P.V.P.) y datos no sensibles; NUNCA texto de
 *   costo/margen (el catálogo no los consume ni antes ni después del strip
 *   server-side).
 * - Cada unidad vendible es su propia tarjeta: variantes con precio y stock
 *   propio, sin N+1 (getEnrichedVariants/getStockSummary ya no participan).
 * - Búsqueda con debounce contra /products/search/advanced; filtros de
 *   categoría/marca; paginación prev/next.
 * - Estados de datos obligatorios (DESIGN.md §6.7): skeleton, error con
 *   retry, empty.
 *
 * Mocks en la frontera: productService, categoryService, brandService e
 * i18n (firma real, fallback español). lucide-react NO se mockea
 * (PLAN_TEST_DESIGN_FRONTEND).
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

import { productService } from '@/services/productService'
import { CatalogBoard } from '../components/CatalogBoard'
import type { CatalogSellableUnit } from '../types'

const searchAdvanced = vi.mocked(productService.searchAdvanced)

/** Fila plana (granularity=variant) de una unidad vendible. */
const unit = (overrides: Partial<CatalogSellableUnit>): CatalogSellableUnit => ({
  id: 'p1',
  variant_id: null,
  is_base_row: false,
  name: 'Harina 000',
  variant_name: null,
  sku: null,
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

const advancedResponse = (products: CatalogSellableUnit[]) => ({
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
  searchAdvanced.mockResolvedValue(advancedResponse([unit({})]))
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

  it('muestra cada variante como tarjeta propia con precio y stock de la unidad (sin N+1)', async () => {
    searchAdvanced.mockResolvedValue(
      advancedResponse([
        unit({ id: 'p1', variant_id: null, is_base_row: true, name: 'Camisa Oxford', stock_quantity: 3, stock_status: 'medium_stock' }),
        unit({ id: 'p1', variant_id: 'var-rojo', is_base_row: false, name: 'Camisa Oxford', variant_name: 'Rojo / M', sku: 'CAM-ROJ-M', current_price: 16000, stock_quantity: 7 }),
        unit({ id: 'p1', variant_id: 'var-azul', is_base_row: false, name: 'Camisa Oxford', variant_name: 'Azul / L', sku: 'CAM-AZL-L', current_price: 15500, stock_quantity: 0, stock_status: 'out_of_stock' }),
      ])
    )
    renderBoard()

    // Tres tarjetas: base + 2 variantes, cada testid distinto pese a
    // compartir producto padre.
    expect(await screen.findByTestId('catalog-card-p1')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-card-var-rojo')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-card-var-azul')).toBeInTheDocument()

    // Precio y stock son los de CADA unidad (no el agregado del padre).
    expect(screen.getByTestId('catalog-price-var-rojo')).toHaveTextContent('16.000')
    expect(screen.getByTestId('catalog-card-var-rojo')).toHaveTextContent('Stock: 7 kg')
    expect(screen.getByTestId('catalog-card-var-azul')).toHaveTextContent('Sin stock')
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

  it('pagina con prev/next', async () => {
    const user = userEvent.setup()
    searchAdvanced.mockResolvedValue({
      products: [unit({})] as unknown as Array<Record<string, unknown>>,
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
