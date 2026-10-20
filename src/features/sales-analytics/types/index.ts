/**
 * Tipos públicos del feature `sales-analytics` (F4). Los view-models son
 * producidos por el dominio puro (`src/domain/sales-analytics/`); acá se
 * re-exportan para que las páginas importen de una sola superficie.
 */
export type { AnalyticsColumn } from '../components/AnalyticsTable'
export type { KpiLedgerItem, KpiTone } from '../components/KpiLedger'
export type { ProductSortState, ProductRankItem } from '@/domain/sales-analytics/products'
export type { SalesKpiId, SalesKpiRow, TrendView } from '@/domain/sales-analytics/kpis'
export type { TrendSeriesRow, TrendSummaryView } from '@/domain/sales-analytics/trends'
export type {
  CustomerSummaryId,
  CustomerSummaryItem,
  FrequencyKey,
  SegmentKey,
} from '@/domain/sales-analytics/customers'
export type {
  ProfilePoint,
  SelloutState,
  VelocityKpiId,
  VelocityKpiRow,
  VelocityLevelKey,
} from '@/domain/sales-analytics/velocity'
export type {
  ComparisonDraft,
  ComparisonMetricId,
  ComparisonMetricRow,
  ComparisonMode,
} from '@/domain/sales-analytics/comparison'
export type {
  DiscountGroupView,
  DiscountSummaryView,
} from '@/domain/sales-analytics/discounts'
