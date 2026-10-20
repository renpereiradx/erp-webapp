/**
 * Derivaciones de `GET /sales-analytics/by-customer`.
 *
 * Lo único que se muestra es lo que el BE calcula: resumen del período
 * (nuevos/recurrentes/retención) y valores históricos acotados al fin del
 * período (LTV y mayor cliente, BC-9). No hay crecimiento ni churn: los chips
 * de la pantalla vieja eran literales (auditoría 2026-09).
 */
import type { CustomerSalesSummary } from '@/types/bi'

export type CustomerSummaryId =
  | 'total'
  | 'new'
  | 'returning'
  | 'retention'
  | 'ltv'
  | 'topCustomer'

export interface CustomerSummaryItem {
  id: CustomerSummaryId
  kind: 'count' | 'percent' | 'money'
  value: number
  /** Conteo de apoyo (p. ej. recurrentes detrás del % de retención). */
  secondaryCount?: number
}

const toNumber = (value: number | null | undefined): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Tarjetas del resumen de clientes, en orden de lectura fijo. */
export const buildCustomerSummaryItems = (
  summary: CustomerSalesSummary | null | undefined,
): CustomerSummaryItem[] => {
  if (!summary) return []
  return [
    { id: 'total', kind: 'count', value: toNumber(summary.total_customers) },
    { id: 'new', kind: 'count', value: toNumber(summary.new_customers) },
    {
      id: 'returning',
      kind: 'count',
      value: toNumber(summary.returning_customers),
    },
    {
      id: 'retention',
      kind: 'percent',
      value: toNumber(summary.customer_retention_rate),
      secondaryCount: toNumber(summary.returning_customers),
    },
    { id: 'ltv', kind: 'money', value: toNumber(summary.average_lifetime_value) },
    { id: 'topCustomer', kind: 'money', value: toNumber(summary.top_customer_revenue) },
  ]
}

export type FrequencyKey = 'frequent' | 'regular' | 'occasional' | 'new' | 'unknown'
export type SegmentKey = 'vip' | 'premium' | 'standard' | 'new' | 'unknown'

/** `FREQUENT|REGULAR|OCCASIONAL|NEW` → clave i18n. */
export const frequencyKey = (value: string | null | undefined): FrequencyKey => {
  switch ((value || '').toUpperCase()) {
    case 'FREQUENT':
      return 'frequent'
    case 'REGULAR':
      return 'regular'
    case 'OCCASIONAL':
      return 'occasional'
    case 'NEW':
      return 'new'
    default:
      return 'unknown'
  }
}

/** `VIP|PREMIUM|STANDARD|NEW` → clave i18n. */
export const segmentKey = (value: string | null | undefined): SegmentKey => {
  switch ((value || '').toUpperCase()) {
    case 'VIP':
      return 'vip'
    case 'PREMIUM':
      return 'premium'
    case 'STANDARD':
      return 'standard'
    case 'NEW':
      return 'new'
    default:
      return 'unknown'
  }
}
