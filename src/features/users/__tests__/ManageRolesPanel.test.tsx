/**
 * ManageRolesPanel — cambio de rol en sistema mono-rol.
 *
 * Contrato cubierto (bug 2026-09: con un solo rol asignado era imposible
 * "cambiar rol" — remover el último está bloqueado y asignar otro devuelve
 * 409 USER_ALREADY_HAS_ROLE):
 * - La lista de disponibles ofrece "Usar este rol" (reemplazo atómico PUT).
 * - Con confirmación llama a replaceRole(userId, roleId); sin ella no llama.
 * - Si el objetivo es el propio usuario, el confirm incluye el aviso.
 *
 * Mocks en la frontera: useUserStore, AuthContext, sonner e i18n (firma
 * real, fallback español). domain/users y ui/* reales. lucide-react NO se
 * mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManageRolesPanel } from '../components/ManageRolesPanel'
import type { User } from '@/types'

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

const replaceRole = vi.fn()
const assignRole = vi.fn()
const removeRole = vi.fn()
const fetchRoles = vi.fn()

vi.mock('@/store/useUserStore', () => ({
  default: () => ({
    roles: [
      { id: 'VNDR01', name: 'VENDEDOR' },
      { id: 'F2VLso', name: 'ADMINISTRADOR' },
    ],
    fetchRoles,
    assignRole,
    removeRole,
    replaceRole,
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me-1' } }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    warning: vi.fn(),
  },
}))

const baseUser = {
  id: 'u-1',
  first_name: 'Maria',
  last_name: 'Morgan',
  username: 'mmorgan',
  email: 'm.morgan@gmail.com',
  avatar_url: null,
  roles: [{ id: 'VNDR01', name: 'VENDEDOR' }],
} as unknown as User

const renderPanel = (user: User = baseUser) =>
  render(<ManageRolesPanel user={user} open onOpenChange={vi.fn()} />)

beforeEach(() => {
  vi.clearAllMocks()
  replaceRole.mockResolvedValue({ success: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ManageRolesPanel — cambiar rol (mono-rol)', () => {
  it('ofrece "Usar este rol" en los disponibles y reemplaza con confirmación', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPanel()

    expect(screen.getByText('VENDEDOR')).toBeInTheDocument()
    const useButton = screen.getByRole('button', { name: /usar este rol/i })
    await user.click(useButton)

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('ADMINISTRADOR'))
    expect(replaceRole).toHaveBeenCalledWith('u-1', 'F2VLso')
    expect(toastSuccess).toHaveBeenCalledWith('Rol actualizado correctamente.')
  })

  it('sin confirmación no llama a replaceRole', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPanel()

    await user.click(screen.getByRole('button', { name: /usar este rol/i }))

    expect(replaceRole).not.toHaveBeenCalled()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('avisa cuando el objetivo es el propio usuario', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPanel({ ...baseUser, id: 'me-1' } as User)

    await user.click(screen.getByRole('button', { name: /usar este rol/i }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('propio'))
    expect(replaceRole).not.toHaveBeenCalled()
  })

  it('muestra el error del backend si el reemplazo falla', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    replaceRole.mockResolvedValue({ success: false, error: 'ECONNREFUSED' })
    renderPanel()

    await user.click(screen.getByRole('button', { name: /usar este rol/i }))

    expect(toastError).toHaveBeenCalledWith('ECONNREFUSED')
  })
})
