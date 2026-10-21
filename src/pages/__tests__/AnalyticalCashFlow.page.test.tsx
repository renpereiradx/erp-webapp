/**
 * F9 — Flujo de caja: importes base caja, conciliación con el desglose diario
 * y ausencia de saldos bancarios o insights fabricados.
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

vi.mock('@/services/bi/financialReportsService', () => ({
  financialReportsService: {
    getIncomeStatement: vi.fn(),
    getCashFlow: vi.fn(),
    getVat: vi.fn(),
    getTaxSummary: vi.fn(),
    getOverview: vi.fn(),
    getHealthScore: vi.fn(),
    getSalesLedger: vi.fn(),
    getPurchaseLedger: vi.fn(),
    getProrrateoHistory: vi.fn(),
    getProrrateoDetails: vi.fn(),
  },
}))

import { financialReportsService } from '@/services/bi/financialReportsService'
import { cashFlow as cashFlowFixture, financeEnvelope, renderFinancePage } from './financeTestUtils'
import AnalyticalCashFlowPage from '../finance/AnalyticalCashFlowPage'

const kpi = (id: string) => within(screen.getByTestId(`finance-kpi-${id}`))

describe('AnalyticalCashFlowPage (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialReportsService.getCashFlow).mockResolvedValue(
      financeEnvelope(cashFlowFixture()) as never,
    )
  })

  it('muestra caja inicial, cobros, pagos y caja al cierre', async () => {
    renderFinancePage(<AnalyticalCashFlowPage />, { route: '/finance/analytical-cash-flow' })
    await screen.findByTestId('finance-kpi-beginningCash')

    expect(kpi('beginningCash').getByText('Gs. 337.260')).toBeInTheDocument()
    expect(kpi('inflows').getByText('Gs. 1.517.360')).toBeInTheDocument()
    expect(kpi('outflows').getByText('Gs. 275.000')).toBeInTheDocument()
    expect(kpi('netCashChange').getByText('Gs. 1.242.360')).toBeInTheDocument()
    expect(kpi('endingCash').getByText('Gs. 1.579.620')).toBeInTheDocument()
  })

  it('detalla cobros del período y anteriores, pagos y flujo operativo', async () => {
    renderFinancePage(<AnalyticalCashFlowPage />, { route: '/finance/analytical-cash-flow' })
    const rows = await screen.findByTestId('finance-cash-flow-statement-rows')

    expect(within(rows).getByTestId('finance-statement-salesCollections')).toHaveTextContent(
      'Gs. 1.475.500',
    )
    expect(within(rows).getByTestId('finance-statement-priorCollections')).toHaveTextContent(
      'Gs. 41.860',
    )
    expect(within(rows).getByTestId('finance-statement-supplierPayments')).toHaveTextContent(
      '-Gs. 275.000',
    )
    expect(within(rows).getByTestId('finance-statement-operatingNet')).toHaveTextContent(
      'Gs. 1.242.360',
    )
    expect(within(rows).getByTestId('finance-statement-ending')).toHaveTextContent(
      'Gs. 1.579.620',
    )
  })

  it('ordena el desglose diario y reconcilia con el statement', async () => {
    renderFinancePage(<AnalyticalCashFlowPage />, { route: '/finance/analytical-cash-flow' })
    const daily = await screen.findByTestId('finance-cash-flow-daily')
    const rows = within(daily).getAllByRole('row').slice(1)

    expect(rows[0]).toHaveTextContent('01 oct')
    expect(rows[1]).toHaveTextContent('05 oct')
    expect(rows[2]).toHaveTextContent('06 oct')
    expect(rows[2]).toHaveTextContent('-Gs. 275.000')
    expect(screen.queryByTestId('finance-cash-flow-warning')).toBeNull()
    expect(screen.getByText('Cobros en el desglose diario')).toBeInTheDocument()
  })

  it('advierte cuando el payload no reconcilia, sin re-derivar cifras', async () => {
    vi.mocked(financialReportsService.getCashFlow).mockResolvedValue(
      financeEnvelope(cashFlowFixture({ ending_cash: 62260 })) as never,
    )
    renderFinancePage(<AnalyticalCashFlowPage />, { route: '/finance/analytical-cash-flow' })

    expect(await screen.findByTestId('finance-cash-flow-warning')).toBeInTheDocument()
    expect(kpi('endingCash').getByText('Gs. 62.260')).toBeInTheDocument()
  })

  it('no muestra bancos, insights ni montos en dólares', async () => {
    renderFinancePage(<AnalyticalCashFlowPage />, { route: '/finance/analytical-cash-flow' })
    await screen.findByTestId('finance-cash-flow-daily')

    for (const claim of ['Itaú', 'Sudameris', 'Continental', 'Insight', 'potencial de ahorro']) {
      expect(screen.queryByText(new RegExp(claim, 'i'))).toBeNull()
    }
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})
