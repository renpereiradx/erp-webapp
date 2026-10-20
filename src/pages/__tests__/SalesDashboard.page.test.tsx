/**
 * SalesDashboardPage (F4) — KPIs reales (performance con comparación), serie,
 * mix de pagos y topes de productos/categorías contra `/sales-analytics/*`.
 * Verifica que no revivan los chips "+0%" ni la etiqueta cruda "unknown".
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
    getPerformance: vi.fn(),
    getDashboard: vi.fn(),
    getTrends: vi.fn(),
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getTopBottomProducts: vi.fn(),
    getByCustomer: vi.fn(),
    getBySeller: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
    getVelocity: vi.fn(),
    getComparison: vi.fn(),
    getDiscounts: vi.fn(),
    getDiscountsSummary: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import SalesDashboardPage from '../sales-analytics/SalesDashboardPage'

const PERFORMANCE = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  total_sales: 551760,
  total_transactions: 8,
  average_ticket: 68970,
  total_units: 15,
  unique_customers: 4,
  gross_margin: 289260,
  gross_margin_pct: 56.17659852109613,
  returns: { total_returns: 0, return_count: 0, return_rate: 0 },
  comparison: {
    previous_period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    sales_change: 240260,
    sales_change_pct: 77.1,
    transactions_change: 3,
    transactions_change_pct: 60,
    ticket_change: -116224,
    ticket_change_pct: -62.7,
  },
}

const TRENDS = {
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-09-14T12:00:00Z',
      label: '14 Sep',
      sales: 301150,
      transactions: 3,
      units: 8,
      average_ticket: 100383.33,
    },
    {
      timestamp: '2026-09-16T12:00:00Z',
      label: '16 Sep',
      sales: 250610,
      transactions: 5,
      units: 7,
      average_ticket: 50122,
    },
  ],
  summary: {
    trend_direction: 'DOWN',
    growth_rate: -16.78,
    peak_period: '14 Sep',
    peak_value: 301150,
    low_period: '16 Sep',
    low_value: 250610,
    volatility: 0,
  },
}

const DASHBOARD = {
  top_products: [
    {
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
    },
  ],
  top_categories: [
    {
      category_id: '1',
      category_name: 'MODA',
      sales: 192170,
      transactions: 3,
      units_sold: 4,
    },
  ],
  payment_mix: [
    {
      method: 'unknown',
      display_name: 'unknown',
      sales: 551760,
      percentage: 100,
      transaction_count: 8,
      average_ticket: 68970,
      growth_pct: 0,
    },
  ],
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

describe('SalesDashboardPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getPerformance).mockResolvedValue(
      envelope(PERFORMANCE) as never,
    )
    vi.mocked(salesAnalyticsService.getTrends).mockResolvedValue(envelope(TRENDS) as never)
    vi.mocked(salesAnalyticsService.getDashboard).mockResolvedValue(
      envelope(DASHBOARD) as never,
    )
  })

  it('muestra los KPIs reales del período con su comparación', async () => {
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() => expect(screen.getByTestId('kpi-sales')).toHaveTextContent('Gs. 551.760'))
    expect(salesAnalyticsService.getPerformance).toHaveBeenCalledWith({
      period: 'month',
      compare: true,
    })

    expect(screen.getByTestId('kpi-transactions')).toHaveTextContent('8')
    expect(screen.getByTestId('kpi-ticket')).toHaveTextContent('Gs. 68.970')
    expect(screen.getByTestId('kpi-units')).toHaveTextContent('15')
    expect(screen.getByTestId('kpi-customers')).toHaveTextContent('4')
    expect(screen.getByTestId('kpi-margin')).toHaveTextContent('56,2%')
    expect(screen.getByTestId('kpi-margin')).toHaveTextContent('Utilidad bruta: Gs. 289.260')
    expect(screen.getByLabelText('Tendencia al alza: 77,1%')).toBeInTheDocument()
  })

  it('renderiza la serie del período y su resumen sin chips inventados', async () => {
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() => expect(screen.getByTestId('sales-trend-summary')).toBeInTheDocument())
    expect(screen.getByTestId('sales-trend-summary')).toHaveTextContent('Tendencia a la baja')
    expect(screen.getByTestId('sales-trend-summary')).toHaveTextContent('-16,8%')
    expect(screen.getAllByText('Gs. 301.150').length).toBeGreaterThan(0)
    expect(screen.queryByText('+0%')).not.toBeInTheDocument()
    expect(screen.queryByText(/en tiempo real/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })

  it('el mix de pagos rotula las ventas sin método, no el código "unknown"', async () => {
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-payment-mix')).toHaveTextContent(
        'Sin método registrado',
      ),
    )
    expect(screen.getByTestId('sales-payment-mix')).toHaveTextContent(
      'Ventas sin método de pago asociado: 8',
    )
    expect(screen.getByTestId('sales-payment-mix')).not.toHaveTextContent(/^unknown/)
  })

  it('lista el top de productos y categorías del BE', async () => {
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() =>
      expect(screen.getByTestId('dashboard-top-products-table')).toHaveTextContent(
        'CAMISETA ADIDAS',
      ),
    )
    expect(screen.getByTestId('dashboard-top-categories-table')).toHaveTextContent('MODA')
    expect(screen.getByText('Ver todos')).toBeInTheDocument()
  })

  it('cambiar el período refetchea con la granularidad correcta', async () => {
    const user = userEvent.setup()
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() => expect(salesAnalyticsService.getTrends).toHaveBeenCalled())
    await user.click(screen.getByRole('tab', { name: 'Este año' }))

    await waitFor(() =>
      expect(salesAnalyticsService.getTrends).toHaveBeenLastCalledWith({
        period: 'year',
        granularity: 'monthly',
      }),
    )
    expect(salesAnalyticsService.getDashboard).toHaveBeenLastCalledWith({ period: 'year' })
  })

  it('muestra el error honesto con reintento cuando falla el BE', async () => {
    vi.mocked(salesAnalyticsService.getPerformance).mockRejectedValue(new Error('boom'))
    renderSalesPage(<SalesDashboardPage />)

    await waitFor(() =>
      expect(screen.getByText('No se pudieron cargar los datos')).toBeInTheDocument(),
    )
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
