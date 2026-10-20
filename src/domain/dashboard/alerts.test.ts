import { describe, expect, it } from 'vitest'
import {
  EMPTY_ALERT_FILTERS,
  filterAlerts,
  getAlertMetrics,
  getAvailableCategories,
  getCategoryKey,
  getSeverityKey,
  sortAlertsBySeverity,
  type AlertLike,
} from './alerts'

const ALERTS: AlertLike[] = [
  { id: 1, severity: 'critical', category: 'inventory', title: 'Stock agotado', message: '3 productos' },
  { id: 2, severity: 'warning', category: 'financial', title: 'Pagos vencidos', message: '13 cuentas' },
  { id: 3, severity: 'info', category: 'sales', title: 'Presupuestos por vencer', message: '2 presupuestos' },
  { id: 4, severity: 'error', category: 'Inventory', title: 'Margen negativo', message: 'SKU 123' },
]

describe('getSeverityKey', () => {
  it.each([
    ['critical', 'critical'],
    ['error', 'critical'],
    ['WARNING', 'warning'],
    ['info', 'info'],
    [null, 'unknown'],
    ['success', 'unknown'],
  ])('%s → %s', (severity, key) => {
    expect(getSeverityKey(severity)).toBe(key)
  })
})

describe('getCategoryKey', () => {
  it.each([
    ['inventory', 'inventory'],
    ['FINANCIAL', 'financial'],
    ['sales', 'sales'],
    ['clients', 'other'],
    [undefined, 'other'],
  ])('%s → %s', (category, key) => {
    expect(getCategoryKey(category)).toBe(key)
  })
})

describe('getAvailableCategories', () => {
  it('devuelve [] con alerts null/undefined', () => {
    expect(getAvailableCategories(null)).toEqual([])
    expect(getAvailableCategories(undefined)).toEqual([])
  })

  it('normaliza a minúsculas, deduplica y ordena', () => {
    expect(getAvailableCategories(ALERTS)).toEqual(['financial', 'inventory', 'sales'])
  })
})

describe('getAlertMetrics', () => {
  it('cuenta críticas (incluye alias error), advertencias e informativas', () => {
    expect(getAlertMetrics(ALERTS)).toEqual({ total: 4, critical: 2, warning: 1, info: 1 })
  })

  it('devuelve el shape en cero sin alertas', () => {
    expect(getAlertMetrics(null)).toEqual({ total: 0, critical: 0, warning: 0, info: 0 })
  })
})

describe('sortAlertsBySeverity', () => {
  it('ordena críticas → advertencias → informativas sin mutar el input', () => {
    const sorted = sortAlertsBySeverity(ALERTS)
    expect(sorted.map((alert) => alert.id)).toEqual([1, 4, 2, 3])
    expect(ALERTS.map((alert) => alert.id)).toEqual([1, 2, 3, 4])
  })
})

describe('filterAlerts', () => {
  it('sin filtros devuelve todo', () => {
    expect(filterAlerts(ALERTS, EMPTY_ALERT_FILTERS)).toHaveLength(4)
  })

  it('filtra por severidad normalizada (error cuenta como critical)', () => {
    const result = filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, severity: 'critical' })
    expect(result.map((alert) => alert.id)).toEqual([1, 4])
  })

  it('filtra por categoría sin distinguir mayúsculas', () => {
    const result = filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, category: 'inventory' })
    expect(result.map((alert) => alert.id)).toEqual([1, 4])
  })

  it('busca en título, mensaje e id', () => {
    expect(filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, search: 'vencidos' })).toHaveLength(1)
    expect(filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, search: 'SKU 123' })).toHaveLength(1)
    expect(filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, search: 'presupuestos' })[0]?.id).toBe(3)
    expect(filterAlerts(ALERTS, { ...EMPTY_ALERT_FILTERS, search: '4' })[0]?.id).toBe(4)
  })

  it('combina los tres filtros y devuelve [] sin coincidencias', () => {
    expect(
      filterAlerts(ALERTS, { severity: 'critical', category: 'sales', search: '' }),
    ).toHaveLength(0)
  })

  it('devuelve [] con alerts null', () => {
    expect(filterAlerts(null, EMPTY_ALERT_FILTERS)).toEqual([])
  })
})
