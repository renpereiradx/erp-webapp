/**
 * Derivaciones puras del pronóstico de ventas (F11).
 *
 * Todo sale del payload de `/forecast/sales`: no se completan huecos, no se
 * re-ajusta el modelo y no se inventan bandas. Las etiquetas de los buckets se
 * re-derivan de `date` porque el BE las emite en inglés (`to_char`).
 *
 * Bandas (`confidence.lower_bound/upper_bound`):
 *  - LINEAR / EXPONENTIAL / SEASONAL → MULTIPLICADORES (0.85 / 1.15): el monto
 *    de cada punto proyectado se multiplica;
 *  - MOVING_AVG → valores ABSOLUTOS (media ± 2σ), iguales para todo el
 *    horizonte.
 * El tipo de banda se expone (`salesBandKind`) para que la UI lo explique en
 * vez de presentar dos semánticas distintas como si fueran la misma.
 */
import type {
  ForecastConfidence,
  ForecastMethod,
  ForecastSeasonality,
  SalesForecast,
} from '@/types/bi'
import { MONTH_ABBREVIATIONS_ES } from './constants'
import {
  formatCount,
  formatDecimal,
  formatForecastMoney,
  formatMonthYear,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  roundNumber,
  toIntlLocale,
  toNumberOrNull,
  type ForecastKpiValue,
} from './format'

export type ForecastBandKind = 'multiplier' | 'absolute'

export interface ForecastSeriesRow {
  key: string
  /** Bucket localizado (`ene 2026`). */
  label: string
  value: number
  valueLabel: string
  lowerLabel: string
  upperLabel: string
  kind: 'history' | 'forecast'
}

export interface SalesModelMetric {
  id: 'confidence' | 'r2' | 'mae' | 'mape' | 'rmse'
  value: number | null
  kind: 'percent' | 'ratio' | 'money'
}

export interface SeasonalityFactorView {
  key: string
  label: string
  factor: number
}

export const salesBandKind = (method: ForecastMethod | string | null | undefined): ForecastBandKind =>
  method === 'MOVING_AVG' ? 'absolute' : 'multiplier'

/** Límites de un punto proyectado según la semántica real del método. */
export const salesPointBounds = (
  value: number,
  method: ForecastMethod | string | null | undefined,
  confidence: ForecastConfidence | null | undefined,
): { lower: number | null; upper: number | null } => {
  const lower = toNumberOrNull(confidence?.lower_bound)
  const upper = toNumberOrNull(confidence?.upper_bound)
  if (lower === null || upper === null) return { lower: null, upper: null }
  if (salesBandKind(method) === 'absolute') return { lower, upper }
  return { lower: roundNumber(value * lower, 2), upper: roundNumber(value * upper, 2) }
}

const seriesRow = (
  point: { date?: string | null; value?: number | null } | null | undefined,
  index: number,
  kind: 'history' | 'forecast',
  method: ForecastMethod | string | null | undefined,
  confidence: ForecastConfidence | null | undefined,
  lang?: string,
): ForecastSeriesRow | null => {
  const value = toNumberOrNull(point?.value)
  if (value === null) return null
  const bounds =
    kind === 'forecast'
      ? salesPointBounds(value, method, confidence)
      : { lower: null, upper: null }
  return {
    key: `${kind}-${point?.date ?? index}-${index}`,
    label: formatMonthYear(point?.date, lang),
    value,
    valueLabel: formatMoney(value),
    lowerLabel: bounds.lower === null ? '—' : formatSignedMoney(bounds.lower),
    upperLabel: bounds.upper === null ? '—' : formatSignedMoney(bounds.upper),
    kind,
  }
}

/** Series de historial y proyección, en el orden cronológico del BE. */
export const salesSeries = (
  forecast: SalesForecast | null | undefined,
  lang?: string,
): { history: ForecastSeriesRow[]; projection: ForecastSeriesRow[] } => {
  const method = forecast?.method
  const confidence = forecast?.confidence
  const history = (forecast?.historical_data ?? [])
    .map((point, index) => seriesRow(point, index, 'history', method, confidence, lang))
    .filter((row): row is ForecastSeriesRow => row !== null)
  const projection = (forecast?.forecast_data ?? [])
    .map((point, index) => seriesRow(point, index, 'forecast', method, confidence, lang))
    .filter((row): row is ForecastSeriesRow => row !== null)
  return { history, projection }
}

