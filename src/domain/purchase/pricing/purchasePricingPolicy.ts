/**
 * Purchases pricing policy for the Guaraní (PYG) context.
 *
 * Normalizes purchase-derived sale prices by rounding UP to the
 * nearest multiple of 50 (ceil-to-50 rule).
 *
 * Usage:
 *   import { calculatePurchaseSalePriceGs, normalizePurchaseAmountGs }
 *     from '@/domain/purchase/pricing/purchasePricingPolicy'
 */

import { roundToStep } from '@/domain/core/rounding'

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
 */
export function calculatePurchaseSalePriceGs(unitPriceGs: number, profitPct?: number): number {
  if (!unitPriceGs || !Number.isFinite(unitPriceGs) || unitPriceGs <= 0) return 0

  const margin =
    profitPct !== null && profitPct !== undefined && Number.isFinite(profitPct) && profitPct > 0
      ? profitPct
      : DEFAULT_MARGIN_PCT

  const raw = unitPriceGs * (1 + margin / 100)
  return roundToStep(raw, GS_STEP, 'ceil')
}

/**
 * Calculates the profit margin percentage based on cost and sale price.
 * 
 * @param {number} cost - The unit cost.
 * @param {number} salePrice - The final sale price.
 * @returns {number} Profit margin percentage (0-100).
 */
export function calculateProfitMargin(cost: number, salePrice: number): number {
  if (!cost || cost <= 0) return 0;
  return Math.max(0, ((salePrice - cost) / cost) * 100);
}

/**
 * Normalizes any monetary amount in Gs to a multiple of 50 using ceil.
 * Use this for amounts that already exist but need to be brought into policy.
 *
 * @param {number} amountGs - Any monetary amount in Gs.
 * @returns {number} Amount rounded up to the nearest multiple of 50.
 */
export function normalizePurchaseAmountGs(amountGs: number): number {
  if (!Number.isFinite(amountGs) || amountGs < 0) return 0
  return roundToStep(amountGs, GS_STEP, 'ceil')
}
