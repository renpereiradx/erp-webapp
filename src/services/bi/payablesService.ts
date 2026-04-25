import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams, FinancialOverview, AgingReportItem } from '../../types/bi';

/**
 * Servicio de Cuentas por Pagar (BI - Payables)
 */
export const payablesService = {
  /**
   * Resumen general de cuentas por pagar
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
   * Proyección de flujo de caja (Cash Flow)
   */
  async getCashFlow(params: BIParams = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/payables/cash-flow', { params });
    } catch (error: any) {
      console.error('Error fetching cash flow projection:', error);
      throw error;
    }
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
  }
};

export default payablesService;
