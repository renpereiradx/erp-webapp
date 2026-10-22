/**
 * PurchaseProductsCategoriesPage — tabla por categoría + productos con sort
 * server-side (aria-sort) y paginación. Sin columna SKU ni rank (drifts del
 * contrato documentados en el dominio).
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

vi.mock('@/services/bi/purchaseAnalyticsService', () => ({
  purchaseAnalyticsService: {
    getPerformance: vi.fn(),
    getTrends: vi.fn(),
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getBySupplier: vi.fn(),
    getByBuyer: vi.fn(),
    getByPaymentMethod: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
    getComparison: vi.fn(),
  },
}))

import { purchaseAnalyticsService } from '@/services/bi/purchaseAnalyticsService'
import { envelope, renderPurchasePage } from './purchaseAnalyticsTestUtils'
import PurchaseProductsCategoriesPage from '../purchase-analytics/PurchaseProductsCategoriesPage'

const CATEGORIES = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  categories: [
    {
      category_id: '33',
      category_name: 'MODA',
      purchases: 275000,
      percentage: 100,
      transactions: 2,
      units_purchased: 40,
      average_price: 55000,
      top_product: 'CAMISETA ADIDAS',
      top_product_purchases: 275000,
    },
  ],
  total_purchases: 275000,
}

const productsPage = (page: number) => ({
  period: CATEGORIES.period,
  products: [
    {
      product_id: 'Cc2y5JnvR',
      product_name: 'CAMISETA ADIDAS',
      sku: 'Cc2y5JnvR',
      category_name: 'MODA',
      purchases: 275000,
      units_purchased: 40,
      average_price: 55000,
      transactions: 2,
      last_purchase_date: '2026-10-06T10:45:47Z',
      rank: 1,
    },
  ],
  pagination: { page, page_size: 10, total_items: 22, total_pages: 3 },
})

describe('PurchaseProductsCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseAnalyticsService.getByCategory).mockResolvedValue(
      envelope(CATEGORIES) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByProduct).mockResolvedValue(
      envelope(productsPage(1)) as never,
    )
  })

  it('renderiza categorías y productos del payload', async () => {
    renderPurchasePage(<PurchaseProductsCategoriesPage />, {
      route: '/purchase-analytics/products-categories',
    })

    expect(await screen.findByTestId('purchase-categories-table')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-products-table')).toHaveTextContent('CAMISETA ADIDAS')
    // Sin columna SKU: el BE devuelve el id como `sku` (drift documentado).
    expect(screen.queryByText('Cc2y5JnvR')).toBeNull()
  })

  it('el sort de productos dispara request server-side y marca aria-sort', async () => {
    const user = userEvent.setup()
    renderPurchasePage(<PurchaseProductsCategoriesPage />, {
      route: '/purchase-analytics/products-categories',
    })

    await screen.findByTestId('purchase-products-table')

    await user.click(screen.getByTestId('sort-product-units'))
    await waitFor(() => {
      expect(purchaseAnalyticsService.getByProduct).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'units', sort_order: 'desc', page: 1 }),
      )
    })
    expect(
      screen.getByTestId('purchase-products-table').querySelector('th[aria-sort="descending"]'),
    ).toBeTruthy()
  })

  it('toggle del mismo campo invierte el orden y vuelve a página 1', async () => {
    const user = userEvent.setup()
    renderPurchasePage(<PurchaseProductsCategoriesPage />, {
      route: '/purchase-analytics/products-categories',
    })

    await screen.findByTestId('purchase-products-table')
    await user.click(screen.getByTestId('sort-product-units'))
    await waitFor(() => {
      expect(purchaseAnalyticsService.getByProduct).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'units', sort_order: 'desc' }),
      )
    })
    await user.click(screen.getByTestId('sort-product-units'))
    await waitFor(() => {
      expect(purchaseAnalyticsService.getByProduct).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'units', sort_order: 'asc', page: 1 }),
      )
    })
  })

  it('rango sin datos muestra el empty honesto de cada tabla', async () => {
    vi.mocked(purchaseAnalyticsService.getByCategory).mockResolvedValue(
      envelope({ ...CATEGORIES, categories: null }) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByProduct).mockResolvedValue(
      envelope({ ...productsPage(1), products: null, pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 1 } }) as never,
    )
    renderPurchasePage(<PurchaseProductsCategoriesPage />, {
      route: '/purchase-analytics/products-categories',
    })

    expect(await screen.findByTestId('purchase-categories-table-empty')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-products-table-empty')).toBeInTheDocument()
  })
})
