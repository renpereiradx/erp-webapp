/**
 * Comparación de períodos (`GET /sales-analytics/compare`).
 *
 * `period_1` es el período A y `period_2` el B; `differences` es `A − B`.
 * Las variaciones son porcentajes RELATIVOS de cada métrica, no puntos
 * porcentuales: la pantalla vieja rotulaba el delta del margen como "pp" y
 * quedaba contradictorio (auditoría 2026-09).
 */
import type { DashboardPeriod, SalesComparison, SalesComparisonParams } from '@/types/bi'
import { addDays, isValidDateRange, isValidIsoDate, previousCalendarDay, toIsoDate } from './periods'

export type ComparisonMode = 'period' | 'custom'

export type ComparisonMetricId =
  | 'sales'
  | 'transactions'
  | 'units'
  | 'ticket'
  | 'customers'
  | 'margin'

export interface ComparisonMetricRow {
  id: ComparisonMetricId
  kind: 'money' | 'count' | 'units'
  /** Período A (period_1). */
  a: number
  /** Período B (period_2). */
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

/** Filas de la tabla comparativa, en orden de lectura fijo. */
export const buildComparisonRows = (
  comparison: SalesComparison | null | undefined,
): ComparisonMetricRow[] => {
  if (!comparison) return []
  const a = comparison.period_1
  const b = comparison.period_2
  const diff = comparison.differences

  return [
    {
      id: 'sales',
      kind: 'money',
      a: toNumber(a.total_sales),
      b: toNumber(b.total_sales),
      change: toNumber(diff.sales_change),
      changePct: toNumber(diff.sales_change_pct),
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
      id: 'ticket',
      kind: 'money',
      a: toNumber(a.average_ticket),
      b: toNumber(b.average_ticket),
      change: toNumber(diff.ticket_change),
      changePct: toNumber(diff.ticket_change_pct),
    },
    {
      id: 'customers',
      kind: 'count',
      a: toNumber(a.unique_customers),
      b: toNumber(b.unique_customers),
      change: toNumber(diff.customers_change),
      changePct: toNumber(diff.customers_change_pct),
    },
    {
      id: 'margin',
      kind: 'money',
      a: toNumber(a.gross_margin),
      b: toNumber(b.gross_margin),
      change: toNumber(diff.margin_change),
      changePct: toNumber(diff.margin_change_pct),
    },
  ]
}

/** Sin ventas ni actividad en ninguno de los dos períodos. */
export const isComparisonEmpty = (comparison: SalesComparison | null | undefined): boolean => {
  if (!comparison) return true
  const periods = [comparison.period_1, comparison.period_2]
  return periods.every(
    (period) =>
      toNumber(period.total_sales) === 0 &&
      toNumber(period.total_transactions) === 0 &&
      toNumber(period.total_units) === 0 &&
      toNumber(period.unique_customers) === 0,
  )
}

export interface ComparisonDraft {
  start1: string
  end1: string
  start2: string
  end2: string
}

/** Rangos iniciales del modo personalizado: A = últimos 30 días, B = 30 anteriores. */
export const defaultComparisonDraft = (today: Date): ComparisonDraft => ({
  start1: toIsoDate(addDays(today, -29)),
  end1: toIsoDate(today),
  start2: toIsoDate(addDays(today, -59)),
  end2: toIsoDate(addDays(today, -30)),
})

export interface ComparisonDraftValidation {
  valid: boolean
  /** Campos inválidos, en el orden del formulario. */
  invalidFields: Array<keyof ComparisonDraft | 'range1' | 'range2'>
}

export const validateComparisonDraft = (draft: ComparisonDraft): ComparisonDraftValidation => {
  const invalidFields: ComparisonDraftValidation['invalidFields'] = []
  if (!isValidIsoDate(draft.start1)) invalidFields.push('start1')
  if (!isValidIsoDate(draft.end1)) invalidFields.push('end1')
  if (!isValidIsoDate(draft.start2)) invalidFields.push('start2')
  if (!isValidIsoDate(draft.end2)) invalidFields.push('end2')

  if (!invalidFields.includes('start1') && !invalidFields.includes('end1') && !isValidDateRange(draft.start1, draft.end1)) {
    invalidFields.push('range1')
  }
  if (!invalidFields.includes('start2') && !invalidFields.includes('end2') && !isValidDateRange(draft.start2, draft.end2)) {
    invalidFields.push('range2')
  }
  return { valid: invalidFields.length === 0, invalidFields }
}

/** Params del endpoint según el modo. */
export const buildComparisonParams = (
  mode: ComparisonMode,
  period: DashboardPeriod,
  draft: ComparisonDraft,
): SalesComparisonParams =>
  mode === 'custom'
    ? {
        start1: draft.start1,
        end1: draft.end1,
        start2: draft.start2,
        end2: draft.end2,
      }
    : { period }

/**
 * Los `period.start_date/end_date` de `/compare` son límites de query: el
 * `end_date` es EXCLUSIVO (día siguiente al último incluido). Para mostrar el
 * rango se resta un día de calendario.
 */
export const describeComparisonRange = (
  period: { start_date: string; end_date: string } | null | undefined,
): { start: string; end: string } => {
  if (!period) return { start: '', end: '' }
  return {
    start: period.start_date,
    end: previousCalendarDay(period.end_date) ?? period.end_date,
  }
}

/**
 * `false` cuando el período B no tuvo base (pct 0 con cambio distinto de 0):
 * mostrar "0%" ahí sería inventar una comparación.
 */
export const hasComparableBase = (
  change: number | null | undefined,
  changePct: number | null | undefined,
): boolean => {
  const numericChange = Number(change)
  const numericPct = Number(changePct)
  if (!Number.isFinite(numericChange) || !Number.isFinite(numericPct)) return false
  return !(numericPct === 0 && numericChange !== 0)
}
