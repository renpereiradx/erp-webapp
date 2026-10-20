/**
 * Tendencias de rentabilidad (F6).
 *
 * El BE emite `label` con `to_char` en el locale del servidor (inglés) y el
 * resumen con fechas en ese mismo formato. La UI re-deriva las etiquetas y
 * los extremos desde `data_points[].date` para respetar el locale de la UI y
 * no correr un día en husos negativos.
 */
import type {
  DashboardPeriod,
  ProfitabilityTrendGranularity,
  ProfitabilityTrendPoint,
  ProfitabilityTrendsReport,
} from '@/types/bi'
import { formatTrendDate, toNumberOrNull } from './format'
import { TREND_GRANULARITIES } from './constants'

export const trendPoints = (
  report: ProfitabilityTrendsReport | null | undefined,
): ProfitabilityTrendPoint[] => {
  const points = report?.data_points
  return Array.isArray(points) ? points : []
}

/** El BE ignora un `granularity` inválido y cae a diario. */
export const isTrendGranularity = (
  value: unknown,
): value is ProfitabilityTrendGranularity =>
  typeof value === 'string' && (TREND_GRANULARITIES as readonly string[]).includes(value)

/** Default del selector: el mismo criterio de ventana que usa el BE. */
export const defaultTrendGranularity = (
  period: DashboardPeriod,
): ProfitabilityTrendGranularity => (period === 'year' ? 'monthly' : 'daily')

export interface TrendRow {
  key: string
  /** Etiqueta ya localizada (`01 oct`, `oct 2026`). */
  label: string
  point: ProfitabilityTrendPoint
}

export const trendRows = (
  points: ProfitabilityTrendPoint[],
  granularity: ProfitabilityTrendGranularity,
  locale?: string,
): TrendRow[] =>
  points.map((point) => ({
    key: point.date,
    label: formatTrendDate(point.date, granularity, locale),
    point,
  }))

export type TrendDirection = 'up' | 'down' | 'stable'

export interface TrendInsight {
  /** `null` con menos de 2 puntos (no hay comparación posible). */
  direction: TrendDirection | null
  /** Variación de beneficio primera→última; `null` si la primera es <= 0. */
  growthRate: number | null
  averageMargin: number | null
  totalRevenue: number
  totalProfit: number
  peakRevenue: { date: string; value: number } | null
  peakProfit: { date: string; value: number } | null
  lowestMargin: { date: string; value: number } | null
}

/**
 * Re-deriva el resumen del BE con las mismas reglas (5 % para la dirección,
 * crecimiento solo con base positiva, mínimo margen entre puntos con ventas)
 * para poder rotular las fechas en el locale de la UI.
 */
export const buildTrendInsight = (points: ProfitabilityTrendPoint[]): TrendInsight => {
  let totalRevenue = 0
  let totalProfit = 0
  let marginSum = 0
  let peakRevenue: TrendInsight['peakRevenue'] = null
  let peakProfit: TrendInsight['peakProfit'] = null
  let lowestMargin: TrendInsight['lowestMargin'] = null

  for (const point of points) {
    const revenue = toNumberOrNull(point.revenue) ?? 0
    const profit = toNumberOrNull(point.gross_profit) ?? 0
    const margin = toNumberOrNull(point.gross_margin_pct) ?? 0
    totalRevenue += revenue
    totalProfit += profit
    marginSum += margin

    if (revenue > 0 && (peakRevenue === null || revenue > peakRevenue.value)) {
      peakRevenue = { date: point.date, value: revenue }
    }
    if (profit > 0 && (peakProfit === null || profit > peakProfit.value)) {
      peakProfit = { date: point.date, value: profit }
    }
    if (revenue > 0 && (lowestMargin === null || margin < lowestMargin.value)) {
      lowestMargin = { date: point.date, value: margin }
    }
  }

  let direction: TrendDirection | null = null
  let growthRate: number | null = null
  if (points.length >= 2) {
    const first = toNumberOrNull(points[0].gross_profit) ?? 0
    const last = toNumberOrNull(points[points.length - 1].gross_profit) ?? 0
    if (last > first * 1.05) direction = 'up'
    else if (last < first * 0.95) direction = 'down'
    else direction = 'stable'
    if (first > 0) growthRate = ((last - first) / first) * 100
  }

  return {
    direction,
    growthRate,
    averageMargin: points.length > 0 ? marginSum / points.length : null,
    totalRevenue,
    totalProfit,
    peakRevenue,
    peakProfit,
    lowestMargin,
  }
}

/** Altura relativa (0-100) de la barra de un punto contra el máximo real. */
export const revenueBarWidth = (
  value: number | null | undefined,
  max: number | null | undefined,
): number => {
  const numeric = toNumberOrNull(value)
  const top = toNumberOrNull(max)
  if (numeric === null || top === null || top <= 0 || numeric <= 0) return 0
  return Math.max(2, Math.round((numeric / top) * 100))
}
