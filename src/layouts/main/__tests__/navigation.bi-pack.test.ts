/**
 * PLAN_REBUILD_BI_UI_FRONTEND F1 — ventana de teardown: el grupo BI no existe
 * con ningún valor de biEnabled, y el carve-out SIFEN (ADR-3) queda siempre
 * navegable como grupo Core propio. F2-F11 re-activan sus grupos por fase.
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
  hasAnyPermission: (...ps: string[]) => ps.some(p => perms.includes(p)),
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

describe('navigation — F1 sin pantallas BI (PLAN_REBUILD_BI_UI_FRONTEND)', () => {
  it('admin: sin grupo BI ni Auditoría, SIFEN Core siempre navegable', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Auditoría de Sistema')).toBeUndefined()
    expect(findByName(tree, 'Dashboard')).toBeUndefined()

    const fiscal = findByName(tree, 'Fiscal (SIFEN)')
    expect(fiscal).toBeDefined()
    expect(fiscal?.children?.map(c => c.href)).toEqual([
      '/finance/sifen-ops',
      '/finance/sifen-inutilizacion',
    ])
  })

  it('el flag biEnabled no revive el grupo BI durante la ventana F1', () => {
    for (const biEnabled of [true, false]) {
      const tree = filterNavigationItems(
        buildNavigation(t, false, biEnabled),
        checksFor(ADMIN_PERMS),
      )
      expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
      expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
    }
  })

  it('vendedor sin sifen:read: no ve SIFEN ni el grupo BI, sí Gestión Comercial', () => {
    const vendor = checksFor(['sales:read', 'sales:write', 'counterorders:read'])
    const tree = filterNavigationItems(buildNavigation(t, false, false), vendor)

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeUndefined()
    expect(findByName(tree, 'Gestión Comercial')).toBeDefined()
  })
})
