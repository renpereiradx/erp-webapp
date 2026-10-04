/**
 * walkInCart — reglas de carrito para el flujo walk-in de canchas
 * (PLAN_RESERVAS_V2 F5).
 *
 * El camino canónico para vender una cancha reservable es la reserva: si el
 * operador agregó la cancha como línea "pelada" (buscador de productos, sin
 * franja horaria) y después registra su uso desde el wizard, la línea pelada
 * se CONVIERTE en la línea con reserva (la autoritativa del backend) en vez
 * de duplicarse.
 */

export interface CartLineProductRef {
  productId: string;
  reserveId?: number;
  /** Ítem continuado de una venta pendiente: pertenece a esa venta, no se toca. */
  isFromPendingSale?: boolean;
}

/**
 * Reemplaza las líneas peladas del producto (sin reserva, no de venta
 * pendiente) por la línea con reserva del walk-in. Las líneas de otros
 * productos, las que ya tienen reserva y las de la venta pendiente
 * continuada se mantienen en su orden original.
 */
export function replacePlainCourtItem<T extends CartLineProductRef>(
  items: T[],
  reservedItem: T,
  productId: string,
): T[] {
  const kept = items.filter(
    (i) => !(i.productId === productId && !i.reserveId && !i.isFromPendingSale),
  );
  return [...kept, reservedItem];
}
