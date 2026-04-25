import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams } from '../../types/bi';

/**
 * Servicio para Analítica de Inventario (BI - Inventory Analytics)
 */
export const inventoryAnalyticsService = {
  /**
   * Resumen general de inventario
   */
  async getOverview(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/overview', { params });
    } catch (error: any) {
      console.error('Error fetching inventory overview:', error);
      throw error;
    }
  },

  /**
   * Niveles de stock y alertas de reabastecimiento
   */
  async getStockLevels(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/stock-levels', { params });
    } catch (error: any) {
      console.error('Error fetching stock levels:', error);
      throw error;
    }
  },

  /**
   * Análisis de rotación de inventario (Turnover)
   */
  async getTurnover(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/turnover', { params });
    } catch (error: any) {
      console.error('Error fetching inventory turnover:', error);
      throw error;
    }
  },

  /**
   * Análisis ABC de inventario
   */
  async getABC(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/abc', { params });
    } catch (error: any) {
      console.error('Error fetching inventory ABC analysis:', error);
      throw error;
    }
  },

  /**
   * Análisis de stock muerto (sin movimiento)
   */
  async getDeadStock(params: BIParams & { days_threshold?: number } = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/dead-stock', { params });
    } catch (error: any) {
      console.error('Error fetching dead stock analysis:', error);
      throw error;
    }
  },

  /**
   * Pronóstico de stock basado en velocidad de ventas
   */
  async getForecast(params: BIParams & { forecast_days?: number } = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/forecast', { params });
    } catch (error: any) {
      console.error('Error fetching inventory forecast:', error);
      throw error;
    }
  },

  /**
   * Dashboard consolidado de inventario
   */
  async getDashboard(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/inventory-analytics/dashboard', { params });
    } catch (error: any) {
      console.error('Error fetching inventory analytics dashboard:', error);
      throw error;
    }
  }
};

export default inventoryAnalyticsService;
