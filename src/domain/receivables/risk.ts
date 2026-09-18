/**
 * Risk heuristics for receivables (priority, stats, styles, client level).
 * Extracted from useOverdueAccounts.js, RiskGauge.jsx and the AP aging hook
 * rescued from deletion (PLAN_ALINEACION_BI_FRONTEND F1).
 * No React, no i18n — labels stay as the legacy Spanish strings until the
 * consuming pages are migrated (FASE 3, decisión D6).
 */

export type ReceivablePriority = 'High' | 'Medium' | 'Low'

/** Priority by days overdue: High > 60, Medium > 30, else Low. */
export const getPriority = (daysOverdue: number | null | undefined): ReceivablePriority => {
  if ((daysOverdue ?? 0) > 60) return 'High'
  if ((daysOverdue ?? 0) > 30) return 'Medium'
  return 'Low'
}

/** Account shape produced by mappers.transformApiResponse. */
export interface OverdueAccountLike {
  amount?: number | null
  priority?: string | null
  originalAmount?: number | null
  paidAmount?: number | null
}

export interface OverdueStats {
  totalOverdue: number
  atRisk: number
  efficiency: number
  totalAccounts: number
}

/** Portfolio stats: overdue total, high-priority count and payment efficiency. */
export const calculateStats = (accounts: OverdueAccountLike[]): OverdueStats => {
  if (!accounts.length) {
    return {
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      totalAccounts: 0,
    }
  }

  const totalOverdue = accounts.reduce((sum, acc) => sum + (acc.amount || 0), 0)
  const atRisk = accounts.filter((acc) => acc.priority === 'High').length
  // Efficiency is percentage of partial payments vs total
  const totalOriginal = accounts.reduce((sum, acc) => sum + (acc.originalAmount || 0), 0)
  const totalPaid = accounts.reduce((sum, acc) => sum + (acc.paidAmount || 0), 0)
  const efficiency = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0

  return {
    totalOverdue,
    atRisk,
    efficiency,
    totalAccounts: accounts.length,
  }
}

export interface RiskStyles {
  color: string
  bg: string
  label: string
  dot: string
}

/** Visual styles for the risk gauge, by level (EN or ES accepted). */
export const getRiskStyles = (lvl: string | null | undefined): RiskStyles => {
  switch (lvl?.toLowerCase()) {
    case 'low':
    case 'bajo':
      return { color: 'text-green-500', bg: 'bg-green-100 text-green-800', label: 'Riesgo Bajo', dot: 'bg-green-500' }
    case 'high':
    case 'alto':
      return { color: 'text-red-500', bg: 'bg-red-100 text-red-800', label: 'Riesgo Alto', dot: 'bg-red-500' }
    default:
      return { color: 'text-yellow-500', bg: 'bg-yellow-100 text-yellow-800', label: 'Riesgo Medio', dot: 'bg-yellow-500' }
  }
}

/** Client row of the aging summary endpoint (days-bucket shape). */
export interface AgingSummaryClient {
  days_30_60?: number | null
  days_60_90?: number | null
  over_90_days?: number | null
  total?: number | null
}

export type ClientRiskLevel = 'Crítico' | 'Moderado' | 'Mínimo'

/**
 * Client risk level from its aging breakdown: 'Crítico' with any debt over
 * 90 days, 'Moderado' when more than 30% of the balance is overdue,
 * 'Mínimo' otherwise. (Rescued from the deleted AP aging hook, F0.)
 */
export const getRiskLevel = (client: AgingSummaryClient): ClientRiskLevel => {
  const overduePercentage =
    (((client.days_30_60 ?? 0) + (client.days_60_90 ?? 0) + (client.over_90_days ?? 0)) /
      (client.total || 0)) *
    100
  if ((client.over_90_days ?? 0) > 0) return 'Crítico'
  if (overduePercentage > 30) return 'Moderado'
  return 'Mínimo'
}
