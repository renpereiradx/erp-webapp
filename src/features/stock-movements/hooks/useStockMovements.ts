/**
 * Hook orquestador del feature Stock Movements.
 * Une: store (Zustand) + lógica de dominio (Zod/delta) + identidad del operador.
 *
 * La búsqueda de productos y carga de variantes vive en el componente MovementForm (estado local),
 * porque es estado de UI efímero. Aquí sólo la lógica de envío y lectura del ledger.
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

export function useStockMovements() {
  const store = useStockMovementsStore();

  // El operador se toma del store de auth (user.id). Si no hay sesión, fallback explícito.
  const user = useAuthStore((s) => s.user);
  const operator = user?.id || user?.user_id || 'frontend_operator';

  /**
   * Valida el form con Zod, construye el payload (delta + metadata) y lo envía.
   * Relanza el error para que la UI lo muestre; también refresca el historial del producto.
   */
  const register = useCallback(
    async (
      form: MovementFormValues,
      currentStock: number,
    ): Promise<StockTransaction> => {
      const parsed = movementFormSchema.parse(form);
      const payload = buildPayloadFromForm(parsed, currentStock, operator);
      const tx = await store.registerMovement(payload);
      // refresca historial del producto recién ajustado (no bloquea el return)
      void store.fetchHistory(parsed.product_id, 50, 0);
      return tx;
    },
    [operator, store],
  );

  return {
    operator,
    register,
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
