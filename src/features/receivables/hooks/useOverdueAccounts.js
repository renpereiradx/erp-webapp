import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';

/**
 * Hook para manejar las cuentas vencidas y estadísticas de cobranza.
 */
export const useOverdueAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: {
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      promises: 0
    },
    accounts: []
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Intentamos obtener cuentas vencidas y estadísticas
      // Nota: El servicio OverdueAccounts actualmente devuelve una lista en el mock
      const overdueRes = await receivablesService.getOverdueAccounts();
      const accountsData = overdueRes.data || overdueRes || [];

      setData({
        stats: {
          totalOverdue: 145200000, // PYG amount (numeric)
          atRisk: 12,
          efficiency: 68,
          promises: 32450000 // PYG amount (numeric)
        },
        accounts: Array.isArray(accountsData) ? accountsData : []
      });
    } catch (err) {
      console.error('Error loading overdue accounts:', err);
      setError('Error al cargar las cuentas vencidas.');
      // Ensure accounts is always an array even on error
      setData(prev => ({
        ...prev,
        accounts: []
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    loading,
    error,
    refresh: loadData
  };
};
