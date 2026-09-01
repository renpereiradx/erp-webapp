/**
 * collectionSplit — pure calculations for the cash-collection split.
 *
 * A collection has TWO independent figures: the cash the customer physically
 * hands over (amountReceived) and the part of it that lands on the sale's
 * balance (amountToApply). The remainder of the cash is CHANGE handed back on
 * the spot; any gap between the applied amount and the sale total stays as
 * PENDING BALANCE on the sale (which becomes PARTIAL_PAYMENT at the backend).
 *
 * Without React, without side effects. Consumed by CollectionStep and the
 * SaleCheckoutWizard validation.
 */

/** Rounding to 2 decimals (half up), same convention as foreignPayment. */
function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Cash actually applied to the sale balance: the typed amount to apply,
 * capped at the document total (a FE total can drift from the backend's
 * authoritative pricing; never over-apply). Falls back to the received
 * amount when the operator does not type one (full collection).
 */
export function computeAppliedAmount(
  amountToApply: number,
  amountReceived: number,
  totalAmount: number,
): number {
  const requested = amountToApply > 0 ? amountToApply : Math.max(0, amountReceived || 0);
  return round2(Math.min(requested, Math.max(0, totalAmount || 0)));
}

/**
 * Change handed back to the customer: cash received minus the applied
 * amount — NOT the total minus the applied amount. Never negative.
 */
export function computeCollectionChange(amountReceived: number, appliedAmount: number): number {
  return round2(Math.max(0, (amountReceived || 0) - (appliedAmount || 0)));
}

/**
 * Outstanding balance after this collection: how much of the document total
 * remains due (the sale stays PARTIAL_PAYMENT when > 0). Never negative.
 */
export function computePendingBalance(totalAmount: number, appliedAmount: number): number {
  return round2(Math.max(0, (totalAmount || 0) - (appliedAmount || 0)));
}

/**
 * Cash still missing to cover the pending balance: when the customer hands
 * less cash than they want applied. The operator must fix the amounts before
 * confirming. Never negative.
 */
export function computeCashShortfall(amountReceived: number, appliedAmount: number): number {
  return round2(Math.max(0, (appliedAmount || 0) - (amountReceived || 0)));
}
