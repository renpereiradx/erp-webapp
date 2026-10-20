/**
 * AlertsPage (F2) — bandeja de `/dashboard/alerts`: severidades, filtros
 * client-side y detalle real (count/total/products). Cierra las affordances
 * muertas de la auditoría 2026-09: sin "Marcar leído", "Silenciar" ni "Ver
 * Reporte"; "Gestionar" solo aparece para destinos que existen (F5 re-activó
 * stock-levels y F6 /profitability/products).
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
import AlertsPage from '../dashboard/AlertsPage'

const ALERTS = {
  alerts: [
    {
      id: 'alert_oos_1',
      category: 'inventory',
      severity: 'critical',
      title: 'Stock agotado',
      message: '3 productos sin stock disponible',
      details: { products: [{ id: 'P-1', name: 'CAMISETA ADIDAS' }] },
      action_url: '/inventory-analytics/stock-levels',
      created_at: '2026-10-20T12:00:00Z',
    },
    {
      id: 'alert_overdue_1',
      category: 'financial',
      severity: 'warning',
      title: 'Pagos vencidos',
      message: '13 cuentas por cobrar vencidas',
      details: { count: 13, total: 1917772 },
      action_url: '/receivables/overdue',
      created_at: '2026-10-20T12:00:00Z',
    },
    {
      id: 'alert_budgets_1',
      category: 'sales',
      severity: 'info',
      title: 'Presupuestos por vencer',
      message: '2 presupuestos vencen en los próximos 3 días',
      details: { count: 2 },
      action_url: '/comercial/presupuestos',
      created_at: '2026-10-20T12:00:00Z',
    },
  ],
  summary: {
    total: 3,
    by_severity: { critical: 1, warning: 1, info: 1 },
    by_category: { inventory: 1, financial: 1, sales: 1 },
  },
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AlertsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('AlertsPage (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getAlerts).mockResolvedValue(envelope(ALERTS) as never)
  })

  it('renderiza contadores y las 3 alertas con su detalle real', async () => {
    renderPage()

    expect(await screen.findByText('Alertas de negocio')).toBeInTheDocument()
    expect(await screen.findByTestId('alerts-kpi-total')).toHaveTextContent('3')
    expect(screen.getByTestId('alerts-kpi-critical')).toHaveTextContent('1')
    expect(screen.getByTestId('alerts-kpi-warning')).toHaveTextContent('1')
    expect(screen.getByTestId('alerts-kpi-info')).toHaveTextContent('1')

    expect(screen.getByText('Stock agotado')).toBeInTheDocument()
    expect(screen.getByText('Pagos vencidos')).toBeInTheDocument()
    expect(screen.getByText('Presupuestos por vencer')).toBeInTheDocument()
    expect(screen.getByText('Afectados: 13')).toBeInTheDocument()
    expect(screen.getByText('Saldo pendiente: Gs. 1.917.772')).toBeInTheDocument()
    expect(screen.getByText('CAMISETA ADIDAS')).toBeInTheDocument()
  })

  it('re-activa "Gestionar" de margen negativo hacia /profitability/products (F6)', async () => {
    vi.mocked(dashboardService.getAlerts).mockResolvedValue(
      envelope({
        alerts: [
          {
            id: 'alert_negative_margin_1',
            category: 'financial',
            severity: 'warning',
            title: 'Margen negativo',
            message: '2 productos venden por debajo del costo',
            details: { count: 2 },
            action_url: '/profitability/products',
            created_at: '2026-10-20T12:00:00Z',
          },
        ],
        summary: {
          total: 1,
          by_severity: { warning: 1 },
          by_category: { financial: 1 },
        },
      }) as never,
    )
    renderPage()

    const link = await screen.findByRole('link', { name: 'Gestionar' })
    expect(link).toHaveAttribute('href', '/profitability/products')
  })

  it('solo enlaza "Gestionar" cuando el destino existe (stock-levels de F5)', async () => {
    renderPage()
    await screen.findByText('Stock agotado')

    const manageLinks = screen.getAllByRole('link', { name: 'Gestionar' })
    expect(manageLinks).toHaveLength(1)
    expect(manageLinks[0]).toHaveAttribute('href', '/inventory-analytics/stock-levels')

    for (const name of [/marcar/i, /silenciar/i, /ver reporte/i, /actualizar datos/i]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
      expect(screen.queryByRole('link', { name })).toBeNull()
    }
  })

  it('filtra por severidad sin perder los contadores', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Stock agotado')

    await user.click(screen.getByRole('button', { name: 'Críticas' }))

    await waitFor(() => expect(screen.queryByText('Pagos vencidos')).toBeNull())
    expect(screen.getByText('Stock agotado')).toBeInTheDocument()
    expect(screen.getByTestId('alerts-kpi-total')).toHaveTextContent('3')
  })

  it('busca por texto y muestra el empty de filtros con acción para limpiar', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Stock agotado')

    await user.type(screen.getByRole('textbox', { name: 'Buscar alertas' }), 'vencidos')

    await waitFor(() => expect(screen.queryByText('Stock agotado')).toBeNull())
    expect(screen.getByText('Pagos vencidos')).toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: 'Buscar alertas' }))
    await user.type(screen.getByRole('textbox', { name: 'Buscar alertas' }), 'zzzzz')

    expect(await screen.findByText('Sin alertas con esos filtros')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Limpiar' }).length).toBeGreaterThan(0)
  })

  it('muestra error y retry si falla el endpoint', async () => {
    vi.mocked(dashboardService.getAlerts).mockRejectedValue(new Error('offline'))
    renderPage()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()
    expect(screen.getByTestId('error-retry')).toBeInTheDocument()
  })
})
