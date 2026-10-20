/**
 * PLAN_REBUILD_BI_UI_FRONTEND F1 — HomeRedirect aterriza en /pedidos para
 * todos los perfiles mientras no existan rutas BI. F2 restaura /dashboard y
 * la regla de entitlement (ADR-6). BiModuleRoute es infraestructura Core del
 * pack y se conserva para F2+.
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
        <Route path='/pedidos' element={<div>LANDING_PEDIDOS</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('HomeRedirect (F1 teardown window)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.hasPermission.mockImplementation(() => true)
    authState.hasEntitlement.mockImplementation(() => true)
  })

  it('admin con dashboard:read y pack BI → /pedidos', () => {
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
  })

  it('admin sin pack BI → /pedidos (ERP Core)', () => {
    authState.hasEntitlement.mockImplementation(() => false)
    renderAt(<HomeRedirect />)
    expect(screen.getByText('LANDING_PEDIDOS')).toBeTruthy()
  })

  it('vendedor sin dashboard:read → /pedidos', () => {
    authState.hasPermission.mockImplementation(() => false)
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
