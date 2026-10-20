/**
 * F6 — Productos rentables: KPIs del resumen, tabla ordenable/paginada
 * server-side, columna de contribución real, unidades no normalizadas como
 * “—”, paneles de mayor beneficio/pérdida y empty honesto.
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
  productRow,
  profitabilityEnvelope,
  renderProfitabilityPage,
} from './profitabilityTestUtils'
import ProductProfitabilityPage from '../profitability/ProductProfitabilityPage'

const REPORT = {
  generated_at: '2026-10-20T18:00:13.992Z',
  period: PERIOD,
  summary: {
    total_products: 2,
    profitable_products: 1,
    unprofitable_products: 1,
    average_margin: 25,
    total_profit: 170000,
    total_revenue: 600000,
  },
  products: [
    productRow(),
    productRow({
      product_id: 'P-2',
      product_name: 'Producto con pérdida',
      units_sold: 0,
      revenue: 5000,
      cost: 8000,
      gross_profit: -3000,
      gross_margin_pct: -60,
      contribution_pct: -1.76,
      performance: 'LOSS',
    }),
  ],
  top_profitable: [productRow()],
  low_profitable: null,
  losers: [
    productRow({
      product_id: 'P-2',
      product_name: 'Producto con pérdida',
      units_sold: 0,
      revenue: 5000,
      cost: 8000,
      gross_profit: -3000,
      gross_margin_pct: 0,
      performance: 'LOSS',
      rank: 0,
    }),
  ],
  pagination: { page: 1, page_size: 10, total_items: 12, total_pages: 2 },
}

const emptyReport = {
  ...REPORT,
  summary: {
    total_products: 0,
    profitable_products: 0,
    unprofitable_products: 0,
    average_margin: 0,
    total_profit: 0,
    total_revenue: 0,
  },
  products: [],
  top_profitable: [],
  losers: [],
  pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
}

describe('ProductProfitabilityPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getProducts).mockResolvedValue(
      profitabilityEnvelope(REPORT) as never,
    )
  })

  it('muestra el resumen y la tabla con contribución real', async () => {
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    await screen.findByTestId('profitability-kpi-totalProducts')

    const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))
    expect(kpi('totalProducts').getByText('2')).toBeInTheDocument()
    expect(kpi('profitableProducts').getByText('1')).toBeInTheDocument()
    expect(kpi('unprofitableProducts').getByText('1')).toBeInTheDocument()
    expect(kpi('totalRevenue').getByText('Gs. 600.000')).toBeInTheDocument()
    expect(kpi('totalProfit').getByText('Gs. 170.000')).toBeInTheDocument()
    // 170000/600000 = 28,3 % (ponderado), no el promedio simple 25 %.
    expect(kpi('globalMargin').getByText('28,3%')).toBeInTheDocument()
    expect(kpi('averageMargin').getByText('25%')).toBeInTheDocument()

    expect(screen.getAllByText('TABLET AMAZON FIRE HD 10').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Producto con pérdida').length).toBeGreaterThan(0)
    expect(screen.getByText('% del beneficio')).toBeInTheDocument()
    // El endpoint no calcula SKU: no hay columna.
    expect(screen.queryByText('SKU')).toBeNull()
    // units_sold 0 con importe real se muestra como “—”.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('ordena server-side al clickear encabezados y respeta el aria-sort', async () => {
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    await screen.findByTestId('products-table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /Producto/ }))
    await waitFor(() =>
      expect(profitabilityService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'name', sort_order: 'ASC', page: 1 }),
      ),
    )
    expect(screen.getByRole('columnheader', { name: /Producto/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    await user.click(screen.getByRole('button', { name: /Producto/ }))
    await waitFor(() =>
      expect(profitabilityService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'name', sort_order: 'DESC' }),
      ),
    )

    // Un campo no cacheado dispara otro request real.
    await user.click(screen.getByRole('button', { name: /Unidades/ }))
    await waitFor(() =>
      expect(profitabilityService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'units', sort_order: 'DESC' }),
      ),
    )

    // Volver al orden inicial usa la caché de react-query, pero el encabezado
    // debe reflejar el estado aplicado.
    await user.click(screen.getByRole('button', { name: /Beneficio/ }))
    expect(screen.getByRole('columnheader', { name: /Beneficio/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('pagina con los totales del server', async () => {
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    await screen.findByTestId('products-table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(profitabilityService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('muestra los paneles de mayor beneficio y pérdida con datos del contrato', async () => {
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    const top = await screen.findByTestId('products-top-card')
    const losers = screen.getByTestId('products-losers-card')
    expect(within(top).getByText('TABLET AMAZON FIRE HD 10')).toBeInTheDocument()
    expect(within(top).getByText('Gs. 170.000')).toBeInTheDocument()
    expect(within(losers).getByText('Producto con pérdida')).toBeInTheDocument()
    expect(within(losers).getByText('Gs. -3.000')).toBeInTheDocument()
  })

  it('empty honesto cuando el período no tiene productos', async () => {
    vi.mocked(profitabilityService.getProducts).mockResolvedValue(
      profitabilityEnvelope(emptyReport) as never,
    )
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    expect(
      await screen.findByText('Sin productos con ventas en el período'),
    ).toBeInTheDocument()
    expect(screen.getByText('Sin productos con beneficio')).toBeInTheDocument()
    expect(screen.getByText('Sin productos con pérdida')).toBeInTheDocument()
    // Sin beneficio total no se ofrece la columna de contribución.
    expect(screen.queryByText('% del beneficio')).toBeNull()
  })

  it('muestra el error de la query', async () => {
    vi.mocked(profitabilityService.getProducts).mockRejectedValue(new Error('down'))
    renderProfitabilityPage(<ProductProfitabilityPage />, {
      route: '/profitability/products',
    })
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
  })
})
