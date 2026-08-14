/**
 * Tipos del feature Stock Movements.
 * Alineados con el dominio del backend: business_management/internal/inventory/domain.go
 * (StockTransaction l.113-130, enums transaction_type l.199-206 / reference_type l.209-215).
 *
 * Este feature usa EXCLUSIVAMENTE el ledger `products.stock_transactions` expuesto vía
 * `/stock-transactions/*`. No consume `/manual_adjustment/*` ni `/inventory/*`.
 */

export type TransactionType =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'INVENTORY'
  | 'INITIAL'
  | 'LOSS'
  | 'FOUND';

export type ReferenceType =
  | 'sale_order'
  | 'purchase_order'
  | 'manual_adjustment'
  | 'inventory_check'
  | 'initial_stock';

/** Resultado de POST /stock-transactions/ (201). Objeto pelado, no envuelto en {success}. */
export interface StockTransaction {
  id: number;
  product_id: string;
  variant_id?: number | null;
  branch_id: number;
  transaction_type: TransactionType;
  quantity_change: number;
  unit_price?: number | null;
  reference_type?: ReferenceType | null;
  reference_id?: number | string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

/** Fila de los endpoints de lectura de historial (product / by-date / by-id). */
export interface StockTransactionHistory extends StockTransaction {
  product_name?: string;
  variant_name?: string;
  balance_after?: number;
}

/** GET /stock-transactions/movement-summary (reparado en backend H.4-ter). */
export interface StockMovementSummary {
  product_id: string;
  product_name?: string;
  initial_stock: number;
  final_stock: number;
  total_in: number;
  total_out: number;
  net_change: number;
}

/** GET /stock-transactions/validate-consistency (reparado en backend H.4-ter). */
export interface StockConsistencyReport {
  product_id: string;
  product_name?: string;
  snapshot_stock: number;
  ledger_stock: number;
  discrepancy: number;
  is_consistent: boolean;
}

/** GET /stock-transactions/discrepancy-report (reparado en backend H.4-ter). */
export interface InventoryDiscrepancyReport {
  product_id: string;
  product_name?: string;
  [key: string]: unknown;
}

/** Payload de escritura para POST /stock-transactions/. */
export interface RegisterMovementPayload {
  product_id: string;
  variant_id?: number;
  transaction_type: TransactionType;
  quantity_change: number;
  unit_price?: number;
  reference_type?: ReferenceType;
  reference_id?: number | string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/** Categoría de motivo elegida en la UI (mapea a transaction_type/reference_type en domain). */
export type ReasonCategory =
  | 'INVENTORY_COUNT'
  | 'CORRECTION'
  | 'DAMAGE'
  | 'EXPIRY'
  | 'THEFT'
  | 'RETURN'
  | 'LOSS'
  | 'FOUND'
  | 'INITIAL_COUNT';
