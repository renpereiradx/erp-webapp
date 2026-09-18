import { apiClient } from '../api';
import { BIParams, FinancialOverview, AgingReportItem } from '../../types/bi';

/**
 * Servicio de Cuentas por Cobrar (BI - Receivables)
 * Actualizado para compatibilidad con hooks existentes y nuevo estándar BI.
 */
export const receivablesService = {
  /**
   * Resumen general de cuentas por cobrar (Nuevo Estándar).
   * Devuelve el envelope {success, data} tal como llega del BE — el tipo
   * honesto es lo que permite al store desenvolver .data (patrón
   * dashboardService.getSummary / fix NA-DB-1).
   */
  async getOverview(params: BIParams = {}): Promise<{ success?: boolean; data: FinancialOverview }> {
    try {
      return await apiClient.get('/receivables/overview', { params });
    } catch (error: any) {
      console.error('Error fetching receivables overview:', error);
      throw error;
    }
  },

  /**
   * @deprecated Alias de getOverview — usar el método canónico.
   */
  async getSummary(period: string = 'month'): Promise<any> {
    return this.getOverview({ period });
  },

  /**
   * @deprecated Alias de getOverview — usar el método canónico.
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
   * @deprecated Alias de getAgingReport — usar el método canónico.
   */
  async getDetailedAging(params: BIParams = {}): Promise<any> {
    return this.getAgingReport(params);
  },

  /**
   * Resumen de antigüedad por tramos (GET /receivables/aging/summary).
   * Contrato: {current, days_30_60, days_60_90, over_90_days} con
   * {amount, count, percentage}. NOTA: NO es alias del report detallado —
   * el dashboard de CxC consume los tramos de este endpoint.
   */
  async getAgingSummary(params: BIParams = {}): Promise<any> {
    try {
      return await apiClient.get('/receivables/aging/summary', { params });
    } catch (error: any) {
      console.error('Error fetching receivables aging summary:', error);
      throw error;
    }
  },

  /**
   * @deprecated Alias de getAgingReport — usar el método canónico.
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
   * @deprecated Alias de getClientRisk — usar el método canónico.
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
  },

  /**
   * @deprecated Alias de getOverdue — usar el método canónico.
   */
  async getOverdueAccounts(params: BIParams = {}): Promise<any> {
    return this.getOverdue(params);
  },

  /**
   * Lista maestra paginada (GET /receivables). El BE acepta `status` (enum),
   * `client_id`, `page`/`page_size` (cap 100) y `sort_by`/`sort_order`
   * (whitelist T3: date, amount, client, days_overdue). Filtros de UI sin
   * soporte BE (search/montos/días) viajan y son ignorados — gap documentado
   * en la auditoría 2B.
   */
  async getMasterList(
    filters: Record<string, any> = {},
    pagination: Record<string, any> = {},
    sorting: Record<string, any> = {},
  ): Promise<any> {
    try {
      const params: Record<string, any> = {
        ...filters,
        page: pagination.page,
        page_size: pagination.page_size ?? pagination.pageSize,
        sort_by: sorting.sortBy ?? 'date',
        sort_order: sorting.sortOrder ?? 'desc',
      };
      if (!params.status || params.status === 'all') delete params.status;
      return await apiClient.get('/receivables', { params });
    } catch (error: any) {
      console.error('Error fetching receivables master list:', error);
      throw error;
    }
  },

  /**
   * Detalle de una cuenta por cobrar (GET /receivables/{id}, 404 tipado)
   */
  async getTransactionDetail(id: string): Promise<any> {
    try {
      return await apiClient.get(`/receivables/${id}`);
    } catch (error: any) {
      console.error(`Error fetching receivable ${id}:`, error);
      throw error;
    }
  },

  /**
   * Historial de auditoría de la entidad detrás de la cuenta
   * (GET /api/v1/audit/entity/{entity_type}/{id}/history — gate audit:read).
   * Llamada opcional del hook de detalle: falla en silencio sin audit:read.
   */
  async getTransactionHistory(id: string, entityType = 'RECEIVABLE'): Promise<any> {
    try {
      return await apiClient.get(`/api/v1/audit/entity/${entityType}/${id}/history`);
    } catch (error: any) {
      console.error(`Error fetching history for ${entityType} ${id}:`, error);
      throw error;
    }
  }
};

export default receivablesService;
