// ===========================================================================
// useCounterOrderCheckout (PLAN_PEDIDOS_MOSTRADOR — FASE 3.2)
// Orquestación del pedido de mostrador dentro del wizard de /ventas:
//   - lista los pedidos activos del cliente seleccionado
//   - claim al continuar un pedido (409 si otra caja llegó primero)
//   - ítems → CartItems con flag isFromCounterOrder
//   - release si el operador sale sin procesar
//   - convert tras el cobro (idempotente por sale_id); si falla, toast
//     accionable "marcar como procesado" con reintento
// La lógica de carrito/merge vive en SalesNew y llega por callbacks
// (inversión: el hook no conoce el estado interno de la página).
// ===========================================================================

import { useCallback, useEffect, useRef } from 'react'
import { counterOrderService } from '@/services/counterOrderService'
import { useCounterOrderPreloadStore } from '@/store/useCounterOrderPreloadStore'
import type { CounterOrderDetail, CounterOrderSummary } from '../types'

/** CartItem mínimo que el hook le devuelve a la página. */
export interface CounterOrderCartItem {
  id: string
  productId: string
  variantId?: string | null
  variantName?: string
  name: string
  quantity: number
  price: number
  originalPrice: number
  discount: number
  discountType: 'amount' | 'percent'
  discountInput: number
  discountReason: string
  taxRate: number
  unit: string
  stock?: number
  isFromCounterOrder: boolean
  counterOrderId: string
  counterOrderCode: string
}

export type CounterOrderToastApi = {
  info: (message: string) => void
  error: (message: string) => void
  success: (message: string) => void
  addToast: (message: string, type?: string, duration?: number, actions?: Array<{ label: string; onClick: () => void }>) => void
}

export interface UseCounterOrderCheckoutOptions {
  toast: CounterOrderToastApi
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string
  /** Inserta CartItems en el carrito de la venta (SalesNew: setItems). */
  addItems: (items: CounterOrderCartItem[]) => void
  /** Activa modo merge hacia una venta pendiente (SalesNew: setCurrentSaleId + setActiveSale). */
  enterMergeMode?: (sale: unknown) => void
  /** Abre el wizard de checkout (precarga de la bandeja /pedidos). */
  openWizard?: () => void
  /** Selecciona el cliente del pedido precargado (SalesNew: handleSelectClient). */
  selectClient?: (client: { id: string; name: string }) => void | Promise<void>
  /** Pedido activo: habilita el paso 'pending' sin ventas pendientes. */
  enabled?: boolean
}

