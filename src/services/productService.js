/**
 * Servicio para la gestión de productos en el sistema ERP
 * Implementa sistema modular de mock data sin valores hardcodeados
 * Incluye fallback robusto para funcionalidad completa offline
 */

import { apiClient } from './api';
import BusinessManagementAPI from './BusinessManagementAPI';
import { ApiError, toApiError } from '@/utils/ApiError';
import { MockDataService, MOCK_CONFIG } from '@/config/mockData';
import { telemetryService } from './telemetryService';

/**
 * Helper para retry con backoff exponencial en errores de red
 */
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // No hacer retry si es AbortError o si es el último intento
      if (error?.name === 'AbortError' || attempt === maxRetries) {
        throw error;
      }
      
      // Solo hacer retry en errores de red
      const isNetworkError = error.message?.includes('ERR_CONNECTION_TIMED_OUT') || 
                            error.message?.includes('Network Error') ||
                            error.message?.includes('Failed to fetch') ||
                            error.code === 'NETWORK_ERROR';
      
      if (!isNetworkError) {
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * @typedef {import('@/types').Product} Product
 * @typedef {import('@/types').ProductDescription} ProductDescription
 * @typedef {import('@/types').ProductPrice} ProductPrice
 * @typedef {import('@/types').Stock} Stock
 */

export const productService = {
  // =================== PRODUCTOS ===================
  
  // Obtener productos paginados
  /**
   * @param {number} [page=1]
   * @param {number} [pageSize=10]
   * @param {Object} [filters={}]
   * @returns {Promise<Product[]|any>}
   */
  getProducts: async (page = 1, pageSize = 10, filters = {}) => {
    const startTime = performance.now();
    
    try {
      // Intentar API real si está habilitado
      if (!MOCK_CONFIG.useRealAPI) {
        throw new Error('Mock mode enabled - using mock data');
      }
      
      const result = await retryWithBackoff(async () => {
        return await apiClient.getProducts(page, pageSize);
      });
      
      telemetryService?.recordMetric('products_fetched_api', result.data?.length || 0);
      return result;
      
    } catch (error) {
      console.warn('🔄 Products API unavailable, using modular mock data...');
      
      // Fallback a mock data modular
      const mockResult = await MockDataService.getProducts({
        page,
        pageSize,
        ...filters
      });
      
      telemetryService?.recordMetric('products_fetched_mock', mockResult.data?.length || 0);
      
      if (MOCK_CONFIG.development?.verbose) {
        console.log('✅ Products loaded from modular mock system:', mockResult.data.length);
      }
      
      return mockResult;
    } finally {
      const endTime = performance.now();
      telemetryService?.recordMetric('get_products_duration', endTime - startTime);
    }
  },

  // Obtener un producto por ID
  /**
   * @param {string} productId
   * @returns {Promise<Product|any>}
   */
  getProductById: async (productId) => {
    const startTime = performance.now();
    
    try {
      // Intentar API real si está habilitado
      if (!MOCK_CONFIG.useRealAPI) {
        throw new Error('Mock mode enabled - using mock data');
      }
      
      const result = await retryWithBackoff(async () => {
        return await apiClient.getProductById(productId);
      });
      
      telemetryService?.recordMetric('product_fetched_by_id_api', 1);
      return result;
      
    } catch (error) {
      console.warn(`🔄 Product API unavailable for ID ${productId}, using modular mock data...`);
      
      // Fallback a mock data modular
      const mockProducts = await MockDataService.getProducts({ search: productId });
      const product = mockProducts.data.find(p => p.id === productId);
      
      if (!product) {
        throw new ApiError(`Product with ID ${productId} not found`, 'PRODUCT_NOT_FOUND', 404);
      }
      
      telemetryService?.recordMetric('product_fetched_by_id_mock', 1);
      
      return {
        success: true,
        data: product,
        source: 'mock'
      };
    } finally {
      const endTime = performance.now();
      telemetryService?.recordMetric('get_product_by_id_duration', endTime - startTime);
    }
  },

  // Obtener un producto enriquecido por ID (con precios, stock, descripción)
  /**
   * @param {string} productId
   * @returns {Promise<Product|any>}
   */
  getProductByIdEnriched: async (productId) => {
    try {
      // El endpoint /products/{id} ya devuelve datos enriquecidos según el ejemplo de Postman
      const product = await apiClient.getProductById(productId);
      
      // Si el producto no está marcado como enriquecido pero tiene datos enriquecidos, usar getProductWithDetails
      if (product && !product._enriched) {
        const hasEnrichedData = product.has_unit_pricing !== undefined || 
                               product.stock_status !== undefined ||
                               product.price_formatted !== undefined ||
                               product.has_valid_price !== undefined ||
                               product.unit_prices !== undefined;
        
        if (!hasEnrichedData) {
          // Solo usar getProductWithDetails si no hay datos enriquecidos
          return await apiClient.getProductWithDetails(productId);
        }
      }
      
      return product;
    } catch (error) {
      const norm = toApiError(error, 'Error al obtener producto enriquecido');
      throw norm;
    }
  },

  // Buscar productos por nombre
  /**
   * @param {string} name
   * @returns {Promise<Product[]|any>}
   */
  searchProductsByName: async (name) => {
    try {
      return await apiClient.searchProductsByName(name);
    } catch (error) {
      throw toApiError(error, 'Error al buscar productos por nombre');
    }
  },

  // Búsqueda inteligente: por ID o nombre
  /**
   * @param {string} searchTerm
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<Product[]|Product|any>}
   */
  searchProducts: async (searchTerm, { signal } = {}) => {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.searchProducts(searchTerm, { signal });
      });
    } catch (error) {
      // Permitimos que AbortError se propague tal cual
      if (error?.name === 'AbortError') throw error;
      throw toApiError(error, 'Error al buscar productos');
    }
  },

  // Crear un nuevo producto
  /**
   * @param {Partial<Product>} productData
   * @returns {Promise<Product|any>}
   */
  createProduct: async (productData) => {
    try {
      return await apiClient.createProduct(productData);
    } catch (error) {
      throw toApiError(error, 'Error al crear producto');
    }
  },

  // Actualizar un producto existente
  /**
   * @param {string} productId
   * @param {Partial<Product>} productData
   * @returns {Promise<Product|any>}
   */
  updateProduct: async (productId, productData) => {
    try {
      return await apiClient.updateProduct(productId, productData);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar producto');
    }
  },

  // Eliminar producto (soft delete)
  /**
   * @param {string} productId
   * @returns {Promise<boolean|any>}
   */
  deleteProduct: async (productId) => {
    try {
      return await apiClient.deleteProduct(productId);
    } catch (error) {
      throw toApiError(error, 'Error al eliminar producto');
    }
  },

  // =================== DESCRIPCIONES ===================

  // Crear descripción de producto
  /**
   * @param {string} productId
   * @param {string} description
   * @returns {Promise<ProductDescription|any>}
   */
  createProductDescription: async (productId, description) => {
    try {
      return await apiClient.createProductDescription(productId, description);
    } catch (error) {
      throw toApiError(error, 'Error al crear descripción');
    }
  },

  // Obtener descripción por ID
  /**
   * @param {number} descId
   * @returns {Promise<ProductDescription|any>}
   */
  getDescriptionById: async (descId) => {
    try {
      return await apiClient.getProductDescription(descId);
    } catch (error) {
      throw toApiError(error, 'Error al obtener descripción');
    }
  },

  // Actualizar descripción
  /**
   * @param {number} descId
   * @param {string} description
   * @returns {Promise<ProductDescription|any>}
   */
  updateDescription: async (descId, description) => {
    try {
      return await apiClient.updateProductDescription(descId, description);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar descripción');
    }
  },

  // =================== PRODUCTO CON DETALLES ===================

  // Obtener producto con detalles completos
  /**
   * @param {string} productId
   * @returns {Promise<Product|any>}
   */
  getProductWithDetails: async (productId) => {
    try {
      return await apiClient.getProductWithDetails(productId);
    } catch (error) {
      throw toApiError(error, 'Error al obtener producto con detalles');
    }
  },

  // Obtener descripciones de un producto por Product ID
  /**
   * @param {string} productId
   * @returns {Promise<ProductDescription[]|any[]>}
   */
  getProductDescriptions: async (productId) => {
    try {
      // Intentar obtener todas las descripciones del producto
      return await apiClient.makeRequest(`/products/${productId}/descriptions`);
    } catch (error) {
      const norm = error instanceof ApiError ? error : toApiError(error);
      // Si es NOT_FOUND, significa que no hay descripciones para este producto
      if (norm.code === 'NOT_FOUND') {
        console.log('ℹ️ No hay descripciones disponibles para el producto:', productId);
        return [];
      }
      // Para otros errores, registrar pero no romper flujo
      console.warn('⚠️ Error obteniendo descripciones para producto:', productId, norm.message);
      return [];
    }
  },

  // =================== PRECIOS ===================

  // Obtener precio de producto
  /**
   * @param {string} productId
   * @returns {Promise<ProductPrice|any>}
   */
  getProductPrice: async (productId) => {
    try {
      return await apiClient.getProductPrice(productId);
    } catch (error) {
      throw toApiError(error, 'Error al obtener precio');
    }
  },

  // Crear precio por Product ID
  /**
   * @param {string} productId
   * @param {Partial<ProductPrice>} priceData
   * @returns {Promise<ProductPrice|any>}
   */
  createProductPrice: async (productId, priceData) => {
    try {
      return await apiClient.setProductPrice(productId, priceData);
    } catch (error) {
      throw toApiError(error, 'Error al crear precio');
    }
  },

  // Actualizar precio por Product ID
  /**
   * @param {string} productId
   * @param {Partial<ProductPrice>} priceData
   * @returns {Promise<ProductPrice|any>}
   */
  updateProductPriceByProductId: async (productId, priceData) => {
    try {
      return await apiClient.updateProductPrice(productId, priceData);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar precio');
    }
  },

  // =================== STOCK ===================

  // Obtener stock por Product ID
  /**
   * @param {string} productId
   * @returns {Promise<Stock|any>}
   */
  getStockByProductId: async (productId) => {
    try {
      return await apiClient.getProductStock(productId);
    } catch (error) {
      throw toApiError(error, 'Error al obtener stock');
    }
  },

  // Crear stock
  /**
   * @param {string} productId
   * @param {Partial<Stock>} stockData
   * @returns {Promise<Stock|any>}
   */
  createStock: async (productId, stockData) => {
    try {
      return await apiClient.createStock(productId, stockData);
    } catch (error) {
      throw toApiError(error, 'Error al crear stock');
    }
  },

  // Actualizar stock por Product ID
  /**
   * @param {string} productId
   * @param {Partial<Stock>} stockData
   * @returns {Promise<Stock|any>}
   */
  updateStockByProductId: async (productId, stockData) => {
    try {
      return await apiClient.updateStockByProductId(productId, stockData);
    } catch (error) {
      throw toApiError(error, 'Error al actualizar stock');
    }
  },

  // Obtener stock por ID
  /**
   * @param {number} stockId
   * @returns {Promise<Stock|any>}
   */
  getStockById: async (stockId) => {
    return await apiClient.getStockById(stockId);
  },

  // =================== UTILIDADES ===================

  // Obtener categorías de productos
  /**
   * @returns {Promise<any>}
   */
  getCategories: async () => {
    return await apiClient.getCategories();
  },

  // Obtener todas las categorías
  /**
   * @returns {Promise<any[]>}
   */
  getAllCategories: async () => {
    try {
      return await retryWithBackoff(async () => {
        const api = new BusinessManagementAPI();
        return api.getAllCategories();
      });
    } catch (error) {
      throw toApiError(error, 'Error al obtener categorías');
    }
  },

  // Validar estructura de datos antes de envío
  /**
   * @param {Partial<Product>} productData
   * @returns {true}
   */
  validateProductData: (productData) => {
    const required = ['name'];
    const missing = required.filter(field => !productData[field]);
    if (missing.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }
    return true;
  },

  validatePriceData: (priceData) => {
    if (!priceData.costPrice && priceData.costPrice !== 0 && !priceData.cost_price && priceData.cost_price !== 0) {
      throw new Error('cost_price es requerido');
    }
    return true;
  },

  validateStockData: (stockData) => {
    if (!stockData.quantity && stockData.quantity !== 0) {
      throw new Error('quantity es requerido');
    }
    return true;
  },

  validateDescriptionData: (descriptionData) => {
    if (!descriptionData.description) {
      throw new Error('description es requerido');
    }
    return true;
  }
};

export default productService;

