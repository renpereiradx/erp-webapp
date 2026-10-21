/**
 * Utilidades de los page tests de Cuentas por Pagar (F8). No es un archivo de
 * test (no matchea `*.test.*`): provee el wrapper de router + react-query, el
 * envelope BI y fixtures del contrato real (`models/payables.go`).
 */
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const payablesEnvelope = <T,>(
  data: T,
  metadata: Record<string, unknown> = {},
) => ({
  success: true,
  data,
  metadata,
})

export const renderPayablesPage = (
  ui: ReactElement,
  { route = '/dashboard/payables', path }: { route?: string; path?: string } = {},
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

export const payable = (overrides: Record<string, unknown> = {}) => ({
  id: 'PO-2',
  purchase_order_id: 'PO-2',
  supplier_id: 'SP-PROTEK',
  supplier_name: 'Protek PRO',
  purchase_date: '2026-01-12T10:00:00Z',
  due_date: '2026-02-11T10:00:00Z',
  original_amount: 500000,
  paid_amount: 0,
  pending_amount: 500000,
  days_until_due: 0,
  days_overdue: 281,
  status: 'OVERDUE',
  priority: 'URGENT',
  currency: 'PYG',
  ...overrides,
})

export const listSummary = (overrides: Record<string, unknown> = {}) => ({
  total_amount: 6014250,
  total_pending: 6014250,
  total_paid: 0,
  item_count: 1,
  ...overrides,
})

export const payablesList = (overrides: Record<string, unknown> = {}) => ({
  items: [payable()],
  pagination: { page: 1, page_size: 10, total_items: 3, total_pages: 1 },
  summary: listSummary(),
  ...overrides,
})

export const overview = (overrides: Record<string, unknown> = {}) => ({
  total_pending: 6014250,
  total_overdue: 6014250,
  total_count: 17,
  overdue_count: 17,
  due_this_week: 0,
  due_this_month: 0,
  average_days_to_pay: 14.75,
  payment_rate: 71.87,
  currency: 'PYG',
  aging_summary: {
    current: { amount: 0, count: 0, percentage: 0 },
    days_30_60: { amount: 1000, count: 1, percentage: 0.02 },
    days_60_90: { amount: 2903800, count: 6, percentage: 45.27 },
    over_90_days: { amount: 3509450, count: 11, percentage: 54.71 },
  },
  ...overrides,
})

export const statistics = (overrides: Record<string, unknown> = {}) => ({
  period: '2026-10-01 - 2026-11-01',
  total_purchased: 1475500,
  total_paid: 1000000,
  payment_rate: 67.77,
  average_dpo: 12.5,
  overdue_percentage: 40,
  top_suppliers: null,
  payment_trend: [
    { date: '2026-09-28', purchased: 1254100, paid: 0, balance: 1254100 },
    { date: '2026-10-05', purchased: 26000, paid: 1000000, balance: 280100 },
  ],
  ...overrides,
})

export const schedule = (overrides: Record<string, unknown> = {}) => ({
  start_date: '2026-10-20',
  end_date: '2026-11-19',
  total_due: 500000,
  // El BE entrega el array desde un map (orden no garantizado).
  schedule: [
    {
      date: '2026-11-02',
      day_of_week: 'Lunes',
      total_due: 500000,
      item_count: 1,
      items: [
        {
          payable_id: 'PO-2',
          supplier_name: 'Protek PRO',
          amount: 500000,
          priority: 'HIGH',
          days_until_due: 13,
        },
      ],
    },
    {
      date: '2026-10-25',
      day_of_week: 'Domingo',
      total_due: 250000,
      item_count: 1,
      items: [
        {
          payable_id: 'PO-1',
          supplier_name: 'BodyTech',
          amount: 250000,
          priority: 'MEDIUM',
          days_until_due: 5,
        },
      ],
    },
  ],
  ...overrides,
})

export const topSuppliers = () => [
  {
    supplier_id: 'SP-PROTEK',
    supplier_name: 'Protek PRO',
    total_pending: 500000,
    total_overdue: 500000,
    pending_count: 1,
    payment_history: 'POOR',
  },
]

export const agingReport = (overrides: Record<string, unknown> = {}) => ({
  generated_at: '2026-10-20T22:00:00-03:00',
  summary: {
    current: { amount: 0, count: 0, percentage: 0 },
    days_30_60: { amount: 1000, count: 1, percentage: 0.02 },
    days_60_90: { amount: 2903800, count: 6, percentage: 45.27 },
    over_90_days: { amount: 3509450, count: 11, percentage: 54.71 },
  },
  by_supplier: [
    {
      supplier_id: 'SP-BODY',
      supplier_name: 'BodyTech',
      current: 0,
      days_30_60: 0,
      days_60_90: 0,
      over_90_days: 3009450,
      total: 3009450,
    },
    {
      supplier_id: 'SP-TEST',
      supplier_name: 'TEST SUPPLIER',
      current: 0,
      days_30_60: 0,
      days_60_90: 2903800,
      over_90_days: 0,
      total: 2903800,
    },
    {
      supplier_id: 'SP-PROTEK',
      supplier_name: 'Protek PRO',
      current: 0,
      days_30_60: 0,
      days_60_90: 0,
      over_90_days: 500000,
      total: 500000,
    },
    {
      supplier_id: 'SP-CODE',
      supplier_name: 'CodeDynamic',
      current: 0,
      days_30_60: 1000,
      days_60_90: 0,
      over_90_days: 0,
      total: 1000,
    },
  ],
  total_amount: 6414250,
  total_suppliers: 4,
  ...overrides,
})

export const cashFlow = (overrides: Record<string, unknown> = {}) => ({
  period: '30 days',
  expected_inflows: 616380,
  expected_outflows: 1000,
  net_cash_flow: 615380,
  cumulative_flow: 615380,
  projection_days: [
    {
      date: '2026-10-21',
      inflows: 0,
      outflows: 1000,
      net_flow: -1000,
      cumulative_flow: -1000,
    },
    {
      date: '2026-10-22',
      inflows: 616380,
      outflows: 0,
      net_flow: 616380,
      cumulative_flow: 615380,
    },
  ],
  ...overrides,
})

export const supplierAnalysis = (overrides: Record<string, unknown> = {}) => ({
  supplier_id: 'SP-PROTEK',
  supplier_name: 'Protek PRO',
  total_pending: 500000,
  total_overdue: 500000,
  pending_count: 1,
  payment_history: 'EXCELLENT',
  avg_days_to_pay: 14.75,
  share_percentage: 8.31,
  importance: 'MEDIUM',
  credit_terms: 30,
  oldest_debt: '2026-01-12T10:00:00Z',
  ...overrides,
})
