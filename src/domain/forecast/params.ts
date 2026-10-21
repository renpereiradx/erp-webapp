/**
 * Parámetros de Pronósticos: validación de selección y parseo de la URL.
 *
 * La selección de cada pantalla vive en query params para que un deep-link
 * conserve horizonte/historial/método/página. Un valor inválido cae al default
 * documentado en `constants.ts`; nunca se manda al BE un valor que el handler
 * vaya a clampear en silencio.
 */
import type { ForecastGranularity, ForecastMethod } from '@/types/bi'
import {
  DEFAULT_DEMAND_HISTORY,
  DEFAULT_FORECAST_HISTORY,
  DEFAULT_FORECAST_METHOD,
  DEFAULT_FORECAST_MONTHS,
  DEFAULT_INVENTORY_DAYS,
  DEFAULT_REVENUE_HISTORY,
  DEMAND_HORIZONS,
  FORECAST_HISTORY_MONTHS,
  FORECAST_HORIZONS,
  FORECAST_METHODS,
  INVENTORY_HORIZONS,
  REVENUE_HORIZONS,
  SALES_FORECAST_GRANULARITY,
} from './constants'

export type RawParam = string | number | null | undefined

export interface SalesForecastSelection {
  historyMonths: number
  forecastMonths: number
  method: ForecastMethod
  granularity: ForecastGranularity
}

const asNumber = (value: RawParam): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/** Primer entero positivo de un parámetro; `null` si no lo es. */
export const parsePositiveInt = (value: RawParam): number | null => {
  const numeric = asNumber(value)
  if (numeric === null) return null
  const int = Math.trunc(numeric)
  return int > 0 ? int : null
}

export const isForecastMethod = (value: unknown): value is ForecastMethod =>
  typeof value === 'string' && (FORECAST_METHODS as readonly string[]).includes(value)

export const isForecastGranularity = (value: unknown): value is ForecastGranularity =>
  typeof value === 'string' &&
  (['DAILY', 'WEEKLY', 'MONTHLY'] as readonly string[]).includes(value)

/** Número de una lista cerrada; fuera de la lista → fallback. */
export const pickAllowed = (
  value: RawParam,
  allowed: readonly number[],
  fallback: number,
): number => {
  const numeric = parsePositiveInt(value)
  return numeric !== null && allowed.includes(numeric) ? numeric : fallback
}

export const normalizeSalesSelection = (raw: {
  historyMonths?: RawParam
  forecastMonths?: RawParam
  method?: RawParam
  granularity?: RawParam
}): SalesForecastSelection => {
  const historyMonths = pickAllowed(
    raw.historyMonths,
    FORECAST_HISTORY_MONTHS,
    DEFAULT_FORECAST_HISTORY,
  )
  const forecastMonths = pickAllowed(
    raw.forecastMonths,
    FORECAST_HORIZONS,
    DEFAULT_FORECAST_MONTHS,
  )
  const requested = isForecastMethod(raw.method) ? raw.method : DEFAULT_FORECAST_METHOD
  // SEASONAL no se expone en la UI (ver constants): un deep-link con el método
  // se degrada a LINEAR en vez de provocar el 400 del BE.
  const method = requested === 'SEASONAL' ? DEFAULT_FORECAST_METHOD : requested

  // La UI solo consume buckets mensuales; se valida por contrato aunque el
  // valor sea fijo (un deep-link viejo con granularity no rompe la pantalla).
  const granularity = isForecastGranularity(raw.granularity)
    ? raw.granularity
    : SALES_FORECAST_GRANULARITY

  return { historyMonths, forecastMonths, method, granularity }
}

export const normalizeForecastMonths = (raw: RawParam): number =>
  pickAllowed(raw, FORECAST_HORIZONS, DEFAULT_FORECAST_MONTHS)

export const normalizeDemandMonths = (raw: RawParam): number =>
  pickAllowed(raw, DEMAND_HORIZONS, DEFAULT_FORECAST_MONTHS)

export const normalizeDemandHistory = (raw: RawParam): number =>
  pickAllowed(raw, FORECAST_HISTORY_MONTHS, DEFAULT_DEMAND_HISTORY)

export const normalizeRevenueMonths = (raw: RawParam): number =>
  pickAllowed(raw, REVENUE_HORIZONS, 3)

export const normalizeRevenueHistory = (raw: RawParam): number =>
  pickAllowed(raw, FORECAST_HISTORY_MONTHS, DEFAULT_REVENUE_HISTORY)

export const normalizeInventoryDays = (raw: RawParam): number =>
  pickAllowed(raw, INVENTORY_HORIZONS, DEFAULT_INVENTORY_DAYS)

/** Página 1-based; cualquier valor inválido vuelve a la primera página. */
export const normalizePage = (raw: RawParam): number => parsePositiveInt(raw) ?? 1
