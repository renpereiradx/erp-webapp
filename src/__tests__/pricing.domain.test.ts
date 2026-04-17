/**
 * Tests for the centralized pricing domain.
 * Covers: core rounding, sales policy, and purchases policy.
 *
 * Policy: All Gs prices must be multiples of 50 (ceil rounding).
 */

import { describe, it, expect } from 'vitest'
import { roundToStep, isMultipleOfStep } from '../domain/core/rounding'
import { calculateSalePriceGs, normalizeSalePriceGs } from '../domain/sale/pricing/salesPricingPolicy'
import {
  calculatePurchaseSalePriceGs,
  normalizePurchaseAmountGs,
} from '../domain/purchase/pricing/purchasePricingPolicy'

// ─────────────────────────────────────────────────────────────
// Core: roundToStep
// ─────────────────────────────────────────────────────────────
describe('roundToStep (core)', () => {
  describe('ceil mode (default)', () => {
    it('rounds 12999 up to 13000 (step 50)', () => {
      expect(roundToStep(12999, 50, 'ceil')).toBe(13000)
    })

    it('keeps 12950 as-is (already a multiple of 50)', () => {
      expect(roundToStep(12950, 50, 'ceil')).toBe(12950)
    })

    it('rounds 12951 up to 13000', () => {
      expect(roundToStep(12951, 50, 'ceil')).toBe(13000)
    })

    it('returns 0 for value 0', () => {
      expect(roundToStep(0, 50, 'ceil')).toBe(0)
    })

    it('rounds up when value is exactly 1 above a multiple', () => {
      expect(roundToStep(13001, 50, 'ceil')).toBe(13050)
    })

    it('uses step=50 and mode=ceil as defaults', () => {
      expect(roundToStep(12999)).toBe(13000)
    })

    it('works with step=100', () => {
      expect(roundToStep(12999, 100, 'ceil')).toBe(13000)
      expect(roundToStep(13001, 100, 'ceil')).toBe(13100)
    })
  })

  describe('floor mode', () => {
    it('rounds 12999 down to 12950', () => {
      expect(roundToStep(12999, 50, 'floor')).toBe(12950)
    })

    it('keeps 12950 as-is', () => {
      expect(roundToStep(12950, 50, 'floor')).toBe(12950)
    })
  })

  describe('nearest mode', () => {
    it('rounds 12975 to 13000 (equidistant → up due to Math.round)', () => {
      expect(roundToStep(12975, 50, 'nearest')).toBe(13000)
    })

    it('rounds 12974 down to 12950', () => {
      expect(roundToStep(12974, 50, 'nearest')).toBe(12950)
    })
  })

  describe('input validation', () => {
    it('throws for non-finite value', () => {
      expect(() => roundToStep(NaN)).toThrow()
      expect(() => roundToStep(Infinity)).toThrow()
    })

    it('throws for step <= 0', () => {
      expect(() => roundToStep(100, 0)).toThrow()
      expect(() => roundToStep(100, -50)).toThrow()
    })

    it('throws for unknown mode', () => {
      expect(() => roundToStep(100, 50, 'unknown')).toThrow()
    })
  })
})

