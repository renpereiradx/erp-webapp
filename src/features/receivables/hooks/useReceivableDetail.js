import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';

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
      setData(response.data || response);
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
