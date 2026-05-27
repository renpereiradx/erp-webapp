import { apiClient } from './api';
import { 
  API_ENDPOINTS,
  CostTransactionRequest,
  CostManualAdjustmentRequest,
  CostTransactionResponse
} from '../types';

/**
 * Servicio para la gestión de Costos y Precios (Pricing & Profitability).
 * Los endpoints utilizan resolveBIContextFromAuth en el backend.
 */
export const costPricingService = {
  /**
   * Obtiene información completa de precios y costos de un producto.
   */
  async getPricingInfo(productId: string, params: { branch_id?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.PRICING_INFO(productId), { params });
    } catch (error: any) {
      console.error('Error fetching pricing info:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de costos de un producto.
   */
  async getCostsHistory(productId: string, params: { branch_id?: number; unit?: string; months?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COSTS_HISTORY(productId), { params });
    } catch (error: any) {
      console.error('Error fetching costs history:', error);
      throw error;
    }
  },

  /**
   * Obtiene el último costo de compra de un producto.
   */
  async getLastCost(productId: string, params: { branch_id?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COSTS_LAST(productId), { params });
    } catch (error: any) {
      console.error('Error fetching last cost:', error);
      throw error;
    }
  },

  /**
   * Obtiene el último registro de compra completo.
   */
  async getLastCostRecord(productId: string, params: { branch_id?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COSTS_LAST_RECORD(productId), { params });
    } catch (error: any) {
      console.error('Error fetching last cost record:', error);
      throw error;
    }
  },

  /**
   * Obtiene un resumen de costos de un producto.
   */
  async getCostSummary(productId: string, params: { branch_id?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COSTS_SUMMARY(productId), { params });
    } catch (error: any) {
      console.error('Error fetching cost summary:', error);
      throw error;
    }
  },

  /**
   * Obtiene tendencias de costos de un producto.
   */
  async getCostTrends(productId: string, params: { branch_id?: number; months?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COST_TRENDS(productId), { params });
    } catch (error: any) {
      console.error('Error fetching cost trends:', error);
      throw error;
    }
  },

  /**
   * Obtiene los métodos de cálculo de costos disponibles.
   */
  async getCostMethods(productId: string): Promise<{ methods: any[] }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COST_METHODS(productId));
    } catch (error: any) {
      console.error('Error fetching cost methods:', error);
      throw error;
    }
  },

  /**
   * Análisis de costos por proveedor.
   */
  async getSupplierCostAnalysis(supplierId: string, params: { branch_id?: number } = {}): Promise<{ data: any }> {
    try {
      return await apiClient.get(API_ENDPOINTS.SUPPLIER_COST_ANALYSIS(supplierId), { params });
    } catch (error: any) {
      console.error('Error fetching supplier cost analysis:', error);
      throw error;
    }
  },

  /**
   * Tendencias globales de costos.
   */
  async getGlobalCostTrends(params: { branch_id?: number; period?: string } = {}): Promise<{ trends: any[] }> {
    try {
      return await apiClient.get(API_ENDPOINTS.GLOBAL_COST_TRENDS, { params });
    } catch (error: any) {
      console.error('Error fetching global cost trends:', error);
      throw error;
    }
  },

  /**
   * Registrar una transacción de costo (POST /cost-transactions)
   */
  async registerCostTransaction(data: CostTransactionRequest): Promise<{ success: boolean; data: CostTransactionResponse }> {
    try {
      return await apiClient.post(API_ENDPOINTS.COST_TRANSACTIONS, data);
    } catch (error: any) {
      console.error('Error registering cost transaction:', error);
      throw error;
    }
  },

  /**
   * Ajuste manual de costo (POST /cost-transactions/manual-adjustment)
   */
  async registerManualCostAdjustment(data: CostManualAdjustmentRequest): Promise<{ success: boolean; data: CostTransactionResponse }> {
    try {
      return await apiClient.post(API_ENDPOINTS.COST_TRANSACTIONS_MANUAL_ADJUSTMENT, data);
    } catch (error: any) {
      console.error('Error registering manual cost adjustment:', error);
      throw error;
    }
  },

  /**
   * Historial de transacciones de costo de un producto (GET /cost-transactions/product/{id}/history)
   */
  async getCostTransactionHistory(productId: string, params: { unit?: string; limit?: number; offset?: number } = {}): Promise<{ history: CostTransactionResponse[]; count: number }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COST_TRANSACTIONS_HISTORY(productId), { params });
    } catch (error: any) {
      console.error('Error fetching cost transaction history:', error);
      throw error;
    }
  },

  /**
   * Transacciones de costo por rango de fechas (GET /cost-transactions/by-date)
   */
  async getCostTransactionsByDate(params: { start_date: string; end_date: string; limit?: number; offset?: number }): Promise<{ transactions: CostTransactionResponse[]; count: number }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COST_TRANSACTIONS_BY_DATE, { params });
    } catch (error: any) {
      console.error('Error fetching cost transactions by date:', error);
      throw error;
    }
  },

  /**
   * Obtener una transacción de costo por ID (GET /cost-transactions/{id})
   */
  async getCostTransactionById(id: number | string): Promise<{ data: CostTransactionResponse }> {
    try {
      return await apiClient.get(API_ENDPOINTS.COST_TRANSACTIONS_BY_ID(id));
    } catch (error: any) {
      console.error(`Error fetching cost transaction ${id}:`, error);
      throw error;
    }
  }
};

export default costPricingService;
