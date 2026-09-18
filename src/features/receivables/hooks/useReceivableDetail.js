import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/bi/receivablesService';
import { clientService } from '@/services/clientService';
// F1 (PLAN_ALINEACION_BI_FRONTEND): mapeo del detalle extraído a domain
import { transformDetailData } from '@/domain/receivables/mappers';

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
        // Si el ID referencia la venta (prefijo SALE/VTA), la entidad auditada es SALE
        const entityType = id.includes('SALE') || id.includes('VTA') ? 'SALE' : 'RECEIVABLE';
        const auditResponse = await receivablesService.getTransactionHistory(id, entityType);
        
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
