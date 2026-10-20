import { describe, expect, it } from 'vitest'
import type { TopProduct } from '@/types/bi'
import {
  filterTopProducts,
  getMarginTone,
  getTrendKey,
  getTrendPercentage,
} from './topProducts'

const product = (overrides: Partial<TopProduct> = {}): TopProduct => ({
  id: 'P-1',
  name: 'CAMISETA ADIDAS',
  category: 'MODA',
  quantity_sold: 2,
  revenue: 134770,
  profit: 82470,
  margin_percentage: 61.2,
  trend: 'down',
  trend_percentage: -63.017946325668184,
  ...overrides,
})

describe('filterTopProducts', () => {
  const products = [
    product(),
    product({
      id: 'P-2',
      name: 'Pelota de fútbol',
      category: 'Deportes',
      brand_name: 'Nike',
      variant_sku: 'PEL-001',
      tags: ['promo'],
    }),
  ]

  it('devuelve [] con null/undefined', () => {
    expect(filterTopProducts(null, '')).toEqual([])
    expect(filterTopProducts(undefined, 'adidas')).toEqual([])
  })

  it('devuelve la misma lista con búsqueda vacía', () => {
    expect(filterTopProducts(products, '   ')).toBe(products)
  })

  it('busca por nombre, categoría, marca, SKU y tags sin distinguir mayúsculas', () => {
    expect(filterTopProducts(products, 'adidas')).toHaveLength(1)
    expect(filterTopProducts(products, 'moda')).toHaveLength(1)
    expect(filterTopProducts(products, 'nike')).toHaveLength(1)
    expect(filterTopProducts(products, 'pel-001')).toHaveLength(1)
    expect(filterTopProducts(products, 'promo')).toHaveLength(1)
  })

  it('devuelve [] cuando no hay coincidencias', () => {
    expect(filterTopProducts(products, 'inexistente')).toEqual([])
  })
})

describe('getTrendKey', () => {
  it.each([
    ['up', 'up'],
    ['DOWN', 'down'],
    ['stable', 'stable'],
    ['cualquier-cosa', 'stable'],
    [null, 'stable'],
  ])('%s → %s', (trend, expected) => {
    expect(getTrendKey(trend)).toBe(expected)
  })
})

describe('getTrendPercentage', () => {
  it('redondea el flotante crudo a 1 decimal', () => {
    expect(getTrendPercentage(product())).toBe(-63)
  })

  it('redondea el segundo decimal hacia arriba', () => {
    expect(getTrendPercentage(product({ trend_percentage: 15.46 }))).toBe(15.5)
  })
})

describe('getMarginTone', () => {
  it.each([
    [61.2, 'success'],
    [0, 'secondary'],
    [-12.5, 'destructive'],
    [Number.NaN, 'secondary'],
  ] as const)('margen %s → %s', (margin, tone) => {
    expect(getMarginTone(margin)).toBe(tone)
  })
})
