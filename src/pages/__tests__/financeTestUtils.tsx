/**
 * Utilidades de los page tests de Reportes Financieros (F9). No es un archivo
 * de test: provee el wrapper router + react-query, el envelope BI y fixtures
 * con la forma real de `/financial-reports/*`.
 */
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const financeEnvelope = <T,>(data: T, metadata: Record<string, unknown> = {}) => ({
  success: true,
  data,
  metadata,
})

export const renderFinancePage = (
  ui: ReactElement,
  { route = '/dashboard/financial-summary', path }: { route?: string; path?: string } = {},
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

export const period = () => ({
  start_date: '2026-10-01T00:00:00-03:00',
  end_date: '2026-11-01T00:00:00-03:00',
  type: 'custom',
})

export const overview = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  revenue: 1475500,
  expenses: 275000,
  net_income: 1200500,
  cash_position: 337260,
  receivables: 315250.38,
  payables: 3110450,
  working_capital: 10919160.38,
  key_ratios: {
    current_ratio: 4.510476098313749,
    quick_ratio: 0.20978005754794324,
    gross_margin: 81.36225008471705,
    net_margin: 81.36225008471705,
    dso: 0,
    dpo: 0,
    inventory_turnover: 0,
    asset_turnover: 0,
  },
  ...overrides,
})

export const health = (overrides: Record<string, unknown> = {}) => ({
  score: 95,
  rating: 'EXCELLENT',
  current_ratio: 4.510476098313749,
  quick_ratio: 0.20978005754794324,
  net_margin: 81.36225008471705,
  working_capital: 10919160.38,
  period_start: '2026-10-01T00:00:00-03:00',
  period_end: '2026-11-01T00:00:00-03:00',
  ...overrides,
})

export const incomeStatement = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  revenue: {
    gross_sales: 1475500,
    returns: 0,
    discounts: 0,
    net_sales: 1475500,
    by_category: [
      { category_id: '18', category_name: 'Electrónicos', amount: 1050000, percentage: 71.16 },
      { category_id: '1', category_name: 'Alquiler de Canchas', amount: 211000, percentage: 14.3 },
    ],
    by_payment_method: [{ method: 'unknown', amount: 1475500, percentage: 100 }],
  },
  cost_of_sales: {
    beginning_inventory: 0,
    purchases: 275000,
    purchase_returns: 0,
    ending_inventory: 13377100,
    cost_of_goods_sold: 945000,
  },
  gross_profit: { amount: 530500, margin: 35.95391392748221, percentage: 35.95391392748221 },
  expenses: {
    operating: 0,
    salaries: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    other: 0,
    total: 0,
    by_category: [],
  },
  operating_income: 530500,
  other_income: 0,
  other_expenses: 0,
  net_income: 530500,
  ...overrides,
})

export const cashFlow = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  beginning_cash: 337260,
  operating_activities: {
    cash_from_sales: 1475500,
    cash_from_receivables: 41860,
    cash_paid_to_suppliers: 275000,
    cash_paid_for_expenses: 0,
    cash_paid_for_salaries: 0,
    other_operating: 0,
    net_operating_cash_flow: 1242360,
  },
  investing_activities: {
    equipment_purchases: 0,
    equipment_sales: 0,
    other_investing: 0,
    net_investing_cash_flow: 0,
  },
  financing_activities: {
    loan_proceeds: 0,
    loan_payments: 0,
    owner_contributions: 0,
    owner_withdrawals: 0,
    other_financing: 0,
    net_financing_cash_flow: 0,
  },
  ending_cash: 1579620,
  net_cash_change: 1242360,
  daily_breakdown: [
    { date: '2026-10-06', inflows: 0, outflows: 275000, net_flow: -275000, balance: 62260 },
    { date: '2026-10-01', inflows: 1254100, outflows: 0, net_flow: 1254100, balance: 1591360 },
    { date: '2026-10-14', inflows: 117260, outflows: 0, net_flow: 117260, balance: 1521020 },
    { date: '2026-10-05', inflows: 26000, outflows: 0, net_flow: 26000, balance: 1617360 },
    { date: '2026-10-20', inflows: 120000, outflows: 0, net_flow: 120000, balance: 1579620 },
  ],
  ...overrides,
})

