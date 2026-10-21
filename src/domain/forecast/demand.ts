/**
 * Derivaciones puras del pronóstico de demanda (F11).
 *
 * El BE proyecta por categoría y por producto con
 * `promedio mensual histórico × forecast_months × (1 + growth/100)`, donde el
 * growth compara los últimos 30 días contra los 30 anteriores (0 si no hay
 * base previa). `confidence` es una constante del modelo (75 categorías, 70
 * productos), no una confianza por fila: la UI la muestra una sola vez.
 *
 * `top_products` viene paginado server-side; los totales de la página no se
 * presentan como totales del negocio. `trends` nunca se completa: no se
 * renderiza.
 */
import type { CategoryDemand, DemandForecast, ProductDemand } from '@/types/bi'
import { toNumberOrNull, type ForecastKpiValue } from './format'

export const demandCategoryRows = (
  demand: DemandForecast | null | undefined,
): CategoryDemand[] => demand?.categories ?? []

export const demandTopProductRows = (
  demand: DemandForecast | null | undefined,
): ProductDemand[] => demand?.top_products ?? []

/** Suma de las filas de categoría (el set de categorías no está paginado). */
export const demandUnitTotals = (
  demand: DemandForecast | null | undefined,
): { historical: number; forecast: number } => {
  let historical = 0
  let forecast = 0
  for (const category of demand?.categories ?? []) {
    historical += toNumberOrNull(category.historical_units) ?? 0
    forecast += toNumberOrNull(category.forecast_units) ?? 0
  }
  return { historical, forecast }
}

/** Categoría con mayor crecimiento declarado (puede ser negativa). */
export const demandTopGrowthCategory = (
  demand: DemandForecast | null | undefined,
): CategoryDemand | null => {
  const categories = demand?.categories ?? []
  if (categories.length === 0) return null
  return categories.reduce((best, current) =>
    (toNumberOrNull(current.growth_rate) ?? 0) > (toNumberOrNull(best.growth_rate) ?? 0)
      ? current
      : best,
  )
}

/** Producto con más unidades proyectadas dentro de la página del top. */
export const demandTopProduct = (
  demand: DemandForecast | null | undefined,
): ProductDemand | null => {
  const products = demand?.top_products ?? []
  if (products.length === 0) return null
  return products.reduce((best, current) =>
    (toNumberOrNull(current.forecast_units) ?? 0) > (toNumberOrNull(best.forecast_units) ?? 0)
      ? current
      : best,
  )
}

/** Confianza única del modelo cuando todas las filas comparten el valor. */
export const demandCommonConfidence = (
  values: Array<{ confidence?: number | null }> | null | undefined,
): number | null => {
  const rows = values ?? []
  if (rows.length === 0) return null
  const first = toNumberOrNull(rows[0].confidence)
  if (first === null) return null
  const allEqual = rows.every((row) => toNumberOrNull(row.confidence) === first)
  return allEqual ? first : null
}

export const demandKpis = (
  demand: DemandForecast | null | undefined,
): ForecastKpiValue[] => {
  const totals = demandUnitTotals(demand)
  const topCategory = demandTopGrowthCategory(demand)
  const topProduct = demandTopProduct(demand)
  const confidence = demandCommonConfidence(demand?.categories)
  return [
    {
      id: 'categories',
      kind: 'count',
      value: (demand?.categories ?? []).length,
    },
    { id: 'historicalUnits', kind: 'count', value: totals.historical },
    { id: 'forecastUnits', kind: 'count', value: totals.forecast },
    {
      id: 'topCategoryGrowth',
      kind: 'percentSigned',
      value: toNumberOrNull(topCategory?.growth_rate),
    },
    {
      id: 'topProductUnits',
      kind: 'count',
      value: toNumberOrNull(topProduct?.forecast_units),
    },
    { id: 'confidence', kind: 'percent', value: confidence },
  ]
}

export interface DemandPageInfo {
  page: number
  totalPages: number
  totalItems: number
}

export const demandPagination = (
  demand: DemandForecast | null | undefined,
): DemandPageInfo => ({
  page: toNumberOrNull(demand?.pagination?.page) ?? 1,
  totalPages: toNumberOrNull(demand?.pagination?.total_pages) ?? 1,
  totalItems: toNumberOrNull(demand?.pagination?.total_items) ?? 0,
})
