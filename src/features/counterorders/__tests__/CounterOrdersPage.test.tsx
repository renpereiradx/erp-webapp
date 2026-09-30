// ===========================================================================
// Tests de la bandeja /pedidos (PLAN_PEDIDOS_MOSTRADOR — FASE 2.5).
// Mocks en la frontera: módulo del service, AuthContext, BranchContext,
// i18n (firma real t(key, fallback, vars)) y módulos pesados del builder.
// ===========================================================================

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockHasPermission = vi.fn<(permission: string) => boolean>()

const preloadStore = vi.hoisted(() => ({
  preload: null as unknown,
  setPreload: vi.fn(),
  consumePreload: vi.fn(() => null),
  clearPreload: vi.fn(),
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-vendor', role_id: 'VNDR01' },
    hasPermission: (p: string) => mockHasPermission(p),
    hasAnyPermission: (ps: string[]) => ps.some(p => mockHasPermission(p)),
  }),
}))

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

vi.mock('@/services/counterOrderService', () => ({
  counterOrderService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    claim: vi.fn(),
    release: vi.fn(),
    convert: vi.fn(),
    cancel: vi.fn(),
    metrics: vi.fn(),
  },
}))

// Módulos pesados de la página: QuickClientModal no participa en estos tests.
// El picker de productos del builder busca vía productService (frontera real
// del helper fetchCatalogSellableUnits): el mock devuelve filas crudas tal
// cual las emite granularity=variant.
vi.mock('@/services/productService', () => ({
  productService: {
    searchAdvanced: vi.fn(),
    searchInfo: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
  },
}))
vi.mock('@/features/party/components/QuickClientModal', () => ({
  default: () => null,
}))
vi.mock('@/store/useCounterOrderPreloadStore', () => ({
  useCounterOrderPreloadStore: (selector?: (s: typeof preloadStore) => unknown) =>
    selector ? selector(preloadStore) : preloadStore,
}))

