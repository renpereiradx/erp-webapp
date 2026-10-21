/**
 * Filas del ledger KPI de Cuentas por Pagar (F8).
 *
 * Toda cifra sale de un campo del payload; la capa de presentación solo elige
 * el formateador por tipo. Nada se deriva acá salvo las ausencias reales
 * (`total_count` del página vs. página) y los totales de tramos del aging.
 */
import type {
  BIPaginationInfo,
  CashFlowProjection,
  PayablesAgingReport,
  PayablesAgingSummary,
  PayablesListSummary,
  PayablesOverview,
  PayablesStatistics,
  PaymentCalendar,
  SupplierAnalysis,
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
import { agingBucketsTotal, agingUnclassifiedAmount } from './aging'

export type PayablesKpiKind = 'money' | 'percent' | 'count' | 'days' | 'date'

export interface PayablesKpiValue {
  id: string
  kind: PayablesKpiKind
  /** Número para money/percent/count/days; ISO para date; null = ausente. */
  value: number | string | null
}

/** Cifra ya formateada según su tipo (`—` cuando el campo no existe). */
export const formatKpiValue = (kpi: PayablesKpiValue, locale?: string): string => {
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

/**
 * Cartera actual (snapshot a hoy).
 *
 * `overview.total_pending` suma pendientes NEGATIVOS de órdenes sobrepagadas
 * (en dev difieren Gs. 400.000 del listado y del aging, y el saldo pendiente
 * quedaba por debajo del vencido). La cartera que coincide con el listado y el
 * aging es el total de los tramos, que excluye esas órdenes; se usa ese valor
 * y se cae al campo del overview solo si el resumen de aging no viniera.
 */
export const buildPortfolioKpis = (overview: PayablesOverview): PayablesKpiValue[] => {
  const classified = agingBucketsTotal(overview.aging_summary)
  const pending = overview.aging_summary ? classified : (overview.total_pending ?? null)
  return [
  { id: 'pending', kind: 'money', value: pending },
  { id: 'overdue', kind: 'money', value: overview.total_overdue ?? null },
  { id: 'accounts', kind: 'count', value: overview.total_count ?? null },
  { id: 'overdueAccounts', kind: 'count', value: overview.overdue_count ?? null },
  { id: 'dueThisWeek', kind: 'money', value: overview.due_this_week ?? null },
  { id: 'dueThisMonth', kind: 'money', value: overview.due_this_month ?? null },
  { id: 'paymentRate', kind: 'percent', value: overview.payment_rate ?? null },
  { id: 'settledAge', kind: 'days', value: overview.average_days_to_pay ?? null },
  ]
}

/** Compras y pagos del período (`/payables/statistics`). */
export const buildPeriodKpis = (statistics: PayablesStatistics): PayablesKpiValue[] => [
  { id: 'purchased', kind: 'money', value: statistics.total_purchased ?? null },
  { id: 'paid', kind: 'money', value: statistics.total_paid ?? null },
  { id: 'periodPaymentRate', kind: 'percent', value: statistics.payment_rate ?? null },
  { id: 'periodDpo', kind: 'days', value: statistics.average_dpo ?? null },
  { id: 'periodOverdueShare', kind: 'percent', value: statistics.overdue_percentage ?? null },
]

/** Lista maestra: totales globales del set filtrado. */
export const buildListKpis = (
  summary: PayablesListSummary | null | undefined,
  pagination: BIPaginationInfo | null | undefined,
): PayablesKpiValue[] => [
  { id: 'listTotal', kind: 'money', value: summary?.total_amount ?? null },
  { id: 'listPending', kind: 'money', value: summary?.total_pending ?? null },
  { id: 'listPaid', kind: 'money', value: summary?.total_paid ?? null },
  // `summary.item_count` son las filas de la página; el conteo del filtro es
  // `pagination.total_items`.
  { id: 'listCount', kind: 'count', value: pagination?.total_items ?? null },
]

/** Calendario de pagos: totales de la ventana aplicada. */
export const buildScheduleKpis = (calendar: PaymentCalendar): PayablesKpiValue[] => {
  const schedule = Array.isArray(calendar.schedule) ? calendar.schedule : []
  const items = schedule.reduce((sum, day) => sum + (day.item_count ?? 0), 0)
  return [
    { id: 'scheduleTotal', kind: 'money', value: calendar.total_due ?? null },
    { id: 'scheduleDays', kind: 'count', value: schedule.length },
    { id: 'scheduleItems', kind: 'count', value: items },
  ]
}

/** Flujo proyectado (`/payables/cash-flow`). */
export const buildCashFlowKpis = (projection: CashFlowProjection): PayablesKpiValue[] => [
  { id: 'inflows', kind: 'money', value: projection.expected_inflows ?? null },
  { id: 'outflows', kind: 'money', value: projection.expected_outflows ?? null },
  { id: 'netFlow', kind: 'money', value: projection.net_cash_flow ?? null },
  { id: 'cumulative', kind: 'money', value: projection.cumulative_flow ?? null },
]

/**
 * Reporte de antigüedad: totales globales. El total de los tramos se muestra
 * por separado cuando difiere del `total_amount` (sobrepagos excluidos).
 */
export const buildAgingKpis = (report: PayablesAgingReport): PayablesKpiValue[] => {
  const kpis: PayablesKpiValue[] = [
    { id: 'agingTotal', kind: 'money', value: report.total_amount ?? null },
    { id: 'agingSuppliers', kind: 'count', value: report.total_suppliers ?? null },
    { id: 'agingOver90', kind: 'money', value: report.summary?.over_90_days?.amount ?? null },
  ]
  const unclassified = agingUnclassifiedAmount(report.total_amount, report.summary)
  if (unclassified > 0) {
    kpis.push({ id: 'agingUnclassified', kind: 'money', value: unclassified })
  }
  return kpis
}

/** Ficha del proveedor: saldo, peso y comportamiento. */
export const buildSupplierKpis = (analysis: SupplierAnalysis): PayablesKpiValue[] => [
  { id: 'supplierPending', kind: 'money', value: analysis.total_pending ?? null },
  { id: 'supplierOverdue', kind: 'money', value: analysis.total_overdue ?? null },
  { id: 'supplierPendingCount', kind: 'count', value: analysis.pending_count ?? null },
  { id: 'supplierShare', kind: 'percent', value: analysis.share_percentage ?? null },
  { id: 'supplierAvgDays', kind: 'days', value: analysis.avg_days_to_pay ?? null },
  { id: 'supplierOldest', kind: 'date', value: analysis.oldest_debt ?? null },
]

/** Total del aging embebido en el overview (para el panel de tramos). */
export const agingTotalOf = (summary: PayablesAgingSummary | null | undefined): number =>
  agingBucketsTotal(summary)
