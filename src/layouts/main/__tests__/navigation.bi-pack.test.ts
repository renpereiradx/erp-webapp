/**
 * PLAN_REBUILD_BI_UI_FRONTEND F2/F3/F4 — el grupo BI existe con Dashboard (5
 * rutas) + Analítica de Ventas (8 hojas: 6 de F4 + 2 drill-downs de F3) +
 * drill-downs de Compras cuando hay pack y permisos BI. Sin pack o sin hojas
 * visibles el padre se oculta (incluido el padre con gate anyOf). SIFEN sigue
 * como grupo Core propio (ADR-3).
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

describe('navigation — Dashboard BI (F2) + Analítica de Ventas (F4)', () => {
  it('admin con pack: Dashboard + Analítica de Ventas completa + Compras', () => {
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
      '/sales-analytics/dashboard',
      '/sales-analytics/products-categories',
      '/sales-analytics/insights',
      '/sales-analytics/trends-velocity',
      '/sales-analytics/period-comparison',
      '/sales-analytics/discounts',
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

  it('con analytics:read sin dashboard:read: BI sigue visible por Ventas/Compras, sin Dashboard', () => {
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

  it('con reports:read solo: se ve Descuentos y ninguna hoja con analytics:read', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['reports:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Analítica de Ventas'])

    const sales = findByName(tree, 'Analítica de Ventas')
    expect(sales?.children?.map((child) => child.href)).toEqual([
      '/sales-analytics/discounts',
    ])
  })

  it('con un permiso BI sin hoja visible (payables:read): no queda un grupo vacío', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['payables:read']),
    )

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
  })

  it('con dashboard:read solo: el grupo BI aparece por el gate anyOf padre', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['dashboard:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Dashboard'])
  })

  it('vendedor sin sifen:read: no ve BI ni SIFEN, sí Gestión Comercial', () => {
    const vendor = checksFor(['sales:read', 'sales:write', 'counterorders:read'])
    const tree = filterNavigationItems(buildNavigation(t, false, true), vendor)

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeUndefined()
    expect(findByName(tree, 'Gestión Comercial')).toBeDefined()
  })
})
