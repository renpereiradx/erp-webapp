/**
 * PLAN_REBUILD_BI_UI_FRONTEND F2 — el grupo BI vuelve a existir con el
 * subgrupo Dashboard (5 rutas) cuando hay pack + analytics:read +
 * dashboard:read. Sin pack, sin dashboard:read o sin hojas visibles, el
 * padre se oculta. SIFEN sigue como grupo Core propio (ADR-3).
 */
import { describe, it, expect } from 'vitest'
import { buildNavigation, filterNavigationItems } from '../navigation'
import type { NavigationItem } from '../types'

const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as Parameters<
  typeof buildNavigation
>[0]

const ADMIN_PERMS = [
  'dashboard:read',
  'analytics:read',
  'sifen:read',
  'receivables:read',
  'payables:read',
  'reports:read',
  'audit:read',
]

const checksFor = (perms: string[]) => ({
  hasPermission: (p: string) => perms.includes(p),
  hasAnyPermission: (...ps: string[]) => ps.some((p) => perms.includes(p)),
})

const findByName = (items: NavigationItem[], name: string): NavigationItem | undefined => {
  for (const item of items) {
    if (item.name === name) return item
    if (item.children) {
      const found = findByName(item.children, name)
      if (found) return found
    }
  }
  return undefined
}

describe('navigation — F2 Dashboard BI re-activado', () => {
  it('admin con pack: grupo BI con el subgrupo Dashboard y sus 5 rutas', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(ADMIN_PERMS))

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Dashboard'])

    const dashboard = findByName(tree, 'Dashboard')
    expect(dashboard?.children?.map((child) => child.href)).toEqual([
      '/dashboard',
      '/dashboard/kpis',
      '/dashboard/sales-heatmap',
      '/dashboard/alerts',
      '/dashboard/top-products',
    ])
  })

  it('sin pack BI (biEnabled=false) el grupo no existe; SIFEN sigue como Core', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, false), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
  })

  it('con analytics:read pero sin dashboard:read el grupo se oculta (sin hojas)', () => {
    const perms = ADMIN_PERMS.filter((p) => p !== 'dashboard:read')
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(perms))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
  })

  it('vendedor sin sifen:read: no ve BI ni SIFEN, sí Gestión Comercial', () => {
    const vendor = checksFor(['sales:read', 'sales:write', 'counterorders:read'])
    const tree = filterNavigationItems(buildNavigation(t, false, true), vendor)

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeUndefined()
    expect(findByName(tree, 'Gestión Comercial')).toBeDefined()
  })
})
