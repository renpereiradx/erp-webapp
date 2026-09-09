/**
 * Tipos de pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR — FASE 2).
 *
 * El pedido es pre-venta: NO toca stock ni pagos. Los precios NO se
 * snapshot-ean — el backend los resuelve al leer (resolve-on-read §3.3),
 * así que los ítems persistidos llevan solo producto/variante/cantidad/
 * unidad y la lectura trae la línea resuelta (`ResolvedCounterOrderItem`).
 */

/** Estados del ciclo de vida (§3.2). */
export const COUNTER_ORDER_STATUSES = ['OPEN', 'CLAIMED', 'CONVERTED', 'CANCELLED', 'EXPIRED'] as const;
export type CounterOrderStatus = (typeof COUNTER_ORDER_STATUSES)[number];
export type CounterOrderStatusFilter = CounterOrderStatus | 'ALL';

export interface CounterOrder {
  id: string;
  code: string; // PED-XXXXXX
  client_id: string;
  branch_id: number;
  status: CounterOrderStatus;
  notes?: string | null;
  created_by: string;
  claimed_by?: string | null;
  claimed_at?: string | null;
  converted_sale_id?: string | null;
  converted_at?: string | null;
  cancelled_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Ítem persistido (sin precios). */
export interface CounterOrderItem {
  id: number;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit: string;
  notes?: string | null;
}

/** Payload de create/update (ítems sin resolver). */
export interface CounterOrderItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
}

export interface CreateCounterOrderPayload {
  client_id: string;
  items: CounterOrderItemInput[];
  notes?: string | null;
}

export interface UpdateCounterOrderPayload {
  items: CounterOrderItemInput[];
  notes?: string | null;
}

/** Línea resuelta al leer: precio vigente + IVA (misma resolución que la venta). */
export interface ResolvedLine {
  unit_price: number;
  tax_rate_id?: number | null;
  tax_rate_code: string;
  tax_rate: number;
  unit_price_with_tax: number;
  unit_price_without_tax: number;
  tax_amount: number;
  line_total: number;
}

export interface ResolvedCounterOrderItem extends CounterOrderItem, ResolvedLine {
  product_name: string;
  stock_available?: number | null;
  stock_warning: boolean;
  /**
   * Degradación por ítem (auditoría C2): la línea cuyo precio no se puede
   * resolver vuelve con el warning seteado, montos en cero y excluida del
   * total — en vez de tumbar la lectura completa. El texto lo provee el
   * backend (mismo criterio que los mensajes de error).
   */
  price_warning?: string | null;
  tax_warning?: string | null;
}

/** Lectura resuelta (GET / create / update / claim). */
export interface CounterOrderDetail extends CounterOrder {
  client_name: string;
  created_by_name: string;
  claimed_by_name?: string | null;
  items: ResolvedCounterOrderItem[];
  total: number;
}

/** Fila de la bandeja (GET lista). */
export interface CounterOrderSummary extends CounterOrder {
  client_name: string;
  created_by_name: string;
  claimed_by_name?: string | null;
  item_count: number;
  total: number;
}

/** Forma de la respuesta del backend: { data, pagination }. */
export interface CounterOrderListResponse {
  data: CounterOrderSummary[];
  pagination?: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  } | null;
}

/** Normaliza la respuesta del listado tolerando ausencia de pagination. */
export function extractCounterOrders(response: unknown): CounterOrderSummary[] {
  const res = response as { data?: CounterOrderSummary[] } | null;
  return res?.data ?? [];
}

/** Extrae el pedido de una respuesta de mutation (create/update/claim). */
export function extractCounterOrderDetail(response: unknown): CounterOrderDetail | null {
  const res = response as CounterOrderDetail | { data?: CounterOrderDetail } | null;
  if (!res) return null;
  if ('items' in (res as CounterOrderDetail)) return res as CounterOrderDetail;
  return (res as { data?: CounterOrderDetail }).data ?? null;
}
