/**
 * Hook orquestador del feature Stock Movements.
 * Une: store (Zustand) + lógica de dominio (Zod/delta) + identidad del operador.
 *
 * La búsqueda de productos y carga de variantes vive en el componente MovementForm (estado local),
 * porque es estado de UI efímero. Aquí sólo la lógica de envío y lectura del ledger.
 *
 * registerBatch admite 1..N filas: valida cada una con Zod, construye los payloads (delta +
 * metadata) y los envía en un único POST (el backend acepta un item o un array).
 */

import { useCallback } from 'react';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import useAuthStore from '@/store/useAuthStore';
import {
  buildPayloadFromForm,
  movementFormSchema,
  type MovementFormValues,
} from '@/domain/stock/movements';
import type { StockTransaction } from '@/features/stock-movements/types';

export interface MovementRow {
  form: MovementFormValues;
  currentStock: number;
}

export function useStockMovements() {
  const store = useStockMovementsStore();

  // El operador se toma del store de auth (user.id). Si no hay sesión, fallback explícito.
  const user = useAuthStore((s) => s.user);
  const operator = user?.id || user?.user_id || 'frontend_operator';

  /**
   * Valida cada fila con Zod, construye los payloads (delta + metadata) y los envía
   * en un único POST. Relanza el error para que la UI lo muestre; tras el éxito
   * refresca el historial de cada producto afectado.
   */
  const registerBatch = useCallback(
    async (rows: MovementRow[]): Promise<StockTransaction[]> => {
      const payloads = rows.map(({ form, currentStock }) => {
        const parsed = movementFormSchema.parse(form);
        return buildPayloadFromForm(parsed, currentStock, operator);
      });
      const created = (await store.registerMovement(payloads)) as StockTransaction[];
      const productIds = [...new Set(payloads.map((p) => p.product_id))];
      for (const id of productIds) {
        // refresca historial del producto recién ajustado (no bloquea el return)
        void store.fetchHistory(id, 50, 0);
      }
      return created;
    },
    [operator, store],
  );

  return {
    operator,
    registerBatch,
    loading: store.loading,
    error: store.error,
    lastRegistered: store.lastRegistered,
    history: store.history,
    dateMovements: store.dateMovements,
    summary: store.summary,
    consistency: store.consistency,
    discrepancies: store.discrepancies,
    transactionTypes: store.transactionTypes,
    fetchHistory: store.fetchHistory,
    fetchByDate: store.fetchByDate,
    fetchSummary: store.fetchSummary,
    fetchConsistency: store.fetchConsistency,
    fetchDiscrepancies: store.fetchDiscrepancies,
    fetchTransactionTypes: store.fetchTransactionTypes,
    clearError: store.clearError,
  };
}

export type UseStockMovements = ReturnType<typeof useStockMovements>;
export type { MovementFormValues } from '@/domain/stock/movements';
export type { TransactionType } from '@/features/stock-movements/types';
