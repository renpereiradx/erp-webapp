// ===========================================================================
// Formateo de métricas de la bandeja de pedidos (FASE 5).
// Lógica pura: sin React, sin side effects — testeable en aislamiento.
// es-PY: decimal coma, miles punto (formatNumber de currencyUtils).
// ===========================================================================

import { formatNumber } from '@/utils/currencyUtils'

export type AvgConversionTimeUnit = 'min' | 'h'

export interface AvgConversionTime {
  /** Valor ya formateado es-PY (ej. '12,5' / '1.422,7'). */
  value: string
  unit: AvgConversionTimeUnit
}

/**
 * Tiempo medio mostrador→caja. Debajo de 2 h se informa en minutos; a partir
 * de ahí en horas (1422.7 min → '23,7 h'), que es la unidad que lee la caja.
 */
export function resolveAvgConversionTime(minutes: number): AvgConversionTime {
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 0
  if (safe >= 120) {
    return { value: formatNumber(safe / 60, 1), unit: 'h' }
  }
  return { value: formatNumber(safe, 1), unit: 'min' }
}

/** Contador entero con agrupación es-PY (8 → '8'; 12500 → '12.500'). */
export function formatMetricCount(count: number): string {
  const safe = Number.isFinite(count) ? count : 0
  return formatNumber(Math.round(safe), 0)
}

/** Tasa de conversión en porcentaje es-PY (62.5 → '62,5'). */
export function formatConversionRate(rate: number): string {
  const safe = Number.isFinite(rate) && rate > 0 ? rate : 0
  return formatNumber(safe, 1)
}
