/**
 * SalesNew — borrador del carrito + guard de salida.
 *
 * Flujo cubierto: restauración al montar (scoping por operador, ítems de
 * pedidos de mostrador excluidos), write-through a localStorage, badge con
 * descarte, y diálogo de salida con las tres salidas (Guardar y salir /
 * Salir sin guardar / Seguir vendiendo) ejercitando el guard real de
 * window.history. El clear del carrito (F4) también limpia el storage.
 *
 * Mocks en la frontera: componentes pesados del tab y servicios (la página
 * es legacy de 2.5k líneas); EnhancedModal y Button REALES (el diálogo es el
 * sujeto bajo test). Los stores de borrador y auth son REALES.
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

vi.mock('@/features/sales/components/ProductSearchPanel', () => ({
  ProductSearchPanel: ({ onProductClick }: { onProductClick: (p: unknown, qty: number) => void }) => (
    <button
      data-testid="mock-add"
      onClick={() =>
        onProductClick(
          {
            id: 'P1',
            name: 'PRODUCTO TEST',
            sku: 'SKU-1',
            price: 100,
            stock: 10,
            base_unit: 'unit',
            taxRate: 0.1,
            has_valid_price: true,
            has_variants: false,
          },
          1,
        )
      }
    >
      agregar
    </button>
  ),
}))

vi.mock('@/features/sales/components/SalesCartGrid', () => ({
  SalesCartGrid: ({ items }: { items: Array<{ id: string; productId: string; name: string }> }) => (
    <div>
      {items.map((i) => (
        <div key={i.id} data-testid={`cart-item-${i.productId}`}>
          {i.name}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/features/sales/components/CheckoutSummaryPanel', () => ({
  CheckoutSummaryPanel: ({
    mergeSaleId,
    onClearCart,
  }: {
    mergeSaleId?: string | null
    onClearCart: () => void
  }) => (
    <div>
      <span data-testid="mock-merge">{mergeSaleId ?? 'none'}</span>
      <button data-testid="mock-clear" onClick={onClearCart}>
        limpiar
      </button>
    </div>
  ),
}))

vi.mock('@/features/sales/components/SaleCheckoutWizard', () => ({ SaleCheckoutWizard: () => null }))
vi.mock('@/features/sales/components/SalesHistoryView', () => ({ SalesHistoryView: () => null }))
vi.mock('@/features/sales/components/CancellationRequestsPanel', () => ({
  CancellationRequestsPanel: () => null,
}))
vi.mock('@/features/sales/components/EditItemModal', () => ({ EditItemModal: () => null }))
vi.mock('@/features/sales/components/CancelSaleModal', () => ({ CancelSaleModal: () => null }))
vi.mock('@/features/sales/components/RequestCancellationModal', () => ({
  RequestCancellationModal: () => null,
}))
vi.mock('@/features/sales/components/SaleSuccessPrintModal', () => ({
  SaleSuccessPrintModal: () => null,
}))
vi.mock('@/features/sales/components/VariantSelectorModal', () => ({
  VariantSelectorModal: () => null,
}))
vi.mock('@/components/ui/ToastContainer', () => ({ default: () => null }))

vi.mock('@/features/sales/hooks/useBarcodeScanner', () => ({
  useBarcodeScanner: () => ({ handleBarcodeScan: vi.fn() }),
}))
vi.mock('@/features/sales/hooks/useSalesShortcuts', () => ({ useSalesShortcuts: () => {} }))
vi.mock('@/features/sales/hooks/useCancellationRequests', () => ({
  useCancellationRequests: () => ({
    requests: [],
    total: 0,
    loading: false,
    error: null,
    statusFilter: 'PENDING',
    setStatusFilter: vi.fn(),
    refresh: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    actingId: null,
    pendingCount: 0,
  }),
}))
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
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
  useProductSearch: () => ({ results: [], search: vi.fn(), clear: vi.fn() }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))
vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))
vi.mock('@/store/useBusinessConfigStore', () => ({
  useReservationsEnabled: () => false,
}))
vi.mock('@/features/counterorders/hooks/useCounterOrderCheckout', () => ({
  useCounterOrderCheckout: () => ({
    continueOrder: vi.fn(),
    getClaimedOrderId: () => null,
    hasClaimedOrder: () => false,
    releaseClaimed: vi.fn(),
    convertAfterCheckout: vi.fn(),
  }),
}))
vi.mock('@/features/counterorders/hooks/useCounterOrders', () => ({
  useClientActiveCounterOrders: () => ({ data: [] }),
}))

const saleStoreState = {
  sales: [],
  salesBranchId: null,
  loading: false,
  createSale: vi.fn(),
  fetchSalesByDateRange: vi.fn(),
  fetchSalesByClientName: vi.fn(),
  clearSales: vi.fn(),
  cancelSale: vi.fn(),
}
vi.mock('@/store/useSaleStore', () => ({
  default: (sel?: (s: typeof saleStoreState) => unknown) =>
    sel ? sel(saleStoreState) : saleStoreState,
}))
vi.mock('@/services/saleService', () => ({
  default: {
    calculateLocalTotals: () => ({
      subtotal: 100,
      discount_total: 0,
      exento: 0,
      total: 110,
      tax_buckets: {},
    }),
    getPendingSalesByClient: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getSaleById: vi.fn(),
    addProductsToSale: vi.fn(),
    previewSaleCancellation: vi.fn(),
    requestSaleCancellation: vi.fn(),
  },
}))
vi.mock('@/services/clientService', () => ({
  clientService: { getById: vi.fn() },
}))
vi.mock('@/services/api', () => ({
  default: { get: vi.fn().mockResolvedValue({}) },
}))
vi.mock('@/services/paymentMethodService', () => ({
  PaymentMethodService: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/currencyService', () => ({
  CurrencyService: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/productService', () => ({
  productService: { getProductUnitPrices: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/features/unit-conversions/services/unitConversionsService', () => ({
  unitConversionsService: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/services/reservationService', () => ({
  reservationService: { getProducts: vi.fn(), manageReserve: vi.fn() },
}))

import SalesNew from '../SalesNew'
import { useSalesCartDraftStore, type SalesCartDraftData } from '@/store/useSalesCartDraftStore'
import useAuthStore from '@/store/useAuthStore'
import type { CartItem } from '@/features/sales/types/cart'

const draftItem = (over: Partial<CartItem> = {}): CartItem => ({
  id: 'IT-1',
  productId: 'P1',
  name: 'PRODUCTO TEST',
  quantity: 2,
  price: 100,
  originalPrice: 100,
  discount: 0,
  discountType: 'amount',
  discountInput: 0,
  discountReason: '',
  taxRate: 0.1,
  unit: 'unit',
  ...over,
})

const seedDraft = (data: SalesCartDraftData) => useSalesCartDraftStore.getState().saveDraft('USER_OP', data)

const storedDraft = () => {
  const raw = localStorage.getItem('sales-cart-draft')
  return raw ? (JSON.parse(raw).state as { userId: string | null; data: SalesCartDraftData | null }) : null
}

const renderPage = () => render(<MemoryRouter><SalesNew /></MemoryRouter>)

/** Render + un producto agregado desde el buscador mockeado. */
const renderWithItem = async () => {
  const user = userEvent.setup()
  renderPage()
  await user.click(screen.getByTestId('mock-add'))
  await screen.findByTestId('cart-item-P1')
  return user
}

