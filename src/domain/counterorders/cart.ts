/**
 * Lógica de negocio pura del carrito de pedidos de mostrador
 * (PLAN_PEDIDOS_MOSTRADOR — FASE 2.1, useOrderCart).
 *
 * Sin React, sin efectos: operaciones inmutables sobre la lista de líneas.
 * El agrupamiento es por producto+variante (espejo de `addProductToCart`
 * de SalesNew); los precios no viven en el carrito — el backend los
 * resuelve al leer (resolve-on-read) y el guardado no los envía.
 */

import type { CounterOrderItemInput } from '@/features/counterorders/types';

/** Línea del carrito del vendedor. `key` identifica producto+variante. */
export interface OrderCartLine {
  key: string;
  product_id: string;
  variant_id?: string | null;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  /** Precio de referencia del catálogo (informativo; no se envía al backend). */
  price_hint?: number | null;
  stock_hint?: number | null;
}

export function lineKey(productId: string, variantId?: string | null): string {
  return `${productId}|${variantId ?? ''}`;
}

/** Agrega (o acumula cantidad de) una línea. Devuelve nueva lista. */
export function addLine(lines: OrderCartLine[], line: Omit<OrderCartLine, 'key'>): OrderCartLine[] {
  const key = lineKey(line.product_id, line.variant_id);
  const existing = lines.find(l => l.key === key);
  if (!existing) {
    return [...lines, { ...line, key }];
  }
  return lines.map(l => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l));
}

/** Quita una línea por key. */
export function removeLine(lines: OrderCartLine[], key: string): OrderCartLine[] {
  return lines.filter(l => l.key !== key);
}

/** Fija la cantidad de una línea; <=0 la elimina. */
export function setQuantity(lines: OrderCartLine[], key: string, quantity: number): OrderCartLine[] {
  if (quantity <= 0) return removeLine(lines, key);
  return lines.map(l => (l.key === key ? { ...l, quantity } : l));
}

/** Fija la nota de una línea. */
export function setLineNotes(lines: OrderCartLine[], key: string, notes: string): OrderCartLine[] {
  return lines.map(l => (l.key === key ? { ...l, notes: notes || null } : l));
}

/** Total de unidades del carrito (para el badge/guard). */
export function cartUnits(lines: OrderCartLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}

/** Ítems con stock aparente insuficiente (informativo, no bloquea: §5.2). */
export function shortStockLines(lines: OrderCartLine[]): OrderCartLine[] {
  return lines.filter(l => l.stock_hint != null && l.quantity > (l.stock_hint ?? 0));
}

/** Mapea el carrito al payload del backend (sin precios ni hints). */
export function toPayloadItems(lines: OrderCartLine[]): CounterOrderItemInput[] {
  return lines.map(l => ({
    product_id: l.product_id,
    variant_id: l.variant_id || null,
    quantity: l.quantity,
    unit: l.unit || null,
    notes: l.notes || null,
  }));
}

/** ¿Hay cambios sin guardar? (guard de salida del builder). */
export function isCartDirty(lines: OrderCartLine[]): boolean {
  return lines.length > 0;
}
