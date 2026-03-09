import { apiClient } from './api';
import { mockLogs, mockSummary, mockUserActivity } from './mocks/auditMocks';

const isDemoMode = import.meta.env.VITE_USE_DEMO === 'true';

const auditService = {
  /**
   * Obtiene los logs de auditoría con soporte para filtros
   */
  getLogs: async (params = {}) => {
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
    return response.data;
  },

  /**
   * Obtiene un log específico por ID
   */
  getLogById: async (id) => {
    if (isDemoMode) {
      console.log(`[Mock] Fetching audit log by ID: ${id}`);
      const log = mockLogs.data.logs.find(l => l.id.toString() === id.toString());
      return Promise.resolve(log || mockLogs.data.logs[0]);
    }
    
    const response = await apiClient.get(`/api/v1/audit/logs/${id}`);
    return response.data;
  },

  /**
   * Obtiene el resumen/dashboard de auditoría
   */
  getSummary: async (period = 'month') => {
    if (isDemoMode) {
      console.log(`[Mock] Fetching audit summary for period: ${period}`);
      return Promise.resolve(mockSummary.data);
    }
    
    const response = await apiClient.get(`/api/v1/audit/summary?period=${period}`);
    return response.data;
  },

  /**
   * Obtiene el reporte de actividad de un usuario
   */
  getUserActivity: async (userId, period = 'month') => {
    if (isDemoMode) {
      console.log(`[Mock] Fetching user activity for ${userId} in period: ${period}`);
      return Promise.resolve(mockUserActivity.data);
    }
    
    const response = await apiClient.get(`/api/v1/audit/users/${userId}/activity?period=${period}`);
    return response.data;
  }
};

export default auditService;