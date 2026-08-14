/**
 * Servicio HTTP del feature Stock Movements.
 *
 * ÚNICO cliente de stock del frontend. Habla exclusivamente con `/stock-transactions/*`
 * (el ledger endurecido `products.stock_transactions`, fuente de verdad de trazabilidad).
 * No consume `/manual_adjustment/*`, `/inventory/*` ni `PUT /stock/*` (este último eliminado
 * del backend en el hardening H.2).
 *
 * Convención del repo: `apiClient.get/post` devuelven el dato directamente (no `{data}`).
 * Los errores 4xx/5xx lanzan; se normalizan con `toApiError`.
 *
 * IMPORTANTE: no se envía `branch_id` en la escritura; el backend lo resuelve del JWT
 * y rechaza con 403 BRANCH_MISMATCH si el body discrepa.
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

export const stockMovementsService = {
  /** POST /stock-transactions/ → 201 StockTransaction */
  async registerMovement(payload: RegisterMovementPayload): Promise<StockTransaction> {
    try {
      return await apiClient.post(ENDPOINTS.transactions, payload);
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
      return Array.isArray(result) ? result : [];
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el historial del producto');
    }
  },

  /** GET /stock-transactions/{id} */
  async getMovementById(id: number | string): Promise<StockTransactionHistory> {
    try {
      return await apiClient.get(`${ENDPOINTS.transactions}${id}`);
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
      return Array.isArray(result) ? result : [];
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
      return Array.isArray(result) ? result : [];
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
      return Array.isArray(result) ? result : [];
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
      return Array.isArray(result) ? result : [];
    } catch (error: any) {
      throw toApiError(error, 'Error al obtener el reporte de discrepancias');
    }
  },
};
