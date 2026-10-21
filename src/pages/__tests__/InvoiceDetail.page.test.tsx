/**
 * F8 — Detalle de cuenta por pagar: resumen, historial real de pagos, 404
 * como estado propio y aclaración del vencimiento sintético (compra + 30 d).
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
import { payable, payablesEnvelope, renderPayablesPage } from './payablesTestUtils'
import InvoiceDetailPage from '../payables/InvoiceDetailPage'

const route = { route: '/payables/detail/PO-2', path: '/payables/detail/:id' }

const payment = {
  id: 'PAY-1',
  amount: 100000,
  payment_date: '2026-03-01T10:00:00Z',
  payment_method: 'TRANSFER',
  reference: 'REF-1',
  processed_by: 'ADMIN ADMIN',
}

describe('InvoiceDetailPage (F8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra saldos, estado, prioridad y aclara el vencimiento', async () => {
    vi.mocked(payablesService.getById).mockResolvedValue(
      payablesEnvelope({ ...payable({ paid_amount: 100000, pending_amount: 400000 }), payment_history: [payment] }) as never,
    )
    renderPayablesPage(<InvoiceDetailPage />, route)

    const card = await screen.findByTestId('payables-detail-card')
    expect(within(card).getByText('Gs. 500.000')).toBeInTheDocument()
    expect(within(card).getByText('Gs. 400.000')).toBeInTheDocument()
    expect(within(card).getByText('Vencida')).toBeInTheDocument()
    expect(within(card).getByText('Urgente')).toBeInTheDocument()
    expect(within(card).getByText('281 vencidos')).toBeInTheDocument()
    expect(
      within(card).getByText(/El vencimiento no es una condición del proveedor/),
    ).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Protek PRO' })).toHaveAttribute(
      'href',
      '/payables/suppliers/SP-PROTEK/analysis',
    )
  })

  it('lista el historial de pagos real', async () => {
    vi.mocked(payablesService.getById).mockResolvedValue(
      payablesEnvelope({ ...payable(), payment_history: [payment] }) as never,
    )
    renderPayablesPage(<InvoiceDetailPage />, route)

    const table = await screen.findByTestId('payables-payment-history')
    expect(within(table).getByText('TRANSFER')).toBeInTheDocument()
    expect(within(table).getByText('REF-1')).toBeInTheDocument()
    expect(within(table).getByText('ADMIN ADMIN')).toBeInTheDocument()
    expect(within(table).getByText('Gs. 100.000')).toBeInTheDocument()
  })

  it('sin pagos muestra el empty honesto', async () => {
    vi.mocked(payablesService.getById).mockResolvedValue(
      payablesEnvelope({ ...payable(), payment_history: null }) as never,
    )
    renderPayablesPage(<InvoiceDetailPage />, route)

    expect(await screen.findByText('Sin pagos registrados')).toBeInTheDocument()
  })

  it('el 404 del BE se muestra como cuenta no encontrada, no como fallo', async () => {
    vi.mocked(payablesService.getById).mockRejectedValue({ status: 404 })
    renderPayablesPage(<InvoiceDetailPage />, route)

    expect(await screen.findByText('Cuenta no encontrada')).toBeInTheDocument()
    expect(screen.queryByText('No se pudieron cargar los datos')).toBeNull()
  })

  it('no inventa números de factura ni muestra el JSON del contacto', async () => {
    vi.mocked(payablesService.getById).mockResolvedValue(
      payablesEnvelope({
        ...payable(),
        supplier_contact: '{"phone":"021"}',
        payment_history: [],
      }) as never,
    )
    renderPayablesPage(<InvoiceDetailPage />, route)
    await screen.findByTestId('payables-detail-card')

    expect(screen.queryByText(/#FAC-/)).toBeNull()
    expect(screen.queryByText(/phone/)).toBeNull()
  })
})
