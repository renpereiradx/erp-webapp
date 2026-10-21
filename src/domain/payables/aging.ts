/**
 * Antigüedad de Cuentas por Pagar (F8).
 *
 * El BE mide la antigüedad desde la FECHA DE COMPRA (`NOW() - order_date`), NO
 * desde el vencimiento; los tramos son 0-30, 31-60, 61-90 y >90 días. Como el
 * vencimiento es `order_date + 30 días`, el tramo "corriente" coincide con lo
 * que todavía no venció, pero la UI no lo rotula "días vencidos".
 *
 * El resumen (`aging_summary`) incluye solo cuentas con saldo; los porcentajes
 * son del total de los tramos. Un `total_amount` mayor que la suma de tramos
 * deja un remanente sin clasificar (sobrepagos que el overview sí suma).
 */
import type { PayablesAgingSummary, SupplierAgingDetail } from '@/types/bi'

export interface PayablesAgingBucketRow {
  key: 'current' | 'days_30_60' | 'days_60_90' | 'over_90_days'
  amount: number
  count: number
  percentage: number
}

const BUCKET_KEYS: Array<PayablesAgingBucketRow['key']> = [
  'current',
  'days_30_60',
  'days_60_90',
  'over_90_days',
]

/** Filas de tramos con los valores reales del payload (sin recalcular %). */
export const agingBucketRows = (
  summary: PayablesAgingSummary | null | undefined,
): PayablesAgingBucketRow[] => {
  if (!summary) return []
  return BUCKET_KEYS.map((key) => {
    const bucket = summary[key]
    return {
      key,
      amount: Number(bucket?.amount ?? 0),
      count: Number(bucket?.count ?? 0),
      percentage: Number(bucket?.percentage ?? 0),
    }
  })
}

/** Suma de los tramos (el total que el aging efectivamente clasifica). */
export const agingBucketsTotal = (
  summary: PayablesAgingSummary | null | undefined,
): number => agingBucketRows(summary).reduce((sum, row) => sum + row.amount, 0)

/** Diferencia entre el total global y lo clasificado en tramos (sobrepagos). */
export const agingUnclassifiedAmount = (
  total: number | null | undefined,
  summary: PayablesAgingSummary | null | undefined,
): number => {
  const numeric = Number(total ?? 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round((numeric - agingBucketsTotal(summary)) * 100) / 100)
}

// --- Riesgo por proveedor ---------------------------------------------------

export type PayablesSupplierRiskKey = 'critical' | 'moderate' | 'minimal'

/**
 * Riesgo del proveedor según sus tramos: cualquier deuda >90 días es crítica;
 * 61-90 días o más de la mitad de la deuda en 31-60 es moderada; el resto
 * mínimo. Mismo criterio de la pantalla anterior, ahora sobre el contrato real.
 */
export const supplierRiskKey = (
  row: Pick<SupplierAgingDetail, 'over_90_days' | 'days_60_90' | 'days_30_60' | 'total'>,
): PayablesSupplierRiskKey => {
  if (Number(row.over_90_days ?? 0) > 0) return 'critical'
  if (
    Number(row.days_60_90 ?? 0) > 0 ||
    Number(row.days_30_60 ?? 0) > Number(row.total ?? 0) * 0.5
  ) {
    return 'moderate'
  }
  return 'minimal'
}

export interface SupplierAgingRow extends SupplierAgingDetail {
  risk: PayablesSupplierRiskKey
}

/** Filas del reporte con el riesgo derivado (el orden del BE se conserva). */
export const supplierAgingRows = (
  bySupplier: SupplierAgingDetail[] | null | undefined,
): SupplierAgingRow[] => {
  if (!Array.isArray(bySupplier)) return []
  return bySupplier.map((row) => ({ ...row, risk: supplierRiskKey(row) }))
}

export interface SupplierAgingPageTotals {
  current: number
  days30to60: number
  days60to90: number
  over90: number
  total: number
}

/** Suma de la página (no del set completo: el BE pagina por proveedor). */
export const supplierAgingPageTotals = (
  rows: Array<Pick<SupplierAgingDetail, 'current' | 'days_30_60' | 'days_60_90' | 'over_90_days' | 'total'>>,
): SupplierAgingPageTotals =>
  rows.reduce(
    (acc, row) => ({
      current: acc.current + Number(row.current ?? 0),
      days30to60: acc.days30to60 + Number(row.days_30_60 ?? 0),
      days60to90: acc.days60to90 + Number(row.days_60_90 ?? 0),
      over90: acc.over90 + Number(row.over_90_days ?? 0),
      total: acc.total + Number(row.total ?? 0),
    }),
    { current: 0, days30to60: 0, days60to90: 0, over90: 0, total: 0 },
  )

// --- Distribución para las barras ------------------------------------------

export interface AgingBar {
  key: PayablesAgingBucketRow['key']
  amount: number
  percentage: number
  tone: 'current' | 'warning' | 'critical'
}

/** Barras apiladas: mismo orden de lectura del reporte (0-30 → >90). */
export const agingBars = (summary: PayablesAgingSummary | null | undefined): AgingBar[] => {
  const toneByKey: Record<PayablesAgingBucketRow['key'], AgingBar['tone']> = {
    current: 'current',
    days_30_60: 'warning',
    days_60_90: 'warning',
    over_90_days: 'critical',
  }
  return agingBucketRows(summary).map((row) => ({
    key: row.key,
    amount: row.amount,
    percentage: row.percentage,
    tone: toneByKey[row.key],
  }))
}
