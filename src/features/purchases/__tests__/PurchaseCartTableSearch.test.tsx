/**
 * PurchaseCartTable — buscador de productos del encabezado.
 *
 * Regresión: seleccionar desde el dropmenu del carrito debe abrir el modal de
 * detalles por AMBOS caminos. El click ya lo hacía (handleSelectAndOpen),
 * pero Enter en el input usaba el handler crudo del hook y solo cargaba el
 * producto: el usuario tipeaba, apretaba Enter y el modal nunca aparecía. El
 * fix pasa afterSelect vía handleModalProductSearchKeyDown.
 *
 * El componente recibe el estado por props (usePurchasesLogic solo aparece en
 * posición de tipo, así que no hace falta mockearlo). lucide-react NO se
 * mockea; i18n usa el fakeT global.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { PurchaseCartTable } from '../components/PurchaseCartTable'

const baseProps = () => ({
  purchaseItems: [] as any[],
  setIsModalOpen: vi.fn(),
  canWrite: true,
  handleEditItem: vi.fn(),
  setPurchaseItems: vi.fn(),
  isModalOpen: false,
  modalProductSearch: 'control',
  setModalProductSearch: vi.fn(),
  searchingProducts: false,
  showProductDropdown: true,
  setShowProductDropdown: vi.fn(),
  filteredModalProducts: [
    { id: 'p1', name: 'Control Remoto', sku: 'CR-1', stock_quantity: 5 },
  ] as any[],
  productDropdownRef: createRef<HTMLDivElement>(),
  cartProductSearchRef: createRef<HTMLInputElement>(),
  activeProductIndex: 0,
  setActiveProductIndex: vi.fn(),
  /**
   * Espejo del contrato real del hook: (event, options?) con afterSelect
   * opcional que el llamador ejecuta tras la selección.
   */
  handleModalProductSearchKeyDown: vi.fn(
    (event: { key: string }, options?: { afterSelect?: () => void }) => {
      if (event.key === 'Enter') options?.afterSelect?.()
    },
  ),
  handleProductSelect: vi.fn().mockResolvedValue(undefined),
  getProductName: (p: any) => p.name,
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('PurchaseCartTable — búsqueda de productos del encabezado', () => {
  it('Enter en el input abre el modal de detalles (vía afterSelect)', () => {
    const props = baseProps()
    render(<PurchaseCartTable {...props} />)

    const input = screen.getByPlaceholderText(/Buscar producto por SKU/i)
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(props.handleModalProductSearchKeyDown).toHaveBeenCalledTimes(1)
    expect(props.setIsModalOpen).toHaveBeenCalledWith(true)
  })

  it('click en la opción del dropmenu abre el modal de detalles', async () => {
    const props = baseProps()
    render(<PurchaseCartTable {...props} />)

    fireEvent.click(screen.getByRole('option', { name: /Control Remoto/ }))

    // handleSelectAndOpen espera a handleProductSelect antes de abrir
    await vi.waitFor(() =>
      expect(props.setIsModalOpen).toHaveBeenCalledWith(true),
    )
    expect(props.handleProductSelect).toHaveBeenCalledWith(
      props.filteredModalProducts[0],
    )
  })

  it('sin permiso de escritura el buscador queda deshabilitado', () => {
    const props = baseProps()
    render(<PurchaseCartTable {...props} canWrite={false} />)

    expect(screen.getByPlaceholderText(/Buscar producto por SKU/i)).toBeDisabled()
  })
})
