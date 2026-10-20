/**
 * Antigüedad del stock (F5).
 *
 * El endpoint devuelve cinco tramos fijos por valor. Los labels del BE vienen
 * en español (`"0-30 días"`): la UI los resuelve por `min_days/max_days` con
 * claves i18n, así el inglés no muestra texto del servidor.
 */
import type { StockAgingBucket, StockAgingReport, StockAgingSummary } from '@/types/bi'
import { toNumberOrNull } from './format'

export type AgingBucketKey = 'd0_30' | 'd31_60' | 'd61_90' | 'd91_180' | 'd180plus' | 'other'

export interface AgingBucketRow {
  key: AgingBucketKey
  productCount: number
  totalUnits: number
  totalValue: number
  percentage: number
}

export const agingBucketKeyFor = (bucket: StockAgingBucket): AgingBucketKey => {
  const min = Number(bucket.min_days)
  const max = Number(bucket.max_days)
  if (min <= 0 && max <= 30) return 'd0_30'
  if (min <= 31 && max <= 60) return 'd31_60'
  if (min <= 61 && max <= 90) return 'd61_90'
  if (min <= 91 && max <= 180) return 'd91_180'
  if (min >= 181) return 'd180plus'
  return 'other'
}

export const buildAgingRows = (
  buckets: StockAgingBucket[] | null | undefined,
): AgingBucketRow[] => {
  if (!Array.isArray(buckets)) return []
  return buckets.map((bucket) => ({
    key: agingBucketKeyFor(bucket),
    productCount: toNumberOrNull(bucket.product_count) ?? 0,
    totalUnits: toNumberOrNull(bucket.total_units) ?? 0,
    totalValue: toNumberOrNull(bucket.total_value) ?? 0,
    percentage: toNumberOrNull(bucket.percentage) ?? 0,
  }))
}

export interface AgingSummaryView {
  totalProducts: number
  totalUnits: number
  totalValue: number
  averageAgeDays: number
  oldStockValue: number
  oldStockPct: number
}

export const buildAgingSummary = (
  summary: StockAgingSummary | null | undefined,
): AgingSummaryView => ({
  totalProducts: toNumberOrNull(summary?.total_products) ?? 0,
  totalUnits: toNumberOrNull(summary?.total_units) ?? 0,
  totalValue: toNumberOrNull(summary?.total_value) ?? 0,
  averageAgeDays: toNumberOrNull(summary?.average_age_days) ?? 0,
  oldStockValue: toNumberOrNull(summary?.old_stock_value) ?? 0,
  oldStockPct: toNumberOrNull(summary?.old_stock_pct) ?? 0,
})

export const agingReportRows = (report: StockAgingReport | null | undefined): StockAgingBucket[] =>
  Array.isArray(report?.buckets) ? report.buckets : []
