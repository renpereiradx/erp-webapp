/**
 * DashboardPage (F2) — Resumen Ejecutivo contra `/dashboard/summary`,
 * `/dashboard/trends`, `/dashboard/alerts`, `/dashboard/recent-activity` y
 * `/dashboard/top-products`. Verifica datos reales del envelope, estados y
 * que no revivan claims fabricados ("EN VIVO").
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
import DashboardPage from '../dashboard/DashboardPage'

const SUMMARY = {
  sales: { total: 551760, count: 8, average_ticket: 68970, currency: 'PYG' },
  purchases: { total: 262500, count: 3, currency: 'PYG' },
  profit: { gross: 289260, margin_percentage: 52.4 },
  inventory: {
    total_products: 23,
    low_stock_count: 4,
    out_of_stock_count: 1,
    total_value: 22881350,
  },
  cash_registers: { open_count: 1, total_balance: 386360 },
  receivables: { total_pending: 1917772, overdue_count: 13 },
  payables: { total_pending: 6414250, due_this_week: 1200000 },
  reserves: { today_count: 2, pending_confirmation: 1 },
}

const TRENDS = {
  sales: { current: 551760, previous: 311500, change_amount: 240260, change_percentage: 77.1, trend: 'up' },
  purchases: { current: 262500, previous: 135850, change_amount: 126650, change_percentage: 93.2, trend: 'up' },
  gross_margin: { current: 52.4, previous: 48.1, change_amount: 4.3, change_percentage: 8.9, trend: 'up' },
  average_ticket: { current: 68970, previous: 62250, change_amount: 6720, change_percentage: 10.8, trend: 'up' },
  customer_count: { current: 8, previous: 5, change_amount: 3, change_percentage: 60, trend: 'up' },
}

const ALERTS = {
  alerts: [
    {
      id: 'alert_oos_1',
      category: 'inventory',
      severity: 'critical',
      title: 'Stock agotado',
      message: '1 productos sin stock disponible',
      details: { products: [{ id: 'P-1', name: 'CAMISETA ADIDAS' }] },
      created_at: '2026-10-20T12:00:00Z',
    },
  ],
  summary: { total: 1, by_severity: { critical: 1 }, by_category: { inventory: 1 } },
}

const ACTIVITY = {
  activities: [
    {
      id: 'SALE-1',
      type: 'sale',
      description: 'Venta #SALE-1 · Cliente',
      amount: 66780,
      user: 'Oscar Flores',
      timestamp: '2026-10-20T12:30:00Z',
    },
  ],
}

const TOP_PRODUCTS = {
  products: [
    {
      id: 'P-1',
      name: 'CAMISETA ADIDAS',
      category: 'MODA',
      quantity_sold: 2,
      revenue: 134770,
      profit: 82470,
      margin_percentage: 61.2,
      trend: 'down',
      trend_percentage: -63.017946,
    },
  ],
  total_revenue: 134770,
  total_profit: 82470,
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('DashboardPage (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getSummary).mockResolvedValue(envelope(SUMMARY) as never)
    vi.mocked(dashboardService.getTrends).mockResolvedValue(envelope(TRENDS) as never)
    vi.mocked(dashboardService.getAlerts).mockResolvedValue(envelope(ALERTS) as never)
    vi.mocked(dashboardService.getRecentActivity).mockResolvedValue(envelope(ACTIVITY) as never)
    vi.mocked(dashboardService.getTopProducts).mockResolvedValue(envelope(TOP_PRODUCTS) as never)
  })

  it('renderiza montos, tendencias, alertas, actividad y top desde la API', async () => {
    renderPage()

    expect(await screen.findByText('Resumen ejecutivo')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-kpi-sales')).toHaveTextContent('Gs. 551.760')
    expect(screen.getByTestId('dashboard-kpi-purchases')).toHaveTextContent('Gs. 262.500')
    expect(screen.getByTestId('dashboard-kpi-profit')).toHaveTextContent('Gs. 289.260')
    expect(screen.getByTestId('dashboard-kpi-inventory')).toHaveTextContent('Gs. 22.881.350')

    // Tendencia real (77,1%) en la card de ventas y en la tabla comparativa.
    expect((await screen.findAllByText('77,1%')).length).toBeGreaterThan(0)

    expect(await screen.findByText('Stock agotado')).toBeInTheDocument()
    expect(await screen.findByText('Venta #SALE-1 · Cliente')).toBeInTheDocument()
    // El producto aparece en la alerta de stock y en el preview del top.
    expect((await screen.findAllByText('CAMISETA ADIDAS')).length).toBeGreaterThan(0)
  })

  it('consulta el período del store y refetchea al cambiarlo', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(dashboardService.getSummary).toHaveBeenCalledWith({ period: 'month' }))

    await user.click(screen.getByRole('tab', { name: 'Este año' }))

    await waitFor(() =>
      expect(dashboardService.getSummary).toHaveBeenLastCalledWith({ period: 'year' }),
    )
    expect(dashboardService.getTrends).toHaveBeenLastCalledWith({ period: 'year' })
  })

  it('no revive claims fabricados de la auditoría 2026-09', async () => {
    renderPage()
    await screen.findByText('Resumen ejecutivo')

    expect(screen.queryByText(/en vivo/i)).toBeNull()
    expect(screen.queryByText(/tiempo real/i)).toBeNull()
    expect(screen.queryByText(/objetivo/i)).toBeNull()
  })

  it('muestra el error y permite reintentar si falla el summary', async () => {
    vi.mocked(dashboardService.getSummary).mockRejectedValue(new Error('boom'))
    renderPage()

    // Summary alimenta dos secciones (cards + operación): ambos muestran error.
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('boom').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })
})
