import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import { 
  AuditLog, 
  AuditDashboardSummary, 
  EntityHistoryEntry, 
  API_ENDPOINTS, 
  PaginatedResponse 
} from '../../types';

/**
 * Servicio para la gestión de Logs de Auditoría.
 * Permite rastrear cambios de entidades y actividad de usuarios.
 */
export const auditService = {
  /**
   * Lista logs de auditoría con filtros (GET /api/v1/audit/logs).
   * El BE pagina de verdad (page/page_size, cap 100) y acepta además
   * level, search, success, entity_type, entity_id, ip_address,
   * sort_by/sort_order — la página de Logs consume el conjunto completo.
   */
  async getLogs(filters: {
    user_id?: string;
    category?: string;
    action?: string;
    level?: string;
    search?: string;
    success?: string;
    entity_type?: string;
    entity_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<PaginatedResponse<AuditLog>> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS, { params: filters });
      telemetry.record('audit.service.list', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('audit.service.error', {
        duration: Date.now() - startTime,
        operation: 'getLogs',
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Tendencias de actividad de auditoría (GET /api/v1/audit/trends?period=).
   * Contrato: []AuditTrend {date, label, total_actions, successful, failed,
   * unique_users, error_rate} — fuente real de la curva del dashboard.
   */
  async getTrends(period: string = 'month'): Promise<any> {
    try {
      return await apiClient.get('/api/v1/audit/trends', { params: { period } });
    } catch (error: any) {
      console.error('Error fetching audit trends:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de cambios de una entidad específica
   */
  async getEntityHistory(type: string, id: string): Promise<{ data: EntityHistoryEntry[] }> {
    try {
      return await apiClient.get(API_ENDPOINTS.AUDIT_ENTITY_HISTORY(type, id));
    } catch (error: any) {
      console.error(`Error fetching history for ${type}:${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el resumen del dashboard de auditoría
   */
  async getDashboardSummary(params: { period?: string } = {}): Promise<AuditDashboardSummary> {
    try {
      return await apiClient.get(API_ENDPOINTS.AUDIT_DASHBOARD, { params });
    } catch (error: any) {
      console.error('Error fetching audit dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Alias para getDashboardSummary (compatibilidad con UI antigua)
   */
  async getSummary(period: string = 'month'): Promise<any> {
    return this.getDashboardSummary({ period });
  },

  /**
   * Obtiene un log específico por ID
   */
  async getLogById(id: string | number): Promise<any> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.AUDIT_LOGS}/${id}`);
      return (response as any).data || response;
    } catch (error: any) {
      console.error(`Error fetching audit log ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el reporte de actividad de un usuario
   */
  async getUserActivity(userId: string | number, period: string = 'month'): Promise<any> {
    try {
      return await apiClient.get(`/api/v1/audit/users/${userId}/activity`, { params: { period } });
    } catch (error: any) {
      console.error(`Error fetching activity for user ${userId}:`, error);
      throw error;
    }
  }
};

export default auditService;
