/**
 * Validación pura de los filtros de los drill-downs relacionales.
 *
 * Las fechas viajan en el formato ISO `YYYY-MM-DD` que exige el BE
 * (`time.Parse("2006-01-02")`), así que el orden lexicográfico coincide con
 * el cronológico y no hace falta construir Date (evita corrimientos de zona).
 */

/** Un rango con "Desde" posterior a "Hasta" no se envía: el BE devolvería vacío. */
export const isInvalidDateRange = (dateFrom: string, dateTo: string): boolean =>
  Boolean(dateFrom) && Boolean(dateTo) && dateFrom > dateTo;

/** true si hay algún filtro aplicable (para habilitar "Limpiar"). */
export const hasActiveFilters = (filters: {
  q?: string;
  qDraft?: string;
  dateFrom?: string;
  dateTo?: string;
}): boolean =>
  Boolean(filters.q) ||
  Boolean(filters.qDraft) ||
  Boolean(filters.dateFrom) ||
  Boolean(filters.dateTo);
