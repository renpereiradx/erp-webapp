/**
 * PLAN_REBUILD_BI_UI_FRONTEND F2 — con la landing BI re-implementada,
 * HomeRedirect vuelve a respetar dashboard:read + pack BI (ADR-6) y el
 * vendor puro sigue aterrizando en /pedidos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const authState = {
  hasPermission: vi.fn<(p: string) => boolean>(() => true),
  hasEntitlement: vi.fn<(m: string) => boolean>(() => true),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
  useBiPackEnabled: () => authState.hasEntitlement('bi'),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }))

import HomeRedirect from '../HomeRedirect'
import BiModuleRoute from '../BiModuleRoute'
import { toast } from 'sonner'

const renderAt = (ui: React.ReactElement) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path='/' element={ui} />
        <Route path='/dashboard' element={<div>LANDING_DASHBOARD</div>} />
        <Route path='/pedidos' element={<div>LANDING_PEDIDOS</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('HomeRedirect (F2 — landing BI restaurada)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.hasPermission.mockImplementation(() => true)
    authState.hasEntitlement.mockImplementation(() => true)
  })

  it('admin con dashboard:read y pack BI → /dashboard', () => {
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_DASHBOARD')).toBeTruthy()
  })

  it('admin sin pack BI → /pedidos (ERP Core)', () => {
    authState.hasEntitlement.mockImplementation(() => false)
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
  })

  it('usuario sin dashboard:read → /pedidos', () => {
    authState.hasPermission.mockImplementation((p) => p !== 'dashboard:read')
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
  })

  it('vendedor puro (counterorders:read sin sales:write) → /pedidos aunque tenga pack', () => {
    authState.hasPermission.mockImplementation(
      (p) => p === 'dashboard:read' || p === 'counterorders:read',
    )
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
  })
})

describe('BiModuleRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.hasPermission.mockImplementation(() => true)
    authState.hasEntitlement.mockImplementation(() => true)
  })

  it('con pack BI renderiza los hijos', () => {
    renderAt(<BiModuleRoute><div>CONTENIDO_BI</div></BiModuleRoute>)
    expect(screen.getByText('CONTENIDO_BI')).toBeTruthy()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('sin pack BI redirige a /pedidos y avisa una vez', async () => {
    authState.hasEntitlement.mockImplementation(() => false)
    const { rerender } = renderAt(<BiModuleRoute><div>CONTENIDO_BI</div></BiModuleRoute>)

    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))

    // Re-render (cambio de ruta dentro del pack): el toast no se repite.
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<BiModuleRoute><div>CONTENIDO_BI_2</div></BiModuleRoute>} />
          <Route path='/pedidos' element={<div>LANDING_PEDIDOS</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})
