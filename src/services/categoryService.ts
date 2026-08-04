/**
 * Servicio para gestión de categorías de productos
 * Basado en API v1.1 - Sistema de organización y fiscalidad
 */

import { apiClient } from './api'
import { DEMO_CONFIG } from '@/config/demoAuth'

const API_ENDPOINTS = {
  base: '/category/',
  byId: id => `/category/${id}`,
}

export const categoryService = {
  /**
   * Obtiene todas las categorías disponibles
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (DEMO_CONFIG.enabled) {
      // Intentar cargar desde mock data
      try {
        const { DEMO_CATEGORIES_DATA } = await import('@/config/demoData')
        return DEMO_CATEGORIES_DATA || []
      } catch (e) {
        return []
      }
    }
    try {
      const response = await apiClient.get(API_ENDPOINTS.base)
      // La API puede devolver {categories: [...]} o [...]
      return response.categories || response.data || response || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },

  /**
   * Obtiene una categoría por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      return await apiClient.get(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error)
      throw error
    }
  },

  /**
   * Crea una nueva categoría
   * @param {Object} data - {name, description, default_tax_rate_id, parent_id}
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      return await apiClient.post(API_ENDPOINTS.base, data)
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  /**
   * Actualiza una categoría existente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      return await apiClient.put(API_ENDPOINTS.byId(id), data)
    } catch (error) {
      console.error(`Error updating category ${id}:`, error)
      throw error
    }
  },

  /**
   * Elimina una categoría (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      return await apiClient.delete(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error)
      throw error
    }
  }
}

export default categoryService
