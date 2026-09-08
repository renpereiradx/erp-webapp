// ===========================================================================
// useCounterOrderPreloadStore (PLAN_PEDIDOS_MOSTRADOR — FASE 2 CTA / 3.4)
// Puente bandeja /pedidos → wizard de /ventas: "Procesar en caja" reclama el
// pedido y precarga cliente+pedido aquí; SalesNew lo consume al montar y
// abre el wizard con los ítems.
// ===========================================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface CounterOrderPreload {
  orderId: string
  code: string
  clientId: string
  clientName: string
}

interface CounterOrderPreloadState {
  /** Pedido reclamado esperando ser consumido por /ventas; null = nada. */
  preload: CounterOrderPreload | null
  setPreload: (preload: CounterOrderPreload) => void
  /** Consume (lee y limpia) la precarga pendiente. */
  consumePreload: () => CounterOrderPreload | null
  clearPreload: () => void
}

export const useCounterOrderPreloadStore = create<CounterOrderPreloadState>()(
  devtools(
    (set, get) => ({
      preload: null,
      setPreload: preload => set({ preload }, false, 'counterOrderPreload/set'),
      consumePreload: () => {
        const current = get().preload
        if (current) set({ preload: null }, false, 'counterOrderPreload/consume')
        return current
      },
      clearPreload: () => set({ preload: null }, false, 'counterOrderPreload/clear'),
    }),
    { name: 'CounterOrderPreloadStore' },
  ),
)
