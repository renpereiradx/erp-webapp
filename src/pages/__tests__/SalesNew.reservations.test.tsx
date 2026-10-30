/**
 * SalesNew — reservas del cliente dentro del SaleCheckoutWizard.
 *
 * Regresión (2026-10-30): al avanzar en el paso Reservas la lista
 * pendingReservations se consume (los ítems pasan al carrito); cancelar el
 * wizard y vaciar el carrito dejaba el paso vacío al reabrir, porque el único
 * fetch vivía en handleSelectClient. Ahora el wizard refetchea las reservas
 * CONFIRMED del cliente al abrirse. Cubre también el leak cross-cliente: las
 * reservas del cliente anterior ya no quedan listadas para el nuevo.
 *
 * Mocks en la frontera (patrón SalesNew.draft.test.tsx): el wizard expone
 * disparadores (seleccionar cliente / toggle / aplicar / cerrar) y contadores
 * para assertar el estado que la página le inyecta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Cliente que el wizard mockeado "elige" en el paso Cliente (mutable desde el test).
const h = vi.hoisted(() => ({
  nextClient: { id: 'C1', name: 'CLIENTE TEST' } as { id: string; name: string },
  getReservationReport: vi.fn(),
}))

vi.mock('@/lib/i18n', () => ({
  // Firma real (i18n/index.js): t(key, fallback?, vars?).
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
  ProductSearchPanel: () => null,
}))
vi.mock('@/features/sales/components/SalesCartGrid', () => ({
  SalesCartGrid: () => null,
}))
vi.mock('@/features/sales/components/CheckoutSummaryPanel', () => ({
  CheckoutSummaryPanel: ({ onCheckout }: { onCheckout: () => void }) => (
    <button data-testid="mock-checkout" onClick={onCheckout}>
      cobrar
    </button>
  ),
}))

// Wizard mockeado: expone el estado que recibe y disparadores del flujo real
// de la página (selección de cliente, toggle+aplicar reservas, cierre).
vi.mock('@/features/sales/components/SaleCheckoutWizard', () => ({
  SaleCheckoutWizard: ({
    isOpen,
    client,
    pendingReservations,
    onClientSelect,
    onToggleReservation,
    onAddReservations,
    onClose,
  }: any) =>
    isOpen ? (
      <div data-testid="wizard-mock">
        <span data-testid="wizard-client">{client ? String(client.id) : 'none'}</span>
        <span data-testid="wizard-res-count">{pendingReservations.length}</span>
        <button data-testid="wizard-select-client" onClick={() => onClientSelect(h.nextClient)}>
          elegir cliente
        </button>
        <button
          data-testid="wizard-toggle-res"
          onClick={() => {
            const first = pendingReservations[0]
            if (first) onToggleReservation(Number(first.reserve_id || first.id))
          }}
        >
          marcar reserva
        </button>
        <button data-testid="wizard-add-res" onClick={onAddReservations}>
          aplicar reservas
        </button>
        <button data-testid="wizard-close" onClick={onClose}>
          cerrar
        </button>
      </div>
    ) : null,
}))
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
  useReservationsEnabled: () => true,
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
      subtotal: 0,
      discount_total: 0,
      exento: 0,
      total: 0,
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
  default: { get: vi.fn().mockResolvedValue({}), getReservationReport: h.getReservationReport },
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
  reservationService: { getProducts: vi.fn().mockResolvedValue([]), manageReserve: vi.fn() },
}))

import SalesNew from '../SalesNew'
import { useSalesCartDraftStore } from '@/store/useSalesCartDraftStore'
import useAuthStore from '@/store/useAuthStore'

const RES_C1 = [
  {
    reserve_id: 501,
    client_id: 'C1',
    status: 'CONFIRMED',
    product_name: 'Cancha Pádel',
    total_amount: 50000,
    start_time: '2026-10-30T10:00:00Z',
  },
]

const renderPage = () => render(<MemoryRouter><SalesNew /></MemoryRouter>)

describe('SalesNew — reservas del cliente en el wizard de checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useSalesCartDraftStore.setState({ userId: null, data: null, savedAt: null })
    useAuthStore.setState({ user: { id: 'USER_OP' } as never })
    window.history.replaceState(null, '', '/')
    h.nextClient = { id: 'C1', name: 'CLIENTE TEST' }
    h.getReservationReport.mockResolvedValue(RES_C1)
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useAuthStore.setState({ user: null })
  })

  it('reabrir el wizard con el cliente ya elegido refetchea sus reservas (regresión: cancelar + vaciar carrito las perdía)', async () => {
    const user = userEvent.setup()
    renderPage()

    // Abrir el wizard (carrito vacío habilitado por el módulo de reservas).
    await user.click(screen.getByTestId('mock-checkout'))
    expect(screen.getByTestId('wizard-mock')).toBeInTheDocument()

    // Elegir cliente dentro del wizard: carga sus reservas CONFIRMED.
    await user.click(screen.getByTestId('wizard-select-client'))
    await waitFor(() => expect(screen.getByTestId('wizard-res-count')).toHaveTextContent('1'))

    // Avanzar en el paso Reservas: los ítems pasan al carrito y la lista se consume.
    await user.click(screen.getByTestId('wizard-toggle-res'))
    await user.click(screen.getByTestId('wizard-add-res'))
    await waitFor(() => expect(screen.getByTestId('wizard-res-count')).toHaveTextContent('0'))

    // Cancelar el wizard (el operador borra el carrito fuera del wizard).
    await user.click(screen.getByTestId('wizard-close'))
    expect(screen.queryByTestId('wizard-mock')).not.toBeInTheDocument()

    // Reabrir: el cliente sigue seleccionado — sin el refetch las reservas
    // quedaban perdidas hasta deseleccionar y reelegir el cliente.
    await user.click(screen.getByTestId('mock-checkout'))
    expect(screen.getByTestId('wizard-client')).toHaveTextContent('C1')
    await waitFor(() => expect(screen.getByTestId('wizard-res-count')).toHaveTextContent('1'))
    expect(h.getReservationReport).toHaveBeenLastCalledWith({
      client_id: 'C1',
      status: 'CONFIRMED',
    })
  })

  it('cambiar a un cliente sin reservas limpia la lista del cliente anterior', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByTestId('mock-checkout'))
    await user.click(screen.getByTestId('wizard-select-client'))
    await waitFor(() => expect(screen.getByTestId('wizard-res-count')).toHaveTextContent('1'))

    // El nuevo cliente no tiene reservas CONFIRMED.
    h.nextClient = { id: 'C2', name: 'CLIENTE SIN RESERVAS' }
    h.getReservationReport.mockResolvedValue([])
    await user.click(screen.getByTestId('wizard-select-client'))
    await waitFor(() => expect(screen.getByTestId('wizard-client')).toHaveTextContent('C2'))
    // La lista del cliente anterior (C1) no debe quedar stale para C2.
    await waitFor(() => expect(screen.getByTestId('wizard-res-count')).toHaveTextContent('0'))
  })
})
