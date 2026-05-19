import { apiClient } from './api';
import { mockLogs, mockSummary, mockUserActivity } from './mocks/auditMocks';

const isDemoMode = import.meta.env.VITE_USE_DEMO === 'true';

const auditService = {
  /**
   * Obtiene los logs de auditoría con soporte para filtros
   */
  getLogs: async (params: Record<string, any> = {}): Promise<any> => {
    if (isDemoMode) {
      console.log('[Mock] Fetching audit logs with params:', params);
      return Promise.resolve(mockLogs.data);
    }
    
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await apiClient.get(`/api/v1/audit/logs?${queryParams.toString()}`);
    return (response as any).data;
  },

  /**
   * Historial de cambios de una entidad específica
   */
  getEntityHistory: async (entityType: string, entityId: string | number): Promise<any> => {
    if (isDemoMode) {
      console.log(`[Mock] Fetching audit history for ${entityType} ID: ${entityId}`);
      // Fallback a un log mock si es demo
      return Promise.resolve([mockLogs.data.logs[0]]);
    }
    
    const response = await apiClient.get(`/api/v1/audit/entity/${entityType}/${entityId}/history`);
    return (response as any).data;
  },

  /**
   * Obtiene el resumen/dashboard de auditoría
   */
  getDashboard: async (): Promise<any> => {
    if (isDemoMode) {
      console.log(`[Mock] Fetching audit dashboard`);
      return Promise.resolve(mockSummary.data);
    }
    
    const response = await apiClient.get(`/api/v1/audit/dashboard`);
    // Asegurarse de retornar el formato esperado o la respuesta completa
    return (response as any).data || response;
  }
};

export default auditService;
