/**
 * Purchases pricing policy for the Guaraní (PYG) context.
 *
 * Normalizes purchase-derived sale prices by rounding UP to the
 * nearest multiple of 50 (ceil-to-50 rule).
 *
 * Usage:
 *   import { calculatePurchaseSalePriceGs, normalizePurchaseAmountGs }
 *     from '@/domain/pricing/purchases/purchasePricingPolicy'
 */

import { roundToStep } from '../core/rounding'

/** Default rounding step for Gs prices */
const GS_STEP = 50

/** Default margin percentage used when none is provided */
const DEFAULT_MARGIN_PCT = 30

/**
 * Calculates the suggested sale price for a purchased item in Gs,
 * then rounds UP to the nearest multiple of GS_STEP (50).
 *
 * @param {number} unitPriceGs - Unit cost from purchase order. Must be > 0.
 * @param {number} [profitPct] - Profit margin percentage. Defaults to DEFAULT_MARGIN_PCT.
 * @returns {number} Suggested sale price rounded to multiple of 50.
 *
 * @example
 * calculatePurchaseSalePriceGs(10000, 30)    // => 13000
 * calculatePurchaseSalePriceGs(10000, 29.99) // raw=12999 => 13000
 */
export function calculatePurchaseSalePriceGs(unitPriceGs, profitPct) {
  if (!unitPriceGs || !Number.isFinite(unitPriceGs) || unitPriceGs <= 0) return 0

  const margin =
    profitPct !== null && profitPct !== undefined && Number.isFinite(profitPct) && profitPct > 0
      ? profitPct
      : DEFAULT_MARGIN_PCT

  const raw = unitPriceGs * (1 + margin / 100)
  return roundToStep(raw, GS_STEP, 'ceil')
}

/**
 * Normalizes any monetary amount in Gs to a multiple of 50 using ceil.
 * Use this for amounts that already exist but need to be brought into policy.
 *
 * @param {number} amountGs - Any monetary amount in Gs.
 * @returns {number} Amount rounded up to the nearest multiple of 50.
 *
 * @example
 * normalizePurchaseAmountGs(12999) // => 13000
 * normalizePurchaseAmountGs(12950) // => 12950
 * normalizePurchaseAmountGs(12951) // => 13000
 */
export function normalizePurchaseAmountGs(amountGs) {
  if (!Number.isFinite(amountGs) || amountGs < 0) return 0
  return roundToStep(amountGs, GS_STEP, 'ceil')
}
