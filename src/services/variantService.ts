import { apiClient } from './api';
import { ProductVariant, VariantStockSum } from '@/types';

export const variantService = {
  getVariantsByProductId: async (productId: string, includeInactive: boolean = false): Promise<ProductVariant[]> => {
    try {
      const response = await apiClient.get(`/products/${productId}/variants`, { params: { include_inactive: includeInactive } });
      return response.data?.variants || response.data || [];
    } catch (error) {
      console.error('Error fetching variants:', error);
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
