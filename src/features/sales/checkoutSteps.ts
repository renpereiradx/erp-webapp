/**
 * Composición de pasos del SaleCheckoutWizard (lógica pura, testeable).
 *
 * Orden fijo: Cliente → (Pendientes) → (Reservas) → Pago → Cobro.
 *
 * Reglas:
 * - 'pending' aparece si el cliente tiene ventas pendientes.
 * - 'reservations' aparece si hay reservas confirmadas pendientes de cargar
 *   o si hay un cliente seleccionado (permite registrar un uso walk-in de
 *   cancha sin salir del checkout). Se suprime cuando el carrito YA tiene un
 *   ítem con `reserve_id`: el backend admite una sola reserva por venta, así
 *   que con la reserva cargada el paso no aporta nada (y walk-in lo bloquea
 *   con toast). Sin reserva cargada el paso sigue visible (walk-in + selección
 *   normal de reservas funcionan igual que antes).
 * - 'payment' y 'collection' siempre cierran el flujo.
 */

export type CheckoutStepId = 'client' | 'pending' | 'reservations' | 'payment' | 'collection'

export interface CheckoutStepsInput {
  /** Cantidad de ventas pendientes del cliente. */
  activeSalesCount: number
  /** Cantidad de reservas confirmadas aún no cargadas al carrito. */
  pendingReservationsCount: number
  /** Hay cliente seleccionado (habilita walk-in dentro del paso Reservas). */
  hasClient: boolean
  /** El carrito ya contiene un ítem con reserve_id (una reserva por venta). */
  hasReserveInCart: boolean
}

export function computeCheckoutSteps(input: CheckoutStepsInput): CheckoutStepId[] {
  const list: CheckoutStepId[] = ['client']
  if (input.activeSalesCount > 0) list.push('pending')

  const reservationsVisible =
    (input.pendingReservationsCount > 0 || input.hasClient) && !input.hasReserveInCart
  if (reservationsVisible) list.push('reservations')

  list.push('payment', 'collection')
  return list
}
