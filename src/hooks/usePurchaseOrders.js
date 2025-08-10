/**
 * Custom hook para gestión de órdenes de compra
 * Maneja el listado, filtrado, búsqueda y estados de órdenes de compra
 * Complementa el hook usePurchaseLogic para funcionalidades de gestión
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import purchaseService from '../services/purchaseService';
import { PURCHASE_STATES } from '../constants/purchaseData';

export const usePurchaseOrders = () => {
  // Estado para lista de órdenes
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para filtros y búsqueda
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    dateRange: {
      start: '',
      end: ''
    },
    searchTerm: '',
    sortBy: 'order_date',
    sortOrder: 'desc'
  });
  
  // Estado para paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });

  // Cargar órdenes de compra
  const loadPurchaseOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await purchaseService.getPurchasesPaginated(
        page, 
        pagination.pageSize, 
        filters
      );
      
      if (result.success) {
        setOrders(result.data.orders || result.data);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalItems: result.data.total || result.data.length,
          totalPages: Math.ceil((result.data.total || result.data.length) / pagination.pageSize)
        }));
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al cargar órdenes de compra');
      console.error('Error loading purchase orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  // Buscar órdenes por término
  const searchOrders = useCallback(async (searchTerm, searchType = 'supplier') => {
    if (!searchTerm.trim()) {
      await loadPurchaseOrders();
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseService.searchPurchases(searchTerm, searchType);
      
      if (result.success) {
        setOrders(Array.isArray(result.data) ? result.data : [result.data]);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalItems: Array.isArray(result.data) ? result.data.length : 1,
          totalPages: 1
        }));
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [loadPurchaseOrders]);

  // Filtrar órdenes por fecha
  const filterByDateRange = useCallback(async (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start: startDate, end: endDate }
    }));
    
    if (startDate && endDate) {
      setLoading(true);
      try {
        const result = await purchaseService.getPurchasesByDateRange(startDate, endDate, filters);
        
        if (result.success) {
          setOrders(result.data);
          setPagination(prev => ({
            ...prev,
            currentPage: 1,
            totalItems: result.data.length,
            totalPages: Math.ceil(result.data.length / pagination.pageSize)
          }));
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Error al filtrar por fecha');
      } finally {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize]);

  // Cancelar orden de compra
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    try {
      const result = await purchaseService.cancelPurchase(orderId, reason);
      
      if (result.success) {
        // Actualizar la orden en la lista local
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'CANCELLED', cancellation_reason: reason }
            : order
        ));
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Actualizar estado de orden
  const updateOrderStatus = useCallback(async (orderId, newStatus, notes = '') => {
    try {
      const result = await purchaseService.updatePurchaseOrderStatus(orderId, newStatus, notes);
      
      if (result.success) {
        // Actualizar la orden en la lista local
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notes }
            : order
        ));
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Obtener detalles de una orden específica
  const getOrderDetails = useCallback(async (orderId) => {
    try {
      const result = await purchaseService.getPurchaseOrderDetails(orderId);
      return result;
    } catch (error) {
      setError('Error al obtener detalles de la orden');
      throw error;
    }
  }, []);

  // Estadísticas de órdenes
  const orderStatistics = useMemo(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0,
      averageAmount: 0
    };

    orders.forEach(order => {
      // Contar por estado
      switch (order.status?.toUpperCase()) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }

      // Sumar montos
      if (order.total_amount) {
        stats.totalAmount += parseFloat(order.total_amount);
      }
    });

    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

    return {
      ...stats,
      totalAmount: Number(stats.totalAmount.toFixed(2)),
      averageAmount: Number(stats.averageAmount.toFixed(2))
    };
  }, [orders]);

  // Órdenes filtradas y ordenadas
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(order => 
        order.status?.toUpperCase() === filters.status.toUpperCase()
      );
    }

    // Filtro por proveedor
    if (filters.supplier) {
      filtered = filtered.filter(order => 
        order.supplier_name?.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.supplier_name?.toLowerCase().includes(term) ||
        order.id?.toString().includes(term) ||
        order.notes?.toLowerCase().includes(term)
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, filters]);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      supplier: '',
      dateRange: { start: '', end: '' },
      searchTerm: '',
      sortBy: 'order_date',
      sortOrder: 'desc'
    });
  }, []);

  // Exportar órdenes a CSV (preparación de datos)
  const exportOrdersData = useCallback(() => {
    return filteredOrders.map(order => ({
      ID: order.id,
      Proveedor: order.supplier_name,
      'Fecha de Orden': new Date(order.order_date).toLocaleDateString(),
      Estado: order.status,
      'Monto Total': order.total_amount,
      Notas: order.notes || '',
      'Fecha de Entrega': order.expected_delivery ? 
        new Date(order.expected_delivery).toLocaleDateString() : ''
    }));
  }, [filteredOrders]);

  // Cargar órdenes al montar el componente
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Recargar cuando cambien los filtros (con debounce)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (filters.searchTerm || filters.status || filters.supplier) {
        loadPurchaseOrders();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.searchTerm, filters.status, filters.supplier]);

  return {
    // Estado
    orders: filteredOrders,
    loading,
    error,
    filters,
    pagination,
    orderStatistics,

    // Acciones de carga y búsqueda
    loadPurchaseOrders,
    searchOrders,
    filterByDateRange,

    // Acciones sobre órdenes
    cancelOrder,
    updateOrderStatus,
    getOrderDetails,

    // Gestión de filtros
    setFilters,
    resetFilters,

    // Paginación
    setPagination,

    // Utilidades
    exportOrdersData,

    // Constantes útiles
    PURCHASE_STATES
  };
};

export default usePurchaseOrders;