// ─────────────────────────────────────────────────────────────
// Core: isMultipleOfStep
// ─────────────────────────────────────────────────────────────
describe('isMultipleOfStep (core)', () => {
  it('returns true for exact multiples of 50', () => {
    expect(isMultipleOfStep(0)).toBe(true)
    expect(isMultipleOfStep(50)).toBe(true)
    expect(isMultipleOfStep(13000)).toBe(true)
  })

  it('returns false for non-multiples', () => {
    expect(isMultipleOfStep(12999)).toBe(false)
    expect(isMultipleOfStep(12951)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
// Sales pricing policy
// ─────────────────────────────────────────────────────────────
describe('calculateSalePriceGs (sales policy)', () => {
  it('applies 30% margin to 10000 → 13000', () => {
    expect(calculateSalePriceGs(10000, 30)).toBe(13000)
  })

  it('applies 29.99% margin to 10000 (raw=12999) → rounds up to 13000', () => {
    expect(calculateSalePriceGs(10000, 29.99)).toBe(13000)
  })

  it('returns cost unchanged for 0% margin when cost is already a multiple of 50', () => {
    expect(calculateSalePriceGs(10000, 0)).toBe(10000)
  })

  it('rounds up to nearest 50 when result is not a multiple', () => {
    // 10000 * 1.299 = 12990 → already a multiple of 50
    // 10000 * 1.2991 = 12991 → should become 13000
    expect(calculateSalePriceGs(10000, 29.91)).toBe(13000)
  })

  it('returns 0 for invalid cost', () => {
    expect(calculateSalePriceGs(-1, 30)).toBe(0)
    expect(calculateSalePriceGs(NaN, 30)).toBe(0)
  })

  it('uses 30% default margin', () => {
    expect(calculateSalePriceGs(10000)).toBe(13000)
  })

  it('returns a multiple of 50 for various inputs', () => {
    const cases = [
      [5000, 25],
      [7300, 40],
      [15000, 15],
      [999, 50],
    ]
    for (const [cost, margin] of cases) {
      const result = calculateSalePriceGs(cost, margin)
      expect(result % 50).toBe(0)
    }
  })
})

describe('normalizeSalePriceGs (sales policy)', () => {
  it('rounds 12999 up to 13000', () => {
    expect(normalizeSalePriceGs(12999)).toBe(13000)
  })

  it('keeps 12950 as-is', () => {
    expect(normalizeSalePriceGs(12950)).toBe(12950)
  })

  it('rounds 12951 up to 13000', () => {
    expect(normalizeSalePriceGs(12951)).toBe(13000)
  })

  it('returns 0 for 0', () => {
    expect(normalizeSalePriceGs(0)).toBe(0)
  })

  it('returns 0 for invalid input', () => {
    expect(normalizeSalePriceGs(-100)).toBe(0)
    expect(normalizeSalePriceGs(NaN)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// Purchases pricing policy
// ─────────────────────────────────────────────────────────────
describe('calculatePurchaseSalePriceGs (purchases policy)', () => {
  it('applies 30% margin to 10000 → 13000', () => {
    expect(calculatePurchaseSalePriceGs(10000, 30)).toBe(13000)
  })

  it('applies 29.99% margin to 10000 (raw=12999) → rounds up to 13000', () => {
    expect(calculatePurchaseSalePriceGs(10000, 29.99)).toBe(13000)
  })

  it('returns 0 for invalid unit price', () => {
    expect(calculatePurchaseSalePriceGs(0, 30)).toBe(0)
    expect(calculatePurchaseSalePriceGs(-100, 30)).toBe(0)
    expect(calculatePurchaseSalePriceGs(null as any, 30)).toBe(0)
  })

  it('uses 30% default margin when none provided', () => {
    expect(calculatePurchaseSalePriceGs(10000)).toBe(13000)
    expect(calculatePurchaseSalePriceGs(10000, null as any)).toBe(13000)
  })

  it('returns a multiple of 50 for various inputs', () => {
    const cases = [
      [5000, 25],
      [7300, 40],
      [15000, 15],
      [999, 50],
    ]
    for (const [cost, margin] of cases) {
      const result = calculatePurchaseSalePriceGs(cost, margin)
      expect(result % 50).toBe(0)
    }
  })
})

describe('normalizePurchaseAmountGs (purchases policy)', () => {
  it('rounds 12999 up to 13000', () => {
    expect(normalizePurchaseAmountGs(12999)).toBe(13000)
  })

  it('keeps 12950 as-is', () => {
    expect(normalizePurchaseAmountGs(12950)).toBe(12950)
  })

  it('rounds 12951 up to 13000', () => {
    expect(normalizePurchaseAmountGs(12951)).toBe(13000)
  })

  it('returns 0 for 0', () => {
    expect(normalizePurchaseAmountGs(0)).toBe(0)
  })

  it('returns 0 for invalid input', () => {
    expect(normalizePurchaseAmountGs(-100)).toBe(0)
    expect(normalizePurchaseAmountGs(NaN)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// Integration: Sales and Purchases produce the same Gs-rounded result
// for the same cost + margin inputs
// ─────────────────────────────────────────────────────────────
describe('cross-context consistency', () => {
  it('sales and purchases policies agree on the same cost+margin', () => {
    const cases = [
      [10000, 30],
      [10000, 29.99],
      [5000, 25],
    ]
    for (const [cost, margin] of cases) {
      const salesResult = calculateSalePriceGs(cost, margin)
      const purchasesResult = calculatePurchaseSalePriceGs(cost, margin)
      expect(salesResult).toBe(purchasesResult)
    }
  })

  it('normalization helpers in both contexts agree', () => {
    const values = [12999, 12950, 12951, 0, 50000]
    for (const v of values) {
      expect(normalizeSalePriceGs(v)).toBe(normalizePurchaseAmountGs(v))
    }
  })
})
