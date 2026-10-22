/**
 * PurchaseDashboardPage (PLAN_ANALITICA_COMPRAS) — KPIs con comparación real,
 * hints de pendientes/moneda excluida, serie, mix de pagos y topes de
 * categorías/proveedores contra `/purchase-analytics/*`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

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
import PurchaseDashboardPage from '../purchase-analytics/PurchaseDashboardPage'

const PERFORMANCE = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  total_purchases: 275000,
  total_transactions: 2,
  average_order: 137500,
  total_units: 40,
  unique_suppliers: 1,
  pending_orders: 1,
  pending_amount: 50000,
  excluded_other_currency: 2,
  comparison: {
    previous_period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    purchases_change: 75000,
    purchases_change_pct: 37.5,
    transactions_change: 1,
    transactions_change_pct: 100,
    order_change: -12500,
    order_change_pct: -8.3,
  },
}

const TRENDS = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-10-06T10:45:47Z',
      label: '06 Oct',
      purchases: 275000,
      transactions: 2,
      units: 40,
      average_order: 137500,
    },
  ],
  summary: {
    trend_direction: 'UP',
    growth_rate: 175,
    peak_period: '06 Oct',
    peak_value: 275000,
    low_period: '06 Oct',
    low_value: 275000,
    volatility: 0,
  },
}

const PAYMENT = {
  period: PERFORMANCE.period,
  payment_methods: [
    {
      method: 'CREDIT_CARD',
      display_name: 'Tarjeta de Crédito',
      purchases: 275000,
      percentage: 100,
      transaction_count: 2,
      average_order: 137500,
    },
  ],
  total_purchases: 275000,
}

const CATEGORIES = {
  period: PERFORMANCE.period,
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

const SUPPLIERS = {
  period: PERFORMANCE.period,
  suppliers: [
    {
      supplier_id: 'KU0gZ9XDg',
      supplier_name: 'PROVEEDOR TEST',
      supplier_doc: '8000',
      total_purchases: 275000,
      transaction_count: 2,
      average_order: 137500,
      last_purchase: '2026-10-06T10:45:47Z',
      first_purchase: '2026-10-06T10:45:47Z',
      rank: 1,
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
}

describe('PurchaseDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseAnalyticsService.getPerformance).mockResolvedValue(
      envelope(PERFORMANCE) as never,
    )
    vi.mocked(purchaseAnalyticsService.getTrends).mockResolvedValue(envelope(TRENDS) as never)
    vi.mocked(purchaseAnalyticsService.getByPaymentMethod).mockResolvedValue(
      envelope(PAYMENT) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByCategory).mockResolvedValue(
      envelope(CATEGORIES) as never,
    )
    vi.mocked(purchaseAnalyticsService.getBySupplier).mockResolvedValue(
      envelope(SUPPLIERS) as never,
    )
  })

  it('muestra los KPIs del payload con el crecimiento real de la comparación', async () => {
    renderPurchasePage(<PurchaseDashboardPage />, { route: '/purchase-analytics/dashboard' })

    expect(await screen.findByTestId('purchase-kpis')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-kpi-purchases')).toHaveTextContent('275.000')
    expect(screen.getByTestId('purchase-kpi-orders')).toHaveTextContent('2')
    expect(screen.getByTestId('purchase-kpi-avgOrder')).toHaveTextContent('137.500')
    // Chip solo para métricas con comparación del BE.
    expect(screen.getByTestId('purchase-kpi-purchases')).toHaveTextContent('37,5%')
  })

  it('expone pendientes y compras excluidas por moneda como hints, fuera del total', async () => {
    renderPurchasePage(<PurchaseDashboardPage />, { route: '/purchase-analytics/dashboard' })

    expect(await screen.findByTestId('purchase-kpis')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-kpi-suppliers')).toHaveTextContent('Pendientes: 1')
    expect(screen.getByTestId('purchase-excluded-currency')).toHaveTextContent(
      'Se excluyen 2 compras',
    )
  })

  it('renderiza serie, mix de pagos, top categorías y top proveedores', async () => {
    renderPurchasePage(<PurchaseDashboardPage />, { route: '/purchase-analytics/dashboard' })

    expect(await screen.findByTestId('purchase-trend-summary')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-payment-mix')).toHaveTextContent('Tarjeta de Crédito')
    expect(screen.getByTestId('purchase-top-categories')).toHaveTextContent('MODA')
    expect(screen.getByTestId('purchase-top-suppliers')).toHaveTextContent('PROVEEDOR TEST')
  })

  it('sin exclusiones de moneda no muestra el aviso', async () => {
    vi.mocked(purchaseAnalyticsService.getPerformance).mockResolvedValue(
      envelope({ ...PERFORMANCE, excluded_other_currency: 0 }) as never,
    )
    renderPurchasePage(<PurchaseDashboardPage />, { route: '/purchase-analytics/dashboard' })

    expect(await screen.findByTestId('purchase-kpis')).toBeInTheDocument()
    expect(screen.queryByTestId('purchase-excluded-currency')).toBeNull()
  })
})
