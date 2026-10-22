/**
 * PurchaseSuppliersBuyersPage — proveedores con sort server-side y ranking
 * de compradores. El documento del proveedor va como sublínea cuando existe.
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
import PurchaseSuppliersBuyersPage from '../purchase-analytics/PurchaseSuppliersBuyersPage'

const PERIOD = { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' }

const SUPPLIERS = {
  period: PERIOD,
  suppliers: [
    {
      supplier_id: 'KU0gZ9XDg',
      supplier_name: 'PROVEEDOR TEST',
      supplier_doc: '80001234-5',
      total_purchases: 275000,
      transaction_count: 2,
      average_order: 137500,
      last_purchase: '2026-10-06T10:45:47Z',
      first_purchase: '2026-10-01T08:00:00Z',
      rank: 1,
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
}

const BUYERS = {
  period: PERIOD,
  buyers: [
    {
      buyer_id: 'jJkV4F6HR',
      buyer_name: 'ADMINISTRADOR',
      total_purchases: 275000,
      transaction_count: 2,
      units_purchased: 40,
      average_order: 137500,
      rank: 1,
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
}

describe('PurchaseSuppliersBuyersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseAnalyticsService.getBySupplier).mockResolvedValue(
      envelope(SUPPLIERS) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByBuyer).mockResolvedValue(envelope(BUYERS) as never)
  })

  it('renderiza proveedores (con documento) y compradores del payload', async () => {
    renderPurchasePage(<PurchaseSuppliersBuyersPage />, {
      route: '/purchase-analytics/insights',
    })

    expect(await screen.findByTestId('purchase-suppliers-table')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-suppliers-table')).toHaveTextContent('PROVEEDOR TEST')
    expect(screen.getByTestId('purchase-suppliers-table')).toHaveTextContent('80001234-5')
    expect(screen.getByTestId('purchase-buyers-table')).toHaveTextContent('ADMINISTRADOR')
  })

  it('el sort de proveedores es server-side con sus tokens (amount)', async () => {
    const user = userEvent.setup()
    renderPurchasePage(<PurchaseSuppliersBuyersPage />, {
      route: '/purchase-analytics/insights',
    })

    await screen.findByTestId('purchase-suppliers-table')
    await user.click(screen.getByTestId('sort-supplier-amount'))
    await waitFor(() => {
      expect(purchaseAnalyticsService.getBySupplier).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'amount', sort_order: 'asc', page: 1 }),
      )
    })
  })

  it('proveedor sin documento no renderiza sublínea vacía; empty honesto sin datos', async () => {
    vi.mocked(purchaseAnalyticsService.getBySupplier).mockResolvedValue(
      envelope({
        ...SUPPLIERS,
        suppliers: [{ ...SUPPLIERS.suppliers[0], supplier_doc: '' }],
      }) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByBuyer).mockResolvedValue(
      envelope({ ...BUYERS, buyers: null }) as never,
    )
    renderPurchasePage(<PurchaseSuppliersBuyersPage />, {
      route: '/purchase-analytics/insights',
    })

    expect(await screen.findByTestId('purchase-suppliers-table')).toBeInTheDocument()
    expect(screen.queryByText('80001234-5')).toBeNull()
    expect(screen.getByTestId('purchase-buyers-table-empty')).toBeInTheDocument()
  })
})
