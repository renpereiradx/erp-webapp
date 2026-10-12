/**
 * usePurchasesLogic — reactividad de unidad en el modal de compras
 * (PLAN_UNITS_V2_COMPLETACION F1.3/F1.4).
 *
 * Cubre el pendiente 🟡 de la auditoría UOM 2026-09-26: al cambiar la unidad
 * del modal, el costo sugerido sigue a la unidad (costo registrado en
 * unit_costs → ese; si no, costo base × factor con la fórmula del SQL vía
 * deriveUnitPrice); el hint preventivo aparece cuando la unidad no tiene NI
 * costo NI conversión (la recepción sería rechazada con NO_CONVERSION); y la
 * cantidad entera se trunca al confirmar en unidades no pesables.
 *
 * Mocks en la frontera del módulo consumido (regla AGENTS.md): servicios HTTP
 * y contexts; el dominio (deriveUnitPrice/resolveUnitFactor) corre real.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePurchasesLogic } from '../hooks/usePurchasesLogic'
import { usePurchasesCartDraftStore } from '@/store/usePurchasesCartDraftStore'

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))

const authState = vi.hoisted(() => ({ user: { id: 'user-1' } as any }))
vi.mock('@/store/useAuthStore', () => {
  const useAuthStore: any = () => ({ user: authState.user })
  useAuthStore.getState = () => ({ user: authState.user })
  return { default: useAuthStore }
})
vi.mock('@/store/useDashboardStore', () => ({
  default: () => ({ fetchDashboardData: vi.fn() }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))
vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

const serviceMocks = vi.hoisted(() => ({
  getForPurchase: vi.fn(),
  listConversions: vi.fn(),
}))
vi.mock('@/services/productService', () => ({
  productService: { getForPurchase: serviceMocks.getForPurchase },
}))
vi.mock('@/features/unit-conversions/services/unitConversionsService', () => ({
  unitConversionsService: { getAll: serviceMocks.listConversions },
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
    getPurchasesByDateRange: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    calculatePurchaseTotals: vi.fn().mockResolvedValue({}),
    createEnhancedPurchaseOrder: vi.fn(),
    getPurchaseById: vi.fn(),
    cancelPurchaseOrderWithDetails: vi.fn(),
    previewPurchaseOrderCancellation: vi.fn(),
  },
}))
vi.mock('@/services/purchasePaymentsMvpService', () => ({
  fetchPurchasesBySupplierTerm: vi.fn().mockResolvedValue([]),
  purchasePaymentsMvpService: { registerPayment: vi.fn() },
}))

// Producto base kg con costo 5.000/kg y costo registrado de caja 100.000.
// Conversiones específicas del producto (la misma matemática del plan):
// caja→kg ×20 (sin costo propio: ejercita la derivación) y palé→kg ×500.
const PRODUCT = {
  product_id: 'PROD1',
  name: 'Papas',
  base_unit: 'kg',
  unit: 'kg',
  purchase_price: 5000,
  unit_costs_summary: [
    { unit: 'kg', last_cost: 5000 },
    { unit: 'box', last_cost: 100000 },
  ],
}
const CONVERSIONS = [
  { product_id: 'PROD1', from_unit: 'box', to_unit: 'kg', factor: 20 },
  { product_id: 'PROD1', from_unit: 'pallet', to_unit: 'kg', factor: 500 },
]

const renderPurchasesHook = () => renderHook(() => usePurchasesLogic())

const selectProduct = async (result: { current: any }) => {
  serviceMocks.getForPurchase.mockResolvedValue(PRODUCT)
  serviceMocks.listConversions.mockResolvedValue(CONVERSIONS)
  await act(async () => {
    await result.current.handleProductSelect({ id: 'PROD1' })
  })
  await act(async () => {
    result.current.setIsModalOpen(true)
  })
  await waitFor(() => {
    expect(serviceMocks.listConversions).toHaveBeenCalled()
  })
  await act(async () => {}) // flush del setState de conversiones
  expect(result.current.modalSelectedProduct?.id).toBe('PROD1')
}

describe('usePurchasesLogic — cambio de unidad en el modal (PLAN_UNITS_V2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // El hook persiste el carrito (write-through del borrador): sin reset,
    // el ítem confirmado por un test se restaura en el montaje del siguiente.
    usePurchasesCartDraftStore.setState({ userId: null, data: null, savedAt: null })
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('costo registrado de la unidad: cambia al costo de la caja (100.000)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)
    expect(result.current.modalUnitPrice).toBe(5000) // prefill base

    await act(async () => {
      result.current.handleModalUnitChange('box')
    })

    expect(result.current.modalUnit).toBe('box')
    expect(result.current.modalUnitPrice).toBe(100000)
  })

  it('sin costo registrado: deriva base × factor (5.000 × 500 = 2.500.000)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.handleModalUnitChange('pallet')
    })

    expect(result.current.modalUnitPrice).toBe(2500000)
  })

  it('volver a la base restaura el costo base (5.000)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.handleModalUnitChange('box')
    })
    expect(result.current.modalUnitPrice).toBe(100000)
    await act(async () => {
      result.current.handleModalUnitChange('kg')
    })
    expect(result.current.modalUnitPrice).toBe(5000)
  })

  it('hint preventivo: solo con unidad sin NI costo NI conversión', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)
    expect(result.current.modalUnitConversionHint).toBe(false) // base

    // box tiene costo registrado: sin hint aunque cambie.
    await act(async () => {
      result.current.handleModalUnitChange('box')
    })
    expect(result.current.modalUnitConversionHint).toBe(false)

    // pallet tiene conversión (deriva costo) pero sin costo propio: sin hint.
    await act(async () => {
      result.current.handleModalUnitChange('pallet')
    })
    expect(result.current.modalUnitConversionHint).toBe(false)

    // bulto sin nada registrado: la recepción sería rechazada → hint.
    await act(async () => {
      result.current.handleModalUnitChange('bundle')
    })
    expect(result.current.modalUnitConversionHint).toBe(true)
  })

  it('cantidad 0,5 kg sobrevive al confirmar (unidad pesable)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.setModalQuantity('0.5')
      result.current.setModalUnitPrice(5000)
    })
    await act(async () => {
      result.current.handleConfirmAddProduct()
    })

    expect(result.current.purchaseItems).toHaveLength(1)
    expect(result.current.purchaseItems[0].quantity).toBe(0.5)
    expect(result.current.purchaseItems[0].unit).toBe('kg')
  })

  it('cantidad 1,5 box se trunca a 1 al confirmar (unidad entera)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.handleModalUnitChange('box')
      result.current.setModalQuantity('1.5')
      result.current.setModalUnitPrice(100000)
    })
    await act(async () => {
      result.current.handleConfirmAddProduct()
    })

    expect(result.current.purchaseItems).toHaveLength(1)
    expect(result.current.purchaseItems[0].quantity).toBe(1)
    expect(result.current.purchaseItems[0].unit).toBe('box')
  })

  it('cantidad 0,5 box (truncada a 0) bloquea el confirm: no se agrega línea', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.handleModalUnitChange('box')
      result.current.setModalQuantity('0.5')
      result.current.setModalUnitPrice(100000)
    })
    await act(async () => {
      result.current.handleConfirmAddProduct()
    })

    expect(result.current.purchaseItems).toHaveLength(0)
  })

  // A8: la sugerencia de precio de venta (costo×1.3) sigue al costo de la
  // unidad — solo mientras siga siendo sugerencia.
  it('sugerencia ×1.3 sigue al costo al cambiar unidad (5.000→6.500, 100.000→130.000)', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)
    expect(result.current.modalSalePrice).toBe(6500) // 5.000 × 1.3

    await act(async () => {
      result.current.handleModalUnitChange('box')
    })

    expect(result.current.modalSalePrice).toBe(130000) // 100.000 × 1.3
  })

  it('precio tipeado por el usuario NO se pisa al cambiar unidad', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)

    await act(async () => {
      result.current.handleModalSalePriceChange(999999)
    })
    await act(async () => {
      result.current.handleModalUnitChange('box')
    })

    expect(result.current.modalUnitPrice).toBe(100000) // el costo sí siguió
    expect(result.current.modalSalePrice).toBe(999999)
  })

  it('línea en edición: precio comprometido sobrevive al cambio de unidad', async () => {
    const { result } = renderPurchasesHook()
    await selectProduct(result)
    await act(async () => {
      result.current.handleConfirmAddProduct()
    })
    serviceMocks.getForPurchase.mockResolvedValue(PRODUCT)

    await act(async () => {
      await result.current.handleEditItem({
        ...result.current.purchaseItems[0],
        sale_price: 7777,
      })
    })
    await act(async () => {
      result.current.handleModalUnitChange('box')
    })

    expect(result.current.modalSalePrice).toBe(7777)
  })
})
