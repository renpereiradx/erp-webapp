/**
 * Filas del ledger KPI de Cuentas por Cobrar (F7).
 *
 * Toda cifra sale de un campo del payload; la capa de presentación solo elige
 * el formateador por tipo. Nada se deriva acá salvo la ausencia de historial
 * de pagos (`avg_days_to_pay` sin pagos es un 0 del BE, no un dato real).
 */
import type {
  ClientReceivables,
  ClientRisk,
  ReceivablesAgingReport,
  ReceivablesListSummary,
  ReceivablesOverview,
  ReceivablesStatistics,
} from '@/types/bi'
import {
  formatCount,
  formatDate,
  formatDays,
  formatMoney,
  formatPercent,
  isMissingDate,
  toNumberOrNull,
} from './format'
import { hasPaymentHistory } from './risk'
import { unclassifiedAgingAmount } from './aging'

export type ReceivablesKpiKind = 'money' | 'percent' | 'count' | 'days' | 'date'

export interface ReceivablesKpiValue {
  id: string
  kind: ReceivablesKpiKind
  /** Número para money/percent/count/days; ISO para date; null = ausente. */
  value: number | string | null
}

/** Cifra ya formateada según su tipo (`—` cuando el campo no existe). */
export const formatKpiValue = (
  kpi: ReceivablesKpiValue,
  locale?: string,
): string => {
  switch (kpi.kind) {
    case 'money':
      return formatMoney(toNumberOrNull(kpi.value))
    case 'percent':
      return formatPercent(toNumberOrNull(kpi.value))
    case 'count':
      return formatCount(toNumberOrNull(kpi.value))
    case 'days':
      return formatDays(toNumberOrNull(kpi.value))
    case 'date':
      return typeof kpi.value === 'string' && !isMissingDate(kpi.value)
        ? formatDate(kpi.value, locale)
        : '—'
    default:
      return '—'
  }
}

/** Cartera actual (snapshot a hoy): overview + summary global del listado. */
export const buildPortfolioKpis = (
  overview: ReceivablesOverview,
  summary: ReceivablesListSummary | null | undefined,
): ReceivablesKpiValue[] => [
  { id: 'pending', kind: 'money', value: summary?.total_pending ?? null },
  { id: 'overdue', kind: 'money', value: overview.total_overdue ?? null },
  { id: 'accounts', kind: 'count', value: overview.total_count ?? null },
  { id: 'overdueAccounts', kind: 'count', value: overview.overdue_count ?? null },
  { id: 'highPriority', kind: 'count', value: summary?.high_priority_count ?? null },
  { id: 'collectionRate', kind: 'percent', value: overview.collection_rate ?? null },
  { id: 'settledAge', kind: 'days', value: overview.average_days_to_collect ?? null },
]

/** Facturación y cobranzas del período (`/receivables/statistics`). */
export const buildPeriodKpis = (
  statistics: ReceivablesStatistics,
): ReceivablesKpiValue[] => [
  { id: 'billed', kind: 'money', value: statistics.total_billed ?? null },
  { id: 'collected', kind: 'money', value: statistics.total_collected ?? null },
  { id: 'periodCollectionRate', kind: 'percent', value: statistics.collection_rate ?? null },
  { id: 'periodDso', kind: 'days', value: statistics.average_dso ?? null },
  { id: 'periodOverdueShare', kind: 'percent', value: statistics.overdue_percentage ?? null },
]

/** Lista maestra: totales globales del set filtrado. */
export const buildListKpis = (
  summary: ReceivablesListSummary | null | undefined,
): ReceivablesKpiValue[] => [
  { id: 'listTotal', kind: 'money', value: summary?.total_amount ?? null },
  { id: 'listPending', kind: 'money', value: summary?.total_pending ?? null },
  { id: 'listPaid', kind: 'money', value: summary?.total_paid ?? null },
  { id: 'listCount', kind: 'count', value: summary?.item_count ?? null },
  { id: 'listHighPriority', kind: 'count', value: summary?.high_priority_count ?? null },
]

/** Vencidas: summary global del set filtrado (`status=OVERDUE`). */
export const buildOverdueKpis = (
  summary: ReceivablesListSummary | null | undefined,
): ReceivablesKpiValue[] => [
  { id: 'overduePending', kind: 'money', value: summary?.total_pending ?? null },
  { id: 'overdueAccounts', kind: 'count', value: summary?.item_count ?? null },
  { id: 'overdueHighPriority', kind: 'count', value: summary?.high_priority_count ?? null },
  { id: 'overduePaid', kind: 'money', value: summary?.total_paid ?? null },
]

/** Reporte de antigüedad: totales globales del set completo. */
export const buildAgingKpis = (report: ReceivablesAgingReport): ReceivablesKpiValue[] => {
  const kpis: ReceivablesKpiValue[] = [
    { id: 'agingTotal', kind: 'money', value: report.total_amount ?? null },
    { id: 'agingClients', kind: 'count', value: report.total_clients ?? null },
    { id: 'agingOver90', kind: 'money', value: report.summary?.over_90_days?.amount ?? null },
  ]
  const unclassified = unclassifiedAgingAmount(report.total_amount, report.summary)
  if (unclassified > 0) {
    kpis.push({ id: 'agingUnclassified', kind: 'money', value: unclassified })
  }
  return kpis
}

/** Ficha de crédito: cartera del cliente + métricas del análisis de riesgo. */
export const buildClientKpis = (
  client: ClientReceivables,
  risk: ClientRisk | null | undefined,
): ReceivablesKpiValue[] => [
  { id: 'clientPending', kind: 'money', value: client.total_pending ?? null },
  { id: 'clientOverdue', kind: 'money', value: client.total_overdue ?? null },
  { id: 'clientPendingOrders', kind: 'count', value: client.pending_count ?? null },
  { id: 'clientOldest', kind: 'date', value: client.oldest_debt ?? null },
  { id: 'clientMaxAge', kind: 'days', value: risk?.max_days_overdue ?? null },
  { id: 'clientAvgAge', kind: 'days', value: risk?.avg_days_outstanding ?? null },
  { id: 'clientOver90', kind: 'money', value: risk?.total_over_90_amount ?? null },
  { id: 'clientPayments', kind: 'count', value: risk?.total_payments ?? null },
  {
    id: 'clientAvgDaysToPay',
    kind: 'days',
    // Sin pagos el BE promedio 0 días → EXCELLENT; se muestra `—`.
    value: hasPaymentHistory(risk) ? (risk?.avg_days_to_pay ?? null) : null,
  },
]
