/**
 * Constantes de Rentabilidad (F6): tamaño de página y granularidades.
 *
 * La paginación es server-side. 10 filas por página es la regla del proyecto
 * (F4/F5); el BE acepta `page`/`page_size` y devuelve `pagination` real.
 */
import type {
  ProfitabilityProductSortBy,
  ProfitabilitySortOrder,
  ProfitabilityTrendGranularity,
} from '@/types/bi'

export const PROFITABILITY_PAGE_SIZE = 10

export const PRODUCT_SORT_FIELDS: readonly ProfitabilityProductSortBy[] = [
  'profit',
  'margin',
  'revenue',
  'units',
  'name',
]

export const DEFAULT_PRODUCT_SORT: ProfitabilitySortOrder = {
  by: 'profit',
  order: 'DESC',
}

export const TREND_GRANULARITIES: readonly ProfitabilityTrendGranularity[] = [
  'daily',
  'weekly',
  'monthly',
]

export const DEFAULT_TREND_GRANULARITY: ProfitabilityTrendGranularity = 'daily'
