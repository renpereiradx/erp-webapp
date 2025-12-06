/**
 * Servicio para gestión de reservas de servicios
 * Implementa la especificación completa de RESERVES_API.md
 * Separado completamente de Sales y Schedules para mejor arquitectura
 */

import { apiService as apiClient } from '@/services/api'
import { telemetryService } from '@/services/telemetryService'
// Removed MockDataService import - using real API only
import { telemetry } from '@/utils/telemetry'

const API_PREFIX = '/reserve' // Según RESERVES_API.md
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// Utilidad para reintentos con backoff exponencial
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === attempts - 1) throw error
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, i))
      )
    }
  }
}

export const reservationService = {
  // Método unificado para todas las operaciones de reserva
  async manageReservation(action, data) {
    const startTime = Date.now()

    try {
      // Construir el payload según la action
      let reservationData = { action }

      switch (action.toLowerCase()) {
        case 'create':
          reservationData = {
            action: action.toUpperCase(), // API requiere mayúsculas
            product_id: data.product_id,
            client_id: data.client_id,
            start_time: data.start_time,
            duration: parseInt(data.duration),
          }
          break

        case 'update':
          reservationData = {
            action: action.toUpperCase(), // API requiere mayúsculas
            reserve_id: parseInt(data.reserve_id || data.id),
            product_id: data.product_id,
            client_id: data.client_id,
            start_time: data.start_time,
            duration: parseInt(data.duration),
          }
          break

        case 'cancel':
        case 'confirm':
          // Formato simplificado para cancel/confirm
          reservationData = {
            action: action.toUpperCase(), // API acepta CANCEL/CONFIRM en mayúsculas
            reserve_id: parseInt(data.reserve_id || data.id),
          }
          break

        default:
          throw new Error(`Acción no soportada: ${action}`)
      }

      // Validaciones básicas
      if (
        ['cancel', 'confirm'].includes(action.toLowerCase()) &&
        !reservationData.reserve_id
      ) {
        throw new Error(`Para ${action} es obligatorio: reserve_id`)
      }

      if (['create', 'update'].includes(action.toLowerCase())) {
        if (
          !reservationData.product_id ||
          !reservationData.client_id ||
          !reservationData.start_time ||
          !reservationData.duration
        ) {
          throw new Error(`Para ${action} faltan campos obligatorios`)
        }
      }

      const result = await withRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/manage`, reservationData)
      })

      telemetry.record(`reservations.service.${action}`, {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: `manage_${action}`,
      })
      throw error
    }
  },

  // Get service courts for reservations
  async getServiceCourts() {
    const startTime = Date.now()

    try {
      const result = await withRetry(async () => {
        return await apiClient.get('/products/enriched/service-courts')
      })

      telemetry.record('reservations.service.load_courts', {
        duration: Date.now() - startTime,
        count: Array.isArray(result) ? result.length : 0,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getServiceCourts',
      })

      // Fallback: try enriched/all and filter
      try {
        const allProducts = await withRetry(async () => {
          return await apiClient.get('/products/enriched/all')
        })

        if (Array.isArray(allProducts)) {
          const serviceCourts = allProducts.filter(
            product =>
              product.product_type === 'SERVICE' &&
              (product.name?.toLowerCase().includes('cancha') ||
                product.name?.toLowerCase().includes('court') ||
                product.category_name?.toLowerCase().includes('cancha') ||
                product.category_name?.toLowerCase().includes('alquiler'))
          )

          return serviceCourts
        }
        return []
      } catch (fallbackError) {
        throw error
      }
    }
  },
  // DEPRECATED: Usar getReservationReport() directamente
  // Este método se mantiene por compatibilidad
  async getReservations(params = {}) {
    return this.getReservationReport(params)
  },

  async getReservationById(id) {
    const startTime = Date.now()

    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/${id}`)
      })

      telemetry.record('reservations.service.load_by_id', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationById',
      })
      throw error
    }
  },

  async createReservation(data) {
    return this.manageReservation(data.action || 'create', data)
  },

  async updateReservation(id, data) {
    return this.manageReservation(data.action || 'update', { ...data, id })
  },

  async cancelReservation(data) {
    return this.manageReservation(data.action || 'cancel', data)
  },

  async confirmReservation(data) {
    return this.manageReservation('confirm', data)
  },

  async getReservationsByProduct(productId) {
    const startTime = Date.now()

    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/product/${productId}`)
      })

      telemetry.record('reservations.service.load_by_product', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationsByProduct',
      })
      throw error
    }
  },

  async getReservationsByClient(clientId) {
    const startTime = Date.now()

    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/client/${clientId}`)
      })

      telemetry.record('reservations.service.load_by_client', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationsByClient',
      })
      throw error
    }
  },

  async getReservationReport(params = {}) {
    const startTime = Date.now()

    try {
      // Use the apiService method which has built-in fallback
      const result = await withRetry(async () => {
        return await apiClient.getReservationReport(params)
      })

      telemetry.record('reservations.service.report', {
        duration: Date.now() - startTime,
        count: Array.isArray(result) ? result.length : 0,
        hasMockData:
          result &&
          result.length > 0 &&
          result[0]?.created_by === 'Sistema Demo',
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationReport',
      })

      // Final fallback - return empty array
      return []
    }
  },

  /**
   * Obtener reservas por rango de fechas
   * @param {string} startDate - Fecha inicio formato YYYY-MM-DD
   * @param {string} endDate - Fecha fin formato YYYY-MM-DD
   * @returns {Promise<Array>} Array de ReserveRiched con información completa
   */
  async getReservationsByDateRange(startDate, endDate) {
    const startTime = Date.now()

    try {
      // Validar formato de fechas
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')
      }

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })

      const result = await withRetry(async () => {
        return await apiClient.get(
          `${API_PREFIX}/date-range?${queryParams.toString()}`
        )
      })

      // Manejar respuesta - puede venir como array directo o envuelto en data
      let data = []
      if (Array.isArray(result)) {
        data = result
      } else if (result && result.data && Array.isArray(result.data)) {
        data = result.data
      }

      telemetry.record('reservations.service.load_by_date_range', {
        duration: Date.now() - startTime,
        count: data.length,
        startDate,
        endDate,
      })

      return data
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationsByDateRange',
      })
      throw error
    }
  },

  async getAvailableSchedules(productId, date, duration) {
    const startTime = Date.now()

    try {
      // Si duration viene en minutos (mayor a 24), convertir a horas
      // Si viene en horas (menor o igual a 24), usar tal cual
      const durationHours = duration > 24 ? duration / 60 : duration

      const params = {
        product_id: productId,
        date: date,
        duration_hours: durationHours,
      }

      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/available-schedules`, {
          params,
        })
      })

      telemetry.record('reservations.service.available_schedules', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAvailableSchedules',
      })
      throw error
    }
  },

  async checkConsistency() {
    const startTime = Date.now()

    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/consistency/check`)
      })

      telemetry.record('reservations.service.check_consistency', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'checkConsistency',
      })
      throw error
    }
  },
}

export default reservationService
