/**
 * Tax rate resolution helpers (pure domain — no React/store dependencies).
 *
 * The backend resolves the full hierarchy server-side and exposes it as
 * `applicable_tax_rate` (percent, e.g. 10.0) on product GETs. These helpers
 * normalize percent ↔ fraction in ONE place and fall back to the system
 * default rate (IVA 10%, Paraguay) only when no rate is available.
 *
 * Rate 0 (EXENTO) is a VALID value and must never fall through to a fallback.
 */

export const DEFAULT_VAT_PERCENT = 10;

/**
 * Normalizes a tax rate value to PERCENT (e.g. both 10.0 and 0.10 → 10).
 * Returns null when the value is absent/invalid — never throws.
 */
export function normalizeTaxRatePercent(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed >= 1 ? parsed : parsed * 100;
}

/**
 * Resolves the applicable VAT rate (percent) for a product. Hierarchy:
 *   1. `applicable_tax_rate` — backend authority (already resolved)
 *   2. legacy per-product rate fields (percent or fraction)
 *   3. category default rate
 *   4. `fallbackPercent` (default: system rate 10%)
 */
export function resolveApplicableRatePercent(
  product: Record<string, any> | null | undefined,
  fallbackPercent: number = DEFAULT_VAT_PERCENT,
): number {
  if (!product) return fallbackPercent;

  const applicable = normalizeTaxRatePercent(product.applicable_tax_rate?.rate);
  if (applicable !== null) return applicable;

  const legacy = normalizeTaxRatePercent(
    product.tax?.rate?.rate ?? product.tax?.rate ?? product.tax_rate,
  );
  if (legacy !== null) return legacy;

  const category = normalizeTaxRatePercent(product.category?.default_tax_rate?.rate);
  if (category !== null) return category;

  return fallbackPercent;
}

/**
 * Same resolution expressed as a FRACTION (what the sale/purchase domain
 * calculators consume). Falls back to `fallbackPercent` when unknown.
 */
export function resolveApplicableRateFraction(
  product: Record<string, any> | null | undefined,
  fallbackPercent: number = DEFAULT_VAT_PERCENT,
): number {
  return resolveApplicableRatePercent(product, fallbackPercent) / 100;
}

/**
 * Resolves the tax rate ID of a product (for forms that send `tax_rate_id`).
 * Returns null when no rate is known; string ids are coerced to number.
 */
export function resolveApplicableRateId(
  product: Record<string, any> | null | undefined,
): number | null {
  if (!product) return null;
  const raw =
    product.applicable_tax_rate?.id ??
    product.tax?.rate?.id ??
    product.tax_rate_id ??
    product.category?.default_tax_rate?.id ??
    product.category?.default_tax_rate_id ??
    null;
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Coerces a single raw rate value (percent or fraction) to a FRACTION,
 * falling back to `fallbackFraction` when absent/invalid.
 */
export function coerceTaxRateFraction(
  value: unknown,
  fallbackFraction: number = DEFAULT_VAT_PERCENT / 100,
): number {
  const pct = normalizeTaxRatePercent(value);
  return pct === null ? fallbackFraction : pct / 100;
}
