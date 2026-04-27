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
   * Lista maestra de cuentas por cobrar (con paginación y filtros)
   */
  async getMasterList(filters: any = {}, pagination: any = {}, sorting: any = {}): Promise<any> {
    try {
      const params = { ...filters, ...pagination, ...sorting };
      return await apiClient.get('/receivables/master-list', { params });
    } catch (error: any) {
      console.error('Error fetching receivables master list:', error);
      throw error;
    }
  },

  /**
   * Detalle de una transacción específica
   */
  async getTransactionDetail(id: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/transaction/${id}`);
    } catch (error: any) {
      console.error(`Error fetching detail for transaction ${id}:`, error);
      throw error;
    }
  },

  /**
   * Historial de cambios de una transacción
   */
  async getTransactionHistory(id: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/transaction/${id}/history`);
    } catch (error: any) {
      console.error(`Error fetching history for transaction ${id}:`, error);
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
   * Perfil de crédito del cliente
   */
  async getClientProfile(clientId: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/client/${clientId}/profile`);
    } catch (error: any) {
      console.error(`Error fetching profile for client ${clientId}:`, error);
      throw error;
    }
  },

  /**
   * Proyección de cobranzas (Forecast)
   */
  async getForecast(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/receivables/forecast', { params });
    } catch (error: any) {
      console.error('Error fetching receivables forecast:', error);
      throw error;
    }
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
