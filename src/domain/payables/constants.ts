/**
 * Constantes de presentación de Cuentas por Pagar (F8).
 *
 * La regla del proyecto es ≤10 filas por página de tabla; el listado, el
 * reporte de antigüedad y las facturas de un proveedor la respetan. El límite
 * de proveedores es un top (el contrato devuelve un ranking, no un listado
 * paginado) y la ventana del calendario/flujo es la que acepta el BE (`days`).
 */

export const PAYABLES_PAGE_SIZE = 10

/** Filas del reporte de antigüedad por proveedor (paginado server-side). */
export const PAYABLES_AGING_PAGE_SIZE = 10

/** Top de proveedores del dashboard (snapshot a hoy). */
export const PAYABLES_TOP_SUPPLIERS_LIMIT = 5

/** Cuentas urgentes del dashboard (vencidas, por vencimiento más antiguo). */
export const PAYABLES_URGENT_LIMIT = 5

/** Ventana del calendario de pagos (días desde hoy). */
export const PAYABLES_SCHEDULE_DAYS = 30

/** Ventanas ofrecidas por la proyección de flujo de caja. */
export const PAYABLES_CASH_FLOW_DAYS = [30, 60, 90] as const

export const PAYABLES_CASH_FLOW_DEFAULT_DAYS = 30

export type PayablesCashFlowDays = (typeof PAYABLES_CASH_FLOW_DAYS)[number]

export const isPayablesCashFlowDays = (value: unknown): value is PayablesCashFlowDays =>
  typeof value === 'number' &&
  (PAYABLES_CASH_FLOW_DAYS as readonly number[]).includes(value)