export function useCounterOrderCheckout(options: UseCounterOrderCheckoutOptions) {
  const { toast, t, addItems, enterMergeMode, openWizard, selectClient, enabled = true } = options
  const claimedOrderIdRef = useRef<string | null>(null)
  const claimedOrderCodeRef = useRef<string>('')

  const consumePreload = useCounterOrderPreloadStore(state => state.consumePreload)

  // ─── Mapa ítem resuelto → CartItem ────────────────────────────────────────
  const mapItems = useCallback(
    (detail: CounterOrderDetail): CounterOrderCartItem[] =>
      (detail.items ?? []).map((item, index) => ({
        id: `CO-${detail.id}-${item.product_id}-${item.variant_id || 'base'}-${index}`,
        productId: item.product_id,
        variantId: item.variant_id || null,
        name: item.product_name,
        quantity: item.quantity,
        // Resolve-on-read: el precio ya vino resuelto con el IVA vigente; el
        // definitivo lo fija pos-checkout (sin sales:apply_discount no hay
        // modificación posible).
        price: item.unit_price_with_tax,
        originalPrice: item.unit_price_with_tax,
        discount: 0,
        discountType: 'amount' as const,
        discountInput: 0,
        discountReason: '',
        taxRate: item.tax_rate || 0,
        unit: item.unit,
        stock: item.stock_available ?? undefined,
        isFromCounterOrder: true,
        counterOrderId: detail.id,
        counterOrderCode: detail.code,
      })),
    [],
  )

  // ─── Claim + carga al carrito ─────────────────────────────────────────────
  const continueOrder = useCallback(
    async (order: CounterOrderSummary, mergeSale?: unknown): Promise<boolean> => {
      try {
        const detail = await counterOrderService.claim(order.id)
        claimedOrderIdRef.current = detail.id
        claimedOrderCodeRef.current = detail.code
        addItems(mapItems(detail))
        if (mergeSale && enterMergeMode) enterMergeMode(mergeSale)
        toast.success(
          t('counterorders.checkout.loaded', 'Pedido {code} cargado ({count} ítems)', {
            code: detail.code,
            count: detail.items?.length ?? 0,
          }),
        )
        return true
      } catch (err) {
        // 409 anti doble-caja (§4.2): otra caja reclamó el pedido primero.
        toast.error((err as Error)?.message || t('counterorders.checkout.claim_error', 'No se pudo abrir el pedido en caja'))
        return false
      }
    },
    [addItems, enterMergeMode, mapItems, t, toast],
  )

  // ─── Release al salir sin procesar ────────────────────────────────────────
  const releaseClaimed = useCallback(async () => {
    const orderId = claimedOrderIdRef.current
    if (!orderId) return
    claimedOrderIdRef.current = null
    claimedOrderCodeRef.current = ''
    try {
      await counterOrderService.release(orderId)
    } catch {
      // Fail-open: el sweep de 20 minutos (§4.3) libera claims huérfanos.
    }
  }, [])

  // ─── Convert tras el cobro (idempotente por sale_id) ──────────────────────
  const convertAfterCheckout = useCallback(
    async (saleId: string) => {
      const orderId = claimedOrderIdRef.current
      if (!orderId || !saleId) return
      try {
        await counterOrderService.convert(orderId, saleId)
        claimedOrderIdRef.current = null
        claimedOrderCodeRef.current = ''
      } catch (err) {
        // La venta YA existe y está cobrada: no bloquear por el marcado.
        // Toast accionable con reintento (§7: "caja muere entre checkout y
        // convert → el pedido queda CLAIMED y se recupera con reintento").
        const retry = (): void => {
          counterOrderService
            .convert(orderId, saleId)
            .then(() => {
              claimedOrderIdRef.current = null
              claimedOrderCodeRef.current = ''
            })
            .catch(() => {
              toast.error(t('counterorders.checkout.convert_retry_failed', 'No se pudo marcar el pedido como procesado. Intentá de nuevo desde /pedidos.'))
            })
        }
        toast.addToast(
          t('counterorders.checkout.convert_failed', 'La venta se cobró, pero el pedido {code} quedó sin marcar como procesado.', {
            code: claimedOrderCodeRef.current,
          }),
          'warning',
          8000,
          [{ label: t('counterorders.checkout.convert_mark', 'Marcar como procesado'), onClick: retry }],
        )
        void err
      }
    },
    [t, toast],
  )

  const hasClaimedOrder = useCallback(() => claimedOrderIdRef.current !== null, [])

  // ─── Precarga desde la bandeja /pedidos (FASE 3.4) ────────────────────────
  // "Procesar en caja" ya reclamó el pedido: aquí solo se revalida (puede
  // haber vencido el claim o haberse liberado), se carga el carrito y se
  // abre el wizard con el cliente seleccionado.
  const resumePreload = useCallback(async () => {
    const preload = consumePreload()
    if (!preload) return
    try {
      let detail: CounterOrderDetail | null = null
      try {
        detail = await counterOrderService.getById(preload.orderId)
      } catch {
        detail = null
      }
      if (!detail || detail.status === 'CANCELLED' || detail.status === 'CONVERTED') {
        toast.info(
          t('counterorders.checkout.preload_gone', 'El pedido {code} ya no está disponible en caja.', {
            code: preload.code,
          }),
        )
        return
      }
      if (detail.status !== 'CLAIMED') {
        // El claim venció/se liberó en el camino: reclamar ahora.
        const ok = await continueOrder(
          {
            ...detail,
            item_count: detail.items?.length ?? 0,
          } as unknown as CounterOrderSummary,
          undefined,
        )
        if (!ok) return
      } else {
        claimedOrderIdRef.current = detail.id
        claimedOrderCodeRef.current = detail.code
        addItems(mapItems(detail))
      }
      if (selectClient) await selectClient({ id: preload.clientId, name: preload.clientName })
      openWizard?.()
    } catch (err) {
      toast.error((err as Error)?.message || t('counterorders.checkout.preload_error', 'No se pudo abrir el pedido en caja'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addItems, consumePreload, continueOrder, mapItems, openWizard, selectClient, t, toast])

  // Intenta la precarga UNA vez al montar (/ventas). El store arranca vacío
  // en navegación normal: el effect es un no-op ahí.
  useEffect(() => {
    if (!enabled) return
    void resumePreload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    continueOrder,
    releaseClaimed,
    convertAfterCheckout,
    hasClaimedOrder,
    resumePreload,
    /** Id del pedido reclamado (lectura puntual, no reactiva). */
    getClaimedOrderId: () => claimedOrderIdRef.current,
  }
}
