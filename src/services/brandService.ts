import apiClient from './api';

export const brandService = {
  getAll: async () => {
    try {
      const response = await (apiClient as any).get('/api/v1/brands');
      return response?.data?.data || response?.data || response?.brands || response || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },
  getById: async (id: string | number) => {
    try {
      const response = await (apiClient as any).get(`/api/v1/brands/${id}`);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error(`Error fetching brand ${id}:`, error);
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await (apiClient as any).post('/api/v1/brands', data);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },
  update: async (id: string | number, data: any) => {
    try {
      const response = await (apiClient as any).put(`/api/v1/brands/${id}`, data);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error(`Error updating brand ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string | number) => {
    try {
      const response = await (apiClient as any).delete(`/api/v1/brands/${id}`);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error(`Error deleting brand ${id}:`, error);
      throw error;
    }
  }
};

