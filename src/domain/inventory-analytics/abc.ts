/**
 * Clasificación ABC de inventario (F5).
 *
 * Contrato real: `/inventory-analytics/abc` clasifica por **ventas** del
 * período (80 % acumulado = A, 95 % = B, resto C). Los valores `class_*_value`
 * son ventas, no valor de inventario: la UI lo rotula "Ventas" y no re-deriva
 * montos desde el total. `ABCProduct.sku` es el id del producto y
 * `turnover_rate` viaja en 0 (el SELECT no lo calcula): no se muestran.
 */
import type { ABCAnalysis, ABCProduct, ABCSummary } from '@/types/bi'

export type AbcClass = 'A' | 'B' | 'C'

export const ABC_CLASSES: readonly AbcClass[] = ['A', 'B', 'C']

export interface AbcClassRow {
  class: AbcClass
  count: number
  /** Ventas del período acumuladas por la clase. */
  value: number
  percentage: number
}

const toNumber = (value: unknown): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas A/B/C con los campos del `summary` (sin reconstruir montos). */
export const buildAbcClassRows = (summary: ABCSummary | null | undefined): AbcClassRow[] => {
  if (!summary) return []
  return [
    {
      class: 'A',
      count: toNumber(summary.class_a_count),
      value: toNumber(summary.class_a_value),
      percentage: toNumber(summary.class_a_value_pct),
    },
    {
      class: 'B',
      count: toNumber(summary.class_b_count),
      value: toNumber(summary.class_b_value),
      percentage: toNumber(summary.class_b_value_pct),
    },
    {
      class: 'C',
      count: toNumber(summary.class_c_count),
      value: toNumber(summary.class_c_value),
      percentage: toNumber(summary.class_c_value_pct),
    },
  ]
}

/** Productos de una clase, sin `null` de Go y con la clase validada. */
export const abcProductsForClass = (
  analysis: ABCAnalysis | null | undefined,
  abcClass: AbcClass,
): ABCProduct[] => {
  if (!analysis) return []
  const rows =
    abcClass === 'A'
      ? analysis.class_a
      : abcClass === 'B'
        ? analysis.class_b
        : analysis.class_c
  return Array.isArray(rows) ? rows : []
}

/** Código de clase del BE normalizado; cualquier otro valor cae a C. */
export const abcClassFromCode = (code: string | null | undefined): AbcClass => {
  if (code === 'A' || code === 'B') return code
  return 'C'
}

export const isAbcClass = (value: unknown): value is AbcClass =>
  value === 'A' || value === 'B' || value === 'C'
