/**
 * Filas del ledger KPI de Reportes Financieros (F9).
 *
 * Toda cifra sale de un campo del payload; la presentación elige el
 * formateador por tipo. Los campos que el backend NO calcula (DSO, DPO,
 * rotaciones) no se convierten en KPIs: un 0 del repo no es una medición.
 */
import {
  formatCount,
  formatMoney,
  formatPercent,
  formatRatio,
  toNumberOrNull,
} from './format'
import type { FinancialHealthScore } from '@/types/bi'

export type FinanceKpiKind = 'money' | 'percent' | 'count' | 'ratio'

export interface FinanceKpiValue {
  id: string
  kind: FinanceKpiKind
  value: number | null
}

/** Cifra ya formateada según su tipo (`—` cuando el campo no existe). */
export const formatKpiValue = (kpi: FinanceKpiValue): string => {
  const numeric = toNumberOrNull(kpi.value)
  switch (kpi.kind) {
    case 'money':
      return formatMoney(numeric)
    case 'percent':
      return formatPercent(numeric)
    case 'count':
      return formatCount(numeric)
    case 'ratio':
      return formatRatio(numeric)
    default:
      return '—'
  }
}

export type HealthRatingKey = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

export const healthRatingKey = (rating: string | null | undefined): HealthRatingKey => {
  switch ((rating ?? '').toUpperCase()) {
    case 'EXCELLENT':
      return 'excellent'
    case 'GOOD':
      return 'good'
    case 'FAIR':
      return 'fair'
    case 'POOR':
      return 'poor'
    default:
      return 'unknown'
  }
}

export type HealthRatingTone = 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const HEALTH_RATING_TONE: Record<HealthRatingKey, HealthRatingTone> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'error',
  unknown: 'neutral',
}

/** KPIs del score de salud: score, ratio corriente, ratio rápido y margen. */
export const healthScoreKpis = (score: FinancialHealthScore): FinanceKpiValue[] => [
  { id: 'score', kind: 'count', value: score.score ?? null },
  { id: 'ratingCurrentRatio', kind: 'ratio', value: score.current_ratio ?? null },
  { id: 'ratingQuickRatio', kind: 'ratio', value: score.quick_ratio ?? null },
  { id: 'ratingNetMargin', kind: 'percent', value: score.net_margin ?? null },
  { id: 'ratingWorkingCapital', kind: 'money', value: score.working_capital ?? null },
]
