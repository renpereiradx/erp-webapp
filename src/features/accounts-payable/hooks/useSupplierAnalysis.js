import { useState, useEffect, useMemo } from 'react';
import { payablesService } from '@/services/bi/payablesService';

const PAYMENT_HISTORY_LABELS = {
  EXCELLENT: { label: 'Excelente', color: 'emerald' },
  GOOD: { label: 'Bueno', color: 'blue' },
  REGULAR: { label: 'Regular', color: 'amber' },
  POOR: { label: 'Pobre', color: 'rose' },
};

const IMPORTANCE_LABELS = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
};

// supplier_contact del BE puede venir como blob JSON ({fax,email,phone,address})
const resolveContact = (raw) => {
  if (!raw || raw === 'No disponible') return '';
  if (typeof raw === 'object') return raw.email || raw.phone || '';
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

/**
 * Custom hook to manage supplier analysis data and logic.
 * Remapeado al contrato real (auditoría BI 2A):
 * - GET /payables/supplier/{id}/analysis → dto plano (share_percentage,
 *   importance, payment_history enum, avg_days_to_pay, credit_terms).
 * - GET /payables/supplier/{id} → detalle con facturas reales (payables[]).
 * Sin score/100 ni límite de crédito: el BE no los provee.
 */
export const useSupplierAnalysis = (id) => {
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [error, setError] = useState(null);

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

        const a = analysisRes?.data || {};
        const d = detailRes?.data || {};
        const rawInvoices = Array.isArray(d.payables) ? d.payables : [];

        const history = PAYMENT_HISTORY_LABELS[a.payment_history] || {
          label: a.payment_history || 'Sin datos',
          color: 'slate',
        };

        const mappedData = {
          id: a.supplier_id || d.supplier_id || id,
          name: a.supplier_name || d.supplier_name || 'Proveedor',
          contact: resolveContact(d.supplier_contact || a.supplier_contact),
          importance: IMPORTANCE_LABELS[a.importance] || null,

          stats: {
            totalPending: a.total_pending ?? d.total_pending ?? 0,
            totalOverdue: a.total_overdue ?? d.total_overdue ?? 0,
            avgPaymentDays: a.avg_days_to_pay ?? d.average_days_to_pay ?? 0,
            activeInvoices: a.pending_count ?? d.pending_count ?? rawInvoices.length,
            overdueCount: rawInvoices.filter((inv) => inv.status === 'OVERDUE').length,
            shareOfPayables: a.share_percentage ?? 0,
          },

          rating: {
            historyLabel: history.label,
            color: history.color,
            avgDays: a.avg_days_to_pay ?? d.average_days_to_pay ?? null,
            description: `Historial de pago ${history.label.toLowerCase()} según los registros de cumplimiento del proveedor${
              (a.avg_days_to_pay ?? d.average_days_to_pay) > 0
                ? ` — paga en promedio a ${Math.round(a.avg_days_to_pay ?? d.average_days_to_pay)} días.`
                : '.'
            }`,
          },

          terms: {
            creditDays: a.credit_terms ?? d.credit_terms ?? null,
            oldestInvoice: formatDate(a.oldest_debt || d.oldest_debt),
          },

          invoices: rawInvoices.map((inv) => ({
            id: inv.id || inv.purchase_order_id,
            date: formatDate(inv.purchase_date || inv.order_date),
            dueDate: formatDate(inv.due_date),
            originalAmount: inv.original_amount || 0,
            pendingAmount: inv.pending_amount || 0,
            status:
              inv.status === 'OVERDUE'
                ? 'Atrasado'
                : inv.status === 'PARTIAL'
                  ? 'Parcialmente Pagado'
                  : inv.status === 'PAID'
                    ? 'Completado'
                    : 'En Proceso',
            isOverdue: inv.status === 'OVERDUE',
          })),
        };

        setSupplier(mappedData);
      } catch (err) {
        console.error('Error fetching supplier analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const tableStats = useMemo(() => {
    if (!supplier) return { total: 0, overdue: 0 };
    return {
      total: supplier.invoices.length,
      overdue: supplier.invoices.filter((i) => i.isOverdue).length,
    };
  }, [supplier]);

  return { loading, supplier, tableStats, error };
};
