/**
 * F9 — Libros legales: libro de ventas/compras, filtros por rango y SIFEN,
 * paginación real y comprobantes no fiscales sin datos inventados.
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
  purchaseLedger as purchaseFixture,
  renderFinancePage,
  salesLedger as salesFixture,
} from './financeTestUtils'
import LegalBooksPage from '../finance/LegalBooksPage'

const kpi = (id: string) => within(screen.getByTestId(`finance-kpi-${id}`))

describe('LegalBooksPage (F9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialReportsService.getSalesLedger).mockResolvedValue(
      financeEnvelope(salesFixture()) as never,
    )
    vi.mocked(financialReportsService.getPurchaseLedger).mockResolvedValue(
      financeEnvelope(purchaseFixture()) as never,
    )
  })

  it('muestra el libro de ventas con su resumen y filas reales', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    const table = await screen.findByTestId('finance-legal-sales-table')

    expect(kpi('transactions').getByText('6')).toBeInTheDocument()
    expect(kpi('gross').getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(within(table).getByText('Erika Maciel')).toBeInTheDocument()
    expect(within(table).getByText('8000')).toBeInTheDocument()
    expect(within(table).getByText('No fiscal')).toBeInTheDocument()
    expect(within(table).getByText('Gs. 120.000')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 (6 items)')).toBeInTheDocument()
  })

  it('cambia al libro de compras y consulta el endpoint correspondiente', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    await screen.findByTestId('finance-legal-sales-table')

    fireEvent.click(screen.getByText('Compras'))
    const table = await screen.findByTestId('finance-legal-purchases-table')

    expect(within(table).getByText('PROVEEDOR TEST')).toBeInTheDocument()
    expect(within(table).getByText('Gs. 275.000')).toBeInTheDocument()
    expect(financialReportsService.getPurchaseLedger).toHaveBeenCalled()
  })

  it('aplica rango de fechas y filtros SIFEN con date-range', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    await screen.findByTestId('finance-legal-sales-table')
    vi.mocked(financialReportsService.getSalesLedger).mockClear()

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('Estado SIFEN'), { target: { value: 'APROBADO' } })
    fireEvent.change(screen.getByLabelText('CDC'), { target: { value: '123' } })
    fireEvent.click(screen.getByText('Aplicar'))

    await waitFor(() =>
      expect(financialReportsService.getSalesLedger).toHaveBeenLastCalledWith(
        expect.objectContaining({
          start_date: '2026-09-01',
          end_date: '2026-10-01',
          estado: 'APROBADO',
          cdc: '123',
        }),
      ),
    )
  })

  it('un rango inválido no consulta y muestra el aviso', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    await screen.findByTestId('finance-legal-sales-table')
    vi.mocked(financialReportsService.getSalesLedger).mockClear()

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-05' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByText('Aplicar'))

    expect(
      await screen.findByText('La fecha "Desde" no puede ser posterior a "Hasta".'),
    ).toBeInTheDocument()
    expect(financialReportsService.getSalesLedger).not.toHaveBeenCalled()
  })

  it('avisa cuando el rango está incompleto y no consulta', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    await screen.findByTestId('finance-legal-sales-table')

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } })

    expect(
      await screen.findByText('Completá ambas fechas o limpiá el rango para consultar por período.'),
    ).toBeInTheDocument()
  })

  it('no inventa comprobantes ni montos en dólares', async () => {
    renderFinancePage(<LegalBooksPage />, { route: '/finance/legal-books' })
    await screen.findByTestId('finance-legal-sales-table')

    expect(screen.queryByText(/#FAC-/)).toBeNull()
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})
