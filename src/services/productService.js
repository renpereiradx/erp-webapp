/**
 * Servicio para la gestión de productos en el sistema ERP
 * Actualizado para usar la nueva estructura simplificada de la API
 */

import { apiService } from './api';

export const productService = {
  // =================== PRODUCTOS - NUEVOS ENDPOINTS SIMPLIFICADOS ===================
  
  // Obtener todos los productos (información básica)
  getAllProducts: async (params = {}) => {
    const queryParams = new URLSearchParams({
      category: params.category || '',
      active: params.active !== undefined ? params.active : true,
    }).toString();

    return await apiService.get(`/products?${queryParams}`);
  },

  // Obtener productos paginados con información enriquecida
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      category: params.category || '',
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc',
    }).toString();

    return await apiService.get(`/products/paginated?${queryParams}`);
  },

  // Obtener un producto por ID con información completa
  getProductById: async (productId) => {
    return await apiService.get(`/products/${productId}`);
  },

  // Buscar productos por nombre
  searchProducts: async (searchTerm, limit = 20) => {
    const queryParams = new URLSearchParams({
      q: searchTerm,
      limit: limit,
    }).toString();

    return await apiService.get(`/products/search?${queryParams}`);
  },

  // Crear un nuevo producto
  createProduct: async (productData) => {
    return await apiService.post('/products', productData);
  },

  // Actualizar un producto existente
  updateProduct: async (productId, productData) => {
    return await apiService.put(`/products/${productId}`, productData);
  },

  // Eliminar producto (soft delete)
  deleteProduct: async (productId) => {
    return await apiService.delete(`/products/${productId}`);
  },

  // =================== PRODUCTOS CON CANTIDADES DECIMALES Y PRECIOS POR UNIDAD ===================

  // Obtener productos por categoría con información de precios
  getProductsByCategory: async (categories) => {
    const queryParams = new URLSearchParams({
      categories: categories.join(','),
    }).toString();

    return await apiService.get(`/products/by-category?${queryParams}`);
  },

  // Obtener precio específico de un producto por unidad
  getProductPriceByUnit: async (productId, unit = null) => {
    const queryParams = unit ? `?unit=${unit}` : '';
    return await apiService.get(`/products/${productId}/price${queryParams}`);
  },

  // Obtener unidades disponibles para un producto
  getProductUnits: async (productId) => {
    return await apiService.get(`/products/${productId}/units`);
  },

  // Crear precio por unidad para un producto
  createUnitPrice: async (productId, unitPriceData) => {
    return await apiService.post(`/products/${productId}/units`, unitPriceData);
  },

  // =================== GESTIÓN DE CATEGORÍAS ===================

  // Obtener todas las categorías
  getCategories: async () => {
    return await apiService.get('/categories');
  },

  // =================== GESTIÓN DE DESCRIPCIONES (Legacy) ===================

  // Crear descripción de producto
  createProductDescription: async (productId, description) => {
    return await apiService.post(`/product_description/${productId}`, { description });
  },

  // Obtener descripción por ID
  getDescriptionById: async (descId) => {
    return await apiService.get(`/product_description/${descId}`);
  },

  // Actualizar descripción
  updateDescription: async (descId, description) => {
    return await apiService.put(`/product_description/${descId}`, { description });
  },

  // =================== GESTIÓN DE PRECIOS (Legacy) ===================

  // Obtener precio por ID de producto
  getProductPriceByProductId: async (productId) => {
    return await apiService.get(`/product_price/product_id/${productId}`);
  },

  // Crear precio de producto
  createProductPrice: async (productId, priceData) => {
    return await apiService.post(`/product_price/product_id/${productId}`, priceData);
  },

  // Actualizar precio por ID de producto
  updateProductPriceByProductId: async (productId, priceData) => {
    return await apiService.put(`/product_price/product_id/${productId}`, priceData);
  },

  // =================== GESTIÓN DE STOCK (Legacy) ===================

  // Obtener stock por ID de producto
  getStockByProductId: async (productId) => {
    return await apiService.get(`/stock/product_id/${productId}`);
  },

  // Crear stock
  createStock: async (productId, stockData) => {
    return await apiService.post(`/stock/${productId}`, stockData);
  },

  // Actualizar stock por ID de producto
  updateStockByProductId: async (productId, stockData) => {
    return await apiService.put(`/stock/product_id/${productId}`, stockData);
  },

  // Obtener stock por ID
  getStockById: async (stockId) => {
    return await apiService.get(`/stock/${stockId}`);
  },

  // =================== UTILIDADES Y VALIDACIONES ===================

  // Validar datos de producto
  validateProductData: (productData) => {
    const errors = [];
    if (!productData.name) errors.push('El nombre es requerido');
    if (!productData.id_category) errors.push('La categoría es requerida');
    if (!productData.description) errors.push('La descripción es requerida');
    return errors;
  },

  // Validar datos de precio
  validatePriceData: (priceData) => {
    const errors = [];
    if (!priceData.cost_price || priceData.cost_price <= 0) {
      errors.push('El precio de costo debe ser mayor a 0');
    }
    return errors;
  },

  // Validar datos de stock
  validateStockData: (stockData) => {
    const errors = [];
    if (stockData.quantity === undefined || stockData.quantity < 0) {
      errors.push('La cantidad debe ser mayor o igual a 0');
    }
    return errors;
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async (threshold = 10) => {
    const products = await productService.getProducts({ limit: 1000 });
    return products.data?.filter(product => 
      product.stock_quantity !== null && 
      product.stock_quantity <= threshold
    ) || [];
  },
};

export default productService;

