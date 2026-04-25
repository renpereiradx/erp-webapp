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
   * Lista logs de auditoría con filtros
   */
  async getLogs(filters: {
    user_id?: string;
    category?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
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
  async getDashboardSummary(): Promise<AuditDashboardSummary> {
    try {
      return await apiClient.get(API_ENDPOINTS.AUDIT_DASHBOARD);
    } catch (error: any) {
      console.error('Error fetching audit dashboard summary:', error);
      throw error;
    }
  }
};

export default auditService;
