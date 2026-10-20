/**
 * ProductsCategoriesPage (F4) — desglose por categoría, rankings reales y tabla
 * de productos con orden/paginación server-side (whitelist del BE).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: {
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getTopBottomProducts: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import ProductsCategoriesPage from '../sales-analytics/ProductsCategoriesPage'

const product = (overrides: Record<string, unknown>) => ({
  product_id: 'P-1',
  product_name: 'CAMISETA ADIDAS',
  sku: 'P-1',
  category_name: 'MODA',
  sales: 134770,
  units_sold: 2,
  average_price: 67385,
  cost: 52300,
  gross_profit: 82470,
  gross_margin_pct: 61.2,
  transactions: 2,
  last_sale_date: '2026-09-16T12:00:00Z',
  rank: 1,
  growth_pct: 0,
  ...overrides,
})

const CATEGORIES = {
  categories: [
    {
      category_id: '1',
      category_name: 'MODA',
      sales: 192170,
      percentage: 34.82854864433812,
      transactions: 3,
      units_sold: 4,
      average_price: 48042.5,
      gross_margin: 60000,
      gross_margin_pct: 31.2,
      growth: 0,
      growth_pct: 0,
      top_product: 'CAMISETA ADIDAS',
      top_product_sales: 134770,
    },
  ],
  total_sales: 551760,
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

const RANKS = {
  top_sellers: [product({ product_id: 'P-1', product_name: 'CAMISETA ADIDAS' })],
  top_by_margin: [product({ product_id: 'P-2', product_name: 'BUZO PUMA', gross_margin_pct: 72.5 })],
  bottom_sellers: [product({ product_id: 'P-3', product_name: 'GORRA NIKE' })],
  top_by_volume: [],
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

const PRODUCTS = {
  products: [
    product({}),
    product({ product_id: 'P-2', product_name: 'BUZO PUMA', sales: 95000, rank: 2 }),
  ],
  pagination: { page: 1, page_size: 10, total_items: 12, total_pages: 2 },
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

describe('ProductsCategoriesPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getByCategory).mockResolvedValue(
      envelope(CATEGORIES) as never,
    )
    vi.mocked(salesAnalyticsService.getTopBottomProducts).mockResolvedValue(
      envelope(RANKS) as never,
    )
    vi.mocked(salesAnalyticsService.getByProduct).mockResolvedValue(
      envelope(PRODUCTS) as never,
    )
  })

  it('muestra categorías con participación y el total del BE', async () => {
    renderSalesPage(<ProductsCategoriesPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-category-table')).toHaveTextContent('MODA'),
    )
    expect(salesAnalyticsService.getByCategory).toHaveBeenCalledWith({ period: 'month' })
    expect(screen.getByTestId('sales-category-table')).toHaveTextContent('Gs. 192.170')
    expect(screen.getByTestId('sales-category-table')).toHaveTextContent('34,8%')
    // Floats de 14 decimales prohibidos.
    expect(screen.getByTestId('sales-category-table')).not.toHaveTextContent('34.828548')
    expect(screen.getByText(/Total por categoría/)).toHaveTextContent('Gs. 551.760')
  })

  it('renderiza los 3 rankings reales sin "crecimiento 0%"', async () => {
    renderSalesPage(<ProductsCategoriesPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-rank-top-list')).toHaveTextContent('CAMISETA ADIDAS'),
    )
    expect(screen.getByTestId('sales-rank-margin-list')).toHaveTextContent('BUZO PUMA')
    expect(screen.getByTestId('sales-rank-bottom-list')).toHaveTextContent('GORRA NIKE')
    expect(screen.queryByText(/Crecimiento/i)).not.toBeInTheDocument()
  })

  it('lista productos con paginación server-side de 10 filas', async () => {
    const user = userEvent.setup()
    renderSalesPage(<ProductsCategoriesPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-products-table')).toHaveTextContent('CAMISETA ADIDAS'),
    )
    expect(salesAnalyticsService.getByProduct).toHaveBeenCalledWith({
      period: 'month',
      page: 1,
      page_size: 10,
      sort_by: 'sales',
      sort_order: 'desc',
    })

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(salesAnalyticsService.getByProduct).toHaveBeenLastCalledWith({
        period: 'month',
        page: 2,
        page_size: 10,
        sort_by: 'sales',
        sort_order: 'desc',
      }),
    )
  })

  it('ordenar por una columna usa la whitelist del BE y vuelve a la página 1', async () => {
    const user = userEvent.setup()
    renderSalesPage(<ProductsCategoriesPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-products-table')).toHaveTextContent('CAMISETA ADIDAS'),
    )

    // Mismo campo activo (sales desc) → invierte a asc.
    await user.click(screen.getByRole('button', { name: /Ventas: ordenar/ }))
    await waitFor(() =>
      expect(salesAnalyticsService.getByProduct).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, sort_by: 'sales', sort_order: 'asc' }),
      ),
    )

    // Campo nuevo → orden natural descendente.
    await user.click(screen.getByRole('button', { name: /Margen %: ordenar/ }))
    await waitFor(() =>
      expect(salesAnalyticsService.getByProduct).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'margin', sort_order: 'desc' }),
      ),
    )
  })
})
