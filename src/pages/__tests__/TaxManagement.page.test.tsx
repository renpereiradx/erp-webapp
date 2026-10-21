/**
 * F9 — Gestión de IVA: débito/crédito, resumen fiscal, detalle mensual y
 * prorrateo con detalle bajo demanda. Sin códigos crudos ni retenciones
 * inventadas.
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
  prorrateoDetails as detailsFixture,
  prorrateoHistory as historyFixture,
  renderFinancePage,
  taxSummary as taxFixture,
  vat as vatFixture,
} from './financeTestUtils'
import { TaxManagementPage } from '../finance/TaxManagementPage'

const kpi = (id: string) => within(screen.getByTestId(`finance-kpi-${id}`))

describe('TaxManagementPage (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialReportsService.getVat).mockResolvedValue(
      financeEnvelope(vatFixture()) as never,
    )
    vi.mocked(financialReportsService.getTaxSummary).mockResolvedValue(
      financeEnvelope(taxFixture()) as never,
    )
    vi.mocked(financialReportsService.getProrrateoHistory).mockResolvedValue(
      financeEnvelope(historyFixture()) as never,
    )
    vi.mocked(financialReportsService.getProrrateoDetails).mockResolvedValue(
      financeEnvelope(detailsFixture()) as never,
    )
  })

  it('muestra IVA débito, crédito y saldo con su estado traducido', async () => {
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })
    await screen.findByTestId('finance-kpi-vatDebit')

    expect(kpi('vatDebit').getByText('Gs. 88.682')).toBeInTheDocument()
    expect(kpi('vatCredit').getByText('Gs. 25.000')).toBeInTheDocument()
    expect(kpi('vatPayable').getByText('Gs. 63.682')).toBeInTheDocument()
    expect(kpi('vatCarryover').getByText('Gs. 0')).toBeInTheDocument()
    expect(screen.getAllByText('A pagar').length).toBeGreaterThan(0)
    expect(screen.queryByText('TO_PAY')).toBeNull()
  })

  it('muestra la obligación fiscal y oculta retenciones en 0', async () => {
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })
    await screen.findByTestId('finance-kpi-taxLiability')

    expect(kpi('taxLiability').getByText('Gs. 63.682')).toBeInTheDocument()
    expect(kpi('taxCredits').getByText('Gs. 0')).toBeInTheDocument()
    expect(kpi('netTaxPosition').getByText('Gs. 63.682')).toBeInTheDocument()
    expect(screen.queryByTestId('finance-kpi-netRetentions')).toBeNull()
  })

  it('desglosa IVA de ventas y compras', async () => {
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })
    const sales = await screen.findByTestId('finance-tax-sales-rows')

    expect(within(sales).getByTestId('finance-statement-base10')).toHaveTextContent(
      'Gs. 425.500',
    )
    expect(within(sales).getByTestId('finance-statement-vat10')).toHaveTextContent(
      'Gs. 38.682',
    )
    expect(within(sales).getByTestId('finance-statement-totalVat')).toHaveTextContent(
      'Gs. 88.682',
    )
    const purchases = screen.getByTestId('finance-tax-purchases-rows')
    expect(within(purchases).getByTestId('finance-statement-totalVat')).toHaveTextContent(
      'Gs. 25.000',
    )
  })

  it('muestra los detalles mensuales con sus estados', async () => {
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })
    const monthlyVat = await screen.findByTestId('finance-tax-monthly-vat-table')

    expect(within(monthlyVat).getByText('oct 2026')).toBeInTheDocument()
    expect(within(monthlyVat).getByText('A pagar')).toBeInTheDocument()
    const monthlyTax = screen.getByTestId('finance-tax-monthly-tax-table')
    expect(within(monthlyTax).getAllByText('Gs. 63.682').length).toBeGreaterThan(0)
  })

  it('lista prorrateos y carga el detalle al seleccionar', async () => {
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })
    const history = await screen.findByTestId('finance-prorrateo-table')

    expect(within(history).getByText('90,9%')).toBeInTheDocument()
    expect(within(history).getByText('Procesado')).toBeInTheDocument()
    expect(screen.queryByTestId('finance-prorrateo-details')).toBeNull()

    fireEvent.click(screen.getByTestId('finance-prorrateo-select-1'))
    await waitFor(() =>
      expect(financialReportsService.getProrrateoDetails).toHaveBeenCalledWith(1),
    )
    const details = await screen.findByTestId('finance-prorrateo-details')
    expect(within(details).getByText('42')).toBeInTheDocument()
    expect(within(details).getByText('Indirecto')).toBeInTheDocument()
    expect(screen.queryByText('PROCESSED')).toBeNull()
  })

  it('sin prorrateos muestra el empty honesto', async () => {
    vi.mocked(financialReportsService.getProrrateoHistory).mockResolvedValue(
      financeEnvelope(null) as never,
    )
    renderFinancePage(<TaxManagementPage />, { route: '/finance/tax-management' })

    expect(await screen.findByText('Sin prorrateos registrados')).toBeInTheDocument()
  })
})
