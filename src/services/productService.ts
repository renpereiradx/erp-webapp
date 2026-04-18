/**
 * Servicio para la gestión de productos en el sistema ERP
 * Implementa sistema modular de mock data sin valores hardcodeados
 * Incluye fallback robusto para funcionalidad completa offline
 */

import { apiClient } from './api'
import BusinessManagementAPI from './BusinessManagementAPI'
import { ApiError, toApiError } from '@/utils/ApiError'
// Removed MockDataService import - using real API only
import { telemetryService } from './telemetryService'
import { DEMO_CONFIG } from '@/config/demoAuth'
import { DEMO_PRODUCT_DATA } from '@/config/demoData'

/**
 * Helper para retry con backoff exponencial en errores de red
 */
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 1000) => {
  if (DEMO_CONFIG.enabled) return await fn()
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // No hacer retry si es AbortError o si es el último intento
      if (error?.name === 'AbortError' || attempt === maxRetries) {
        throw error
      }

      // Solo hacer retry en errores de red
      const isNetworkError =
        error.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
        error.message?.includes('Network Error') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'NETWORK_ERROR'

      if (!isNetworkError) {
        throw error
      }

      // Esperar antes del siguiente intento (backoff exponencial)
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * @typedef {import('@/types').Product} Product
 * @typedef {import('@/types').ProductPrice} ProductPrice
 * @typedef {import('@/types').Stock} Stock
 */

export const productService = {
  // =================== PRODUCTOS ===================

  /**
   * Obtiene productos paginados ordenados por fecha de creación (más recientes primero)
   * @param {number} page - Número de página (comienza en 1)
   * @param {number} pageSize - Cantidad de productos por página
   * @param {Object} options - Opciones adicionales
   * @param {AbortSignal} options.signal - Signal para cancelar la petición
   * @returns {Promise<Product[]>} Array de productos enriquecidos con timestamps
   */
  getProductsPaginated: async (page = 1, pageSize = 10, options = {}) => {
    if (DEMO_CONFIG.enabled) {
      return (DEMO_PRODUCT_DATA || []).slice((page - 1) * pageSize, page * pageSize)
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductsPaginated(page, pageSize, options)
      })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      throw toApiError(error, 'Error al obtener productos paginados')
    }
  },

  /**
   * Alias para getProductsPaginated para compatibilidad con stores y tests
   */
  getProducts: async (page = 1, pageSize = 10, options = {}) => {
    return await productService.getProductsPaginated(page, pageSize, options)
  },

  // Obtener un producto por ID
  /**
   * @param {string} productId
   * @returns {Promise<Product|any>}
   */
  getProductById: async productId => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.id) === String(productId))
      return product || DEMO_PRODUCT_DATA[0]
    }
    const startTime = performance.now()

    try {
      // Using financial endpoint which includes price data
      const result = await retryWithBackoff(async () => {
        return await apiClient.getProductInfoById(productId)
      })

      telemetryService?.recordMetric('product_fetched_by_id_api', 1)
      return result
    } catch (error) {
      // En lugar de usar mock data, retornar error apropiado
      throw new ApiError(
        `No se pudo cargar el producto con ID ${productId}. Verifique la conexión a la API.`,
        'API_UNAVAILABLE',
        503,
        { originalError: error.message, productId },
      )
    } finally {
      const endTime = performance.now()
      telemetryService?.recordMetric(
        'get_product_by_id_duration',
        endTime - startTime,
      )
    }
  },

  // Obtener un producto enriquecido por ID (con precios, stock, descripción)
  /**
   * @param {string} productId
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductByIdEnriched: async (productId: string) => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.id) === String(productId))
      return product || DEMO_PRODUCT_DATA[0]
    }
    try {
      // Use financial endpoint which includes enriched data
      const product = await apiClient.getProductInfoById(productId)
      return product
    } catch (error) {
      const norm = toApiError(error, 'Error al obtener producto enriquecido')
      throw norm
    }
  },

  // Buscar productos por nombre
  /**
   * @param {string} name
   * @returns {Promise<any[]>}
   */
  searchProductsByName: async (name: string) => {
    if (DEMO_CONFIG.enabled) {
      return (DEMO_PRODUCT_DATA || []).filter(p => 
        p.name?.toLowerCase().includes(name.toLowerCase())
      )
    }
    try {
      return await apiClient.searchProductsByName(name)
    } catch (error) {
      throw toApiError(error, 'Error al buscar productos por nombre')
    }
  },

  // Buscar producto por código de barras
  /**
   * @param {string} barcode
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductByBarcode: async (barcode: string) => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.barcode) === String(barcode))
      return product || DEMO_PRODUCT_DATA[0]
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductByBarcode(barcode)
      })
    } catch (error) {
      throw toApiError(error, 'Error al buscar producto por código de barras')
    }
  },

  // Obtener servicios de canchas de beach tennis
  /**
   * @returns {Promise<Product[]|any>}
   */
  getBeachTennisCourts: async () => {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getServiceProducts()
      })
    } catch (error) {
      throw toApiError(
        error,
        'Error al obtener servicios de canchas de beach tennis',
      )
    }
  },

  // Obtener productos de servicios de canchas (enriquecidos)
  /**
   * @returns {Promise<Product[]|any>}
   */
  getServiceCourts: async () => {
    if (DEMO_CONFIG.enabled) {
      return (DEMO_PRODUCT_DATA || []).filter(p => p.product_type === 'SERVICE')
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getServiceProducts()
      })
    } catch (error) {
      throw toApiError(
        error,
        'Error al obtener servicios de canchas enriquecidos',
      )
    }
  },

  // =================== INFO ENRICHED PRODUCTS ===================

  // Obtener producto enriquecido con información operativa por ID
  /**
   * @param {string} productId
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductByIdInfo: async productId => {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductInfoById(productId)
      })
    } catch (error) {
      throw toApiError(
        error,
        'Error al obtener producto enriquecido con información operativa',
      )
    }
  },

  // Obtener producto enriquecido con información operativa por código de barras
  /**
   * @param {string} barcode
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductByBarcodeInfo: async (barcode: string) => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.barcode) === String(barcode))
      return product || DEMO_PRODUCT_DATA[0]
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductInfoByBarcode(barcode)
      })
    } catch (error) {
      throw toApiError(
        error,
        'Error al buscar producto financiero por código de barras',
      )
    }
  },

  /**
   * Obtiene un producto optimizado para el flujo de COMPRA
   * @param {string} productId
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductForPurchase: async (productId: string) => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.id) === String(productId))
      return product || DEMO_PRODUCT_DATA[0]
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductForPurchase(productId)
      })
    } catch (error) {
      throw toApiError(error, 'Error al obtener datos de producto para compra')
    }
  },

  /**
   * Obtiene un producto optimizado para el flujo de VENTA
   * @param {string} productId
   * @returns {Promise<ProductOperationInfoResponse|any>}
   */
  getProductForSale: async (productId: string) => {
    if (DEMO_CONFIG.enabled) {
      const product = (DEMO_PRODUCT_DATA || []).find(p => String(p.id) === String(productId))
      return product || DEMO_PRODUCT_DATA[0]
    }
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.getProductForSale(productId)
      })
    } catch (error) {
      throw toApiError(error, 'Error al obtener datos de producto para venta')
    }
  },

  // Buscar productos enriquecido con información operativas por nombre
  /**
   * @param {string} name - Término de búsqueda
   * @param {{ limit?: number, signal?: AbortSignal }} [options] - Opciones de búsqueda
   * @returns {Promise<ProductOperationInfoResponse[]|any>}
   */
  searchProductsInfo: async (name: string, options = {}) => {
    if (DEMO_CONFIG.enabled) {
      return (DEMO_PRODUCT_DATA || []).filter(p => 
        p.name?.toLowerCase().includes(name.toLowerCase())
      )
    }
    const { limit = 50, signal } = options
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.searchProductsInfoByName(name, {
          limit,
          signal,
        })
      })
    } catch (error) {
      // Permitimos que AbortError se propague tal cual
      if (error?.name === 'AbortError') throw error
      throw toApiError(
        error,
        'Error al buscar productos financieros por nombre',
      )
    }
  },

  // Búsqueda inteligente: por ID, nombre o código de barras
  /**
   * @param {string} searchTerm
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<Product[]|Product|any>}
   */
  searchProducts: async (searchTerm, { signal } = {}) => {
    try {
      return await retryWithBackoff(async () => {
        return await apiClient.searchProducts(searchTerm, { signal })
      })
    } catch (error) {
      // Permitimos que AbortError se propague tal cual
      if (error?.name === 'AbortError') throw error
      throw toApiError(error, 'Error al buscar productos')
    }
  },

  // Crear un nuevo producto
  /**
   * @param {Partial<Product>} productData
   * @returns {Promise<Product|any>}
   */
  createProduct: async productData => {
    try {
      return await apiClient.createProduct(productData)
    } catch (error) {
      throw toApiError(error, 'Error al crear producto')
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
      return await apiClient.updateProduct(productId, productData)
    } catch (error) {
      throw toApiError(error, 'Error al actualizar producto')
    }
  },

  // Eliminar producto (soft delete)
  /**
   * @param {string} productId
   * @returns {Promise<boolean|any>}
   */
  deleteProduct: async productId => {
    try {
      return await apiClient.deleteProduct(productId)
    } catch (error) {
      throw toApiError(error, 'Error al eliminar producto')
    }
  },

  // Reactivar producto (cambiar state a true)
  /**
   * @param {string} productId
   * @returns {Promise<Product|any>}
   */
  reactivateProduct: async productId => {
    try {
      // Intentar endpoint específico de reactivación primero
      // Si no existe, usar updateProduct con state: true
      try {
        return await (apiClient as any).reactivateProduct(productId)
      } catch (reactivateError) {
        // Si no existe endpoint específico, usar update con state: true
        return await apiClient.updateProduct(productId, { state: true })
      }
    } catch (error) {
      throw toApiError(error, 'Error al reactivar producto')
    }
  },

  // =================== PRECIOS ===================

  // Obtener precio de producto
  /**
   * @param {string} productId
   * @returns {Promise<ProductPrice|any>}
   */
  getProductPrice: async productId => {
    try {
      return await (apiClient as any).getProductPrice(productId)
    } catch (error) {
      throw toApiError(error, 'Error al obtener precio')
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
      return await (apiClient as any).setProductPrice(productId, priceData)
    } catch (error) {
      throw toApiError(error, 'Error al crear precio')
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
      return await (apiClient as any).updateProductPrice(productId, priceData)
    } catch (error) {
      throw toApiError(error, 'Error al actualizar precio')
    }
  },

  // =================== STOCK ===================

  // Obtener stock por Product ID
  /**
   * @param {string} productId
   * @returns {Promise<Stock|any>}
   */
  getStockByProductId: async productId => {
    try {
      return await (apiClient as any).getProductStock(productId)
    } catch (error) {
      throw toApiError(error, 'Error al obtener stock')
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
      return await (apiClient as any).createStock(productId, stockData)
    } catch (error) {
      throw toApiError(error, 'Error al crear stock')
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
      return await (apiClient as any).updateStockByProductId(productId, stockData)
    } catch (error) {
      throw toApiError(error, 'Error al actualizar stock')
    }
  },

  // Obtener stock por ID
  /**
   * @param {number} stockId
   * @returns {Promise<Stock|any>}
   */
  getStockById: async stockId => {
    return await (apiClient as any).getStockById(stockId)
  },

  // =================== UTILIDADES ===================

  // Obtener categorías de productos
  /**
   * @returns {Promise<any>}
   */
  getCategories: async () => {
    return await (apiClient as any).getCategories()
  },

  // Obtener todas las categorías
  /**
   * @returns {Promise<any[]>}
   */
  getAllCategories: async () => {
    try {
      return await retryWithBackoff(async () => {
        const api = new BusinessManagementAPI()
        return api.getAllCategories()
      })
    } catch (error) {
      throw toApiError(error, 'Error al obtener categorías')
    }
  },

  // Validar estructura de datos antes de envío
  /**
   * @param {Partial<Product>} productData
   * @returns {true}
   */
  validateProductData: productData => {
    const required = ['name']
    const missing = required.filter(field => !productData[field])
    if (missing.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`)
    }
    return true
  },

  validatePriceData: priceData => {
    if (
      !priceData.costPrice &&
      priceData.costPrice !== 0 &&
      !priceData.cost_price &&
      priceData.cost_price !== 0
    ) {
      throw new Error('cost_price es requerido')
    }
    return true
  },

  validateStockData: stockData => {
    if (!stockData.quantity && stockData.quantity !== 0) {
      throw new Error('quantity es requerido')
    }
    return true
  },
}

export default productService
