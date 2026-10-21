/**
 * F7 — Detalle de cuenta: saldos, estado, historial de pagos, 404 como estado
 * propio y sin mostrar el `due_date` sintetizado por el backend.
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
import { receivable, receivablesEnvelope, renderReceivablesPage } from './receivablesTestUtils'
import ReceivableDetailPage from '../receivables/ReceivableDetailPage'

const PAYMENT = {
  id: 'PAY-1',
  amount: 100000,
  payment_date: '2026-09-15T10:00:00Z',
  payment_method: 'CASH',
  reference: 'REF-1',
  processed_by: 'ADMIN',
}

const renderDetail = () =>
  renderReceivablesPage(<ReceivableDetailPage />, {
    route: '/receivables/detail/SALE-1780338284-194',
    path: '/receivables/detail/:id',
  })

describe('ReceivableDetailPage (F7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receivablesService.getById).mockResolvedValue(
      receivablesEnvelope(receivable({ payment_history: [PAYMENT] })) as never,
    )
  })

  it('muestra la cuenta y su historial de pagos real', async () => {
    renderDetail()
    const summary = await screen.findByTestId('receivables-detail-summary')

    expect(screen.getByRole('heading', { name: 'Cuenta SALE-1780338284-194' })).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: 'Erika Maciel' })).toHaveAttribute(
      'href',
      '/receivables/client-profile/CL-ERIKA',
    )
    expect(within(summary).getByText('Vencida')).toBeInTheDocument()
    expect(within(summary).getByText('01 jun 2026')).toBeInTheDocument()
    expect(within(summary).getByText('111')).toBeInTheDocument()
    expect(within(summary).getAllByText('Gs. 314.600')).toHaveLength(2)

    const payments = screen.getByTestId('receivables-payments')
    expect(within(payments).getByText(/15 sept 2026/)).toBeInTheDocument()
    expect(within(payments).getByText('Gs. 100.000')).toBeInTheDocument()
    expect(within(payments).getByText('CASH')).toBeInTheDocument()
    expect(within(payments).getByText('REF-1')).toBeInTheDocument()
    expect(within(payments).getByText('ADMIN')).toBeInTheDocument()
  })

  it('no muestra el vencimiento sintetizado (venta + 30 días)', async () => {
    renderDetail()
    await screen.findByTestId('receivables-detail-summary')

    // due_date del payload = 01 jul 2026, pero el days_overdue real es 111:
    // mostrar esa fecha contradiría la cifra.
    expect(screen.queryByText('01 jul 2026')).toBeNull()
    expect(screen.getByText(/Los días vencidos usan el vencimiento de la orden/i)).toBeInTheDocument()
  })

  it('sin pagos muestra el empty honesto', async () => {
    vi.mocked(receivablesService.getById).mockResolvedValue(
      receivablesEnvelope(receivable({ payment_history: null })) as never,
    )
    renderDetail()

    expect(await screen.findByText('Sin pagos registrados')).toBeInTheDocument()
    expect(screen.getByText('La cuenta todavía no tiene pagos asociados.')).toBeInTheDocument()
  })

  it('un 404 del backend se muestra como "Cuenta no encontrada"', async () => {
    vi.mocked(receivablesService.getById).mockRejectedValue({
      code: 'NOT_FOUND',
      status: 404,
      message: 'no se encontró la cuenta por cobrar SALE-404',
    })
    renderDetail()

    expect(await screen.findByText('Cuenta no encontrada')).toBeInTheDocument()
    expect(
      screen.getByText(
        'La cuenta SALE-1780338284-194 no existe o no pertenece a la sucursal activa.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al listado' })).toBeInTheDocument()
    expect(screen.queryByTestId('error-retry')).toBeNull()
  })

  it('un error genérico muestra ErrorState con reintento', async () => {
    vi.mocked(receivablesService.getById).mockRejectedValue(new Error('detail caído'))
    renderDetail()

    expect(await screen.findByText('detail caído')).toBeInTheDocument()
    expect(screen.getByTestId('error-retry')).toBeInTheDocument()
  })

  it('no fabrica cifras ni claims en el detalle', async () => {
    renderDetail()
    await screen.findByTestId('receivables-detail-summary')
    const body = document.body.textContent ?? ''

    expect(body).not.toMatch(/\$/)
    expect(body).not.toMatch(/en tiempo real/i)
    expect(body).not.toMatch(/NaN/)
    expect(body).not.toContain('314600')
  })
})
