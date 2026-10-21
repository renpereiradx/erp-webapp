/**
 * F8 — Dashboard de CxP: KPIs del snapshot y del período, antigüedad,
 * calendario y top de proveedores con datos reales del contrato. Verifica la
 * aislación de errores por sección y la ausencia de claims/cifras fabricadas.
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
      if (!fallback) return key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/payablesService', () => ({
  payablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getTopSuppliers: vi.fn(),
    getSchedule: vi.fn(),
    getAgingReport: vi.fn(),
    getStatistics: vi.fn(),
    getCashFlowProjection: vi.fn(),
    getSupplierAnalysis: vi.fn(),
  },
}))

import { payablesService } from '@/services/bi/payablesService'
import {
  overview as overviewFixture,
  payablesEnvelope,
  renderPayablesPage,
  schedule as scheduleFixture,
  statistics as statisticsFixture,
  topSuppliers as topSuppliersFixture,
} from './payablesTestUtils'
import PayablesDashboardPage from '../payables/PayablesDashboardPage'

const kpi = (id: string) => within(screen.getByTestId(`payables-kpi-${id}`))

describe('PayablesDashboardPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(payablesService.getOverview).mockResolvedValue(
      payablesEnvelope(overviewFixture()) as never,
    )
    vi.mocked(payablesService.getSchedule).mockResolvedValue(
      payablesEnvelope(scheduleFixture()) as never,
    )
    vi.mocked(payablesService.getTopSuppliers).mockResolvedValue(
      payablesEnvelope(topSuppliersFixture()) as never,
    )
    vi.mocked(payablesService.getStatistics).mockResolvedValue(
      payablesEnvelope(statisticsFixture()) as never,
    )
  })

  it('muestra la cartera, el aging y la antigüedad media de saldadas', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    await screen.findByTestId('payables-kpi-pending')

    expect(kpi('pending').getByText('Gs. 6.414.250')).toBeInTheDocument()
    expect(kpi('overdue').getByText('Gs. 6.014.250')).toBeInTheDocument()
    expect(kpi('accounts').getByText('17')).toBeInTheDocument()
    expect(kpi('overdueAccounts').getByText('17')).toBeInTheDocument()
    expect(kpi('dueThisWeek').getByText('Gs. 0')).toBeInTheDocument()
    expect(kpi('paymentRate').getByText('71,9%')).toBeInTheDocument()
    expect(kpi('settledAge').getByText('15')).toBeInTheDocument()

    expect(screen.getByTestId('payables-aging-over_90_days')).toHaveTextContent('Gs. 3.509.450')
    expect(screen.getByTestId('payables-aging-over_90_days')).toHaveTextContent('54,7%')
    expect(screen.getByTestId('payables-aging-days_30_60')).toHaveTextContent('Gs. 1.000')
    expect(screen.getByText('Total en tramos: Gs. 6.414.250')).toBeInTheDocument()
  })

  it('muestra las estadísticas del período con su rango real', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    await screen.findByTestId('payables-kpi-purchased')

    expect(kpi('purchased').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('paid').getByText('Gs. 1.000.000')).toBeInTheDocument()
    expect(kpi('periodPaymentRate').getByText('67,8%')).toBeInTheDocument()
    expect(kpi('periodDpo').getByText('13')).toBeInTheDocument()
    expect(kpi('periodOverdueShare').getByText('40%')).toBeInTheDocument()
    expect(screen.getByText('Rango aplicado: 01 oct 2026 – 31 oct 2026')).toBeInTheDocument()
  })

  it('lista la serie semanal real con su acumulado', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    const trend = await screen.findByTestId('payables-trend-table')

    expect(within(trend).getByText('28 sept')).toBeInTheDocument()
    expect(within(trend).getByText('05 oct')).toBeInTheDocument()
    expect(within(trend).getAllByText('Gs. 1.254.100')).toHaveLength(2)
    expect(within(trend).getByText('Gs. 280.100')).toBeInTheDocument()
  })

  it('muestra los proveedores con deuda y su comportamiento', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    const table = await screen.findByTestId('payables-top-suppliers')

    const link = within(table).getByRole('link', { name: 'Protek PRO' })
    expect(link).toHaveAttribute('href', '/payables/suppliers/SP-PROTEK/analysis')
    expect(within(table).getAllByText('Gs. 500.000')).toHaveLength(2)
    expect(within(table).getByText('Malo')).toBeInTheDocument()
  })

  it('ordena el calendario por fecha aunque el BE lo entregue desordenado', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    const panel = await screen.findByTestId('payables-schedule-panel')
    const dates = within(panel).getAllByRole('heading', { level: 3 })

    expect(dates.map((date) => date.textContent)).toEqual(['25 oct', '02 nov'])
    expect(within(panel).getByText('Vence en 5 días')).toBeInTheDocument()
  })

  it('aísla el error de una sección: el calendario sigue visible', async () => {
    vi.mocked(payablesService.getOverview).mockRejectedValue(new Error('boom'))
    renderPayablesPage(<PayablesDashboardPage />)

    await screen.findByTestId('payables-schedule-panel')
    expect(screen.queryByTestId('payables-kpi-pending')).toBeNull()
    expect(screen.getAllByText('No se pudieron cargar los datos').length).toBeGreaterThan(0)
  })

  it('no muestra claims ni cifras fabricadas', async () => {
    renderPayablesPage(<PayablesDashboardPage />)
    await screen.findByTestId('payables-kpi-pending')

    for (const claim of ['en tiempo real', 'Live', 'objetivo', 'Sincronizado']) {
      expect(screen.queryByText(new RegExp(claim, 'i'))).toBeNull()
    }
    // El símbolo de dólar no existe en el contrato (moneda base PYG).
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})
