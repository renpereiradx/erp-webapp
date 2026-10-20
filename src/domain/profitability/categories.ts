/**
 * Categorías rentables (F6).
 *
 * El endpoint devuelve TODAS las categorías del período, ordenadas por
 * beneficio. `contribution_pct` es una copia de `profit_share` (mismo número):
 * se muestra una sola vez. `average_markup` puede ser enorme (costo ínfimo),
 * pero es real; se rotula como recargo sobre costo.
 */
import type {
  CategoryProfitabilityReport,
  CategoryProfitabilityRow,
} from '@/types/bi'
import { toNumberOrNull } from './format'

export const categoryRows = (
  rows: CategoryProfitabilityRow[] | null | undefined,
): CategoryProfitabilityRow[] => (Array.isArray(rows) ? rows : [])

/**
 * Participación de la categoría en el beneficio. Si el total no es positivo,
 * el BE devuelve 0 en todas: se muestra `—` en vez de "0,0 %".
 */
export const categoryShareAvailable = (
  totalProfit: number | null | undefined,
): boolean => (toNumberOrNull(totalProfit) ?? 0) > 0

/** Mejor/peor categoría por beneficio real (las filas ya vienen ordenadas). */
export interface CategoryExtremes {
  best: CategoryProfitabilityRow | null
  worst: CategoryProfitabilityRow | null
  hasMultiple: boolean
}

export const categoryExtremes = (
  report: CategoryProfitabilityReport | null | undefined,
): CategoryExtremes => {
  const rows = categoryRows(report?.categories)
  if (rows.length === 0) return { best: null, worst: null, hasMultiple: false }
  return {
    best: rows[0],
    worst: rows.length > 1 ? rows[rows.length - 1] : null,
    hasMultiple: rows.length > 1,
  }
}
