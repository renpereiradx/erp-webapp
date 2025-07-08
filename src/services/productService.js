/**
 * Servicio para la gestión de productos en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de productos
 */

import { apiService } from './api';

export const productService = {
  // Obtener todos los productos con paginación y filtros
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      category: params.category || '',
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc',
    }).toString();

    return await apiService.get(`/productos?${queryParams}`);
  },

  // Obtener un producto por ID
  getProductById: async (id) => {
    return await apiService.get(`/productos/${id}`);
  },

  // Crear un nuevo producto
  createProduct: async (productData) => {
    return await apiService.post('/productos', productData);
  },

  // Actualizar un producto existente
  updateProduct: async (id, productData) => {
    return await apiService.put(`/productos/${id}`, productData);
  },

  // Eliminar un producto
  deleteProduct: async (id) => {
    return await apiService.delete(`/productos/${id}`);
  },

  // Obtener categorías de productos
  getCategories: async () => {
    return await apiService.get('/productos/categorias');
  },

  // Buscar productos por código de barras
  searchByBarcode: async (barcode) => {
    return await apiService.get(`/productos/barcode/${barcode}`);
  },

  // Actualizar stock de un producto
  updateStock: async (id, stockData) => {
    return await apiService.put(`/productos/${id}/stock`, stockData);
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async (threshold = 10) => {
    return await apiService.get(`/productos/stock-bajo?threshold=${threshold}`);
  },
};

export default productService;

