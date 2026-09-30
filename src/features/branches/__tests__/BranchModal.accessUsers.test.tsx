/**
 * BranchModal — pestaña Accesos: identificación de los usuarios autorizados.
 *
 * user_branch_access solo trae user_id (el código); el modal lo cruza contra
 * el listado de usuarios ya cargado (userService.getUsers, la misma query del
 * selector de asignación) para mostrar nombre, @usuario y rol. Un usuario
 * ausente del listado (paginado) cae con gracia al código crudo.
 *
 * Mocks en la frontera: branchService, userService e i18n (firma real
 * t(key, fallback?, vars?), fallback español). useToast es autocontenido.
 * lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BranchModal from '../components/BranchModal'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

const getUsers = vi.fn<() => Promise<unknown>>()
const getFiscalConfigs = vi.fn<() => Promise<unknown>>()
const getAccesses = vi.fn<() => Promise<unknown>>()

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: (...args: unknown[]) => getUsers(...(args as [])),
  },
}))

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getFiscalConfigs: (...args: unknown[]) => getFiscalConfigs(...(args as [])),
    getAccesses: (...args: unknown[]) => getAccesses(...(args as [])),
    createBranch: vi.fn(),
    updateBranch: vi.fn(),
    grantAccess: vi.fn(),
    updateAccess: vi.fn(),
    revokeAccess: vi.fn(),
    createFiscalConfig: vi.fn(),
    deleteFiscalConfig: vi.fn(),
    setFiscalEnabled: vi.fn(),
  },
}))

const branch = {
  id: 1,
  code: 'MAIN',
  name: 'Nombre Sucursal',
  branch_type: 'HEADQUARTERS',
  is_active: true,
  is_warehouse: false,
  allows_sales: true,
  allows_purchases: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const usersFixture = [
  {
    id: 'u-ada',
    first_name: 'Ada',
    last_name: 'Lovelace',
    username: 'ada',
    email: 'ada@erp.py',
    status: 'active',
    roles: [{ id: 'VNDR01', name: 'Vendedor' }],
  },
  {
    id: 'u-grace',
    first_name: 'Grace',
    last_name: 'Hopper',
    username: 'grace',
    email: 'grace@erp.py',
    status: 'blocked',
    roles: [{ id: 'ADM01', name: 'Administrador' }],
  },
]

const accessFixture = [
  {
    id: 1,
    user_id: 'u-ada',
    branch_id: 1,
    access_type: 'FULL',
    is_default_branch: true,
    granted_at: '2026-09-01T12:00:00Z',
  },
  {
    id: 2,
    user_id: 'u-grace',
    branch_id: 1,
    access_type: 'LIMITED',
    is_default_branch: false,
    granted_at: '2026-09-02T12:00:00Z',
  },
  {
    id: 3,
    user_id: 'usr-fuera-de-pagina',
    branch_id: 1,
    access_type: 'READ_ONLY',
    is_default_branch: false,
    granted_at: '2026-09-03T12:00:00Z',
  },
]

const renderModal = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchModal isOpen onClose={vi.fn()} branch={branch} initialTab="access" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getUsers.mockResolvedValue({ data: usersFixture, pagination: { page: 1, page_size: 100, total_items: 2, total_pages: 1, has_next: false, has_prev: false } })
  getFiscalConfigs.mockResolvedValue({ data: [] })
  getAccesses.mockResolvedValue({ data: accessFixture })
})

afterEach(cleanup)

describe('BranchModal — usuarios autorizados con nombre', () => {
  it('muestra nombre, @usuario, rol y el código de cada usuario resuelto', async () => {
    renderModal()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    // El @usuario comparte span con el código: matchear por regex.
    expect(screen.getByText(/@ada/)).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByText('u-ada')).toBeInTheDocument()

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
  })

  it('marca como Inactivo al usuario sin sesión activa', async () => {
    renderModal()

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('cae al código crudo cuando el usuario no está en el listado', async () => {
    renderModal()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    // Sin nombre resuelto, el código aparece como nombre y como sublínea.
    expect(screen.getAllByText('usr-fuera-de-pagina').length).toBeGreaterThan(0)
  })
})
