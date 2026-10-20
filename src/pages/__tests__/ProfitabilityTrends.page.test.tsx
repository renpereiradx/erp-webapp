/**
 * F6 — Tendencias: serie real con granularidad, resumen re-derivado (dirección
 * ±5 %, crecimiento primera→última, extremos) y labels en el locale de la UI
 * derivados de `date` (no del `label` inglés del BE).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

vi.mock('@/services/bi/profitabilityService', () => ({
  profitabilityService: {
    getDashboard: vi.fn(),
    getProducts: vi.fn(),
    getCustomers: vi.fn(),
    getCategories: vi.fn(),
    getTrends: vi.fn(),
    getSellers: vi.fn(),
  },
}))

import { profitabilityService } from '@/services/bi/profitabilityService'
import {
  PERIOD,
  profitabilityEnvelope,
  renderProfitabilityPage,
  trendPoint,
} from './profitabilityTestUtils'
import ProfitabilityTrendsPage from '../profitability/ProfitabilityTrendsPage'

const REPORT = {
  generated_at: '2026-10-20T18:00:14.025Z',
  period: PERIOD,
  data_points: [
    trendPoint(),
    trendPoint({
      date: '2026-10-05T00:00:00Z',
      label: '05 Oct',
      revenue: 26000,
      cost: 10000,
      gross_profit: 16000,
      gross_margin_pct: 61.53846153846154,
      net_profit: 16000,
      net_margin_pct: 61.53846153846154,
      transactions: 1,
      units_sold: 0,
    }),
    trendPoint({
      date: '2026-10-14T00:00:00Z',
      label: '14 Oct',
      revenue: 75400,
      cost: 28000,
      gross_profit: 47400,
      gross_margin_pct: 62.864721485411145,
      net_profit: 47400,
      net_margin_pct: 62.864721485411145,
      transactions: 3,
      units_sold: 1,
    }),
    trendPoint({
      date: '2026-10-20T00:00:00Z',
      label: '20 Oct',
      revenue: 120000,
      cost: 0,
      gross_profit: 120000,
      gross_margin_pct: 100,
      net_profit: 120000,
      net_margin_pct: 100,
      transactions: 1,
      units_sold: 0,
    }),
  ],
  summary: {
    average_revenue: 368875,
    average_profit: 132625,
    average_margin: 63.02010043661565,
    highest_revenue_date: '01 Oct',
    highest_profit_date: '01 Oct',
    lowest_margin_date: '01 Oct',
    trend_direction: 'DOWN',
    growth_rate: -65.42783059636992,
  },
}

const EMPTY_REPORT = {
  ...REPORT,
  data_points: null,
  summary: {
    average_revenue: 0,
    average_profit: 0,
    average_margin: 0,
    highest_revenue_date: '',
    highest_profit_date: '',
    lowest_margin_date: '',
    trend_direction: '',
    growth_rate: 0,
  },
}

describe('ProfitabilityTrendsPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getTrends).mockResolvedValue(
      profitabilityEnvelope(REPORT) as never,
    )
  })

  it('usa granularidad diaria por defecto y deriva labels/insight reales', async () => {
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends',
    })
    await screen.findByTestId('trends-summary')

    expect(profitabilityService.getTrends).toHaveBeenCalledWith({
      period: 'month',
      granularity: 'daily',
    })

    const summary = within(screen.getByTestId('trends-summary'))
    expect(summary.getByText('En baja')).toBeInTheDocument()
    expect(summary.getByText('-65,4%')).toBeInTheDocument()
    expect(summary.getByText('63%')).toBeInTheDocument()
    expect(summary.getAllByText(/01 oct/).length).toBeGreaterThan(0)

    const table = screen.getByTestId('trends-table')
    expect(within(table).getByText('01 oct')).toBeInTheDocument()
    expect(within(table).getByText('20 oct')).toBeInTheDocument()
    expect(within(table).queryByText('01 Oct')).toBeNull()

    const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))
    expect(kpi('points').getByText('4')).toBeInTheDocument()
    expect(kpi('totalRevenue').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('totalProfit').getByText('Gs. 530.500')).toBeInTheDocument()
    // 3 + 0 + 1 + 0 unidades normalizadas.
    expect(kpi('units').getByText('4')).toBeInTheDocument()
  })

  it('cambia a granularidad semanal y consulta de nuevo', async () => {
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends',
    })
    await screen.findByTestId('trends-table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'Semanal' }))
    await waitFor(() =>
      expect(profitabilityService.getTrends).toHaveBeenLastCalledWith({
        period: 'month',
        granularity: 'weekly',
      }),
    )
    expect(await screen.findByText('Semana del 01 oct')).toBeInTheDocument()
  })

  it('con período año usa mensual por defecto', async () => {
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends?period=year',
    })
    await screen.findByTestId('trends-table')
    expect(profitabilityService.getTrends).toHaveBeenLastCalledWith({
      period: 'year',
      granularity: 'monthly',
    })
    expect(screen.getAllByText('oct 2026').length).toBeGreaterThan(0)
  })

  it('ignora una granularidad inválida y cae a diaria', async () => {
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends?granularity=quarter',
    })
    await screen.findByTestId('trends-table')
    expect(profitabilityService.getTrends).toHaveBeenLastCalledWith({
      period: 'month',
      granularity: 'daily',
    })
    expect(screen.getByText('01 oct')).toBeInTheDocument()
  })

  it('empty honesto sin ventas en el período', async () => {
    vi.mocked(profitabilityService.getTrends).mockResolvedValue(
      profitabilityEnvelope(EMPTY_REPORT) as never,
    )
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends',
    })
    expect(await screen.findByText('Sin ventas en el período')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('profitability-kpi-totalRevenue')).getByText('Gs. 0'),
    ).toBeInTheDocument()
  })

  it('muestra el error de la query', async () => {
    vi.mocked(profitabilityService.getTrends).mockRejectedValue(new Error('down'))
    renderProfitabilityPage(<ProfitabilityTrendsPage />, {
      route: '/profitability/trends',
    })
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
  })
})
