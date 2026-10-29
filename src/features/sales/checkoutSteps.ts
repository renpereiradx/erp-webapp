/**
 * Composición de pasos del SaleCheckoutWizard (lógica pura, testeable).
 *
 * Orden fijo: Cliente → (Pendientes) → (Reservas) → Pago → Cobro.
 *
 * Reglas:
 * - 'pending' aparece si el cliente tiene ventas pendientes o pedidos de
 *   mostrador (PLAN_PEDIDOS_MOSTRADOR: el paso pasa a listar ambos).
 * - 'reservations' requiere que el módulo de reservas esté ACTIVO para el
 *   negocio (business_settings, fail-open: false ⇒ nunca visible) y, además,
 *   que haya reservas confirmadas pendientes de cargar o un cliente
 *   seleccionado (permite registrar un uso walk-in de cancha sin salir del
 *   checkout). Permite N reservas por venta: el paso sigue visible mientras
 *   queden reservas sin cargar.
 * - 'payment' y 'collection' siempre cierran el flujo.
 */

export type CheckoutStepId = 'client' | 'pending' | 'reservations' | 'payment' | 'collection'

export interface CheckoutStepsInput {
  /** Módulo de reservas activo para el negocio (business_settings). */
  reservationsEnabled: boolean
  /** Cantidad de ventas pendientes del cliente. */
  activeSalesCount: number
  /** Cantidad de pedidos de mostrador activos del cliente (PLAN_PEDIDOS_MOSTRADOR). */
  counterOrdersCount: number
  /** Cantidad de reservas confirmadas aún no cargadas al carrito. */
  pendingReservationsCount: number
  /** Hay cliente seleccionado (habilita walk-in dentro del paso Reservas). */
  hasClient: boolean
}

export function computeCheckoutSteps(input: CheckoutStepsInput): CheckoutStepId[] {
  const list: CheckoutStepId[] = ['client']
  if (input.activeSalesCount > 0 || input.counterOrdersCount > 0) list.push('pending')

  if (input.reservationsEnabled && (input.pendingReservationsCount > 0 || input.hasClient)) {
    list.push('reservations')
  }

  list.push('payment', 'collection')
  return list
}
