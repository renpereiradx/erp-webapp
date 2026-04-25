/**
 * Servicio para gestión de cajas registradoras
 * Integración con APIs de gestión de efectivo y pagos con caja
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api'
import { telemetry } from '@/utils/telemetry'

const API_ENDPOINTS = {
  cashRegisters: '/cash-registers',
  activeCashRegister: '/cash-registers/active',
  openCashRegister: '/cash-registers/open',
  closeCashRegister: id => `/cash-registers/${id}/close`,
  cashRegisterMovements: id => `/cash-registers/${id}/movements`,
  cashRegisterMovementsFilter: id => `/cash-registers/${id}/movements/filter`,
  cashRegisterReport: id => `/cash-registers/${id}/report`,
  cashRegisterBalanceSummary: id => `/cash-registers/${id}/balance-summary`,
  cashRegisterAudits: id => `/cash-registers/${id}/audits`,
  cashMovements: '/cash-movements/',
  voidMovement: id => `/cash-movements/${id}/void`,
  cashAudits: '/cash-audits',
  cashAuditsDenominations: '/cash-audits/denominations',
  cashAuditsResolve: id => `/cash-audits/${id}/resolve`,
  paymentsBootstrap: '/payments/bootstrap',
}

const IS_DEMO_MODE = import.meta.env.VITE_USE_DEMO === 'true'

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }

  throw lastError
}

export const cashRegisterService = {
  // =================== GESTIÓN DE CAJAS REGISTRADORAS ===================

  /**
   * Obtiene la caja registradora activa del usuario
   * @returns {Promise<CashRegister|null>}
   */
  async getActiveCashRegister() {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.activeCashRegister)
      })

      telemetry.record('cash_register.service.get_active', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      // 204 No Content o 404 significa no hay caja activa - no es un error real
      if (error.status === 204 || error.status === 404) {
        console.log(
          '📭 CashRegister: No active cash register found (HTTP ' +
            error.status +
            ')'
        )
        telemetry.record('cash_register.service.no_active', {
          duration: Date.now() - startTime,
        })
        return null
      }

      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getActiveCashRegister',
      })
      throw error
    }
  },

  /**
   * Abre una nueva caja registradora
   * @param {OpenCashRegisterRequest} cashRegisterData
   * @returns {Promise<CashRegister>}
   */
  async openCashRegister(cashRegisterData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(
          API_ENDPOINTS.openCashRegister,
          cashRegisterData
        )
      })

      telemetry.record('cash_register.service.open', {
        duration: Date.now() - startTime,
        initialBalance: cashRegisterData.initial_balance,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'openCashRegister',
      })
      throw error
    }
  },

  /**
   * Cierra una caja registradora
   * @param {number} cashRegisterId
   * @param {CloseCashRegisterRequest} closeData
   * @returns {Promise<CashRegister>}
   */
  async closeCashRegister(cashRegisterId, closeData = {}) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(
          API_ENDPOINTS.closeCashRegister(cashRegisterId),
          closeData
        )
      })

      telemetry.record('cash_register.service.close', {
        duration: Date.now() - startTime,
        cashRegisterId,
        variance: result.variance || 0,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'closeCashRegister',
      })
      throw error
    }
  },

  /**
   * Obtiene lista de cajas registradoras
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>}
   */
  async getCashRegisters(filters = {}) {
    const startTime = Date.now()

    try {
      const params = new URLSearchParams(filters)
      const url = params.toString()
        ? `${API_ENDPOINTS.cashRegisters}?${params}`
        : API_ENDPOINTS.cashRegisters

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url)
      })

      telemetry.record('cash_register.service.list', {
        duration: Date.now() - startTime,
        count: result?.length || 0,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCashRegisters',
      })
      throw error
    }
  },

  // =================== MOVIMIENTOS DE EFECTIVO ===================

  /**
   * Registra un movimiento manual de efectivo (v1.1)
   * @param {number} cashRegisterId
   * @param {RegisterMovementRequest} movementData
   * @returns {Promise<CashRegisterMovement>}
   */
  async registerMovement(cashRegisterId, movementData) {
    const startTime = Date.now()

    try {
      // v1.1: Usar endpoint central /cash-movements y asegurar cash_register_id
      const payload = {
        ...movementData,
        cash_register_id: cashRegisterId,
      }

      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.cashMovements, payload)
      })

      telemetry.record('cash_register.service.movement', {
        duration: Date.now() - startTime,
        movementType: movementData.movement_type,
        amount: movementData.amount,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'registerMovement',
      })
      throw error
    }
  },

  /**
   * Obtiene movimientos enriquecidos de una caja registradora (v2.1)
   *
   * Retorna información completa y enriquecida de cada movimiento:
   * - Balance acumulado (running_balance) calculado automáticamente
   * - Información del usuario que creó el movimiento
   * - Información de ventas relacionadas (total, estado, cliente, método de pago)
   * - Información de compras relacionadas (total, estado, proveedor)
   *
   * @param {number} cashRegisterId - ID de la caja registradora
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<import('@/types/cashRegister').EnrichedCashMovement[]>}
   */
  async getMovements(cashRegisterId, filters = {}) {
    const startTime = Date.now()

    try {
      const params = new URLSearchParams(filters)
      const url = params.toString()
        ? `${API_ENDPOINTS.cashRegisterMovements(cashRegisterId)}?${params}`
        : API_ENDPOINTS.cashRegisterMovements(cashRegisterId)

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url)
      })

      // Asegurar que siempre retornamos un array (protección contra null/undefined del backend)
      const safeResult = Array.isArray(result) ? result : []

      telemetry.record('cash_register.service.movements', {
        duration: Date.now() - startTime,
        cashRegisterId,
        count: safeResult.length,
      })

      return safeResult
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getMovements',
      })
      throw error
    }
  },

  /**
   * Obtiene movimientos con filtros avanzados (v2.2)
   *
   * Permite filtrar por:
   * - Tipo de movimiento: INCOME, EXPENSE, TRANSFER, ADJUSTMENT
   * - Rango de fechas: date_from, date_to
   * - Paginación: limit, offset
   *
   * @param {number} cashRegisterId - ID de la caja registradora
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>}
   */
  async getFilteredMovements(cashRegisterId, filters = {}) {
    const startTime = Date.now()

    try {
      const params = new URLSearchParams()

      if (filters.type) params.append('type', filters.type)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      if (filters.limit) params.append('limit', filters.limit)
      if (filters.offset) params.append('offset', filters.offset)

      const url = params.toString()
        ? `${API_ENDPOINTS.cashRegisterMovementsFilter(
            cashRegisterId
          )}?${params}`
        : API_ENDPOINTS.cashRegisterMovementsFilter(cashRegisterId)

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url)
      })

      const safeResult = Array.isArray(result) ? result : []

      telemetry.record('cash_register.service.filtered_movements', {
        duration: Date.now() - startTime,
        cashRegisterId,
        count: safeResult.length,
        filters: Object.keys(filters).join(','),
      })

      return safeResult
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getFilteredMovements',
      })
      throw error
    }
  },

  /**
   * Registra un movimiento manual de efectivo (POST /cash-movements/)
   * @param {Object} movementData
   * @returns {Promise<Object>}
   */
  async createMovement(movementData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        const payload = {
          cash_register_id: Number(movementData.cash_register_id),
          movement_type: movementData.movement_type,
          amount: Number(movementData.amount),
          concept: movementData.concept?.trim(),
          category: movementData.category || undefined,
          reference_type: movementData.reference_type || undefined,
          reference_id: movementData.reference_id || undefined,
        }

        return await apiClient.post(API_ENDPOINTS.cashMovements, payload)
      })

      telemetry.record('cash_register.service.create_movement', {
        duration: Date.now() - startTime,
        movementType: movementData.movement_type,
        amount: movementData.amount,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'createMovement',
      })
      throw error
    }
  },

  /**
   * Anula un movimiento de efectivo (v2.2)
   * @param {number} movementId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async voidMovement(movementId, reason) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.voidMovement(movementId), {
          reason,
        })
      })

      telemetry.record('cash_register.service.void_movement', {
        duration: Date.now() - startTime,
        originalMovementId: movementId,
        reversalMovementId: result.reversal_movement_id,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'voidMovement',
      })
      throw error
    }
  },

  /**
   * Obtiene un resumen del balance de la caja (v1.1)
   * @param {number} cashRegisterId
   * @returns {Promise<Object>}
   */
  async getBalanceSummary(cashRegisterId) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(
          API_ENDPOINTS.cashRegisterBalanceSummary(cashRegisterId)
        )
      })

      telemetry.record('cash_register.service.balance_summary', {
        duration: Date.now() - startTime,
        cashRegisterId,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getBalanceSummary',
      })
      throw error
    }
  },

  /**
   * Obtiene el reporte de una caja registradora (v1.1)
   * @param {number} cashRegisterId
   * @returns {Promise<CashRegisterReport>}
   */
  async getCashRegisterReport(cashRegisterId) {
    if (IS_DEMO_MODE) {
      return {
        cash_register: { id: cashRegisterId, name: 'Caja Demo', status: 'OPEN', current_balance: 1250000 },
        summary: { total_income: 950000, total_expenses: 200000, net_change: 750000, transaction_count: 15 },
        by_category: { SALE: 900000, PURCHASE: 150000, ADJUSTMENT: 0 }
      }
    }
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(
          API_ENDPOINTS.cashRegisterReport(cashRegisterId)
        )
      })

      telemetry.record('cash_register.service.report', {
        duration: Date.now() - startTime,
        cashRegisterId,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCashRegisterReport',
      })
      throw error
    }
  },

  /**
   * Obtiene historial de auditorías de una caja
   * @param {number} cashRegisterId
   * @returns {Promise<Array>}
   */
  async getAuditsByRegister(cashRegisterId) {
    if (IS_DEMO_MODE) {
      const { getDemoAudits } = await import('@/config/demoData')
      return getDemoAudits(cashRegisterId)
    }
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(
          API_ENDPOINTS.cashRegisterAudits(cashRegisterId)
        )
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAuditsByRegister',
      })
      throw error
    }
  },

  // =================== PAGOS INTEGRADOS CON CAJA ===================

  /**
   * Procesa cobro de venta con integración de caja (v3.0)
   * @param {Object} paymentData 
   * @returns {Promise<Object>}
   */
  async processSalePaymentWithCashRegister(paymentData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.processSalePaymentCashRegister(paymentData)
      })

      telemetry.record('cash_register.service.sale_payment', {
        duration: Date.now() - startTime,
        saleId: paymentData.sales_order_id,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processSalePaymentWithCashRegister',
      })
      throw error
    }
  },

  /**
   * Procesa pago de compra con integración de caja (v2.0)
   * @param {Object} paymentData 
   * @returns {Promise<Object>}
   */
  async processPurchasePaymentWithCashRegister(paymentData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.processPurchasePaymentCashRegister(paymentData)
      })

      telemetry.record('cash_register.service.purchase_payment', {
        duration: Date.now() - startTime,
        purchaseOrderId: paymentData.purchase_order_id,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPurchasePaymentWithCashRegister',
      })
      throw error
    }
  },

  // =================== UTILIDADES ===================

  /**
   * Valida datos de apertura de caja
   */
  validateOpenCashRegisterData(data) {
    const errors = []
    if (!data.name || data.name.trim() === '') {
      errors.push('Nombre es requerido')
    }
    if (typeof data.initial_balance !== 'number' || data.initial_balance < 0) {
      errors.push('Balance inicial debe ser un número positivo')
    }
    return errors
  },

  /**
   * Valida datos de movimiento
   */
  validateMovementData(data) {
    const errors = []
    const validTypes = ['INCOME', 'EXPENSE', 'ADJUSTMENT']
    if (!data.movement_type || !validTypes.includes(data.movement_type)) {
      errors.push(`Tipo de movimiento inválido. Tipos válidos: ${validTypes.join(', ')}`)
    }
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('Monto debe ser un número positivo')
    }
    if (!data.concept || data.concept.trim() === '') {
      errors.push('Concepto es requerido')
    }
    return errors
  },
}

export default cashRegisterService
