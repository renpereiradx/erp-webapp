import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams, FinancialOverview, AgingReportItem } from '../../types/bi';

/**
 * Servicio de Cuentas por Pagar (BI - Payables)
 * Actualizado para compatibilidad con hooks existentes y nuevo estándar BI.
 */
export const payablesService = {
  /**
   * Resumen general de cuentas por pagar (Nuevo Estándar)
   */
  async getOverview(params: BIParams = {}): Promise<FinancialOverview> {
    try {
      return await apiClient.get('/payables/overview', { params });
    } catch (error: any) {
      console.error('Error fetching payables overview:', error);
      throw error;
    }
  },

  /**
   * Alias para getOverview (Compatibilidad)
   */
  async getSummary(params: BIParams = {}): Promise<any> {
    return this.getOverview(params);
  },

  /**
   * Proyección de flujo de caja (Cash Flow)
   */
  async getCashFlow(params: any = {}): Promise<{ success: boolean, data: any }> {
    try {
      // Si params es un número, tratarlo como días
      const queryParams = typeof params === 'number' ? { days: params } : params;
      const response = await apiClient.get('/payables/cash-flow', { params: queryParams });
      return { success: true, data: response.data || response };
    } catch (error: any) {
      console.error('Error fetching cash flow projection:', error);
      throw error;
    }
  },

  /**
   * Alias para getCashFlow (Compatibilidad)
   */
  async getCashFlowProjection(days: number): Promise<any> {
    return this.getCashFlow(days);
  },

  /**
   * Lista de pagos urgentes
   */
  async getUrgent(params: BIParams = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/payables/urgent', { params });
    } catch (error: any) {
      console.error('Error fetching urgent payables:', error);
      throw error;
    }
  },

  /**
   * Reporte de antigüedad de deudas con proveedores
   */
  async getAgingReport(params: BIParams = {}): Promise<{ data: AgingReportItem[] }> {
    try {
      return await apiClient.get('/payables/aging/report', { params });
    } catch (error: any) {
      console.error('Error fetching payables aging report:', error);
      throw error;
    }
  },

  /**
   * Análisis detallado de un proveedor
   */
  async getSupplierAnalysis(supplierId: string): Promise<{ success: boolean, data: any }> {
    try {
      const response = await apiClient.get(`/payables/supplier/${supplierId}/analysis`);
      return { success: true, data: response.data || response };
    } catch (error: any) {
      console.error(`Error fetching analysis for supplier ${supplierId}:`, error);
      throw error;
    }
  }
};

export default payablesService;
