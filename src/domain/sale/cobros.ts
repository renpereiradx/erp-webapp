/**
 * cobros — lógica pura de la página /cobros-ventas (SalePayment).
 *
 * Sin React, sin side effects. La vista importa estos helpers y no duplica
 * normalización de estados ni cálculos de progreso (DESIGN.md regla 4).
 */

export type SalePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface SaleRow {
  id: string | number;
  date: string;
  client_name?: string;
  client?: { document_id?: string | number } | null;
  client_document_id?: string | number;
  status: string;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  payment_progress: number;
  [key: string]: unknown;
}

const STATUS_ALIASES: Record<string, SalePaymentStatus> = {
  PENDING: 'PENDING',
  PENDING_PAYMENT: 'PENDING',
  PARTIAL: 'PARTIAL',
  PARTIAL_PAYMENT: 'PARTIAL',
  PAID: 'PAID',
  COMPLETED: 'PAID',
  CANCELLED: 'CANCELLED',
  CANCELED: 'CANCELLED',
};

/** Normaliza el filtro de estado de la UI al valor que espera la API. */
export function normalizeStatusFilterForApi(status: string): string | undefined {
  if (!status || status === 'all') return undefined;
  const normalized = status.toString().trim().toUpperCase();
  return STATUS_ALIASES[normalized] || normalized;
}

/** Normaliza el estado de una venta a PENDING | PARTIAL | PAID | CANCELLED. */
export function normalizeSaleStatus(sale: Record<string, unknown>): string {
  const rawStatus =
    (sale?.payment_status as string) ||
    (sale?.status as string) ||
    (sale?.sale_status as string) ||
    '';
  const normalizedRaw = rawStatus.toString().trim().toUpperCase();

  if (STATUS_ALIASES[normalizedRaw]) return STATUS_ALIASES[normalizedRaw];

  const balanceDue =
    Number(sale?.remaining_amount ?? sale?.balance_due) || 0;
  const totalPaid =
    Number(sale?.paid_amount ?? sale?.total_paid) || 0;

  if (balanceDue <= 0) return 'PAID';
  if (totalPaid > 0) return 'PARTIAL';
  return 'PENDING';
}

/** Progreso de cobro 0–100 a partir de total y saldo. */
export function computePaymentProgress(
  total: number,
  balanceDue: number,
  status?: string,
): number {
  if (status === 'CANCELLED') return 0;
  if (!total || total <= 0) return 0;
  const progress = ((total - balanceDue) / total) * 100;
  return Math.min(100, Math.max(0, progress));
}

/** Formatea CI/RUC con puntos de miles es-PY (presentación, sin lógica). */
export function formatDocumentId(
  value: string | number | null | undefined,
): string {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Normaliza un item crudo de la API a la forma que consume la vista.
 * Replica la lógica histórica de SalePayment sin tocar el contrato visual.
 */
export function normalizeSaleRow(item: Record<string, unknown>): SaleRow {
  const raw = (item?.sale as Record<string, unknown>) || item;
  const totalPaid =
    Number(raw.paid_amount ?? raw.total_paid ?? raw.amount_paid) || 0;
  const rawTotal = Number(raw.total_amount) || Number(raw.total) || 0;
  const rawBalance =
    raw.remaining_amount !== undefined && raw.remaining_amount !== null
      ? Number(raw.remaining_amount)
      : raw.balance_due !== undefined && raw.balance_due !== null
        ? Number(raw.balance_due)
        : null;

  const finalTotal = rawTotal;
  let finalBalance =
    rawBalance !== null ? rawBalance : Math.max(0, rawTotal - totalPaid);

  const status = normalizeSaleStatus({
    ...raw,
    total_paid: totalPaid,
    balance_due: finalBalance,
  });

  if (status === 'PAID' || status === 'CANCELLED') finalBalance = 0;

  const paymentProgress = computePaymentProgress(
    finalTotal,
    finalBalance,
    status,
  );

  const clientObj = item?.client as { name?: string } | undefined;
  const rawClient = raw?.client as { name?: string } | undefined;

  return {
    ...raw,
    id: (raw.sale_id as string | number) ?? (raw.id as string | number),
    status,
    date: (raw.sale_date ?? raw.issue_date ?? raw.date) as string,
    client_name:
      (raw.client_name as string) ||
      rawClient?.name ||
      clientObj?.name ||
      'Ocasional',
    total_amount: finalTotal,
    total_paid: totalPaid,
    balance_due: finalBalance,
    payment_progress: paymentProgress,
  };
}
