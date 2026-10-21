/**
 * F7 — Lista maestra de CxC: resumen global del filtro, orden/paginación
 * server-side (whitelist T3), filtro por estado sin sentinela 'all', empty
 * honesto y ausencia de cifras fabricadas.
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
  receivable,
  receivablesEnvelope,
  receivablesList,
  renderReceivablesPage,
} from './receivablesTestUtils'
import ReceivablesListPage from '../receivables/ReceivablesListPage'

const kpi = (id: string) => within(screen.getByTestId(`receivables-kpi-${id}`))

describe('ReceivablesListPage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(receivablesList()) as never,
    )
  })

  it('muestra el resumen global del filtro y sus filas reales', async () => {
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-kpi-listPending')

    expect(kpi('listTotal').getByText('Gs. 477.890')).toBeInTheDocument()
    expect(kpi('listPending').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('listPaid').getByText('Gs. 162.640')).toBeInTheDocument()
    expect(kpi('listCount').getByText('3')).toBeInTheDocument()
    expect(kpi('listHighPriority').getByText('3')).toBeInTheDocument()

    const table = screen.getByTestId('receivables-list')
    expect(within(table).getByRole('link', { name: 'SALE-1780338284-194' })).toHaveAttribute(
      'href',
      '/receivables/detail/SALE-1780338284-194',
    )
    expect(within(table).getByRole('link', { name: 'Erika Maciel' })).toHaveAttribute(
      'href',
      '/receivables/client-profile/CL-ERIKA',
    )
    expect(within(table).getAllByText('Gs. 314.600')).toHaveLength(2)
    expect(within(table).getByText('Gs. 0')).toBeInTheDocument()
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
    expect(within(table).getByText('Alta')).toBeInTheDocument()
  })

  it('pide el orden inicial (fecha DESC) y pagina de a 10', async () => {
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')

    expect(receivablesService.getList).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      page_size: 10,
      sort_by: 'date',
      sort_order: 'DESC',
    })
  })

  it('ordena server-side por cliente (ASC por defecto) y vuelve a página 1', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          pagination: { page: 2, page_size: 10, total_items: 30, total_pages: 3 },
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Cliente' }))

    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, sort_by: 'client', sort_order: 'ASC' }),
      ),
    )
    const header = await screen.findByRole('columnheader', { name: /Cliente/ })
    expect(header).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(await screen.findByRole('button', { name: 'Ordenar por Cliente (ascendente)' }))
    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'client', sort_order: 'DESC' }),
      ),
    )
  })

  it('ordena por días vencidos y por pendiente con la whitelist del BE', async () => {
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Días vencidos' }))
    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'days_overdue', sort_order: 'DESC' }),
      ),
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Ordenar por Pendiente' }))
    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'amount', sort_order: 'DESC' }),
      ),
    )
  })

  it('filtra por estado y resetea la página', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          pagination: { page: 2, page_size: 10, total_items: 30, total_pages: 3 },
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')

    fireEvent.click(screen.getByRole('tab', { name: 'Vencidas' }))

    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OVERDUE', page: 1 }),
      ),
    )
  })

  it('pagina server-side con el total real del BE', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          pagination: { page: 1, page_size: 10, total_items: 30, total_pages: 3 },
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')

    expect(screen.getByText('Página 1 de 3 (30 items)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(receivablesService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('empty honesto según haya filtro o no', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(receivablesList({ items: null })) as never,
    )
    renderReceivablesPage(<ReceivablesListPage />)

    expect(await screen.findByText('Sin cuentas pendientes')).toBeInTheDocument()

    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(receivablesList({ items: null })) as never,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Parciales' }))

    expect(await screen.findByText('Sin cuentas para este filtro')).toBeInTheDocument()
  })

  it('muestra el error del endpoint y permite reintentar', async () => {
    vi.mocked(receivablesService.getList).mockRejectedValue(new Error('list caído'))
    renderReceivablesPage(<ReceivablesListPage />)

    expect((await screen.findAllByText('list caído')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })

  it('no fabrica cifras ni claims', async () => {
    renderReceivablesPage(<ReceivablesListPage />)
    await screen.findByTestId('receivables-list')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('315250.38')
    // La nota de superposición de filtros está presente.
    expect(screen.getByText(/se superponen/i)).toBeInTheDocument()
  })

  it('renderiza varias filas con montos y estados distintos', async () => {
    vi.mocked(receivablesService.getList).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          items: [
            receivable(),
            receivable({
              id: 'SALE-2',
              sale_order_id: 'SALE-2',
              client_id: 'CL-RENE',
              client_name: 'RENE PEREIRA',
              pending_amount: 650.38,
              paid_amount: 133640,
              days_overdue: 121,
              status: 'PARTIAL',
            }),
          ],
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesListPage />)
    const table = await screen.findByTestId('receivables-list')

    expect(within(table).getByText('RENE PEREIRA')).toBeInTheDocument()
    expect(within(table).getByText('Gs. 650')).toBeInTheDocument()
    expect(within(table).getByText('Parcial')).toBeInTheDocument()
    expect(within(table).queryByText('133.640')).toBeNull()
    expect(within(table).getByText('Gs. 133.640')).toBeInTheDocument()
  })
})
