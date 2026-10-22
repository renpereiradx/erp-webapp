/**
 * Comparación de ventanas de compras (`GET /purchase-analytics/compare`).
 *
 * `period_1` es la ventana A y `period_2` la B; `differences` es `A − B` con
 * variaciones RELATIVAS (%), nunca puntos porcentuales. El `end_date` del
 * payload es exclusivo (límite de query): para mostrar el rango se resta un
 * día calendario.
 */
import type {
  DashboardPeriod,
  PurchaseComparison,
  PurchaseComparisonParams,
} from '@/types/bi'
import {
  addDays,
  isValidDateRange,
  isValidIsoDate,
  previousCalendarDay,
  toIsoDate,
} from './periods'
import { hasComparableBase } from '@/domain/sales-analytics/comparison'

export type PurchaseComparisonMode = 'period' | 'custom'

export type PurchaseComparisonMetricId =
  | 'purchases'
  | 'transactions'
  | 'units'
  | 'avgOrder'
  | 'suppliers'

export interface PurchaseComparisonMetricRow {
  id: PurchaseComparisonMetricId
  kind: 'money' | 'count' | 'units'
  /** Ventana A (period_1). */
  a: number
  /** Ventana B (period_2). */
  b: number
  /** A − B, en la unidad de la métrica. */
  change: number
  /** Variación relativa vs B (%), tal como la devuelve el BE. */
  changePct: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas de la comparativa, en orden de lectura fijo. */
export const buildPurchaseComparisonRows = (
  comparison: PurchaseComparison | null | undefined,
): PurchaseComparisonMetricRow[] => {
  if (!comparison) return []
  const a = comparison.period_1
  const b = comparison.period_2
  const diff = comparison.differences

  return [
    {
      id: 'purchases',
      kind: 'money',
      a: toNumber(a.total_purchases),
      b: toNumber(b.total_purchases),
      change: toNumber(diff.purchases_change),
      changePct: toNumber(diff.purchases_change_pct),
    },
    {
      id: 'transactions',
      kind: 'count',
      a: toNumber(a.total_transactions),
      b: toNumber(b.total_transactions),
      change: toNumber(diff.transactions_change),
      changePct: toNumber(diff.transactions_change_pct),
    },
    {
      id: 'units',
      kind: 'units',
      a: toNumber(a.total_units),
      b: toNumber(b.total_units),
      change: toNumber(diff.units_change),
      changePct: toNumber(diff.units_change_pct),
    },
    {
      id: 'avgOrder',
      kind: 'money',
      a: toNumber(a.average_order),
      b: toNumber(b.average_order),
      change: toNumber(diff.order_change),
      changePct: toNumber(diff.order_change_pct),
    },
    {
      id: 'suppliers',
      kind: 'count',
      a: toNumber(a.unique_suppliers),
      b: toNumber(b.unique_suppliers),
      change: toNumber(diff.suppliers_change),
      changePct: toNumber(diff.suppliers_change_pct),
    },
  ]
}

/** Sin compras en ninguna de las dos ventanas. */
export const isPurchaseComparisonEmpty = (
  comparison: PurchaseComparison | null | undefined,
): boolean => {
  if (!comparison) return true
  return [comparison.period_1, comparison.period_2].every(
    (period) =>
      toNumber(period.total_purchases) === 0 &&
      toNumber(period.total_transactions) === 0 &&
      toNumber(period.total_units) === 0,
  )
}

export interface PurchaseComparisonDraft {
  start1: string
  end1: string
  start2: string
  end2: string
}

/** Rangos iniciales del modo personalizado: A = últimos 30 días, B = 30 anteriores. */
export const defaultPurchaseComparisonDraft = (today: Date): PurchaseComparisonDraft => ({
  start1: toIsoDate(addDays(today, -29)),
  end1: toIsoDate(today),
  start2: toIsoDate(addDays(today, -59)),
  end2: toIsoDate(addDays(today, -30)),
})

export interface PurchaseComparisonDraftValidation {
  valid: boolean
  invalidFields: Array<keyof PurchaseComparisonDraft | 'range1' | 'range2'>
}

export const validatePurchaseComparisonDraft = (
  draft: PurchaseComparisonDraft,
): PurchaseComparisonDraftValidation => {
  const invalidFields: PurchaseComparisonDraftValidation['invalidFields'] = []
  if (!isValidIsoDate(draft.start1)) invalidFields.push('start1')
  if (!isValidIsoDate(draft.end1)) invalidFields.push('end1')
  if (!isValidIsoDate(draft.start2)) invalidFields.push('start2')
  if (!isValidIsoDate(draft.end2)) invalidFields.push('end2')

  if (
    !invalidFields.includes('start1') &&
    !invalidFields.includes('end1') &&
    !isValidDateRange(draft.start1, draft.end1)
  ) {
    invalidFields.push('range1')
  }
  if (
    !invalidFields.includes('start2') &&
    !invalidFields.includes('end2') &&
    !isValidDateRange(draft.start2, draft.end2)
  ) {
    invalidFields.push('range2')
  }
  return { valid: invalidFields.length === 0, invalidFields }
}

/** Params del endpoint según el modo (custom exige los 4 extremos). */
export const buildPurchaseComparisonParams = (
  mode: PurchaseComparisonMode,
  period: DashboardPeriod,
  draft: PurchaseComparisonDraft,
): PurchaseComparisonParams =>
  mode === 'custom'
    ? {
        start1: draft.start1,
        end1: draft.end1,
        start2: draft.start2,
        end2: draft.end2,
      }
    : { period }

/**
 * Rango mostrable de una ventana del payload: el `end_date` del BE es el
 * límite EXCLUSIVO de la query, así que se muestra el día anterior.
 */
export const describePurchaseComparisonRange = (
  period: { start_date: string; end_date: string } | null | undefined,
): { start: string; end: string } => {
  if (!period) return { start: '', end: '' }
  return {
    start: period.start_date,
    end: previousCalendarDay(period.end_date) ?? period.end_date,
  }
}

export { hasComparableBase }
