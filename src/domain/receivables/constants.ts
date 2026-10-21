/**
 * Constantes de Cuentas por Cobrar (F7).
 *
 * Paginación server-side: 10 filas por página es la regla del proyecto
 * (F4/F5/F6). El BE acepta `page`/`page_size` (cap 100).
 */

export const RECEIVABLES_PAGE_SIZE = 10

/** Cuentas recientes del dashboard (subconjunto de la primera página). */
export const RECEIVABLES_RECENT_LIMIT = 5

/** Top de deudores del dashboard (el BE limita a 100). */
export const RECEIVABLES_TOP_DEBTORS_LIMIT = 5
