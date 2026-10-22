/**
 * Serie y resumen de tendencias de compras (`GET /purchase-analytics/trends`).
 *
 * Misma semántica que ventas: `summary.growth_rate` compara el PRIMER punto
 * contra el ÚLTIMO del período (la UI lo rotula así) y `volatility` no lo
 * calcula el repositorio, así que no se expone.
 */
import type { PurchaseTrendPoint, PurchaseTrends } from '@/types/bi'
import { formatHour, formatIsoDayMonth, formatIsoMonthYear, roundPercent } from '@/domain/sales-analytics/format'

export type PurchaseTrendDirectionKey = 'up' | 'down' | 'stable'

export interface PurchaseTrendSeriesRow {
  key: string
  label: string
  purchases: number
  transactions: number
  units: number
  averageOrder: number
}

export interface PurchaseTrendSummaryView {
  direction: PurchaseTrendDirectionKey
  growthRate: number
  peakLabel: string
  peakValue: number
  lowLabel: string
  lowValue: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export const purchaseTrendDirectionKey = (
  direction: string | null | undefined,
): PurchaseTrendDirectionKey => {
  switch ((direction || '').toUpperCase()) {
    case 'UP':
      return 'up'
    case 'DOWN':
      return 'down'
    default:
      return 'stable'
  }
}

const formatPointLabel = (
  point: PurchaseTrendPoint,
  granularity: string,
  locale?: string,
): string => {
  if (granularity === 'hourly') {
    const date = new Date(point.timestamp)
    if (!Number.isNaN(date.getTime())) return formatHour(date.getHours())
    return point.label || '—'
  }
  if (granularity === 'monthly') return formatIsoMonthYear(point.timestamp, locale)
  if (granularity === 'weekly') return point.label || formatIsoDayMonth(point.timestamp, locale)
  return formatIsoDayMonth(point.timestamp, locale)
}

/** Filas de la serie, con el label formateado en el locale de la UI. */
export const buildPurchaseTrendSeries = (
  trends: PurchaseTrends | null | undefined,
  granularity: string,
  locale?: string,
): PurchaseTrendSeriesRow[] =>
  (trends?.data_points ?? []).map((point, index) => ({
    key: `${granularity}-${point.timestamp}-${index}`,
    label: formatPointLabel(point, granularity, locale),
    purchases: toNumber(point.purchases),
    transactions: toNumber(point.transactions),
    units: toNumber(point.units),
    averageOrder: toNumber(point.average_order),
  }))

/** Máximo de compras de la serie (base de las barras); 0 si no hay datos. */
export const getPurchaseTrendMax = (rows: PurchaseTrendSeriesRow[]): number =>
  rows.reduce((max, row) => Math.max(max, row.purchases), 0)

export const buildPurchaseTrendSummary = (
  trends: PurchaseTrends | null | undefined,
  granularity: string,
  locale?: string,
): PurchaseTrendSummaryView | null => {
  if (!trends || (trends.data_points ?? []).length === 0) return null
  const summary = trends.summary

  const resolveLabel = (raw: string): string => {
    const match = (trends.data_points ?? []).find((point) => point.label === raw)
    if (!match) return raw
    return formatPointLabel(match, granularity, locale)
  }

  return {
    direction: purchaseTrendDirectionKey(summary?.trend_direction),
    growthRate: roundPercent(summary?.growth_rate, 1),
    peakLabel: summary?.peak_period ? resolveLabel(summary.peak_period) : '—',
    peakValue: toNumber(summary?.peak_value),
    lowLabel: summary?.low_period ? resolveLabel(summary.low_period) : '—',
    lowValue: toNumber(summary?.low_value),
  }
}
