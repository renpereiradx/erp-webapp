/**
 * Borrador persistido (localStorage) del carrito de /compras.
 *
 * usePurchasesLogic escribe el snapshot acá en cada cambio (write-through) y lo
 * restaura al montar: el carrito sobrevive navegaciones internas, refresh y
 * cierre de pestaña, hasta que la orden se guarda o se descarta.
 *
 * Los terminales del cliente son compartidos (GUIDE_TERMINALES_LOCAL §4): el
 * borrador se scopea por operador y `getDraftFor` devuelve null cuando el dueño
 * es otro usuario, así un cambio de sesión nunca muestra carritos ajenos ni los
 * pisa al guardar.
 *
 * El snapshot lleva ítems + proveedor + notas juntos: sin el proveedor los
 * ítems restaurados no se pueden guardar (handleSavePurchase lo exige) y el
 * usuario tendría que re-seleccionarlo tras cada navegación. Las notas solas
 * (sin ítems ni proveedor) NO constituyen borrador: isEmpty las ignora.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PurchaseItem, PurchaseSupplier } from '@/features/purchases/types';

export interface PurchasesCartDraftData {
  items: PurchaseItem[];
  supplier: PurchaseSupplier | null;
  notes: string;
}

const isEmpty = (d: PurchasesCartDraftData): boolean =>
  d.items.length === 0 && d.supplier == null;

interface PurchasesCartDraftState {
  /** Operador dueño del borrador (user.id del auth store). */
  userId: string | null;
  data: PurchasesCartDraftData | null;
  /** Último guardado (ISO); informativo para la UI. */
  savedAt: string | null;
  /** Snapshot vacío limpia el borrador propio (no el de otro operador). */
  saveDraft: (userId: string, data: PurchasesCartDraftData) => void;
  /** Sin userId limpia siempre; con userId respeta la propiedad (terminales compartidas). */
  clearDraft: (userId?: string) => void;
  /** Snapshot del borrador SOLO si pertenece a userId; si no, null. */
  getDraftFor: (userId: string) => PurchasesCartDraftData | null;
}

export const usePurchasesCartDraftStore = create<PurchasesCartDraftState>()(
  devtools(
    persist(
      (set, get) => ({
        userId: null,
        data: null,
        savedAt: null,

        saveDraft: (userId, data) => {
          if (isEmpty(data)) {
            if (get().userId === userId) set({ userId: null, data: null, savedAt: null });
            return;
          }
          set({ userId, data, savedAt: new Date().toISOString() });
        },

        clearDraft: (userId) => {
          if (userId == null || get().userId === userId) {
            set({ userId: null, data: null, savedAt: null });
          }
        },

        getDraftFor: (userId) => {
          const s = get();
          return s.userId === userId ? s.data : null;
        },
      }),
      { name: 'purchases-cart-draft', version: 1 },
    ),
    { name: 'purchases-cart-draft-store' },
  ),
);
