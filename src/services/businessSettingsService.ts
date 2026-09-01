import apiClient from './api';

// Cliente del contexto business_settings (backend internal/settings).
// El backend solo acepta claves allowlisteadas: una clave desconocida
// responde 400 — el catálogo de claves vive server-side.

export interface BusinessSetting {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by?: string;
}

export const businessSettingsService = {
  getAll: async (): Promise<BusinessSetting[]> => {
    try {
      const response = await apiClient.get('/api/v1/settings');
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching business settings:', error);
      throw error;
    }
  },

  update: async (key: string, value: unknown): Promise<BusinessSetting> => {
    try {
      const response = await apiClient.put(`/api/v1/settings/${key}`, { value });
      return response?.data || { key, value, updated_at: '' };
    } catch (error) {
      console.error(`Error updating business setting ${key}:`, error);
      throw error;
    }
  },
};
