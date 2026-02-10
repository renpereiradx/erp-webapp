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
      
      setData({
        stats: {
          totalOverdue: '$145,200', // Mock stats for now
          atRisk: '12',
          efficiency: '68',
          promises: '$32,450'
        },
        accounts: overdueRes.data || overdueRes || []
      });
    } catch (err) {
      console.error('Error loading overdue accounts:', err);
      setError('Error al cargar las cuentas vencidas.');
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
