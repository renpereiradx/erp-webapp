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
vi.mock('@/features/catalog/hooks/useCatalogProducts', () => ({
  useCatalogProducts: () => ({ data: undefined, isLoading: false }),
  useCatalogVariants: () => ({ data: undefined, isLoading: false }),
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

import { CounterOrdersPage } from '../components/CounterOrdersPage'
import { counterOrderService } from '@/services/counterOrderService'

const listMock = vi.mocked(counterOrderService.list)
const cancelMock = vi.mocked(counterOrderService.cancel)
const claimMock = vi.mocked(counterOrderService.claim)

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

  it('"Procesar en caja" aparece solo con sales:write y reclama el pedido', async () => {
    mockHasPermission.mockImplementation(
      p => p === 'counterorders:read' || p === 'counterorders:write' || p === 'sales:write',
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
})
