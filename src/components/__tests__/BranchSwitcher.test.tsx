/**
 * BranchSwitcher — selector de sucursal del header.
 *
 * Contrato: NUNCA ofrece la vista global "Todas las Sucursales" (ni para
 * admin — la única salida en vista global es la emergencia de instalación
 * vacía en BranchSelection), traduce branch_type sin exponer enums crudos,
 * omite la ciudad cuando no existe, y auto-ancla a la primera sucursal una
 * sesión que quedó en vista global (currentBranchId null).
 *
 * Mocks en la frontera: BranchContext, AuthContext, branchService e i18n
 * (firma real t(key, fallback?, vars?), fallback español). lucide-react NO
 * se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BranchSwitcher from '../BranchSwitcher'
import { branchService } from '@/features/branches/services/branchService'
import type { Branch } from '@/types'

const h = vi.hoisted(() => ({
  changeBranch: vi.fn(),
  branchState: {
    currentBranchId: 1 as number | null,
    allowedBranches: [1, 2],
    canViewGlobal: true,
  },
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback
        .replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`))
        .replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ ...h.branchState, changeBranch: h.changeBranch }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: { getBranches: vi.fn() },
}))

const branches: Branch[] = [
  {
    id: 1,
    code: 'MAIN',
    name: 'Sucursal Principal',
    branch_type: 'HEADQUARTERS',
    city: 'Asuncion',
    is_active: true,
    is_warehouse: false,
    allows_sales: true,
    allows_purchases: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    code: 'JS',
    name: 'JUST STYLE',
    branch_type: 'POINT_OF_SALE',
    is_active: true,
    is_warehouse: false,
    allows_sales: true,
    allows_purchases: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

const renderSwitcher = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchSwitcher />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  h.branchState.currentBranchId = 1
  h.branchState.allowedBranches = [1, 2]
  h.branchState.canViewGlobal = true
  vi.mocked(branchService.getBranches).mockResolvedValue({
    branches,
    total: branches.length,
    page: 1,
    page_size: 100,
  })
})

describe('BranchSwitcher', () => {
  it('nunca ofrece la vista global "Todas las Sucursales", ni para admin', async () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Sucursal' }))
    await waitFor(() => expect(screen.getByText('JUST STYLE')).toBeInTheDocument())
    expect(screen.queryByText('Todas las Sucursales')).not.toBeInTheDocument()
  })

  it('traduce el tipo de sucursal y omite la ciudad vacía (sin enums crudos ni placeholder)', async () => {
    renderSwitcher()
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Sucursal' }))
    await waitFor(() => expect(screen.getByText('JUST STYLE')).toBeInTheDocument())
    expect(screen.getByText('Casa Central • Asuncion')).toBeInTheDocument()
    expect(screen.getByText('Punto de Venta')).toBeInTheDocument()
    expect(screen.queryByText(/POINT_OF_SALE|HEADQUARTERS/)).not.toBeInTheDocument()
    expect(screen.queryByText('Ubicación')).not.toBeInTheDocument()
  })

  it('auto-ancla a la primera sucursal una sesión que quedó en vista global', async () => {
    h.branchState.currentBranchId = null
    renderSwitcher()
    await waitFor(() => expect(h.changeBranch).toHaveBeenCalledWith(1))
  })
})
