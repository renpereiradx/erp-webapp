// ===========================================================================
// useCounterOrders (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1)
// Hooks de react-query para la bandeja /pedidos y el ciclo de vida del
// pedido: create/update (vendedor), claim/release/convert/cancel (caja).
// Toda mutación invalida ['counter-orders'] para refrescar bandeja y
// detalle con los precios re-resueltos (resolve-on-read).
// ===========================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { counterOrderService } from '@/services/counterOrderService'
import type { CounterOrderListParams } from '@/services/counterOrderService'
import type {
  CounterOrderDetail,
  CounterOrderStatusFilter,
  CreateCounterOrderPayload,
  UpdateCounterOrderPayload,
} from '../types'
import { extractCounterOrders } from '../types'

export const COUNTER_ORDERS_PAGE_SIZE = 20

export interface CounterOrdersQuery {
  status: CounterOrderStatusFilter
  search: string
  page: number
  /** undefined = filtrar por la sucursal activa (backend resuelve por header). */
  branchId?: number | null
  /** "ver todas": requiere branches:switch (el backend re-valida; sin el
   *  permiso el scope queda en la sucursal activa). */
  allBranches?: boolean
}

export function useCounterOrders(query: CounterOrdersQuery) {
  return useQuery({
    queryKey: ['counter-orders', query.status, query.search, query.page, query.branchId ?? null, query.allBranches ?? false],
    queryFn: async () => {
      const params: CounterOrderListParams = {
        page: query.page,
        page_size: COUNTER_ORDERS_PAGE_SIZE,
        ...(query.status !== 'ALL' ? { status: query.status } : {}),
        ...(query.search ? { q: query.search } : {}),
        // Audit A3: sin el flag explícito el backend siempre cae a la
        // sucursal activa del JWT y "ver todas" era un no-op.
        ...(query.allBranches
          ? { all_branches: 1 }
          : query.branchId
            ? { branch_id: query.branchId }
            : {}),
      }
      const response = await counterOrderService.list(params)
      return {
        orders: extractCounterOrders(response),
        pagination: response.pagination ?? null,
      }
    },
    placeholderData: previous => previous,
  })
}

export function useCounterOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['counter-orders', 'detail', orderId],
    queryFn: async (): Promise<CounterOrderDetail> => counterOrderService.getById(orderId!),
    enabled: orderId !== null,
  })
}

/**
 * Pedidos activos (OPEN/CLAIMED) de un cliente — paso del wizard de caja
 * (FASE 3.1). Una sola consulta sin status (el backend ordena por fecha y el
 * filtrado activo es en FE); staleTime corto porque el claim de otra caja
 * cambia el estado visible.
 */
export function useClientActiveCounterOrders(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['counter-orders', 'client-active', clientId ?? null],
    queryFn: async () => {
      const response = await counterOrderService.list({
        client_id: clientId!,
        page: 1,
        page_size: 20,
      })
      const all = extractCounterOrders(response)
      return all.filter(o => o.status === 'OPEN' || o.status === 'CLAIMED')
    },
    enabled: !!clientId,
    staleTime: 10_000,
  })
}

export function useCreateCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCounterOrderPayload) => counterOrderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}

export function useUpdateCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpdateCounterOrderPayload }) =>
      counterOrderService.update(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}

/** OPEN→CLAIMED. Devuelve el detalle resuelto para precargar el wizard. */
export function useClaimCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => counterOrderService.claim(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}

export function useReleaseCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => counterOrderService.release(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}

/** Enlaza la venta procesada (idempotente por sale_id). */
export function useConvertCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, saleId }: { orderId: string; saleId: string }) =>
      counterOrderService.convert(orderId, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}

export function useCancelCounterOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      counterOrderService.cancel(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-orders'] })
    },
  })
}
