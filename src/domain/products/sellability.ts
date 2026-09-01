/**
 * Sellability rules for the POS: whether a product can be added to the cart
 * and how its stock should be presented.
 *
 * Single source of truth for the "does this product require stock?" rule,
 * previously duplicated with different shapes across the cart entry points
 * (search panel, barcode scanner, direct click, variant selector).
 *
 * Pure domain logic: no React, no side effects, no HTTP.
 */

export const SERVICE_PRODUCT_TYPE = 'SERVICE';

/**
 * Minimal product shape the helpers need. Every cart entry point already
 * carries these fields (ProductDisplay, scan result, variant modal product).
 */
export interface SellabilityProduct {
  product_type?: string | null;
  stock?: number | null;
  has_variants?: boolean | null;
}

/**
 * Only PHYSICAL (and unknown/legacy types, defaulting to PHYSICAL) consume
 * stock. SERVICE products are fulfilled directly and never track stock.
 */
export const requiresStock = (product: SellabilityProduct): boolean =>
  (product.product_type ?? 'PHYSICAL') !== SERVICE_PRODUCT_TYPE;

/** Stock still sellable after discounting what is already in the cart. */
export const availableStockFor = (
  product: SellabilityProduct,
  qtyInCart: number = 0,
): number => Math.max(0, (product.stock ?? 0) - qtyInCart);

/**
 * Upper bound for the quantity input: remaining stock for stock-tracked
 * products, unlimited for SERVICE (the input simply is not capped).
 */
export const maxSellableQty = (
  product: SellabilityProduct,
  qtyInCart: number = 0,
): number =>
  requiresStock(product) ? availableStockFor(product, qtyInCart) : Infinity;

/**
 * True when the product cannot be added to the cart right now: it requires
 * stock, has none left (cart included) and cannot fall back to picking a
 * variant.
 */
export const isBlockedByStock = (
  product: SellabilityProduct,
  qtyInCart: number = 0,
): boolean =>
  requiresStock(product) &&
  !product.has_variants &&
  availableStockFor(product, qtyInCart) <= 0;

/** Which neutral badge the search results should show for this product. */
export type StockBadgeKind = 'stock' | 'service' | 'variants';

export const stockBadgeKind = (product: SellabilityProduct): StockBadgeKind => {
  if (product.has_variants) return 'variants';
  if (!requiresStock(product)) return 'service';
  return 'stock';
};
