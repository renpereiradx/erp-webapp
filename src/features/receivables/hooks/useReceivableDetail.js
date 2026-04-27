import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/bi/receivablesService';
import { clientService } from '@/services/clientService';
import apiService from '@/services/api';
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
    activities: [
      ...(Array.isArray(raw.payment_history)
        ? raw.payment_history.map((p) => ({
            id: p.id || `pay-${p.payment_date}-${p.amount}`,
            type: 'PAYMENT',
            date: p.payment_date?.split('T')[0] || '',
            time: p.payment_date?.split('T')[1]?.substring(0, 5) || '',
            description: `Pago de ${formatPYG(p.amount)} recibido vía ${p.payment_method || 'Transferencia'}.`,
            user: p.processed_by || 'Sistema',
          }))
        : []),
      // Si el objeto tiene notas en metadata, incluirlas como actividad
      ...(raw.metadata?.notes ? [{
        id: 'note-0',
        type: 'NOTE',
        date: raw.sale_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        description: raw.metadata.notes,
        user: raw.user_name || 'Vendedor',
      }] : [])
    ].sort((a, b) => new Date(b.date) - new Date(a.date)),
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
      
      const transformed = transformDetailData(raw);
      
      // Intentar enriquecer con datos básicos del cliente si faltan
      if (transformed.client?.id) {
        try {
          const clientBasic = await clientService.getById(transformed.client.id);
          if (clientBasic) {
            transformed.client.phone = transformed.client.phone || clientBasic.phone;
            transformed.client.email = transformed.client.email || clientBasic.email;
            transformed.client.address = transformed.client.address || clientBasic.address;
            transformed.client.taxId = clientBasic.document_id;
          }
        } catch (e) {
          console.warn('Could not fetch additional client info:', e);
        }
      }

      // Intentar cargar historial de auditoría real si está disponible
      try {
        // Asumimos que si el ID empieza con "SALE-" o similar, el entity_type es "SALE"
        const entityType = id.includes('SALE') || id.includes('VTA') ? 'SALE' : 'RECEIVABLE';
        const auditResponse = await receivablesService.getTransactionHistory?.(id) || 
                              await apiService.get(`/api/v1/audit/entity/${entityType}/${id}/history`);
        
        if (auditResponse && auditResponse.success && auditResponse.data?.changes) {
          const auditActivities = auditResponse.data.changes.map(change => ({
            id: `audit-${change.id}`,
            type: change.action === 'CREATE' ? 'SYSTEM' : 'NOTE',
            date: change.timestamp?.split('T')[0] || '',
            time: change.timestamp?.split('T')[1]?.substring(0, 5) || '',
            description: change.description || `Cambio en la entidad: ${change.action}`,
            user: change.username || change.user_id || 'Sistema',
          }));
          
          // Combinar y volver a ordenar
          transformed.activities = [
             ...transformed.activities,
             ...auditActivities
          ].sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

          // Eliminar duplicados si los hay (por ID)
          const seen = new Set();
          transformed.activities = transformed.activities.filter(a => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          });
        }
      } catch (auditErr) {
        console.debug('Audit history not available for this entity. Using payment history only.');
      }
      
      setData(transformed);
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
