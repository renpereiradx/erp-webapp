/**
 * Borrador persistido (localStorage) del carrito de /ventas (POS).
 *
 * SalesNew escribe el snapshot acá en cada cambio (write-through) y lo restaura
 * al montar: el carrito sobrevive navegaciones internas, refresh y cierre de
 * pestaña, hasta que la venta se cobra/deja pendiente o se descarta.
 *
 * Los terminales del cliente son compartidos (GUIDE_TERMINALES_LOCAL §4): el
 * borrador se scopea por operador y `getDraftFor` devuelve null cuando el dueño
 * es otro usuario, así un cambio de sesión nunca muestra carritos ajenos ni los
 * pisa al guardar.
 *
 * El snapshot es COHERENTE (ítems + cliente + venta en merge): restaurar ítems
 * de una venta pendiente continuada sin su saleId los re-facturaría en una
 * venta NUEVA (doble cobro) — viajan siempre juntos.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CartItem, Client } from '@/features/sales/types/cart';

export interface SalesCartDraftData {
  items: CartItem[];
  client: Client | null;
  /** Venta pendiente continuada (modo merge); null = venta nueva. */
  saleId: string | null;
  /** Sucursal de esa venta (activeSale.branch_id) para addProductsToSale. */
  saleBranchId: number | null;
}

const isEmpty = (d: SalesCartDraftData): boolean =>
  d.items.length === 0 && d.client == null && d.saleId == null;

interface SalesCartDraftState {
  /** Operador dueño del borrador (user.id del auth store). */
  userId: string | null;
  data: SalesCartDraftData | null;
  /** Último guardado (ISO); informativo para la UI. */
  savedAt: string | null;
  /** Snapshot vacío limpia el borrador propio (no el de otro operador). */
  saveDraft: (userId: string, data: SalesCartDraftData) => void;
  /** Sin userId limpia siempre; con userId respeta la propiedad (terminales compartidas). */
  clearDraft: (userId?: string) => void;
  /** Snapshot del borrador SOLO si pertenece a userId; si no, null. */
  getDraftFor: (userId: string) => SalesCartDraftData | null;
}

export const useSalesCartDraftStore = create<SalesCartDraftState>()(
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
      { name: 'sales-cart-draft', version: 1 },
    ),
    { name: 'sales-cart-draft-store' },
  ),
);
