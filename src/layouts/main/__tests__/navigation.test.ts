/**
 * Nav del perfil vendedor puro (addendum 2026-09-07) — el árbol filtrado por
 * los permisos de VNDR01 v2 no muestra la sección "Configuración y Sistema"
 * (ni Caja, ni Cobros, ni Inventario), mientras que un cajero (documents:read)
 * conserva Impresoras y un admin ve todo el bloque. Alineación nav ↔ rutas:
 * Sucursales pasa a branches:write (su ruta ya era admin-only vía RoleGuard).
 */
import { describe, it, expect } from 'vitest'
import { buildNavigation, filterNavigationItems } from '../navigation'
import type { NavigationItem } from '../types'

const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as Parameters<
  typeof buildNavigation
>[0]

const VENDOR_PERMS = [
  'sales:read',
  'sales:write',
  'products:read',
  'clients:read',
  'clients:write',
  'budgets:read',
  'budgets:write',
  'payments:read',
  'tax:read',
  'branches:read',
  'dashboard:read',
  'settings:read',
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

const childNames = (item: NavigationItem | undefined) => (item?.children ?? []).map(c => c.name)

describe('navigation — perfil vendedor puro', () => {
  it('VNDR01 v2: sin sección Configuración y Sistema; Ventas y Directorio presentes', () => {
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(VENDOR_PERMS))

    expect(findByName(tree, 'Configuración y Sistema')).toBeUndefined()
    expect(findByName(tree, 'Ventas')).toBeDefined()
    expect(findByName(tree, 'Directorio de Contactos')).toBeDefined()
  })

  it('VNDR01 v2: Gestión Comercial queda con Catálogo y Ventas (sin Pagos y Cobros ni Compras)', () => {
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(VENDOR_PERMS))
    const comercial = findByName(tree, 'Gestión Comercial')

    // "Pagos y Cobros" es cobranza (cash:write), no payments:read — este es
    // instrumental del checkout y NO habilita el workspace de cobros.
    // PLAN_CATALOGO_VENDEDOR 3.3: el Catálogo (products:read) ES para el
    // vendedor — es su consulta de precios sin datos de costo.
    expect(childNames(comercial)).toEqual(['Catálogo', 'Ventas'])
  })

  it('VNDR01 v2: dentro de Ventas solo quedan Nueva Venta y Presupuestos', () => {
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(VENDOR_PERMS))
    const ventas = findByName(tree, 'Ventas')

    const names = childNames(ventas)
    expect(names).toContain('Nueva Venta')
    expect(names).toContain('Presupuestos')
    expect(names).not.toContain('Agenda y Reservas')
  })

  it('cajero (documents:read): mantiene la sección con Impresoras, sin Sucursales', () => {
    const perms = [...VENDOR_PERMS, 'cash:read', 'cash:write', 'documents:read', 'receivables:read', 'parties:read']
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(perms))
    const config = findByName(tree, 'Configuración y Sistema')

    const names = childNames(config)
    expect(names).toContain('Impresoras de tickets')
    expect(names).not.toContain('Sucursales')
    expect(names).not.toContain('Config. Financiera')
  })

  it('admin: mantiene Sucursales, Config. Financiera y Ajustes Generales', () => {
    const perms = [
      ...VENDOR_PERMS,
      'cash:read',
      'documents:read',
      'branches:write',
      'tax:write',
      'settings:write',
      'users:read',
    ]
    const tree = filterNavigationItems(buildNavigation(t, false), checksFor(perms))
    const config = findByName(tree, 'Configuración y Sistema')

    const names = childNames(config)
    expect(names).toEqual(
      expect.arrayContaining(['Sucursales', 'Config. Financiera', 'Ajustes Generales']),
    )
  })
})
