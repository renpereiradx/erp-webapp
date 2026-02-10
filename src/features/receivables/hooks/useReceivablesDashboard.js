import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';

/**
 * Hook para manejar los datos del dashboard de cuentas por cobrar.
 */
export const useReceivablesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {
      totalReceivables: { amount: '$0', trend: '0' },
      overdueAmount: { amount: '$0', percentage: '0' },
      creditsReturns: { amount: '$0', trend: '0' },
      lastSync: { status: 'Generated' }
    },
    aging: [],
    forecast: [],
    debtors: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, agingRes, forecastRes, debtorsRes] = await Promise.all([
        receivablesService.getSummary(),
        receivablesService.getAgingSummary(), // Usamos el endpoint 8 mapeado antes
        receivablesService.getForecast(),
        receivablesService.getTopDebtors()
      ]);

      setData({
        summary: summaryRes.data || summaryRes,
        aging: agingRes.data || agingRes,
        forecast: forecastRes.data || forecastRes,
        debtors: debtorsRes.data || debtorsRes
      });
    } catch (err) {
      console.warn('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchData
  };
};
