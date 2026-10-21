/**
 * Antigüedad (aging) de Cuentas por Cobrar (F7).
 *
 * El BE mide los tramos con DÍAS DESDE LA VENTA (`NOW() - sale_date`), no desde
 * el vencimiento: 0-30 / 31-60 / 61-90 / >90. La UI no renombra esa métrica a
 * "días vencidos" — eso es `days_overdue`, otro campo del listado.
 *
 * Las filas por cliente del reporte traen los montos planos (`current`,
 * `days_30_60`, …). Se expone un único tipo de fila con `amount` para que la
 * tabla y los totales se calculen igual que el resumen global.
 *
 * `unclassified`: si la suma de tramos no cubre el total (dato del BE), la
 * diferencia se muestra como "Sin clasificar" en vez de esconderla. Es una
 * salvaguarda de contrato, no un valor inventado.
 */
import type {
  ClientAgingDetail,
  ReceivablesAgingBucket,
  ReceivablesAgingSummary,
} from '@/types/bi'
import { daysSince } from './format'

export const AGING_BUCKET_KEYS = [
  'current',
  'days_30_60',
  'days_60_90',
  'over_90_days',
] as const

export type AgingBucketKey = (typeof AGING_BUCKET_KEYS)[number]

const EMPTY_BUCKET: ReceivablesAgingBucket = { amount: 0, count: 0, percentage: 0 }

/** Tolerancia en PYG para considerar que un tramo cuadra con el total. */
const EPSILON = 0.01

export interface AgingBucketRow {
  key: AgingBucketKey
  amount: number
  count: number
  percentage: number
}

const toSafeAmount = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const bucketOf = (
  summary: ReceivablesAgingSummary | null | undefined,
  key: AgingBucketKey,
): ReceivablesAgingBucket => summary?.[key] ?? EMPTY_BUCKET

/** Tramos del resumen, en orden de lectura (corriente → >90). */
export const agingBucketRows = (
  summary: ReceivablesAgingSummary | null | undefined,
): AgingBucketRow[] =>
  AGING_BUCKET_KEYS.map((key) => {
    const bucket = bucketOf(summary, key)
    return { key, ...bucket }
  })

/** Suma de montos de los 4 tramos (base de los porcentajes del BE). */
export const agingBucketsTotal = (
  summary: ReceivablesAgingSummary | null | undefined,
): number =>
  AGING_BUCKET_KEYS.reduce((total, key) => total + toSafeAmount(bucketOf(summary, key).amount), 0)

/**
 * Diferencia entre el total declarado y la suma de tramos. Solo se considera
 * "sin clasificar" cuando es positiva y supera el centavo; un total menor
 * (sobrepagos netos del overview) no se inventa como tramo.
 */
export const unclassifiedAgingAmount = (
  total: number | null | undefined,
  summary: ReceivablesAgingSummary | null | undefined,
): number => {
  const declared = Number(total)
  if (!Number.isFinite(declared)) return 0
  const diff = declared - agingBucketsTotal(summary)
  return diff > EPSILON ? diff : 0
}

/** Fila por cliente con el monto que la suma de tramos no cubre (0 si cuadra). */
export interface ClientAgingRow extends ClientAgingDetail {
  unclassified: number
}

export const clientAgingRow = (row: ClientAgingDetail): ClientAgingRow => {
  const buckets =
    toSafeAmount(row.current) +
    toSafeAmount(row.days_30_60) +
    toSafeAmount(row.days_60_90) +
    toSafeAmount(row.over_90_days)
  const total = toSafeAmount(row.total)
  const diff = total - buckets
  return { ...row, unclassified: diff > EPSILON ? diff : 0 }
}

export const clientAgingRows = (rows: ClientAgingDetail[] | null | undefined): ClientAgingRow[] =>
  Array.isArray(rows) ? rows.map(clientAgingRow) : []

export const hasUnclassifiedClientAging = (rows: ClientAgingRow[]): boolean =>
  rows.some((row) => row.unclassified > 0)

export interface ClientAgingPageTotals {
  current: number
  days_30_60: number
  days_60_90: number
  over_90_days: number
  unclassified: number
  total: number
}

/** Totales de la página actual (el total global lo informa el reporte). */
export const sumClientAgingPage = (rows: ClientAgingRow[]): ClientAgingPageTotals =>
  rows.reduce<ClientAgingPageTotals>(
    (totals, row) => ({
      current: totals.current + toSafeAmount(row.current),
      days_30_60: totals.days_30_60 + toSafeAmount(row.days_30_60),
      days_60_90: totals.days_60_90 + toSafeAmount(row.days_60_90),
      over_90_days: totals.over_90_days + toSafeAmount(row.over_90_days),
      unclassified: totals.unclassified + row.unclassified,
      total: totals.total + toSafeAmount(row.total),
    }),
    { current: 0, days_30_60: 0, days_60_90: 0, over_90_days: 0, unclassified: 0, total: 0 },
  )

/** Cuenta mínima para derivar antigüedad desde las cuentas de la ficha cliente. */
export interface InvoiceAgingInput {
  pending_amount: number
  sale_date: string
}

export interface InvoiceAgingBreakdown {
  rows: AgingBucketRow[]
  /** Pendiente cuya venta no se pudo fechar (dato inválido del BE). */
  unclassifiedAmount: number
  total: number
}

/**
 * Antigüedad de las cuentas listadas, derivada de `sale_date` (la definición
 * del BE). Reemplaza el cálculo viejo que usaba `due_date` — un campo que el
 * listado sintetiza como `sale_date + 30 días`.
 */
export const invoiceAgingBreakdown = (
  invoices: InvoiceAgingInput[] | null | undefined,
  now: Date = new Date(),
): InvoiceAgingBreakdown => {
  const amounts: Record<AgingBucketKey, number> = {
    current: 0,
    days_30_60: 0,
    days_60_90: 0,
    over_90_days: 0,
  }
  const counts: Record<AgingBucketKey, number> = {
    current: 0,
    days_30_60: 0,
    days_60_90: 0,
    over_90_days: 0,
  }
  let unclassifiedAmount = 0

  for (const invoice of invoices ?? []) {
    const amount = toSafeAmount(invoice.pending_amount)
    if (amount <= 0) continue
    const days = daysSince(invoice.sale_date, now)
    if (days === null) {
      unclassifiedAmount += amount
      continue
    }
    const key: AgingBucketKey =
      days <= 30
        ? 'current'
        : days <= 60
          ? 'days_30_60'
          : days <= 90
            ? 'days_60_90'
            : 'over_90_days'
    amounts[key] += amount
    counts[key] += 1
  }

  const total = AGING_BUCKET_KEYS.reduce((sum, key) => sum + amounts[key], 0) + unclassifiedAmount
  const rows = AGING_BUCKET_KEYS.map<AgingBucketRow>((key) => ({
    key,
    amount: amounts[key],
    count: counts[key],
    percentage: total > 0 ? (amounts[key] / total) * 100 : 0,
  }))

  return { rows, unclassifiedAmount, total }
}
