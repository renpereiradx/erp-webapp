import { apiClient } from '../api';
import { BIParams } from '../../types/bi';

/**
 * Servicio para Analítica de Ventas (BI - Sales Analytics)
 */
export const salesAnalyticsService = {
  /**
   * Obtiene el dashboard consolidado de ventas
   */
  async getDashboard(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/dashboard', { params });
    } catch (error: any) {
      console.error('Error fetching sales dashboard:', error);
      throw error;
    }
  },

  /**
   * Obtiene el rendimiento de ventas (Performance)
   */
  async getPerformance(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/performance', { params });
    } catch (error: any) {
      console.error('Error fetching sales performance:', error);
      throw error;
    }
  },

  /**
   * Obtiene tendencias de ventas
   */
  async getTrends(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/trends', { params });
    } catch (error: any) {
      console.error('Error fetching sales trends:', error);
      throw error;
    }
  },

  /**
   * Obtiene ventas por categoría
   */
  async getByCategory(params: BIParams & { limit?: number } = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/by-category', { params });
    } catch (error: any) {
      console.error('Error fetching sales by category:', error);
      throw error;
    }
  },

  /**
   * Obtiene ventas por producto
   */
  async getByProduct(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/by-product', { params });
    } catch (error: any) {
      console.error('Error fetching sales by product:', error);
      throw error;
    }
  },

  /**
   * Obtiene el mapa de calor de ventas
   */
  async getHeatmap(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/heatmap', { params });
    } catch (error: any) {
      console.error('Error fetching sales heatmap:', error);
      throw error;
    }
  },

  /**
   * Obtiene métricas de velocidad de ventas
   */
  async getVelocity(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/velocity', { params });
    } catch (error: any) {
      console.error('Error fetching sales velocity:', error);
      throw error;
    }
  },

  /**
   * Compara ventas entre dos periodos
   */
  async comparePeriods(params: any = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/compare', { params });
    } catch (error: any) {
      console.error('Error comparing periods:', error);
      throw error;
    }
  },

  /**
   * Obtiene insights por cliente
   */
  async getByCustomer(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/by-customer', { params });
    } catch (error: any) {
      console.error('Error fetching sales by customer:', error);
      throw error;
    }
  },

  /**
   * Obtiene insights por vendedor
   */
  async getBySeller(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/by-seller', { params });
    } catch (error: any) {
      console.error('Error fetching sales by seller:', error);
      throw error;
    }
  },

  /**
   * Líneas de venta con descuento (quién descontó cuánto).
   * PLAN_MONOROL_DESCUENTOS_CREDITO_CLIENTE B3/B4.
   */
  async getDiscounts(params: { start_date: string; end_date: string; branch_id?: number }): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/discounts', { params });
    } catch (error: any) {
      console.error('Error fetching discount lines:', error);
      throw error;
    }
  },

  /**
   * Resumen de descuentos agrupado (seller | applier | branch).
   */
  async getDiscountsSummary(params: { start_date: string; end_date: string; group_by?: 'seller' | 'applier' | 'branch'; branch_id?: number }): Promise<any> {
    try {
      return await apiClient.get('/sales-analytics/discounts/summary', { params });
    } catch (error: any) {
      console.error('Error fetching discount summary:', error);
      throw error;
    }
  }
};

export default salesAnalyticsService;
