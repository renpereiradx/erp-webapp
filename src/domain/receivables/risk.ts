/**
 * Riesgo y comportamiento de pago de un cliente (F7).
 *
 * Todo sale de `GET /receivables/client/{id}/risk` (`analytics.ClientRisk`):
 *  - `risk_level`: HIGH si hay deuda >90 días y más del 50 % del saldo está
 *    vencido; MEDIUM si el vencido supera el 30 % o la antigüedad máxima pasa
 *    de 60 días; LOW en el resto (reglas del repo, documentadas en pantalla).
 *  - `payment_behavior`: EXCELLENT ≤30 días, GOOD ≤45, REGULAR ≤60, POOR >60
 *    (`calculatePaymentBehavior`). Con 0 pagos el BE devuelve 0 días →
 *    EXCELLENT, así que la UI lo oculta cuando no hay historial.
 *  - `overdue_ratio` es un ratio 0-1 (se muestra como porcentaje).
 *  - `max_days_overdue`/`avg_days_outstanding` son DÍAS DESDE LA VENTA, no días
 *    vencidos: se rotulan "antigüedad".
 *  - `collection_rate` puede superar 100 % (fórmula del repo): NO se muestra.
 *
 * Sin estilos ni literales de UI: las etiquetas viven en i18n.
 */
import type { ClientRisk } from '@/types/bi'
import { toNumberOrNull } from './format'

export type RiskLevelKey = 'low' | 'medium' | 'high'

/** Nivel de riesgo normalizado; un valor desconocido no se renderiza. */
export const riskLevelKey = (level: string | null | undefined): RiskLevelKey | null => {
  switch ((level ?? '').toUpperCase()) {
    case 'LOW':
      return 'low'
    case 'MEDIUM':
      return 'medium'
    case 'HIGH':
      return 'high'
    default:
      return null
  }
}

export type RiskTone = 'success' | 'warning' | 'error'

export const RISK_LEVEL_TONE: Record<RiskLevelKey, RiskTone> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

export type PaymentBehaviorKey = 'excellent' | 'good' | 'regular' | 'poor'

/** Comportamiento de pago normalizado; un valor desconocido no se renderiza. */
export const paymentBehaviorKey = (
  behavior: string | null | undefined,
): PaymentBehaviorKey | null => {
  switch ((behavior ?? '').toUpperCase()) {
    case 'EXCELLENT':
      return 'excellent'
    case 'GOOD':
      return 'good'
    case 'REGULAR':
      return 'regular'
    case 'POOR':
      return 'poor'
    default:
      return null
  }
}

/** Umbrales superiores de días de pago por comportamiento (BE). */
export const PAYMENT_BEHAVIOR_MAX_DAYS: Record<Exclude<PaymentBehaviorKey, 'poor'>, number> = {
  excellent: 30,
  good: 45,
  regular: 60,
}

/**
 * El BE calcula `payment_behavior` con `AVG(días)` y sin pagos el promedio es
 * 0 → EXCELLENT. La UI solo muestra comportamiento si hubo al menos un pago.
 */
export const hasPaymentHistory = (risk: Pick<ClientRisk, 'total_payments'> | null | undefined): boolean =>
  (toNumberOrNull(risk?.total_payments) ?? 0) > 0

/** Ratio 0-1 → porcentaje 0-100 (sin clampear: se muestra el dato del BE). */
export const overdueRatioPercent = (ratio: number | null | undefined): number | null => {
  const numeric = toNumberOrNull(ratio)
  return numeric === null ? null : numeric * 100
}

/**
 * Señales que explican el nivel de riesgo con las mismas reglas del backend.
 * Se muestran como texto; ninguna agrega cifras propias.
 */
export interface RiskSignals {
  /** Hay deuda con más de 90 días desde la venta. */
  over90Debt: boolean
  /** Más de la mitad del saldo está "vencido" (>30 días desde la venta). */
  ratioOver50: boolean
  /** Más del 30 % del saldo está "vencido". */
  ratioOver30: boolean
  /** La cuenta más antigua supera los 60 días. */
  maxAgeOver60: boolean
}

export const riskSignals = (risk: ClientRisk | null | undefined): RiskSignals => {
  const ratio = toNumberOrNull(risk?.overdue_ratio) ?? 0
  const maxAge = toNumberOrNull(risk?.max_days_overdue) ?? 0
  const over90 = toNumberOrNull(risk?.total_over_90_amount) ?? 0
  return {
    over90Debt: over90 > 0,
    ratioOver50: ratio > 0.5,
    ratioOver30: ratio > 0.3,
    maxAgeOver60: maxAge > 60,
  }
}
