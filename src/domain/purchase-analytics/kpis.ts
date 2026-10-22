/**
 * Derivaciones de KPIs de compras a partir de
 * `GET /purchase-analytics/performance?compare=true`.
 *
 * El único crecimiento real es el de `performance.comparison` (ventana previa
 * equivalente) — misma regla anti-«+0%» que ventas. Unidades y proveedores no
 * traen comparación (el BE no la calcula): `trend: null`, sin chip inventado.
 *
 * PENDING y moneda excluida viajan aparte del payload y se exponen como hints
 * (`Órdenes pendientes: N`), nunca dentro del total de compras.
 */
import type { PurchasePerformance } from '@/types/bi'
import { buildTrendView, type TrendView } from '@/domain/sales-analytics/kpis'

export type PurchaseKpiId = 'purchases' | 'orders' | 'avgOrder' | 'units' | 'suppliers'

export interface PurchaseKpiRow {
  id: PurchaseKpiId
  kind: 'money' | 'count' | 'units'
  value: number
  /** `null` cuando no hay base comparable o el dato no vino. */
  trend: TrendView | null
}

/** Hints de estado del rango: pendientes y compras excluidas por moneda. */
export interface PurchaseKpiHints {
  pendingOrders: number
  pendingAmount: number
  excludedOtherCurrency: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas del ledger de KPIs, en orden de lectura fijo. */
export const buildPurchaseKpiRows = (
  performance: PurchasePerformance | null | undefined,
): PurchaseKpiRow[] => {
  if (!performance) return []
  const comparison = performance.comparison

  return [
    {
      id: 'purchases',
      kind: 'money',
      value: toNumber(performance.total_purchases),
      trend: buildTrendView(comparison?.purchases_change, comparison?.purchases_change_pct),
    },
    {
      id: 'orders',
      kind: 'count',
      value: toNumber(performance.total_transactions),
      trend: buildTrendView(
        comparison?.transactions_change,
        comparison?.transactions_change_pct,
      ),
    },
    {
      id: 'avgOrder',
      kind: 'money',
      value: toNumber(performance.average_order),
      trend: buildTrendView(comparison?.order_change, comparison?.order_change_pct),
    },
    {
      id: 'units',
      kind: 'units',
      value: toNumber(performance.total_units),
      trend: null,
    },
    {
      id: 'suppliers',
      kind: 'count',
      value: toNumber(performance.unique_suppliers),
      trend: null,
    },
  ]
}

export const buildPurchaseKpiHints = (
  performance: PurchasePerformance | null | undefined,
): PurchaseKpiHints => ({
  pendingOrders: toNumber(performance?.pending_orders),
  pendingAmount: toNumber(performance?.pending_amount),
  excludedOtherCurrency: toNumber(performance?.excluded_other_currency),
})
