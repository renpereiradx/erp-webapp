/**
 * Tipos públicos del feature `inventory-analytics` (F5). Los view-models son
 * producidos por el dominio puro (`src/domain/inventory-analytics/`); acá se
 * re-exportan para que las páginas importen de una sola superficie.
 */
export type { AbcClass, AbcClassRow } from '@/domain/inventory-analytics/abc'
export type { AgingBucketKey, AgingBucketRow } from '@/domain/inventory-analytics/aging'
export type {
  DeadStockRecommendationKey,
  DeadStockThreshold,
} from '@/domain/inventory-analytics/deadStock'
export type {
  InventoryKpiId,
  InventoryKpiKind,
  InventoryKpiRow,
  TurnoverKpiId,
  TurnoverKpiRow,
} from '@/domain/inventory-analytics/kpis'
export type { ReorderPriorityKey, ReorderSummaryView } from '@/domain/inventory-analytics/reorder'
export type { StockSortState, StockStatusKey } from '@/domain/inventory-analytics/stock'
export type {
  TurnoverPerformanceKey,
} from '@/domain/inventory-analytics/turnover'
export type { InventoryKpiItem, InventoryKpiTone } from '../components/InventoryKpiLedger'
export type { InventoryColumn } from '../components/InventoryTable'
export type { InventoryBadgeTone } from '../components/InventoryBadge'
export type {
  AgingView,
  DeadStockView,
  InventoryAbcView,
  InventoryDashboardView,
  InventoryTurnoverView,
  ReorderView,
  StockLevelsQueryParams,
  StockLevelsView,
} from '../hooks/useInventoryQueries'
export type { StockFilterValue } from '../components/StockStatusFilter'
