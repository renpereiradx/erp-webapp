/**
 * PLAN_BI_PACK_PREMIUM F3 — nav del pack BI con tres perfiles (riesgo R7 del
 * plan): admin con BI, admin sin BI (ERP Core) y vendedor. El grupo BI entero
 * es el pack licenciado; el carve-out SIFEN (ADR-3) mantiene los dashboards
 * fiscales navegables sin pack bajo el grupo "Fiscal (SIFEN)".
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

describe('navigation — pack BI (PLAN_BI_PACK_PREMIUM)', () => {
  it('admin con BI (biEnabled=true): grupo BI presente con Auditoría', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeDefined()
    expect(findByName(tree, 'Auditoría de Sistema')).toBeDefined()
    // Con pack, SIFEN vive dentro de Reportes Financieros (como siempre).
    const reportes = findByName(tree, 'Reportes Financieros')
    expect(reportes?.children?.some(c => c.href === '/finance/sifen-ops')).toBe(true)
    // Sin grupo Core duplicado de SIFEN.
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeUndefined()
  })

  it('admin sin BI (biEnabled=false): grupo BI oculto, SIFEN Core sigue navegable', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, false), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Auditoría de Sistema')).toBeUndefined()

    // Carve-out ADR-3: los dashboards fiscales son Core, migran a su grupo.
    const fiscal = findByName(tree, 'Fiscal (SIFEN)')
    expect(fiscal).toBeDefined()
    expect(fiscal?.children?.map(c => c.href)).toEqual([
      '/finance/sifen-ops',
      '/finance/sifen-inutilizacion',
    ])
  })

  it('vendedor (sin perms BI): sin pack no aparece nada del grupo ni SIFEN', () => {
    const vendor = checksFor(['sales:read', 'sales:write', 'counterorders:read'])
    const tree = filterNavigationItems(buildNavigation(t, false, false), vendor)

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeUndefined()
    expect(findByName(tree, 'Gestión Comercial')).toBeDefined()
  })

  it('default biEnabled=true preserva el comportamiento previo (compat callers)', () => {
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(ADMIN_PERMS))
    expect(findByName(tree, 'Inteligencia de Negocios')).toBeDefined()
  })
})
