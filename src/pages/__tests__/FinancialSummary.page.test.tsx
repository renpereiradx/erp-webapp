/**
 * F9 — Resumen financiero: overview (ingresos/compras/caja/balance), P&L
 * bruto, health score, desgloses y ausencia de utilidad contable fabricada.
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
import {
  financeEnvelope,
  health as healthFixture,
  incomeStatement as incomeFixture,
  overview as overviewFixture,
  renderFinancePage,
} from './financeTestUtils'
import FinancialSummaryPage from '../finance/FinancialSummaryPage'

const kpi = (id: string) => within(screen.getByTestId(`finance-kpi-${id}`))

describe('FinancialSummaryPage (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialReportsService.getOverview).mockResolvedValue(
      financeEnvelope(overviewFixture()) as never,
    )
    vi.mocked(financialReportsService.getIncomeStatement).mockResolvedValue(
      financeEnvelope(incomeFixture()) as never,
    )
    vi.mocked(financialReportsService.getHealthScore).mockResolvedValue(
      financeEnvelope(healthFixture()) as never,
    )
  })

  it('muestra ingresos, compras, caja y balance con nombres honestos', async () => {
    renderFinancePage(<FinancialSummaryPage />)
    await screen.findByTestId('finance-kpi-revenue')

    expect(kpi('revenue').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('purchases').getByText('Gs. 275.000')).toBeInTheDocument()
    expect(kpi('revenueMinusPurchases').getByText('Gs. 1.200.500')).toBeInTheDocument()
    expect(kpi('cashPosition').getByText('Gs. 337.260')).toBeInTheDocument()
    expect(kpi('receivables').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('payables').getByText('Gs. 3.110.450')).toBeInTheDocument()
    expect(kpi('workingCapital').getByText('Gs. 10.919.160')).toBeInTheDocument()
    expect(screen.getByText(/Compras no son gastos/)).toBeInTheDocument()
  })

  it('muestra el P&L bruto y el margen real', async () => {
    renderFinancePage(<FinancialSummaryPage />)
    await screen.findByTestId('finance-kpi-netSales')

    expect(kpi('netSales').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('cogs').getByText('Gs. 945.000')).toBeInTheDocument()
    expect(kpi('grossProfit').getByText('Gs. 530.500')).toBeInTheDocument()
    expect(kpi('grossMargin').getByText('36%')).toBeInTheDocument()
  })

  it('muestra el health score y ratios calculados', async () => {
    renderFinancePage(<FinancialSummaryPage />)
    await screen.findByTestId('finance-health-panel')

    expect(screen.getByText('Excelente')).toBeInTheDocument()
    expect(within(screen.getByTestId('finance-health-panel')).getByText('95')).toBeInTheDocument()
    expect(kpi('ratingCurrentRatio').getByText('4,51×')).toBeInTheDocument()
    expect(kpi('ratingQuickRatio').getByText('0,21×')).toBeInTheDocument()
    expect(screen.getByText(/DSO, DPO y rotaciones no se muestran/)).toBeInTheDocument()
  })

  it('desglosa categorías y medios de pago (unknown traducido)', async () => {
    renderFinancePage(<FinancialSummaryPage />)
    const categories = await screen.findByTestId('finance-summary-category-table')

    expect(within(categories).getByText('Electrónicos')).toBeInTheDocument()
    expect(within(categories).getByText('Gs. 1.050.000')).toBeInTheDocument()
    expect(within(categories).getByText('71,2%')).toBeInTheDocument()
    expect(screen.getByText('Sin método registrado')).toBeInTheDocument()
    expect(screen.queryByText('unknown')).toBeNull()
  })

  it('no presenta utilidad neta ni montos en dólares', async () => {
    renderFinancePage(<FinancialSummaryPage />)
    await screen.findByTestId('finance-summary-links')

    expect(screen.queryByText(/Utilidad neta/i)).toBeNull()
    expect(screen.queryByText(/\$/)).toBeNull()
    expect(screen.queryByText(/Powered/i)).toBeNull()
  })

  it('aísla el error de una sección: el P&L sigue visible', async () => {
    vi.mocked(financialReportsService.getOverview).mockRejectedValue(new Error('boom'))
    renderFinancePage(<FinancialSummaryPage />)

    await screen.findByTestId('finance-kpi-netSales')
    expect(screen.queryByTestId('finance-kpi-revenue')).toBeNull()
    expect(screen.getAllByText('No se pudieron cargar los datos').length).toBeGreaterThan(0)
  })
})
