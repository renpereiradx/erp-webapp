import { apiService as apiClient } from '@/services/api';

export interface UnitConversion {
  from_unit: string;
  to_unit: string;
  factor: string;
  created_at?: string;
  updated_at?: string;
}

export interface UnitConversionTemplate {
  from_unit: string;
  to_unit: string;
  factor: string;
  example: string;
}

class UnitConversionsService {
  async getAll(): Promise<UnitConversion[]> {
    const response = await apiClient.get('/unit-conversions');
    return response.data?.data || [];
  }

  async getTemplate(): Promise<UnitConversionTemplate[]> {
    const response = await apiClient.get('/unit-conversions/template');
    return response.data?.template || [];
  }

  async createOrUpdate(data: { from_unit: string; to_unit: string; factor: string }): Promise<UnitConversion> {
    const response = await apiClient.post('/unit-conversions', data);
    return response.data;
  }

  async delete(fromUnit: string, toUnit: string): Promise<void> {
    await apiClient.delete(`/unit-conversions/${fromUnit}/${toUnit}`);
  }
}

export const unitConversionsService = new UnitConversionsService();
