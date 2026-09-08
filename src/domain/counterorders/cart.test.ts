// Tests de la lógica pura del carrito de pedidos (PLAN_PEDIDOS_MOSTRADOR).
// Ubicación canónica: junto al módulo en src/domain (PLAN_TEST_DESIGN §1).

import { describe, expect, it } from 'vitest'
import {
  addLine,
  cartUnits,
  isCartDirty,
  lineKey,
  removeLine,
  setLineNotes,
  setQuantity,
  shortStockLines,
  toPayloadItems,
  type OrderCartLine,
} from './cart'

const baseLine = (overrides: Partial<OrderCartLine> = {}): Omit<OrderCartLine, 'key'> => ({
  product_id: 'P1',
  variant_id: null,
  name: 'Producto 1',
  quantity: 1,
  unit: 'unit',
  ...overrides,
})

describe('cart domain', () => {
  it('lineKey agrupa por producto+variante', () => {
    expect(lineKey('P1', 'V1')).toBe('P1|V1')
    expect(lineKey('P1', null)).toBe('P1|')
    expect(lineKey('P1')).toBe('P1|')
  })

  it('addLine acumula cantidad de la misma línea producto+variante', () => {
    const lines = addLine([], baseLine())
    const again = addLine(lines, baseLine({ quantity: 2 }))
    expect(again).toHaveLength(1)
    expect(again[0].quantity).toBe(3)
  })

  it('addLine separa variantes distintas del mismo producto', () => {
    let lines = addLine([], baseLine({ variant_id: 'V1' }))
    lines = addLine(lines, baseLine({ variant_id: 'V2' }))
    expect(lines).toHaveLength(2)
  })

  it('addLine no muta la lista original', () => {
    const original = addLine([], baseLine())
    const next = addLine(original, baseLine())
    expect(original[0].quantity).toBe(1)
    expect(next[0].quantity).toBe(2)
  })

  it('removeLine quita por key', () => {
    const lines = addLine([], baseLine())
    expect(removeLine(lines, lines[0].key)).toHaveLength(0)
  })

  it('setQuantity elimina la línea con cantidad <= 0', () => {
    const lines = addLine([], baseLine({ quantity: 2 }))
    expect(setQuantity(lines, lines[0].key, 0)).toHaveLength(0)
    expect(setQuantity(lines, lines[0].key, -1)).toHaveLength(0)
    expect(setQuantity(lines, lines[0].key, 5)[0].quantity).toBe(5)
  })

  it('setLineNotes fija o limpia la nota', () => {
    const lines = addLine([], baseLine())
    const key = lines[0].key
    expect(setLineNotes(lines, key, 'sin azúcar')[0].notes).toBe('sin azúcar')
    expect(setLineNotes(lines, key, '')[0].notes).toBeNull()
  })

  it('cartUnits suma unidades totales', () => {
    let lines = addLine([], baseLine({ quantity: 2 }))
    lines = addLine(lines, baseLine({ product_id: 'P2', quantity: 3 }))
    expect(cartUnits(lines)).toBe(5)
  })

  it('shortStockLines marca solo las que exceden el hint de stock', () => {
    const lines: OrderCartLine[] = [
      { ...baseLine({ quantity: 5, stock_hint: 2 }), key: 'P1|' },
      { ...baseLine({ product_id: 'P2', quantity: 1, stock_hint: 10 }), key: 'P2|' },
      { ...baseLine({ product_id: 'P3', quantity: 9, stock_hint: null }), key: 'P3|' },
    ]
    expect(shortStockLines(lines)).toHaveLength(1)
    expect(shortStockLines(lines)[0].product_id).toBe('P1')
  })

  it('toPayloadItems mapea al contrato del backend sin hints', () => {
    const lines: OrderCartLine[] = [
      { ...baseLine({ variant_id: 'V1', notes: 'n', price_hint: 100, stock_hint: 1 }), key: 'P1|V1' },
    ]
    expect(toPayloadItems(lines)).toEqual([
      { product_id: 'P1', variant_id: 'V1', quantity: 1, unit: 'unit', notes: 'n' },
    ])
  })

  it('isCartDirty refleja líneas pendientes', () => {
    expect(isCartDirty([])).toBe(false)
    expect(isCartDirty([{ ...baseLine(), key: 'P1|' }])).toBe(true)
  })
})
