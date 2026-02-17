import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Transforms the flat API response into the nested structure expected by detail components.
 */
const transformDetailData = (raw) => {
  const statusLabels = {
    OVERDUE: 'Overdue',
    PENDING: 'Pending',
    PARTIAL: 'Partial',
    PAID: 'Paid',
  };

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
      status: statusLabels[raw.status] || raw.status || '',
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
      ? raw.payment_history.map((p) => ({
          date: p.payment_date?.split('T')[0] || '',
          ref: p.reference || '—',
          method: p.payment_method || '',
          note: p.processed_by || '',
          amount: p.amount || 0,
        }))
      : [],
  };
};

/**
 * Hook para manejar el detalle de una cuenta por cobrar específica.
 */
export const useReceivableDetail = (id) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await receivablesService.getTransactionDetail(id);
      const raw = response.data?.data || response.data || response;
      setData(transformDetailData(raw));
    } catch (err) {
      console.error('Error loading receivable detail:', err);
      setError('Error al cargar el detalle de la cuenta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  return {
    data,
    loading,
    error,
    refresh: loadDetail
  };
};
