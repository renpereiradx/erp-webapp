// ===========================================================================
// useOrderCart (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1)
// Estado local del carrito del vendedor. La lógica pura (agrupar, sumar,
// payload) vive en @/domain/counterorders/cart; este hook solo orquesta el
// estado + selecciona cliente.
// ===========================================================================

import { useCallback, useMemo, useState } from 'react'
import {
  addLine,
  removeLine,
  setLineNotes,
  setQuantity,
  shortStockLines,
  toPayloadItems,
  cartUnits,
} from '@/domain/counterorders/cart'
import type { OrderCartLine } from '@/domain/counterorders/cart'
import type { CounterOrderItemInput } from '../types'

export interface SelectedClient {
  id: string
  name: string
}

export interface AddToCartInput {
  productId: string
  name: string
  quantity?: number
  variantId?: string | null
  unit?: string | null
  notes?: string | null
  priceHint?: number | null
  stockHint?: number | null
}

export function useOrderCart() {
  const [lines, setLines] = useState<OrderCartLine[]>([])
  const [client, setClient] = useState<SelectedClient | null>(null)
  const [notes, setNotes] = useState('')

  const addProduct = useCallback((input: AddToCartInput) => {
    setLines(prev =>
      addLine(prev, {
        product_id: input.productId,
        variant_id: input.variantId ?? null,
        name: input.name,
        quantity: input.quantity ?? 1,
        unit: input.unit || 'unit',
        notes: input.notes ?? null,
        price_hint: input.priceHint ?? null,
        stock_hint: input.stockHint ?? null,
      }),
    )
  }, [])

  const removeProduct = useCallback((key: string) => {
    setLines(prev => removeLine(prev, key))
  }, [])

  const changeQuantity = useCallback((key: string, quantity: number) => {
    setLines(prev => setQuantity(prev, key, quantity))
  }, [])

  const changeLineNotes = useCallback((key: string, notes: string) => {
    setLines(prev => setLineNotes(prev, key, notes))
  }, [])

  const clear = useCallback(() => {
    setLines([])
    setClient(null)
    setNotes('')
  }, [])

  const units = useMemo(() => cartUnits(lines), [lines])
  const lowStock = useMemo(() => shortStockLines(lines), [lines])

  const toPayloadItemsFn = useCallback(
    (): CounterOrderItemInput[] => toPayloadItems(lines),
    [lines],
  )

  // Objeto estable: los consumidores pueden depender de `cart` en sus
  // propios useCallback sin invalidarlos en cada render (rerender-memo).
  return useMemo(
    () => ({
      lines,
      client,
      setClient,
      notes,
      setNotes,
      units,
      lowStock,
      addProduct,
      removeProduct,
      changeQuantity,
      changeLineNotes,
      clear,
      toPayloadItems: toPayloadItemsFn,
    }),
    [
      lines,
      client,
      notes,
      units,
      lowStock,
      addProduct,
      removeProduct,
      changeQuantity,
      changeLineNotes,
      clear,
      toPayloadItemsFn,
    ],
  )
}
