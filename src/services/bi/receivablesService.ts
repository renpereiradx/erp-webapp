import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams, FinancialOverview, AgingReportItem } from '../../types/bi';

/**
 * Servicio de Cuentas por Cobrar (BI - Receivables)
 */
export const receivablesService = {
  /**
   * Resumen general de cuentas por cobrar
   */
  async getOverview(params: BIParams = {}): Promise<FinancialOverview> {
    try {
      return await apiClient.get('/receivables/overview', { params });
    } catch (error: any) {
      console.error('Error fetching receivables overview:', error);
      throw error;
    }
  },

  /**
   * Reporte de antigüedad de deudas
   */
  async getAgingReport(params: BIParams = {}): Promise<{ data: AgingReportItem[] }> {
    try {
      return await apiClient.get('/receivables/aging/report', { params });
    } catch (error: any) {
      console.error('Error fetching receivables aging report:', error);
      throw error;
    }
  },

  /**
   * Lista de facturas vencidas
   */
  async getOverdue(params: BIParams = {}): Promise<{ data: any[] }> {
    try {
      return await apiClient.get('/receivables/overdue', { params });
    } catch (error: any) {
      console.error('Error fetching overdue receivables:', error);
      throw error;
    }
  },

  /**
   * Análisis de riesgo de un cliente
   */
  async getClientRisk(clientId: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/client/${clientId}/risk`);
    } catch (error: any) {
      console.error(`Error fetching risk for client ${clientId}:`, error);
      throw error;
    }
  }
};

export default receivablesService;
