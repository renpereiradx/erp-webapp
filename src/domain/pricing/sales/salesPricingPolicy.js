/**
 * Sales pricing policy for the Guaraní (PYG) context.
 *
 * Applies a margin percentage to a base cost and rounds the result
 * UP to the nearest multiple of 50 (ceil-to-50 rule).
 *
 * Usage:
 *   import { calculateSalePriceGs, normalizeSalePriceGs }
 *     from '@/domain/pricing/sales/salesPricingPolicy'
 *   const price = calculateSalePriceGs(10000, 30) // => 13000
 */

import { roundToStep } from '../core/rounding'

/** Default rounding step for Gs prices */
const GS_STEP = 50

/**
 * Calculates the sale price in Gs given a cost and a margin percentage,
 * then rounds UP to the nearest multiple of GS_STEP (50).
 *
 * Formula: raw = cost × (1 + marginPct / 100)
 *          final = ceil(raw / 50) × 50
 *
 * @param {number} costGs - Base cost in Guaraníes. Must be >= 0.
 * @param {number} [marginPct=30] - Margin percentage (e.g. 30 for 30%). Must be >= 0.
 * @returns {number} Final sale price, always a multiple of 50.
 *
 * @example
 * calculateSalePriceGs(10000, 30)   // => 13000
 * calculateSalePriceGs(10000, 29.99) // raw=12999 => 13000
 * calculateSalePriceGs(10000, 0)    // => 10000
 */
export function calculateSalePriceGs(costGs, marginPct = 30) {
  if (!Number.isFinite(costGs) || costGs < 0) return 0

  if (!Number.isFinite(marginPct) || marginPct < 0) {
    // If margin is invalid, just normalize the cost itself
    return costGs > 0 ? roundToStep(costGs, GS_STEP, 'ceil') : 0
  }

  const raw = costGs * (1 + marginPct / 100)
  return roundToStep(raw, GS_STEP, 'ceil')
}

/**
 * Normalizes an existing sale price in Gs to a multiple of 50 using ceil.
 * Use when a price already exists (e.g. from the API or product catalog)
 * but needs to conform to the PYG rounding policy.
 *
 * @param {number} priceGs - The sale price to normalize.
 * @returns {number} Price rounded up to the nearest multiple of 50.
 *
 * @example
 * normalizeSalePriceGs(12999) // => 13000
 * normalizeSalePriceGs(12950) // => 12950
 * normalizeSalePriceGs(0)     // => 0
 */
export function normalizeSalePriceGs(priceGs) {
  if (!Number.isFinite(priceGs) || priceGs < 0) return 0
  return roundToStep(priceGs, GS_STEP, 'ceil')
}
