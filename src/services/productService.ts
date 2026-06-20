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
  Stock,
  CreateStockRequest,
  API_ENDPOINTS, 
  PaginatedResponse,
  UnitConversion
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

/**
 * Helper para eliminar productos duplicados (con el mismo ID) de los listados
 */
const deduplicateProducts = <T extends { id?: string; product_id?: string }>(products: T[]): T[] => {
  if (!Array.isArray(products)) return products;
  const seen = new Set<string>();
  return products.filter(p => {
    const id = p.id || p.product_id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const mapProductOperationInfoResponse = (p: any): ProductOperationInfoResponse => {
  if (!p) return p;
  return {
    ...p,
    id: p.product_id || p.id,
    name: p.product_name || p.name,
    is_active: p.state !== undefined ? p.state : p.is_active
  };
};

export const productService = {
  // =================== PRODUCTOS (LECTURA) ===================

  /**
   * Obtiene productos paginados (v3.0+)
   */
  async getProductsPaginated(page = 1, pageSize = 10, options: any = {}): Promise<ProductEnriched[]> {
    try {
      const results = await retryWithBackoff(async () => {
        return await apiClient.getProductsPaginated(page, pageSize, options);
      });
      return deduplicateProducts(results);
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
      const results = await apiClient.get('/products/all');
      return deduplicateProducts(results);
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
      const results = await retryWithBackoff(async () => {
        return await apiClient.searchProducts(term, options);
      });
      return deduplicateProducts(results);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error en la búsqueda de productos');
    }
  },

  /**
   * Búsqueda avanzada de productos
   */
  async searchAdvanced(payload: any, options: any = {}): Promise<any> {
    try {
      return await retryWithBackoff(async () => {
        return await (apiClient as any).searchProductsAdvanced(payload, options);
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error en la búsqueda avanzada de productos');
    }
  },

  /**
   * Obtener facetas de búsqueda
   */
  async getSearchFacets(params: any = {}, options: any = {}): Promise<any> {
    try {
      return await retryWithBackoff(async () => {
        return await (apiClient as any).getProductSearchFacets(params, options);
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error al obtener facetas de búsqueda');
    }
  },

  // =================== PRODUCTOS (OPERATIVO v3.2.0) ===================

  /**
   * Obtiene información operativa completa para un producto (v3.2.0)
   */
  async getInfo(id: string): Promise<ProductOperationInfoResponse> {
    try {
      return await retryWithBackoff(async () => {
        const data = await apiClient.getProductInfoById(id);
        return mapProductOperationInfoResponse(data);
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
        const data = await apiClient.getProductInfoByBarcode(barcode);
        return mapProductOperationInfoResponse(data);
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
      const results = await retryWithBackoff(async () => {
        return await apiClient.searchProductsInfoByName(name, options);
      });
      return deduplicateProducts(results).map(mapProductOperationInfoResponse);
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
      const data = await apiClient.getProductForSale(id);
      return mapProductOperationInfoResponse(data);
    } catch (error) {
      throw toApiError(error, 'Error al cargar producto para venta');
    }
  },

  /**
   * Obtiene datos de producto optimizados para COMPRA (v3.2.0)
   */
  async getForPurchase(id: string): Promise<ProductOperationInfoResponse> {
    try {
      const data = await apiClient.getProductForPurchase(id);
      return mapProductOperationInfoResponse(data);
    } catch (error) {
      throw toApiError(error, 'Error al cargar producto para compra');
    }
  },

  // =================== PRODUCTOS (FINANCIERO v3.2.0) ===================

  async getFinancial(id: string): Promise<any> {
    try {
      return await apiClient.getProductFinancial(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener información financiera del producto');
    }
  },

  async getFinancialByBarcode(barcode: string): Promise<any> {
    try {
      return await apiClient.getProductFinancialByBarcode(barcode);
    } catch (error) {
      throw toApiError(error, 'Error al buscar información financiera por código de barras');
    }
  },

  async searchFinancial(name: string, options: any = {}): Promise<any> {
    try {
      return await apiClient.searchProductsFinancialByName(name, options);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error en búsqueda de información financiera');
    }
  },

  async getMarginAlert(id: string): Promise<any> {
    try {
      return await apiClient.getProductMarginAlert(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener alertas de margen del producto');
    }
  },

  async getMarginReport(id: string): Promise<any> {
    try {
      return await apiClient.getProductMarginReport(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener reporte de margen del producto');
    }
  },

  async getSupplierComparison(id: string): Promise<any> {
    try {
      return await apiClient.getProductSupplierComparison(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener comparativa de proveedores del producto');
    }
  },

  async getWeightedAverage(id: string): Promise<any> {
    try {
      return await apiClient.getProductWeightedAverage(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener costo promedio ponderado del producto');
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

  async createProduct(data: Partial<Product>): Promise<ProductEnriched> {
    return this.create(data);
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<ProductEnriched> {
    return this.update(id, data);
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.delete(id);
  },

  // =================== STOCK (v3.3.0) ===================

  async createStock(productId: string, data: CreateStockRequest): Promise<{ message: string }> {
    try {
      return await apiClient.createStock(productId, data);
    } catch (error) {
      throw toApiError(error, 'Error al crear stock para el producto');
    }
  },

  async getStockById(id: number): Promise<{ data: Stock }> {
    try {
      return await apiClient.getStockById(id);
    } catch (error) {
      throw toApiError(error, 'Error al obtener stock por ID');
    }
  },

  async getStockByProductId(productId: string): Promise<{ data: Stock }> {
    try {
      return await apiClient.getStockByProductId(productId);
    } catch (error) {
      throw toApiError(error, 'Error al obtener stock por producto');
    }
  },

  async updateStockById(id: number, data: Partial<Stock>): Promise<{ message: string }> {
    try {
      return await apiClient.updateStockById(id, data);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar stock por ID');
    }
  },

  async updateStockByProductId(productId: string, data: Partial<Stock>): Promise<{ message: string }> {
    try {
      return await apiClient.updateStockByProductId(productId, data);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar stock por producto');
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
  },

  validateProductData(productData: any) {
    if (!productData) {
      throw new Error('Los datos del producto son requeridos');
    }
    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim() === '') {
      throw new Error('El nombre del producto es requerido');
    }
    if (productData.category_id === undefined || productData.category_id === null || isNaN(Number(productData.category_id))) {
      throw new Error('La categoría del producto es requerida');
    }
    if (productData.price !== undefined && productData.price !== null && Number(productData.price) < 0) {
      throw new Error('El precio del producto no puede ser negativo');
    }
  },

  async reactivateProduct(id: string): Promise<ProductEnriched> {
    return this.update(id, { state: true, is_active: true });
  },

  async getProductByIdInfo(id: string): Promise<ProductOperationInfoResponse> {
    return this.getInfo(id);
  },

  async getProductByBarcodeInfo(barcode: string): Promise<ProductOperationInfoResponse> {
    return this.getInfoByBarcode(barcode);
  },

  async getProductById(id: string): Promise<ProductEnriched> {
    return this.getById(id);
  },

  async getProductByBarcode(barcode: string): Promise<ProductEnriched> {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductByBarcode(barcode);
      });
    } catch (error) {
      throw toApiError(error, `Error al obtener producto por código de barras ${barcode}`);
    }
  },


  // =================== CONVERSIONES DE UNIDAD (v1.0.0) ===================

  async getUnitConversions(): Promise<UnitConversion[]> {
    try {
      const response = await apiClient.getUnitConversions();
      return response.data || [];
    } catch (error) {
      throw toApiError(error, 'Error al obtener conversiones de unidad');
    }
  },

  async createUnitConversion(data: Omit<UnitConversion, 'created_at' | 'updated_at'>): Promise<UnitConversion> {
    try {
      return await apiClient.createUnitConversion(data);
    } catch (error) {
      throw toApiError(error, 'Error al crear/actualizar conversión de unidad');
    }
  },

  async deleteUnitConversion(fromUnit: string, toUnit: string): Promise<{ message: string }> {
    try {
      return await apiClient.deleteUnitConversion(fromUnit, toUnit);
    } catch (error) {
      throw toApiError(error, 'Error al eliminar conversión de unidad');
    }
  }
};

export default productService;