export const vat = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  sales_vat: {
    gross_sales_10: 425500,
    vat_10: 38681.82,
    gross_sales_5: 1050000,
    vat_5: 50000,
    exempt_sales: 0,
    total_gross_sales: 1475500,
    total_vat_debito: 88681.82,
    transaction_count: 6,
  },
  purchases_vat: {
    gross_purchases_10: 275000,
    vat_10: 25000,
    gross_purchases_5: 0,
    vat_5: 0,
    exempt_purchases: 0,
    total_gross_purchases: 275000,
    total_vat_credito: 25000,
    transaction_count: 1,
  },
  vat_balance: {
    vat_debito: 88681.82,
    vat_credito: 25000,
    vat_payable: 63681.82,
    credit_carryover: 0,
    status: 'TO_PAY',
  },
  monthly_breakdown: [
    { month: '2026-10-01T00:00:00Z', vat_debito: 88681.82, vat_credito: 25000, balance: 63681.82, status: 'TO_PAY' },
  ],
  ...overrides,
})

export const taxSummary = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  vat_summary: { total_debito: 88681.82, total_credito: 25000, net_vat: 63681.82, credit_balance: 0 },
  retentions_summary: { retained_by_others: 0, retained_to_others: 0, net_retentions: 0 },
  total_tax_liability: 63681.82,
  total_tax_credits: 0,
  net_tax_position: 63681.82,
  monthly_detail: [
    { month: '2026-10-01T00:00:00Z', vat_debito: 88681.82, vat_credito: 25000, net_vat: 63681.82, retentions: 0, total_liability: 63681.82 },
  ],
  ...overrides,
})

export const salesLedger = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  summary: {
    total_transactions: 6,
    total_gross: 1475500,
    total_vat_10: 38681.82,
    total_vat_5: 50000,
    total_exempt: 0,
    total_net: 1386818.18,
  },
  entries: [
    {
      date: '2026-10-20T08:25:46Z',
      invoice_number: '',
      timbrado: '',
      client_ruc: '8000',
      client_name: 'Erika Maciel',
      gross_amount: 120000,
      vat_10: 10909.09,
      vat_5: 0,
      exempt: 0,
      net_amount: 109090.91,
      payment_method: '',
      payment_status: 'PAID',
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 6, total_pages: 1 },
  ...overrides,
})

export const purchaseLedger = (overrides: Record<string, unknown> = {}) => ({
  period: period(),
  summary: {
    total_transactions: 1,
    total_gross: 275000,
    total_vat_10: 25000,
    total_vat_5: 0,
    total_exempt: 0,
    total_net: 250000,
  },
  entries: [
    {
      date: '2026-10-06T10:45:47Z',
      invoice_number: '',
      timbrado: '',
      supplier_ruc: '8000',
      supplier_name: 'PROVEEDOR TEST',
      gross_amount: 275000,
      vat_10: 25000,
      vat_5: 0,
      exempt: 0,
      net_amount: 250000,
      payment_status: 'COMPLETED',
      expense_category: '',
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
  ...overrides,
})

export const prorrateoHistory = () => [
  {
    id: 1,
    period_start: '2026-10-01T00:00:00Z',
    period_end: '2026-11-01T00:00:00Z',
    total_taxable_sales: 1000,
    total_exempt_sales: 100,
    total_sales: 1100,
    deducibility_coefficient: 0.909,
    total_vat_credit: 1000,
    deductible_vat_credit: 909,
    non_deductible_vat_credit: 91,
    status: 'PROCESSED',
    created_at: '2026-11-02T00:00:00Z',
    updated_at: '2026-11-02T00:00:00Z',
  },
]

export const prorrateoDetails = () => [
  {
    id: 10,
    prorrateo_period_id: 1,
    purchase_order_id: 42,
    original_vat_credit: 1000,
    deductible_portion: 909,
    non_deductible_portion: 91,
    allocation_type: 'INDIRECT',
    notes: 'prorrateo',
    created_at: '2026-11-02T00:00:00Z',
  },
]
