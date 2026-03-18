/**
 * Servicio para gestión de tasas de IVA
 * Basado en API v1.1 - Legislación fiscal paraguaya
 */

import { apiClient } from './api'
import { DEMO_CONFIG } from '@/config/demoAuth'

const API_ENDPOINTS = {
  base: '/tax_rate/',
  paginated: (page, size) => `/tax_rate/${page}/${size}`,
  byId: id => `/tax_rate/${id}`,
  byCode: code => `/tax_rate/code/${code}`,
  byName: name => `/tax_rate/name/${name}`,
  default: '/tax_rate/default',
}

export const taxRateService = {
  /**
   * Obtiene tasas de IVA paginadas
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<Array>}
   */
  async getPaginated(page = 1, pageSize = 10) {
    if (DEMO_CONFIG.enabled) {
      try {
        const { DEMO_TAX_RATES_DATA } = await import('@/config/demoData')
        return DEMO_TAX_RATES_DATA || []
      } catch (e) {
        return []
      }
    }
    try {
      const response = await apiClient.get(API_ENDPOINTS.paginated(page, pageSize))
      return response.data || response || []
    } catch (error) {
      console.error('Error fetching tax rates:', error)
      throw error
    }
  },

  /**
   * Obtiene una tasa por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      return await apiClient.get(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error fetching tax rate ${id}:`, error)
      throw error
    }
  },

  /**
   * Obtiene la tasa de IVA por defecto del sistema
   * @returns {Promise<Object>}
   */
  async getDefault() {
    if (DEMO_CONFIG.enabled) {
      return { id: 1, tax_name: 'IVA General', code: 'IVA10', rate: 10.0, is_default: true }
    }
    try {
      return await apiClient.get(API_ENDPOINTS.default)
    } catch (error) {
      console.error('Error fetching default tax rate:', error)
      // Fallback razonable
      return { id: 1, code: 'IVA10', rate: 10.0 }
    }
  },

  /**
   * Crea una nueva tasa de IVA
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      return await apiClient.post(API_ENDPOINTS.base, data)
    } catch (error) {
      console.error('Error creating tax rate:', error)
      throw error
    }
  },

  /**
   * Actualiza una tasa existente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      return await apiClient.put(API_ENDPOINTS.byId(id), data)
    } catch (error) {
      console.error(`Error updating tax rate ${id}:`, error)
      throw error
    }
  },

  /**
   * Elimina una tasa (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      return await apiClient.delete(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error deleting tax rate ${id}:`, error)
      throw error
    }
  }
}

export default taxRateService
