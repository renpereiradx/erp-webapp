/** Contratos del análisis de proveedor (auditoría BI 2A: dto plano de
 * GET /payables/supplier/{id}/analysis + detalle de GET /payables/supplier/{id}). */

/** Factura pendiente del proveedor, ya mapeada para la tabla. */
export interface SupplierInvoiceRow {
  id: string;
  date: string;
  dueDate: string;
  originalAmount: number;
  pendingAmount: number;
  /** Clave estable del estado (la label la resuelve la tabla con i18n). */
  status: 'OVERDUE' | 'PARTIAL' | 'PAID' | 'PROCESS' | string;
  isOverdue: boolean;
}

export type PaymentHistoryColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

export interface SupplierAnalysisData {
  id: string;
  name: string;
  contact: string;
  /** Importancia traducida (Crítica/Alta/Media/Baja) o null si el BE no la envía. */
  importance: string | null;
  stats: {
    totalPending: number;
    totalOverdue: number;
    avgPaymentDays: number | null;
    activeInvoices: number;
    overdueCount: number;
    shareOfPayables: number;
  };
  rating: {
    historyLabel: string;
    color: PaymentHistoryColor;
    avgDays: number | null;
    description: string;
  };
  terms: {
    creditDays: number | null;
    oldestInvoice: string;
  };
  invoices: SupplierInvoiceRow[];
}

export interface SupplierTableStats {
  total: number;
  overdue: number;
}
