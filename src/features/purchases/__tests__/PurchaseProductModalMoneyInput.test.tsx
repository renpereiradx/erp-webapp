/**
 * PurchaseProductModal — formateo de miles en los inputs numéricos
 * (DESIGN.md §6.4: nunca type="number" crudo para dinero).
 *
 * Cantidad, Costo Unit., Margen % y Precio de Venta usan el par
 * formatNumberInput/parseNumberInput de moneyInput.ts: el usuario teclea
 * 6000 y ve "6.000" (es-PY: coma decimal en cantidad/margen); el hook sigue
 * recibiendo valores canónicos/números, así que el contrato de props no cambia.
 *
 * El modal es 100% controlado por ReturnType<typeof usePurchasesLogic>: el
 * test monta un harness con estado real para los 4 valores numéricos (con
 * spies que registran lo que el componente le reporta al hook) y props base
 * sin producto seleccionado. lucide-react NO se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createRef, useState } from 'react'
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
  modalUnit: 'unit',
  setModalUnit: vi.fn(),
  modalTaxRateId: null as number | null,
  setModalTaxRateId: vi.fn(),
  loading: false,
  taxRates: [] as any[],
  modalPriceIncludesTax: false,
  setModalPriceIncludesTax: vi.fn(),
  setPricingMode: vi.fn(),
  handleConfirmAddProduct: vi.fn(),
  modalVariantId: undefined as number | undefined,
  setModalVariantId: vi.fn(),
  setModalVariantName: vi.fn(),
  setModalSelectedVariant: vi.fn(),
})

interface HarnessProps {
  initialQuantity?: string
  initialUnitPrice?: string
  initialProfitPct?: number
  initialSalePrice?: number
  pricingMode?: 'margin' | 'sale_price'
  effectiveProfitPct?: number
  effectiveSalePrice?: number
}

/**
 * Estado real para los 4 valores numéricos (el hook real los guarda y el
 * modal es controlado): los spies registran el valor canónico/número que el
 * componente reporta, replicando usePurchasesLogic.
 */
const renderModal = (harness: HarnessProps = {}) => {
  const spies = {
    setModalQuantity: vi.fn(),
    setModalUnitPrice: vi.fn(),
    setModalProfitPct: vi.fn(),
    setModalSalePrice: vi.fn(),
  }

  const Harness = () => {
    const [modalQuantity, setModalQuantity] = useState(harness.initialQuantity ?? '')
    const [modalUnitPrice, setModalUnitPrice] = useState(harness.initialUnitPrice ?? '')
    const [modalProfitPct, setModalProfitPct] = useState(harness.initialProfitPct ?? 30)
    const [modalSalePrice, setModalSalePrice] = useState(harness.initialSalePrice ?? 0)

    const track = <T,>(spy: (v: T) => void, setter: (v: T) => void) => (v: T) => {
      spy(v)
      setter(v)
    }

    return (
      <PurchaseProductModal
        {...(baseProps() as any)}
        pricingMode={harness.pricingMode ?? 'margin'}
        effectiveProfitPct={harness.effectiveProfitPct ?? 30}
        effectiveSalePrice={harness.effectiveSalePrice ?? 0}
        modalQuantity={modalQuantity}
        setModalQuantity={track(spies.setModalQuantity, setModalQuantity)}
        modalUnitPrice={modalUnitPrice}
        setModalUnitPrice={track(spies.setModalUnitPrice, setModalUnitPrice)}
        modalProfitPct={modalProfitPct}
        setModalProfitPct={track(spies.setModalProfitPct, setModalProfitPct)}
        modalSalePrice={modalSalePrice}
        setModalSalePrice={track(spies.setModalSalePrice, setModalSalePrice)}
      />
    )
  }

  render(<Harness />)
  return spies
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('PurchaseProductModal — formateo de inputs numéricos', () => {
  it('costo unitario: formatea los miles mientras se escribe y guarda el canónico', () => {
    const spies = renderModal()
    const cost = screen.getByLabelText(/Costo Unit\./i) as HTMLInputElement

    fireEvent.change(cost, { target: { value: '1.234' } })

    expect(cost.value).toBe('1.234')
    expect(spies.setModalUnitPrice).toHaveBeenLastCalledWith('1234')
  })

  it('cantidad: acepta coma decimal es-PY y guarda el canónico', () => {
    const spies = renderModal({ initialQuantity: '2.5' })
    const qty = screen.getByLabelText(/Cantidad/i) as HTMLInputElement

    expect(qty.value).toBe('2,5')

    fireEvent.change(qty, { target: { value: '3,5' } })

    expect(qty.value).toBe('3,5')
    expect(spies.setModalQuantity).toHaveBeenLastCalledWith('3.5')
  })

  it('precio de venta (modo fijo): muestra agrupado y reporta número', () => {
    const spies = renderModal({ pricingMode: 'sale_price', initialSalePrice: 5000 })
    const price = screen.getByLabelText(/Precio de Venta/i) as HTMLInputElement

    expect(price.value).toBe('5.000')

    fireEvent.change(price, { target: { value: '7500' } })

    expect(price.value).toBe('7.500')
    expect(spies.setModalSalePrice).toHaveBeenLastCalledWith(7500)
  })

  it('margen (modo margin): formatea el porcentaje tecleado', () => {
    const spies = renderModal({ pricingMode: 'margin' })
    const margin = screen.getByLabelText(/Margen/i) as HTMLInputElement

    fireEvent.change(margin, { target: { value: '12,5' } })

    expect(margin.value).toBe('12,5')
    expect(spies.setModalProfitPct).toHaveBeenLastCalledWith(12.5)
  })

  it('margen calculado (modo precio fijo, readOnly): muestra coma decimal', () => {
    renderModal({ pricingMode: 'sale_price', effectiveProfitPct: 27.5 })
    const margin = screen.getByLabelText(/Margen/i) as HTMLInputElement

    expect(margin.value).toBe('27,5')
  })
})
