/**
 * PLAN_BI_PACK_PREMIUM F3 — entitlements en AuthContext (ADR-5): llegada por
 * /me (fuente canónica), por login, espejo localStorage, revocación en
 * caliente vía refreshEntitlements y fail-open sin dato.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

vi.mock('@/services/api', () => ({
  default: {
    getToken: vi.fn(() => 'tok'),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}))
vi.mock('@/services/authService', () => ({
  default: { login: vi.fn(), logout: vi.fn() },
}))
vi.mock('@/services/userService', () => ({
  default: { getMe: vi.fn() },
}))
vi.mock('@/config/demoAuth', () => ({
  DEMO_CONFIG: { enabled: false },
  DEMO_ENTITLEMENTS: { edition: 'core+bi', modules: ['bi'], bi_expires_at: null },
}))

import userService from '@/services/userService'
import authService from '@/services/authService'

const CORE = { edition: 'core', modules: [] as string[], bi_expires_at: null }
const BI = { edition: 'core+bi', modules: ['bi'], bi_expires_at: '2027-09-21T12:00:00Z' }

let observed: { hasEntitlement: (m: string) => boolean; entitlements: unknown } | null = null

function Probe() {
  const { hasEntitlement, entitlements, refreshEntitlements, login, logout } = useAuth()
  observed = { hasEntitlement, entitlements }
  return (
    <div>
      <span>BI:{hasEntitlement('bi') ? 'on' : 'off'}</span>
      <button onClick={() => void refreshEntitlements()}>refresh</button>
      <button onClick={() => void login({ username: 'u', password: 'p' })}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

describe('AuthContext — entitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    observed = null
  })

  it('/me con pack → BI on y espejo persistido', async () => {
    vi.mocked(userService.getMe).mockResolvedValue({
      success: true,
      data: { entitlements: BI },
    } as never)

    renderProvider()
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('entitlements')!)).toEqual(BI)
  })

  it('/me sin pack (ERP Core) → BI off tras resolver (fail-closed con dato)', async () => {
    vi.mocked(userService.getMe).mockResolvedValue({
      success: true,
      data: { entitlements: CORE },
    } as never)

    renderProvider()
    await waitFor(() => expect(screen.getByText('BI:off')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('entitlements')!)).toEqual(CORE)
  })

  it('fail-open: /me sin entitlements (backend legacy) mantiene BI on', async () => {
    vi.mocked(userService.getMe).mockResolvedValue({
      success: true,
      data: {},
    } as never)

    renderProvider()
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy())
    expect(observed!.entitlements).toBeNull()
    expect(localStorage.getItem('entitlements')).toBeNull()
  })

  it('login entrega entitlements inmediatos y los persiste', async () => {
    vi.mocked(userService.getMe).mockResolvedValue({ success: false } as never)
    // El token debe coincidir con apiService.getToken() del mock (guard de login).
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      token: 'tok',
      entitlements: BI,
    } as never)

    renderProvider()
    await waitFor(() => screen.getByText('login'))
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('entitlements')!)).toEqual(BI)
  })

  it('refreshEntitlements (revocación en caliente) pasa de BI a Core', async () => {
    vi.mocked(userService.getMe)
      .mockResolvedValueOnce({ success: true, data: { entitlements: BI } } as never)
      .mockResolvedValueOnce({ success: true, data: { entitlements: CORE } } as never)

    renderProvider()
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy())

    await act(async () => {
      screen.getByText('refresh').click()
    })
    await waitFor(() => expect(screen.getByText('BI:off')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('entitlements')!)).toEqual(CORE)
  })

  it('logout limpia el espejo y vuelve a fail-open', async () => {
    vi.mocked(userService.getMe).mockResolvedValue({
      success: true,
      data: { entitlements: BI },
    } as never)

    renderProvider()
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy())

    await act(async () => {
      screen.getByText('logout').click()
    })
    await waitFor(() => expect(screen.getByText('BI:on')).toBeTruthy()) // fail-open sin dato
    expect(localStorage.getItem('entitlements')).toBeNull()
  })
})
