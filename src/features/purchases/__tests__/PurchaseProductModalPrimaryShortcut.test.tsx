/**
 * PurchaseProductModal — acción principal configurable (DESIGN.md §12.1).
 *
 * Ctrl+A (`purchases.addProduct`, store REAL con defaults — la entrada del
 * store pensada para esta acción, sin otros consumidores) confirma la línea
 * "Agregar a la Orden", igual que los alias F12/Ctrl+Enter. Con la línea
 * inválida el atajo NO se consume: el evento pasa y Ctrl+A conserva el
 * select-all nativo dentro de los inputs. El botón primario anuncia el
 * atajo configurado "(Ctrl + A)" y el footer muestra la fila de hints kbd
 * (patrón wizard, §12.5.4).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
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
  selectedProduct?: any
  quantity?: string
  unitPrice?: string
}

const renderModal = (harness: HarnessProps = {}) => {
  const onConfirm = vi.fn()

  const BoundModal = () => {
    const [modalQuantity] = useState(harness.quantity ?? '')
    const [modalUnitPrice] = useState(harness.unitPrice ?? '')

    return (
      <PurchaseProductModal
        {...(baseProps() as any)}
        pricingMode='margin'
        effectiveProfitPct={30}
        effectiveSalePrice={130}
        modalQuantity={modalQuantity}
        setModalQuantity={vi.fn()}
        modalUnitPrice={modalUnitPrice}
        setModalUnitPrice={vi.fn()}
        modalProfitPct={30}
        setModalProfitPct={vi.fn()}
        modalSalePrice={130}
        setModalSalePrice={vi.fn()}
        modalSelectedProduct={harness.selectedProduct ?? null}
        handleConfirmAddProduct={onConfirm}
      />
    )
  }

  render(<BoundModal />)
  return { onConfirm }
}

const pressKey = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  window.dispatchEvent(event)
  return event
}

afterEach(cleanup)

describe('PurchaseProductModal — acción principal (Ctrl+A)', () => {
  const validProduct = { id: 1, name: 'PAPA KG PY', variants: [] }

  it('Ctrl+A con línea válida confirma "Agregar a la Orden"', () => {
    const { onConfirm } = renderModal({
      selectedProduct: validProduct,
      quantity: '2',
      unitPrice: '100',
    })
    const event = pressKey({ key: 'a', ctrlKey: true })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('Ctrl+A con línea inválida NO confirma NI consume la tecla (select-all nativo intacto)', () => {
    const { onConfirm } = renderModal({ quantity: '2', unitPrice: '100' })
    const event = pressKey({ key: 'a', ctrlKey: true })
    expect(onConfirm).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('Ctrl+A sin cantidad no confirma', () => {
    const { onConfirm } = renderModal({ selectedProduct: validProduct, unitPrice: '100' })
    pressKey({ key: 'a', ctrlKey: true })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('F12 sigue confirmando como alias de compatibilidad', () => {
    const { onConfirm } = renderModal({
      selectedProduct: validProduct,
      quantity: '2',
      unitPrice: '100',
    })
    pressKey({ key: 'F12' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Enter sigue confirmando como alias de compatibilidad', () => {
    const { onConfirm } = renderModal({
      selectedProduct: validProduct,
      quantity: '2',
      unitPrice: '100',
    })
    pressKey({ key: 'Enter', ctrlKey: true })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('el botón primario anuncia el atajo configurado y el footer muestra hints kbd', () => {
    renderModal({ selectedProduct: validProduct, quantity: '2', unitPrice: '100' })
    const confirm = screen.getByTestId('purchase-modal-confirm')
    expect(confirm.textContent).toContain('Agregar a la Orden')
    expect(confirm.textContent).toContain('(Ctrl + A)')
    // Fila de hints: F3 = buscador interno, Esc = cerrar.
    expect(screen.getByText('Buscar')).toBeInTheDocument()
    expect(screen.getByText('Cerrar')).toBeInTheDocument()
  })
})
