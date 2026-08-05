import apiClient from './api';

// Adaptador de contrato: el frontend trabaja con Brand camelCase
// (features/brands/types/brand.ts) pero el backend espera/devuelve
// snake_case (internal/brand/dto.go: logo_url, is_active).

// Request: camelCase -> snake_case, solo campos que el backend conoce.
// - `slug` se omite: es derivado server-side.
// - `icon` se omite: no existe en el contrato backend.
// - `logo_url` vacío se omite: el validator `omitempty,url` rechazaría "".
const toApiPayload = (data: any): Record<string, any> => {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.logoUrl !== undefined && data.logoUrl !== '') payload.logo_url = data.logoUrl;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  return payload;
};

// Response: snake_case -> camelCase para la interfaz Brand del frontend.
const fromApiResponse = (brand: any): any => {
  if (!brand || typeof brand !== 'object') return brand;
  const { logo_url, is_active, ...rest } = brand;
  return {
    ...rest,
    logoUrl: logo_url,
    isActive: is_active,
  };
};

const fromApiResponseList = (data: any): any[] => {
  if (Array.isArray(data)) return data.map(fromApiResponse);
  return data;
};

export const brandService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/api/v1/brands');
      const data = response?.data?.data || response?.data || response?.brands || response || [];
      return fromApiResponseList(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },
  getById: async (id: string | number) => {
    try {
      const response = await apiClient.get(`/api/v1/brands/${id}`);
      const data = response?.data?.data || response?.data || response;
      return fromApiResponseList(data);
    } catch (error) {
      console.error(`Error fetching brand ${id}:`, error);
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/api/v1/brands', toApiPayload(data));
      const result = response?.data?.data || response?.data || response;
      return fromApiResponse(result);
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },
  update: async (id: string | number, data: any) => {
    try {
      const response = await apiClient.put(`/api/v1/brands/${id}`, toApiPayload(data));
      const result = response?.data?.data || response?.data || response;
      return fromApiResponse(result);
    } catch (error) {
      console.error(`Error updating brand ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string | number) => {
    try {
      const response = await apiClient.delete(`/api/v1/brands/${id}`);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error(`Error deleting brand ${id}:`, error);
      throw error;
    }
  }
};
