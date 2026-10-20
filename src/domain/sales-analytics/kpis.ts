/**
 * Derivaciones de KPIs de ventas a partir de
 * `GET /sales-analytics/performance?compare=true`.
 *
 * El payload de `/sales-analytics/dashboard` trae `*_growth_pct` pero el
 * repositorio NO los calcula (viajan en 0): mostrarlos producía los chips
 * "+0%" que la auditoría 2026-09 marcó como falsos. El único crecimiento real
 * es el de `performance.comparison`, contra la ventana previa equivalente.
 */
import type { SalesPerformance } from '@/types/bi'

export type SalesKpiId = 'sales' | 'transactions' | 'ticket' | 'units' | 'customers' | 'margin'

export interface TrendView {
  direction: 'up' | 'down' | 'stable'
  /** Variación relativa (%) del BE, redondeada en presentación. */
  percentage: number
  /** Cambio absoluto en la unidad de la métrica. */
  change: number
}

export interface SalesKpiRow {
  id: SalesKpiId
  kind: 'money' | 'count' | 'units' | 'percent'
  value: number
  /** En `margin`: utilidad bruta en moneda base, para el hint. */
  secondaryMoney?: number
  /** `null` cuando no hay base comparable o el dato no vino. */
  trend: TrendView | null
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Dirección y porcentaje de una variación. Cuando el período previo no tuvo
 * base (`pct === 0` con cambio distinto de cero) devuelve `null` en vez de un
 * "+0%" engañoso.
 */
export const buildTrendView = (
  change: number | null | undefined,
  percentage: number | null | undefined,
): TrendView | null => {
  const numericChange = Number(change)
  const numericPct = Number(percentage)
  if (!Number.isFinite(numericChange) || !Number.isFinite(numericPct)) return null
  if (numericPct === 0 && numericChange !== 0) return null
  const direction = numericPct > 0 ? 'up' : numericPct < 0 ? 'down' : 'stable'
  return { direction, percentage: numericPct, change: numericChange }
}

/** Filas del ledger de KPIs, en orden de lectura fijo. */
export const buildSalesKpiRows = (performance: SalesPerformance | null | undefined): SalesKpiRow[] => {
  if (!performance) return []
  const comparison = performance.comparison

  return [
    {
      id: 'sales',
      kind: 'money',
      value: toNumber(performance.total_sales),
      trend: buildTrendView(comparison?.sales_change, comparison?.sales_change_pct),
    },
    {
      id: 'transactions',
      kind: 'count',
      value: toNumber(performance.total_transactions),
      trend: buildTrendView(
        comparison?.transactions_change,
        comparison?.transactions_change_pct,
      ),
    },
    {
      id: 'ticket',
      kind: 'money',
      value: toNumber(performance.average_ticket),
      trend: buildTrendView(comparison?.ticket_change, comparison?.ticket_change_pct),
    },
    {
      id: 'units',
      kind: 'units',
      value: toNumber(performance.total_units),
      trend: null,
    },
    {
      id: 'customers',
      kind: 'count',
      value: toNumber(performance.unique_customers),
      trend: null,
    },
    {
      id: 'margin',
      kind: 'percent',
      value: toNumber(performance.gross_margin_pct),
      secondaryMoney: toNumber(performance.gross_margin),
      trend: null,
    },
  ]
}
