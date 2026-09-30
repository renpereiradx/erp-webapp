/**
 * UserBranchesCard — card "Sucursales Asignadas" del detalle de usuario.
 *
 * Cubre los 3 estados de datos (DESIGN §6.7): loading (skeleton), error
 * (mensaje + Reintentar que refetcha), empty (mensaje + hint) y datos
 * (lista con link a Configuración → Sucursales).
 *
 * Mocks en la frontera: branchService e i18n (firma real, fallback español).
 * react-query y router reales (QueryClientProvider + MemoryRouter).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { UserBranchesCard } from '../components/UserBranchesCard'

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

const getUserBranches = vi.fn<() => Promise<unknown>>()
const getBranches = vi.fn<() => Promise<unknown>>()

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getUserBranches: (...args: unknown[]) => getUserBranches(...(args as [])),
    getBranches: (...args: unknown[]) => getBranches(...(args as [])),
  },
}))

const branchesFixture = [
  {
    id: 1,
    code: 'MAIN',
    name: 'Sucursal Principal',
    branch_type: 'HEADQUARTERS',
    is_active: true,
    is_warehouse: false,
    allows_sales: true,
    allows_purchases: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

const renderCard = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserBranchesCard userId="u-1" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  getBranches.mockResolvedValue({ branches: branchesFixture })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UserBranchesCard', () => {
  it('lista las sucursales asignadas con nombre, código, nivel y badge de por defecto', async () => {
    getUserBranches.mockResolvedValue({
      access: [
        { id: 1, user_id: 'u-1', branch_id: 1, access_type: 'FULL', is_default_branch: true, granted_at: '2026-09-01T12:00:00Z' },
      ],
    })
    renderCard()
    expect(await screen.findByText('Sucursal Principal')).toBeInTheDocument()
    expect(screen.getByText('MAIN')).toBeInTheDocument()
    expect(screen.getByText('Acceso total')).toBeInTheDocument()
    expect(screen.getByText('Por defecto')).toBeInTheDocument()
    expect(
      screen.getByText('Administrar accesos en Configuración → Sucursales'),
    ).toBeInTheDocument()
  })

  it('muestra el estado vacío con hint cuando el usuario no tiene sucursales', async () => {
    getUserBranches.mockResolvedValue({ access: [] })
    renderCard()
    expect(await screen.findByText('Sin sucursales asignadas.')).toBeInTheDocument()
    expect(
      screen.getByText('Este usuario todavía no tiene acceso a ninguna sucursal.'),
    ).toBeInTheDocument()
  })

  it('muestra error con Reintentar y refetcha al accionarlo', async () => {
    const user = userEvent.setup()
    getUserBranches.mockRejectedValueOnce(new Error('403'))
    renderCard()
    expect(
      await screen.findByText('No se pudieron cargar las sucursales asignadas.'),
    ).toBeInTheDocument()
    getUserBranches.mockResolvedValueOnce({
      access: [
        { id: 1, user_id: 'u-1', branch_id: 1, access_type: 'FULL', is_default_branch: false, granted_at: '2026-09-01T12:00:00Z' },
      ],
    })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Sucursal Principal')).toBeInTheDocument()
  })

  it('muestra el skeleton mientras carga', () => {
    getUserBranches.mockReturnValue(new Promise(() => {}))
    renderCard()
    expect(screen.getByTestId('user-branches-skeleton')).toBeInTheDocument()
  })
})
