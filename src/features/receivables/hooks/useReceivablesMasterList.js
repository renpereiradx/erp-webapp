import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';

/**
 * Hook para manejar la lista maestra de cuentas por cobrar.
 */
export const useReceivablesMasterList = (initialFilters = {}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateStart: '',
    dateEnd: '',
    ...initialFilters
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await receivablesService.getMasterList(filters);
      setInvoices(response.data || response || []);
    } catch (err) {
      console.error('Error loading master list:', err);
      setError('Error al cargar la lista de cuentas.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateStart: '',
      dateEnd: ''
    });
  };

  return {
    invoices,
    loading,
    error,
    filters,
    handleFilterChange,
    resetFilters,
    refresh: loadData
  };
};
