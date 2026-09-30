/**
 * UserBranchAccessList — filas de solo lectura de sucursales asignadas.
 *
 * Contrato: nombre de sucursal resuelto client-side (el endpoint solo trae
 * branch_id), fallback "Sucursal {{id}}", código en mono, badge "Por defecto"
 * y nivel de acceso traducido (fallback crudo para valores desconocidos).
 *
 * Mocks en la frontera: i18n (firma real t(key, fallback?, vars?), fallback
 * español). lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { UserBranchAccessList } from '../components/UserBranchAccessList'
import type { Branch, UserBranchAccess } from '@/types'

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

const branches: Branch[] = [
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

const access = (over: Partial<UserBranchAccess>): UserBranchAccess => ({
  id: 1,
  user_id: 'u-1',
  branch_id: 1,
  access_type: 'FULL',
  is_default_branch: false,
  granted_at: '2026-09-01T12:00:00Z',
  ...over,
})

afterEach(cleanup)

describe('UserBranchAccessList', () => {
  it('muestra nombre + código de la sucursal y el nivel de acceso traducido', () => {
    render(
      <UserBranchAccessList
        items={[access({ branch_id: 1, access_type: 'FULL' })]}
        branches={branches}
      />,
    )
    expect(screen.getByText('Sucursal Principal')).toBeInTheDocument()
    expect(screen.getByText('MAIN')).toBeInTheDocument()
    expect(screen.getByText('Acceso total')).toBeInTheDocument()
    expect(screen.queryByText(/Por defecto/)).not.toBeInTheDocument()
  })

  it('marca la sucursal por defecto y traduce los niveles LIMITED y READ_ONLY', () => {
    render(
      <UserBranchAccessList
        items={[
          access({ id: 1, branch_id: 1, is_default_branch: true }),
          access({ id: 2, branch_id: 2, access_type: 'LIMITED' }),
          access({ id: 3, branch_id: 2, access_type: 'READ_ONLY' }),
        ]}
        branches={branches}
      />,
    )
    expect(screen.getByText('Por defecto')).toBeInTheDocument()
    expect(screen.getByText('Solo transacciones')).toBeInTheDocument()
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
  })

  it('cae con gracia a "Sucursal {id}" cuando no hay nombre y al valor crudo de acceso desconocido', () => {
    render(
      <UserBranchAccessList
        items={[access({ branch_id: 9, access_type: 'WEIRD' })]}
        branches={branches}
      />,
    )
    expect(screen.getByText('Sucursal 9')).toBeInTheDocument()
    expect(screen.getByText('WEIRD')).toBeInTheDocument()
  })
})
