import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { BIParams } from '../../types/bi';

/**
 * Servicio de Reportes Financieros (BI - Financial Reports)
 */
export const financialReportsService = {
  /**
   * Estado de Resultados (Income Statement)
   */
  async getIncomeStatement(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/income-statement', { params });
    } catch (error: any) {
      console.error('Error fetching income statement:', error);
      throw error;
    }
  },

  /**
   * Reporte de IVA (VAT Report)
   */
  async getVATReport(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/vat', { params });
    } catch (error: any) {
      console.error('Error fetching VAT report:', error);
      throw error;
    }
  },

  /**
   * Libro de Ventas Legal
   */
  async getSalesLedger(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/sales-ledger', { params });
    } catch (error: any) {
      console.error('Error fetching sales ledger:', error);
      throw error;
    }
  },

  /**
   * Libro de Compras Legal
   */
  async getPurchaseLedger(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/purchase-ledger', { params });
    } catch (error: any) {
      console.error('Error fetching purchase ledger:', error);
      throw error;
    }
  },

  /**
   * Score de Salud Financiera
   */
  async getHealthScore(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/health-score', { params });
    } catch (error: any) {
      console.error('Error fetching health score:', error);
      throw error;
    }
  }
};

export default financialReportsService;
