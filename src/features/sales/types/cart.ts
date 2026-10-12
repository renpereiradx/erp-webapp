/**
 * Tipos del carrito de ventas (POS /ventas). Viven acá — y no dentro de
 * SalesNew.tsx — porque el borrador persistido (useSalesCartDraftStore)
 * serializa estas mismas formas a localStorage: una sola fuente para la
 * página y el store.
 */

import type { SearchableDropdownItem } from '@/components/ui/SearchableDropdown';

export interface CartItem {
  id: string;
  productId: string;
  /** SKU de la unidad vendible (variante o producto base). */
  sku?: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  stock?: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountInput: number;
  discountReason: string;
  taxRate: number;
  unit: string;
  isFromPendingSale?: boolean;
  detailId?: string;
  reserve_id?: number; // ID numerico de la reserva si aplica
  variantId?: string | null;
  variantName?: string;
  // Ítem cargado desde un pedido de mostrador (PLAN_PEDIDOS_MOSTRADOR FASE 3):
  // se marca para poder liberarlo del carrito si el pedido se libera.
  isFromCounterOrder?: boolean;
  counterOrderId?: string;
  counterOrderCode?: string;
}

export interface Client extends SearchableDropdownItem {
  id: string;
  name: string;
  lastName?: string;
  displayName?: string;
  document_id?: string;
  email?: string;
}
