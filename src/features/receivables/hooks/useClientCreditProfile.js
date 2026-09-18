import { useState, useEffect } from 'react';
import { receivablesService } from '@/services/bi/receivablesService';
import { clientService } from '@/services/clientService';
// F1 (PLAN_ALINEACION_BI_FRONTEND): buckets de antigüedad extraídos a domain
import { buildInvoiceAgingBuckets } from '@/domain/receivables/aging';

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
        const [profileRes, riskRes, basicInfoRes] = await Promise.all([
          receivablesService.getClientProfile(clientId).catch(err => ({ success: false, error: err })),
          receivablesService.getClientRisk(clientId).catch(err => ({ success: false, error: err })),
          clientService.getById(clientId).catch(() => null)
        ]);

        if (!isMounted) return;

        // Normalizamos la respuesta (podría ser un array directo o un objeto con data)
        const profile = profileRes?.data || profileRes;
        const risk = riskRes?.data || riskRes;

        if (!profile || (profileRes?.success === false && !profileRes.client_name)) {
          throw new Error('No se pudo cargar la información del cliente');
        }

        // Formateador de moneda PYG
        const formatPYG = (val) => new Intl.NumberFormat('es-PY', { 
          style: 'currency', 
          currency: 'PYG',
          maximumFractionDigits: 0 
        }).format(val || 0);

        // Mapear datos a estructura camelCase esperada por la UI
        setData({
          client: {
            name: profile.client_name || profile.name || basicInfoRes?.name || 'Cliente',
            id: profile.client_id || profile.id || clientId,
            status: (profile.total_overdue || 0) > 0 ? 'Cuenta con Deuda' : 'Cuenta Activa',
            address: profile.client_address || profile.address || basicInfoRes?.address || 'Sin dirección registrada',
            contact: profile.client_contact || profile.contact || basicInfoRes?.contact || 'Sin contacto definido',
            phone: profile.client_phone || profile.phone || basicInfoRes?.phone || 'Sin télefono',
            rep: profile.assigned_rep || profile.rep || 'No asignado',
            taxId: profile.tax_id || profile.taxId || basicInfoRes?.document_id || 'No registrado'
          },
          risk: {
            // La API no provee score numérico: el gauge muestra el nivel (RiskGauge maneja score null)
            score: risk.risk_score ?? risk.score ?? null,
            level: (risk.risk_level || risk.level) === 'LOW' ? 'Riesgo Bajo' : 
                   (risk.risk_level || risk.level) === 'MEDIUM' ? 'Riesgo Medio' : 'Riesgo Alto',
            recommendation: Array.isArray(risk.recommendations) 
              ? risk.recommendations.join('. ') 
              : risk.recommendation || ((risk.overdue_ratio ?? 0) >= 0.5
                ? `El ${(risk.overdue_ratio * 100).toFixed(0)}% del saldo está vencido (máximo ${Math.round(risk.max_days_overdue || 0)} días). Solicitar regularización antes de nuevo crédito.`
                : 'Sin alertas automáticas para este cliente.')
          },
          metrics: {
            outstanding: formatPYG(profile.total_pending),
            limit: profile.credit_limit ? formatPYG(profile.credit_limit) : 'Sin límite definido',
            avgDays: `${profile.average_days_to_pay || profile.avg_days_to_pay || 0} Días`,
            lastPayment: formatPYG(profile.last_payment_amount || 0),
            utilization: profile.credit_limit
              ? Math.round(((profile.total_pending || 0) / profile.credit_limit) * 100)
              : null
          },
          aging: buildInvoiceAgingBuckets(profile.receivables).map((b) => ({
            ...b,
            amount: formatPYG(b.amount),
            width: `${b.percent}%`,
          })),
          invoices: Array.isArray(profile.receivables) 
            ? profile.receivables.map(inv => ({
                id: inv.id,
                date: new Date(inv.sale_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }),
                due: new Date(inv.due_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }),
                amount: formatPYG(inv.original_amount),
                balance: formatPYG(inv.pending_amount),
                status: inv.status === 'OVERDUE' ? 'Vencido' : 
                        inv.status === 'PARTIAL' ? 'Pago Parcial' : 'Corriente'
              }))
            : []
        });
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching client profile data:', err);
          setError(err.message);
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
