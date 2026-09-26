/**
 * UsersTable — la columna USUARIO se acota (truncate + tooltip) para que la
 * columna de acciones nunca quede fuera del viewport con usernames/emails
 * largos sin puntos de corte (bug 2026-09: el ⋮ desaparecía en pantallas
 * angostas porque el contenido estiraba la tabla).
 *
 * Contrato cubierto:
 * - Nombre y sublínea exponen el texto completo en `title` (tooltip).
 * - Cada fila tiene trigger "Acciones" que abre Ver / Editar / Eliminar.
 *
 * Mocks en la frontera: i18n (firma real t(key, fallback?, vars?), fallback
 * español). Router real (MemoryRouter). domain/users y ui/* reales.
 * lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UsersTable } from '../components/UsersTable'
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

const LONG_USER = 'supplies_e88124ab-eae9-4d76-82'
const LONG_EMAIL = 'supplies_e88124ab-eae9-4d76-82@itest.local'

const users = [
  {
    id: 'u-1',
    username: LONG_USER,
    email: LONG_EMAIL,
    first_name: 'Supplies',
    last_name: 'Tester',
    avatar_url: null,
    roles: [{ id: 'F2VLso', name: 'ADMINISTRADOR' }],
    status: 'active',
    last_login_at: null,
  } as unknown as User,
  {
    id: 'u-2',
    username: LONG_USER,
    email: LONG_EMAIL,
    first_name: null,
    last_name: null,
    avatar_url: null,
    roles: [],
    status: 'active',
    last_login_at: null,
  } as unknown as User,
]

const renderTable = (handlers?: {
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
}) =>
  render(
    <MemoryRouter>
      <UsersTable
        users={users}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onEdit={handlers?.onEdit ?? vi.fn()}
        onDelete={handlers?.onDelete ?? vi.fn()}
      />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => cleanup())

describe('UsersTable — columna USUARIO acotada', () => {
  it('expone el texto completo en tooltips aunque se trunque visualmente', () => {
    renderTable()

    // Fila con nombre: sublínea `@usuario · email`.
    expect(screen.getByTitle('Supplies Tester')).toBeInTheDocument()
    expect(screen.getByTitle(`@${LONG_USER} · ${LONG_EMAIL}`)).toBeInTheDocument()
    // Fila sin nombre: muestra username y email pelados.
    expect(screen.getByTitle(LONG_USER)).toBeInTheDocument()
    expect(screen.getByTitle(LONG_EMAIL)).toBeInTheDocument()
  })

  it('cada fila tiene trigger "Acciones" que abre Ver / Editar / Eliminar', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderTable({ onDelete })

    const triggers = await screen.findAllByRole('button', { name: /acciones/i })
    expect(triggers).toHaveLength(2)
    await user.click(triggers[0])

    expect(await screen.findByRole('menuitem', { name: /^ver$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /eliminar/i })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: /eliminar/i }))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-1' }))
  })
})
