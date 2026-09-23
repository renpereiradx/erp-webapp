/**
 * BranchContext / BranchContext.tsx — contract tests.
 *
 * A5 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): una sucursal guardada en
 * localStorage ('activeBranch') que ya no está en allowed_branches (acceso
 * revocado) debe ignorarse y borrarse — setearla igual haría que todos los
 * requests caigan en 403. Los admins no dependen de la lista (bypass
 * backend por rol), así que conservan su selección guardada.
 *
 * Mocks en la frontera del módulo consumido: @/contexts/AuthContext
 * (fuente de user/token) y @/utils/jwtUtils (decode del token).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'

const authState = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,
  token: null as string | null,
  isAuthenticated: false,
  hasPermission: (_permission: string): boolean => false,
}))

const jwtState = vi.hoisted(() => ({
  payload: null as Record<string, unknown> | null,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/utils/jwtUtils', () => ({
  decodeJWTPayload: () => jwtState.payload,
}))

import { BranchProvider, useBranch } from '@/contexts/BranchContext'

function BranchProbe() {
  const ctx = useBranch()
  return (
    <div>
      <span data-testid="current-branch">{ctx.currentBranchId ?? 'none'}</span>
      <span data-testid="allowed">{ctx.allowedBranches.join(',')}</span>
      <button data-testid="go-global" onClick={() => ctx.changeBranch(null)}>global</button>
      <button data-testid="pick-3" onClick={() => ctx.changeBranch(3)}>sucursal 3</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <BranchProvider>
      <BranchProbe />
    </BranchProvider>,
  )
}

const VENDOR_USER = {
  id: 'u1',
  role_id: 'VNDR01',
  allowed_branches: [2, 3],
}

const ADMIN_USER = {
  id: 'u2',
  role_id: 'F2VLso',
  allowed_branches: [],
}

describe('BranchContext — stale saved branch (A5)', () => {
  beforeEach(() => {
    localStorage.clear()
    authState.user = null
    authState.token = null
    authState.isAuthenticated = false
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('ignores and removes a saved branch that is no longer allowed', async () => {
    localStorage.setItem('activeBranch', '99')
    authState.user = VENDOR_USER
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).not.toBe('99')
    })
    expect(localStorage.getItem('activeBranch')).toBeNull()
    expect(screen.getByTestId('allowed').textContent).toBe('2,3')
  })

  it('falls back to the single allowed branch after dropping a stale selection', async () => {
    localStorage.setItem('activeBranch', '99')
    authState.user = { ...VENDOR_USER, allowed_branches: [2] }
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('2')
    })
    expect(localStorage.getItem('activeBranch')).toBe('2')
  })

  it('keeps a saved branch that is still allowed', async () => {
    localStorage.setItem('activeBranch', '3')
    authState.user = VENDOR_USER
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('3')
    })
    expect(localStorage.getItem('activeBranch')).toBe('3')
  })

  it('keeps the saved branch for admins even with an empty allowed list', async () => {
    localStorage.setItem('activeBranch', '1')
    authState.user = ADMIN_USER
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('1')
    })
    expect(localStorage.getItem('activeBranch')).toBe('1')
  })
})

describe('BranchContext — terminal vinculada (D.4)', () => {
  beforeEach(() => {
    localStorage.clear()
    authState.user = null
    authState.token = null
    authState.isAuthenticated = false
    authState.hasPermission = (_permission: string) => false
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('forces the device branch for a user without branches:switch', async () => {
    localStorage.setItem('device.defaultBranch', '2')
    localStorage.setItem('activeBranch', '3')
    authState.user = VENDOR_USER // allowed: [2, 3]
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('2')
    })
    expect(localStorage.getItem('activeBranch')).toBe('2')
  })

  it('ignores a stale device branch outside the allowed list (normal chain)', async () => {
    localStorage.setItem('device.defaultBranch', '99')
    authState.user = VENDOR_USER
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('none')
    })
  })

  it('ignores the device branch for users with branches:switch', async () => {
    authState.hasPermission = (permission: string) => permission === 'branches:switch'
    localStorage.setItem('device.defaultBranch', '2')
    localStorage.setItem('activeBranch', '3')
    authState.user = VENDOR_USER
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('3')
    })
  })
})

describe('BranchContext — vista global persistente', () => {
  beforeEach(() => {
    localStorage.clear()
    jwtState.payload = null
    authState.user = null
    authState.token = null
    authState.isAuthenticated = false
    authState.hasPermission = (_permission: string) => false
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('marca la vista global y no re-ancla la sucursal del JWT al re-ejecutarse el efecto (refresh de token)', async () => {
    jwtState.payload = { active_branch: 2, allowed_branches: [2, 3] }
    authState.user = VENDOR_USER // allowed: [2, 3]
    authState.token = 'tok-a'
    authState.isAuthenticated = true

    const { rerender } = renderProbe()

    // Primera inicialización: ancla la sucursal del JWT.
    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('2')
    })
    expect(localStorage.getItem('activeBranch')).toBe('2')

    // El usuario elige vista global.
    fireEvent.click(screen.getByTestId('go-global'))
    expect(screen.getByTestId('current-branch').textContent).toBe('none')
    expect(localStorage.getItem('activeBranch')).toBeNull()
    expect(localStorage.getItem('branchView')).toBe('global')

    // Refresh silencioso: cambia el token → el efecto se re-ejecuta.
    authState.token = 'tok-b'
    rerender(
      <BranchProvider>
        <BranchProbe />
      </BranchProvider>,
    )

    // Sin el guard, el efecto re-anclaría la sucursal 2 del JWT.
    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('none')
    })
    expect(localStorage.getItem('activeBranch')).toBeNull()
  })

  it('restaura la vista global tras un F5 (branchView persistido)', async () => {
    localStorage.setItem('branchView', 'global')
    jwtState.payload = { active_branch: 2, allowed_branches: [2, 3] }
    authState.user = VENDOR_USER
    authState.token = 'tok-a'
    authState.isAuthenticated = true

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('none')
    })
    expect(localStorage.getItem('activeBranch')).toBeNull()
  })

  it('elige una sucursal limpia el marcador de vista global', async () => {
    localStorage.setItem('branchView', 'global')
    authState.user = VENDOR_USER // allowed: [2, 3]
    authState.isAuthenticated = true

    renderProbe()
    await waitFor(() => {
      expect(screen.getByTestId('current-branch').textContent).toBe('none')
    })

    fireEvent.click(screen.getByTestId('pick-3'))

    expect(screen.getByTestId('current-branch').textContent).toBe('3')
    expect(localStorage.getItem('activeBranch')).toBe('3')
    expect(localStorage.getItem('branchView')).toBeNull()
  })
})
