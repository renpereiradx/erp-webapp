/**
 * PLAN_REBUILD_BI_UI_FRONTEND F2/F3 — el grupo BI existe con Dashboard (5
 * rutas) + los drill-downs relacionales de Ventas/Compras cuando hay pack y
 * analytics:read. Sin pack o sin hojas visibles el padre se oculta. SIFEN
 * sigue como grupo Core propio (ADR-3).
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

describe('navigation — Dashboard BI (F2) + drill-downs relacionales (F3)', () => {
  it('admin con pack: Dashboard + los grupos de drill-downs con sus rutas', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(ADMIN_PERMS))

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Dashboard',
      'Analítica de Ventas',
      'Analítica de Compras',
    ])

    const dashboard = findByName(tree, 'Dashboard')
    expect(dashboard?.children?.map((child) => child.href)).toEqual([
      '/dashboard',
      '/dashboard/kpis',
      '/dashboard/sales-heatmap',
      '/dashboard/alerts',
      '/dashboard/top-products',
    ])

    const sales = findByName(tree, 'Analítica de Ventas')
    expect(sales?.children?.map((child) => child.href)).toEqual([
      '/sales-analytics/products/buyers',
      '/sales-analytics/customers/top-products',
    ])

    const purchases = findByName(tree, 'Analítica de Compras')
    expect(purchases?.children?.map((child) => child.href)).toEqual([
      '/purchase-analytics/suppliers/top-products',
      '/purchase-analytics/products/suppliers',
    ])
  })

  it('sin pack BI (biEnabled=false) el grupo no existe; SIFEN sigue como Core', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, false), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
    expect(findByName(tree, 'Analítica de Ventas')).toBeUndefined()
    expect(findByName(tree, 'Analítica de Compras')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
  })

  it('con analytics:read sin dashboard:read: BI sigue visible por los drill-downs, sin Dashboard', () => {
    const perms = ADMIN_PERMS.filter((p) => p !== 'dashboard:read')
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(perms))

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Analítica de Ventas',
      'Analítica de Compras',
    ])
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
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
