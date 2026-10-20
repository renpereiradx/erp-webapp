/**
 * CustomerSellerInsightsPage (F4) — resumen de clientes y tablas de clientes /
 * vendedores. Sin churn, metas ni growth literales (eran fabricaciones de la
 * pantalla vieja).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

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
    getByCustomer: vi.fn(),
    getBySeller: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import CustomerSellerInsightsPage from '../sales-analytics/CustomerSellerInsightsPage'

const CUSTOMERS = {
  customers: [
    {
      customer_id: 'C-1',
      customer_name: 'Oscar Flores',
      customer_ruc: '',
      total_purchases: 616380,
      transaction_count: 3,
      average_ticket: 205460,
      last_purchase: '2026-09-16T12:00:00Z',
      first_purchase: '2026-09-01T12:00:00Z',
      frequency: 'FREQUENT',
      segment: 'VIP',
      growth_pct: 0,
      top_category: 'MODA',
      top_product: 'CAMISETA ADIDAS',
    },
  ],
  summary: {
    total_customers: 4,
    new_customers: 1,
    returning_customers: 3,
    average_lifetime_value: 1396995,
    top_customer_revenue: 2959728,
    customer_retention_rate: 75,
  },
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

const SELLERS = {
  sellers: [
    {
      seller_id: 'U-1',
      seller_name: 'ADMINISTRADOR ADMINISTRADOR',
      total_sales: 441260,
      transaction_count: 4,
      units_sold: 6,
      average_ticket: 110315,
      gross_margin: 132378,
      gross_margin_pct: 30,
      rank: 1,
      top_category: 'MODA',
    },
  ],
  rankings: { by_sales: [], by_transactions: [], by_margin: [] },
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
}

describe('CustomerSellerInsightsPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getByCustomer).mockResolvedValue(
      envelope(CUSTOMERS) as never,
    )
    vi.mocked(salesAnalyticsService.getBySeller).mockResolvedValue(
      envelope(SELLERS) as never,
    )
  })

  it('muestra el resumen real de clientes (retención y LTV del BE)', async () => {
    renderSalesPage(<CustomerSellerInsightsPage />)

    await waitFor(() =>
      expect(screen.getByTestId('customer-summary-total')).toHaveTextContent('4'),
    )
    expect(salesAnalyticsService.getByCustomer).toHaveBeenCalledWith({
      period: 'month',
      page: 1,
      page_size: 10,
    })
    expect(screen.getByTestId('customer-summary-new')).toHaveTextContent('1')
    expect(screen.getByTestId('customer-summary-returning')).toHaveTextContent('3')
    expect(screen.getByTestId('customer-summary-retention')).toHaveTextContent('75%')
    expect(screen.getByTestId('customer-summary-retention')).toHaveTextContent(
      'Recurrentes: 3',
    )
    expect(screen.getByTestId('customer-summary-ltv')).toHaveTextContent('Gs. 1.396.995')
    expect(screen.getByTestId('customer-summary-topCustomer')).toHaveTextContent(
      'Gs. 2.959.728',
    )
  })

  it('traduce frecuencia/segmento y no muestra códigos crudos', async () => {
    renderSalesPage(<CustomerSellerInsightsPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-customers-table')).toHaveTextContent('Oscar Flores'),
    )
    const table = screen.getByTestId('sales-customers-table')
    expect(table).toHaveTextContent('Frecuente')
    expect(table).toHaveTextContent('VIP')
    expect(table).toHaveTextContent('CAMISETA ADIDAS')
    expect(table).not.toHaveTextContent('FREQUENT')
    // RUC vacío → —, no una celda en blanco.
    expect(table).toHaveTextContent('—')
  })

  it('muestra el ranking de vendedores con su posición', async () => {
    renderSalesPage(<CustomerSellerInsightsPage />)

    await waitFor(() =>
      expect(screen.getByTestId('sales-sellers-table')).toHaveTextContent(
        'ADMINISTRADOR ADMINISTRADOR',
      ),
    )
    expect(screen.getByTestId('sales-sellers-table')).toHaveTextContent('Gs. 441.260')
    expect(screen.getByTestId('sales-sellers-table')).toHaveTextContent('30%')
  })

  it('no revive claims fabricados (churn, metas, growth literales)', async () => {
    renderSalesPage(<CustomerSellerInsightsPage />)

    await waitFor(() => expect(screen.getByTestId('sales-customers-table')).toBeInTheDocument())
    expect(screen.queryByText(/churn/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/meta/i)).not.toBeInTheDocument()
    expect(screen.queryByText('+12%')).not.toBeInTheDocument()
    expect(screen.queryByText('+15%')).not.toBeInTheDocument()
  })
})
