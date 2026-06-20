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
  create: async (data: { name: string }) => {
    try {
      const response = await (apiClient as any).post('/api/v1/brands', data);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }
};
