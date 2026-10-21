/**
 * Prorrateo de IVA (F9) — vista pura del contrato `/vat-prorrateo/*`.
 *
 * El coeficiente de deducibilidad viaja como fracción 0-1; la UI lo muestra
 * como porcentaje. Las porciones deducible/no deducible son montos, no
 * porcentajes. El historial puede venir `null` (sin períodos): es una lista
 * vacía, no un error.
 */
import type { ProrrateoDetail, ProrrateoPeriod } from '@/types/bi'
import { toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface ProrrateoRow {
  id: number
  periodStart: string
  periodEnd: string
  totalSales: number | null
  coefficientPct: number | null
  totalVatCredit: number | null
  deductible: number | null
  nonDeductible: number | null
  status: string
}

export const prorrateoRows = (
  history: ProrrateoPeriod[] | null | undefined,
): ProrrateoRow[] => {
  if (!Array.isArray(history)) return []
  return history
    .slice()
    .sort((a, b) => String(b.period_start).localeCompare(String(a.period_start)))
    .map((period) => {
      const coefficient = toNumberOrNull(period.deducibility_coefficient)
      return {
        id: period.id,
        periodStart: period.period_start,
        periodEnd: period.period_end,
        totalSales: toNumberOrNull(period.total_sales),
        coefficientPct: coefficient === null ? null : coefficient * 100,
        totalVatCredit: toNumberOrNull(period.total_vat_credit),
        deductible: toNumberOrNull(period.deductible_vat_credit),
        nonDeductible: toNumberOrNull(period.non_deductible_vat_credit),
        status: period.status ?? '',
      }
    })
}

/** KPIs del período de prorrateo seleccionado. */
export const prorrateoKpis = (period: ProrrateoPeriod | null | undefined): FinanceKpiValue[] => {
  if (!period) return []
  const coefficient = toNumberOrNull(period.deducibility_coefficient)
  return [
    { id: 'prorrateoTotalCredit', kind: 'money', value: toNumberOrNull(period.total_vat_credit) },
    { id: 'prorrateoDeductible', kind: 'money', value: toNumberOrNull(period.deductible_vat_credit) },
    {
      id: 'prorrateoNonDeductible',
      kind: 'money',
      value: toNumberOrNull(period.non_deductible_vat_credit),
    },
    {
      id: 'prorrateoCoefficient',
      kind: 'percent',
      value: coefficient === null ? null : coefficient * 100,
    },
  ]
}

export type ProrrateoStatusKey = 'pending' | 'processed' | 'closed' | 'cancelled' | 'unknown'

export const prorrateoStatusKey = (status: string | null | undefined): ProrrateoStatusKey => {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDING':
      return 'pending'
    case 'PROCESSED':
      return 'processed'
    case 'CLOSED':
      return 'closed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'unknown'
  }
}

export type ProrrateoTone = 'info' | 'success' | 'neutral' | 'error'

export const PRORRATEO_STATUS_TONE: Record<ProrrateoStatusKey, ProrrateoTone> = {
  pending: 'info',
  processed: 'success',
  closed: 'neutral',
  cancelled: 'error',
  unknown: 'neutral',
}

export type AllocationTypeKey = 'direct' | 'indirect' | 'exempt' | 'unknown'

export const allocationTypeKey = (
  type: string | null | undefined,
): AllocationTypeKey => {
  switch ((type ?? '').toUpperCase()) {
    case 'DIRECT':
      return 'direct'
    case 'INDIRECT':
      return 'indirect'
    case 'EXEMPT':
      return 'exempt'
    default:
      return 'unknown'
  }
}

export interface ProrrateoDetailRow extends ProrrateoDetail {
  allocation: AllocationTypeKey
}

export const prorrateoDetailRows = (
  details: ProrrateoDetail[] | null | undefined,
): ProrrateoDetailRow[] => {
  if (!Array.isArray(details)) return []
  return details.map((detail) => ({
    ...detail,
    allocation: allocationTypeKey(detail.allocation_type),
  }))
}
