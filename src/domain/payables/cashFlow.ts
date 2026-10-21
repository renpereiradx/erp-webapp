/**
 * Proyección de flujo de caja (F8).
 *
 * `GET /payables/cash-flow?days=N` devuelve una serie DIARIA (incluye días sin
 * movimiento, con 0/0) y los totales de la ventana. `expected_inflows` son las
 * cuentas por COBRAR pendientes que vencen en la ventana y `expected_outflows`
 * las cuentas por PAGAR pendientes: no son saldos bancarios ni movimientos
 * reales de caja.
 *
 * La cobertura no viene calculada en este endpoint (sí en
 * `/payment-capacity`, que no se consume): se deriva con la misma fórmula y
 * umbrales del BE (80 / 100). Sin pagos esperados no hay ratio: `null`, nunca
 * un `0 %` que parezca una cobertura nula.
 */
import type { CashFlowProjection, CashFlowProjectionDay } from '@/types/bi'
import { isMissingDate, toNumberOrNull } from './format'

export interface CashFlowDayRow extends CashFlowProjectionDay {
  date: string
}

const daysOf = (projection: CashFlowProjection | null | undefined): CashFlowProjectionDay[] =>
  Array.isArray(projection?.projection_days) ? projection.projection_days : []

/** Serie completa ordenada por fecha (los días sin movimiento también). */
export const cashFlowDays = (
  projection: CashFlowProjection | null | undefined,
): CashFlowDayRow[] =>
  daysOf(projection)
    .filter((day) => !isMissingDate(day.date))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

/** Solo días con movimiento: la tabla omite las columnas de ceros. */
export const cashFlowMovementDays = (
  projection: CashFlowProjection | null | undefined,
): CashFlowDayRow[] =>
  cashFlowDays(projection).filter(
    (day) => Number(day.inflows ?? 0) !== 0 || Number(day.outflows ?? 0) !== 0,
  )

/**
 * Cobertura = cobros esperados / pagos esperados (100 = justo). `null` cuando
 * no hay pagos esperados: el BE devuelve 0 en ese caso, que no es una tasa.
 */
export const coverageRatio = (
  projection: CashFlowProjection | null | undefined,
): number | null => {
  const inflows = toNumberOrNull(projection?.expected_inflows)
  const outflows = toNumberOrNull(projection?.expected_outflows)
  if (inflows === null || outflows === null || outflows <= 0) return null
  return (inflows / outflows) * 100
}

export type CoverageStatusKey = 'critical' | 'warning' | 'healthy'

/** Mismos umbrales del BE: <80 crítico, <100 advertencia, ≥100 saludable. */
export const coverageStatus = (
  ratio: number | null | undefined,
): CoverageStatusKey | null => {
  const numeric = toNumberOrNull(ratio)
  if (numeric === null) return null
  if (numeric < 80) return 'critical'
  if (numeric < 100) return 'warning'
  return 'healthy'
}

export interface CashFlowTotals {
  inflows: number
  outflows: number
  net: number
  cumulative: number
}

/** Totales del payload (la serie los repite, pero no se reconstruyen). */
export const cashFlowTotals = (
  projection: CashFlowProjection | null | undefined,
): CashFlowTotals => ({
  inflows: Number(projection?.expected_inflows ?? 0),
  outflows: Number(projection?.expected_outflows ?? 0),
  net: Number(projection?.net_cash_flow ?? 0),
  cumulative: Number(projection?.cumulative_flow ?? 0),
})
