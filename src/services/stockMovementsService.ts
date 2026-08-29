/**
 * Servicio HTTP del feature Stock Movements.
 *
 * ÚNICO cliente de stock del frontend. Habla exclusivamente con `/stock-transactions/*`
 * (el ledger endurecido `products.stock_transactions`, fuente de verdad de trazabilidad).
 * No consume `/manual_adjustment/*`, `/inventory/*` ni `PUT /stock/*`.
 *
 * El backend hexagonado emite los objetos con nombres PascalCase (sin json tags: ID,
 * ProductID, QuantityChange, TransactionDate, ProductName...), mientras que el contrato
 * del frontend usa snake_case (id, product_id, quantity_change, created_at...). TODA
 * respuesta pasa por un normalizador defensivo (lee ambas formas) para que la página
 * siempre reciba el shape snake_case esperado.
 *
 * Convención del repo: `apiClient.get/post` devuelven el dato directamente (no `{data}`).
 * Los errores 4xx/5xx lanzan; se normalizan con `toApiError`.
 */

import { apiClient } from '@/services/api';
import { toApiError } from '@/utils/ApiError';
import type {
  InventoryDiscrepancyReport,
  RegisterMovementPayload,
  StockConsistencyReport,
  StockMovementSummary,
  StockTransaction,
  StockTransactionHistory,
  TransactionType,
} from '@/features/stock-movements/types';

const ENDPOINTS = {
  transactions: '/stock-transactions/',
  byProduct: '/stock-transactions/product',
  byDate: '/stock-transactions/by-date',
  types: '/stock-transactions/types',
  movementSummary: '/stock-transactions/movement-summary',
  validateConsistency: '/stock-transactions/validate-consistency',
  discrepancyReport: '/stock-transactions/discrepancy-report',
} as const;

type AnyRecord = Record<string, any>;

/** Devuelve el primer valor definido entre las claves candidatas (snake_case | PascalCase). */
function pick(obj: AnyRecord | null | undefined, keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

/** Garantiza que el operator (nombre de usuario) llegue siempre en `metadata.operator`. */
function normalizeMetadata(raw: any, operator?: string): Record<string, unknown> | null {
  let meta: Record<string, unknown> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    meta = { ...(raw as Record<string, unknown>) };
  }
  const op = pick(meta as AnyRecord, ['operator', 'user_name']) ?? operator;
  if (op) meta.operator = op;
  return Object.keys(meta).length ? meta : null;
}

/** Normaliza una transacción (registro o fila de historial) al shape snake_case del FE. */
function normalizeTransaction(raw: AnyRecord): StockTransactionHistory {
  const transactionDate =
    pick(raw, ['created_at', 'transaction_date', 'TransactionDate']) ?? null;
  const operatorName = pick(raw, ['user_name', 'UserName']) ?? null;
  return {
    id: pick(raw, ['id', 'ID']) ?? 0,
    product_id: pick(raw, ['product_id', 'ProductID']) ?? '',
    variant_id: pick(raw, ['variant_id', 'VariantID']) ?? null,
    branch_id: Number(pick(raw, ['branch_id', 'BranchID']) ?? 0),
    transaction_type: (pick(raw, ['transaction_type', 'TransactionType']) ?? 'ADJUSTMENT') as TransactionType,
    quantity_change: Number(pick(raw, ['quantity_change', 'QuantityChange']) ?? 0),
    quantity_before: Number(pick(raw, ['quantity_before', 'QuantityBefore']) ?? 0),
    quantity_after: Number(pick(raw, ['quantity_after', 'QuantityAfter']) ?? 0),
    balance_after: Number(pick(raw, ['balance_after', 'quantity_after', 'QuantityAfter'])),
    unit_price: pick(raw, ['unit_price', 'UnitPrice']) ?? null,
    reference_type: pick(raw, ['reference_type', 'ReferenceType']) ?? null,
    reference_id: pick(raw, ['reference_id', 'ReferenceID']) ?? null,
    reason: pick(raw, ['reason', 'Reason']) ?? null,
    user_id: pick(raw, ['user_id', 'UserID']) ?? '',
    metadata: normalizeMetadata(
      pick(raw, ['metadata', 'Metadata']),
      operatorName ?? pick(raw, ['user_name', 'UserName']),
    ),
    created_at: transactionDate ?? '',
    transaction_date: transactionDate ?? undefined,
    product_name: pick(raw, ['product_name', 'ProductName']),
    variant_name: pick(raw, ['variant_name', 'VariantName']),
    user_name: operatorName ?? undefined,
  };
}

function normalizeTransactionList(list: any): StockTransactionHistory[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeTransaction);
}

/** Normaliza una fila de movement-summary al shape snake_case del FE. */
function normalizeSummary(raw: AnyRecord): StockMovementSummary {
  const totalIn = Number(pick(raw, ['total_in', 'TotalIn', 'TotalPurchases']) ?? 0);
  const totalOut = Number(pick(raw, ['total_out', 'TotalOut', 'TotalSales']) ?? 0);
  return {
    product_id: pick(raw, ['product_id', 'ProductID']) ?? '',
    product_name: pick(raw, ['product_name', 'ProductName']),
    initial_stock: Number(pick(raw, ['initial_stock', 'InitialStock']) ?? 0),
    final_stock: Number(pick(raw, ['final_stock', 'FinalStock']) ?? 0),
    total_in: Math.abs(totalIn),
    total_out: Math.abs(totalOut),
    net_change: Number(pick(raw, ['net_change', 'NetChange']) ?? 0),
  };
}

