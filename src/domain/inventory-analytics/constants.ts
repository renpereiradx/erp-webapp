/**
 * Constantes de presentación de Analítica de Inventario (F5).
 * La regla del proyecto es ≤10 filas por página; en las tablas server-side el
 * pager usa `page_size=10` y en las client-side (ABC, stock muerto) se corta
 * la lista ya cargada.
 */

export const INVENTORY_PAGE_SIZE = 10

export const INVENTORY_ABC_PAGE_SIZE = 10

export const INVENTORY_DEAD_STOCK_PAGE_SIZE = 10

/** Top de movers y reposición que muestra el dashboard (el BE ya limita a 5). */
export const INVENTORY_DASHBOARD_ROWS = 5
