/**
 * Nueva Cotización (/comercial/presupuestos/nuevo).
 *
 * Regresiones cubiertas:
 * - Cliente: el dropdown inline llamaba clientService.searchByName directo;
 *   el cliente crudo del backend (sin `name`) crasheaba el chip con
 *   "selectedClient.name is undefined". Ahora: SearchableDropdown compartido
 *   + useClientStore (normalizeClient).
 * - Producto: el dropdown por-producto (searchInfo) no discriminaba
 *   variantes ni mostraba stock/precio. Ahora: búsqueda plana
 *   (granularity=variant) como /ventas, con precio y stock por unidad.
 *
 * Mocks en la frontera: clientService y productService (ambos consumidos
 * por la página). El i18n lo resuelve el fakeT global de vitest.setup.ts
 * (las claves budgets.* no están registradas → usa el fallback español);
 * lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BudgetCreate from '../BudgetCreate'
import { clientService } from '@/services/clientService'
import { productService } from '@/services/productService'
import useClientStore from '@/store/useClientStore'

// El factory debe exportar todos los símbolos que useClientStore consume
// (getAll/searchByName/create/update/delete).
vi.mock('@/services/clientService', () => ({
  clientService: {
    getAll: vi.fn(),
    searchByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Símbolos que BudgetCreate consume del productService.
vi.mock('@/services/productService', () => ({
  productService: {
    searchAdvanced: vi.fn(),
    searchInfo: vi.fn(),
    getInfo: vi.fn(),
  },
}))

const searchByNameMock = vi.mocked(clientService.searchByName)
const searchAdvancedMock = vi.mocked(productService.searchAdvanced)
const searchInfoMock = vi.mocked(productService.searchInfo)
const getInfoMock = vi.mocked(productService.getInfo)

/** Cliente crudo como lo devuelve el backend: sin `name` (first_name/last_name). */
const rawBackendClient = {
  id: 'C-1',
  first_name: 'Erik',
  last_name: 'Gómez',
  document_id: '1234567-8',
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
      <BudgetCreate />
    </MemoryRouter>,
  )

/** Debounce (300ms) del SearchableDropdown + resolución de promesas mockeadas. */
const flushDebounce = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(310)
  })
  vi.useRealTimers()
}

describe('BudgetCreate (nuevo presupuesto)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientStore.setState({ searchResults: [], loading: false, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selecciona un cliente crudo del backend sin crashear (regresión selectedClient.name)', async () => {
    searchByNameMock.mockResolvedValue([rawBackendClient])
    vi.useFakeTimers()

    renderPage()

    // fireEvent (no userEvent: con fake timers se cuelga) + debounce.
    fireEvent.change(screen.getByPlaceholderText(/nombre o RUC del cliente/i), {
      target: { value: 'Erik' },
    })
    await flushDebounce()

    // La fila muestra el nombre normalizado (displayName = nombre + apellido).
    await waitFor(() => expect(screen.getByText('Erik Gómez')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Erik Gómez'))

    // El chip reemplaza al buscador con datos normalizados — antes:
    // TypeError "can't access property 0, selectedClient.name is undefined".
    expect(screen.queryByPlaceholderText(/nombre o RUC del cliente/i)).toBeNull()
    expect(screen.getByText('Erik Gómez')).toBeInTheDocument()
    expect(screen.getByText('1234567-8')).toBeInTheDocument()
    expect(screen.getByText(/^E$/)).toBeInTheDocument() // inicial del avatar
  })

  it('no busca clientes con menos de 3 caracteres', async () => {
    vi.useFakeTimers()

    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/nombre o RUC del cliente/i), {
      target: { value: 'ab' },
    })
    await flushDebounce()

    expect(searchByNameMock).not.toHaveBeenCalled()
  })

  it('busca productos por variante con precio y stock en el dropdown', async () => {
    searchAdvancedMock.mockResolvedValue({ products: flatVariantRows, total_count: 2 })
    // La tasa se resuelve por producto al agregar (applicable_tax_rate).
    getInfoMock.mockResolvedValue({ applicable_tax_rate: { rate: 10 } } as any)
    vi.useFakeTimers()

    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/buscar producto/i), {
      target: { value: 'adid' },
    })
    await flushDebounce()

    // Cada variante es su propia fila con stock y precio propios — antes el
    // dropdown mostraba solo productos a nivel padre, sin stock y a Gs. 0.
    expect(searchAdvancedMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'adid', granularity: 'variant' }),
    )
    expect(screen.getByText('CAMISETA ADIDAS · Rojo / M')).toBeInTheDocument()
    expect(screen.getByText('CAMISETA ADIDAS · Azul / S')).toBeInTheDocument()
    expect(screen.getByText(/SKU: ADID-ROJO-M/)).toBeInTheDocument()
    expect(screen.getByText('Stock: 25 unit')).toBeInTheDocument()
    expect(screen.getByText('Stock: 0 unit')).toBeInTheDocument()
    expect(screen.getByText('Gs. 55.000')).toBeInTheDocument()

    // Seleccionar la primera variante la agrega como línea del presupuesto.
    fireEvent.click(screen.getByText('CAMISETA ADIDAS · Rojo / M'))
    await waitFor(() =>
      expect(screen.getByText('CAMISETA ADIDAS · Rojo / M')).toBeInTheDocument(),
    )
    expect(screen.getByText('SKU: ADID-ROJO-M')).toBeInTheDocument() // celda de la tabla
  })

  it('hace fallback a la búsqueda legacy por-producto si la plana falla', async () => {
    searchAdvancedMock.mockRejectedValue(new Error('network down'))
    searchInfoMock.mockResolvedValue([
      {
        id: 'P2',
        name: 'CAMISETA ADIDAS',
        price: 50000,
        stock_quantity: 7,
      },
    ] as any)
    vi.useFakeTimers()

    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/buscar producto/i), {
      target: { value: 'adid' },
    })
    await flushDebounce()

    // La fila legacy (por-producto) se muestra mapeada a la unidad.
    await waitFor(() => expect(searchInfoMock).toHaveBeenCalledWith('adid'))
    expect(screen.getByText('CAMISETA ADIDAS')).toBeInTheDocument()
  })
})
