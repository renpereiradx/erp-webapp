/**
 * UsersToolbar — el filtro por rol muestra el contador de usuarios de cada
 * rol (users_count de GET /api/v1/roles) para que el filtro no prometa lo que
 * no puede cumplir: un rol con 0 usuarios se ve ANTES de filtrar (hallazgo
 * 2026-09-30: el filtro CLIENTE devolvía "Sin resultados" con 0 asignados).
 *
 * Contrato cubierto:
 * - Cada ítem de rol expone aria-label "nombre, N usuarios" y el contador
 *   visible data-testid role-count-<id>.
 * - Roles sin users_count (p.ej. modo demo) degradan a 0.
 * - Elegir un rol dispara onFiltersChange({ role_id }) y "Todos los roles"
 *   la limpia.
 *
 * Mocks en la frontera: i18n (firma real t(key, fallback?, vars?), fallback
 * español). lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersToolbar } from '../components/UsersToolbar'
import type { Role, UsersFilters } from '../types'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`))
    },
  }),
}))

const roles: Role[] = [
  { id: 'F2VLso', name: 'ADMINISTRADOR', users_count: 3 },
  { id: 'CLNT01', name: 'CLIENTE', users_count: 0 },
  { id: 'DEMO01', name: 'DEMO' },
]

const baseFilters: UsersFilters = { search: '', status: '', role_id: '' }

function setup(overrides: Partial<Parameters<typeof UsersToolbar>[0]> = {}) {
  const onFiltersChange = vi.fn()
  const onClearFilters = vi.fn()
  const onBulkActivate = vi.fn()
  const onBulkDeactivate = vi.fn()
  const onBulkDelete = vi.fn()
  const onClearSelection = vi.fn()

  render(
    <UsersToolbar
      filters={baseFilters}
      roles={roles}
      selectedCount={0}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
      onBulkActivate={onBulkActivate}
      onBulkDeactivate={onBulkDeactivate}
      onBulkDelete={onBulkDelete}
      onClearSelection={onClearSelection}
      {...overrides}
    />,
  )

  return { onFiltersChange }
}

async function openRoleMenu() {
  await userEvent.click(screen.getByRole('button', { name: /todos los roles/i }))
}

describe('UsersToolbar — contador de usuarios por rol', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra el contador junto a cada rol del filtro', async () => {
    setup()
    await openRoleMenu()

    expect(screen.getByTestId('role-count-F2VLso')).toHaveTextContent('3')
    expect(screen.getByTestId('role-count-CLNT01')).toHaveTextContent('0')
    expect(screen.getByTestId('role-count-DEMO01')).toHaveTextContent('0')
  })

  it('expone el contador en el accessible name del ítem', async () => {
    setup()
    await openRoleMenu()

    expect(screen.getByRole('menuitem', { name: 'ADMINISTRADOR, 3 usuarios' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'CLIENTE, 0 usuarios' })).toBeInTheDocument()
  })

  it('filtrar por rol y volver a Todos los roles dispara los cambios esperados', async () => {
    const { onFiltersChange } = setup()
    await openRoleMenu()

    await userEvent.click(screen.getByRole('menuitem', { name: 'CLIENTE, 0 usuarios' }))
    expect(onFiltersChange).toHaveBeenCalledWith({ role_id: 'CLNT01' })

    await openRoleMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /todos los roles/i }))
    expect(onFiltersChange).toHaveBeenCalledWith({ role_id: '' })
  })
})
