/**
 * Rotación por categoría/producto (F5).
 *
 * `days_of_inventory <= 0` significa que el costo de ventas del período fue 0
 * (el CASE del SQL devuelve 0, no infinito): la UI muestra `—`, no "0 días".
 * El `performance` (EXCELLENT/GOOD/AVERAGE/POOR) sí viene calculado por el BE
 * con sus umbrales (4x/2x/1x); la UI solo lo traduce.
 */
import type { CategoryTurnover, ProductTurnover } from '@/types/bi'
import { toNumberOrNull } from './format'

export type TurnoverPerformanceKey = 'excellent' | 'good' | 'average' | 'poor' | 'unknown'
export type TurnoverTone = 'success' | 'primary' | 'warning' | 'error' | 'secondary'

export const turnoverPerformanceKey = (
  performance: string | null | undefined,
): TurnoverPerformanceKey => {
  switch (performance) {
    case 'EXCELLENT':
      return 'excellent'
    case 'GOOD':
      return 'good'
    case 'AVERAGE':
      return 'average'
    case 'POOR':
      return 'poor'
    default:
      return 'unknown'
  }
}

export const turnoverPerformanceTone = (
  performance: string | null | undefined,
): TurnoverTone => {
  switch (turnoverPerformanceKey(performance)) {
    case 'excellent':
      return 'success'
    case 'good':
      return 'primary'
    case 'average':
      return 'warning'
    case 'poor':
      return 'error'
    default:
      return 'secondary'
  }
}

/** Días de inventario utilizables; `null` cuando no hubo costo de ventas. */
export const usableTurnoverDays = (value: number | null | undefined): number | null => {
  const numeric = toNumberOrNull(value)
  if (numeric === null || numeric <= 0) return null
  return numeric
}

/** Filas de categoría del payload, sin `null` de Go. */
export const turnoverCategoryRows = (
  rows: CategoryTurnover[] | null | undefined,
): CategoryTurnover[] => (Array.isArray(rows) ? rows : [])

/** Filas de producto del payload, sin `null` de Go. */
export const turnoverProductRows = (
  rows: ProductTurnover[] | null | undefined,
): ProductTurnover[] => (Array.isArray(rows) ? rows : [])
