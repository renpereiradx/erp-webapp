/**
 * Servicio para gestión de auditorías de caja (arqueos)
 * Basado en API v1.1 - Gestión de efectivo
 */

import { apiClient } from '@/services/api'
import { telemetry } from '@/utils/telemetry'
import { DEMO_CONFIG } from '@/config/demoAuth'

const API_ENDPOINTS = {
  audits: '/cash-audits',
  denominations: '/cash-audits/denominations',
  resolve: id => `/cash-audits/${id}/resolve`,
}

export const cashAuditService = {
  /**
   * Crea una nueva auditoría de caja
   * @param {Object} auditData - Datos de la auditoría (cash_register_id, counted_amount, denominations, notes)
   * @returns {Promise<Object>} Resultado de la auditoría
   */
  async createAudit(auditData) {
    if (DEMO_CONFIG.enabled) {
      const { createDemoAudit } = await import('@/config/demoData')
      return createDemoAudit(auditData)
    }
    const startTime = Date.now()
    try {
      const result = await apiClient.post(API_ENDPOINTS.audits, auditData)
      telemetry.record('cash_audit.service.create', {
        duration: Date.now() - startTime,
        cashRegisterId: auditData.cash_register_id,
        difference: result.difference || 0
      })
      return result
    } catch (error) {
      telemetry.record('cash_audit.service.error', {
        operation: 'createAudit',
        error: error.message
      })
      throw error
    }
  },

  /**
   * Obtiene las plantillas de denominaciones por moneda
   * @returns {Promise<Object>} Diccionario de denominaciones por moneda
   */
  async getDenominations() {
    if (DEMO_CONFIG.enabled) {
      const { DEMO_DENOMINATIONS } = await import('@/config/demoData')
      return DEMO_DENOMINATIONS
    }
    try {
      const result = await apiClient.get(API_ENDPOINTS.denominations)
      return result
    } catch (error) {
      console.error('Error fetching denominations:', error)
      // Fallback básico para PYG si falla
      return {
        PYG: {
          bills: [100000, 50000, 20000, 10000, 5000, 2000],
          coins: [1000, 500, 100, 50]
        }
      }
    }
  },

  /**
   * Resuelve una discrepancia en una auditoría
   * @param {number} auditId - ID de la auditoría
   * @param {Object} resolutionData - (resolution_type, notes)
   * @returns {Promise<Object>} Resultado de la resolución
   */
  async resolveDiscrepancy(auditId, resolutionData) {
    if (DEMO_CONFIG.enabled) {
      return { success: true, message: 'Discrepancia resuelta (Demo)' }
    }
    try {
      return await apiClient.post(API_ENDPOINTS.resolve(auditId), resolutionData)
    } catch (error) {
      console.error('Error resolving discrepancy:', error)
      throw error
    }
  }
}

export default cashAuditService
