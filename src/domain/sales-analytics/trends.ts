/**
 * Serie y resumen de tendencias de ventas (`GET /sales-analytics/trends`).
 *
 * `summary.growth_rate` compara el PRIMER punto contra el ÚLTIMO del período
 * (no contra el período anterior): la UI lo rotula así. `volatility` no lo
 * calcula el repositorio, por eso no se expone.
 */
import type {
  SalesTrendGranularity,
  SalesTrendPoint,
  SalesTrends,
} from '@/types/bi'
import { formatHour, formatIsoDayMonth, formatIsoMonthYear, roundPercent } from './format'

export type TrendDirectionKey = 'up' | 'down' | 'stable'

export interface TrendSeriesRow {
  key: string
  label: string
  sales: number
  transactions: number
  units: number
  averageTicket: number
}

export interface TrendSummaryView {
  direction: TrendDirectionKey
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

/** `UP|DOWN|STABLE` del BE → clave de traducción estable. */
export const trendDirectionKey = (direction: string | null | undefined): TrendDirectionKey => {
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
  point: SalesTrendPoint,
  granularity: SalesTrendGranularity | string,
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
export const buildTrendSeries = (
  trends: SalesTrends | null | undefined,
  granularity: SalesTrendGranularity | string,
  locale?: string,
): TrendSeriesRow[] =>
  (trends?.data_points ?? []).map((point, index) => ({
    key: `${granularity}-${point.timestamp}-${index}`,
    label: formatPointLabel(point, granularity, locale),
    sales: toNumber(point.sales),
    transactions: toNumber(point.transactions),
    units: toNumber(point.units),
    averageTicket: toNumber(point.average_ticket),
  }))

/** Máximo de ventas de la serie (base de las barras); 0 si no hay datos. */
export const getTrendMaxSales = (rows: TrendSeriesRow[]): number =>
  rows.reduce((max, row) => Math.max(max, row.sales), 0)

export const buildTrendSummary = (
  trends: SalesTrends | null | undefined,
  granularity: SalesTrendGranularity | string,
  locale?: string,
): TrendSummaryView | null => {
  if (!trends || trends.data_points.length === 0) return null
  const summary = trends.summary

  const resolveLabel = (raw: string): string => {
    const match = trends.data_points.find((point) => point.label === raw)
    if (!match) return raw
    return formatPointLabel(match, granularity, locale)
  }

  return {
    direction: trendDirectionKey(summary.trend_direction),
    growthRate: roundPercent(summary.growth_rate, 1),
    peakLabel: summary.peak_period ? resolveLabel(summary.peak_period) : '—',
    peakValue: toNumber(summary.peak_value),
    lowLabel: summary.low_period ? resolveLabel(summary.low_period) : '—',
    lowValue: toNumber(summary.low_value),
  }
}
