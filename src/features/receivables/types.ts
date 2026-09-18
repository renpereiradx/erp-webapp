/**
 * Contratos del feature de CxC (receivables). Las formas de fila provienen
 * de los mappers de src/domain/receivables/mappers.ts; los payloads del BE
 * son tolerantes (opcionales) y se documentan por hook.
 * PLAN_ALINEACION_BI_FRONTEND FASE 3.
 */

import type { AgingReportItem } from '@/types/bi'

// --- useReceivablesMasterList (transformReceivableItem) ---
export interface MasterListInvoice {
  id?: string | number
  clientId?: string | number
  clientName?: string
  clientInitial?: string
  clientColor?: string
  issueDate?: string
  dueDate?: string
  originalAmt?: number
  pendingAmt?: number
  status?: string | null
  statusColor?: string
}

// --- useOverdueAccounts (transformApiResponse + calculateStats) ---
export interface OverdueAccount {
  id?: string | number
  client?: string | null
  clientId?: string | number
  clientPhone?: string | null
  amount?: number | null
  originalAmount?: number | null
  paidAmount?: number | null
  daysOverdue?: number | null
  priority?: 'High' | 'Medium' | 'Low'
  lastContact?: string
  nextAction?: string
  riskScore?: number
  code?: string
  bgColor?: string
  days?: string
  contactVia?: string
  saleDate?: string | null
  dueDate?: string | null
  status?: string | null
}

// --- useReceivableDetail (transformDetailData) ---
export interface ReceivableDetailData {
  id?: string | number
  client: {
    id: string
    name: string
    contact: string
    email: string
    phone: string
    address: string
    /** Enriquecido opcional desde clientService (no viene del mapper). */
    taxId?: string
  }
  transaction: {
    status: string
    issueDate: string
    dueDate: string
    amount: string
    paid: string
    balance: string
    rawAmount: number
    rawPaid: number
    rawBalance: number
    daysOverdue: number
  }
  paymentHistory: Array<{
    date: string
    ref: string
    method: string
    note: string
    amount: number
  }>
  activities: Array<{
    id: string
    type: string
    date: string
    time?: string
    description: string
    user: string
  }>
}

// --- useReceivablesDashboard (transformSummary + transformRecentInvoices) ---
export interface DashboardSummary {
  totalReceivables: { amount: number; trend: number }
  overdueAmount: { amount: number; percentage: number }
  totalCount: number
  overdueCount: number
  avgDaysToCollect: number
  collectionRate: number
  collectionTrend: unknown[]
}

export interface RecentInvoice {
  id?: string | number
  invoiceId?: string | number
  clientId?: string | number
  client?: string
  issueDate?: string
  balance?: number
  daysOverdue?: number
  status?: string | null
  statusColor?: string
}

// --- useAgingReport (endpoints 1, 9 y 12 en paralelo) ---
export interface AgingReportBundle {
  overview: Record<string, any> | null
  detailed: AgingReportItem[] | null
  statistics: Record<string, any> | null
}

// --- useClientCreditProfile (perfil unificado, formas tolerantes) ---
export interface ClientCreditProfileBundle {
  client: {
    name: string
    id: string
    status: string
    address: string
    contact: string
    phone: string
    rep: string
    taxId: string
  }
  risk: {
    score: number | null
    level: string
    recommendation: string
  }
  metrics: {
    outstanding: string
    limit: string
    avgDays: string
    lastPayment: string
    utilization: number | null
  }
  aging: Array<{
    label: string
    amount: string
    colorClass: string
    percent: number
    width: string
  }>
  invoices: Array<{
    id: string | number | undefined
    date: string
    due: string
    amount: string
    balance: string
    status: string
  }>
}

/** Envelope opcional que los hooks toleran (`response.data || response`). */
export type LoosePayload = Record<string, unknown> | null | undefined
