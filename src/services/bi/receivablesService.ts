import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams, FinancialOverview, AgingReportItem } from '../../types/bi';

/**
 * Servicio de Cuentas por Cobrar (BI - Receivables)
 * Actualizado para compatibilidad con hooks existentes y nuevo estándar BI.
 */
export const receivablesService = {
  /**
   * Resumen general de cuentas por cobrar (Nuevo Estándar)
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
   * Alias para getOverview (Compatibilidad)
   */
  async getSummary(period: string = 'month'): Promise<any> {
    return this.getOverview({ period });
  },

  /**
   * Alias para getOverview (Compatibilidad)
   */
  async getStatistics(period: string = 'month'): Promise<any> {
    return this.getOverview({ period });
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
   * Alias para getAgingReport (Compatibilidad)
   */
  async getDetailedAging(params: BIParams = {}): Promise<any> {
    return this.getAgingReport(params);
  },

  /**
   * Alias para getAgingReport (Compatibilidad)
   */
  async getAgingSummary(params: BIParams = {}): Promise<any> {
    return this.getAgingReport(params);
  },

  /**
   * Alias para getAgingReport (Compatibilidad)
   */
  async getAging(params: BIParams = {}): Promise<any> {
    return this.getAgingReport(params);
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
   * Obtiene el perfil/cuentas de un cliente específico
   */
  async getClientProfile(clientId: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/client/${clientId}`);
    } catch (error: any) {
      console.error(`Error fetching profile for client ${clientId}:`, error);
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
  },

  /**
   * Alias para getClientRisk (Compatibilidad)
   */
  async getClientRiskAnalysis(clientId: string): Promise<any> {
    return this.getClientRisk(clientId);
  },

  /**
   * Principales deudores
   */
  async getTopDebtors(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/receivables/top-debtors', { params });
    } catch (error: any) {
      console.error('Error fetching top debtors:', error);
      throw error;
    }
  }
};

export default receivablesService;
