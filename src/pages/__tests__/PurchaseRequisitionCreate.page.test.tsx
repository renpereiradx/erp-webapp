/**
 * Nueva Requisición (/logistica/requisiciones/nueva).
 *
 * Regresiones (mismo patrón que BudgetCreate): proveedor y productos usaban
 * dropdowns inline con llamadas directas al service — proveedor crudo sin
 * `name` y búsqueda de productos por-producto sin variantes/stock/precio.
 * Ahora: SearchableDropdown compartido + store de directorio normalizado +
 * búsqueda plana (granularity=variant) vía sellableUnitSearch.
 *
 * Mocks en la frontera: supplierService (el store real corre y normaliza),
 * productService, purchaseRequisitionService, BranchContext. El i18n lo
 * resuelve el fakeT global de vitest.setup.ts; lucide-react NO se mockea
 * (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PurchaseRequisitionCreate from '../PurchaseRequisitionCreate'
import supplierService from '@/services/supplierService'
import { productService } from '@/services/productService'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'

vi.mock('@/services/supplierService', () => ({
  __esModule: true,
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    searchByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/services/productService', () => ({
  productService: {
    searchAdvanced: vi.fn(),
    searchInfo: vi.fn(),
    getInfo: vi.fn(),
  },
}))

vi.mock('@/services/purchaseRequisitionService', () => ({
  purchaseRequisitionService: {
    createRequisition: vi.fn(),
  },
}))

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))

const searchByNameMock = vi.mocked(supplierService.searchByName)
const searchAdvancedMock = vi.mocked(productService.searchAdvanced)

/** Proveedor crudo como lo devuelve el backend: sin `name` (first_name). */
const rawBackendSupplier = {
  id: 'S-1',
  first_name: 'Distribuidora Central',
  tax_id: '80012345-6',
  status: 'active',
}

/** Filas planas (granularity=variant): una por unidad vendible. */
const flatVariantRows = [
  {
    id: 'P1',
    variant_id: 'V1',
    is_base_row: false,
    name: 'CAMISETA ADIDAS',
    variant_name: 'Rojo / M',
    sku: 'ADID-ROJO-M',
    state: true,
    current_price: 55000,
    stock_quantity: 25,
    base_unit: 'unit',
  },
  {
    id: 'P1',
    variant_id: 'V2',
    is_base_row: false,
    name: 'CAMISETA ADIDAS',
    variant_name: 'Azul / S',
    sku: 'ADID-AZUL-S',
    state: true,
    current_price: 60000,
    stock_quantity: 0,
    base_unit: 'unit',
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <PurchaseRequisitionCreate />
    </MemoryRouter>,
  )

/** Debounce (300ms) del SearchableDropdown + resolución de promesas mockeadas. */
const flushDebounce = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(310)
  })
  vi.useRealTimers()
}

describe('PurchaseRequisitionCreate (nueva requisición)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSupplierDirectoryStore.setState({ searchResults: [], loading: false, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selecciona un proveedor crudo del backend sin crashear', async () => {
    searchByNameMock.mockResolvedValue([rawBackendSupplier])
    vi.useFakeTimers()

    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Buscar proveedor...'), {
      target: { value: 'dist' },
    })
    await flushDebounce()

    await waitFor(() => expect(screen.getByText('Distribuidora Central')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Distribuidora Central'))

    // El chip reemplaza al buscador con el nombre normalizado.
    expect(screen.queryByPlaceholderText('Buscar proveedor...')).toBeNull()
    expect(screen.getByText('Distribuidora Central')).toBeInTheDocument()
  })

  it('busca productos por variante con precio y stock en el dropdown', async () => {
    searchAdvancedMock.mockResolvedValue({ products: flatVariantRows, total_count: 2 })
    vi.useFakeTimers()

    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/buscar producto/i), {
      target: { value: 'adid' },
    })
    await flushDebounce()

    expect(searchAdvancedMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'adid', granularity: 'variant' }),
    )
    expect(screen.getByText('CAMISETA ADIDAS · Rojo / M')).toBeInTheDocument()
    expect(screen.getByText('CAMISETA ADIDAS · Azul / S')).toBeInTheDocument()
    expect(screen.getByText(/SKU: ADID-ROJO-M/)).toBeInTheDocument()
    expect(screen.getByText('Stock: 25 unit')).toBeInTheDocument()
    expect(screen.getByText('Stock: 0 unit')).toBeInTheDocument()
    expect(screen.getByText('Gs. 55.000')).toBeInTheDocument()

    // Seleccionar la variante la agrega como línea (keyed producto+variante).
    fireEvent.click(screen.getByText('CAMISETA ADIDAS · Rojo / M'))
    await waitFor(() =>
      expect(screen.getByText('CAMISETA ADIDAS · Rojo / M')).toBeInTheDocument(),
    )
    expect(screen.getByText('SKU: ADID-ROJO-M')).toBeInTheDocument()
  })
})
