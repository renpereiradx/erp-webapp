import apiClient from './api';

export const brandService = {
  getAll: async () => {
    try {
      const response = await (apiClient as any).get('/products/brands');
      return response?.data?.data || response?.data || response?.brands || response || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },
  create: async (data: { name: string }) => {
    try {
      const response = await (apiClient as any).post('/products/brands', data);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }
};
