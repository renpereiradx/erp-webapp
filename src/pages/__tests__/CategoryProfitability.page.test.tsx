/**
 * F6 — Categorías rentables: resumen, extremos reales (nombre + monto) y
 * tabla completa con participaciones. Verifica que no aparezca el NaN del
 * “líder” que la auditoría 2026-09 marcó como bloqueante.
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
  profitabilityEnvelope,
  renderProfitabilityPage,
} from './profitabilityTestUtils'
import CategoryProfitabilityPage from '../profitability/CategoryProfitabilityPage'

const BEBIDAS = categoryRow({
  category_id: '7',
  category_name: 'Bebidas',
  product_count: 1,
  units_sold: 1,
  revenue: 10400,
  cost: 8000,
  gross_profit: 2400,
  gross_margin_pct: 23.076923076923077,
  contribution_pct: 0.45,
  average_markup: 30,
  revenue_share: 0.7,
  profit_share: 0.45,
  performance: 'AVERAGE',
  rank: 2,
})

const REPORT = {
  generated_at: '2026-10-20T18:00:14.014Z',
  period: PERIOD,
  summary: {
    total_categories: 2,
    most_profitable_id: '18',
    most_profitable_name: 'Electrónicos',
    least_profitable_id: '7',
    least_profitable_name: 'Bebidas',
    average_margin: 40.12681631165043,
    total_profit: 530500,
  },
  categories: [categoryRow(), BEBIDAS],
}

const emptyReport = {
  ...REPORT,
  summary: {
    total_categories: 0,
    most_profitable_id: '',
    most_profitable_name: '',
    least_profitable_id: '',
    least_profitable_name: '',
    average_margin: 0,
    total_profit: 0,
  },
  categories: [],
}

describe('CategoryProfitabilityPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getCategories).mockResolvedValue(
      profitabilityEnvelope(REPORT) as never,
    )
  })

  it('muestra resumen, extremos y tabla con participaciones reales', async () => {
    renderProfitabilityPage(<CategoryProfitabilityPage />, {
      route: '/profitability/categories',
    })
    await screen.findByTestId('profitability-kpi-totalCategories')

    const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))
    expect(kpi('totalCategories').getByText('2')).toBeInTheDocument()
    expect(kpi('totalProfit').getByText('Gs. 530.500')).toBeInTheDocument()
    expect(kpi('averageMargin').getByText('40,1%')).toBeInTheDocument()

    const extremes = screen.getByTestId('profitability-categories-extremes-card')
    expect(within(extremes).getByText('Electrónicos · Gs. 300.000')).toBeInTheDocument()
    expect(within(extremes).getByText('Bebidas · Gs. 2.400')).toBeInTheDocument()

    const table = screen.getByTestId('categories-table')
    expect(within(table).getByText('Electrónicos')).toBeInTheDocument()
    expect(within(table).getByText('Bebidas')).toBeInTheDocument()
    expect(within(table).getByText('71,2%')).toBeInTheDocument()
    expect(within(table).getByText('56,6%')).toBeInTheDocument()
    expect(screen.getAllByTestId('performance-average').length).toBeGreaterThan(0)
    // El summary no trae el monto del líder: el extremo se deriva de la fila.
    expect(screen.queryByText(/NaN/)).toBeNull()
  })

  it('una sola categoría no inventa un “menor beneficio”', async () => {
    vi.mocked(profitabilityService.getCategories).mockResolvedValue(
      profitabilityEnvelope({
        ...REPORT,
        summary: { ...REPORT.summary, total_categories: 1 },
        categories: [categoryRow()],
      }) as never,
    )
    renderProfitabilityPage(<CategoryProfitabilityPage />, {
      route: '/profitability/categories',
    })
    const extremes = await screen.findByTestId('profitability-categories-extremes-card')
    expect(await within(extremes).findByText('Electrónicos · Gs. 300.000')).toBeInTheDocument()
    expect(within(extremes).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('empty honesto sin categorías en el período', async () => {
    vi.mocked(profitabilityService.getCategories).mockResolvedValue(
      profitabilityEnvelope(emptyReport) as never,
    )
    renderProfitabilityPage(<CategoryProfitabilityPage />, {
      route: '/profitability/categories',
    })
    expect(
      await screen.findByText('Sin categorías con ventas en el período'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('profitability-kpi-averageMargin')).getByText('—'),
    ).toBeInTheDocument()
  })

  it('muestra el error de la query', async () => {
    vi.mocked(profitabilityService.getCategories).mockRejectedValue(new Error('down'))
    renderProfitabilityPage(<CategoryProfitabilityPage />, {
      route: '/profitability/categories',
    })
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
  })
})
