/**
 * Hook personalizado para Price Transactions v1.0
 * Proporciona funcionalidades completas para el manejo de transacciones de precio
 */

import { useState, useCallback } from 'react';
import priceTransactionService from '@/services/priceTransactionService';

export const usePriceTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Registrar nueva transacción de precio
   */
  const registerTransaction = useCallback(async (transactionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.registerTransaction(transactionData);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al registrar transacción');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener historial de precios de un producto
   */
  const getProductHistory = useCallback(async (productId, page = 0, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getProductHistory(productId, page, limit);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar historial');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validar consistencia de precios
   */
  const validateConsistency = useCallback(async (productId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.validateConsistency(productId);
      
      if (!result.success) {
        throw new Error(result.error || 'Error en validación de consistencia');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener reporte de variación de precios
   */
  const getVarianceReport = useCallback(async (
    dateFrom, 
    dateTo, 
    transactionType = null, 
    page = 0, 
    limit = 50
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getVarianceReport(
        dateFrom, 
        dateTo, 
        transactionType, 
        page, 
        limit
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar reporte de variación');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener tipos de transacciones
   */
  const getTransactionTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getTransactionTypes();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar tipos de transacciones');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener transacciones por rango de fechas
   */
  const getTransactionsByDate = useCallback(async (
    startDate,
    endDate,
    transactionType = null,
    page = 0,
    limit = 50
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getTransactionsByDate(
        startDate,
        endDate,
        transactionType,
        page,
        limit
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar transacciones por fecha');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener transacciones recientes (últimos 30 días)
   */
  const getRecentTransactions = useCallback(async (limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getRecentTransactions(limit);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar transacciones recientes');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener transacción por ID
   */
  const getTransactionById = useCallback(async (transactionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await priceTransactionService.getTransactionById(transactionId);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar transacción');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Calcular estadísticas de cambio de precio
   */
  const calculatePriceChange = useCallback((oldPrice, newPrice) => {
    if (!oldPrice || !newPrice) return null;
    
    const change = newPrice - oldPrice;
    const percent = (change / oldPrice) * 100;
    
    return {
      change,
      percent,
      isIncrease: change > 0,
      isDecrease: change < 0,
      formatted: {
        change: new Intl.NumberFormat('es-PY', {
          style: 'currency',
          currency: 'PYG'
        }).format(change),
        percent: `${change >= 0 ? '+' : ''}${percent.toFixed(2)}%`
      }
    };
  }, []);

  /**
   * Formatear tipo de transacción para mostrar
   */
  const formatTransactionType = useCallback((type) => {
    const types = {
      'MANUAL_ADJUSTMENT': '🔧 Ajuste Manual',
      'MARKET_UPDATE': '📊 Actualización de Mercado',
      'COST_UPDATE': '💰 Actualización de Costos',
      'SUPPLIER_CHANGE': '🏭 Cambio de Proveedor',
      'PROMOTION': '🎉 Promoción',
      'CURRENCY_ADJUSTMENT': '💱 Ajuste Cambiario',
      'INITIAL_PRICE': '🎯 Precio Inicial',
      'BULK_UPDATE': '📦 Actualización Masiva'
    };
    return types[type] || type;
  }, []);

  /**
   * Interpretar estado de consistencia
   */
  const interpretConsistencyStatus = useCallback((status) => {
    const statusMap = {
      'CONSISTENT': {
        level: 'success',
        icon: '✅',
        message: 'Precio consistente con transacciones',
        action: 'none',
        color: 'text-green-600'
      },
      'INCONSISTENT': {
        level: 'error',
        icon: '❌',
        message: 'Precio actual no coincide con última transacción',
        action: 'Sincronizar precio o revisar transacciones',
        color: 'text-red-600'
      },
      'NO_PRICE_DATA': {
        level: 'warning',
        icon: '⚠️',
        message: 'No hay datos de precio',
        action: 'Establecer precio inicial',
        color: 'text-yellow-600'
      },
      'MISSING_CURRENT_PRICE': {
        level: 'warning',
        icon: '🔍',
        message: 'Precio actual no encontrado',
        action: 'Actualizar tabla de precios',
        color: 'text-yellow-600'
      },
      'NO_PRICE_TRANSACTIONS': {
        level: 'info',
        icon: '📝',
        message: 'No hay transacciones de precio registradas',
        action: 'Crear transacción inicial',
        color: 'text-blue-600'
      }
    };
    
    return statusMap[status] || {
      level: 'unknown',
      icon: '❓',
      message: 'Estado desconocido',
      action: 'Revisar manualmente',
      color: 'text-gray-600'
    };
  }, []);

  return {
    // Estados
    loading,
    error,
    
    // Acciones principales
    registerTransaction,
    getProductHistory,
    validateConsistency,
    getVarianceReport,
    getTransactionTypes,
    getTransactionsByDate,
    getRecentTransactions,
    getTransactionById,
    
    // Utilidades
    clearError,
    calculatePriceChange,
    formatTransactionType,
    interpretConsistencyStatus
  };
};

export default usePriceTransactions;
