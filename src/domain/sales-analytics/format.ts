/**
 * Formatting/pagination helpers for sales analytics.
 * Extracted from pages/sales-analytics/ProductsCategories.jsx
 * (PLAN_ALINEACION_BI_FRONTEND F1).
 */

/**
 * Rounds a percentage to 1 decimal without float dust:
 * the legacy `Math.round(x * 10) / 10` pattern of the tables.
 * Non-numeric values fall back to 0.
 */
export const roundPct1 = (value: number | null | undefined): number =>
  Math.round((Number(value) || 0) * 10) / 10

export interface PageState {
  page?: number | null
  total_pages?: number | null
}

/**
 * Clamps a target page into [1, max(1, total_pages)] — guards the
 * manual prev/next pagination of the products table.
 */
export const clampPage = (page: number, pagination: PageState | null | undefined): number => {
  const totalPages = Math.max(1, pagination?.total_pages || 1)
  return Math.min(Math.max(1, page), totalPages)
}
