/**
 * Selección de Pronósticos persistida en la URL.
 *
 * Un deep-link conserva horizonte/historial/método/página y el botón de
 * Actualizar no los pierde. Los valores fuera de las listas cerradas caen al
 * default (`domain/forecast/params`) y se vuelven a escribir en la URL solo si
 * difieren del default, para no ensuciar el link.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_FORECAST_HISTORY,
  DEFAULT_FORECAST_METHOD,
  DEFAULT_FORECAST_MONTHS,
  DEFAULT_INVENTORY_DAYS,
  REVENUE_HORIZONS,
} from '@/domain/forecast/constants'
import {
  normalizeDemandMonths,
  normalizeForecastMonths,
  normalizeInventoryDays,
  normalizePage,
  normalizeRevenueMonths,
  normalizeSalesSelection,
  type SalesForecastSelection,
} from '@/domain/forecast/params'
import type { ForecastMethod } from '@/types/bi'

type ParamUpdates = Record<string, string | number | null | undefined>

const useParamUpdater = (): ((updates: ParamUpdates) => void) => {
  const [searchParams, setSearchParams] = useSearchParams()
  return useCallback(
    (updates: ParamUpdates) => {
      const params = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )
}

export interface DashboardForecastParamsState {
  months: number
  setMonths: (months: number) => void
}

export const useDashboardForecastParams = (): DashboardForecastParamsState => {
  const [searchParams] = useSearchParams()
  const update = useParamUpdater()
  const months = normalizeForecastMonths(searchParams.get('months'))
  const setMonths = useCallback(
    (next: number) => {
      update({ months: next === DEFAULT_FORECAST_MONTHS ? null : next })
    },
    [update],
  )
  return { months, setMonths }
}

export interface SalesForecastParamsState {
  selection: SalesForecastSelection
  setHistory: (months: number) => void
  setForecastMonths: (months: number) => void
  setMethod: (method: ForecastMethod) => void
}

export const useSalesForecastParams = (): SalesForecastParamsState => {
  const [searchParams] = useSearchParams()
  const update = useParamUpdater()
  const selection = normalizeSalesSelection({
    historyMonths: searchParams.get('history'),
    forecastMonths: searchParams.get('months'),
    method: searchParams.get('method'),
  })

  const setHistory = useCallback(
    (months: number) => {
      const next = normalizeSalesSelection({
        historyMonths: months,
        forecastMonths: selection.forecastMonths,
        method: selection.method,
      })
      update({
        history: next.historyMonths === DEFAULT_FORECAST_HISTORY ? null : next.historyMonths,
        // Si bajar la historia degradó SEASONAL a LINEAR, se limpia el param.
        method: next.method === DEFAULT_FORECAST_METHOD ? null : next.method,
      })
    },
    [selection.forecastMonths, selection.method, update],
  )

  const setForecastMonths = useCallback(
    (months: number) => {
      update({ months: months === DEFAULT_FORECAST_MONTHS ? null : months })
    },
    [update],
  )

  const setMethod = useCallback(
    (method: ForecastMethod) => {
      // SEASONAL no está en el selector; se degrada en `normalizeSalesSelection`.
      if (method === 'SEASONAL') return
      update({ method: method === DEFAULT_FORECAST_METHOD ? null : method })
    },
    [update],
  )

  return { selection, setHistory, setForecastMonths, setMethod }
}

export interface InventoryForecastParamsState {
  days: number
  page: number
  setDays: (days: number) => void
  setPage: (page: number) => void
}

export const useInventoryForecastParams = (): InventoryForecastParamsState => {
  const [searchParams] = useSearchParams()
  const update = useParamUpdater()
  const days = normalizeInventoryDays(searchParams.get('days'))
  const page = normalizePage(searchParams.get('page'))

  const setDays = useCallback(
    (next: number) => {
      update({
        days: next === DEFAULT_INVENTORY_DAYS ? null : next,
        page: null,
      })
    },
    [update],
  )

  const setPage = useCallback(
    (next: number) => {
      update({ page: next <= 1 ? null : next })
    },
    [update],
  )

  return { days, page, setDays, setPage }
}

export interface DemandForecastParamsState {
  months: number
  page: number
  setMonths: (months: number) => void
  setPage: (page: number) => void
}

export const useDemandForecastParams = (): DemandForecastParamsState => {
  const [searchParams] = useSearchParams()
  const update = useParamUpdater()
  const months = normalizeDemandMonths(searchParams.get('months'))
  const page = normalizePage(searchParams.get('page'))

  const setMonths = useCallback(
    (next: number) => {
      update({ months: next === DEFAULT_FORECAST_MONTHS ? null : next, page: null })
    },
    [update],
  )

  const setPage = useCallback(
    (next: number) => {
      update({ page: next <= 1 ? null : next })
    },
    [update],
  )

  return { months, page, setMonths, setPage }
}

export interface RevenueForecastParamsState {
  months: number
  page: number
  setMonths: (months: number) => void
  setPage: (page: number) => void
}

export const useRevenueForecastParams = (): RevenueForecastParamsState => {
  const [searchParams] = useSearchParams()
  const update = useParamUpdater()
  const months = normalizeRevenueMonths(searchParams.get('months'))
  const page = normalizePage(searchParams.get('page'))
  const defaultMonths = REVENUE_HORIZONS[0]

  const setMonths = useCallback(
    (next: number) => {
      update({ months: next === defaultMonths ? null : next, page: null })
    },
    [defaultMonths, update],
  )

  const setPage = useCallback(
    (next: number) => {
      update({ page: next <= 1 ? null : next })
    },
    [update],
  )

  return { months, page, setMonths, setPage }
}
