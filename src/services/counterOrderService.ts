// ===========================================================================
// counterOrderService (PLAN_PEDIDOS_MOSTRADOR — FASE 2.2)
// Cliente HTTP de pedidos de mostrador: el vendedor guarda el carrito, la
// caja lo reclama (claim) y lo procesa (convert) con el wizard de /ventas.
// ===========================================================================

import { apiClient } from './api';
import { API_ENDPOINTS } from '../types';
import type {
  CounterOrderDetail,
  CounterOrderListResponse,
  CreateCounterOrderPayload,
  UpdateCounterOrderPayload,
} from '@/features/counterorders/types';

export interface CounterOrderListParams {
  status?: string;
  client_id?: string;
  branch_id?: number;
  q?: string;
  page?: number;
  page_size?: number;
}

/**
 * Los handlers de listado devuelven { data, pagination }; las operaciones
 * de detalle (create/update/claim) devuelven el pedido resuelto directo.
 */
export const counterOrderService = {
  /** Bandeja de pedidos (ejecuta el sweep de claims stale server-side). */
  async list(params: CounterOrderListParams = {}): Promise<CounterOrderListResponse> {
    return apiClient.get(API_ENDPOINTS.COUNTER_ORDERS, { params }) as Promise<CounterOrderListResponse>;
  },

  /** Detalle con precios/IVA/stock resueltos al leer (resolve-on-read). */
  async getById(id: string): Promise<CounterOrderDetail> {
    return apiClient.get(API_ENDPOINTS.COUNTER_ORDER_BY_ID(id)) as Promise<CounterOrderDetail>;
  },

  /** Crea el pedido OPEN del vendedor; devuelve el detalle resuelto. */
  async create(payload: CreateCounterOrderPayload): Promise<CounterOrderDetail> {
    return apiClient.post(API_ENDPOINTS.COUNTER_ORDERS, payload) as Promise<CounterOrderDetail>;
  },

  /** Replace-all de ítems + notas (solo OPEN sin claim). */
  async update(id: string, payload: UpdateCounterOrderPayload): Promise<CounterOrderDetail> {
    return apiClient.put(API_ENDPOINTS.COUNTER_ORDER_BY_ID(id), payload) as Promise<CounterOrderDetail>;
  },

  /** OPEN→CLAIMED (409 con el estado actual si otro lo abrió antes). */
  async claim(id: string): Promise<CounterOrderDetail> {
    return apiClient.post(API_ENDPOINTS.COUNTER_ORDER_CLAIM(id), {}) as Promise<CounterOrderDetail>;
  },

  /** CLAIMED→OPEN (quien clamó, o admin). */
  async release(id: string): Promise<{ message: string }> {
    return apiClient.post(API_ENDPOINTS.COUNTER_ORDER_RELEASE(id), {}) as Promise<{ message: string }>;
  },

  /** Enlaza la venta procesada (idempotente por sale_id). */
  async convert(id: string, saleId: string): Promise<{ message: string }> {
    return apiClient.post(API_ENDPOINTS.COUNTER_ORDER_CONVERT(id), { sale_id: saleId }) as Promise<{ message: string }>;
  },

  /** Cancelación con motivo obligatorio. */
  async cancel(id: string, reason: string): Promise<{ message: string }> {
    return apiClient.post(API_ENDPOINTS.COUNTER_ORDER_CANCEL(id), { reason }) as Promise<{ message: string }>;
  },
};

export default counterOrderService;
