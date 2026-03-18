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
  cashRegisterAudits: id => `/cash-registers/${id}/audits`,
  cashMovements: '/cash-movements/',
  voidMovement: id => `/cash-movements/${id}/void`,
  paymentsSale: '/cash-registers/payments/sale',
  paymentsPurchase: '/cash-registers/payments/purchase',
  verifyIntegration: '/cash-registers/verify-integration',
}

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
   * Registra un movimiento manual de efectivo
   * @param {number} cashRegisterId
   * @param {RegisterMovementRequest} movementData
   * @returns {Promise<CashRegisterMovement>}
   */
  async registerMovement(cashRegisterId, movementData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(
          API_ENDPOINTS.cashRegisterMovements(cashRegisterId),
          movementData
        )
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
   *
   * @example
   * const movements = await getMovements(6);
   * movements.forEach(m => {
   *   console.log(`${m.movement_type}: $${m.amount}`);
   *   console.log(`Balance: $${m.running_balance}`);
   *   console.log(`Usuario: ${m.user_full_name}`);
   *   if (m.related_sale_id) {
   *     console.log(`Venta: ${m.related_sale_id} - Cliente: ${m.sale_client_name}`);
   *   }
   * });
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
   * @param {string} [filters.type] - Tipo de movimiento
   * @param {string} [filters.date_from] - Fecha desde (formato: YYYY-MM-DD)
   * @param {string} [filters.date_to] - Fecha hasta (formato: YYYY-MM-DD)
   * @param {number} [filters.limit] - Límite de resultados (default: 50)
   * @param {number} [filters.offset] - Offset para paginación
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
   * Registra un movimiento manual de efectivo (POST /cash-movements)
   * @param {Object} movementData
   * @param {number} movementData.cash_register_id - ID de la caja
   * @param {string} movementData.movement_type - INCOME | EXPENSE | TRANSFER | ADJUSTMENT
   * @param {number} movementData.amount - Monto del movimiento
   * @param {string} movementData.concept - Concepto/descripción
   * @returns {Promise<Object>}
   */
  async createMovement(movementData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.cashMovements, movementData)
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
   *
   * Crea automáticamente un movimiento de reversión manteniendo trazabilidad.
   * - INCOME se revierte con EXPENSE
   * - EXPENSE se revierte con INCOME
   * - ADJUSTMENT/TRANSFER se revierten con monto invertido
   *
   * @param {number} movementId - ID del movimiento a anular
   * @param {string} reason - Razón de la anulación (mínimo 5 caracteres)
   * @returns {Promise<Object>} - Datos de la anulación
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
   * Obtiene reporte detallado de una caja registradora
   * @param {number} cashRegisterId
   * @returns {Promise<CashRegisterReport>}
   */
  async getCashRegisterSummary(cashRegisterId) {
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
        operation: 'getCashRegisterSummary',
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

  // =================== PAGOS CON INTEGRACIÓN DE CAJA ===================

  /**
   * Procesa un pago de venta con integración automática de caja
   * @param {ProcessPaymentRequest} paymentData
   * @returns {Promise<SalePaymentWithCashRegisterResponse>}
   */
  async processSalePaymentWithCashRegister(paymentData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.paymentsSale, paymentData)
      })

      telemetry.record('cash_register.service.sale_payment', {
        duration: Date.now() - startTime,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change,
        netCashImpact: result.cash_register_integration?.net_cash_impact || 0,
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
   * Procesa un pago de compra con integración automática de caja
   * @param {ProcessPurchasePaymentRequest} paymentData
   * @returns {Promise<PurchasePaymentWithCashRegisterResponse>}
   */
  async processPurchasePaymentWithCashRegister(paymentData) {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.paymentsPurchase, paymentData)
      })

      telemetry.record('cash_register.service.purchase_payment', {
        duration: Date.now() - startTime,
        amountPaid: paymentData.amount_paid,
        cashImpact: result.cash_register_integration?.cash_impact || 0,
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

  /**
   * Verifica la integridad de la integración
   * @returns {Promise<Object>}
   */
  async verifyIntegration() {
    const startTime = Date.now()

    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.verifyIntegration)
      })

      telemetry.record('cash_register.service.verify', {
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'verifyIntegration',
      })
      throw error
    }
  },

  // =================== UTILIDADES ===================

  /**
   * Valida datos de apertura de caja
   * @param {OpenCashRegisterRequest} data
   * @returns {Array<string>} Array de errores
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
   * @param {RegisterMovementRequest} data
   * @returns {Array<string>} Array de errores
   */
  validateMovementData(data) {
    const errors = []

    const validTypes = ['INCOME', 'EXPENSE', 'ADJUSTMENT']
    if (!data.movement_type || !validTypes.includes(data.movement_type)) {
      errors.push(
        `Tipo de movimiento inválido. Tipos válidos: ${validTypes.join(', ')}`
      )
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
