/**
 * PLAN_REBUILD_BI_UI_FRONTEND F2-F11 — el grupo BI existe con Dashboard
 * (5 rutas) + Analítica de Ventas (8 hojas: 6 de F4 + 2 drill-downs de F3) +
 * drill-downs de Compras + Analítica de Inventario (4 hojas de F5) +
 * Rentabilidad (6 hojas de F6) + Cuentas por Cobrar (4 hojas de F7) +
 * Cuentas por Pagar (4 hojas de F8) + Reportes Financieros (4 hojas de F9) +
 * Auditoría (2 hojas de F10) + Pronósticos (5 hojas de F11) cuando hay pack y
 * permisos BI. Sin pack o sin hojas visibles el padre se oculta
 * (incluido el padre con gate anyOf). SIFEN sigue como grupo Core propio
 * (ADR-3).
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

describe('navigation — Dashboard BI (F2-F11)', () => {
  it('admin con pack: Dashboard + Ventas + Compras + Inventario + Rentabilidad + CxC + CxP + Finanzas + Auditoría + Pronósticos', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(ADMIN_PERMS))

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Dashboard',
      'Analítica de Ventas',
      'Analítica de Compras',
      'Analítica de Inventario',
      'Rentabilidad',
      'Cuentas por Cobrar',
      'Cuentas por Pagar',
      'Reportes Financieros',
      'Auditoría',
      'Pronósticos',
    ])

    const dashboard = findByName(tree, 'Dashboard')
    expect(dashboard?.children?.map((child) => child.href)).toEqual([
      '/dashboard',
      '/dashboard/kpis',
      '/dashboard/sales-heatmap',
      '/dashboard/alerts',
      '/dashboard/top-products',
      '/dashboard/payables',
      '/dashboard/financial-summary',
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

    const inventory = findByName(tree, 'Analítica de Inventario')
    expect(inventory?.children?.map((child) => child.href)).toEqual([
      '/inventory-analytics/dashboard',
      '/inventory-analytics/turnover-abc',
      '/inventory-analytics/stock-levels',
      '/inventory-analytics/risk',
    ])

    const profitability = findByName(tree, 'Rentabilidad')
    expect(profitability?.children?.map((child) => child.href)).toEqual([
      '/profitability/dashboard',
      '/profitability/products',
      '/profitability/customers',
      '/profitability/categories',
      '/profitability/trends',
      '/profitability/sellers',
    ])
    expect(profitability?.permission).toBe('analytics:read')

    const receivables = findByName(tree, 'Cuentas por Cobrar')
    expect(receivables?.children?.map((child) => child.href)).toEqual([
      '/receivables',
      '/receivables/list',
      '/receivables/overdue',
      '/receivables/aging-report',
    ])
    expect(receivables?.permission).toBe('receivables:read')

    const payables = findByName(tree, 'Cuentas por Pagar')
    expect(payables?.children?.map((child) => child.href)).toEqual([
      '/dashboard/payables',
      '/payables/invoices',
      '/payables/cash-flow',
      '/payables/aging-report',
    ])
    expect(payables?.permission).toBe('payables:read')

    const reports = findByName(tree, 'Reportes Financieros')
    expect(reports?.children?.map((child) => child.href)).toEqual([
      '/finance/profit-and-loss',
      '/finance/analytical-cash-flow',
      '/finance/tax-management',
      '/finance/legal-books',
    ])
    expect(reports?.permission).toBe('reports:read')

    const audit = findByName(tree, 'Auditoría')
    expect(audit?.children?.map((child) => child.href)).toEqual([
      '/auditoria',
      '/auditoria/logs',
    ])
    expect(audit?.permission).toBe('audit:read')

    const forecast = findByName(tree, 'Pronósticos')
    expect(forecast?.children?.map((child) => child.href)).toEqual([
      '/bi/pronosticos/dashboard',
      '/bi/pronosticos/inventario',
      '/bi/pronosticos/ventas',
      '/bi/pronosticos/demanda',
      '/bi/pronosticos/ingresos',
    ])
    expect(forecast?.permission).toBe('analytics:read')
  })

  it('sin pack BI (biEnabled=false) el grupo no existe; SIFEN sigue como Core', () => {
    const tree = filterNavigationItems(buildNavigation(t, false, false), checksFor(ADMIN_PERMS))

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
    expect(findByName(tree, 'Analítica de Ventas')).toBeUndefined()
    expect(findByName(tree, 'Analítica de Compras')).toBeUndefined()
    expect(findByName(tree, 'Analítica de Inventario')).toBeUndefined()
    expect(findByName(tree, 'Rentabilidad')).toBeUndefined()
    expect(findByName(tree, 'Cuentas por Cobrar')).toBeUndefined()
    expect(findByName(tree, 'Cuentas por Pagar')).toBeUndefined()
    expect(findByName(tree, 'Reportes Financieros')).toBeUndefined()
    expect(findByName(tree, 'Auditoría')).toBeUndefined()
    expect(findByName(tree, 'Pronósticos')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
  })

  it('sin dashboard:read: BI sigue visible por Ventas/Compras/Inventario/Rentabilidad/CxC', () => {
    const perms = ADMIN_PERMS.filter((p) => p !== 'dashboard:read')
    const tree = filterNavigationItems(buildNavigation(t, false, true), checksFor(perms))

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Analítica de Ventas',
      'Analítica de Compras',
      'Analítica de Inventario',
      'Rentabilidad',
      'Cuentas por Cobrar',
      'Cuentas por Pagar',
      'Reportes Financieros',
      'Auditoría',
      'Pronósticos',
    ])
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
    expect(findByName(tree, 'Fiscal (SIFEN)')).toBeDefined()
  })

  it('con analytics:read solo: ve Ventas/Compras/Inventario/Rentabilidad sin Dashboard', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['analytics:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Analítica de Ventas',
      'Analítica de Compras',
      'Analítica de Inventario',
      'Rentabilidad',
      'Pronósticos',
    ])
    expect(findByName(tree, 'Dashboard')).toBeUndefined()
    expect(findByName(tree, 'Pronósticos')?.children).toHaveLength(5)
  })

  it('con reports:read solo: Descuentos y Reportes Financieros, sin analytics:read', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['reports:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual([
      'Analítica de Ventas',
      'Reportes Financieros',
    ])

    const sales = findByName(tree, 'Analítica de Ventas')
    expect(sales?.children?.map((child) => child.href)).toEqual([
      '/sales-analytics/discounts',
    ])
    expect(findByName(tree, 'Reportes Financieros')?.children).toHaveLength(4)
  })

  it('con audit:read se ve solo el grupo Auditoría (F10)', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['audit:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Auditoría'])
    expect(findByName(tree, 'Auditoría')?.children).toHaveLength(2)
  })

  it('con un permiso de otro módulo (users:read) no hay grupo BI vacío', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['users:read']),
    )

    expect(findByName(tree, 'Inteligencia de Negocios')).toBeUndefined()
  })

  it('con payables:read se ve solo el grupo Cuentas por Pagar (F8)', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['payables:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Cuentas por Pagar'])
    expect(findByName(tree, 'Cuentas por Pagar')?.children).toHaveLength(4)
  })

  it('con receivables:read se ve solo el grupo Cuentas por Cobrar (F7)', () => {
    const tree = filterNavigationItems(
      buildNavigation(t, false, true),
      checksFor(['receivables:read']),
    )

    const bi = findByName(tree, 'Inteligencia de Negocios')
    expect(bi).toBeDefined()
    expect(bi?.children?.map((child) => child.name)).toEqual(['Cuentas por Cobrar'])
    expect(findByName(tree, 'Cuentas por Cobrar')?.children).toHaveLength(4)
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
