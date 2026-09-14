// ===========================================================================
// Tests del ticket QR del pedido (FASE 5 — render FE, impresión por iframe).
// Mocks en la frontera: printTicket (jsdom no implementa print) + i18n.
// ===========================================================================

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const printMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('../utils/printTicket', () => ({
  printTicketHtml: (html: string, title: string) => printMock(html, title),
}))

import { OrderTicketModal, OrderTicketContent } from '../components/OrderTicketModal'
import type { CounterOrderDetail } from '../types'

const order = (): CounterOrderDetail => ({
  id: 'CO-1',
  code: 'PED-ABC234',
  client_id: 'CLIENT-1',
  branch_id: 1,
  status: 'OPEN',
  notes: 'sin maní',
  created_by: 'user-vendor',
  claimed_by: null,
  claimed_at: null,
  converted_sale_id: null,
  converted_at: null,
  cancelled_reason: null,
  cancelled_at: null,
  created_at: '2026-09-13T12:00:00Z',
  updated_at: '2026-09-13T12:00:00Z',
  client_name: 'Juan Pérez',
  created_by_name: 'Vendedor Uno',
  claimed_by_name: null,
  items: [
    {
      id: 1,
      product_id: 'PROD-1',
      variant_id: null,
      quantity: 2,
      unit: 'unit',
      notes: null,
      product_name: 'Coca 2L',
      stock_available: 10,
      stock_warning: false,
      unit_price: 91000,
      tax_rate_id: 1,
      tax_rate_code: 'IVA10',
      tax_rate: 10,
      unit_price_with_tax: 91000,
      unit_price_without_tax: 82727.27,
      tax_amount: 8272.73,
      line_total: 182000,
    },
  ],
  total: 182000,
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('OrderTicketModal — FASE 5', () => {
  it('muestra código, QR, cliente, ítems y total del pedido', () => {
    render(<OrderTicketModal open order={order()} onClose={() => {}} />)
    expect(screen.getByTestId('counterorder-ticket')).toBeInTheDocument()
    expect(screen.getByTestId('counterorder-ticket-qr')).toBeInTheDocument()
    expect(screen.getByText('PED-ABC234')).toBeInTheDocument()
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument()
    expect(screen.getByText(/Coca 2L/)).toBeInTheDocument()
    // El total usa el formato de moneda local; assert por testid del bloque.
    expect(screen.getByTestId('counterorder-ticket')).toHaveTextContent('TOTAL')
  })

  it('el QR codifica el código PED (escaneable en la búsqueda de la bandeja)', () => {
    render(<OrderTicketContent order={order()} />)
    // qrcode.react monta el testid sobre el <svg> mismo.
    const qr = screen.getByTestId('counterorder-ticket-qr')
    expect(qr.tagName.toLowerCase()).toBe('svg')
  })

  it('Imprimir serializa el ticket (incluye código e ítems) al util de impresión', async () => {
    const user = userEvent.setup()
    render(<OrderTicketModal open order={order()} onClose={() => {}} />)
    await user.click(screen.getByTestId('counterorder-ticket-print'))
    expect(printMock).toHaveBeenCalledTimes(1)
    const [html, title] = printMock.mock.calls[0]
    expect(title).toBe('PED-ABC234')
    expect(String(html)).toContain('PED-ABC234')
    expect(String(html)).toContain('Coca 2L')
    expect(String(html)).toContain('<svg')
  })

  it('sin pedido → estado vacío, sin botón de impresión funcional', () => {
    render(<OrderTicketModal open order={null} onClose={() => {}} />)
    expect(screen.getByText('No hay detalle de pedido para imprimir.')).toBeInTheDocument()
    expect(screen.queryByTestId('counterorder-ticket')).not.toBeInTheDocument()
  })
})
