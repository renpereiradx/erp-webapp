import { describe, expect, it } from 'vitest'
import {
  buildStockStatusRows,
  DEFAULT_STOCK_SORT,
  hasNoRecentSales,
  isStockSortField,
  isStockStatusFilter,
  nextStockSort,
  realDaysOfStock,
  stockSortAria,
  stockStatusKeyForCode,
  stockStatusToneForCode,
} from './stock'

const STATUS = {
  in_stock: 16,
  low_stock: 4,
  out_of_stock: 1,
  overstock: 12,
  in_stock_pct: 64.8,
  low_stock_pct: 16.2,
  out_of_stock_pct: 4.1,
  overstock_pct: 48.6,
}

describe('inventory stock status', () => {
  it('construye las 4 filas en orden de lectura con sus porcentajes', () => {
    expect(buildStockStatusRows(STATUS)).toEqual([
      { key: 'inStock', count: 16, percentage: 64.8 },
      { key: 'lowStock', count: 4, percentage: 16.2 },
      { key: 'outOfStock', count: 1, percentage: 4.1 },
      { key: 'overstock', count: 12, percentage: 48.6 },
    ])
    expect(buildStockStatusRows(null)).toEqual([])
  })

  it('mapea los códigos del BE y sus tonos', () => {
    expect(stockStatusKeyForCode('LOW_STOCK')).toBe('lowStock')
    expect(stockStatusKeyForCode('OVERSTOCK')).toBe('overstock')
    expect(stockStatusKeyForCode('UNKNOWN')).toBeNull()
    expect(stockStatusToneForCode('OUT_OF_STOCK')).toBe('error')
    expect(stockStatusToneForCode('nope')).toBe('secondary')
  })

  it('valida filtros y campos de orden contra la whitelist del BE', () => {
    expect(isStockStatusFilter('IN_STOCK')).toBe(true)
    expect(isStockStatusFilter('ALL')).toBe(false)
    expect(isStockSortField('days')).toBe(true)
    expect(isStockSortField('margin')).toBe(false)
  })

  it('nextStockSort alterna en la misma columna y arranca DESC en una nueva', () => {
    expect(nextStockSort(DEFAULT_STOCK_SORT, 'stock')).toEqual({ by: 'stock', order: 'ASC' })
    expect(nextStockSort(DEFAULT_STOCK_SORT, 'name')).toEqual({ by: 'name', order: 'DESC' })
    expect(nextStockSort({ by: 'name', order: 'DESC' }, 'name')).toEqual({
      by: 'name',
      order: 'ASC',
    })
  })

  it('stockSortAria sigue el orden activo', () => {
    expect(stockSortAria({ by: 'stock', order: 'DESC' }, 'stock')).toBe('descending')
    expect(stockSortAria({ by: 'stock', order: 'ASC' }, 'stock')).toBe('ascending')
    expect(stockSortAria({ by: 'stock', order: 'ASC' }, 'name')).toBe('none')
  })

  it('trata el centinela 999 como sin ventas recientes', () => {
    expect(hasNoRecentSales(999)).toBe(true)
    expect(hasNoRecentSales(12)).toBe(false)
    expect(realDaysOfStock(999)).toBeNull()
    expect(realDaysOfStock(0)).toBe(0)
    expect(realDaysOfStock(7)).toBe(7)
  })
})
