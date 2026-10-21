/**
 * Derivaciones puras de salud de inventario (F11).
 *
 * El BE calcula el riesgo con `days_until_stockout` (≤3 alto, ≤7 medio,
 * ≤14 bajo, resto sin riesgo), la reposición con
 * `projected_demand + safety_stock − current_stock` y la cobertura con
 * `stock / (demanda proyectada / días)`.
 *
 * `days_until_stockout = 999` es el CENTINELA del SQL para "sin velocidad de
 * venta" (no 999 días reales): se muestra como "sin ventas" y no se usa para
 * ordenar ni para afirmar una fecha de quiebre.
 */
import type { InventoryForecast, ProductInventoryForecast } from '@/types/bi'
import { STOCKOUT_SENTINEL_DAYS } from './constants'
import { toNumberOrNull, type ForecastKpiValue } from './format'

/** Máximo de alertas que se listan (el resto se resume con su conteo real). */
export const INVENTORY_ALERT_PREVIEW = 5

export interface InventoryAlertView {
  key: string
  productId: string
  productName: string
  type: string
  severity: string
  daysToAct: number | null
}

export interface InventoryRiskRow {
  id: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  value: number
}

export interface InventoryPageInfo {
  page: number
  totalPages: number
  totalItems: number
}

export const inventoryKpis = (
  forecast: InventoryForecast | null | undefined,
): ForecastKpiValue[] => {
  const summary = forecast?.summary
  return [
    { id: 'coverage', kind: 'decimal', value: toNumberOrNull(summary?.overall_coverage) },
    { id: 'currentStock', kind: 'count', value: toNumberOrNull(summary?.total_current_stock) },
    { id: 'projectedDemand', kind: 'count', value: toNumberOrNull(summary?.total_projected_demand) },
    { id: 'highRisk', kind: 'count', value: toNumberOrNull(summary?.high_risk_products) },
    { id: 'mediumRisk', kind: 'count', value: toNumberOrNull(summary?.medium_risk_products) },
    { id: 'totalProducts', kind: 'count', value: toNumberOrNull(summary?.total_products) },
  ]
}

/**
 * Conteos por estado de riesgo. El BE asigna exactamente un estado a cada
 * producto; `NONE` no viaja en el summary y se deriva del total (diferencia
 * exacta), igual que el resto de los conteos.
 */
export const inventoryRiskRows = (
  forecast: InventoryForecast | null | undefined,
): InventoryRiskRow[] => {
  const summary = forecast?.summary
  const high = toNumberOrNull(summary?.high_risk_products) ?? 0
  const medium = toNumberOrNull(summary?.medium_risk_products) ?? 0
  const low = toNumberOrNull(summary?.low_risk_products) ?? 0
  const total = toNumberOrNull(summary?.total_products) ?? high + medium + low
  return [
    { id: 'HIGH', value: high },
    { id: 'MEDIUM', value: medium },
    { id: 'LOW', value: low },
    { id: 'NONE', value: Math.max(0, total - high - medium - low) },
  ]
}

/** Días reales de quiebre; `999` (centinela) → `null`. */
export const inventoryStockoutDays = (
  product: ProductInventoryForecast | null | undefined,
): number | null => {
  const days = toNumberOrNull(product?.days_until_stockout)
  if (days === null || days >= STOCKOUT_SENTINEL_DAYS) return null
  return days
}

export const inventoryHasVelocity = (
  product: ProductInventoryForecast | null | undefined,
): boolean => (toNumberOrNull(product?.average_daily_sales) ?? 0) > 0

/** Alertas con el `type` crudo; la UI traduce y descarta el `message` español. */
export const inventoryAlertViews = (
  forecast: InventoryForecast | null | undefined,
  limit = INVENTORY_ALERT_PREVIEW,
): InventoryAlertView[] =>
  (forecast?.alerts ?? []).slice(0, Math.max(0, limit)).map((alert, index) => ({
    key: `${alert.product_id || 'alert'}-${alert.type}-${index}`,
    productId: alert.product_id,
    productName: alert.product_name,
    type: alert.type,
    severity: alert.severity,
    daysToAct: toNumberOrNull(alert.days_to_act),
  }))

export const inventoryAlertCounts = (
  forecast: InventoryForecast | null | undefined,
): { total: number; high: number; medium: number } => {
  const alerts = forecast?.alerts ?? []
  let high = 0
  let medium = 0
  for (const alert of alerts) {
    if (alert.severity === 'HIGH') high += 1
    else if (alert.severity === 'MEDIUM') medium += 1
  }
  return { total: alerts.length, high, medium }
}

/** Página server-side del listado de productos, con defaults seguros. */
export const inventoryPagination = (
  forecast: InventoryForecast | null | undefined,
): InventoryPageInfo => ({
  page: toNumberOrNull(forecast?.pagination?.page) ?? 1,
  totalPages: toNumberOrNull(forecast?.pagination?.total_pages) ?? 1,
  totalItems: toNumberOrNull(forecast?.pagination?.total_items) ?? 0,
})
