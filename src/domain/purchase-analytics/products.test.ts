import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PURCHASE_PRODUCT_SORT,
  PURCHASE_PRODUCTS_PAGE_SIZE,
  isPurchaseProductSortField,
  naturalPurchaseProductSortOrder,
  nextPurchaseProductSort,
} from './products'

describe('whitelist de sort de productos comprados', () => {
  it('espeja la whitelist del handler BE', () => {
    for (const field of ['purchases', 'units', 'name', 'last_purchase']) {
      expect(isPurchaseProductSortField(field)).toBe(true)
    }
  })

  it('rechaza campos fuera de la whitelist (el BE responde 400)', () => {
    expect(isPurchaseProductSortField('margin')).toBe(false)
    expect(isPurchaseProductSortField('sales')).toBe(false)
    expect(isPurchaseProductSortField('')).toBe(false)
  })

  it('orden natural: texto asc, números/fechas desc', () => {
    expect(naturalPurchaseProductSortOrder('name')).toBe('asc')
    expect(naturalPurchaseProductSortOrder('purchases')).toBe('desc')
    expect(naturalPurchaseProductSortOrder('last_purchase')).toBe('desc')
  })

  it('toggle: mismo campo invierte, campo nuevo usa su orden natural', () => {
    expect(nextPurchaseProductSort(DEFAULT_PURCHASE_PRODUCT_SORT, 'purchases')).toEqual({
      by: 'purchases',
      order: 'asc',
    })
    expect(nextPurchaseProductSort(DEFAULT_PURCHASE_PRODUCT_SORT, 'name')).toEqual({
      by: 'name',
      order: 'asc',
    })
  })

  it('page size server-side = regla del proyecto (10)', () => {
    expect(PURCHASE_PRODUCTS_PAGE_SIZE).toBe(10)
  })
})
