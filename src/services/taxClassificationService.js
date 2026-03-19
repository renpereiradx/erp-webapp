/**
 * Servicio para gestión de Clasificación Fiscal (Tax Classification)
 * Basado en API v1.2 - Sistema de organización y fiscalidad
 */

import { apiClient } from './api'
import { DEMO_CONFIG } from '@/config/demoAuth'

const API_ENDPOINTS = {
  info: '/tax-classification/info',
  defaults: '/tax-classification/defaults',
  byId: id => `/tax-classification/${id}`,
  byProductId: productId => `/tax-classification/product/${productId}`,
  byCode: code => `/tax-classification/code/${code}`,
  assign: '/tax-classification/assign',
  bulkAssign: '/tax-classification/bulk-assign',
  autoClassify: '/tax-classification/auto-classify',
}

export const taxClassificationService = {
  /**
   * Obtiene información de códigos de clasificación
   * @returns {Promise<Array>}
   */
  async getInfo() {
    if (DEMO_CONFIG.enabled) {
      return [
        { code: "CANASTA", name: "Canasta Básica", description: "IVA 5% - Productos de la canasta básica", rate: "5%" },
        { code: "GENERAL", name: "General", description: "IVA 10% - Productos y servicios generales", rate: "10%" },
        { code: "EXENTO", name: "Exento", description: "IVA 0% - Exportaciones, transporte público, educación", rate: "0%" },
      ]
    }
    try {
      return await apiClient.get(API_ENDPOINTS.info)
    } catch (error) {
      console.error('Error fetching tax classification info:', error)
      throw error
    }
  },

  /**
   * Obtiene tasas por defecto por clasificación
   * @returns {Promise<Array>}
   */
  async getDefaults() {
    if (DEMO_CONFIG.enabled) {
      return [
        { classification_code: "CANASTA", description: "Canasta Básica - IVA 5%", default_tax_rate_id: 2 },
        { classification_code: "GENERAL", description: "General - IVA 10%", default_tax_rate_id: 1 }
      ]
    }
    try {
      return await apiClient.get(API_ENDPOINTS.defaults)
    } catch (error) {
      console.error('Error fetching tax classification defaults:', error)
      throw error
    }
  },

  /**
   * Obtiene clasificación por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      return await apiClient.get(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error fetching tax classification ${id}:`, error)
      throw error
    }
  },

  /**
   * Obtiene clasificación activa de producto
   * @param {string|number} productId
   * @returns {Promise<Object>}
   */
  async getByProductId(productId) {
    try {
      return await apiClient.get(API_ENDPOINTS.byProductId(productId))
    } catch (error) {
      console.error(`Error fetching tax classification for product ${productId}:`, error)
      throw error
    }
  },

  /**
   * Obtiene clasificaciones por código
   * @param {string} code
   * @returns {Promise<Array>}
   */
  async getByCode(code) {
    try {
      return await apiClient.get(API_ENDPOINTS.byCode(code))
    } catch (error) {
      console.error(`Error fetching tax classifications by code ${code}:`, error)
      throw error
    }
  },

  /**
   * Asignar clasificación a producto
   * @param {Object} data - {product_id, code, tax_rate_id, notes}
   * @returns {Promise<Object>}
   */
  async assign(data) {
    try {
      return await apiClient.post(API_ENDPOINTS.assign, data)
    } catch (error) {
      console.error('Error assigning tax classification:', error)
      throw error
    }
  },

  /**
   * Asignación masiva de clasificaciones
   * @param {Object} data - {product_ids: [], code, notes}
   * @returns {Promise<Object>}
   */
  async bulkAssign(data) {
    try {
      return await apiClient.post(API_ENDPOINTS.bulkAssign, data)
    } catch (error) {
      console.error('Error bulk assigning tax classifications:', error)
      throw error
    }
  },

  /**
   * Auto-clasificar productos por categoría
   * @returns {Promise<Object>}
   */
  async autoClassify() {
    try {
      return await apiClient.post(API_ENDPOINTS.autoClassify, {})
    } catch (error) {
      console.error('Error auto-classifying products:', error)
      throw error
    }
  },

  /**
   * Actualizar clasificación
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      return await apiClient.put(API_ENDPOINTS.byId(id), data)
    } catch (error) {
      console.error(`Error updating tax classification ${id}:`, error)
      throw error
    }
  },

  /**
   * Eliminar clasificación
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      return await apiClient.delete(API_ENDPOINTS.byId(id))
    } catch (error) {
      console.error(`Error deleting tax classification ${id}:`, error)
      throw error
    }
  }
}

export default taxClassificationService
