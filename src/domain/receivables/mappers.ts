/**
 * API → view mappers for receivables (list, overdue, detail, dashboard).
 * Extracted from useReceivablesMasterList.js, useOverdueAccounts.js,
 * useReceivableDetail.js and useReceivablesDashboard.js
 * (PLAN_ALINEACION_BI_FRONTEND F1). Pure functions — the hooks only fetch
 * and set state now.
 */
import { formatPYG } from '@/utils/currencyUtils'
import { getPriority } from './risk'

// ---------------------------------------------------------------------------
// Master list (useReceivablesMasterList)
// ---------------------------------------------------------------------------

/** Generates an avatar background color from the client name's first char. */
export const getAvatarColor = (name: string | null | undefined): string => {
  const colors = [
    '#dbeafe',
    '#fef3c7',
    '#e0e7ff',
    '#dcfce7',
    '#f3e8ff',
    '#fce7f3',
    '#fef2f2',
    '#ecfdf5',
    '#fef9c3',
    '#ddd6fe',
  ]
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

/** Maps the API status to the pill color used by the master list table. */
export const getStatusColor = (status: string | null | undefined): string => {
  const statusMap: Record<string, string> = {
    OVERDUE: 'red',
    PENDING: 'yellow',
    PARTIAL: 'blue',
    PAID: 'green',
  }
  return statusMap[status as string] || 'gray'
}

export interface ReceivableApiItem {
  id?: string | number
  sale_order_id?: string | number
  client_name?: string | null
  clientName?: string | null
  client_id?: string | number
  sale_date?: string | null
  due_date?: string | null
  original_amount?: number | null
  pending_amount?: number | null
  status?: string | null
  [key: string]: unknown
}

/** Master-list row shape expected by the table component. */
export const transformReceivableItem = (item: ReceivableApiItem) => {
  const clientName = item.client_name || item.clientName || 'Cliente Desconocido'
  return {
    id: item.id || item.sale_order_id,
    clientId: item.client_id || 'CLI-001',
    clientName: clientName,
    clientInitial: clientName.charAt(0).toUpperCase(),
    clientColor: getAvatarColor(clientName),
    issueDate: item.sale_date ? new Date(item.sale_date).toLocaleDateString('es-PY') : '',
    dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString('es-PY') : '',
    originalAmt: item.original_amount || 0,
    pendingAmt: item.pending_amount || 0,
    status: item.status,
    statusColor: getStatusColor(item.status),
  }
}

// ---------------------------------------------------------------------------
// Overdue accounts (useOverdueAccounts)
// ---------------------------------------------------------------------------

/** Generates client initials ('XX' fallback, first two words otherwise). */
export const getInitials = (name: string | null | undefined): string => {
  if (!name) return 'XX'
  const words = name.split(' ')
  return words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const AVATAR_BG_COLORS = ['#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff']

/**
 * Overdue-list mapper. Accepts both array and paginated-object responses;
 * enriches each row with priority, risk score and canned contact fields.
 */
export const transformApiResponse = (apiData: unknown): Array<Record<string, unknown>> => {
  // Handle both array and paginated object responses
  const items = (apiData as { items?: unknown })?.items || apiData || []

  if (!Array.isArray(items)) return []

  return items.map((item: Record<string, any>, idx: number) => ({
    id: item.id || item.sale_order_id,
    client: item.client_name,
    clientId: item.client_id,
    clientPhone: item.client_phone,
    amount: item.pending_amount,
    originalAmount: item.original_amount,
    paidAmount: item.paid_amount,
    daysOverdue: item.days_overdue,
    priority: getPriority(item.days_overdue),
    lastContact: 'Sin contacto',
    nextAction:
      item.days_overdue > 60 ? 'Llamar urgente' : 'Enviar recordatorio',
    riskScore: Math.min(100, item.days_overdue + 20),
    code: getInitials(item.client_name),
    bgColor: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
    days: `${item.days_overdue} días`,
    contactVia: 'Pendiente',
    saleDate: item.sale_date,
    dueDate: item.due_date,
    status: item.status,
  }))
}

// ---------------------------------------------------------------------------
// Receivable detail (useReceivableDetail)
// ---------------------------------------------------------------------------

const DETAIL_STATUS_LABELS: Record<string, string> = {
  OVERDUE: 'Overdue',
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
}

/** Detail-page mapper: nested client/transaction + payment history + feed. */
export const transformDetailData = (raw: Record<string, any>) => {
  return {
    id: raw.id || raw.sale_order_id,
    client: {
      id: raw.client_id || '',
      name: raw.client_name || '',
      contact: raw.client_name || '',
      email: raw.client_email || '',
      phone: raw.client_phone || '',
      address: raw.client_address || '',
    },
    transaction: {
      status: DETAIL_STATUS_LABELS[raw.status] || raw.status || '',
      issueDate: raw.sale_date?.split('T')[0] || '',
      dueDate: raw.due_date?.split('T')[0] || '',
      amount: formatPYG(raw.original_amount || 0),
      paid: formatPYG(raw.paid_amount || 0),
      balance: formatPYG(raw.pending_amount || 0),
      rawAmount: raw.original_amount || 0,
      rawPaid: raw.paid_amount || 0,
      rawBalance: raw.pending_amount || 0,
      daysOverdue: raw.days_overdue || 0,
    },
    paymentHistory: Array.isArray(raw.payment_history)
      ? raw.payment_history.map((p: Record<string, any>) => ({
          date: p.payment_date?.split('T')[0] || '',
          ref: p.reference || '—',
          method: p.payment_method || '',
          note: p.processed_by || '',
          amount: p.amount || 0,
        }))
      : [],
    activities: [
      ...(Array.isArray(raw.payment_history)
        ? raw.payment_history.map((p: Record<string, any>) => ({
            id: p.id || `pay-${p.payment_date}-${p.amount}`,
            type: 'PAYMENT',
            date: p.payment_date?.split('T')[0] || '',
            time: p.payment_date?.split('T')[1]?.substring(0, 5) || '',
            description: `Pago de ${formatPYG(p.amount)} recibido vía ${p.payment_method || 'Transferencia'}.`,
            user: p.processed_by || 'Sistema',
          }))
        : []),
      // Si el objeto tiene notas en metadata, incluirlas como actividad
      ...(raw.metadata?.notes
        ? [
            {
              id: 'note-0',
              type: 'NOTE',
              date: raw.sale_date?.split('T')[0] || new Date().toISOString().split('T')[0],
              description: raw.metadata.notes,
              user: raw.user_name || 'Vendedor',
            },
          ]
        : []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }
}

// ---------------------------------------------------------------------------
// Dashboard CxC (useReceivablesDashboard)
// ---------------------------------------------------------------------------

interface OverviewApiData {
  total_pending?: number
  total_overdue?: number
  collection_rate?: number
  total_count?: number
  overdue_count?: number
  average_days_to_collect?: number
  collection_trend?: unknown[]
}

/** /receivables/overview → SummaryCardsGrid shape. */
export const transformSummary = (apiData: OverviewApiData) => {
  const totalPending = apiData.total_pending ?? 0
  const overduePercentage =
    totalPending > 0
      ? ((apiData.total_overdue! / totalPending) * 100)
      : 0

  return {
    totalReceivables: {
      amount: apiData.total_pending || 0,
      trend: apiData.collection_rate || 0,
    },
    overdueAmount: {
      amount: apiData.total_overdue || 0,
      percentage: overduePercentage,
    },
    // Estos datos ahora están totalmente soportados y confirmados en el Swagger
    totalCount: apiData.total_count || 0,
    overdueCount: apiData.overdue_count || 0,
    avgDaysToCollect: Math.round(apiData.average_days_to_collect || 0),
    collectionRate: apiData.collection_rate || 0,
    collectionTrend: apiData.collection_trend || [],
  }
}

/** Recent invoices table rows for the CxC dashboard. */
export const transformRecentInvoices = (items: ReceivableApiItem[]) => {
  return items.map((item) => {
    const clientName = item.client_name || item.clientName || 'Cliente'
    return {
      id: item.id || item.sale_order_id,
      invoiceId: item.id || item.sale_order_id,
      clientId: item.client_id || 'CLI-001',
      client: clientName,
      issueDate: item.sale_date
        ? new Date(item.sale_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Pendiente',
      balance: item.pending_amount || 0,
      daysOverdue: (item as { days_overdue?: number }).days_overdue || 0,
      status: item.status,
      statusColor:
        item.status === 'OVERDUE'
          ? 'red'
          : item.status === 'PARTIAL'
            ? 'blue'
            : item.status === 'PENDING'
              ? 'yellow'
              : 'green',
    }
  })
}
