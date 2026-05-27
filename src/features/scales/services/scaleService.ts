import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';
import { Scale, LabelFormat, WeighItemResponse, LabelData, ScaleCatalogItem } from '@/types';

/**
 * Servicio encargado de gestionar la comunicación con los endpoints de Balanzas y Formatos de Etiquetas.
 */
export const scaleService = {
  // =================== CRUD BALANZAS ===================
  
  async getScales(branchId?: number): Promise<Scale[]> {
    const startTime = Date.now();
    try {
      const response = await apiClient.getScales(branchId);
      telemetry.record('scales.service.list', { duration: Date.now() - startTime });
      return response.data || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'getScales', error: error.message });
      throw error;
    }
  },

  async getScaleById(id: number): Promise<Scale> {
    try {
      return await apiClient.getScaleById(id);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'getScaleById', error: error.message });
      throw error;
    }
  },

  async createScale(data: Omit<Scale, 'id' | 'created_at' | 'updated_at' | 'is_connected' | 'sync_status'>): Promise<Scale> {
    try {
      return await apiClient.createScale(data);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'createScale', error: error.message });
      throw error;
    }
  },

  async updateScale(id: number, data: Partial<Scale>): Promise<Scale> {
    try {
      return await apiClient.updateScale(id, data);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'updateScale', error: error.message });
      throw error;
    }
  },

  async deleteScale(id: number): Promise<void> {
    try {
      await apiClient.deleteScale(id);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'deleteScale', error: error.message });
      throw error;
    }
  },

  // =================== CRUD FORMATOS DE ETIQUETA ===================

  async getLabelFormats(): Promise<LabelFormat[]> {
    try {
      const response = await apiClient.getLabelFormats();
      return response.data || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'getLabelFormats', error: error.message });
      throw error;
    }
  },

  async getLabelFormatById(id: number): Promise<LabelFormat> {
    try {
      return await apiClient.getLabelFormatById(id);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'getLabelFormatById', error: error.message });
      throw error;
    }
  },

  async createLabelFormat(data: Omit<LabelFormat, 'id' | 'created_at' | 'updated_at'>): Promise<LabelFormat> {
    try {
      return await apiClient.createLabelFormat(data);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'createLabelFormat', error: error.message });
      throw error;
    }
  },

  async updateLabelFormat(id: number, data: Partial<LabelFormat>): Promise<LabelFormat> {
    try {
      return await apiClient.updateLabelFormat(id, data);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'updateLabelFormat', error: error.message });
      throw error;
    }
  },

  async deleteLabelFormat(id: number): Promise<void> {
    try {
      await apiClient.deleteLabelFormat(id);
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'deleteLabelFormat', error: error.message });
      throw error;
    }
  },

  // =================== OPERACIONES BALANZAS ===================

  async weighItem(productId: string, weight: number, unit?: string, branchId?: number): Promise<WeighItemResponse> {
    try {
      const response = await apiClient.weighItem(productId, weight, unit, branchId);
      return response.data || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'weighItem', error: error.message });
      throw error;
    }
  },

  async generateBarcode(scaleCode: string, value: number): Promise<string> {
    try {
      const response = await apiClient.generateBarcode(scaleCode, value);
      return response.barcode || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'generateBarcode', error: error.message });
      throw error;
    }
  },

  async generateLabel(productId: string, weight: number, totalPrice: number, formatId: number): Promise<LabelData> {
    try {
      const response = await apiClient.generateLabel(productId, weight, totalPrice, formatId);
      return response.data || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'generateLabel', error: error.message });
      throw error;
    }
  },

  async getScaleCatalog(branchId?: number): Promise<ScaleCatalogItem[]> {
    try {
      const response = await apiClient.getScaleCatalog(branchId);
      return response.data || response;
    } catch (error: any) {
      telemetry.record('scales.service.error', { operation: 'getScaleCatalog', error: error.message });
      throw error;
    }
  }
};
