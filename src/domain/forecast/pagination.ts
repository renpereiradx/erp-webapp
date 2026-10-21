/**
 * Paginación client-side para tablas de Pronósticos que el BE devuelve
 * completas (serie mensual de ingresos y categorías de demanda). Las tablas
 * que el BE pagina (productos de inventario y top de demanda) usan la página
 * del servidor; acá solo se recorta lo que ya vino, sin fabricar totales.
 *
 * Regla del proyecto: 10 filas por página también en estas tablas (la
 * auditoría 2026-09 había marcado la tabla de ~18 meses sin paginación).
 */
export interface PageSlice<Row> {
  rows: Row[]
  page: number
  totalPages: number
  totalItems: number
}

export const paginateRows = <Row,>(
  rows: readonly Row[],
  page: number,
  pageSize: number,
): PageSlice<Row> => {
  const safeSize = Math.max(1, Math.trunc(pageSize))
  const totalItems = rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize))
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages)
  const start = (safePage - 1) * safeSize
  return {
    rows: rows.slice(start, start + safeSize),
    page: safePage,
    totalPages,
    totalItems,
  }
}
