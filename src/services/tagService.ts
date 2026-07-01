import { apiClient } from './api';

export const tagService = {
  getAll: async () => {
    return apiClient.makeRequest('/api/v1/tags', {
      method: 'GET',
    });
  },

  create: async (data: { name: string; color?: string; icon?: string; tag_type?: string; category_id?: number | null }) => {
    return apiClient.makeRequest('/api/v1/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return apiClient.makeRequest(`/api/v1/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiClient.makeRequest(`/api/v1/tags/${id}`, {
      method: 'DELETE',
    });
  },

  getProductTags: async (productId: string) => {
    return apiClient.makeRequest(`/products/${productId}/tags`, {
      method: 'GET',
    });
  },

  assignToProduct: async (productId: string, tagId: number) => {
    return apiClient.makeRequest(`/products/${productId}/tags/${tagId}`, {
      method: 'POST',
    });
  },

  removeFromProduct: async (productId: string, tagId: number) => {
    return apiClient.makeRequest(`/products/${productId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }
};
