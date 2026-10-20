import { describe, expect, it } from 'vitest'
import type { ProductSalesData } from '@/types/bi'
import {
  buildProductRankItems,
  DEFAULT_PRODUCT_SORT,
  isProductSortField,
  naturalProductSortOrder,
  nextProductSort,
  SALES_PRODUCTS_PAGE_SIZE,
} from './products'
import { SALES_PAGE_SIZE } from './constants'

const product = (overrides: Partial<ProductSalesData>): ProductSalesData => ({
  product_id: 'P-1',
  product_name: 'Camiseta',
  sku: 'P-1',
  category_name: 'MODA',
  sales: 100000,
  units_sold: 2,
  average_price: 50000,
  cost: 40000,
  gross_profit: 60000,
  gross_margin_pct: 60,
  transactions: 1,
  last_sale_date: '2026-09-15T12:00:00Z',
  rank: 1,
  growth_pct: 0,
  ...overrides,
})

describe('sort server-side de productos', () => {
  it('la página usa el tamaño de la regla ≤10 filas', () => {
    expect(SALES_PRODUCTS_PAGE_SIZE).toBe(SALES_PAGE_SIZE)
    expect(DEFAULT_PRODUCT_SORT).toEqual({ by: 'sales', order: 'desc' })
  })

  it('solo acepta la whitelist del BE', () => {
    expect(isProductSortField('sales')).toBe(true)
    expect(isProductSortField('last_sale')).toBe(true)
    expect(isProductSortField('sku')).toBe(false)
    expect(isProductSortField('growth')).toBe(false)
  })

  it('el orden natural es ascendente para texto y descendente para números', () => {
    expect(naturalProductSortOrder('name')).toBe('asc')
    expect(naturalProductSortOrder('sales')).toBe('desc')
    expect(naturalProductSortOrder('last_sale')).toBe('desc')
  })

  it('el mismo campo invierte la dirección; un campo nuevo usa su natural', () => {
    expect(nextProductSort({ by: 'sales', order: 'desc' }, 'sales')).toEqual({
      by: 'sales',
      order: 'asc',
    })
    expect(nextProductSort({ by: 'sales', order: 'asc' }, 'margin')).toEqual({
      by: 'margin',
      order: 'desc',
    })
    expect(nextProductSort({ by: 'sales', order: 'asc' }, 'name')).toEqual({
      by: 'name',
      order: 'asc',
    })
  })
})

describe('buildProductRankItems', () => {
  it('normaliza las filas y cae al id si falta el nombre', () => {
    const items = buildProductRankItems([
      product({}),
      product({ product_id: 'P-2', product_name: '', category_name: '' }),
    ])
    expect(items[0]).toEqual({
      id: 'P-1',
      name: 'Camiseta',
      category: 'MODA',
      sales: 100000,
      units: 2,
      marginPct: 60,
    })
    expect(items[1].name).toBe('P-2')
    expect(items[1].category).toBe('')
  })

  it('tolera null/undefined (slices nil de Go)', () => {
    expect(buildProductRankItems(null)).toEqual([])
    expect(buildProductRankItems(undefined)).toEqual([])
  })
})
