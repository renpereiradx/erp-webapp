/**
 * F7 — Cuentas vencidas: resumen global, prioridades derivadas de los días
 * vencidos, paginación server-side y empty/error honestos.
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
import OverdueReceivablesPage from '../receivables/OverdueReceivablesPage'

const kpi = (id: string) => within(screen.getByTestId(`receivables-kpi-${id}`))

describe('OverdueReceivablesPage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getOverdue).mockResolvedValue(
      receivablesEnvelope(receivablesList()) as never,
    )
  })

  it('muestra el resumen del set completo y las filas vencidas', async () => {
    renderReceivablesPage(<OverdueReceivablesPage />)
    await screen.findByTestId('receivables-kpi-overduePending')

    expect(kpi('overduePending').getByText('Gs. 315.250')).toBeInTheDocument()
    expect(kpi('overdueAccounts').getByText('3')).toBeInTheDocument()
    expect(kpi('overdueHighPriority').getByText('3')).toBeInTheDocument()
    expect(kpi('overduePaid').getByText('Gs. 162.640')).toBeInTheDocument()

    const table = screen.getByTestId('receivables-overdue')
    expect(within(table).getByText('Erika Maciel')).toBeInTheDocument()
    expect(within(table).getByText('111')).toBeInTheDocument()
    expect(within(table).getByText('Alta')).toBeInTheDocument()
    expect(within(table).getByText('Vencida')).toBeInTheDocument()
  })

  it('pagina de a 10 con el total real del BE', async () => {
    vi.mocked(receivablesService.getOverdue).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          pagination: { page: 1, page_size: 10, total_items: 30, total_pages: 3 },
        }),
      ) as never,
    )
    renderReceivablesPage(<OverdueReceivablesPage />)
    await screen.findByTestId('receivables-overdue')

    expect(receivablesService.getOverdue).toHaveBeenCalledWith({ page: 1, page_size: 10 })
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(receivablesService.getOverdue).toHaveBeenCalledWith({ page: 2, page_size: 10 }),
    )
  })

  it('muestra prioridad media para 31-60 días y baja para 1-30', async () => {
    vi.mocked(receivablesService.getOverdue).mockResolvedValue(
      receivablesEnvelope(
        receivablesList({
          items: [
            receivable({ id: 'SALE-1', days_overdue: 45 }),
            receivable({ id: 'SALE-2', days_overdue: 12 }),
          ],
        }),
      ) as never,
    )
    renderReceivablesPage(<OverdueReceivablesPage />)
    const table = await screen.findByTestId('receivables-overdue')

    expect(within(table).getByText('Media')).toBeInTheDocument()
    expect(within(table).getByText('Baja')).toBeInTheDocument()
    expect(within(table).queryByText('Alta')).toBeNull()
  })

  it('empty honesto cuando no hay vencidas', async () => {
    vi.mocked(receivablesService.getOverdue).mockResolvedValue(
      receivablesEnvelope(receivablesList({ items: null })) as never,
    )
    renderReceivablesPage(<OverdueReceivablesPage />)

    expect(await screen.findByText('Sin cuentas vencidas')).toBeInTheDocument()
    expect(
      screen.getByText('Todas las cuentas están al día con su vencimiento.'),
    ).toBeInTheDocument()
  })

  it('muestra el error y permite reintentar', async () => {
    vi.mocked(receivablesService.getOverdue).mockRejectedValue(new Error('overdue caído'))
    renderReceivablesPage(<OverdueReceivablesPage />)

    expect((await screen.findAllByText('overdue caído')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })

  it('no fabrica cifras ni claims', async () => {
    renderReceivablesPage(<OverdueReceivablesPage />)
    await screen.findByTestId('receivables-overdue')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('315250.38')
    expect(screen.getByText(/Alta prioridad = más de 60 días vencidos/i)).toBeInTheDocument()
  })
})
