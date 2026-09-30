/**
 * PurchaseProductModal — acción principal configurable (DESIGN.md §12.1).
 *
 * Ctrl+G (`purchases.processPurchase`, store REAL con defaults) confirma la
 * línea "Agregar a la Orden", igual que los alias F12/Ctrl+Enter. Con la
 * línea inválida (sin producto, cantidad o costo) la tecla se consume pero
 * NO confirma — mismo comportamiento silencioso que tenían los alias.
 * El botón primario anuncia el atajo configurado "(Ctrl + G)" y el footer
 * muestra la fila de hints kbd (patrón wizard, §12.5.4).
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
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
}

afterEach(cleanup)

describe('PurchaseProductModal — acción principal (Ctrl+G)', () => {
  const validProduct = { id: 1, name: 'PAPA KG PY', variants: [] }

  it('Ctrl+G con línea válida confirma "Agregar a la Orden"', () => {
    const { onConfirm } = renderModal({
      selectedProduct: validProduct,
      quantity: '2',
      unitPrice: '100',
    })
    pressKey({ key: 'g', ctrlKey: true })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+G sin producto no confirma (inválido: se consume sin acción)', () => {
    const { onConfirm } = renderModal({ quantity: '2', unitPrice: '100' })
    pressKey({ key: 'g', ctrlKey: true })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Ctrl+G sin cantidad no confirma', () => {
    const { onConfirm } = renderModal({ selectedProduct: validProduct, unitPrice: '100' })
    pressKey({ key: 'g', ctrlKey: true })
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
    expect(confirm.textContent).toContain('(Ctrl + G)')
    // Fila de hints: F3 = buscador interno, Esc = cerrar.
    expect(confirm.textContent).toContain('Agregar a la Orden')
    expect(screen.getByText('Buscar')).toBeInTheDocument()
    expect(screen.getByText('Cerrar')).toBeInTheDocument()
  })
})
