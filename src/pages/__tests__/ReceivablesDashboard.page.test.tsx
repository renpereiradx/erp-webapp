/**
 * F7 — Dashboard de CxC: KPIs del snapshot y del período, antigüedad, top de
 * deudores y cuentas recientes con datos reales del contrato. Verifica la
 * aislación de errores por sección (el P0 de la auditoría: un fallo tumbaba la
 * pantalla entera) y la ausencia de claims/cifras fabricadas.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

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

vi.mock('@/services/bi/receivablesService', () => ({
  receivablesService: {
    getOverview: vi.fn(),
    getList: vi.fn(),
    getById: vi.fn(),
    getOverdue: vi.fn(),
    getClientReceivables: vi.fn(),
    getClientRisk: vi.fn(),
    getAgingReport: vi.fn(),
    getTopDebtors: vi.fn(),
    getStatistics: vi.fn(),
  },
}))

import { receivablesService } from '@/services/bi/receivablesService'
import {
  overview as overviewFixture,
  receivablesEnvelope,
  receivablesList,
  renderReceivablesPage,
  statistics as statisticsFixture,
  topDebtors as topDebtorsFixture,
} from './receivablesTestUtils'
import ReceivablesDashboardPage from '../receivables/ReceivablesDashboardPage'

const kpi = (id: string) => within(screen.getByTestId(`receivables-kpi-${id}`))

describe('ReceivablesDashboardPage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getOverview).mockResolvedValue(
      receivablesEnvelope(overviewFixture()) as never,
    )
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(receivablesList()) as never,
    )
    vi.mocked(receivablesService.getStatistics).mockResolvedValue(
      receivablesEnvelope(statisticsFixture()) as never,
    )
    vi.mocked(receivablesService.getTopDebtors).mockResolvedValue(
      receivablesEnvelope(topDebtorsFixture()) as never,
    )
  })

  it('muestra la cartera real: summary del listado + overview', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    await screen.findByTestId('receivables-kpi-pending')

    expect(kpi('pending').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('overdue').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('accounts').getByText('3')).toBeInTheDocument()
    expect(kpi('overdueAccounts').getByText('3')).toBeInTheDocument()
    expect(kpi('highPriority').getByText('3')).toBeInTheDocument()
    expect(kpi('collectionRate').getByText('93,8%')).toBeInTheDocument()
    expect(kpi('settledAge').getByText('116')).toBeInTheDocument()
    // El overview (315.249,88) no se usa para el saldo: manda la suma real.
    expect(screen.queryByText('Gs. 315.249')).toBeNull()
  })

  it('muestra las cifras y el rango del período', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    await screen.findByTestId('receivables-kpi-billed')

    expect(kpi('billed').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('collected').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('periodCollectionRate').getByText('100%')).toBeInTheDocument()
    expect(kpi('periodDso').getByText('0')).toBeInTheDocument()
    expect(kpi('periodOverdueShare').getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Rango aplicado: 01 oct 2026 – 31 oct 2026')).toBeInTheDocument()
  })

  it('dibuja la serie semanal real y descarta el bucket posterior al fin', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    const trend = await screen.findByTestId('receivables-collection-trend')

    expect(within(trend).getByText('28 sept 2026')).toBeInTheDocument()
    expect(within(trend).getByText('12 oct 2026')).toBeInTheDocument()
    expect(within(trend).getAllByText('Gs. 1.254.100')).toHaveLength(2)
    expect(within(trend).getByText('-Gs. 41.860')).toBeInTheDocument()
    expect(within(trend).queryByText('02 nov 2026')).toBeNull()
  })

  it('muestra la antigüedad desde la venta con su base', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    await screen.findByTestId('receivables-aging-buckets')

    expect(screen.getByTestId('aging-bucket-over_90_days')).toHaveTextContent('Gs. 315.250')
    expect(screen.getByTestId('aging-bucket-over_90_days')).toHaveTextContent('3 cuentas')
    expect(screen.getByTestId('aging-bucket-over_90_days')).toHaveTextContent('100%')
    expect(screen.getByText('Saldo en tramos: Gs. 315.250')).toBeInTheDocument()
  })

  it('lista los principales deudores con link a la ficha de crédito', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    const table = await screen.findByTestId('receivables-top-debtors')

    const link = within(table).getByRole('link', { name: 'Erika Maciel' })
    expect(link).toHaveAttribute('href', '/receivables/client-profile/CL-ERIKA')
    expect(within(table).getByText('RENE PEREIRA')).toBeInTheDocument()
    expect(within(table).getByText('Malo')).toBeInTheDocument()
    expect(within(table).getByText('Regular')).toBeInTheDocument()
  })

  it('lista las cuentas recientes con su estado y prioridad', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    const table = await screen.findByTestId('receivables-recent')

    expect(within(table).getByRole('link', { name: 'SALE-1780338284-194' })).toHaveAttribute(
      'href',
      '/receivables/detail/SALE-1780338284-194',
    )
    expect(within(table).getByText('Erika Maciel')).toBeInTheDocument()
    expect(within(table).getByText('111')).toBeInTheDocument()
    expect(within(table).getByText('Alta')).toBeInTheDocument()
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
    expect(screen.getByTestId('receivables-view-all')).toHaveAttribute(
      'href',
      '/receivables/list',
    )
  })

  it('no renderiza cifras ni claims fabricados', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    await screen.findByTestId('receivables-kpi-pending')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/\blive\b/i)
    expect(body).not.toMatch(/objetivo/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('315250.38')
    expect(body).not.toContain('315249.88')
  })

  it('estados vacíos honestos cuando no hay cartera ni movimientos', async () => {
    vi.mocked(receivablesService.getOverview).mockResolvedValue(
      receivablesEnvelope(
        overviewFixture({
          total_pending: 0,
          total_overdue: 0,
          total_count: 0,
          overdue_count: 0,
          average_days_to_collect: 0,
          collection_rate: 0,
          aging_summary: {
            current: { amount: 0, count: 0, percentage: 0 },
            days_30_60: { amount: 0, count: 0, percentage: 0 },
            days_60_90: { amount: 0, count: 0, percentage: 0 },
            over_90_days: { amount: 0, count: 0, percentage: 0 },
          },
        }),
      ) as never,
    )
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          items: null,
          summary: {
            total_amount: 0,
            total_pending: 0,
            total_paid: 0,
            item_count: 0,
            high_priority_count: 0,
          },
        }),
      ) as never,
    )
    vi.mocked(receivablesService.getStatistics).mockResolvedValue(
      receivablesEnvelope(statisticsFixture({ collection_trend: null })) as never,
    )
    vi.mocked(receivablesService.getTopDebtors).mockResolvedValue(
      receivablesEnvelope(null) as never,
    )

    renderReceivablesPage(<ReceivablesDashboardPage />)

    expect(await screen.findByText('Sin movimientos semanales en el período')).toBeInTheDocument()
    expect(await screen.findByText('Sin deudores pendientes')).toBeInTheDocument()
    expect(await screen.findByText('Sin cuentas pendientes')).toBeInTheDocument()
    // Ceros reales, no "—": la API respondió cero.
    expect(kpi('pending').getByText('Gs. 0')).toBeInTheDocument()
  })

  it('un fallo en la cartera no envenena la sección del período', async () => {
    vi.mocked(receivablesService.getOverview).mockRejectedValue(new Error('overview caído'))
    renderReceivablesPage(<ReceivablesDashboardPage />)

    expect((await screen.findAllByText('overview caído')).length).toBeGreaterThan(0)
    // La sección de estadísticas resolvió y sigue mostrando sus cifras.
    expect(await screen.findByTestId('receivables-kpi-billed')).toBeInTheDocument()
    expect(kpi('billed').getByText('Gs. 1.475.500')).toBeInTheDocument()
  })

  it('el selector de período cambia la consulta de estadísticas', async () => {
    renderReceivablesPage(<ReceivablesDashboardPage />)
    await screen.findByTestId('receivables-kpi-billed')
    expect(receivablesService.getStatistics).toHaveBeenCalledWith('month')

    fireEvent.click(screen.getByRole('tab', { name: 'Este año' }))

    await waitFor(() =>
      expect(receivablesService.getStatistics).toHaveBeenCalledWith('year'),
    )
  })
})
