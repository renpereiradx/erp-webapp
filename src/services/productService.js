/**
 * Servicio para la gestión de productos en el sistema ERP
 * Migrado para usar el cliente oficial del Business Management API
 */

import { apiClient } from './api';
import BusinessManagementAPI from './BusinessManagementAPI';

export const productService = {
  // =================== PRODUCTOS ===================
  
  // Obtener productos paginados
  getProducts: async (page = 1, pageSize = 10) => {
    return await apiClient.getProducts(page, pageSize);
  },

  // Obtener un producto por ID
  getProductById: async (productId) => {
    return await apiClient.getProductById(productId);
  },

  // Obtener un producto enriquecido por ID (con precios, stock, descripción)
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
      throw new Error(`Error al obtener producto enriquecido: ${error.message}`);
    }
  },

  // Buscar productos por nombre
  searchProductsByName: async (name) => {
    return await apiClient.searchProductsByName(name);
  },

  // Búsqueda inteligente: por ID o nombre
  searchProducts: async (searchTerm) => {
    return await apiClient.searchProducts(searchTerm);
  },

  // Crear un nuevo producto
  createProduct: async (productData) => {
    return await apiClient.createProduct(productData);
  },

  // Actualizar un producto existente
  updateProduct: async (productId, productData) => {
    return await apiClient.updateProduct(productId, productData);
  },

  // Eliminar producto (soft delete)
  deleteProduct: async (productId) => {
    return await apiClient.deleteProduct(productId);
  },

  // =================== DESCRIPCIONES ===================

  // Crear descripción de producto
  createProductDescription: async (productId, description) => {
    return await apiClient.createProductDescription(productId, description);
  },

  // Obtener descripción por ID
  getDescriptionById: async (descId) => {
    return await apiClient.getProductDescription(descId);
  },

  // Actualizar descripción
  updateDescription: async (descId, description) => {
    return await apiClient.updateProductDescription(descId, description);
  },

  // =================== PRODUCTO CON DETALLES ===================

  // Obtener producto con detalles completos
  getProductWithDetails: async (productId) => {
    return await apiClient.getProductWithDetails(productId);
  },

  // Obtener descripciones de un producto por Product ID
  getProductDescriptions: async (productId) => {
    try {
      // Intentar obtener todas las descripciones del producto
      return await apiClient.makeRequest(`/products/${productId}/descriptions`);
    } catch (error) {
      // Si es 404, significa que no hay descripciones para este producto
      if (error.message.includes('404')) {
        console.log('ℹ️ No hay descripciones disponibles para el producto:', productId);
        return [];
      }
      // Para otros errores, log pero no throw para evitar romper el flujo
      console.warn('⚠️ Error obteniendo descripciones para producto:', productId, error.message);
      return [];
    }
  },

  // =================== PRECIOS ===================

  // Obtener precio de producto
  getProductPrice: async (productId) => {
    return await apiClient.getProductPrice(productId);
  },

  // Crear precio por Product ID
  createProductPrice: async (productId, priceData) => {
    return await apiClient.setProductPrice(productId, priceData);
  },

  // Actualizar precio por Product ID
  updateProductPriceByProductId: async (productId, priceData) => {
    return await apiClient.updateProductPrice(productId, priceData);
  },

  // =================== STOCK ===================

  // Obtener stock por Product ID
  getStockByProductId: async (productId) => {
    return await apiClient.getProductStock(productId);
  },

  // Crear stock
  createStock: async (productId, stockData) => {
    return await apiClient.createStock(productId, stockData);
  },

  // Actualizar stock por Product ID
  updateStockByProductId: async (productId, stockData) => {
    return await apiClient.updateStockByProductId(productId, stockData);
  },

  // Obtener stock por ID
  getStockById: async (stockId) => {
    return await apiClient.getStockById(stockId);
  },

  // =================== UTILIDADES ===================

  // Obtener categorías de productos
  getCategories: async () => {
    return await apiClient.getCategories();
  },

  // Obtener todas las categorías
  getAllCategories: async () => {
    const api = new BusinessManagementAPI();
    return api.getAllCategories();
  },

  // Validar estructura de datos antes de envío
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

