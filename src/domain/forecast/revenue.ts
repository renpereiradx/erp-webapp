/**
 * Derivaciones puras del pronóstico de ingresos (F11).
 *
 * El BE proyecta con regresión lineal sobre los meses históricos, emite
 * `by_month` como históricos + proyección (con `lower_bound`/`upper_bound`
 * ABSOLUTOS) y `annual_projection = forecast_revenue × (12 / meses)`.
 *
 * `by_category` NO es un pronóstico por categoría: el repo aplica el growth
 * GENERAL a cada categoría (`forecast = historical × (1 + growth)` y
 * `growth_rate` es el mismo en todas las filas). La UI muestra el histórico y
 * su participación, y no presenta esa copia como proyección por categoría.
 *
 * Los escenarios existen solo con `include_scenarios=true`: son el modelo
 * declarado del BE (base ±15 %, pesos 20/60/20), no una distribución
 * estadística. Se rotulan como pesos del escenario.
 */
import type {
  ForecastRevenueSummary,
  MonthlyRevenue,
  RevenueForecast,
  RevenueScenario,
} from '@/types/bi'
import { REVENUE_SCENARIO_NAMES } from './constants'
import {
  formatMoney,
  formatMonthYear,
  formatSignedMoney,
  toNumberOrNull,
  type ForecastKpiValue,
} from './format'

export interface RevenueSeriesRow {
  key: string
  label: string
  kind: 'history' | 'forecast'
  value: number
  valueLabel: string
  lowerLabel: string
  upperLabel: string
}

export interface RevenueScenarioRow {
  name: string
  amount: number | null
  probability: number | null
  growth: number | null
}

export interface RevenueCategoryRow {
  key: string
  name: string
  historical: number
  percentage: number | null
}

export const revenueKpis = (
  summary: ForecastRevenueSummary | null | undefined,
): ForecastKpiValue[] => [
  { id: 'historicalRevenue', kind: 'money', value: toNumberOrNull(summary?.historical_revenue) },
  { id: 'forecastRevenue', kind: 'money', value: toNumberOrNull(summary?.forecast_revenue) },
  { id: 'annualProjection', kind: 'money', value: toNumberOrNull(summary?.annual_projection) },
  { id: 'growth', kind: 'percentSigned', value: toNumberOrNull(summary?.growth_rate) },
  { id: 'confidence', kind: 'percent', value: toNumberOrNull(summary?.confidence_level) },
]

const monthTime = (row: MonthlyRevenue): number => {
  const time = new Date(row.month).getTime()
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

/** Serie única histórica + proyectada, ordenada por mes. */
export const revenueSeries = (
  forecast: RevenueForecast | null | undefined,
  lang?: string,
): RevenueSeriesRow[] =>
  [...(forecast?.by_month ?? [])]
    .sort((a, b) => monthTime(a) - monthTime(b))
    .map((row, index) => {
      const isForecast = Boolean(row.is_forecast)
      const value = isForecast ? toNumberOrNull(row.forecast) : toNumberOrNull(row.actual)
      return {
        key: `${row.month ?? index}-${index}`,
        label: formatMonthYear(row.month, lang),
        kind: isForecast ? 'forecast' : 'history',
        value: value ?? 0,
        valueLabel: formatMoney(value),
        lowerLabel: isForecast ? formatSignedMoney(row.lower_bound) : '—',
        upperLabel: isForecast ? formatSignedMoney(row.upper_bound) : '—',
      }
    })

/** Escenarios conocidos en el orden del modelo; nombres desconocidos se omiten. */
export const revenueScenarios = (
  forecast: RevenueForecast | null | undefined,
): RevenueScenarioRow[] => {
  const byName = new Map<string, RevenueScenario>()
  for (const scenario of forecast?.scenarios ?? []) {
    if (scenario?.name) byName.set(scenario.name, scenario)
  }
  return REVENUE_SCENARIO_NAMES.flatMap((name) => {
    const scenario = byName.get(name)
    if (!scenario) return []
    return [
      {
        name,
        amount: toNumberOrNull(scenario.forecast_amount),
        probability: toNumberOrNull(scenario.probability),
        growth: toNumberOrNull(scenario.growth_rate),
      },
    ]
  })
}

/** Categorías: histórico y participación real; sin la copia de growth global. */
export const revenueCategoryRows = (
  forecast: RevenueForecast | null | undefined,
): RevenueCategoryRow[] =>
  (forecast?.by_category ?? []).map((category, index) => ({
    key: `${category.category_id || 'category'}-${index}`,
    name: category.category_name || category.category_id || '—',
    historical: toNumberOrNull(category.historical) ?? 0,
    percentage: toNumberOrNull(category.percentage),
  }))

export const revenueCategoryTotal = (rows: readonly RevenueCategoryRow[]): number =>
  rows.reduce((sum, row) => sum + row.historical, 0)