// Búsqueda de clientes del builder: el store real (useClientStore) consume
// este service; se mockea en su frontera. El factory debe exportar todos los
// símbolos que el store usa (getAll/searchByName/create/update/delete).
vi.mock('@/services/clientService', () => ({
  clientService: {
    getAll: vi.fn(),
    searchByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { CounterOrdersPage } from '../components/CounterOrdersPage'
import { counterOrderService } from '@/services/counterOrderService'
import { clientService } from '@/services/clientService'
import { productService } from '@/services/productService'

const listMock = vi.mocked(counterOrderService.list)
const cancelMock = vi.mocked(counterOrderService.cancel)
const claimMock = vi.mocked(counterOrderService.claim)
const searchByNameMock = vi.mocked(clientService.searchByName)
const searchAdvancedMock = vi.mocked(productService.searchAdvanced)

const orderOpen = {
  id: 'CO-1',
  code: 'PED-ABC234',
  client_id: 'CLIENT-1',
  branch_id: 1,
  status: 'OPEN' as const,
  notes: null,
  created_by: 'user-vendor',
  claimed_by: null,
  claimed_at: null,
  converted_sale_id: null,
  converted_at: null,
  cancelled_reason: null,
  cancelled_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  client_name: 'Juan Pérez',
  created_by_name: 'Vendedor Uno',
  claimed_by_name: null,
  item_count: 3,
  total: 150000,
}

const orderClaimed = {
  ...orderOpen,
  id: 'CO-2',
  code: 'PED-XYZ789',
  status: 'CLAIMED' as const,
  claimed_by: 'user-caja',
  claimed_at: new Date().toISOString(),
  claimed_by_name: 'Cajero Dos',
}

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CounterOrdersPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHasPermission.mockImplementation(p => p === 'counterorders:read' || p === 'counterorders:write')
  listMock.mockResolvedValue({
    data: [orderOpen, orderClaimed],
    pagination: {
      page: 1,
      page_size: 20,
      total_records: 2,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  })
})

afterEach(() => cleanup())

describe('CounterOrdersPage — bandeja', () => {
  it('renderiza los pedidos con código, total y estado', async () => {
    renderPage()
    expect(await screen.findByTestId('counterorder-row-CO-1')).toBeInTheDocument()
    expect(screen.getByText('PED-ABC234')).toBeInTheDocument()
    expect(screen.getByTestId('counterorder-status-OPEN')).toBeInTheDocument()
    expect(screen.getByTestId('counterorder-status-CLAIMED')).toHaveTextContent('En caja')
  })

  it('pide el listado con filtros por defecto (OPEN, sucursal activa, página 1)', async () => {
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN', branch_id: 1, page: 1, page_size: 20 }),
      ),
    )
  })

  // FASE 5A (PLAN_PEDIDOS_FASE5_MEJORAS): los OPEN > 72h vencen con el sweep
  // del listado; la bandeja ofrece el chip para verlos.
  it('filtra pedidos EXPIRED con el chip Vencidos', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    await user.click(screen.getByRole('tab', { name: 'Vencidos' }))
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'EXPIRED', page: 1 }),
      ),
    )
  })

  it('muestra acciones de edición para OPEN y liberar para CLAIMED del usuario', async () => {
    mockHasPermission.mockImplementation(p => p === 'counterorders:write' || p === 'counterorders:read')
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    // OPEN: cancelar visible; sin sales:write no hay "Procesar en caja".
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByTestId('counterorder-process-CO-1')).not.toBeInTheDocument()
    // CLAIMED por otro usuario (user-caja ≠ user-vendor): sin liberar.
    expect(screen.queryByTestId('counterorder-release-CO-2')).not.toBeInTheDocument()
  })

  it('"Procesar en caja" aparece solo con cash:write (FASE 4) y reclama el pedido', async () => {
    mockHasPermission.mockImplementation(
      p =>
        p === 'counterorders:read' ||
        p === 'counterorders:write' ||
        p === 'sales:write' ||
        p === 'cash:write',
    )
    claimMock.mockResolvedValue({
      ...orderOpen,
      items: [],
      total: 0,
    } as never)
    renderPage()
    const processButton = await screen.findByTestId('counterorder-process-CO-1')
    await userEvent.click(processButton)
    await waitFor(() => expect(claimMock).toHaveBeenCalledWith('CO-1'))
  })

  it('cancelación exige motivo y llama al service con el texto', async () => {
    cancelMock.mockResolvedValue({ message: 'ok' })
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    const confirm = await screen.findByTestId('counterorder-cancel-confirm')
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByTestId('counterorder-cancel-reason'), 'cliente se fue')
    await userEvent.click(confirm)
    await waitFor(() => expect(cancelMock).toHaveBeenCalledWith('CO-1', 'cliente se fue'))
  })

  it('la búsqueda dispara el listado con q', async () => {
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    await userEvent.type(screen.getByTestId('counterorders-search'), 'juan')
    await waitFor(() => expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ q: 'juan' })))
  })

  it('"Ver todas las sucursales" con branches:switch pide all_branches y suelta branch_id (audit A3)', async () => {
    mockHasPermission.mockImplementation(
      p => p === 'counterorders:read' || p === 'counterorders:write' || p === 'branches:switch',
    )
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-all-branches'))
    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ all_branches: 1 })),
    )
    const lastCall = listMock.mock.calls[listMock.mock.calls.length - 1][0] as Record<string, unknown>
    expect(lastCall.branch_id).toBeUndefined()
  })

  it('sin branches:switch el toggle no se renderiza', async () => {
    renderPage()
    await screen.findByTestId('counterorder-row-CO-1')
    expect(screen.queryByTestId('counterorders-all-branches')).not.toBeInTheDocument()
  })

  // §6.3: el empty vive DENTRO de la card con tabla (fila colSpan), no en un
  // bloque suelto — y ofrece la acción de crear (§6.7).
  it('bandeja vacía: empty dentro de la card con acción "Nuevo pedido"', async () => {
    listMock.mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        page_size: 20,
        total_records: 0,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
    })
    renderPage()
    expect(await screen.findByTestId('counterorders-board')).toBeInTheDocument()
    expect(await screen.findByText('Sin pedidos')).toBeInTheDocument()
    expect(await screen.findByTestId('counterorders-empty-new')).toBeInTheDocument()
    expect(screen.queryByTestId('counterorders-skeleton')).not.toBeInTheDocument()
  })

  // §12.4/§12.2: F2 enfoca el buscador principal; con un modal abierto el
  // atajo de página se desactiva (gating por estado).
  it('F2 enfoca el buscador y queda inactivo con el builder abierto', async () => {
    const user = userEvent.setup()
    renderPage()
    const search = await screen.findByTestId('counterorders-search')
    fireEvent.keyDown(document, { key: 'F2' })
    expect(search).toHaveFocus()
    await user.click(screen.getByTestId('counterorders-new-button'))
    fireEvent.keyDown(document, { key: 'F2' })
    expect(search).not.toHaveFocus()
  })
})

