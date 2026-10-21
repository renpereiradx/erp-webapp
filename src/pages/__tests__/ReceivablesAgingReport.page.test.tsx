/**
 * F7 — Reporte de antigüedad: tramos globales, detalle por cliente paginado,
 * columna "sin clasificar" solo cuando el contrato la exige y empty/error
 * honestos.
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
  agingReport,
  receivablesEnvelope,
  renderReceivablesPage,
} from './receivablesTestUtils'
import ReceivablesAgingReportPage from '../receivables/ReceivablesAgingReportPage'

const kpi = (id: string) => within(screen.getByTestId(`receivables-kpi-${id}`))

describe('ReceivablesAgingReportPage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getAgingReport).mockResolvedValue(
      receivablesEnvelope(agingReport()) as never,
    )
  })

  it('muestra los totales globales y los tramos reales', async () => {
    renderReceivablesPage(<ReceivablesAgingReportPage />)
    await screen.findByTestId('receivables-kpi-agingTotal')

    expect(kpi('agingTotal').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('agingClients').getByText('2')).toBeInTheDocument()
    expect(kpi('agingOver90').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(screen.getByTestId('aging-bucket-over_90_days')).toHaveTextContent('100%')
    expect(screen.getByText(/Generado el 20 oct 2026/)).toBeInTheDocument()
  })

  it('lista el detalle por cliente con link a la ficha de crédito', async () => {
    renderReceivablesPage(<ReceivablesAgingReportPage />)
    const table = await screen.findByTestId('receivables-aging-report')

    expect(within(table).getByRole('link', { name: 'Erika Maciel' })).toHaveAttribute(
      'href',
      '/receivables/client-profile/CL-ERIKA',
    )
    expect(within(table).getByText('RENE PEREIRA')).toBeInTheDocument()
    expect(within(table).getAllByText('Gs. 314.600').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('Gs. 650').length).toBeGreaterThan(0)
    // El total cuadra con los tramos: no se agrega la columna "sin clasificar".
    expect(within(table).queryByText('Sin clasificar')).toBeNull()
    expect(kpi('agingTotal').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(screen.queryByTestId('receivables-kpi-agingUnclassified')).toBeNull()
  })

  it('muestra "sin clasificar" solo cuando el total no cuadra', async () => {
    vi.mocked(receivablesService.getAgingReport).mockResolvedValue(
      receivablesEnvelope(
        agingReport({
          total_amount: 400000,
          by_client: [
            {
              client_id: 'CL-ERIKA',
              client_name: 'Erika Maciel',
              current: 0,
              days_30_60: 0,
              days_60_90: 0,
              over_90_days: 314600,
              total: 400000,
            },
          ],
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesAgingReportPage />)
    const table = await screen.findByTestId('receivables-aging-report')

    expect(within(table).getByText('Sin clasificar')).toBeInTheDocument()
    expect(within(table).getByText('Gs. 85.400')).toBeInTheDocument()
    expect(screen.getByTestId('receivables-kpi-agingUnclassified')).toBeInTheDocument()
  })

  it('pagina el detalle con el total de clientes del BE', async () => {
    vi.mocked(receivablesService.getAgingReport).mockResolvedValue(
      receivablesEnvelope(agingReport({ total_clients: 30 })) as never,
    )
    renderReceivablesPage(<ReceivablesAgingReportPage />)
    await screen.findByTestId('receivables-aging-report')

    expect(receivablesService.getAgingReport).toHaveBeenCalledWith({ page: 1, page_size: 10 })
    expect(screen.getByText('Página 1 de 3 (30 items)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(receivablesService.getAgingReport).toHaveBeenCalledWith({ page: 2, page_size: 10 }),
    )
  })

  it('empty honesto sin cartera', async () => {
    vi.mocked(receivablesService.getAgingReport).mockResolvedValue(
      receivablesEnvelope(
        agingReport({
          by_client: null,
          total_amount: 0,
          total_clients: 0,
          summary: {
            current: { amount: 0, count: 0, percentage: 0 },
            days_30_60: { amount: 0, count: 0, percentage: 0 },
            days_60_90: { amount: 0, count: 0, percentage: 0 },
            over_90_days: { amount: 0, count: 0, percentage: 0 },
          },
        }),
      ) as never,
    )
    renderReceivablesPage(<ReceivablesAgingReportPage />)

    expect(await screen.findByText('Sin cartera pendiente')).toBeInTheDocument()
  })

  it('muestra el error del endpoint y permite reintentar', async () => {
    vi.mocked(receivablesService.getAgingReport).mockRejectedValue(new Error('aging caído'))
    renderReceivablesPage(<ReceivablesAgingReportPage />)

    expect((await screen.findAllByText('aging caído')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })

  it('no fabrica cifras ni claims', async () => {
    renderReceivablesPage(<ReceivablesAgingReportPage />)
    await screen.findByTestId('receivables-aging-report')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('315250.38')
  })
})
