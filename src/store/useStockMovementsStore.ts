/**
 * Store global (Zustand) del feature Stock Movements.
 * Reemplaza a los viejos `useInventoryStore` + `useInventoryManagementStore`.
 *
 * Orquesta el service `stockMovementsService` (que habla sólo con `/stock-transactions/*`).
 * Los errores del service se propagan lanzando; aquí se capturan y se exponen en `error`
 * para que la UI los muestre, y se relanzan para que el hook pueda reaccionar.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { stockMovementsService } from '@/services/stockMovementsService';
import type {
  InventoryDiscrepancyReport,
  RegisterMovementPayload,
  StockConsistencyReport,
  StockMovementSummary,
  StockTransaction,
  StockTransactionHistory,
  TransactionType,
} from '@/features/stock-movements/types';

interface StockMovementsState {
  // datos
  history: StockTransactionHistory[];
  dateMovements: StockTransactionHistory[];
  summary: StockMovementSummary[];
  consistency: StockConsistencyReport[];
  discrepancies: InventoryDiscrepancyReport[];
  transactionTypes: Record<string, string>;
  lastRegistered: StockTransaction | null;

  // estado de UI
  loading: boolean;
  error: string | null;

  // acciones
  registerMovement: (payload: RegisterMovementPayload) => Promise<StockTransaction>;
  fetchHistory: (productId: string, limit?: number, offset?: number) => Promise<void>;
  fetchByDate: (params: {
    startDate: string;
    endDate: string;
    transactionType?: TransactionType;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchSummary: (startDate: string, endDate: string, productId?: string) => Promise<void>;
  fetchConsistency: (productId?: string) => Promise<void>;
  fetchDiscrepancies: (dateFrom: string, dateTo: string) => Promise<void>;
  fetchTransactionTypes: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  history: [],
  dateMovements: [],
  summary: [],
  consistency: [],
  discrepancies: [],
  transactionTypes: {},
  lastRegistered: null,
  loading: false,
  error: null,
};

export const useStockMovementsStore = create<StockMovementsState>()(
  devtools(
    (set) => ({
      ...initialState,

      registerMovement: async (payload) => {
        set({ loading: true, error: null });
        try {
          const tx = await stockMovementsService.registerMovement(payload);
          set({ loading: false, lastRegistered: tx });
          return tx;
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'register_failed' });
          throw e;
        }
      },

      fetchHistory: async (productId, limit = 50, offset = 0) => {
        set({ loading: true, error: null });
        try {
          const history = await stockMovementsService.getProductHistory(productId, limit, offset);
          set({ history, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'fetch_failed' });
        }
      },

      fetchByDate: async (params) => {
        set({ loading: true, error: null });
        try {
          const dateMovements = await stockMovementsService.getMovementsByDate(params);
          set({ dateMovements, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'fetch_failed' });
        }
      },

      fetchSummary: async (startDate, endDate, productId) => {
        set({ loading: true, error: null });
        try {
          const summary = await stockMovementsService.getMovementSummary({
            startDate,
            endDate,
            productId,
          });
          set({ summary, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'fetch_failed' });
        }
      },

      fetchConsistency: async (productId) => {
        set({ loading: true, error: null });
        try {
          const consistency = await stockMovementsService.validateConsistency(productId);
          set({ consistency, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'fetch_failed' });
        }
      },

      fetchDiscrepancies: async (dateFrom, dateTo) => {
        set({ loading: true, error: null });
        try {
          const discrepancies = await stockMovementsService.getDiscrepancyReport(dateFrom, dateTo);
          set({ discrepancies, loading: false });
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'fetch_failed' });
        }
      },

      fetchTransactionTypes: async () => {
        try {
          const transactionTypes = await stockMovementsService.getTransactionTypes();
          set({ transactionTypes });
        } catch (e: any) {
          // no crítico: la UI tiene fallback con claves i18n
          set({ error: e?.message ?? 'fetch_failed' });
        }
      },

      clearError: () => set({ error: null }),
      reset: () => set({ ...initialState }),
    }),
    { name: 'stock-movements-store' },
  ),
);
