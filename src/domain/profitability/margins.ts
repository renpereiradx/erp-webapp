/**
 * Margin math for the profitability module: top-seller ranking, margin bar
 * scaling, contribution-share donut geometry and compact PYG formatting.
 * Extracted from features/profitability/components/SellerProfitability.jsx
 * (PLAN_ALINEACION_BI_FRONTEND F1; FASE 2 migrates the whole feature and
 * dedupes formatPercent across the 6 monoliths).
 */
import { formatPYG } from '@/utils/currencyUtils'

export interface RankedSeller {
  rank?: number | null
  seller_name?: string | null
  gross_profit?: number | null
  gross_margin_pct?: number | null
  [key: string]: unknown
}

/** The rank-1 seller, falling back to the first row of the list. */
export const getTopSeller = (sellers: RankedSeller[] | null | undefined): RankedSeller | undefined =>
  sellers?.find((s) => s.rank === 1) || sellers?.[0]

/**
 * Compact PYG for big totals: '12,3M' above one million, full 'Gs.' format
 * otherwise (exactly the legacy ternary of the donut center label).
 */
export const formatCompactPYG = (value: number | null | undefined): string => {
  const v = value ?? 0
  if (v > 1000000) return `${(v / 1000000).toFixed(1)}M`
  return formatPYG(v)
}

/**
 * Width (%) of the gross-margin bar: 50% margin fills the bar completely
 * (the legacy `/50*100` scale of the ranking rows).
 */
export const marginBarWidth = (grossMarginPct: number | null | undefined): number =>
  ((grossMarginPct ?? 0) / 50) * 100

export interface DonutGeometry {
  /** SVG strokeDasharray of the r=42 donut circle. */
  dashArray: number
  /** SVG strokeDashoffset for the segment share. */
  dashOffset: number
  /** rotation(deg) around the donut center from preceding segments. */
  rotation: number
  /** 'round' caps for visible segments, 'butt' for thin ones. */
  lineCap: 'round' | 'butt'
}

const DONUT_CIRCUMFERENCE = 263.8

/**
 * Donut segment geometry for a contribution-share list, given the summed
 * percentage of all preceding segments.
 */
export const contributionDonutGeometry = (
  pct: number | null | undefined,
  precedingPctSum: number,
): DonutGeometry => {
  const share = pct ?? 0
  return {
    dashArray: DONUT_CIRCUMFERENCE,
    dashOffset: DONUT_CIRCUMFERENCE * (1 - share / 100),
    rotation: precedingPctSum * 3.6,
    lineCap: share > 5 ? 'round' : 'butt',
  }
}