describe('SalesNew — borrador del carrito y guard de salida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useSalesCartDraftStore.setState({ userId: null, data: null, savedAt: null })
    useAuthStore.setState({ user: { id: 'USER_OP' } as never })
    // Tests previos pudieron navegar: volver a la raíz (sin parches tras cleanup).
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useAuthStore.setState({ user: null })
  })

  it('restaura el borrador al montar: ítems, badge y contexto de venta en merge', () => {
    seedDraft({ items: [draftItem()], client: null, saleId: 'SALE-77', saleBranchId: 3 })
    renderPage()

    expect(screen.getByTestId('cart-item-P1')).toBeInTheDocument()
    expect(screen.getByTestId('sales-cart-draft-badge')).toBeInTheDocument()
    expect(screen.getByTestId('mock-merge')).toHaveTextContent('SALE-77')
  })

  it('NO restaura el borrador de otro operador (terminales compartidas)', () => {
    seedDraft({ items: [draftItem()], client: null, saleId: null, saleBranchId: null })
    useSalesCartDraftStore.setState({ userId: 'USER_OTHER' })
    renderPage()

    expect(screen.queryByTestId('cart-item-P1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sales-cart-draft-badge')).not.toBeInTheDocument()
  })

  it('los ítems de pedidos de mostrador NO se restauran (el claim vive en memoria)', () => {
    seedDraft({
      items: [draftItem(), draftItem({ id: 'IT-CO', productId: 'P2', name: 'PEDIDO MOSTRADOR', isFromCounterOrder: true })],
      client: null,
      saleId: null,
      saleBranchId: null,
    })
    renderPage()

    expect(screen.getByTestId('cart-item-P1')).toBeInTheDocument()
    expect(screen.queryByTestId('cart-item-P2')).not.toBeInTheDocument()
  })

  it('agregar un producto persiste el borrador (write-through a localStorage)', async () => {
    await renderWithItem()

    await waitFor(() => expect(storedDraft()?.data?.items).toHaveLength(1))
    expect(storedDraft()?.userId).toBe('USER_OP')
  })

  it('el badge permite descartar el borrador completo (ítems + contexto)', async () => {
    seedDraft({ items: [draftItem()], client: null, saleId: 'SALE-77', saleBranchId: 3 })
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Descartar borrador' }))

    expect(screen.queryByTestId('cart-item-P1')).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-merge')).toHaveTextContent('none')
    await waitFor(() => expect(storedDraft()?.data).toBeNull())
  })

  it('limpiar el carrito (F4) limpia el borrador', async () => {
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
    expect(screen.queryByTestId('sales-cart-exit-dialog')).not.toBeInTheDocument()
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

  it('"Seguir vendiendo" cancela y la guardia sigue bloqueando', async () => {
    const user = await renderWithItem()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Seguir vendiendo' }))
    expect(window.location.pathname).not.toBe('/dashboard')
    expect(screen.queryByTestId('sales-cart-exit-dialog')).not.toBeInTheDocument()

    // Segundo intento: sigue bloqueado (cancel no abre la barrera).
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })
    expect(screen.getByTestId('sales-cart-exit-dialog')).toBeInTheDocument()
  })
})
