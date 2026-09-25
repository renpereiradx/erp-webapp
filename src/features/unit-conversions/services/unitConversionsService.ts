import { apiService as apiClient } from '@/services/api';

export interface UnitConversion {
  from_unit: string;
  to_unit: string;
  factor: string;
  /** null/undefined = conversión global; id de producto = específica. */
  product_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UnitConversionTemplate {
  from_unit: string;
  to_unit: string;
  factor: string;
  example: string;
}

export interface UpsertUnitConversionInput {
  from_unit: string;
  to_unit: string;
  factor: string;
  /** Vacío/null = conversión global (aplica a todo el catálogo). */
  product_id?: string | null;
}

class UnitConversionsService {
  async getAll(): Promise<UnitConversion[]> {
    const response = await apiClient.get('/unit-conversions');
    return response.data?.data || [];
  }

  /** Conversiones específicas de un producto (no incluye las globales). */
  async getByProduct(productId: string): Promise<UnitConversion[]> {
    const response = await apiClient.get('/unit-conversions', { params: { product_id: productId } });
    return response.data?.data || [];
  }

  async getTemplate(): Promise<UnitConversionTemplate[]> {
    const response = await apiClient.get('/unit-conversions/template');
    return response.data?.template || [];
  }

  async createOrUpdate(data: UpsertUnitConversionInput): Promise<UnitConversion> {
    const response = await apiClient.post('/unit-conversions', data);
    return response.data;
  }

  async delete(fromUnit: string, toUnit: string, productId?: string | null): Promise<void> {
    await apiClient.delete(`/unit-conversions/${fromUnit}/${toUnit}`, {
      ...(productId ? { params: { product_id: productId } } : {}),
    });
  }
}

export const unitConversionsService = new UnitConversionsService();
