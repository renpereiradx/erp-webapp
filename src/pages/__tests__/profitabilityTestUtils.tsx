/**
 * Utilidades de los page tests de Rentabilidad (F6). No es un archivo de test
 * (no matchea `*.test.*`): provee el wrapper de router + react-query y el
 * envelope BI.
 */
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const profitabilityEnvelope = <T,>(
  data: T,
  metadata: Record<string, unknown> = {},
) => ({
  success: true,
  data,
  metadata,
})

export const renderProfitabilityPage = (
  ui: ReactElement,
  { route = '/profitability/dashboard' }: { route?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  )
}

export const PERIOD = {
  start_date: '2026-10-01T00:00:00-03:00',
  end_date: '2026-11-01T00:00:00-03:00',
  type: '',
}

export const productRow = (overrides: Record<string, unknown> = {}) => ({
  product_id: 'P-1',
  product_name: 'TABLET AMAZON FIRE HD 10',
  sku: '',
  category_id: '18',
  category_name: 'Electrónicos',
  units_sold: 1,
  revenue: 595000,
  cost: 425000,
  gross_profit: 170000,
  gross_margin_pct: 28.571428571428573,
  average_price: 595000,
  average_cost: 425000,
  markup: 40,
  contribution_pct: 41.41,
  profit_per_unit: 170000,
  rank: 1,
  performance: 'GOOD',
  ...overrides,
})

export const customerRow = (overrides: Record<string, unknown> = {}) => ({
  customer_id: 'CL-1',
  customer_name: 'Erika',
  customer_type: 'REGULAR',
  total_purchases: 2,
  total_revenue: 1374100,
  total_cost: 907000,
  gross_profit: 467100,
  gross_margin_pct: 33.99,
  average_ticket: 687050,
  average_profit_per_tx: 233550,
  contribution_pct: 88.05,
  first_purchase: '2026-10-01T12:37:51.607631Z',
  last_purchase: '2026-10-14T20:58:18.105431Z',
  days_since_last_purchase: 0,
  segment: 'PLATINUM',
  rank: 1,
  ...overrides,
})

export const categoryRow = (overrides: Record<string, unknown> = {}) => ({
  category_id: '18',
  category_name: 'Electrónicos',
  product_count: 2,
  units_sold: 2,
  revenue: 1050000,
  cost: 750000,
  gross_profit: 300000,
  gross_margin_pct: 28.57,
  contribution_pct: 56.55,
  average_markup: 40,
  revenue_share: 71.16,
  profit_share: 56.55,
  performance: 'GOOD',
  rank: 1,
  ...overrides,
})

export const sellerRow = (overrides: Record<string, unknown> = {}) => ({
  seller_id: 'jJkV4F6HR',
  seller_name: 'ADMINISTRADOR ADMINISTRADOR',
  total_sales: 6,
  total_revenue: 1475500,
  total_cost: 945000,
  gross_profit: 530500,
  gross_margin_pct: 35.95,
  average_ticket: 245916.67,
  contribution_pct: 100,
  rank: 1,
  ...overrides,
})

export const trendPoint = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-10-01T00:00:00Z',
  label: '01 Oct',
  revenue: 1254100,
  cost: 907000,
  gross_profit: 347100,
  gross_margin_pct: 27.677,
  net_profit: 347100,
  net_margin_pct: 27.677,
  transactions: 1,
  units_sold: 3,
  ...overrides,
})
