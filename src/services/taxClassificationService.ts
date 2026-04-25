import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  SifenCodeInfo, 
  ProductTaxClassification, 
  AssignTaxClassificationRequest,
  BulkAssignTaxClassificationRequest,
  AutoClassifyRequest,
  API_ENDPOINTS 
} from '../types';

/**
 * Servicio para la gestión de Clasificación Fiscal (Tax Classification).
 * Ayuda a determinar automáticamente las tasas de IVA según códigos SIFEN.
 * Este módulo es operativo y utiliza el contexto de sucursal activa.
 */
export const taxClassificationService = {
  /**
   * Obtiene información de los códigos de clasificación fiscal SIFEN
   */
  async getInfo(): Promise<{ data: SifenCodeInfo[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.TAX_CLASSIFICATION_INFO || '/tax-classification/info');
      return response;
    } catch (error: any) {
      telemetry.record('tax_classification.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getInfo', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene las tasas impositivas default por clasificación
   */
  async getDefaults(): Promise<{ data: Record<string, number> }> {
    try {
      return await apiClient.get('/tax-classification/defaults');
    } catch (error: any) {
      console.error('Error fetching tax classification defaults:', error);
      throw error;
    }
  },

  /**
   * Obtiene la clasificación fiscal activa de un producto
   */
  async getByProductId(productId: string): Promise<ProductTaxClassification> {
    try {
      return await apiClient.get(`/tax-classification/product/${productId}`);
    } catch (error: any) {
      console.error(`Error fetching tax classification for product ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Asigna una clasificación fiscal a un producto
   */
  async assign(data: AssignTaxClassificationRequest): Promise<ProductTaxClassification> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post('/tax-classification/assign', data);
      telemetry.record('tax_classification.service.assign', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('tax_classification.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'assign', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Asignación masiva de clasificaciones fiscales
   */
  async bulkAssign(data: BulkAssignTaxClassificationRequest): Promise<{
    success: boolean;
    processed_count: number;
    failed_count: number;
    failures: any[];
  }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post('/tax-classification/bulk-assign', data);
      telemetry.record('tax_classification.service.bulk_assign', { 
        duration: Date.now() - startTime,
        count: data.product_ids?.length 
      });
      return response;
    } catch (error: any) {
      telemetry.record('tax_classification.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'bulkAssign', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Clasifica automáticamente productos según su categoría
   */
  async autoClassify(data: AutoClassifyRequest): Promise<{
    success: boolean;
    classified_count: number;
    message: string;
  }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post('/tax-classification/auto-classify', data);
      telemetry.record('tax_classification.service.auto_classify', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('tax_classification.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'autoClassify', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene una clasificación por su ID
   */
  async getById(id: number): Promise<ProductTaxClassification> {
    try {
      return await apiClient.get(`/tax-classification/${id}`);
    } catch (error: any) {
      console.error(`Error fetching tax classification ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza una clasificación existente
   */
  async update(id: number, data: Partial<AssignTaxClassificationRequest>): Promise<ProductTaxClassification> {
    try {
      return await apiClient.put(`/tax-classification/${id}`, data);
    } catch (error: any) {
      console.error(`Error updating tax classification ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una clasificación fiscal
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tax-classification/${id}`);
    } catch (error: any) {
      console.error(`Error deleting tax classification ${id}:`, error);
      throw error;
    }
  }
};

export default taxClassificationService;
