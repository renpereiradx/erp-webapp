/**
 * Superficie pública del feature `inventory-analytics` (F5).
 * Las páginas (capa superior) importan de acá; la dirección de dependencias
 * sigue siendo `pages → features → (domain, services)`.
 */

export { AbcExplorer } from './components/AbcExplorer'
export { AbcSummaryTable } from './components/AbcSummaryTable'
export { AgingTable } from './components/AgingTable'
export { DeadStockTable } from './components/DeadStockTable'
export { DeadStockThresholdSelector } from './components/DeadStockThresholdSelector'
export { InventoryAlertsPanel } from './components/InventoryAlertsPanel'
export { InventoryBadge } from './components/InventoryBadge'
export { InventoryKpiLedger } from './components/InventoryKpiLedger'
export { InventoryPageLayout } from './components/InventoryPageLayout'
export { InventoryPeriodSelector } from './components/InventoryPeriodSelector'
export { InventoryRefreshButton } from './components/InventoryRefreshButton'
export { InventoryTable } from './components/InventoryTable'
export { MoversList } from './components/MoversList'
export { ReorderSummaryPanel } from './components/ReorderSummaryPanel'
export { ReorderTable } from './components/ReorderTable'
export { StockLevelsSummaryPanel } from './components/StockLevelsSummaryPanel'
export { StockLevelsTable } from './components/StockLevelsTable'
export { StockStatusFilter } from './components/StockStatusFilter'
export { StockStatusPanel } from './components/StockStatusPanel'
export { TurnoverCategoryTable } from './components/TurnoverCategoryTable'
export { TurnoverProductTable } from './components/TurnoverProductTable'

export { useInventoryPeriod } from './hooks/useInventoryPeriod'
export {
  INVENTORY_STALE_TIME,
  inventoryQueryKeys,
  useDeadStock,
  useInventoryAbc,
  useInventoryDashboard,
  useInventoryOverview,
  useInventoryTurnover,
  useReorderAnalysis,
  useStockAging,
  useStockLevels,
} from './hooks/useInventoryQueries'

export type {
  AbcClass,
  AbcClassRow,
  AgingBucketKey,
  AgingBucketRow,
  AgingView,
  DeadStockRecommendationKey,
  DeadStockThreshold,
  DeadStockView,
  InventoryAbcView,
  InventoryBadgeTone,
  InventoryColumn,
  InventoryDashboardView,
  InventoryKpiId,
  InventoryKpiItem,
  InventoryKpiKind,
  InventoryKpiRow,
  InventoryKpiTone,
  InventoryTurnoverView,
  ReorderPriorityKey,
  ReorderSummaryView,
  ReorderView,
  StockFilterValue,
  StockLevelsQueryParams,
  StockLevelsView,
  StockSortState,
  StockStatusKey,
  TurnoverKpiId,
  TurnoverKpiRow,
  TurnoverPerformanceKey,
} from './types'
