/**
 * Reabastecimiento (F5).
 *
 * El endpoint reparte los productos en `urgent_reorders` (URGENT/HIGH) y
 * `soon_reorders` (MEDIUM/LOW), ya ordenados por prioridad y días hasta
 * quiebre. `days_until_stockout = 999` es el centinela de "sin ventas en 30
 * días" y no debe mostrarse como 999 días.
 *
 * `estimated_cost` puede ser 0 con productos pendientes cuando el costo
 * unitario no está cargado: la UI muestra `—` y explica el motivo, nunca un
 * "Gs. 0" que parezca que reponer es gratis.
 */
import type { ReorderAnalysis, ReorderProduct, ReorderSummary } from '@/types/bi'
import { toNumberOrNull } from './format'

export type ReorderPriorityKey = 'urgent' | 'high' | 'medium' | 'low'
export type ReorderTone = 'error' | 'warning' | 'primary' | 'secondary'

export const REORDER_PRIORITY_SENTINEL = 999

export const reorderPriorityKey = (priority: string | null | undefined): ReorderPriorityKey => {
  switch (priority) {
    case 'URGENT':
      return 'urgent'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'low'
  }
}

export const reorderPriorityTone = (priority: string | null | undefined): ReorderTone => {
  switch (reorderPriorityKey(priority)) {
    case 'urgent':
      return 'error'
    case 'high':
      return 'warning'
    case 'medium':
      return 'primary'
    default:
      return 'secondary'
  }
}

/** Días hasta quiebre reales; `null` cuando no hubo ventas en 30 días. */
export const realDaysUntilStockout = (value: number | null | undefined): number | null => {
  const numeric = toNumberOrNull(value)
  // 0 = quiebre inmediato (stock 0 con demanda), un dato real; 999 = sin ventas.
  if (numeric === null || numeric >= REORDER_PRIORITY_SENTINEL) return null
  return numeric
}

const toArray = <T,>(rows: T[] | null | undefined): T[] => (Array.isArray(rows) ? rows : [])

export interface ReorderSummaryView {
  total: number
  urgent: number
  soon: number
  /** `null` cuando hay pendientes pero el reporte no tiene costo unitario. */
  estimatedCost: number | null
  hasMissingCost: boolean
}

export const buildReorderSummary = (
  summary: ReorderSummary | null | undefined,
): ReorderSummaryView => {
  const total = toNumberOrNull(summary?.total_needing_reorder) ?? 0
  const estimatedCost = toNumberOrNull(summary?.estimated_cost) ?? 0
  const hasMissingCost = total > 0 && estimatedCost === 0
  return {
    total,
    urgent: toNumberOrNull(summary?.urgent_count) ?? 0,
    soon: toNumberOrNull(summary?.soon_count) ?? 0,
    estimatedCost: hasMissingCost ? null : estimatedCost,
    hasMissingCost,
  }
}

/** Urgentes primero y luego próximos; el BE ya ordena dentro de cada grupo. */
export const reorderRows = (analysis: ReorderAnalysis | null | undefined): ReorderProduct[] => {
  if (!analysis) return []
  return [...toArray(analysis.urgent_reorders), ...toArray(analysis.soon_reorders)]
}
