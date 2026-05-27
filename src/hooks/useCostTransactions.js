/**
 * Hook personalizado para Cost Transactions v2.0
 * Proporciona funcionalidades completas para el manejo de transacciones de costo
 */

import { useState, useCallback } from 'react';
import costPricingService from '@/services/costPricingService';

export const useCostTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Registrar una transacción de costo
   */
  const registerCostTransaction = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await costPricingService.registerCostTransaction(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar transacción de costo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Ajuste manual de costo
   */
  const registerManualCostAdjustment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await costPricingService.registerManualCostAdjustment(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar ajuste manual de costo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Historial de transacciones de costo de un producto
   */
  const getCostTransactionHistory = useCallback(async (productId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await costPricingService.getCostTransactionHistory(productId, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial de costos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Transacciones de costo por rango de fechas
   */
  const getCostTransactionsByDate = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await costPricingService.getCostTransactionsByDate(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar costos por fecha';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener una transacción de costo por ID
   */
  const getCostTransactionById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await costPricingService.getCostTransactionById(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar transacción de costo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    registerCostTransaction,
    registerManualCostAdjustment,
    getCostTransactionHistory,
    getCostTransactionsByDate,
    getCostTransactionById,
    clearError
  };
};

export default useCostTransactions;
