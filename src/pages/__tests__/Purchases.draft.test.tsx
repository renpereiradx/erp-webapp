/**
 * Purchases — borrador del carrito + guard de salida.
 *
 * Flujo cubierto: restauración al montar (scoping por operador; ítems +
 * proveedor + notas juntos), write-through a localStorage, badge con
 * descarte, y diálogo de salida con las tres salidas (Guardar y salir /
 * Salir sin guardar / Seguir editando) ejercitando el guard real de
 * window.history. Limpiar el carrito también limpia el storage.
 *
 * Mocks en la frontera: componentes pesados del feature y servicios (la
 * lógica vive en usePurchasesLogic); EnhancedModal y Button REALES (el
 * diálogo es el sujeto bajo test). El store de borrador y el auth store son
 * REALES. El flujo "agregar" pasa por handleProductSelect →
 * handleConfirmAddProduct reales (el modal sólo los dispara).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/lib/i18n', () => ({
  // Firma real (i18n/index.js): t(key, fallback?, vars?) aceptando t(key, vars).
  useI18n: () => ({
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = typeof fallbackOrVars === 'string' ? maybeVars : fallbackOrVars
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/features/purchases/components/PurchaseCartTable', () => ({
  PurchaseCartTable: ({
    purchaseItems,
    selectedSupplier,
    purchaseNotes,
    setPurchaseItems,
    getSupplierName,
  }: {
    purchaseItems: Array<{ id: string; product_id: string; name: string }>
    selectedSupplier: unknown
    purchaseNotes: string
    setPurchaseItems: (updater: (prev: unknown[]) => unknown[]) => void
    getSupplierName: (s: { first_name?: string; name?: string }) => string
  }) => (
    <div>
      {purchaseItems.map((i) => (
        <div key={i.id} data-testid={`cart-item-${i.product_id}`}>
          {i.name}
        </div>
      ))}
      <span data-testid="mock-supplier">
        {selectedSupplier ? getSupplierName(selectedSupplier as { first_name?: string }) : 'none'}
      </span>
      <span data-testid="mock-notes">{purchaseNotes}</span>
      <button data-testid="mock-clear" onClick={() => setPurchaseItems(() => [])}>
        limpiar
      </button>
    </div>
  ),
}))

vi.mock('@/features/purchases/components/PurchaseProductModal', () => ({
  // El flujo real en tres pasos (selección → cantidad → confirmar), cada uno
  // con su re-render: los handlers del hook leen estado del closure de su
  // render, así que confirmar en el mismo tick que la cantidad no ve el valor.
  PurchaseProductModal: (logic: {
    handleProductSelect: (p: unknown) => Promise<void>
    setModalQuantity: (q: string) => void
    handleConfirmAddProduct: () => void
    modalSelectedProduct: unknown
  }) => (
    <div>
      <span data-testid="mock-selected">{logic.modalSelectedProduct ? 'yes' : 'no'}</span>
      <button
        data-testid="mock-select"
        onClick={() =>
          logic.handleProductSelect({
            id: 'P1',
            name: 'PAPA KG',
            sku: 'SKU-1',
            variant_id: null,
            current_cost: 5000,
          })
        }
      >
        seleccionar
      </button>
      <button data-testid="mock-qty" onClick={() => logic.setModalQuantity('2')}>
        cantidad
      </button>
      <button data-testid="mock-confirm" onClick={() => logic.handleConfirmAddProduct()}>
        confirmar
      </button>
    </div>
  ),
}))

vi.mock('@/features/purchases/components/PurchaseTotalsCard', () => ({
  PurchaseTotalsCard: () => null,
}))
vi.mock('@/features/purchases/components/PurchaseHistoryTab', () => ({
  PurchaseHistoryTab: () => null,
}))
vi.mock('@/features/purchases/components/PurchaseCancelModal', () => ({
  PurchaseCancelModal: () => null,
}))
vi.mock('@/features/purchases/components/PurchaseConfirmationModal', () => ({
  PurchaseConfirmationModal: () => null,
}))
vi.mock('@/features/purchases/components/PurchaseCheckoutWizard', () => ({
  PurchaseCheckoutWizard: () => null,
}))
vi.mock('@/features/transfers/components/CreateTransferModal', () => ({ default: () => null }))
vi.mock('@/components/ui/ToastContainer', () => ({ default: () => null }))

vi.mock('@/features/purchases/hooks/usePurchasesShortcuts', () => ({
  usePurchasesShortcuts: () => {},
}))
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    errorFrom: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}))
vi.mock('@/hooks/useProductSearch', () => ({
  useProductSearch: () => ({ results: [], isSearching: false, search: vi.fn(), clear: vi.fn() }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))
vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))
vi.mock('@/services/supplierService', () => ({
  default: { searchByName: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/paymentMethodService', () => ({
  PaymentMethodService: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/currencyService', () => ({
  CurrencyService: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/purchaseService', () => ({
  default: {
    getTaxRates: vi.fn().mockResolvedValue({ success: false, data: [] }),
    getPurchasesByDateRange: vi
      .fn()
      .mockResolvedValue({ success: true, data: [], pagination: {} }),
    calculatePurchaseTotals: () => ({ subtotal: 10000, tax_total: 0, total_amount: 10000 }),
    createEnhancedPurchaseOrder: vi.fn(),
    getPurchaseById: vi.fn(),
    cancelPurchaseOrderWithDetails: vi.fn(),
    previewPurchaseOrderCancellation: vi.fn(),
  },
}))
vi.mock('@/services/productService', () => ({
  productService: {
    getForPurchase: vi.fn().mockResolvedValue({
      product_id: 'P1',
      name: 'PAPA KG',
      barcode: 'SKU-1',
      base_unit: 'unit',
      purchase_price: 5000,
      stock_quantity: 10,
      sale_price: 8000,
      applicable_tax_rate: null,
      has_variant: false,
      unit_costs_summary: [],
    }),
  },
}))
vi.mock('@/services/purchasePaymentsMvpService', () => ({
  purchasePaymentsMvpService: { registerPayment: vi.fn() },
  fetchPurchasesBySupplierTerm: vi.fn().mockResolvedValue({ success: true, data: [] }),
}))
vi.mock('@/features/unit-conversions/services/unitConversionsService', () => ({
  unitConversionsService: { getAll: vi.fn().mockResolvedValue([]) },
}))

import Purchases from '../Purchases'
import {
  usePurchasesCartDraftStore,
  type PurchasesCartDraftData,
} from '@/store/usePurchasesCartDraftStore'
import useAuthStore from '@/store/useAuthStore'
import type { PurchaseItem } from '@/features/purchases/types'

const draftItem = (over: Partial<PurchaseItem> = {}): PurchaseItem => ({
  id: 'IT-1',
  product_id: 'P1',
  name: 'PAPA KG',
  sku: 'SKU-1',
  quantity: 2,
  unit_price: 5000,
  unit: 'unit',
  profit_pct: 30,
  sale_price: 6500,
  pricing_mode: 'margin',
  tax_rate_id: null,
  tax_rate: 10,
  price_includes_tax: true,
  ...over,
})

const seedDraft = (data: PurchasesCartDraftData) =>
  usePurchasesCartDraftStore.getState().saveDraft('USER_OP', data)

const storedDraft = () => {
  const raw = localStorage.getItem('purchases-cart-draft')
  return raw
    ? (JSON.parse(raw).state as { userId: string | null; data: PurchasesCartDraftData | null })
    : null
}

/** Render esperando el settling del load inicial (async, fuera de act si no). */
const renderPage = async () => {
  let utils: ReturnType<typeof render>
  await act(async () => {
    utils = render(<MemoryRouter><Purchases /></MemoryRouter>)
  })
  return utils!
}

