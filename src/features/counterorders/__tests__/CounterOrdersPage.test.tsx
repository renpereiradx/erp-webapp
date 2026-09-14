// ===========================================================================
// Tests de la bandeja /pedidos (PLAN_PEDIDOS_MOSTRADOR — FASE 2.5).
// Mocks en la frontera: módulo del service, AuthContext, BranchContext,
// i18n (firma real t(key, fallback, vars)) y módulos pesados del builder.
// ===========================================================================

import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
  },
}))

// Módulos pesados del builder: el modal cerrado no participa en estos tests.
// El catálogo plano es controlable por test (grilla de unidades vendibles).
const catalogMock = vi.hoisted(() => ({
  units: [] as Array<Record<string, unknown>>,
}))
vi.mock('@/features/catalog/hooks/useCatalogProducts', () => ({
  useCatalogProducts: () => ({
    data: { products: [], total: 0, page: 1, totalPages: 1 },
    isLoading: false,
  }),
  useCatalogSellableUnits: () => ({
    data: { products: catalogMock.units, total: catalogMock.units.length, page: 1, totalPages: 1 },
    isLoading: false,
  }),
}))
vi.mock('@/features/catalog/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown) => value,
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

const listMock = vi.mocked(counterOrderService.list)
const cancelMock = vi.mocked(counterOrderService.cancel)
const claimMock = vi.mocked(counterOrderService.claim)
const searchByNameMock = vi.mocked(clientService.searchByName)

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
  catalogMock.units = []
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
})

describe('OrderBuilder — picker plano de unidades vendibles', () => {
  // Filas tal cual las emite granularity=variant: fila base primero y
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

  it('cada fila plana muestra el stock y precio de SU unidad (sin N+1 de variantes)', async () => {
    catalogMock.units = [baseRow, negroRow, verdeRow]
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))

    const negro = screen.getByTestId('counterorder-pick-VAR-NEGRO')
    expect(negro).toHaveTextContent('CAMISETA ADIDAS · NEGRO M')
    expect(negro).toHaveTextContent('CC2Y5J-NEGRO-M')
    expect(negro).toHaveTextContent('Stock: 5')

    // Sin unidades: "Sin stock" en vez de "Stock: 0".
    expect(screen.getByTestId('counterorder-pick-VAR-VERDE')).toHaveTextContent('Sin stock')

    // La fila base lleva su chip y SU stock (44), no el agregado.
    const base = screen.getByTestId('counterorder-pick-PROD-CAM')
    expect(base).toHaveTextContent('Producto base')
    expect(base).toHaveTextContent('Stock: 44')
  })

  it('agrega la variante y el producto base como líneas distintas', async () => {
    catalogMock.units = [baseRow, negroRow]
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))

    await userEvent.click(screen.getByTestId('counterorder-add-PROD-CAM'))
    const lines = screen.getByTestId('counterorder-builder-lines')
    expect(lines).toHaveTextContent('CAMISETA ADIDAS')

    await userEvent.click(await screen.findByTestId('counterorder-add-VAR-NEGRO'))
    expect(lines).toHaveTextContent('CAMISETA ADIDAS · NEGRO M')
    expect(screen.getByTestId('counterorder-builder-units')).toHaveTextContent('2 unidades')
  })

  it('los productos sin variante conservan su botón Agregar directo', async () => {
    catalogMock.units = [{ ...baseRow, id: 'PROD-SIMPLE', has_variant: false, variant_count: 0, is_base_row: false }]
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))
    await userEvent.click(await screen.findByTestId('counterorder-add-PROD-SIMPLE'))
    expect(screen.getByTestId('counterorder-builder-lines')).toHaveTextContent('CAMISETA ADIDAS')
  })

  it('densidad: una sola tarjeta muestra las variantes extras tras "+n variantes más"', async () => {
    const manyVariants = ['V1', 'V2', 'V3', 'V4'].map((v, i) => ({
      ...baseRow,
      variant_id: `VAR-${v}`,
      is_base_row: false,
      variant_name: `COLOR ${v}`,
      sku: `SKU-${v}`,
      stock_quantity: i + 1,
      stock_status: 'in_stock',
    }))
    catalogMock.units = [baseRow, ...manyVariants]
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))

    // Cap: base + 3 variantes visibles; la 4ta queda tras el CTA.
    expect(screen.queryByTestId('counterorder-pick-VAR-V4')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('counterorder-pick-more-PROD-CAM'))
    expect(await screen.findByTestId('counterorder-pick-VAR-V4')).toBeInTheDocument()
  })

  it('el dropdown de cliente muestra nombre + apellido (displayName, no solo primer nombre)', async () => {
    // Shape cruda del backend (parties): el store la normaliza y arma
    // displayName "Fernando Maciel"; el builder debe mostrarlo completo.
    searchByNameMock.mockResolvedValue([
      { id: 'client-1', first_name: 'Fernando', last_name: 'Maciel' },
    ] as unknown as Awaited<ReturnType<typeof clientService.searchByName>>)
    renderPage()
    await userEvent.click(await screen.findByTestId('counterorders-new-button'))

    const input = screen.getByPlaceholderText('Buscar cliente por nombre…')
    await userEvent.type(input, 'fer')
    // Antes mostraba "Fernando" (c.name = primer nombre).
    expect(
      await screen.findByRole('button', { name: 'Fernando Maciel' }, { timeout: 2500 }),
    ).toBeInTheDocument()
  })
})
