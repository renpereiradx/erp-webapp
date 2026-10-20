/**
 * Vendedores rentables (F6).
 *
 * El SQL agrega a nivel de orden (COUNT DISTINCT) y suma detalles: no hay
 * fan-out de ingresos por línea. `rank` viene por beneficio; la contribución
 * se calcula contra el beneficio total del resumen.
 */
import type { SellerProfitabilityRow } from '@/types/bi'
import { toNumberOrNull } from './format'

export const sellerRows = (
  rows: SellerProfitabilityRow[] | null | undefined,
): SellerProfitabilityRow[] => (Array.isArray(rows) ? rows : [])

export const sellerName = (row: SellerProfitabilityRow): string => {
  const name = (row.seller_name ?? '').trim()
  return name || row.seller_id
}

/** La contribución solo se muestra cuando el beneficio total es positivo. */
export const sellerContributionAvailable = (
  totalProfit: number | null | undefined,
): boolean => (toNumberOrNull(totalProfit) ?? 0) > 0

/** Ranking real (por beneficio) útil para el badge de puesto. */
export const sellerRank = (row: SellerProfitabilityRow): number | null =>
  toNumberOrNull(row.rank)
