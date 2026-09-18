/**
 * Transformations for the PayablesDashboard page: KPI cards, aging bars and
 * stats, upcoming payments calendar and supplier debt rows.
 * Extracted from the page's five inline useMemos
 * (PLAN_ALINEACION_BI_FRONTEND F1). Legacy Spanish labels stay until FASE 4.
 */
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { PayablesOverviewLike } from './aging'

interface OverviewWithExtras extends PayablesOverviewLike {
  total_overdue?: number | null
  overdue_count?: number | null
  due_this_week?: number | null
  payment_rate?: number | null
  currency?: string | null
}

export interface PayablesKpiCard {
  id: string
  title: string
  value: number | null | undefined
  currency?: string | null
  icon: string
  subtitle?: string
  trend?: string
  trendType?: string
  critical?: boolean
  isPercentage?: boolean
  progress?: number | null
}

/** KPI cards of the payables dashboard; [] without overview. */
export const buildPayablesKpis = (
  overview: OverviewWithExtras | null | undefined,
): PayablesKpiCard[] => {
  if (!overview) return []
  return [
    {
      id: 'total-pending',
      title: 'Total Pendiente',
      value: overview.total_pending,
      currency: overview.currency,
      icon: 'account_balance_wallet',
      subtitle: 'Capital comprometido',
    },
    {
      id: 'total-overdue',
      title: 'Total Vencido',
      value: overview.total_overdue,
      currency: overview.currency,
      trend: `${overview.overdue_count} facturas`,
      trendType: 'danger',
      icon: 'priority_high',
      subtitle: 'Acción inmediata requerida',
      critical: true,
    },
    {
      id: 'weekly-payments',
      title: 'Pagos esta Semana',
      value: overview.due_this_week,
      currency: overview.currency,
      icon: 'calendar_today',
      subtitle: 'Flujo proyectado 7 días',
    },
    {
      id: 'compliance-rate',
      title: 'Tasa de Cumplimiento',
      value: overview.payment_rate,
      isPercentage: true,
      icon: 'speed',
      progress: overview.payment_rate,
    },
  ]
}

export interface PayablesAgingBar {
  label: string
  amount: number | null | undefined
  percentage: number | null | undefined
  color: string
  critical?: boolean
}

/** Aging bars from the overview aging summary; [] without it. */
export const buildAgingBars = (
  overview: PayablesOverviewLike | null | undefined,
): PayablesAgingBar[] => {
  if (!overview?.aging_summary) return []
  const summary = overview.aging_summary
  return [
    { label: '0 - 30 Días', amount: summary.current?.amount, percentage: summary.current?.percentage, color: 'bg-primary' },
    { label: '31 - 60 Días', amount: summary.days_30_60?.amount, percentage: summary.days_30_60?.percentage, color: 'bg-primary/70' },
    { label: '61 - 90 Días', amount: summary.days_60_90?.amount, percentage: summary.days_60_90?.percentage, color: 'bg-fluent-warning' },
    { label: 'Más de 90 Días', amount: summary.over_90_days?.amount, percentage: summary.over_90_days?.percentage, color: 'bg-fluent-danger', critical: true },
  ]
}

export interface PayablesAgingStats {
  total?: string
  onTime?: string
  critical?: string
  avgDays?: string
}

/** Compact summary stats under the aging bars; {} without overview. */
export const buildAgingStats = (
  overview: OverviewWithExtras | null | undefined,
): PayablesAgingStats => {
  if (!overview) return {}
  return {
    total: formatPYG(overview.total_pending ?? 0, { compact: true }),
    onTime: `${formatNumber(overview.payment_rate ?? 0)}%`,
    critical: `${formatNumber(overview.aging_summary?.over_90_days?.percentage || 0)}%`,
    avgDays: `${Math.round(overview.average_days_to_pay || 0)} Días`,
  }
}

export interface PayablesScheduleEntry {
  date?: string | null
  items?: Array<{
    payable_id?: string
    supplier_name?: string
    purchase_order_id?: string | number
    amount?: number | null
    priority?: string | null
  }> | null
  [key: string]: unknown
}

export interface PayablesPaymentCard {
  id: string | undefined
  date: { month: string; day: string }
  vendor: string | undefined
  invoice: string
  amount: number | null | undefined
  status: 'Urgente' | 'Programado'
  statusType: 'danger' | 'info'
}

const ES_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** Upcoming payments cards from the schedule; [] when empty. */
export const buildUpcomingPayments = (
  schedule: PayablesScheduleEntry[] | null | undefined,
): PayablesPaymentCard[] => {
  if (!schedule || schedule.length === 0) return []

  return schedule
    .map((s) => {
      const item = s.items?.[0]
      if (!item) return null

      const date = new Date(s.date as string)
      return {
        id: item.payable_id,
        date: { month: ES_MONTHS[date.getMonth()], day: date.getDate().toString() },
        vendor: item.supplier_name,
        invoice: item.purchase_order_id
          ? `#${item.purchase_order_id}`
          : `#FAC-${(item.payable_id || '').split('_')[1] || '000'}`,
        amount: item.amount,
        status: (item.priority === 'HIGH' || item.priority === 'URGENT' ? 'Urgente' : 'Programado') as PayablesPaymentCard['status'],
        statusType: (item.priority === 'HIGH' || item.priority === 'URGENT' ? 'danger' : 'info') as PayablesPaymentCard['statusType'],
      }
    })
    .filter(Boolean) as PayablesPaymentCard[]
}

export interface PayablesSupplierRow {
  supplier_id?: string | number
  supplier_name?: string | null
  supplier_ruc?: string | null
  total_pending?: number | null
  total_overdue?: number | null
  next_due_date?: string | null
  [key: string]: unknown
}

export interface PayablesVendorRow {
  id: PayablesSupplierRow['supplier_id']
  name: PayablesSupplierRow['supplier_name']
  rfc: string
  totalBalance: number | null | undefined
  overdueAmount: number | null | undefined
  nextPayment: string
  priority: 'Alta' | 'Media'
  priorityType: 'warning' | 'info'
}

/** Supplier debt table rows, locally filtered by name search. */
export const buildSuppliersDebtRows = (
  topSuppliers: PayablesSupplierRow[] | null | undefined,
  search: string,
): PayablesVendorRow[] => {
  if (!topSuppliers) return []

  // Filter locally by search if needed
  const filtered = search
    ? topSuppliers.filter((s) => (s.supplier_name || '').toLowerCase().includes(search.toLowerCase()))
    : topSuppliers

  return filtered.map((v) => ({
    id: v.supplier_id,
    name: v.supplier_name,
    rfc: v.supplier_ruc || 'N/A',
    totalBalance: v.total_pending,
    overdueAmount: v.total_overdue,
    nextPayment: v.next_due_date ? new Date(v.next_due_date).toLocaleDateString('es-PY') : 'Sin pagos pdtes.',
    priority: (v.total_overdue ?? 0) > 0 ? 'Alta' : 'Media',
    priorityType: ((v.total_overdue ?? 0) > 0 ? 'warning' : 'info') as PayablesVendorRow['priorityType'],
  }))
}
