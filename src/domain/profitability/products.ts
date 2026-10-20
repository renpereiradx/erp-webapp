/**
 * Productos rentables (F6): estado de orden server-side, clasificación de
 * desempeño y disponibilidad de la contribución.
 *
 * El whitelist real del BE es `profit|margin|revenue|units|name`
 * (`validSorts` en analytics_profitability_repo.go). `name` va a
 * `product_name` y ordena ASC por defecto; el resto DESC.
 */
import type {
  ProductProfitabilityRow,
  ProfitabilityProductSortBy,
  ProfitabilitySortOrder,
} from '@/types/bi'
import { DEFAULT_PRODUCT_SORT, PRODUCT_SORT_FIELDS } from './constants'
import { toNumberOrNull } from './format'
import { performanceKey } from './performance'

const DEFAULT_ORDER: Record<ProfitabilityProductSortBy, 'ASC' | 'DESC'> = {
  profit: 'DESC',
  margin: 'DESC',
  revenue: 'DESC',
  units: 'DESC',
  name: 'ASC',
}

export const isProductSortField = (value: unknown): value is ProfitabilityProductSortBy =>
  typeof value === 'string' && (PRODUCT_SORT_FIELDS as readonly string[]).includes(value)

/** Próximo estado al clickear un encabezado: nuevo campo → su orden natural. */
export const nextProductSort = (
  current: ProfitabilitySortOrder,
  field: ProfitabilityProductSortBy,
): ProfitabilitySortOrder => {
  if (current.by !== field) return { by: field, order: DEFAULT_ORDER[field] }
  return { by: field, order: current.order === 'DESC' ? 'ASC' : 'DESC' }
}

/** `aria-sort` del encabezado ordenable. */
export const productAriaSort = (
  current: ProfitabilitySortOrder,
  field: ProfitabilityProductSortBy,
): 'ascending' | 'descending' | 'none' => {
  if (current.by !== field) return 'none'
  return current.order === 'DESC' ? 'descending' : 'ascending'
}

/** Normaliza el slice nil de Go a una lista. */
export const productRows = (
  rows: ProductProfitabilityRow[] | null | undefined,
): ProductProfitabilityRow[] => (Array.isArray(rows) ? rows : [])

export const isUnprofitable = (row: ProductProfitabilityRow): boolean =>
  performanceKey(row.performance) === 'loss' || (toNumberOrNull(row.gross_profit) ?? 0) < 0

/**
 * La contribución por fila se calcula contra el beneficio total del resumen.
 * Si ese total no es positivo, el BE devuelve 0 para todas: se muestra `—`.
 */
export const contributionAvailable = (
  totalProfit: number | null | undefined,
): boolean => (toNumberOrNull(totalProfit) ?? 0) > 0

/**
 * Margen derivado de revenue/beneficio reales. Necesario para `top_profitable`
 * y `losers`: esos arrays salen de SELECTs propios que dejan `gross_margin_pct`
 * en 0 (no lo calculan). `null` si no hay ingresos.
 */
export const derivedMarginPct = (
  row: Pick<ProductProfitabilityRow, 'revenue' | 'gross_profit'>,
): number | null => {
  const revenue = toNumberOrNull(row.revenue)
  const profit = toNumberOrNull(row.gross_profit)
  if (revenue === null || revenue <= 0 || profit === null) return null
  return (profit / revenue) * 100
}

export { DEFAULT_PRODUCT_SORT }
