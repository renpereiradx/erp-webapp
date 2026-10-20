/**
 * F6 — Dashboard de Rentabilidad: KPIs reales (sin ceros ni metas), alertas
 * traducidas por tipo (no el mensaje español del BE), topes y tendencia.
 * Verifica que NO se rendericen los campos que el BE deja en cero
 * (`break_even_status`) ni claims fabricados.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

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
  categoryRow,
  customerRow,
  productRow,
  profitabilityEnvelope,
  renderProfitabilityPage,
  trendPoint,
} from './profitabilityTestUtils'
import ProfitabilityDashboardPage from '../profitability/ProfitabilityDashboardPage'

const DASHBOARD = {
  generated_at: '2026-10-20T18:00:13.968Z',
  period: PERIOD,
  kpis: {
    total_revenue: 1475500,
    total_profit: 530500,
    gross_margin_pct: 35.95391392748221,
    net_margin_pct: 35.95391392748221,
    roi: 56.13756613756614,
    profit_per_transaction: 88416.66666666667,
    revenue_growth: 60.35516141477702,
    profit_growth: 51.14175415604211,
    margin_change: -2.1917044261468384,
  },
  top_products: [
    productRow(),
    productRow({ product_id: 'P-2', product_name: 'Cancha Beach Tennis 03', gross_profit: 120000, gross_margin_pct: 0, revenue: 120000, cost: 0, units_sold: 0 }),
  ],
  top_customers: [customerRow()],
  top_categories: [categoryRow()],
  trends: [
    trendPoint(),
    trendPoint({ date: '2026-10-20T00:00:00Z', label: '20 Oct', revenue: 120000, cost: 0, gross_profit: 120000, gross_margin_pct: 100, transactions: 1, units_sold: 0 }),
  ],
  break_even_status: {
    status: '',
    revenue_above_break_even: 0,
    units_above_break_even: 0,
    days_to_break_even: 0,
    projected_month_end: 0,
  },
  alerts: [
    {
      type: 'PROFIT_GROWTH',
      category: 'GROWTH',
      message: 'Excelente crecimiento de beneficios: +51.1%',
      value: 51.14175415604211,
      threshold: 20,
      severity: 'LOW',
    },
    {
      type: 'UNPROFITABLE_PRODUCTS',
      category: 'PRODUCTS',
      message: '2 productos generando pérdidas',
      value: 2,
      threshold: 0,
      severity: 'MEDIUM',
    },
  ],
}

const EMPTY_DASHBOARD = {
  ...DASHBOARD,
  top_products: null,
  top_customers: null,
  top_categories: null,
  trends: null,
  alerts: null,
}

const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))

describe('ProfitabilityDashboardPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getDashboard).mockResolvedValue(
      profitabilityEnvelope(DASHBOARD) as never,
    )
  })

  it('muestra los KPIs con los valores reales del contrato', async () => {
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    await screen.findByTestId('profitability-kpi-revenue')

    expect(kpi('revenue').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('profit').getByText('Gs. 530.500')).toBeInTheDocument()
    expect(kpi('grossMargin').getByText('36%')).toBeInTheDocument()
    expect(kpi('roi').getByText('56,1%')).toBeInTheDocument()
    expect(kpi('profitPerTransaction').getByText('Gs. 88.417')).toBeInTheDocument()
    expect(kpi('revenueGrowth').getByText('+60,4%')).toBeInTheDocument()
    expect(kpi('profitGrowth').getByText('+51,1%')).toBeInTheDocument()
    expect(kpi('marginChange').getByText('-2,2%')).toBeInTheDocument()
    expect(kpi('profitPerTransaction').queryByText('Gs. 132.625')).toBeNull()
  })

  it('traduce las alertas por tipo y no muestra el mensaje del servidor', async () => {
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    const alerts = await screen.findByTestId('profitability-alerts')

    expect(within(alerts).getByText('Crecimiento del beneficio')).toBeInTheDocument()
    expect(within(alerts).getByText('Productos con pérdida')).toBeInTheDocument()
    expect(within(alerts).getByText('Umbral de la regla: +20%')).toBeInTheDocument()
    expect(within(alerts).getByText('Umbral de la regla: 0')).toBeInTheDocument()
    expect(
      screen.queryByText('Excelente crecimiento de beneficios: +51.1%'),
    ).toBeNull()
    expect(screen.queryByText('2 productos generando pérdidas')).toBeNull()
  })

  it('renderiza topes y la serie con etiquetas derivadas en español', async () => {
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    expect(await screen.findByText('TABLET AMAZON FIRE HD 10')).toBeInTheDocument()
    expect(screen.getByText('Cancha Beach Tennis 03')).toBeInTheDocument()
    expect(screen.getByText('Erika')).toBeInTheDocument()
    expect(screen.getAllByText('Electrónicos').length).toBeGreaterThan(0)
    expect(screen.getByText('01 oct')).toBeInTheDocument()
    expect(screen.getByText('20 oct')).toBeInTheDocument()
    // El margen del top de productos se deriva (el array trae 0).
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
  })

  it('no renderiza break-even (struct zero del BE) ni claims fabricados', async () => {
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    await screen.findByText('Dashboard de rentabilidad')
    expect(screen.queryByText(/break.?even/i)).toBeNull()
    expect(screen.queryByText(/punto de equilibrio/i)).toBeNull()
    expect(screen.queryByText(/en tiempo real/i)).toBeNull()
    expect(screen.queryByText(/^live$/i)).toBeNull()
    expect(screen.queryByText(/objetivo/i)).toBeNull()
  })

  it('estados vacíos honestos cuando el BE devuelve listas null', async () => {
    vi.mocked(profitabilityService.getDashboard).mockResolvedValue(
      profitabilityEnvelope(EMPTY_DASHBOARD) as never,
    )
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    expect(await screen.findByText('Sin alertas de rentabilidad en el período.')).toBeInTheDocument()
    expect(screen.getByText('Sin ventas en el período')).toBeInTheDocument()
    expect(screen.getByText('Sin productos con beneficio en el período')).toBeInTheDocument()
    expect(screen.getByText('Sin clientes con compras en el período')).toBeInTheDocument()
    expect(screen.getByText('Sin categorías con ventas en el período')).toBeInTheDocument()
  })

  it('muestra el error de la query y permite reintentar', async () => {
    vi.mocked(profitabilityService.getDashboard).mockRejectedValue(new Error('network down'))
    renderProfitabilityPage(<ProfitabilityDashboardPage />)
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('network down').length).toBeGreaterThan(0)
  })
})
