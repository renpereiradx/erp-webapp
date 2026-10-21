/**
 * F9 — Estado de Resultados: KPIs, conceptos, costo de ventas, desgloses y
 * nota de gastos no modelados (sin ceros falsos).
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
import { financeEnvelope, incomeStatement as incomeFixture, renderFinancePage } from './financeTestUtils'
import ProfitAndLossPage from '../finance/ProfitAndLossPage'

const kpi = (id: string) => within(screen.getByTestId(`finance-kpi-${id}`))

describe('ProfitAndLossPage (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialReportsService.getIncomeStatement).mockResolvedValue(
      financeEnvelope(incomeFixture()) as never,
    )
  })

  it('muestra KPIs y el estado de resultados bruto', async () => {
    renderFinancePage(<ProfitAndLossPage />, { route: '/finance/profit-and-loss' })
    await screen.findByTestId('finance-kpi-netSales')

    expect(kpi('netSales').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(kpi('cogs').getByText('Gs. 945.000')).toBeInTheDocument()
    expect(kpi('grossProfit').getByText('Gs. 530.500')).toBeInTheDocument()
    expect(kpi('grossMargin').getByText('36%')).toBeInTheDocument()
    expect(screen.queryByTestId('finance-kpi-operatingExpenses')).toBeNull()

    const rows = screen.getByTestId('finance-pnl-statement-rows')
    expect(within(rows).getByTestId('finance-statement-grossSales')).toHaveTextContent(
      'Gs. 1.475.500',
    )
    expect(within(rows).getByTestId('finance-statement-cogs')).toHaveTextContent(
      '-Gs. 945.000',
    )
    expect(within(rows).getByTestId('finance-statement-netIncome')).toHaveTextContent(
      'Resultado (utilidad bruta)',
    )
  })

  it('aclara que gastos, devoluciones y descuentos no están modelados', async () => {
    renderFinancePage(<ProfitAndLossPage />, { route: '/finance/profit-and-loss' })
    await screen.findByTestId('finance-pnl-statement-rows')

    expect(screen.getAllByText(/no modela gastos operativos/).length).toBeGreaterThan(0)
    expect(screen.getByText(/El inventario inicial y las devoluciones de compra/)).toBeInTheDocument()
    expect(screen.queryByText('Gastos operativos')).toBeNull()
    expect(screen.queryByText('Devoluciones')).toBeNull()
  })

  it('muestra el bloque de costo de ventas con inventario final', async () => {
    renderFinancePage(<ProfitAndLossPage />, { route: '/finance/profit-and-loss' })
    await screen.findByText('Inventario final a costo')
    const cost = screen.getByTestId('finance-pnl-cost')

    expect(within(cost).getByText('Compras del período')).toBeInTheDocument()
    expect(within(cost).getByText('Inventario final a costo')).toBeInTheDocument()
    expect(within(cost).getByText('Gs. 13.377.100')).toBeInTheDocument()
  })

  it('desglosa categorías y medios de pago reales', async () => {
    renderFinancePage(<ProfitAndLossPage />, { route: '/finance/profit-and-loss' })
    const categories = await screen.findByTestId('finance-pnl-category-table')

    expect(within(categories).getByText('Alquiler de Canchas')).toBeInTheDocument()
    expect(screen.getByText('Sin método registrado')).toBeInTheDocument()
  })

  it('cuando el backend modela gastos, muestra el resultado operativo', async () => {
    vi.mocked(financialReportsService.getIncomeStatement).mockResolvedValue(
      financeEnvelope(
        incomeFixture({
          expenses: {
            operating: 100,
            salaries: 50,
            rent: 0,
            utilities: 0,
            marketing: 0,
            other: 0,
            total: 150,
            by_category: [],
          },
          operating_income: 530350,
          net_income: 530350,
        }),
      ) as never,
    )
    renderFinancePage(<ProfitAndLossPage />, { route: '/finance/profit-and-loss' })
    const rows = await screen.findByTestId('finance-pnl-statement-rows')

    expect(within(rows).getByTestId('finance-statement-expenses')).toHaveTextContent('Gs. 150')
    expect(within(rows).getByTestId('finance-statement-operatingIncome')).toBeInTheDocument()
    expect(kpi('operatingExpenses')).toBeDefined()
  })
})
