import { apiClient } from '../api';
import { BIParams } from '../../types/bi';

/**
 * Filtros opcionales del libro IVA de ventas (FE5.1): estado SIFEN del DE
 * (exacto), CDC (coincidencia parcial) y timbrado (exacto). El backend los
 * acepta como query params opcionales en sales-ledger/date-range — sin
 * ellos la respuesta es idéntica a la previa (backward-compatible).
 */
export interface LedgerFilters {
  estado?: string;
  cdc?: string;
  timbrado?: string;
}

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
   * Flujo de Efectivo (Cash Flow)
   */
  async getCashFlow(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/cash-flow', { params });
    } catch (error: any) {
      console.error('Error fetching cash flow:', error);
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
   * Libro de Ventas por rango de fechas (FE5.1).
   * `filters` (opcional) filtra por estado SIFEN del DE (exacto), CDC
   * (coincidencia parcial) y timbrado (exacto). Sin filtros la respuesta
   * es idéntica a la previa (backward-compatible).
   */
  async getSalesLedgerDateRange(
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
    filters: LedgerFilters = {},
  ): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/sales-ledger/date-range', {
        params: {
          start_date: startDate,
          end_date: endDate,
          page,
          page_size: pageSize,
          ...filters,
        },
      });
    } catch (error: any) {
      console.error('Error fetching sales ledger by range:', error);
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
   * Libro de Compras por rango de fechas. Las compras no emiten DE (D-F5.3):
   * no aceptan filtros SIFEN.
   */
  async getPurchaseLedgerDateRange(
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
  ): Promise<any> {
    try {
      return await apiClient.get('/financial-reports/purchase-ledger/date-range', {
        params: { start_date: startDate, end_date: endDate, page, page_size: pageSize },
      });
    } catch (error: any) {
      console.error('Error fetching purchase ledger by range:', error);
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