describe('OrderBuilder — dropmenu de unidades vendibles + carrito en tabla', () => {
  // Filas crudas tal cual las emite granularity=variant: fila base primero y
  // variantes después, cada una con precio/stock propio (sin N+1).
  const baseRow = {
    id: 'PROD-CAM',
    variant_id: null,
    is_base_row: true,
    name: 'CAMISETA ADIDAS',
    variant_name: null,
    sku: null,
    base_unit: 'unit',
    current_price: 72800,
    stock_quantity: 44,
    stock_status: 'medium_stock',
    has_variant: true,
    variant_count: 2,
    state: true,
  }
  const negroRow = {
    ...baseRow,
    variant_id: 'VAR-NEGRO',
    is_base_row: false,
    variant_name: 'NEGRO M',
    sku: 'CC2Y5J-NEGRO-M',
    current_price: 75000,
    stock_quantity: 5,
    stock_status: 'in_stock',
  }
  const verdeRow = {
    ...baseRow,
    variant_id: 'VAR-VERDE',
    is_base_row: false,
    variant_name: 'VERDE XL',
    sku: 'CC2Y5J-VERDE-XL',
    stock_quantity: 0,
    stock_status: 'out_of_stock',
  }

  const mockUnits = (rows: unknown[]) => {
    searchAdvancedMock.mockResolvedValue({
      products: rows,
      total_count: rows.length,
      page: 1,
      page_size: 12,
      total_pages: 1,
    } as never)
  }

  const openBuilder = async () => {
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))
  }

  const typeProductSearch = async (term: string) => {
    await userEvent.type(
      screen.getByPlaceholderText('Buscar producto por nombre o código… (F3)'),
      term,
    )
  }

  it('cada fila del dropmenu muestra el stock y precio de SU unidad (sin N+1 de variantes)', async () => {
    mockUnits([baseRow, negroRow, verdeRow])
    renderPage()
    await openBuilder()
    await typeProductSearch('cam')

    const negro = await screen.findByTestId('counterorder-pick-VAR-NEGRO')
    expect(negro).toHaveTextContent('CAMISETA ADIDAS · NEGRO M')
    expect(negro).toHaveTextContent('CC2Y5J-NEGRO-M')
    expect(negro).toHaveTextContent('Stock: 5')

    // Sin unidades: "Sin stock" en vez de "Stock: 0".
    expect(screen.getByTestId('counterorder-pick-VAR-VERDE')).toHaveTextContent('Sin stock')

    // La fila base lleva su chip y SU stock (44), no el agregado.
    const base = screen.getByTestId('counterorder-pick-PROD-CAM')
    expect(base).toHaveTextContent('Producto base')
    expect(base).toHaveTextContent('Stock: 44')

    // La búsqueda usa el camino plano compartido con /ventas.
    expect(searchAdvancedMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'cam', granularity: 'variant' }),
    )
  })

  it('agrega la variante y el producto base como líneas distintas de la tabla', async () => {
    mockUnits([baseRow, negroRow])
    renderPage()
    await openBuilder()

    await typeProductSearch('cam')
    await userEvent.click(await screen.findByTestId('counterorder-pick-VAR-NEGRO'))
    expect(screen.getByTestId('counterorder-builder-lines')).toHaveTextContent(
      'CAMISETA ADIDAS · NEGRO M',
    )

    // Tras agregar, el dropmenu se cierra y limpia el término: re-buscar para
    // la segunda línea.
    await typeProductSearch('cam')
    await userEvent.click(await screen.findByTestId('counterorder-pick-PROD-CAM'))
    expect(screen.getByTestId('counterorder-builder-lines')).toHaveTextContent('CAMISETA ADIDAS')
    expect(screen.getByTestId('counterorder-builder-units')).toHaveTextContent('2 unidades')
  })

  it('un producto sin variantes se agrega con click en su fila', async () => {
    mockUnits([
      { ...baseRow, id: 'PROD-SIMPLE', has_variant: false, variant_count: 0, is_base_row: false },
    ])
    renderPage()
    await openBuilder()
    await typeProductSearch('sim')
    await userEvent.click(await screen.findByTestId('counterorder-pick-PROD-SIMPLE'))
    expect(screen.getByTestId('counterorder-builder-lines')).toHaveTextContent('CAMISETA ADIDAS')
  })

  // §6.3: el carrito es una tabla de datos (como la de /ventas) con el empty
  // DENTRO de la tabla, y los controles de cantidad siguen operativos.
  it('carrito §6.3: columnas, empty dentro de la tabla y control de cantidad', async () => {
    mockUnits([
      { ...baseRow, id: 'PROD-SIMPLE', has_variant: false, variant_count: 0, is_base_row: false },
    ])
    renderPage()
    await openBuilder()

    expect(screen.getByTestId('counterorder-builder-empty')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Producto' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Cant.' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Total est.' })).toBeInTheDocument()

    await typeProductSearch('sim')
    await userEvent.click(await screen.findByTestId('counterorder-pick-PROD-SIMPLE'))
    expect(screen.queryByTestId('counterorder-builder-empty')).not.toBeInTheDocument()

    // jsdom renderiza la vista mobile también (las clases md: no aplican):
    // los controles se buscan dentro del tbody de la tabla.
    await userEvent.click(
      within(screen.getByTestId('counterorder-builder-lines')).getByRole('button', {
        name: 'Sumar',
      }),
    )
    expect(screen.getByTestId('counterorder-builder-units')).toHaveTextContent('2 unidades')
  })

  it('el dropdown de cliente muestra nombre + apellido (displayName, no solo primer nombre)', async () => {
    // Shape cruda del backend (parties): el store la normaliza y arma
    // displayName "Fernando Maciel"; el builder debe mostrarlo completo.
    searchByNameMock.mockResolvedValue([
      { id: 'client-1', first_name: 'Fernando', last_name: 'Maciel' },
    ] as unknown as Awaited<ReturnType<typeof clientService.searchByName>>)
    renderPage()
    await openBuilder()

    const input = screen.getByPlaceholderText('Buscar cliente por nombre…')
    await userEvent.type(input, 'fer')
    // Antes mostraba "Fernando" (c.name = primer nombre).
    expect(
      await screen.findByRole('button', { name: 'Fernando Maciel' }, { timeout: 2500 }),
    ).toBeInTheDocument()
  })

  // ── Navegación por teclado (§12.5: modal con buscador interno) ──

  it('abre con el foco en el escáner de código de barras', async () => {
    renderPage()
    await openBuilder()
    // El autofoco corre en un tick posterior al focus del contenedor del modal.
    await waitFor(() =>
      expect(screen.getByTestId('counterorder-builder-barcode')).toHaveFocus(),
    )
  })

  it('F3 enfoca el buscador de productos (desde cualquier campo del modal)', async () => {
    renderPage()
    await openBuilder()
    await screen.findByTestId('counterorder-builder-barcode')

    fireEvent.keyDown(window, { key: 'F3' })
    expect(
      screen.getByPlaceholderText('Buscar producto por nombre o código… (F3)'),
    ).toHaveFocus()

    // También desde otro input (cliente).
    await userEvent.click(screen.getByPlaceholderText('Buscar cliente por nombre…'))
    fireEvent.keyDown(window, { key: 'F3' })
    expect(
      screen.getByPlaceholderText('Buscar producto por nombre o código… (F3)'),
    ).toHaveFocus()
  })

  it('tras agregar una fila del dropmenu el foco vuelve al buscador', async () => {
    mockUnits([baseRow, negroRow])
    renderPage()
    await openBuilder()
    await typeProductSearch('cam')
    await userEvent.click(await screen.findByTestId('counterorder-pick-VAR-NEGRO'))

    expect(screen.getByTestId('counterorder-builder-lines')).toHaveTextContent(
      'CAMISETA ADIDAS · NEGRO M',
    )
    expect(
      screen.getByPlaceholderText('Buscar producto por nombre o código… (F3)'),
    ).toHaveFocus()
  })

  it('↑/↓ en un input de cantidad mueve el foco entre líneas del carrito', async () => {
    mockUnits([baseRow, negroRow])
    renderPage()
    await openBuilder()
    await typeProductSearch('cam')
    await userEvent.click(await screen.findByTestId('counterorder-pick-VAR-NEGRO'))
    await typeProductSearch('cam')
    await userEvent.click(await screen.findByTestId('counterorder-pick-PROD-CAM'))

    // jsdom renderiza ambas vistas: los inputs de la tabla desktop viven en
    // el tbody (la vista mobile es la misma línea sin el testid del tbody).
    const qtyInputs = within(screen.getByTestId('counterorder-builder-lines')).getAllByRole(
      'spinbutton',
    )
    expect(qtyInputs).toHaveLength(2)
    qtyInputs[0].focus()
    fireEvent.keyDown(qtyInputs[0], { key: 'ArrowDown' })
    expect(qtyInputs[1]).toHaveFocus()
    fireEvent.keyDown(qtyInputs[1], { key: 'ArrowUp' })
    expect(qtyInputs[0]).toHaveFocus()
  })

  it('Esc con el dropmenu abierto cierra solo la lista, no el modal', async () => {
    mockUnits([baseRow, negroRow])
    renderPage()
    await openBuilder()
    await typeProductSearch('cam')
    expect(await screen.findByTestId('counterorder-pick-VAR-NEGRO')).toBeInTheDocument()

    fireEvent.keyDown(
      screen.getByPlaceholderText('Buscar producto por nombre o código… (F3)'),
      { key: 'Escape' },
    )
    // El dropdown se cerró...
    expect(screen.queryByTestId('counterorder-pick-VAR-NEGRO')).not.toBeInTheDocument()
    // ...pero el modal sigue abierto.
    expect(screen.getByTestId('counterorder-builder')).toBeInTheDocument()
  })
})
