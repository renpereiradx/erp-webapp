import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams, DashboardSummary, KPIData, SalesHeatmapData } from '../../types/bi';

/**
 * Servicio para el Dashboard Ejecutivo (BI)
 * Soporta visión global (ADMIN) y visión por sucursal.
 */
export const dashboardService = {
  /**
   * Obtiene el resumen ejecutivo del dashboard
   */
  async getSummary(params: BIParams = {}): Promise<DashboardSummary> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get('/dashboard/summary', { params });
      return response;
    } catch (error: any) {
      telemetry.record('bi.dashboard.error', { operation: 'getSummary', error: error.message });
      throw error;
    }
  },

  /**
   * Obtiene los indicadores clave de rendimiento (KPIs)
   */
  async getKPIs(params: BIParams = {}): Promise<{ data: KPIData[] }> {
    try {
      return await apiClient.get('/dashboard/kpis', { params });
    } catch (error: any) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  },

  /**
   * Obtiene las alertas consolidadas activas
   */
  async getAlerts(params: BIParams = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/dashboard/alerts', { params });
    } catch (error: any) {
      console.error('Error fetching dashboard alerts:', error);
      throw error;
    }
  },

  /**
   * Obtiene los productos más vendidos (Top Products)
   */
  async getTopProducts(params: BIParams & { limit?: number; sort_by?: string } = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/dashboard/top-products', { params });
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  /**
   * Obtiene el mapa de calor de ventas
   */
  async getSalesHeatmap(params: BIParams & { weeks?: number } = {}): Promise<{ data: SalesHeatmapData[] }> {
    try {
      return await apiClient.get('/dashboard/sales-heatmap', { params });
    } catch (error: any) {
      console.error('Error fetching sales heatmap:', error);
      throw error;
    }
  },

  /**
   * Obtiene las tendencias del negocio
   */
  async getTrends(params: BIParams = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/dashboard/trends', { params });
    } catch (error: any) {
      console.error('Error fetching dashboard trends:', error);
      throw error;
    }
  },

  /**
   * Obtiene la actividad reciente global o de sucursal
   */
  async getRecentActivity(params: { limit?: number; branch_id?: number } = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/dashboard/recent-activity', { params });
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }
};

export default dashboardService;
