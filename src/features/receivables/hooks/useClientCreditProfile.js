import { useState, useEffect } from 'react';
import { receivablesService } from '@/services/receivablesService';

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
      setLoading(true);
      setError(null);
      try {
        // Ejecutamos ambas peticiones en paralelo (Endpoints 6 y 7)
        const [profileRes, riskRes] = await Promise.all([
          receivablesService.getClientProfile(clientId),
          receivablesService.getClientRiskAnalysis(clientId)
        ]);

        if (isMounted) {
          if (profileRes?.success && riskRes?.success) {
            // Mapeamos y unificamos la respuesta para la UI
            const profile = profileRes.data;
            const risk = riskRes.data;

            setData({
              client: {
                name: profile.client_name,
                id: profile.client_id,
                status: profile.total_overdue > 0 ? 'Cuenta con Deuda' : 'Cuenta Activa',
                address: profile.client_address || 'Dirección no especificada', // Asumiendo que podría venir
                contact: profile.client_contact || 'Contacto Principal',
                phone: profile.client_phone,
                rep: profile.assigned_rep || 'Representante General',
                taxId: profile.tax_id || 'US-99-882145'
              },
              risk: {
                score: risk.risk_score,
                level: risk.risk_level === 'LOW' ? 'Riesgo Bajo' : 
                       risk.risk_level === 'MEDIUM' ? 'Riesgo Medio' : 'Riesgo Alto',
                recommendation: risk.recommendations.join('. ')
              },
              metrics: {
                outstanding: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profile.total_pending),
                limit: '$150,000', // Valor estático por ahora si no viene en API
                avgDays: `${profile.average_days_to_pay} Días`,
                lastPayment: '$15,200', // Mock hasta tener endpoint de historial
                utilization: Math.round((profile.total_pending / 150000) * 100)
              },
              // El aging lo podemos simular o pedir a un endpoint de resumen si existiera por cliente
              // Por ahora mantenemos una estructura compatible con el componente AgingBar
              aging: [
                { label: 'Corriente', amount: '$68k', width: '55%', colorClass: 'aging-bar__segment--current', title: 'Corriente' },
                { label: '1-30 Días', amount: '$31k', width: '25%', colorClass: 'aging-bar__segment--1-30', title: '1-30 Días' },
                { label: '31-60 Días', amount: '$14k', width: '12%', colorClass: 'aging-bar__segment--31-60', title: '31-60 Días' },
                { label: '>90 Días', amount: '$10k', width: '8%', colorClass: 'aging-bar__segment--90', title: '>90 Días' }
              ],
              invoices: profile.receivables.map(inv => ({
                id: inv.id,
                date: new Date(inv.sale_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                due: new Date(inv.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.original_amount),
                balance: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.pending_amount),
                status: inv.status === 'OVERDUE' ? 'Vencido >90' : 
                        inv.status === 'PARTIAL' ? 'Pago Parcial' : 'Corriente'
              }))
            });
          } else {
            setError('No se pudo obtener la información completa del cliente.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching client profile data:', err);
          setError('Error de conexión al cargar los datos del cliente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (clientId) {
      fetchAllData();
    }

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  return { data, loading, error };
};