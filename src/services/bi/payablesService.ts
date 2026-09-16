import { apiClient } from '../api';
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
   * Lista paginada de facturas (GET /payables).
   * El BE acepta `status` (enum), `supplier_id`, `page`/`page_size` (cap 100)
   * y `sort_by`/`sort_order` (whitelist: due_date, date, amount, supplier,
   * priority). El resto de filtros de la UI viajan pero el endpoint hoy los
   * ignora (gap de contrato documentado en la auditoría 2A).
   */
  async getPayables(filters: Record<string, any> = {}, pagination: Record<string, any> = {}): Promise<any> {
    try {
      const params: Record<string, any> = {
        ...filters,
        page: pagination.page,
        page_size: pagination.page_size ?? pagination.pageSize,
      };
      // 'all' es sentinela de la UI: el enum del BE no lo acepta (devolvería 0 filas)
      if (!params.status || params.status === 'all') delete params.status;
      return await apiClient.get('/payables', { params });
    } catch (error: any) {
      console.error('Error fetching payables list:', error);
      throw error;
    }
  },

  /**
   * Detalle de una factura por ID (GET /payables/{id}, 404 tipado post-T6)
   */
  async getPayableById(id: string): Promise<any> {
    try {
      return await apiClient.get(`/payables/${id}`);
    } catch (error: any) {
      console.error(`Error fetching payable ${id}:`, error);
      throw error;
    }
  },

  /**
   * Proveedores con mayor deuda (GET /payables/top-suppliers?limit=N)
   */
  async getTopSuppliers(limit = 10): Promise<any> {
    try {
      return await apiClient.get('/payables/top-suppliers', { params: { limit } });
    } catch (error: any) {
      console.error('Error fetching top suppliers:', error);
      throw error;
    }
  },

  /**
   * Calendario de pagos próximos (GET /payables/schedule?days=N).
   * Contrato: PaymentCalendar {start_date, end_date, total_due, schedule[]}.
   */
  async getSchedule(days = 30): Promise<any> {
    try {
      return await apiClient.get('/payables/schedule', { params: { days } });
    } catch (error: any) {
      console.error('Error fetching payment schedule:', error);
      throw error;
    }
  },

  /**
   * Resumen de antigüedad por tramos (GET /payables/aging/summary)
   */
  async getAgingSummary(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/payables/aging/summary', { params });
    } catch (error: any) {
      console.error('Error fetching payables aging summary:', error);
      throw error;
    }
  },

  /**
   * Estadísticas por período (GET /payables/statistics?period=today|week|month|year)
   */
  async getStatistics(period = 'month'): Promise<any> {
    try {
      return await apiClient.get('/payables/statistics', { params: { period } });
    } catch (error: any) {
      console.error('Error fetching payables statistics:', error);
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
