/**
 * Clientes rentables (F6).
 *
 * El reporte no acepta búsqueda ni orden: el SQL ordena por beneficio. La
 * antigüedad de la última compra se DERIVA de `last_purchase` porque el campo
 * `days_since_last_purchase` del BE usaba EXTRACT(DAY) (componente día del
 * intervalo, no total de días). `customer_type` es una constante 'REGULAR'
 * del SQL y no se muestra; `top_customers_pct` nunca se calcula.
 */
import type { CustomerProfitabilityRow } from '@/types/bi'
import { daysSince, toNumberOrNull } from './format'

export type CustomerSegmentKey = 'platinum' | 'gold' | 'silver' | 'bronze'
export type CustomerSegmentTone = 'primary' | 'success' | 'warning' | 'neutral'

const SEGMENTS: Record<string, CustomerSegmentKey> = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
}

const SEGMENT_TONES: Record<CustomerSegmentKey, CustomerSegmentTone> = {
  platinum: 'primary',
  gold: 'warning',
  silver: 'neutral',
  bronze: 'neutral',
}

export const segmentKey = (segment: string | null | undefined): CustomerSegmentKey | null => {
  if (!segment) return null
  return SEGMENTS[segment.toUpperCase()] ?? null
}

export const segmentTone = (key: CustomerSegmentKey): CustomerSegmentTone => SEGMENT_TONES[key]

/** Nombre visible: el BE usa `first_name`; si viene vacío, el id. */
export const customerName = (row: CustomerProfitabilityRow): string => {
  const name = (row.customer_name ?? '').trim()
  return name || row.customer_id
}

export const customerRows = (
  rows: CustomerProfitabilityRow[] | null | undefined,
): CustomerProfitabilityRow[] => (Array.isArray(rows) ? rows : [])

/** Días desde la última compra; `null` si la fecha es inválida. */
export const customerRecencyDays = (
  row: CustomerProfitabilityRow,
  now: Date = new Date(),
): number | null => daysSince(row.last_purchase, now)

/** La contribución solo tiene sentido con beneficio total positivo. */
export const customerContributionAvailable = (
  totalProfit: number | null | undefined,
): boolean => (toNumberOrNull(totalProfit) ?? 0) > 0
