/**
 * F8 — Lista maestra de CxP: totales globales del filtro, tabla real,
 * filtros/orden server-side y estados honestos (rango inválido, empty).
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
  payablesEnvelope,
  payablesList,
  renderPayablesPage,
} from './payablesTestUtils'
import InvoicesMasterListPage from '../payables/InvoicesMasterListPage'

describe('InvoicesMasterListPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(payablesService.getList).mockResolvedValue(
      payablesEnvelope(payablesList()) as never,
    )
  })

  it('muestra el resumen del filtro y la factura con su link al detalle', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    const table = await screen.findByTestId('payables-list-table')

    expect(screen.getByTestId('payables-kpi-listPending').textContent).toContain(
      'Gs. 6.014.250',
    )
    expect(screen.getByTestId('payables-kpi-listCount').textContent).toContain('3')
    const invoice = within(table).getByRole('link', { name: 'PO-2' })
    expect(invoice).toHaveAttribute('href', '/payables/detail/PO-2')
    const supplier = within(table).getByRole('link', { name: 'Protek PRO' })
    expect(supplier).toHaveAttribute('href', '/payables/suppliers/SP-PROTEK/analysis')
    expect(within(table).getByText('281 d vencidos')).toBeInTheDocument()
    expect(within(table).getByText('Urgente')).toBeInTheDocument()
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
    expect(within(table).getByText('compra + 30 d')).toBeInTheDocument()
  })

  it('ordena server-side al clickear un encabezado', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')
    vi.mocked(payablesService.getList).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Proveedor' }))
    await waitFor(() =>
      expect(payablesService.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'supplier', sort_order: 'ASC', page: 1 }),
      ),
    )
  })

  it('filtra por estado y prioridad con los valores del BE y vuelve a página 1', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')
    vi.mocked(payablesService.getList).mockClear()

    fireEvent.click(screen.getByText('Vencidas'))
    await waitFor(() =>
      expect(payablesService.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'OVERDUE', page: 1 }),
      ),
    )

    fireEvent.click(screen.getByText('Urgentes'))
    await waitFor(() =>
      expect(payablesService.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'OVERDUE', priority: 'URGENT' }),
      ),
    )
  })

  it('aplica el texto con Enter y lo recorta', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')
    vi.mocked(payablesService.getList).mockClear()

    const search = screen.getByPlaceholderText('Orden, proveedor, RUC o CI')
    fireEvent.change(search, { target: { value: '  acme  ' } })
    fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' })

    await waitFor(() =>
      expect(payablesService.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'acme' }),
      ),
    )
  })

  it('un rango inválido bloquea la consulta y muestra el aviso', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')
    vi.mocked(payablesService.getList).mockClear()

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-05' } })
    await waitFor(() => expect(payablesService.getList).toHaveBeenCalledTimes(1))
    vi.mocked(payablesService.getList).mockClear()

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } })

    expect(await screen.findByText('Rango de fechas inválido')).toBeInTheDocument()
    expect(screen.queryByTestId('payables-list-table')).toBeNull()
    expect(payablesService.getList).not.toHaveBeenCalled()
  })

  it('muestra un empty honesto cuando el filtro no trae filas', async () => {
    vi.mocked(payablesService.getList).mockResolvedValue(
      payablesEnvelope({
        ...payablesList({ items: null }),
        pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
      }) as never,
    )
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })

    expect(
      await screen.findByText('Sin cuentas por pagar pendientes'),
    ).toBeInTheDocument()
  })

  it('pagina server-side con el total real del BE', async () => {
    vi.mocked(payablesService.getList).mockResolvedValue(
      payablesEnvelope({
        ...payablesList(),
        pagination: { page: 1, page_size: 10, total_items: 25, total_pages: 3 },
      }) as never,
    )
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')

    expect(screen.getByText('Página 1 de 3 (25 items)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(payablesService.getList).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('no fabrica identificadores ni montos en dólares', async () => {
    renderPayablesPage(<InvoicesMasterListPage />, { route: '/payables/invoices' })
    await screen.findByTestId('payables-list-table')

    expect(screen.queryByText(/#FAC-/)).toBeNull()
    expect(screen.queryByText(/\$/)).toBeNull()
    // El identificador real del fixture queda visible, sin truncar.
    expect(screen.getByText('PO-2')).toBeInTheDocument()
  })
})
