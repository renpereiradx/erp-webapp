/**
 * F6 — Vendedores rentables: resumen real (sin fan-out de líneas), ranking y
 * participación. Verifica que no reaparezca el “promedio 0 %” ni el “objetivo
 * corporativo 0 %” de la auditoría 2026-09.
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
  profitabilityEnvelope,
  renderProfitabilityPage,
  sellerRow,
} from './profitabilityTestUtils'
import SellerProfitabilityPage from '../profitability/SellerProfitabilityPage'

const SECOND = sellerRow({
  seller_id: 'U-2',
  seller_name: 'VENDEDOR DOS',
  total_sales: 2,
  total_revenue: 50000,
  total_cost: 30000,
  gross_profit: 20000,
  gross_margin_pct: 40,
  average_ticket: 25000,
  contribution_pct: 3.6,
  rank: 2,
})

const REPORT = {
  generated_at: '2026-10-20T18:00:14.036Z',
  period: PERIOD,
  summary: {
    total_sellers: 2,
    total_profit: 550500,
    average_profit_per_seller: 275250,
    top_seller_id: 'jJkV4F6HR',
    top_seller_name: 'ADMINISTRADOR ADMINISTRADOR',
  },
  sellers: [sellerRow(), SECOND],
}

const emptyReport = {
  ...REPORT,
  summary: {
    total_sellers: 0,
    total_profit: 0,
    average_profit_per_seller: 0,
    top_seller_id: '',
    top_seller_name: '',
  },
  sellers: [],
}

describe('SellerProfitabilityPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getSellers).mockResolvedValue(
      profitabilityEnvelope(REPORT) as never,
    )
  })

  it('muestra el resumen, el top real y el ranking', async () => {
    renderProfitabilityPage(<SellerProfitabilityPage />, {
      route: '/profitability/sellers',
    })
    await screen.findByTestId('profitability-kpi-totalSellers')

    const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))
    expect(kpi('totalSellers').getByText('2')).toBeInTheDocument()
    expect(kpi('totalProfit').getByText('Gs. 550.500')).toBeInTheDocument()
    expect(kpi('averageProfitPerSeller').getByText('Gs. 275.250')).toBeInTheDocument()

    const table = screen.getByTestId('sellers-table')
    expect(within(table).getByText('ADMINISTRADOR ADMINISTRADOR')).toBeInTheDocument()
    expect(within(table).getByText('VENDEDOR DOS')).toBeInTheDocument()
    expect(within(table).getByText('100%')).toBeInTheDocument()
    expect(within(table).getByText('3,6%')).toBeInTheDocument()
    expect(screen.getByText('Top vendedor')).toBeInTheDocument()
    expect(screen.getAllByText('ADMINISTRADOR ADMINISTRADOR').length).toBeGreaterThan(0)
    expect(screen.queryByText(/objetivo corporativo/i)).toBeNull()
  })

  it('empty honesto sin vendedores en el período', async () => {
    vi.mocked(profitabilityService.getSellers).mockResolvedValue(
      profitabilityEnvelope(emptyReport) as never,
    )
    renderProfitabilityPage(<SellerProfitabilityPage />, {
      route: '/profitability/sellers',
    })
    expect(
      await screen.findByText('Sin vendedores con ventas en el período'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Top vendedor')).toBeNull()
  })

  it('muestra el error de la query', async () => {
    vi.mocked(profitabilityService.getSellers).mockRejectedValue(new Error('down'))
    renderProfitabilityPage(<SellerProfitabilityPage />, {
      route: '/profitability/sellers',
    })
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
  })
})
