/**
 * Aging math for payables: report KPIs, global distribution, stacked-bar
 * segments and the per-supplier risk breakdown of PayablesAgingReport.
 * Extracted from pages/PayablesAgingReport.jsx (PLAN_ALINEACION_BI_FRONTEND
 * F1). Labels/classes stay legacy until FASE 4 migrates the page.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'

interface AgingBucketAmounts {
  amount?: number | null
  percentage?: number | null
}

export interface PayablesOverviewLike {
  total_pending?: number | null
  average_days_to_pay?: number | null
  aging_summary?: {
    current?: AgingBucketAmounts
    days_30_60?: AgingBucketAmounts
    days_60_90?: AgingBucketAmounts
    over_90_days?: AgingBucketAmounts
  } | null
  [key: string]: unknown
}

export interface PayablesStatisticsLike {
  average_dpo?: number | null
  overdue_percentage?: number | null
  [key: string]: unknown
}

export interface AgingReportKpis {
  dpo: string
  overdue: string
  critical: string
}

/** Top KPI cards of the aging report; '---' shape when inputs are missing. */
export const buildAgingReportKpis = (
  overview: PayablesOverviewLike | null | undefined,
  statistics: PayablesStatisticsLike | null | undefined,
): AgingReportKpis => {
  if (!overview || !statistics) {
    return { dpo: '---', overdue: '---', critical: '---' }
  }
  return {
    dpo: `${Math.round(statistics.average_dpo || overview.average_days_to_pay || 0)} Días`,
    overdue: `${formatNumber(statistics.overdue_percentage || 0)}%`,
    critical: formatPYG(overview.aging_summary?.over_90_days?.amount || 0),
  }
}

export interface AgingDistribution {
  total: number | null | undefined
  current: { amount: number | null | undefined; percentage: number | null | undefined }
  days30_60: { amount: number | null | undefined; percentage: number | null | undefined }
  days60_90: { amount: number | null | undefined; percentage: number | null | undefined }
  over90: { amount: number | null | undefined; percentage: number | null | undefined }
}

/** Global distribution from the overview aging summary; null without it. */
export const buildAgingDistribution = (
  overview: PayablesOverviewLike | null | undefined,
): AgingDistribution | null => {
  if (!overview?.aging_summary) return null
  const summary = overview.aging_summary
  return {
    total: overview.total_pending,
    current: {
      amount: summary.current?.amount,
      percentage: summary.current?.percentage,
    },
    days30_60: {
      amount: summary.days_30_60?.amount,
      percentage: summary.days_30_60?.percentage,
    },
    days60_90: {
      amount: summary.days_60_90?.amount,
      percentage: summary.days_60_90?.percentage,
    },
    over90: {
      amount: summary.over_90_days?.amount,
      percentage: summary.over_90_days?.percentage,
    },
  }
}

export interface AgingSegment {
  key: 'current' | 'days30_60' | 'days60_90' | 'over90'
  label: string
  shortLabel: string
  percentage: number
  bgClass: string
  textClass: string
}

/** Stacked-bar segments from a distribution; [] when it is null. */
export const buildAgingSegments = (
  distribution: AgingDistribution | null | undefined,
): AgingSegment[] => {
  if (!distribution) return []

  return [
    {
      key: 'current',
      label: 'Corriente',
      shortLabel: '0-30 d',
      percentage: Number(distribution.current.percentage || 0),
      bgClass: 'bg-fluent-success',
      textClass: 'text-white',
    },
    {
      key: 'days30_60',
      label: 'Vencido',
      shortLabel: '31-60 d',
      percentage: Number(distribution.days30_60.percentage || 0),
      bgClass: 'bg-fluent-warning',
      textClass: 'text-slate-900',
    },
    {
      key: 'days60_90',
      label: 'Vencido',
      shortLabel: '61-90 d',
      percentage: Number(distribution.days60_90.percentage || 0),
      bgClass: 'bg-orange-500',
      textClass: 'text-white',
    },
    {
      key: 'over90',
      label: 'Crítico',
      shortLabel: '+90 d',
      percentage: Number(distribution.over90.percentage || 0),
      bgClass: 'bg-fluent-danger',
      textClass: 'text-white',
    },
  ]
}

export interface SupplierAgingRow {
  supplier_id?: string | number
  supplier_name?: string
  current?: number | null
  days_30_60?: number | null
  days_60_90?: number | null
  over_90_days?: number | null
  total?: number | null
  [key: string]: unknown
}

export type PayablesRiskLevel = 'Crítico' | 'Moderado' | 'Mínimo'

/**
 * Supplier risk of the aging report: 'Crítico' with any +90d debt,
 * 'Moderado' with 61-90d debt or when 31-60d exceeds half the total,
 * 'Mínimo' otherwise.
 */
export const getSupplierRisk = (
  s: Pick<SupplierAgingRow, 'over_90_days' | 'days_60_90' | 'days_30_60' | 'total'>,
): { risk: PayablesRiskLevel; riskClass: string } => {
  if ((s.over_90_days ?? 0) > 0) {
    return { risk: 'Crítico', riskClass: 'bg-fluent-danger/10 text-fluent-danger border-fluent-danger/20' }
  }
  if ((s.days_60_90 ?? 0) > 0 || (s.days_30_60 ?? 0) > (s.total ?? 0) * 0.5) {
    return { risk: 'Moderado', riskClass: 'bg-fluent-warning/10 text-fluent-warning border-fluent-warning/20' }
  }
  return { risk: 'Mínimo', riskClass: 'bg-fluent-success/10 text-fluent-success border-fluent-success/20' }
}

export interface SupplierAgingTableRow {
  id: SupplierAgingRow['supplier_id']
  name: SupplierAgingRow['supplier_name']
  current: number | null | undefined
  days30_60: number | null | undefined
  days60_90: number | null | undefined
  over90: number | null | undefined
  total: number | null | undefined
  risk: PayablesRiskLevel
  riskClass: string
}

/** Analytical table rows, locally filtered by supplier name. */
export const buildSupplierAgingRows = (
  bySupplier: SupplierAgingRow[] | null | undefined,
  searchTerm: string,
): SupplierAgingTableRow[] => {
  if (!bySupplier) return []

  const filtered = searchTerm
    ? bySupplier.filter((s) => (s.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : bySupplier

  return filtered.map((s) => {
    const { risk, riskClass } = getSupplierRisk(s)
    return {
      id: s.supplier_id,
      name: s.supplier_name,
      current: s.current,
      days30_60: s.days_30_60,
      days60_90: s.days_60_90,
      over90: s.over_90_days,
      total: s.total,
      risk,
      riskClass,
    }
  })
}
