/**
 * PurchaseProductModal — reactividad de unidad (PLAN_UNITS_V2_COMPLETACION
 * F1.3b/F1.4, pendiente 🟡 auditoría UOM 2026-09-26).
 *
 * - El selector de unidad notifica handleModalUnitChange (el hook recalcula
 *   costo sugerido y hint; la lógica se prueba en
 *   usePurchasesLogicUnitChange.test.ts).
 * - El hint preventivo de unidad sin costo ni conversión lo decide el padre
 *   (modalUnitConversionHint) y el modal solo lo pinta.
 * - i18n moqueado con la firma real (fallback español); lucide-react sin mock.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}))
vi.mock('@/services/variantService', () => ({
  variantService: { getEnrichedVariants: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/store/useKeyboardShortcutsStore', () => ({
  default: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ matchesShortcut: () => false, formatShortcut: () => 'Ctrl+A' }),
}))

import { PurchaseProductModal } from '../components/PurchaseProductModal'

const baseProps = () => ({
  isModalOpen: true,
  setIsModalOpen: vi.fn(),
  editingItemId: null as string | null,
  modalProductSearchRef: createRef<HTMLInputElement>(),
  modalProductSearch: '',
  setModalProductSearch: vi.fn(),
  handleModalProductSearchKeyDown: vi.fn(),
  setShowProductDropdown: vi.fn(),
  searchingProducts: false,
  showProductDropdown: false,
  filteredModalProducts: [] as any[],
  productDropdownRef: createRef<HTMLDivElement>(),
  activeProductIndex: -1,
  setActiveProductIndex: vi.fn(),
  handleProductSelect: vi.fn(),
  getProductName: (s: any) => s?.name || '',
  modalSelectedProduct: null as any,
  modalQuantityRef: createRef<HTMLInputElement>(),
  modalQuantity: '',
  setModalQuantity: vi.fn(),
  modalUnitPrice: '',
  setModalUnitPrice: vi.fn(),
  modalProfitPct: 30,
  setModalProfitPct: vi.fn(),
  modalSalePrice: 0,
  setModalSalePrice: vi.fn(),
  pricingMode: 'margin' as const,
  effectiveProfitPct: 30,
  effectiveSalePrice: 0,
  modalTaxRateId: null as number | null,
  setModalTaxRateId: vi.fn(),
  loading: false,
  taxRates: [] as any[],
  modalPriceIncludesTax: false,
  setModalPriceIncludesTax: vi.fn(),
  setPricingMode: vi.fn(),
  handleConfirmAddProduct: vi.fn(),
  handleModalUnitChange: vi.fn(),
  modalUnitConversionHint: false,
  modalVariantId: undefined as string | undefined,
  setModalVariantId: vi.fn(),
  setModalVariantName: vi.fn(),
  setModalSelectedVariant: vi.fn(),
})

/** Harness con unidad real (el modal es controlado por el hook). */
const renderModal = (overrides: { modalUnitConversionHint?: boolean } = {}) => {
  const handleModalUnitChange = vi.fn()
  const Harness = () => {
    const [modalUnit, setModalUnit] = useState('kg')
    const wrapped = (unit: string) => {
      handleModalUnitChange(unit)
      setModalUnit(unit)
    }
    return (
      <PurchaseProductModal
        {...(baseProps() as any)}
        modalUnit={modalUnit}
        handleModalUnitChange={wrapped}
        modalUnitConversionHint={overrides.modalUnitConversionHint ?? false}
      />
    )
  }
  render(<Harness />)
  return { handleModalUnitChange }
}

describe('PurchaseProductModal — cambio de unidad (PLAN_UNITS_V2)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('elegir "Caja" en el selector notifica handleModalUnitChange("box")', async () => {
    const user = userEvent.setup()
    const { handleModalUnitChange } = renderModal()

    const unitTrigger = screen.getByRole('combobox', { name: 'Unidad' })
    await user.click(unitTrigger)
    const option = await screen.findByRole('option', { name: 'Caja' })
    await user.click(option)

    await waitFor(() => expect(handleModalUnitChange).toHaveBeenCalledWith('box'))
  })

  it('muestra el hint preventivo cuando el padre marca unidad sin costo ni conversión', () => {
    renderModal({ modalUnitConversionHint: true })

    expect(screen.getByTestId('purchase-modal-unit-no-conversion')).toBeInTheDocument()
  })

  it('oculta el hint cuando la unidad está resuelta (costo o conversión)', () => {
    renderModal({ modalUnitConversionHint: false })

    expect(screen.queryByTestId('purchase-modal-unit-no-conversion')).not.toBeInTheDocument()
  })
})
