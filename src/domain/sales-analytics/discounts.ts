/**
 * Reporte de descuentos (`GET /sales-analytics/discounts[/summary]`).
 *
 * El BE exige `start_date`/`end_date` (YYYY-MM-DD) y los interpreta como rango
 * inclusivo; el `metadata.end_date` que devuelve ya está corrido +1 día (es el
 * límite exclusivo de la query), por eso la UI muestra el rango APLICADO y no
 * el metadata. La fila se compone de precios UNITARIOS y un descuento de LÍNEA:
 * nunca se multiplica para "reconstruir" totales (fue la incoherencia
 * 100.000 → 105.690 de la auditoría).
 */
import type { DiscountGroupBy, DiscountSummaryRow } from '@/types/bi'
import { isValidDateRange, lastDaysRange } from './periods'

export const DISCOUNT_GROUPS: readonly DiscountGroupBy[] = ['seller', 'applier', 'branch']

export const DEFAULT_DISCOUNT_GROUP: DiscountGroupBy = 'applier'

export const isDiscountGroup = (value: unknown): value is DiscountGroupBy =>
  typeof value === 'string' && (DISCOUNT_GROUPS as readonly string[]).includes(value)

/** Rango inicial del reporte: últimos 30 días (día actual incluido). */
export const defaultDiscountRange = (today: Date): { start_date: string; end_date: string } =>
  lastDaysRange(today, 30)

export const validateDiscountRange = (start: string, end: string): boolean =>
  isValidDateRange(start, end)

export interface DiscountGroupView extends DiscountSummaryRow {
  /** Participación en el total descontado del rango (0-100). */
  share: number
}

export interface DiscountSummaryView {
  groups: DiscountGroupView[]
  totalDiscount: number
  totalCount: number
}

/** Totales + participación por grupo a partir del resumen del BE. */
export const buildDiscountSummaryView = (
  rows: DiscountSummaryRow[] | null | undefined,
): DiscountSummaryView => {
  const safeRows = (rows ?? []).map((row) => ({
    group_key: row.group_key,
    group_name: row.group_name || row.group_key || '—',
    discount_count: Number.isFinite(Number(row.discount_count)) ? Number(row.discount_count) : 0,
    total_discount: Number.isFinite(Number(row.total_discount)) ? Number(row.total_discount) : 0,
  }))
  const totalDiscount = safeRows.reduce((total, row) => total + row.total_discount, 0)
  const totalCount = safeRows.reduce((total, row) => total + row.discount_count, 0)
  return {
    groups: safeRows.map((row) => ({
      ...row,
      share: totalDiscount > 0 ? (row.total_discount / totalDiscount) * 100 : 0,
    })),
    totalDiscount,
    totalCount,
  }
}
