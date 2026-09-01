/**
 * Tests for the POS sellability domain rules (pure logic).
 *
 * `requiresStock` is the single source of truth for "does this product
 * consume stock?", previously duplicated (with different shapes) across the
 * four cart entry points. SERVICE products are sellable without stock.
 */

import { describe, it, expect } from 'vitest'
import {
  SERVICE_PRODUCT_TYPE,
  requiresStock,
  availableStockFor,
  maxSellableQty,
  isBlockedByStock,
  stockBadgeKind,
} from '../domain/products/sellability'

const physical = (overrides: Record<string, unknown> = {}) => ({
  product_type: 'PHYSICAL',
  stock: 10,
  has_variants: false,
  ...overrides,
})

describe('requiresStock', () => {
  it('requires stock for PHYSICAL and PRODUCTION products', () => {
    expect(requiresStock(physical())).toBe(true)
    expect(requiresStock({ product_type: 'PRODUCTION' })).toBe(true)
  })

  it('never requires stock for SERVICE products', () => {
    expect(requiresStock({ product_type: SERVICE_PRODUCT_TYPE })).toBe(false)
  })

  it('defaults unknown/legacy products (no product_type) to PHYSICAL', () => {
    expect(requiresStock({})).toBe(true)
    expect(requiresStock({ product_type: null })).toBe(true)
  })
})

describe('availableStockFor', () => {
  it('discounts what is already in the cart, never below zero', () => {
    expect(availableStockFor(physical({ stock: 5 }), 2)).toBe(3)
    expect(availableStockFor(physical({ stock: 1 }), 4)).toBe(0)
  })

  it('treats missing stock as zero', () => {
    expect(availableStockFor({})).toBe(0)
    expect(availableStockFor({ stock: null })).toBe(0)
  })
})

describe('maxSellableQty', () => {
  it('caps stock-tracked products at the remaining stock', () => {
    expect(maxSellableQty(physical({ stock: 7 }), 2)).toBe(5)
  })

  it('is unlimited for SERVICE products even with zero stock', () => {
    expect(maxSellableQty({ product_type: 'SERVICE', stock: 0 })).toBe(Infinity)
  })
})

describe('isBlockedByStock', () => {
  it('blocks PHYSICAL products with no stock left', () => {
    expect(isBlockedByStock(physical({ stock: 0 }))).toBe(true)
    expect(isBlockedByStock(physical({ stock: 2 }), 2)).toBe(true)
  })

  it('allows PHYSICAL products with stock available', () => {
    expect(isBlockedByStock(physical({ stock: 3 }), 1)).toBe(false)
  })

  it('never blocks SERVICE products, whatever the stock', () => {
    expect(isBlockedByStock({ product_type: 'SERVICE', stock: 0 })).toBe(false)
    expect(isBlockedByStock({ product_type: 'SERVICE', stock: 0, has_variants: false })).toBe(false)
  })

  it('does not block variant products (fallback is the variant picker)', () => {
    expect(isBlockedByStock(physical({ stock: 0, has_variants: true }))).toBe(false)
  })
})

describe('stockBadgeKind', () => {
  it('prefers the variants badge when the product has variants', () => {
    expect(stockBadgeKind(physical({ has_variants: true }))).toBe('variants')
    expect(stockBadgeKind({ product_type: 'SERVICE', has_variants: true })).toBe('variants')
  })

  it('shows the service badge for SERVICE products', () => {
    expect(stockBadgeKind({ product_type: 'SERVICE', stock: 0 })).toBe('service')
  })

  it('shows the stock badge for stock-tracked products', () => {
    expect(stockBadgeKind(physical({ stock: 4 }))).toBe('stock')
    expect(stockBadgeKind(physical({ stock: 0 }))).toBe('stock')
  })
})
