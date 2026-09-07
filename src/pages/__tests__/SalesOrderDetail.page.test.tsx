/**
 * Detalle de venta acotado (addendum 2026-09-07, perfil vendedor puro) —
 * /cobros-ventas/:saleId visto desde Historial.
 *
 * Contrato por permiso:
 * - VNDR01 v2 (sin cash:write / sales:cancel / sifen:read): solo venta —
 *   cliente, productos y totales. Sin cobros, anulación ni panel fiscal.
 * - Cajero (+ cash:write): veRegistrar Cobro, Método de Pago, Saldo
 *   Pendiente e Historial de Cobros; sigue sin anular.
 * - Avanzado (+ sales:cancel + sifen:read): además Anular Venta y panel
 *   fiscal SIFEN.
 *
 * Mocks en la frontera: saleService, salePaymentService, clientService,
 * AuthContext, useToast, i18n (firma real, fallback español) y los modales/
 * panel pesados como stubs. lucide-react NO se mockea
 * (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SalesOrderDetail from '../SalesOrderDetail'

const VENDOR_PERMS = [
  'sales:read',
  'sales:write',
  'products:read',
  'clients:read',
  'clients:write',
  'budgets:read',
  'budgets:write',
  'payments:read',
  'tax:read',
  'branches:read',
  'dashboard:read',
  'settings:read',
]

const mockHasPermission = vi.fn<(permission: string) => boolean>()

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    // Firma real: t(key, fallback?, vars?) — la página también llama
    // t(key, {vars}) sin fallback (ej. sales.detail.orderLine).
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mockHasPermission(permission) }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}))

vi.mock('@/services/saleService', () => ({
  saleService: {
    getSaleById: vi.fn(),
    getSalePaymentStatus: vi.fn(),
    previewSaleCancellation: vi.fn(),
    revertSale: vi.fn(),
  },
}))

vi.mock('@/services/salePaymentService', () => ({
  salePaymentService: {
    processSalePaymentWithCashRegister: vi.fn(),
  },
}))

vi.mock('@/services/clientService', () => ({
  clientService: {
    getById: vi.fn(),
  },
}))

vi.mock('@/components/sales/RegisterSalePaymentModal', () => ({
  default: () => <div data-testid='register-payment-modal' />,
}))

vi.mock('@/features/fiscal/components/CancelSaleModal', () => ({
  default: () => <div data-testid='cancel-sale-modal' />,
}))

vi.mock('@/features/fiscal/components/SaleFiscalPanel', () => ({
  default: () => <div data-testid='sale-fiscal-panel' />,
}))

import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'

const SALE_RESPONSE = {
  success: true,
  data: {
    sale: {
      sale_id: 'V-0001',
      status: 'PENDING',
      total_amount: 122000,
      client_name: 'Carlos García',
      client_id: 'CL-1',
      user_name: 'Marce',
      currency: 'PYG',
      sale_date: '2026-09-07T10:00:00Z',
    },
    details: [
      {
        product_name: 'Coca-Cola 2L',
        quantity: 2,
        unit_price: 61000,
        tax_amount: 0,
        total_with_tax: 122000,
      },
    ],
  },
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/cobros-ventas/V-0001']}>
      <Routes>
        <Route path='/cobros-ventas/:saleId' element={<SalesOrderDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SalesOrderDetail — detalle acotado por permiso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(saleService.getSaleById).mockResolvedValue(SALE_RESPONSE)
    vi.mocked(saleService.getSalePaymentStatus).mockResolvedValue({
      success: true,
      data: { total_paid: 0, balance_due: 122000, payments: [] },
    } as never)
    vi.mocked(clientService.getById).mockResolvedValue({
      name: 'Carlos García',
      document_id: '1234567',
    } as never)
  })

  it('vendedor puro: ve cliente, productos y total; sin cobros, anulación ni fiscal', async () => {
    mockHasPermission.mockImplementation(p => VENDOR_PERMS.includes(p))

    renderDetail()

    await waitFor(() => expect(screen.getByText('Detalle de Venta')).toBeInTheDocument())

    // Lo que el vendedor SÍ ve
    expect(screen.getByText('Carlos García')).toBeInTheDocument()
    expect(screen.getAllByText('Coca-Cola 2L').length).toBeGreaterThan(0) // desktop + mobile
    expect(screen.getByText('Total de Venta')).toBeInTheDocument()

    // Lo que NO ve (cobranza/anulación/fiscal)
    expect(screen.queryByText('Registrar Cobro')).not.toBeInTheDocument()
    expect(screen.queryByText('Anular Venta')).not.toBeInTheDocument()
    expect(screen.queryByText('Saldo Pendiente')).not.toBeInTheDocument()
    expect(screen.queryByText('Historial de Cobros')).not.toBeInTheDocument()
    expect(screen.queryByText('Método de Pago')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sale-fiscal-panel')).not.toBeInTheDocument()
  })

  it('cajero (+ cash:write): ve los cobros; sigue sin anular', async () => {
    mockHasPermission.mockImplementation(p => [...VENDOR_PERMS, 'cash:write', 'cash:read'].includes(p))

    renderDetail()

    await waitFor(() => expect(screen.getByText('Registrar Cobro')).toBeInTheDocument())

    expect(screen.getByText('Método de Pago')).toBeInTheDocument()
    expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Historial de Cobros')).toBeInTheDocument()
    expect(screen.queryByText('Anular Venta')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sale-fiscal-panel')).not.toBeInTheDocument()
  })

  it('rol avanzado (+ sales:cancel + sifen:read): anula y ve el panel fiscal', async () => {
    mockHasPermission.mockImplementation(p =>
      [...VENDOR_PERMS, 'cash:write', 'sales:cancel', 'sifen:read'].includes(p),
    )

    renderDetail()

    await waitFor(() => expect(screen.getByText('Anular Venta')).toBeInTheDocument())

    expect(screen.getByText('Registrar Cobro')).toBeInTheDocument()
    expect(screen.getByTestId('sale-fiscal-panel')).toBeInTheDocument()
  })
})
