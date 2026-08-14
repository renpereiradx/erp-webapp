/**
 * Barrel del feature Stock Movements — API pública del módulo.
 * (docs/guides/typescript-migration.md: todo consumo externo del feature pasa por aquí)
 */

export { StockMovementsPage } from './components/StockMovementsPage';
export { useStockMovements } from './hooks/useStockMovements';
export type { UseStockMovements } from './hooks/useStockMovements';

export type {
  TransactionType,
  ReferenceType,
  ReasonCategory,
  StockTransaction,
  StockTransactionHistory,
  StockMovementSummary,
  StockConsistencyReport,
  InventoryDiscrepancyReport,
  RegisterMovementPayload,
} from './types';
