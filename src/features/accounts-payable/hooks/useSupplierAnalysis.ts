import { useState, useEffect, useMemo } from 'react';
import { payablesService } from '@/services/bi/payablesService';
import { tRaw } from '@/lib/i18n';
import type { PaymentHistoryColor, SupplierAnalysisData, SupplierTableStats } from '../types';

// Labels visibles via t() (keys bi.supplier.history.* / bi.supplier.importance.*)
const PAYMENT_HISTORY_KEYS: Record<string, { key: string; color: PaymentHistoryColor }> = {
  EXCELLENT: { key: 'bi.supplier.history.excellent', color: 'emerald' },
  GOOD: { key: 'bi.supplier.history.good', color: 'blue' },
  REGULAR: { key: 'bi.supplier.history.regular', color: 'amber' },
  POOR: { key: 'bi.supplier.history.poor', color: 'rose' },
};

const IMPORTANCE_KEYS: Record<string, string> = {
  CRITICAL: 'bi.supplier.importance.critical',
  HIGH: 'bi.supplier.importance.high',
  MEDIUM: 'bi.supplier.importance.medium',
  LOW: 'bi.supplier.importance.low',
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
};

// supplier_contact del BE puede venir como blob JSON ({fax,email,phone,address})
const resolveContact = (raw: unknown) => {
  if (!raw || raw === 'No disponible') return '';
  if (typeof raw === 'object') {
    const obj = raw as Record<string, string>;
    return obj.email || obj.phone || '';
  }
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.email || parsed.phone || '';
    } catch {
      return '';
    }
  }
  return raw;
};

const num = (v: unknown): number => Number(v ?? 0) || 0;

/**
 * Custom hook to manage supplier analysis data and logic.
 * Remapeado al contrato real (auditoría BI 2A):
 * - GET /payables/supplier/{id}/analysis → dto plano (share_percentage,
 *   importance, payment_history enum, avg_days_to_pay, credit_terms).
 * - GET /payables/supplier/{id} → detalle con facturas reales (payables[]).
 * Sin score/100 ni límite de crédito: el BE no los provee.
 */
export const useSupplierAnalysis = (id: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [analysisRes, detailRes] = await Promise.all([
          payablesService.getSupplierAnalysis(id),
          payablesService.getSupplierPayables(id),
        ]);

        const a: Record<string, any> = analysisRes?.data || {};
        const d: Record<string, any> = detailRes?.data || {};
        const rawInvoices: Array<Record<string, any>> = Array.isArray(d.payables) ? d.payables : [];

        const history = PAYMENT_HISTORY_KEYS[a.payment_history] || {
          key: 'bi.supplier.history.none',
          color: 'slate' as PaymentHistoryColor,
        };
        const historyLabel = tRaw(history.key, 'Sin datos', {});

        const avgDays = a.avg_days_to_pay ?? d.average_days_to_pay ?? null;
        const mappedData: SupplierAnalysisData = {
          id: a.supplier_id || d.supplier_id || id,
          name: a.supplier_name || d.supplier_name || tRaw('bi.supplier.defaultName', 'Proveedor', {}),
          contact: resolveContact(d.supplier_contact || a.supplier_contact),
          importance: a.importance ? tRaw(IMPORTANCE_KEYS[a.importance] ?? '', '', {}) || null : null,

          stats: {
            totalPending: num(a.total_pending ?? d.total_pending),
            totalOverdue: num(a.total_overdue ?? d.total_overdue),
            avgPaymentDays: avgDays,
            activeInvoices: a.pending_count ?? d.pending_count ?? rawInvoices.length,
            overdueCount: rawInvoices.filter((inv) => inv.status === 'OVERDUE').length,
            shareOfPayables: a.share_percentage ?? 0,
          },

          rating: {
            historyLabel,
            color: history.color,
            avgDays,
            description: `${tRaw('bi.supplier.rating.description', 'Historial de pago {label} según los registros de cumplimiento del proveedor{suffix}', {
              label: historyLabel.toLowerCase(),
              suffix:
                num(avgDays) > 0
                  ? ` — ${tRaw('bi.supplier.rating.avgDays', 'paga en promedio a {n} días', { n: Math.round(num(avgDays)) })}.`
                  : '.',
            })}`,
          },

          terms: {
            creditDays: a.credit_terms ?? d.credit_terms ?? null,
            oldestInvoice: formatDate(a.oldest_debt || d.oldest_debt),
          },

          invoices: rawInvoices.map((inv) => ({
            id: inv.id || inv.purchase_order_id,
            date: formatDate(inv.purchase_date || inv.order_date),
            dueDate: formatDate(inv.due_date),
            originalAmount: num(inv.original_amount),
            pendingAmount: num(inv.pending_amount),
            // clave de estado ESTABLE (la label la pone la tabla con i18n):
            // antes la label es-ES viajaba en el contrato y el switch de la
            // tabla comparaba strings traducidos.
            status:
              inv.status === 'OVERDUE'
                ? 'OVERDUE'
                : inv.status === 'PARTIAL'
                  ? 'PARTIAL'
                  : inv.status === 'PAID'
                    ? 'PAID'
                    : 'PROCESS',
            isOverdue: inv.status === 'OVERDUE',
          })),
        };

        setSupplier(mappedData);
      } catch (err: any) {
        console.error('Error fetching supplier analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const tableStats: SupplierTableStats = useMemo(() => {
    if (!supplier) return { total: 0, overdue: 0 };
    return {
      total: supplier.invoices.length,
      overdue: supplier.invoices.filter((i) => i.isOverdue).length,
    };
  }, [supplier]);

  return { loading, supplier, tableStats, error };
};
