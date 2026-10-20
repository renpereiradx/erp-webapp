/**
 * Pure derivations for `/dashboard/trends` (comparación con el período previo).
 *
 * Solo se exponen las métricas cuyo significado coincide 1:1 con la UI:
 * ventas, compras y ticket promedio. `gross_margin` y `customer_count` se
 * omiten a propósito: el backend calcula `gross_margin` como
 * (ventas − compras) / ventas (distinto del margen del summary, que usa COGS)
 * y llena `customer_count` con la cantidad de ventas, no de clientes. Mostrar
 * esos valores con el label del JSON sería una cifra engañosa.
 */

import type { DashboardTrends, TrendData } from '@/types/bi'

export type TrendMetricKey = 'sales' | 'purchases' | 'average_ticket'

export interface TrendMetricView {
  key: TrendMetricKey
  kind: 'money' | 'number'
  current: number
  previous: number
  changeAmount: number
  changePercentage: number
  trend: 'up' | 'down' | 'stable'
}

const asAmount = (value: number | null | undefined): number =>
  Number.isFinite(value) ? Number(value) : 0

const normalizeTrend = (data: TrendData | null | undefined): 'up' | 'down' | 'stable' => {
  if (!data) return 'stable'
  if (data.trend === 'up' || data.trend === 'down' || data.trend === 'stable') return data.trend
  if (data.change_percentage > 1) return 'up'
  if (data.change_percentage < -1) return 'down'
  return 'stable'
}

const toView = (
  key: TrendMetricKey,
  kind: TrendMetricView['kind'],
  data: TrendData | null | undefined,
): TrendMetricView => ({
  key,
  kind,
  current: asAmount(data?.current),
  previous: asAmount(data?.previous),
  changeAmount: asAmount(data?.change_amount),
  changePercentage: asAmount(data?.change_percentage),
  trend: normalizeTrend(data),
})

/** Filas comparativas del panel de tendencias, en orden de lectura fijo. */
export const buildTrendViews = (trends: DashboardTrends | null | undefined): TrendMetricView[] => {
  if (!trends) return []
  return [
    toView('sales', 'money', trends.sales),
    toView('purchases', 'money', trends.purchases),
    toView('average_ticket', 'money', trends.average_ticket),
  ]
}

/** Redondeo de presentación para porcentajes (evita "-63.017946%" en UI). */
export const roundPercentage = (value: number | null | undefined, decimals = 1): number => {
  const numeric = asAmount(value)
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}
