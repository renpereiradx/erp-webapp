import { describe, expect, it } from 'vitest'
import {
  filterAlerts,
  getAlertMetrics,
  getAvailableCategories,
  getCategoryIcon,
  getCategoryLabel,
  isFinancialDetailKey,
  type AlertLike,
} from './alerts'

const ALERTS: AlertLike[] = [
  { id: 1, severity: 'critical', category: 'Inventory', title: 'Stock bajo', message: 'SKU 123' },
  { id: 2, severity: 'error', category: 'finance', title: 'Caja descuadrada', message: 'revisar' },
  { id: 3, severity: 'warning', category: 'Sales', title: 'Venta mayor', message: 'monto alto' },
  { id: 4, severity: 'info', category: 'clients', title: 'Cliente nuevo', message: 'alta' },
]

describe('getAvailableCategories', () => {
  it('devuelve [] con alerts null/undefined', () => {
    expect(getAvailableCategories(null)).toEqual([])
    expect(getAvailableCategories(undefined)).toEqual([])
  })

  it('normaliza a minúsculas, deduplica y ordena', () => {
    expect(getAvailableCategories(ALERTS)).toEqual(['clients', 'finance', 'inventory', 'sales'])
  })
})

describe('getCategoryIcon', () => {
  it.each([
    ['inventory', 'inventory_2'],
    ['low stock', 'inventory_2'],
    ['finance', 'payments'],
    ['payments', 'payments'],
    ['cash', 'payments'],
    ['sales', 'shopping_cart'],
    ['orders', 'shopping_cart'],
    ['security', 'shield'],
    ['auth', 'shield'],
    ['infrastructure', 'dns'],
    ['system', 'dns'],
    ['clients', 'groups'],
    ['customer', 'groups'],
    ['unknown-cat', 'notifications'],
    [null, 'notifications'],
    [undefined, 'notifications'],
  ])('%s → %s', (category, icon) => {
    expect(getCategoryIcon(category)).toBe(icon)
  })
})

describe('getCategoryLabel', () => {
  it.each([
    ['inventory', 'Inventario'],
    ['stock', 'Inventario'],
    ['finance', 'Finanzas'],
    ['sales', 'Ventas'],
    ['security', 'Seguridad'],
    ['infrastructure', 'Infraestructura'],
    ['clients', 'Clientes'],
    ['customer', 'Clientes'],
    ['shipping', 'Shipping'], // capitalize fallback
  ])('%s → %s', (category, label) => {
    expect(getCategoryLabel(category)).toBe(label)
  })

  it('null → Sistema', () => {
    expect(getCategoryLabel(null)).toBe('Sistema')
    expect(getCategoryLabel('')).toBe('Sistema')
  })
})

describe('getAlertMetrics', () => {
  it('devuelve la forma en ceros con alerts null', () => {
    expect(getAlertMetrics(null)).toEqual({ total: 0, critical: 0, inventory: 0, sales: 0 })
  })

  it('cuenta critical+error como críticas y agrupa por heurística de categoría', () => {
    expect(getAlertMetrics(ALERTS)).toEqual({
      total: 4,
      critical: 2, // critical + error
      inventory: 1,
      sales: 2, // Sales + clients
    })
  })
})

describe('filterAlerts', () => {
  it('devuelve [] con alerts null', () => {
    expect(filterAlerts(null, { severity: 'all', category: 'all', search: '' })).toEqual([])
  })

  it('sin filtros activos devuelve todo', () => {
    expect(filterAlerts(ALERTS, { severity: 'all', category: 'all', search: '' })).toHaveLength(4)
  })

  it('severity critical incluye también error', () => {
    const result = filterAlerts(ALERTS, { severity: 'critical', category: 'all', search: '' })
    expect(result.map((a) => a.id)).toEqual([1, 2])
  })

  it('category filtra por substring case-insensitive', () => {
    const result = filterAlerts(ALERTS, { severity: 'all', category: 'FIN', search: '' })
    expect(result.map((a) => a.id)).toEqual([2])
  })

  it('search matchea título, mensaje o id', () => {
    expect(filterAlerts(ALERTS, { severity: 'all', category: 'all', search: 'stock' }).map((a) => a.id)).toEqual([1])
    expect(filterAlerts(ALERTS, { severity: 'all', category: 'all', search: 'alta' }).map((a) => a.id)).toEqual([4])
    expect(filterAlerts(ALERTS, { severity: 'all', category: 'all', search: 'mayor' }).map((a) => a.id)).toEqual([3])
    // '3' matchea por id (alerta 3) y por mensaje "SKU 123" (alerta 1)
    expect(filterAlerts(ALERTS, { severity: 'all', category: 'all', search: '3' }).map((a) => a.id)).toEqual([1, 3])
  })

  it('combina los tres filtros', () => {
    const result = filterAlerts(ALERTS, { severity: 'critical', category: 'fin', search: 'caja' })
    expect(result.map((a) => a.id)).toEqual([2])
  })
})

describe('isFinancialDetailKey', () => {
  it.each([
    ['total_amount', true],
    ['Average Ticket', true],
    ['cost', true],
    ['quantity', false],
    ['', false],
  ])('%s → %s', (label, expected) => {
    expect(isFinancialDetailKey(label)).toBe(expected)
  })
})
