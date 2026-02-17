import { useState, useEffect, useCallback } from 'react';
import { receivablesService } from '@/services/receivablesService';

/**
 * Genera un color de avatar basado en el nombre del cliente
 */
const getAvatarColor = (name) => {
  const colors = [
    '#dbeafe', '#fef3c7', '#e0e7ff', '#dcfce7', '#f3e8ff',
    '#fce7f3', '#fef2f2', '#ecfdf5', '#fef9c3', '#ddd6fe'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

/**
 * Mapea el estado del API al formato de color para los pills
 */
const getStatusColor = (status) => {
  const statusMap = {
    'OVERDUE': 'red',
    'PENDING': 'yellow',
    'PARTIAL': 'blue',
    'PAID': 'green'
  };
  return statusMap[status] || 'gray';
};

/**
 * Transforma un item del API al formato esperado por la tabla
 */
const transformReceivableItem = (item) => ({
  id: item.id || item.sale_order_id,
  clientName: item.client_name,
  clientInitial: item.client_name?.charAt(0) || '?',
  clientColor: getAvatarColor(item.client_name),
  issueDate: item.sale_date?.split('T')[0] || '',
  dueDate: item.due_date?.split('T')[0] || '',
  originalAmt: item.original_amount || 0,
  pendingAmt: item.pending_amount || 0,
  status: item.status,
  statusColor: getStatusColor(item.status),
});

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
    minAmount: '',
    maxAmount: '',
    daysOverdue: '',
    ...initialFilters
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });

  const [sorting, setSorting] = useState({
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await receivablesService.getMasterList(
        filters,
        { page: pagination.page, pageSize: pagination.pageSize },
        sorting
      );

      // Support both structured { data, pagination, summary } and flat array responses
      const raw = response.data || response || [];

      if (Array.isArray(raw)) {
        const transformed = raw.map(transformReceivableItem);
        setInvoices(transformed);
      } else {
        // Structured response from API
        const items = raw.data?.items || raw.items || raw.data || raw.receivables || [];
        const transformedItems = Array.isArray(items) ? items.map(transformReceivableItem) : [];
        setInvoices(transformedItems);

        // Parse pagination from nested response structure
        const paginationData = raw.data?.pagination || raw.pagination;
        if (paginationData) {
          setPagination(prev => ({
            ...prev,
            totalItems: paginationData.total_items ?? paginationData.totalItems ?? prev.totalItems,
            totalPages: paginationData.total_pages ?? paginationData.totalPages ?? prev.totalPages,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading master list:', err);
      setError('Error al cargar la lista de cuentas.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sorting]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateStart: '',
      dateEnd: '',
      minAmount: '',
      maxAmount: '',
      daysOverdue: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, pageSize: Number(newSize), page: 1 }));
  };

  const handleSort = (columnKey) => {
    setSorting(prev => {
      if (prev.sortBy === columnKey) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { sortBy: columnKey, sortOrder: 'asc' };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    invoices,
    loading,
    error,
    filters,
    pagination,
    sorting,
    handleFilterChange,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    refresh: loadData
  };
};
