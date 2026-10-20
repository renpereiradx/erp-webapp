/**
 * F6 — Clientes rentables: resumen, tabla paginada, segmento real y
 * antigüedad derivada de `last_purchase` (no del campo EXTRACT(DAY) del BE).
 * Verifica que no reaparezcan el tipo "REGULAR" hardcodeado ni el Pareto 0 %.
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
import { daysSince } from '@/domain/profitability/format'
import {
  PERIOD,
  customerRow,
  profitabilityEnvelope,
  renderProfitabilityPage,
} from './profitabilityTestUtils'
import CustomerProfitabilityPage from '../profitability/CustomerProfitabilityPage'

const MARCELO = customerRow({
  customer_id: 'CL-2',
  customer_name: 'MARCELO',
  total_purchases: 4,
  total_revenue: 101400,
  total_cost: 38000,
  gross_profit: 63400,
  gross_margin_pct: 62.52,
  average_ticket: 25350,
  contribution_pct: 11.95,
  last_purchase: '2026-10-14T20:58:18.105431Z',
  segment: 'BRONZE',
  rank: 2,
})

const REPORT = {
  generated_at: '2026-10-20T18:00:14.004Z',
  period: PERIOD,
  summary: {
    total_customers: 2,
    active_customers: 2,
    profitable_customers: 1,
    average_customer_value: 265250,
    total_profit: 530500,
    top_customers_pct: 0,
  },
  customers: [customerRow(), MARCELO],
  top_customers: null,
  at_risk_customers: null,
  pagination: { page: 1, page_size: 10, total_items: 2, total_pages: 1 },
}

const emptyReport = {
  ...REPORT,
  summary: {
    total_customers: 0,
    active_customers: 0,
    profitable_customers: 0,
    average_customer_value: 0,
    total_profit: 0,
    top_customers_pct: 0,
  },
  customers: [],
  pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
}

describe('CustomerProfitabilityPage (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(profitabilityService.getCustomers).mockResolvedValue(
      profitabilityEnvelope(REPORT) as never,
    )
  })

  it('muestra el resumen, la tabla y el segmento real', async () => {
    renderProfitabilityPage(<CustomerProfitabilityPage />, {
      route: '/profitability/customers',
    })
    await screen.findByTestId('profitability-kpi-totalCustomers')

    const kpi = (id: string) => within(screen.getByTestId(`profitability-kpi-${id}`))
    expect(kpi('totalCustomers').getByText('2')).toBeInTheDocument()
    expect(kpi('profitableCustomers').getByText('1')).toBeInTheDocument()
    expect(kpi('unprofitableCustomers').getByText('1')).toBeInTheDocument()
    expect(kpi('totalProfit').getByText('Gs. 530.500')).toBeInTheDocument()
    expect(kpi('averageCustomerValue').getByText('Gs. 265.250')).toBeInTheDocument()

    expect(screen.getByText('Erika')).toBeInTheDocument()
    expect(screen.getByText('MARCELO')).toBeInTheDocument()
    expect(screen.getByTestId('segment-platinum')).toHaveTextContent('PLATINUM')
    expect(screen.getByTestId('segment-bronze')).toHaveTextContent('BRONZE')
    expect(screen.getByText('88,1%')).toBeInTheDocument()
  })

  it('deriva la antigüedad real y no muestra el tipo REGULAR ni el Pareto 0 %', async () => {
    renderProfitabilityPage(<CustomerProfitabilityPage />, {
      route: '/profitability/customers',
    })
    await screen.findByTestId('customers-table')

    const expectedDays = daysSince(MARCELO.last_purchase) as number
    const expectedLabel =
      expectedDays === 0 ? 'Hoy' : `Hace ${expectedDays} días`
    expect(screen.getAllByText(expectedLabel).length).toBeGreaterThan(0)

    // El BE manda "0" en los dos clientes (bug de EXTRACT(DAY)): no se usa.
    expect(screen.queryByText('Hace 0 días')).toBeNull()
    expect(screen.queryByText('REGULAR')).toBeNull()
    expect(screen.queryByText(/pareto/i)).toBeNull()
    expect(screen.queryByText(/contribución pareto/i)).toBeNull()
  })

  it('pagina con los totales del server', async () => {
    vi.mocked(profitabilityService.getCustomers).mockResolvedValue(
      profitabilityEnvelope({
        ...REPORT,
        pagination: { page: 1, page_size: 10, total_items: 12, total_pages: 2 },
      }) as never,
    )
    renderProfitabilityPage(<CustomerProfitabilityPage />, {
      route: '/profitability/customers',
    })
    await screen.findByTestId('customers-table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(profitabilityService.getCustomers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, page_size: 10 }),
      ),
    )
  })

  it('empty honesto sin clientes en el período', async () => {
    vi.mocked(profitabilityService.getCustomers).mockResolvedValue(
      profitabilityEnvelope(emptyReport) as never,
    )
    renderProfitabilityPage(<CustomerProfitabilityPage />, {
      route: '/profitability/customers',
    })
    expect(
      await screen.findByText('Sin clientes con compras en el período'),
    ).toBeInTheDocument()
    // El promedio sin clientes es “—”, no “Gs. 0”.
    expect(
      within(screen.getByTestId('profitability-kpi-averageCustomerValue')).getByText('—'),
    ).toBeInTheDocument()
  })

  it('muestra el error de la query', async () => {
    vi.mocked(profitabilityService.getCustomers).mockRejectedValue(new Error('down'))
    renderProfitabilityPage(<CustomerProfitabilityPage />, {
      route: '/profitability/customers',
    })
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
  })
})
