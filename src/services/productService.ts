/**
 * Servicio para la gestión de productos en el sistema ERP (v3.2.0)
 * Implementa soporte nativo para TypeScript y el contexto multi-sucursal.
 */

import { apiClient } from './api';
import { ApiError, toApiError } from '@/utils/ApiError';
import { telemetryService } from './telemetryService';
import { 
  Product, 
  ProductEnriched, 
  ProductOperationInfoResponse, 
  Category, 
  API_ENDPOINTS, 
  PaginatedResponse 
} from '@/types';

/**
 * Helper para retry con backoff exponencial en errores de red
 */
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1000): Promise<T> => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error?.name === 'AbortError' || attempt === maxRetries) throw error;

      const isNetworkError =
        error.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
        error.message?.includes('Network Error') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'NETWORK_ERROR';

      if (!isNetworkError) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const productService = {
  // =================== PRODUCTOS (LECTURA) ===================

  /**
   * Obtiene productos paginados (v3.0+)
   */
  async getProducts(page = 1, pageSize = 10, options: any = {}): Promise<ProductEnriched[]> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductsPaginated(page, pageSize, options);
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error al obtener productos paginados');
    }
  },

  /**
   * Obtiene todos los productos (v3.0+)
   */
  async getAll(): Promise<ProductEnriched[]> {
    try {
      return await apiClient.get('/products/all');
    } catch (error) {
      throw toApiError(error, 'Error al obtener catálogo de productos');
    }
  },

  /**
   * Obtiene un producto por ID con datos enriquecidos (v3.0+)
   */
  async getById(id: string): Promise<ProductEnriched> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductById(id);
      });
    } catch (error) {
      throw toApiError(error, `Error al obtener producto ${id}`);
    }
  },

  /**
   * Búsqueda inteligente por nombre o código (v3.0+)
   */
  async search(term: string, options: any = {}): Promise<ProductEnriched[]> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.searchProducts(term, options);
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error en la búsqueda de productos');
    }
  },

  // =================== PRODUCTOS (OPERATIVO v3.2.0) ===================

  /**
   * Obtiene información operativa completa para un producto (v3.2.0)
   */
  async getInfo(id: string): Promise<ProductOperationInfoResponse> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductInfoById(id);
      });
    } catch (error) {
      throw toApiError(error, 'Error al obtener información operativa del producto');
    }
  },

  /**
   * Obtiene información operativa por código de barras (v3.2.0)
   */
  async getInfoByBarcode(barcode: string): Promise<ProductOperationInfoResponse> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductInfoByBarcode(barcode);
      });
    } catch (error) {
      throw toApiError(error, 'Error al buscar producto por código de barras');
    }
  },

  /**
   * Búsqueda operativa por nombre con info completa (v3.2.0)
   */
  async searchInfo(name: string, options: { limit?: number; signal?: AbortSignal } = {}): Promise<ProductOperationInfoResponse[]> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.searchProductsInfoByName(name, options);
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error en búsqueda operativa');
    }
  },

  /**
   * Obtiene datos de producto optimizados para VENTA (v3.2.0)
   */
  async getForSale(id: string): Promise<ProductOperationInfoResponse> {
    try {
      return await apiClient.getProductForSale(id);
    } catch (error) {
      throw toApiError(error, 'Error al cargar producto para venta');
    }
  },

  /**
   * Obtiene datos de producto optimizados para COMPRA (v3.2.0)
   */
  async getForPurchase(id: string): Promise<ProductOperationInfoResponse> {
    try {
      return await apiClient.getProductForPurchase(id);
    } catch (error) {
      throw toApiError(error, 'Error al cargar producto para compra');
    }
  },

  // =================== PRODUCTOS (MUTACIÓN) ===================

  async create(data: Partial<Product>): Promise<ProductEnriched> {
    try {
      return await apiClient.createProduct(data);
    } catch (error) {
      throw toApiError(error, 'Error al crear producto');
    }
  },

  async update(id: string, data: Partial<Product>): Promise<ProductEnriched> {
    try {
      return await apiClient.updateProduct(id, data);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar producto');
    }
  },

  async delete(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.deleteProduct(id);
    } catch (error) {
      throw toApiError(error, 'Error al eliminar producto');
    }
  },

  // =================== CATEGORÍAS ===================

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/categories');
      return Array.isArray(response) ? response : (response.data || []);
    } catch (error) {
      throw toApiError(error, 'Error al obtener categorías');
    }
  }
};

export default productService;
