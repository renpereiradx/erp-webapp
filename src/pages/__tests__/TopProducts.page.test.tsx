/**
 * TopProductsPage (F2) — tabla de `/dashboard/top-products` con orden
 * server-side, búsqueda client-side y tendencia redondeada (la auditoría
 * 2026-09 encontró "-63.017946325668184%" en pantalla).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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
import { useDashboardStore } from '@/store/useDashboardStore'
import TopProductsPage from '../dashboard/TopProductsPage'

const TOP_PRODUCTS = {
  products: [
    {
      id: 'P-1',
      name: 'CAMISETA ADIDAS',
      category: 'MODA',
      brand_name: 'Adidas',
      quantity_sold: 2,
      revenue: 134770,
      profit: 82470,
      margin_percentage: 61.2,
      trend: 'down',
      trend_percentage: -63.017946325668184,
    },
    {
      id: 'P-2',
      name: 'Pelota de fútbol',
      category: 'Deportes',
      quantity_sold: 1,
      revenue: 65230,
      profit: 17530,
      margin_percentage: 26.9,
      trend: 'up',
      trend_percentage: 15.46,
    },
  ],
  total_revenue: 200000,
  total_profit: 100000,
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <TopProductsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('TopProductsPage (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDashboardStore.getState().reset()
    vi.mocked(dashboardService.getTopProducts).mockResolvedValue(envelope(TOP_PRODUCTS) as never)
  })

  it('renderiza totales del top y la tabla con margen y tendencia redondeada', async () => {
    renderPage()

    expect(await screen.findByText('Top de productos')).toBeInTheDocument()
    expect(await screen.findByTestId('top-kpi-revenue')).toHaveTextContent('Gs. 200.000')
    expect(screen.getByTestId('top-kpi-profit')).toHaveTextContent('Gs. 100.000')
    expect(screen.getByTestId('top-kpi-count')).toHaveTextContent('2')

    const row = await screen.findByTestId('top-product-row-P-1')
    expect(within(row).getByText('CAMISETA ADIDAS')).toBeInTheDocument()
    expect(within(row).getByText('Adidas')).toBeInTheDocument()
    expect(within(row).getByText('61,2%')).toBeInTheDocument()
    expect(within(row).getByText('63%')).toBeInTheDocument()

    expect(screen.queryByText('-63.017946325668184%')).toBeNull()
    expect(screen.queryByText('-63.017946')).toBeNull()
  })

  it('ordena server-side al elegir otro criterio', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CAMISETA ADIDAS')

    await user.click(screen.getByRole('tab', { name: 'Utilidad' }))

    await waitFor(() =>
      expect(dashboardService.getTopProducts).toHaveBeenLastCalledWith({
        period: 'month',
        limit: 10,
        sort_by: 'profit',
      }),
    )
  })

  it('busca client-side por nombre, marca o categoría', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CAMISETA ADIDAS')

    await user.type(
      screen.getByRole('textbox', { name: 'Buscar productos' }),
      'pelota',
    )

    await waitFor(() => expect(screen.queryByTestId('top-product-row-P-1')).toBeNull())
    expect(screen.getByTestId('top-product-row-P-2')).toBeInTheDocument()
  })

  it('muestra empty de búsqueda dentro de la tabla', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CAMISETA ADIDAS')

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'zzzzz')

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })

  it('muestra error y retry si falla el endpoint', async () => {
    vi.mocked(dashboardService.getTopProducts).mockRejectedValue(new Error('offline'))
    renderPage()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()
    expect(screen.getByTestId('error-retry')).toBeInTheDocument()
  })
})
