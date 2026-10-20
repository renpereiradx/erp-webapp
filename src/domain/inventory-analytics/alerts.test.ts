import { describe, expect, it } from 'vitest'
import {
  inventoryAlertRoute,
  inventoryAlertSeverityKey,
  inventoryAlertTypeKey,
} from './alerts'

describe('inventory alerts', () => {
  it('mapea los tipos del dashboard', () => {
    expect(inventoryAlertTypeKey('OUT_OF_STOCK')).toBe('outOfStock')
    expect(inventoryAlertTypeKey('LOW_STOCK')).toBe('lowStock')
    expect(inventoryAlertTypeKey('OVERSTOCK')).toBe('overstock')
    expect(inventoryAlertTypeKey('DEAD_STOCK')).toBe('deadStock')
    expect(inventoryAlertTypeKey('EXPIRING')).toBe('expiring')
    expect(inventoryAlertTypeKey('WHAT')).toBe('other')
  })

  it('mapea severidades', () => {
    expect(inventoryAlertSeverityKey('CRITICAL')).toBe('critical')
    expect(inventoryAlertSeverityKey('HIGH')).toBe('high')
    expect(inventoryAlertSeverityKey('MEDIUM')).toBe('medium')
    expect(inventoryAlertSeverityKey('LOW')).toBe('low')
    expect(inventoryAlertSeverityKey(undefined)).toBe('low')
  })

  it('solo enlaza destinos que existen en el router', () => {
    expect(inventoryAlertRoute('OUT_OF_STOCK')).toBe('/inventory-analytics/stock-levels')
    expect(inventoryAlertRoute('LOW_STOCK')).toBe('/inventory-analytics/stock-levels')
    expect(inventoryAlertRoute('OVERSTOCK')).toBe('/inventory-analytics/stock-levels')
    expect(inventoryAlertRoute('DEAD_STOCK')).toBe('/inventory-analytics/risk')
    expect(inventoryAlertRoute('EXPIRING')).toBeNull()
  })
})
