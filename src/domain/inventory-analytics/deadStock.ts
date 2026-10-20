/**
 * Stock muerto (F5).
 *
 * Reglas del BE (`DeadStockAnalysis`): incluye productos con stock > 0 y sin
 * ventas desde hace más de `days` (o nunca vendidos, usando la fecha de alta).
 * `potential_loss` es `total_value * 0.3` hardcodeado: NO es una pérdida
 * medida y no se muestra como tal. Las recomendaciones por fila se derivan de
 * los mismos umbrales del BE (120/180 días) con claves i18n, en vez de imprimir
 * el texto en español que manda el servidor.
 */
import type { DeadStockAnalysis, DeadStockProduct, DeadStockSummary } from '@/types/bi'
import { toNumberOrNull } from './format'

export type DeadStockThreshold = 90 | 120 | 180

export const DEAD_STOCK_THRESHOLDS: readonly DeadStockThreshold[] = [90, 120, 180]

export const DEAD_STOCK_DEFAULT_THRESHOLD: DeadStockThreshold = 90

export const isDeadStockThreshold = (value: unknown): value is DeadStockThreshold =>
  value === 90 || value === 120 || value === 180

export type DeadStockRecommendationKey = 'promote' | 'discount' | 'discontinue'

/**
 * Espejo de `DeadStockAnalysis` del repo: > 180 liquidar/descontinuar,
 * > 120 descuento significativo, resto promoción. La UI traduce el resultado;
 * no se muestra el string en español del endpoint.
 */
export const deadStockRecommendationFor = (
  daysSinceLastSale: number | null | undefined,
): DeadStockRecommendationKey => {
  const days = toNumberOrNull(daysSinceLastSale) ?? 0
  if (days > 180) return 'discontinue'
  if (days > 120) return 'discount'
  return 'promote'
}

export interface DeadStockSummaryView {
  products: number
  units: number
  value: number
  percentageOfStock: number
  averageDaysIdle: number
}

export const buildDeadStockSummary = (
  summary: DeadStockSummary | null | undefined,
): DeadStockSummaryView => ({
  products: toNumberOrNull(summary?.total_products) ?? 0,
  units: toNumberOrNull(summary?.total_units) ?? 0,
  value: toNumberOrNull(summary?.total_value) ?? 0,
  percentageOfStock: toNumberOrNull(summary?.percentage_of_stock) ?? 0,
  averageDaysIdle: toNumberOrNull(summary?.average_days_idle) ?? 0,
})

/** Filas sin `null` de Go. */
export const deadStockRows = (
  analysis: DeadStockAnalysis | null | undefined,
): DeadStockProduct[] => (Array.isArray(analysis?.products) ? analysis.products : [])
