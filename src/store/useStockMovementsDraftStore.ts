/**
 * Borrador persistido (localStorage) de la cola de ajustes de /movimientos-stock.
 *
 * El MovementForm escribe la cola aquí en cada cambio (write-through) y la restaura
 * al montar: el trabajo sobrevive a navegaciones internas, refresh y cierre de
 * pestaña, hasta que se registra o se descarta explícitamente.
 *
 * Los terminales del cliente son compartidos (GUIDE_TERMINALES_LOCAL §4): el borrador
 * se scopea por operador y `getDraftFor` devuelve [] cuando el dueño es otro usuario,
 * así un cambio de sesión nunca muestra filas ajenas ni las pisa al guardar.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { MovementRowUI } from '@/features/stock-movements/types';

interface StockMovementsDraftState {
  /** Operador dueño del borrador (user.id del auth store). */
  userId: string | null;
  rows: MovementRowUI[];
  /** Último guardado (ISO); informativo para la UI. */
  savedAt: string | null;
  /** Cola vacía limpia el borrador propio (no el de otro operador). */
  saveDraft: (userId: string, rows: MovementRowUI[]) => void;
  /** Sin userId limpia siempre; con userId respeta la propiedad (terminales compartidas). */
  clearDraft: (userId?: string) => void;
  /** Filas del borrador SOLO si pertenece a userId; si no, vacío. */
  getDraftFor: (userId: string) => MovementRowUI[];
}

export const useStockMovementsDraftStore = create<StockMovementsDraftState>()(
  devtools(
    persist(
      (set, get) => ({
        userId: null,
        rows: [],
        savedAt: null,

        saveDraft: (userId, rows) => {
          if (rows.length === 0) {
            if (get().userId === userId) set({ userId: null, rows: [], savedAt: null });
            return;
          }
          set({ userId, rows, savedAt: new Date().toISOString() });
        },

        clearDraft: (userId) => {
          if (userId == null || get().userId === userId) {
            set({ userId: null, rows: [], savedAt: null });
          }
        },

        getDraftFor: (userId) => {
          const s = get();
          return s.userId === userId ? s.rows : [];
        },
      }),
      { name: 'stock-movements-draft', version: 1 },
    ),
    { name: 'stock-movements-draft-store' },
  ),
);
