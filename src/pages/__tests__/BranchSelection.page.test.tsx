/**
 * BranchSelection — página de elección de sucursal post-login.
 *
 * Contrato cubierto:
 * - Instalación sin sucursales + admin (canViewGlobal): la página NO es un
 *   callejón sin salida — ofrece "Continuar en vista global" que llama
 *   changeBranch(null) (fix 2026-09-26: instalación limpia sin seed de MAIN
 *   dejaba al admin trabado tras el login).
 * - Sin sucursales + NO admin: mensaje "no tienes sucursales asignadas" y
 *   sin salida de vista global.
 * - Con sucursales: se muestran las tarjetas (admin ve todas).
 *
 * Mocks en la frontera: AuthContext, BranchContext, branchService e i18n
 * (firma real t(key, fallback?, vars?)). lucide-react NO se mockea
 * (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BranchSelection from '../BranchSelection'

const mockChangeBranch = vi.fn<(branchId: number | null) => void>()

const branchContext = {
  currentBranchId: null as number | null,
  allowedBranches: [] as number[],
  isGlobalView: true,
  changeBranch: mockChangeBranch,
  canViewGlobal: true,
}

const authContext = {
  user: { first_name: 'Ada', last_name: 'Lovelace', role_id: 'F2VLso' },
  logout: vi.fn(),
  hasPermission: (permission: string) => permission === 'dashboard:read',
}

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

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authContext,
}))

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => branchContext,
}))

const getBranches = vi.fn<() => Promise<unknown>>()

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: { getBranches: (...args: unknown[]) => getBranches(...(args as [])) },
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/select-branch']}>
      <Routes>
        <Route path="/select-branch" element={<BranchSelection />} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
        <Route path="/pedidos" element={<div>pedidos</div>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  branchContext.currentBranchId = null
  branchContext.allowedBranches = []
  branchContext.canViewGlobal = true
})

describe('BranchSelection', () => {
  it('admin sin sucursales: ofrece continuar en vista global y llama changeBranch(null)', async () => {
    getBranches.mockResolvedValue({ branches: [], total: 0 })
    renderPage()

    const continueBtn = await screen.findByRole('button', { name: /continuar en vista global/i })
    await userEvent.click(continueBtn)

    expect(mockChangeBranch).toHaveBeenCalledWith(null)
  })

  it('no admin sin sucursales: mensaje de contacto al admin, sin salida de vista global', async () => {
    branchContext.canViewGlobal = false
    getBranches.mockResolvedValue({ branches: [], total: 0 })
    renderPage()

    expect(await screen.findByText(/no tienes sucursales asignadas/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continuar en vista global/i })).not.toBeInTheDocument()
    expect(mockChangeBranch).not.toHaveBeenCalled()
  })

  it('con sucursales: muestra las tarjetas (el admin ve todas)', async () => {
    branchContext.allowedBranches = [1]
    getBranches.mockResolvedValue({
      branches: [{ id: 1, code: 'MAIN', name: 'Sucursal Principal', address: null, city: 'Asunción' }],
      total: 1,
    })
    renderPage()

    const card = await screen.findByRole('button', { name: /sucursal principal/i })
    await userEvent.click(card)

    expect(mockChangeBranch).toHaveBeenCalledWith(1)
  })
})
