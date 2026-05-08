import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  PricingInfo, 
  ProductCost,
  API_ENDPOINTS 
} from '../types';

/**
 * Servicio para la gestión de Costos y Precios (Pricing & Profitability).
 * Los endpoints utilizan resolveBIContextFromAuth en el backend.
 */
export const costPricingService = {
  /**
   * Obtiene información completa de precios y costos de un producto.
   */
  async getPricingInfo(productId: string, params: { branch_id?: number } = {}): Promise<{ data: PricingInfo }> {
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
  async getLastCost(productId: string, params: { branch_id?: number } = {}): Promise<{ data: ProductCost }> {
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
  async getCostMethods(): Promise<{ methods: any[] }> {
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
  }
};

export default costPricingService;
