import { apiClient } from './api';
import { ProductVariant, VariantStockSum } from '@/types';

export const variantService = {
  getVariantsByProductId: async (productId: string, includeInactive: boolean = false): Promise<ProductVariant[]> => {
    try {
      const response: any = await apiClient.get(`/products/${productId}/variants`, { params: { include_inactive: includeInactive } });
      return response.variants || response.data?.variants || (Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }
  },

  getEnrichedVariants: async (productId: string, branchId?: number, includeInactive: boolean = false): Promise<ProductVariant[]> => {
    try {
      const variants = await variantService.getVariantsByProductId(productId, includeInactive);
      if (!variants || variants.length === 0) return [];

      let units: any[] = [];
      try {
        const unitsRes = await apiClient.get(`/products/${productId}/units`);
        const rawUnits = unitsRes?.data?.data || unitsRes?.data || unitsRes;
        units = Array.isArray(rawUnits) ? rawUnits : [];
      } catch (err) {
        console.warn('Could not fetch units for variants', err);
      }

      const enriched = await Promise.all(variants.map(async (v) => {
        try {
          const stockRes: any = await apiClient.get(`/api/v1/variants/${v.id}/stock`, { params: { branch_id: branchId } });
          const stockData = stockRes.data || stockRes;
          v.stock_quantity = stockData.total_stock || 0;
        } catch (err) {
          v.stock_quantity = 0;
        }

        const variantPrice = units.find(u => u.variant_id === v.id);
        const parentPrice = units.find(u => !u.variant_id);
        
        if (variantPrice?.price_per_unit) {
          v.current_price = variantPrice.price_per_unit;
        } else if (parentPrice?.price_per_unit) {
          v.current_price = parentPrice.price_per_unit;
        }

        return v;
      }));

      return enriched;
    } catch (error) {
      console.error('Error fetching enriched variants:', error);
      throw error;
    }
  },

  createVariant: async (productId: string, data: Partial<ProductVariant> & { initial_stock?: number, initial_price?: number, stock_branch_id?: number }): Promise<ProductVariant> => {
    try {
      const response = await apiClient.post(`/products/${productId}/variants`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  },

  getVariantById: async (id: string): Promise<ProductVariant> => {
    try {
      const response = await apiClient.get(`/api/v1/variants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching variant:', error);
      throw error;
    }
  },

  updateVariant: async (id: string, data: Partial<ProductVariant>): Promise<void> => {
    try {
      await apiClient.put(`/api/v1/variants/${id}`, data);
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  },

  deleteVariant: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/variants/${id}`);
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  },

  getVariantStock: async (id: string, branchId?: number): Promise<VariantStockSum> => {
    try {
      const response = await apiClient.get(`/api/v1/variants/${id}/stock`, { params: { branch_id: branchId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching variant stock:', error);
      throw error;
    }
  },

  getTotalStock: async (productId: string, branchId?: number): Promise<VariantStockSum> => {
    try {
      const response = await apiClient.get(`/products/${productId}/total-stock`, { params: { branch_id: branchId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching total stock:', error);
      throw error;
    }
  }
};
