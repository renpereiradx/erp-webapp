import { apiClient } from './api';

export const attributeService = {
  getApplicableAttributes: async (productId: string) => {
    return apiClient.makeRequest(`/products/${productId}/applicable-attributes`, {
      method: 'GET',
    });
  },
  
  getCategoryAttributes: async (categoryId: string | number) => {
    return apiClient.makeRequest(`/api/v1/attributes/definitions/category/${categoryId}`, {
      method: 'GET',
    });
  },

  getAllDefinitions: async () => {
    return apiClient.makeRequest('/api/v1/attributes/definitions', {
      method: 'GET',
    });
  },

  createDefinition: async (data: any) => {
    return apiClient.makeRequest('/api/v1/attributes/definitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDefinition: async (id: number) => {
    return apiClient.makeRequest(`/api/v1/attributes/definitions/${id}`, {
      method: 'DELETE',
    });
  },

  updateDefinition: async (id: number | string, data: any) => {
    return apiClient.makeRequest(`/api/v1/attributes/definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getProductAttributes: async (productId: string) => {
    return apiClient.makeRequest(`/products/${productId}/attributes`, {
      method: 'GET',
    });
  },

  assignProductAttribute: async (productId: string, attributeId: string | number, data: any) => {
    return apiClient.makeRequest(`/products/${productId}/attributes/${attributeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  bulkAssignProductAttributes: async (productId: string, attributes: any[]) => {
    return apiClient.makeRequest(`/products/${productId}/attributes`, {
      method: 'POST',
      body: JSON.stringify({ attributes }),
    });
  }
};
