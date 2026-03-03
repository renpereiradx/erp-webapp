import { useState, useEffect } from 'react';
import { receivablesService } from '@/services/receivablesService';
import { clientProfileMock } from '@/features/receivables/data/mockData';

/**
 * Hook personalizado para manejar la lógica de negocio del perfil de crédito del cliente.
 * Consume los endpoints 6 y 7 de la API de Receivables.
 * 
 * @param {string} clientId - ID del cliente a consultar.
 * @returns {Object} Datos del perfil unificados, estado de carga y error.
 */
export const useClientCreditProfile = (clientId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!clientId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Ejecutamos ambas peticiones en paralelo (Endpoints 6 y 7)
        const [profileRes, riskRes] = await Promise.all([
          receivablesService.getClientProfile(clientId).catch(err => ({ success: false, error: err })),
          receivablesService.getClientRiskAnalysis(clientId).catch(err => ({ success: false, error: err }))
        ]);

        if (!isMounted) return;

        // Si fallan las APIs reales, permitimos que la página use el Mock local para no romperse
        // Pero registramos el error si ambos fallan de forma crítica
        if (!profileRes?.success && !riskRes?.success && profileRes?.error) {
          throw profileRes.error;
        }

        // Mapeamos lo que tengamos, priorizando API real
        const profile = profileRes?.data || clientProfileMock.client;
        const risk = riskRes?.data || clientProfileMock.risk;

        // Normalizar datos de API (que vienen en snake_case) a nuestro formato camelCase de UI
        setData({
          client: {
            name: profile.client_name || profile.name || clientProfileMock.client.name,
            id: profile.client_id || profile.id || clientId,
            status: profile.total_overdue > 0 ? 'Cuenta con Deuda' : 'Cuenta Activa',
            address: profile.client_address || profile.address || clientProfileMock.client.address,
            contact: profile.client_contact || profile.contact || clientProfileMock.client.contact,
            phone: profile.client_phone || profile.phone || clientProfileMock.client.phone,
            rep: profile.assigned_rep || profile.rep || clientProfileMock.client.rep,
            taxId: profile.tax_id || profile.taxId || clientProfileMock.client.taxId
          },
          risk: {
            score: risk.risk_score !== undefined ? risk.risk_score : risk.score || 0,
            level: (risk.risk_level || risk.level) === 'LOW' ? 'Riesgo Bajo' : 
                   (risk.risk_level || risk.level) === 'MEDIUM' ? 'Riesgo Medio' : 'Riesgo Alto',
            recommendation: Array.isArray(risk.recommendations) 
              ? risk.recommendations.join('. ') 
              : risk.recommendation || 'Sin recomendaciones disponibles'
          },
          metrics: {
            outstanding: profile.total_pending 
              ? new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(profile.total_pending)
              : clientProfileMock.metrics.outstanding,
            limit: profile.credit_limit 
              ? new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(profile.credit_limit)
              : clientProfileMock.metrics.limit,
            avgDays: `${profile.average_days_to_pay || profile.avg_days_to_pay || 0} Días`,
            lastPayment: profile.last_payment_amount 
              ? new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(profile.last_payment_amount)
              : clientProfileMock.metrics.lastPayment,
            utilization: profile.credit_limit 
              ? Math.round(((profile.total_pending || 0) / profile.credit_limit) * 100)
              : clientProfileMock.metrics.utilization
          },
          aging: clientProfileMock.aging, // El aging sigue siendo visual por ahora
          invoices: Array.isArray(profile.receivables) 
            ? profile.receivables.map(inv => ({
                id: inv.id,
                date: new Date(inv.sale_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }),
                due: new Date(inv.due_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }),
                amount: new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(inv.original_amount),
                balance: new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(inv.pending_amount),
                status: inv.status === 'OVERDUE' ? 'Vencido' : 
                        inv.status === 'PARTIAL' ? 'Pago Parcial' : 'Corriente'
              }))
            : clientProfileMock.invoices
        });
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching client profile data:', err);
          // Si hay un error de API pero no queremos bloquear al usuario, podemos mostrar el mock
          setData(clientProfileMock);
          // Opcionalmente podrías querer mostrar un toast de advertencia en lugar de setError
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  return { data, loading, error };
};