/** Render + un ítem agregado vía el flujo real (selección → cantidad → confirmar). */
const renderWithItem = async () => {
  const user = userEvent.setup()
  await renderPage()
  await user.click(screen.getByTestId('mock-select'))
  // El select es async (fetch del producto): acomodar sus microtasks dentro de act.
  await act(async () => {})
  await waitFor(() => expect(screen.getByTestId('mock-selected')).toHaveTextContent('yes'))
  await user.click(screen.getByTestId('mock-qty'))
  await user.click(screen.getByTestId('mock-confirm'))
  await screen.findByTestId('cart-item-P1')
  return user
}

describe('Purchases — borrador del carrito y guard de salida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    usePurchasesCartDraftStore.setState({ userId: null, data: null, savedAt: null })
    useAuthStore.setState({ user: { id: 'USER_OP' } as never })
    // Tests previos pudieron navegar: volver a la raíz (sin parches tras cleanup).
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useAuthStore.setState({ user: null })
  })

  it('restaura el borrador al montar: ítems, proveedor, notas y badge', async () => {
    seedDraft({
      items: [draftItem()],
      supplier: { id: 'S1', first_name: 'PROVEEDOR X' },
      notes: 'nota de compra',
    })
    await renderPage()

    expect(screen.getByTestId('cart-item-P1')).toBeInTheDocument()
    expect(screen.getByTestId('purchases-cart-draft-badge')).toBeInTheDocument()
    expect(screen.getByTestId('mock-supplier')).toHaveTextContent('PROVEEDOR X')
    expect(screen.getByTestId('mock-notes')).toHaveTextContent('nota de compra')
  })

  it('NO restaura el borrador de otro operador (terminales compartidas)', async () => {
    seedDraft({
      items: [draftItem()],
      supplier: { id: 'S1', first_name: 'PROVEEDOR X' },
      notes: '',
    })
    usePurchasesCartDraftStore.setState({ userId: 'USER_OTHER' })
    await renderPage()

    expect(screen.queryByTestId('cart-item-P1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('purchases-cart-draft-badge')).not.toBeInTheDocument()
  })

  it('agregar un ítem persiste el borrador (write-through a localStorage)', async () => {
    await renderWithItem()

    await waitFor(() => expect(storedDraft()?.data?.items).toHaveLength(1))
    expect(storedDraft()?.userId).toBe('USER_OP')
  })

  it('el badge permite descartar el borrador completo (ítems + proveedor + notas)', async () => {
    seedDraft({
      items: [draftItem()],
      supplier: { id: 'S1', first_name: 'PROVEEDOR X' },
      notes: 'nota de compra',
    })
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Descartar borrador' }))

    expect(screen.queryByTestId('cart-item-P1')).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-supplier')).toHaveTextContent('none')
    expect(screen.getByTestId('mock-notes')).toHaveTextContent('')
    await waitFor(() => expect(storedDraft()?.data).toBeNull())
  })

  it('limpiar el carrito limpia el borrador', async () => {
    const user = await renderWithItem()

    await user.click(screen.getByTestId('mock-clear'))

    await waitFor(() => expect(storedDraft()?.data).toBeNull())
  })

  it('"Guardar y salir" conserva el borrador y permite la navegación', async () => {
    const user = await renderWithItem()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Guardar y salir' }))

    expect(window.location.pathname).toBe('/dashboard')
    expect(screen.queryByTestId('purchases-cart-exit-dialog')).not.toBeInTheDocument()
    expect(storedDraft()?.data?.items).toHaveLength(1)
  })

  it('"Salir sin guardar" limpia el borrador y permite la navegación', async () => {
    const user = await renderWithItem()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }))

    expect(window.location.pathname).toBe('/dashboard')
    expect(storedDraft()?.data).toBeNull()
  })

  it('"Seguir editando" cancela y la guardia sigue bloqueando', async () => {
    const user = await renderWithItem()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(window.location.pathname).not.toBe('/dashboard')
    expect(screen.queryByTestId('purchases-cart-exit-dialog')).not.toBeInTheDocument()

    // Segundo intento: sigue bloqueado (cancel no abre la barrera).
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })
    expect(screen.getByTestId('purchases-cart-exit-dialog')).toBeInTheDocument()
  })
})
