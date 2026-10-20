/**
 * SalesHeatmapPage (F2) — grilla día×hora real de `/dashboard/sales-heatmap`,
 * totales derivados de las celdas y horarios pico/valle del backend. El
 * símbolo `$` de la auditoría 2026-09 no debe reaparecer (el sistema es PYG).
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
import { useDashboardStore } from '@/store/useDashboardStore'
import SalesHeatmapPage from '../dashboard/SalesHeatmapPage'

const HEATMAP = {
  heatmap: [
    { day: 1, hour: 9, sales_count: 3, sales_total: 300000 },
    { day: 2, hour: 10, sales_count: 1, sales_total: 50000 },
  ],
  peak_times: [{ day: 'Martes', hour: 9, average_sales: 0.75 }],
  slow_times: [{ day: 'Miércoles', hour: 10, average_sales: 0.25 }],
}

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <SalesHeatmapPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('SalesHeatmapPage (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDashboardStore.getState().reset()
    vi.mocked(dashboardService.getSalesHeatmap).mockResolvedValue(envelope(HEATMAP) as never)
  })

  it('renderiza totales derivados de las celdas y la grilla real', async () => {
    renderPage()

    expect(await screen.findByText('Análisis de ventas')).toBeInTheDocument()
    expect(await screen.findByTestId('heatmap-kpi-sales')).toHaveTextContent('Gs. 350.000')
    expect(screen.getByTestId('heatmap-kpi-transactions')).toHaveTextContent('4')
    expect(screen.getByTestId('heatmap-kpi-cells')).toHaveTextContent('2')

    // Lunes 9h: 3 ventas reales en la celda correspondiente.
    expect(screen.getByTestId('heatmap-cell-monday-9')).toHaveTextContent('3')
    expect(screen.getByTestId('heatmap-cell-tuesday-10')).toHaveTextContent('1')
    expect(screen.getByTestId('heatmap-cell-sunday-0')).toHaveTextContent('')
  })

  it('lista horarios pico/valle traducidos desde el nombre del BE', async () => {
    renderPage()
    await screen.findByText('Análisis de ventas')

    expect(await screen.findByText('Martes · 09:00')).toBeInTheDocument()
    expect(screen.getByText('Miércoles · 10:00')).toBeInTheDocument()
    expect(screen.getByText(/0,8 promedio\/semana/)).toBeInTheDocument()
  })

  it('no usa el símbolo $ en ningún monto', async () => {
    renderPage()
    await screen.findByText('Análisis de ventas')

    expect(await screen.findByTestId('heatmap-kpi-sales')).toHaveTextContent('Gs.')
    expect(screen.queryByText(/\$/)).toBeNull()
  })

  it('refetchea al cambiar la ventana de semanas', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() =>
      expect(dashboardService.getSalesHeatmap).toHaveBeenCalledWith({ weeks: 4 }),
    )
    await user.click(screen.getByRole('tab', { name: '8 sem.' }))

    await waitFor(() =>
      expect(dashboardService.getSalesHeatmap).toHaveBeenLastCalledWith({ weeks: 8 }),
    )
  })
})
