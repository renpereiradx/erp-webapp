/**
 * Constantes de presentación de las tablas de Analítica de Ventas.
 * La regla del proyecto es ≤10 filas por página (PLAN_ALINEACION_BI cierre):
 * el pager es server-side y el BE acepta page/page_size.
 */

/** Filas por página de las tablas paginadas (productos, clientes, vendedores). */
export const SALES_PAGE_SIZE = 10

/** Filas por página del reporte de descuentos. */
export const SALES_DISCOUNTS_PAGE_SIZE = 10

/** Límite de los rankings de productos (top/bottom/margen/volumen). */
export const SALES_RANK_LIMIT = 5
