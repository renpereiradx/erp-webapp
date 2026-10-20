/**
 * DashboardKpisPage (F2) — los 5 grupos de `/dashboard/kpis` con su unidad
 * real (monto / % / ratio / días / conteo). No existe "Índice de Salud" ni
 * "Exceso Stock": eran métricas inventadas por la UI vieja.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

vi.mock('@/services/bi/dashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
    getKPIs: vi.fn(),
    getTrends: vi.fn(),
    getAlerts: vi.fn(),
    getRecentActivity: vi.fn(),
    getTopProducts: vi.fn(),
    getSalesHeatmap: vi.fn(),
  },
}))

import { dashboardService } from '@/services/bi/dashboardService'
import DashboardKpisPage from '../dashboard/DashboardKpisPage'

const KPIS = {
  sales_kpis: {
    average_ticket: 68970,
    sales_per_day: 1.2,
    conversion_rate: 0,
    repeat_customer_rate: 12.5,
  },
  inventory_kpis: {
    turnover_rate: 0.0137,
    days_of_inventory: 2192.78,
    stockout_rate: 4.2,
  },
  financial_kpis: { gross_margin: 43.26, net_margin: 42.68, operating_expense_ratio: 0.58 },
  customer_kpis: {
    new_customers: 0,
    active_customers: 3,
    total_customers: 40,
    average_purchase_frequency: 1.5,
  },
  budget_kpis: {
    budget_to_sale_conversion: 25,
    average_budget_value: 150000,
    expired_budgets: 2,
  },
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DashboardKpisPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('DashboardKpisPage (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getKPIs).mockResolvedValue(envelope(KPIS) as never)
  })

  it('renderiza los 5 grupos con la unidad correcta', async () => {
    renderPage()

    expect(await screen.findByText('KPIs y rendimiento')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-kpi-group-sales')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-kpi-group-inventory')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-kpi-group-financial')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-kpi-group-customer')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-kpi-group-budget')).toBeInTheDocument()

    expect(screen.getByText('Gs. 68.970')).toBeInTheDocument() // ticket = monto
    expect(screen.getByText('43,3%')).toBeInTheDocument() // margen = %
    expect(screen.getByText('2.192,8 días')).toBeInTheDocument() // días
    expect(screen.getByText('0,01x')).toBeInTheDocument() // rotación = ratio
    expect(screen.getByText('0,6%')).toBeInTheDocument() // gasto operativo = %
  })

  it('no inventa "Índice de Salud" ni "Exceso Stock"', async () => {
    renderPage()
    await screen.findByText('KPIs y rendimiento')

    expect(screen.queryByText(/índice de salud/i)).toBeNull()
    expect(screen.queryByText(/exceso stock/i)).toBeNull()
    expect(screen.queryByText(/región/i)).toBeNull()
    expect(screen.queryByText(/moneda/i)).toBeNull()
  })

  it('refetchea con el período elegido', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(dashboardService.getKPIs).toHaveBeenCalledWith({ period: 'month' }))
    await user.click(screen.getByRole('tab', { name: 'Hoy' }))

    await waitFor(() =>
      expect(dashboardService.getKPIs).toHaveBeenLastCalledWith({ period: 'today' }),
    )
  })

  it('muestra error con retry si el endpoint falla', async () => {
    vi.mocked(dashboardService.getKPIs).mockRejectedValue(new Error('sin datos'))
    renderPage()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()
    expect(screen.getByTestId('error-retry')).toBeInTheDocument()
  })
})