/** KPIs del ledger: cifras que el BE calcula, sin re-derivar el modelo. */
export const salesForecastKpis = (
  forecast: SalesForecast | null | undefined,
): ForecastKpiValue[] => {
  const summary = forecast?.summary
  const confidence = forecast?.confidence
  return [
    {
      id: 'historicalTotal',
      kind: 'money',
      value: toNumberOrNull(summary?.total_historical),
    },
    {
      id: 'projectedTotal',
      kind: 'money',
      value: toNumberOrNull(summary?.total_forecast),
    },
    {
      id: 'projectedAverage',
      kind: 'money',
      value: toNumberOrNull(summary?.average_forecast),
    },
    {
      id: 'growth',
      kind: 'percentSigned',
      value: toNumberOrNull(summary?.growth_rate),
    },
    {
      id: 'confidence',
      kind: 'percent',
      value: toNumberOrNull(confidence?.level ?? summary?.confidence_level),
    },
  ]
}

/** Métricas de bondad de ajuste tal como las calcula el BE. */
export const salesModelMetrics = (
  forecast: SalesForecast | null | undefined,
): SalesModelMetric[] => {
  const confidence = forecast?.confidence
  return [
    { id: 'confidence', value: toNumberOrNull(confidence?.level), kind: 'percent' },
    { id: 'r2', value: toNumberOrNull(confidence?.r2), kind: 'ratio' },
    { id: 'mae', value: toNumberOrNull(confidence?.mae), kind: 'money' },
    { id: 'mape', value: toNumberOrNull(confidence?.mape), kind: 'percent' },
    { id: 'rmse', value: toNumberOrNull(confidence?.rmse), kind: 'money' },
  ]
}

export const formatSalesModelMetric = (metric: SalesModelMetric): string => {
  if (metric.kind === 'percent') return formatPercent(metric.value)
  if (metric.kind === 'ratio') return formatDecimal(metric.value, 2)
  return formatForecastMoney(metric.value)
}

/** `Ene` (BE) → mes abreviado del locale de la UI. */
export const translateSeasonMonth = (label: string | null | undefined, lang?: string): string => {
  if (!label) return '—'
  const index = MONTH_ABBREVIATIONS_ES.findIndex(
    (month) => month.toLowerCase() === label.trim().toLowerCase(),
  )
  if (index < 0) return label
  return new Date(Date.UTC(2026, index, 1)).toLocaleDateString(toIntlLocale(lang), {
    month: 'short',
    timeZone: 'UTC',
  })
}

export interface SeasonalityView {
  hasSeasonality: boolean
  peaks: string[]
  lows: string[]
  factors: SeasonalityFactorView[]
}

/** Estacionalidad solo cuando el BE la detectó (≥ 12 puntos de historia). */
export const salesSeasonality = (
  seasonality: ForecastSeasonality | null | undefined,
  lang?: string,
): SeasonalityView => {
  const peaks = (seasonality?.peak_periods ?? []).map((label) =>
    translateSeasonMonth(label, lang),
  )
  const lows = (seasonality?.low_periods ?? []).map((label) =>
    translateSeasonMonth(label, lang),
  )
  const factors = (seasonality?.seasonal_factors ?? []).map((factor, index) => ({
    key: factor.period || String(index),
    label: translateSeasonMonth(factor.label, lang),
    factor: toNumberOrNull(factor.factor) ?? 0,
  }))
  return {
    hasSeasonality: Boolean(seasonality?.has_seasonality) && factors.length > 0,
    peaks,
    lows,
    factors,
  }
}

/** Resumen en una línea de la confianza (para hints): `6,9% · R² 0,07`. */
export const salesConfidenceHint = (forecast: SalesForecast | null | undefined): string => {
  const confidence = forecast?.confidence
  return `${formatPercent(confidence?.level)} · R² ${formatDecimal(confidence?.r2, 2)}`
}

/** Conteo de puntos del historial (para el hint de SEASONAL). */
export const salesHistoryPoints = (forecast: SalesForecast | null | undefined): string =>
  formatCount((forecast?.historical_data ?? []).length)
