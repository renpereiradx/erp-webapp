/**
 * Utilidades de los page tests de Cuentas por Cobrar (F7). No es un archivo de
 * test (no matchea `*.test.*`): provee el wrapper de router + react-query, el
 * envelope BI y fixtures del contrato real.
 */
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const receivablesEnvelope = <T,>(
  data: T,
  metadata: Record<string, unknown> = {},
) => ({
  success: true,
  data,
  metadata,
})

export const renderReceivablesPage = (
  ui: ReactElement,
  { route = '/receivables', path }: { route?: string; path?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        {path ? (
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        ) : (
          ui
        )}
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

export const receivable = (overrides: Record<string, unknown> = {}) => ({
  id: 'SALE-1780338284-194',
  sale_order_id: 'SALE-1780338284-194',
  client_id: 'CL-ERIKA',
  client_name: 'Erika Maciel',
  sale_date: '2026-06-01T15:24:44.766356Z',
  due_date: '2026-07-01T15:24:44.766356Z',
  original_amount: 314600,
  paid_amount: 0,
  pending_amount: 314600,
  days_overdue: 111,
  status: 'OVERDUE',
  currency: 'PYG',
  ...overrides,
})

export const listSummary = (overrides: Record<string, unknown> = {}) => ({
  total_amount: 477890.38,
  total_pending: 315250.38,
  total_paid: 162640,
  item_count: 3,
  high_priority_count: 3,
  ...overrides,
})

export const receivablesList = (overrides: Record<string, unknown> = {}) => ({
  items: [receivable()],
  pagination: { page: 1, page_size: 10, total_items: 3, total_pages: 1 },
  summary: listSummary(),
  ...overrides,
})

export const overview = (overrides: Record<string, unknown> = {}) => ({
  total_pending: 315249.88,
  total_overdue: 315250.38,
  total_count: 3,
  overdue_count: 3,
  average_days_to_collect: 115.86206896551724,
  collection_rate: 93.75181450150714,
  currency: 'PYG',
  aging_summary: {
    current: { amount: 0, count: 0, percentage: 0 },
    days_30_60: { amount: 0, count: 0, percentage: 0 },
    days_60_90: { amount: 0, count: 0, percentage: 0 },
    over_90_days: { amount: 315250.38, count: 3, percentage: 100 },
  },
  ...overrides,
})

export const statistics = (overrides: Record<string, unknown> = {}) => ({
  period: '2026-10-01 - 2026-11-01',
  total_billed: 1475500,
  total_collected: 1475500,
  collection_rate: 100,
  average_dso: 0,
  overdue_percentage: 0,
  top_debtors: null,
  collection_trend: [
    { date: '2026-09-28', billed: 1254100, collected: 1254100, balance: 0 },
    { date: '2026-10-05', billed: 26000, collected: 26000, balance: 0 },
    { date: '2026-10-12', billed: 75400, collected: 117260, balance: -41860 },
    { date: '2026-11-02', billed: 0, collected: 0, balance: -41860 },
  ],
  ...overrides,
})

export const topDebtors = () => [
  {
    client_id: 'CL-ERIKA',
    client_name: 'Erika Maciel',
    total_pending: 314600,
    total_overdue: 314600,
    pending_count: 1,
    payment_behavior: 'POOR',
  },
  {
    client_id: 'CL-RENE',
    client_name: 'RENE PEREIRA',
    total_pending: 650.38,
    total_overdue: 650.38,
    pending_count: 2,
    payment_behavior: 'REGULAR',
  },
]

export const clientReceivables = (overrides: Record<string, unknown> = {}) => ({
  client_id: 'CL-ERIKA',
  client_name: 'Erika Maciel',
  total_pending: 314600,
  total_overdue: 314600,
  pending_count: 1,
  oldest_debt: '2026-06-01T15:24:44.766356Z',
  payment_behavior: 'EXCELLENT',
  average_days_to_pay: 0,
  receivables: [receivable()],
  ...overrides,
})

export const clientRisk = (overrides: Record<string, unknown> = {}) => ({
  client_id: 'CL-ERIKA',
  risk_level: 'HIGH',
  payment_behavior: 'EXCELLENT',
  total_pending_orders: 1,
  total_pending_amount: 314600,
  total_overdue_amount: 314600,
  total_over_90_amount: 314600,
  overdue_ratio: 1,
  max_days_overdue: 141,
  avg_days_outstanding: 141,
  avg_days_to_pay: 0,
  total_payments: 7,
  collection_rate: 286.900826446281,
  analyzed_at: '2026-10-20T20:52:34-03:00',
  ...overrides,
})

export const agingReport = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-20T20:51:46.532438506-03:00',
  summary: {
    current: { amount: 0, count: 0, percentage: 0 },
    days_30_60: { amount: 0, count: 0, percentage: 0 },
    days_60_90: { amount: 0, count: 0, percentage: 0 },
    over_90_days: { amount: 315250.38, count: 3, percentage: 100 },
  },
  by_client: [
    {
      client_id: 'CL-ERIKA',
      client_name: 'Erika Maciel',
      current: 0,
      days_30_60: 0,
      days_60_90: 0,
      over_90_days: 314600,
      total: 314600,
    },
    {
      client_id: 'CL-RENE',
      client_name: 'RENE PEREIRA',
      current: 0,
      days_30_60: 0,
      days_60_90: 0,
      over_90_days: 650.38,
      total: 650.38,
    },
  ],
  total_amount: 315250.38,
  total_clients: 2,
  ...overrides,
})
