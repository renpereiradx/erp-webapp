/**
 * ABC classification presentation for the inventory analytics dashboard.
 * Extracted from pages/InventoryAnalytics/InventoryDashboard.tsx:84-109
 * (PLAN_ALINEACION_BI_FRONTEND F1, decisión D5: pulido in situ).
 *
 * Pureza T23: sin labels UI — ABCSummary resuelve los textos por clase con
 * i18n (bi.inventory.abc.class*.label/desc).
 */
import { formatPYG } from '@/utils/currencyUtils'

export interface AbcSummaryLike {
  class_a_value_pct?: number | null
  class_b_value_pct?: number | null
  class_c_value_pct?: number | null
  class_a_count?: number | null
  class_b_count?: number | null
  class_c_count?: number | null
  [key: string]: unknown
}

export interface AbcItemRow {
  class: 'A' | 'B' | 'C'
  percentage: number
  count: number
  /** Formatted PYG share of the total inventory value. */
  value: string
}

/** The three ABC rows of the dashboard, valuated over the given total. */
export const buildAbcItems = (
  abcSummary: AbcSummaryLike | null | undefined,
  totalValue: number | null | undefined,
): AbcItemRow[] => {
  if (!abcSummary) return []
  const total = totalValue || 0
  const classes = [
    { class: 'A' as const, percentage: abcSummary.class_a_value_pct ?? 0, count: abcSummary.class_a_count ?? 0 },
    { class: 'B' as const, percentage: abcSummary.class_b_value_pct ?? 0, count: abcSummary.class_b_count ?? 0 },
    { class: 'C' as const, percentage: abcSummary.class_c_value_pct ?? 0, count: abcSummary.class_c_count ?? 0 },
  ]
  return classes.map((c) => ({
    ...c,
    value: formatPYG((total * c.percentage) / 100),
  }))
}
