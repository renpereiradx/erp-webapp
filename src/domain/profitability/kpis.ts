/**
 * KPIs de Rentabilidad (F6).
 *
 * Cada fila lleva un `kind` para que la página formatee con el helper del
 * dominio. `value: null` = dato no calculado por el BE en esta ventana (se
 * muestra `—`), nunca un cero inventado.
 */
import type {
  CategoryProfitabilitySummary,
  CustomerProfitabilitySummary,
  ProductProfitabilitySummary,
  ProfitabilityKPIs,
  SellerProfitabilitySummary,
  ProfitabilityTrendPoint,
} from '@/types/bi'
import {
  formatCount,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  formatUnits,
  toNumberOrNull,
} from './format'

export type ProfitabilityKpiKind = 'money' | 'percent' | 'signedPercent' | 'count' | 'units'

export interface ProfitabilityKpiRow {
  id: string
  kind: ProfitabilityKpiKind
  value: number | null
  /** Se muestra `—` aunque el número exista (ej. denominador ausente). */
  unavailable?: boolean
}

const row = (
  id: string,
  kind: ProfitabilityKpiKind,
  value: number | null | undefined,
  unavailable = false,
): ProfitabilityKpiRow => ({
  id,
  kind,
  value: toNumberOrNull(value),
  unavailable,
})

const ratio = (numerator: number | null | undefined, denominator: number | null | undefined) => {
  const num = toNumberOrNull(numerator)
  const den = toNumberOrNull(denominator)
  if (num === null || den === null || den <= 0) return null
  return (num / den) * 100
}

/** KPIs del dashboard consolidado (ya vienen calculados por el BE). */
export const buildDashboardKpis = (
  kpis: ProfitabilityKPIs | null | undefined,
): ProfitabilityKpiRow[] => [
  row('revenue', 'money', kpis?.total_revenue),
  row('profit', 'money', kpis?.total_profit),
  row('grossMargin', 'percent', kpis?.gross_margin_pct),
  row('roi', 'percent', kpis?.roi),
  row(
    'profitPerTransaction',
    'money',
    kpis?.profit_per_transaction,
    (toNumberOrNull(kpis?.total_revenue) ?? 0) <= 0,
  ),
  row('revenueGrowth', 'signedPercent', kpis?.revenue_growth),
  row('profitGrowth', 'signedPercent', kpis?.profit_growth),
  row('marginChange', 'signedPercent', kpis?.margin_change),
]

/** KPIs del reporte de productos. El margen global se deriva de los totales. */
export const buildProductKpis = (
  summary: ProductProfitabilitySummary | null | undefined,
): ProfitabilityKpiRow[] => [
  row('totalProducts', 'count', summary?.total_products),
  row('profitableProducts', 'count', summary?.profitable_products),
  row('unprofitableProducts', 'count', summary?.unprofitable_products),
  row('totalRevenue', 'money', summary?.total_revenue),
  row('totalProfit', 'money', summary?.total_profit),
  row('globalMargin', 'percent', ratio(summary?.total_profit, summary?.total_revenue)),
  row('averageMargin', 'percent', summary?.average_margin, (summary?.total_products ?? 0) <= 0),
]

/** KPIs de clientes. No se muestra `active_customers` (espeja el total). */
export const buildCustomerKpis = (
  summary: CustomerProfitabilitySummary | null | undefined,
): ProfitabilityKpiRow[] => [
  row('totalCustomers', 'count', summary?.total_customers),
  row('profitableCustomers', 'count', summary?.profitable_customers),
  row(
    'unprofitableCustomers',
    'count',
    unprofitableCustomers(summary),
  ),
  row('totalProfit', 'money', summary?.total_profit),
  // El BE llama average_customer_value a la media de (revenue - cost): es
  // beneficio promedio por cliente, no ticket promedio. Se muestra una vez.
  row(
    'averageCustomerValue',
    'money',
    summary?.average_customer_value,
    (summary?.total_customers ?? 0) <= 0,
  ),
]

/** Clientes con beneficio <= 0: derivado de los dos conteos reales del BE. */
const unprofitableCustomers = (
  summary: CustomerProfitabilitySummary | null | undefined,
): number | null => {
  const total = toNumberOrNull(summary?.total_customers)
  const profitable = toNumberOrNull(summary?.profitable_customers)
  if (total === null || profitable === null || total < profitable) return null
  return total - profitable
}

/** KPIs de categorías. El beneficio total ya viene sumado por el BE. */
export const buildCategoryKpis = (
  summary: CategoryProfitabilitySummary | null | undefined,
): ProfitabilityKpiRow[] => [
  row('totalCategories', 'count', summary?.total_categories),
  row('totalProfit', 'money', summary?.total_profit),
  row('averageMargin', 'percent', summary?.average_margin, (summary?.total_categories ?? 0) <= 0),
]

/** KPIs de vendedores. */
export const buildSellerKpis = (
  summary: SellerProfitabilitySummary | null | undefined,
): ProfitabilityKpiRow[] => [
  row('totalSellers', 'count', summary?.total_sellers),
  row('totalProfit', 'money', summary?.total_profit),
  row('averageProfitPerSeller', 'money', summary?.average_profit_per_seller),
]

/** KPIs de la serie de tendencias; `points` ya viene normalizado. */
export const buildTrendKpis = (points: ProfitabilityTrendPoint[]): ProfitabilityKpiRow[] => {
  const totalRevenue = points.reduce((sum, point) => sum + (point.revenue || 0), 0)
  const totalProfit = points.reduce((sum, point) => sum + (point.gross_profit || 0), 0)
  const units = points.reduce((sum, point) => sum + (point.units_sold || 0), 0)
  return [
    row('points', 'count', points.length),
    row('totalRevenue', 'money', totalRevenue),
    row('totalProfit', 'money', totalProfit),
    row('units', 'units', units),
  ]
}

/** Formato final de una fila KPI (los textos de estado los pone la página). */
export const formatKpiValue = (row: ProfitabilityKpiRow): string => {
  if (row.unavailable || row.value === null) return '—'
  switch (row.kind) {
    case 'money':
      return formatMoney(row.value)
    case 'percent':
      return formatPercent(row.value)
    case 'signedPercent':
      return formatSignedPercent(row.value)
    case 'units':
      return formatUnits(row.value)
    case 'count':
    default:
      return formatCount(row.value)
  }
}