/** Normaliza una fila de validate-consistency. */
function normalizeConsistency(raw: AnyRecord): StockConsistencyReport {
  return {
    product_id: pick(raw, ['product_id', 'ProductID']) ?? '',
    product_name: pick(raw, ['product_name', 'ProductName']),
    snapshot_stock: Number(pick(raw, ['snapshot_stock', 'CurrentStock']) ?? 0),
    ledger_stock: Number(pick(raw, ['ledger_stock', 'CalculatedStock']) ?? 0),
    discrepancy: Number(pick(raw, ['discrepancy', 'Difference']) ?? 0),
    is_consistent: Boolean(pick(raw, ['is_consistent', 'IsConsistent']) ?? false),
  };
}

/** Normaliza una fila de discrepancy-report. */
function normalizeDiscrepancy(raw: AnyRecord): InventoryDiscrepancyReport {
  return {
    product_id: pick(raw, ['product_id', 'ProductID']) ?? '',
    product_name: pick(raw, ['product_name', 'ProductName']),
    ...raw,
  };
}

export const stockMovementsService = {
  /**
   * POST /stock-transactions/ → 201 StockTransaction | StockTransaction[]
   * Acepta un payload único (devuelve un objeto) o un array (devuelve un array).
   * El backend refleja la forma de entrada.
   */
  async registerMovement(
    payloadOrList: RegisterMovementPayload | RegisterMovementPayload[],
  ): Promise<StockTransaction | StockTransaction[]> {
    try {
      if (Array.isArray(payloadOrList)) {
        const result = await apiClient.post(ENDPOINTS.transactions, payloadOrList);
        return Array.isArray(result) ? result.map(normalizeTransaction) : [];
      }
      const result = await apiClient.post(ENDPOINTS.transactions, payloadOrList);
      return normalizeTransaction(result);
    } catch (error: any) {
      throw toApiError(error, 'Error al registrar el movimiento de stock');
    }
  },

  /** GET /stock-transactions/product/{product_id}?limit=&offset= */
  async getProductHistory(
    productId: string,
    limit = 50,
    offset = 0,
  ): Promise<StockTransactionHistory[]> {
    try {
      const result = await apiClient.get(`${ENDPOINTS.byProduct}/${productId}`, {
        params: { limit, offset },
      });
      return normalizeTransactionList(result);
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el historial del producto');
    }
  },

  /** GET /stock-transactions/{id} */
  async getMovementById(id: number | string): Promise<StockTransactionHistory> {
    try {
      const result = await apiClient.get(`${ENDPOINTS.transactions}${id}`);
      return normalizeTransaction(result);
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el movimiento');
    }
  },

  /** GET /stock-transactions/by-date?start_date=&end_date=&type=&limit=&offset= */
  async getMovementsByDate(params: {
    startDate: string;
    endDate: string;
    transactionType?: TransactionType;
    limit?: number;
    offset?: number;
  }): Promise<StockTransactionHistory[]> {
    try {
      const result = await apiClient.get(ENDPOINTS.byDate, {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          ...(params.transactionType ? { type: params.transactionType } : {}),
          limit: params.limit ?? 50,
          offset: params.offset ?? 0,
        },
      });
      return normalizeTransactionList(result);
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener movimientos por fecha');
    }
  },

  /** GET /stock-transactions/types → { PURCHASE: 'Compra', ... } */
  async getTransactionTypes(): Promise<Record<string, string>> {
    try {
      const result = await apiClient.get(ENDPOINTS.types);
      return (result ?? {}) as Record<string, string>;
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener tipos de transacción');
    }
  },

  /** GET /stock-transactions/movement-summary?start_date=&end_date=&product_id= */
  async getMovementSummary(params: {
    startDate: string;
    endDate: string;
    productId?: string;
  }): Promise<StockMovementSummary[]> {
    try {
      const result = await apiClient.get(ENDPOINTS.movementSummary, {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          ...(params.productId ? { product_id: params.productId } : {}),
        },
      });
      return Array.isArray(result) ? result.map(normalizeSummary) : [];
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el resumen de movimientos');
    }
  },

  /** GET /stock-transactions/validate-consistency?product_id= */
  async validateConsistency(productId?: string): Promise<StockConsistencyReport[]> {
    try {
      const result = await apiClient.get(ENDPOINTS.validateConsistency, {
        params: productId ? { product_id: productId } : {},
      });
      return Array.isArray(result) ? result.map(normalizeConsistency) : [];
    } catch (error: any) {
      throw toApiError(error, 'Error al validar la consistencia de stock');
    }
  },

  /** GET /stock-transactions/discrepancy-report?date_from=&date_to= */
  async getDiscrepancyReport(dateFrom: string, dateTo: string): Promise<InventoryDiscrepancyReport[]> {
    try {
      const result = await apiClient.get(ENDPOINTS.discrepancyReport, {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      return Array.isArray(result) ? result.map(normalizeDiscrepancy) : [];
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el reporte de discrepancias');
    }
  },

  // Normalizadores expuestos para tests.
  __normalizeTransaction: normalizeTransaction,
  __normalizeSummary: normalizeSummary,
};
