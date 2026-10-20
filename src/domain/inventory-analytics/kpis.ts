/**
 * Filas de indicadores de inventario (F5).
 *
 * Solo campos reales del contrato: `value_change_pct`/`turnover_change_pct`
 * del dashboard viajan en 0 (el repo no los calcula) y no se convierten en
 * chips de variación. `days_of_inventory = 0` significa que no hubo costo de
 * ventas en la ventana (CASE del SQL), así que se marca `unavailable` en vez
 * de mostrar "0 días".
 */
import type {
  InventoryAnalyticsDashboard,
  InventoryOverview,
  TurnoverMetrics,
} from '@/types/bi'
import { toNumberOrNull } from './format'

export type InventoryKpiKind = 'money' | 'rate' | 'days' | 'percent'

export type InventoryKpiId =
  | 'totalValue'
  | 'potentialProfit'
  | 'turnoverRate'
  | 'daysOfInventory'
  | 'stockoutRate'
  | 'deadStockPct'

export interface InventoryKpiRow {
  id: InventoryKpiId
  kind: InventoryKpiKind
  value: number
  /** El BE no tiene base para calcularlo (no es un cero real). */
  unavailable?: boolean
  /** Costo del inventario, para el hint de `totalValue`. */
  secondaryMoney?: number
}

const numberOrZero = (value: unknown): number => toNumberOrNull(value) ?? 0

/** Ledger del dashboard: KPIs del consolidado + ganancia potencial del overview. */
export const buildInventoryDashboardKpis = (
  dashboard: InventoryAnalyticsDashboard | null | undefined,
  overview: InventoryOverview | null | undefined,
): InventoryKpiRow[] => {
  if (!dashboard) return []
  const kpis = dashboard.kpis
  const days = numberOrZero(kpis.days_of_inventory)
  const rows: InventoryKpiRow[] = [
    {
      id: 'totalValue',
      kind: 'money',
      value: numberOrZero(kpis.total_value),
      secondaryMoney: toNumberOrNull(overview?.total_cost) ?? undefined,
    },
  ]
  const potentialProfit = toNumberOrNull(overview?.potential_profit)
  if (potentialProfit !== null) {
    rows.push({ id: 'potentialProfit', kind: 'money', value: potentialProfit })
  }
  rows.push(
    {
      id: 'turnoverRate',
      kind: 'rate',
      value: numberOrZero(kpis.turnover_rate),
    },
    {
      id: 'daysOfInventory',
      kind: 'days',
      value: days,
      // 0 = el CASE del SQL no encontró costo de ventas en la ventana.
      unavailable: days <= 0,
    },
    {
      id: 'stockoutRate',
      kind: 'percent',
      value: numberOrZero(kpis.stockout_rate),
    },
    {
      id: 'deadStockPct',
      kind: 'percent',
      value: numberOrZero(kpis.dead_stock_pct),
    },
  )
  return rows
}

export type TurnoverKpiId = 'turnoverRate' | 'daysOfInventory' | 'inventoryCost' | 'cogs'

export interface TurnoverKpiRow {
  id: TurnoverKpiId
  kind: InventoryKpiKind
  value: number
  unavailable?: boolean
}

/**
 * Ledger de rotación del período. `average_inventory` se rotula como valor
 * actual a costo (el nombre del modelo es heredado y engañoso).
 */
export const buildTurnoverKpis = (
  overall: TurnoverMetrics | null | undefined,
): TurnoverKpiRow[] => {
  if (!overall) return []
  const cogs = numberOrZero(overall.cost_of_goods_sold)
  const days = numberOrZero(overall.days_of_inventory)
  return [
    { id: 'turnoverRate', kind: 'rate', value: numberOrZero(overall.turnover_rate) },
    {
      id: 'daysOfInventory',
      kind: 'days',
      value: days,
      unavailable: cogs <= 0 || days <= 0,
    },
    {
      id: 'inventoryCost',
      kind: 'money',
      value: numberOrZero(overall.average_inventory),
    },
    { id: 'cogs', kind: 'money', value: cogs },
  ]
}
