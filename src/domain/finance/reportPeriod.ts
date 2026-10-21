/**
 * Rango aplicado de un reporte financiero.
 *
 * `period.start_date`/`end_date` son timestamps y el fin es EXCLUSIVO (el
 * backend resuelve el mes como [1 oct 00:00, 1 nov 00:00)). La UI muestra el
 * fin inclusivo restando 1 ms para no correr el día en zonas con offset.
 */
import type { FinancialReportPeriod } from '@/types/bi'
import { formatDate, isMissingDate } from './format'

export interface FinancialRange {
  start: string
  end: string
}

export const financialRange = (
  period: FinancialReportPeriod | null | undefined,
): FinancialRange | null => {
  if (!period || isMissingDate(period.start_date) || isMissingDate(period.end_date)) {
    return null
  }
  return { start: period.start_date, end: period.end_date }
}

/** `01 oct 2026 – 31 oct 2026` (fin inclusivo), en la zona del navegador. */
export const formatFinancialRange = (
  period: FinancialReportPeriod | null | undefined,
  locale?: string,
): string => {
  const range = financialRange(period)
  if (!range) return '—'
  const inclusiveEnd = new Date(new Date(range.end).getTime() - 1)
  return `${formatDate(range.start, locale)} – ${formatDate(
    inclusiveEnd.toISOString(),
    locale,
  )}`
}
