/**
 * Estadísticas y serie semanal de Cuentas por Pagar (F8).
 *
 * `statistics.payment_trend` agrupa por semana calendario de Postgres (lunes):
 * `purchased` son compras de la semana y `paid` los pagos con fecha en esa
 * semana; `balance` es el acumulado del BE (compras − pagos), no la deuda.
 * El `LIMIT 12` devuelve las PRIMERAS 12 semanas del rango, no las últimas:
 * la UI lo dice en el subtítulo.
 *
 * El `WITH RECURSIVE` emite además un bucket que ARRANCA después del fin del
 * rango (artefacto del generador de fechas). Se descarta comparando contra el
 * fin EXCLUSIVO que declara `statistics.period` (mismo criterio de F7).
 */
import type { PaymentTrendPoint } from '@/types/bi'
import { isMissingDate } from './format'

export interface PaymentTrendRow extends PaymentTrendPoint {
  date: string
}

/** Serie semanal ordenada, sin fechas inválidas ni buckets posteriores al rango. */
export const paymentTrendRows = (
  points: PaymentTrendPoint[] | null | undefined,
  range?: { start: string; end: string } | null,
): PaymentTrendRow[] => {
  if (!Array.isArray(points)) return []
  return points
    .filter((point) => {
      if (isMissingDate(point.date)) return false
      if (!range) return true
      return point.date.slice(0, 10) < range.end
    })
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}
