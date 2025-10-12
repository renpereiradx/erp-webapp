import { apiClient } from './api.js'
import { paymentApiDebug } from './paymentApiDebug.js'

const SERVICE_NAME = 'PaymentMethodService'
const PAYMENT_METHOD_WRITE_ENABLED = false

const logPaymentFailure = (
  operation,
  endpoint,
  error,
  { method = 'GET', note, payload, extra } = {}
) => {
  try {
    paymentApiDebug.record({
      service: SERVICE_NAME,
      operation,
      endpoint,
      method,
      error,
      note,
      requestBody: payload,
      extra,
    })
  } catch (logError) {
    console.warn(
      '[PaymentMethodService] No se pudo registrar el diagnóstico:',
      logError
    )
  }
}

/**
 * Payment Method Service - Handles all payment method-related API operations
 * Based on PAYMENT_API.md documentation
 */
class PaymentMethodService {
  /**
   * Obtiene todos los métodos de pago disponibles
   * @returns {Promise<import('../types/payment.js').PaymentMethod[]>}
   */
  static async getAll() {
    try {
      const response = await apiClient.makeRequest('/payment-methods')
      return response.data || response
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      logPaymentFailure('getAll', '/payment-methods', error, {
        note: 'Listado de métodos de pago para paneles de pago',
      })

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error(
          'El sistema de métodos de pago no está disponible. Los endpoints de Payment API no han sido implementados en el backend.'
        )
      }

      throw new Error('Error al obtener los métodos de pago del servidor')
    }
  }

  /**
   * Obtiene un método de pago por ID
   * @param {number} id - Payment method ID
   * @returns {Promise<import('../types/payment.js').PaymentMethod>}
   */
  static async getById(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de método de pago inválido')
      }

      const response = await apiClient.makeRequest(`/payment-methods/${id}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching payment method ${id}:`, error)
      logPaymentFailure('getById', `/payment-methods/${id}`, error)
      throw new Error('Error al obtener el método de pago')
    }
  }

  /**
   * Obtiene un método de pago por código
   * @param {string} code - Payment method code
   * @returns {Promise<import('../types/payment.js').PaymentMethod>}
   */
  static async getByCode(code) {
    try {
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('Código de método de pago inválido')
      }

      const response = await apiClient.makeRequest(
        `/payment-methods/code/${code.trim().toUpperCase()}`
      )
      return response.data || response
    } catch (error) {
      console.error(`Error fetching payment method ${code}:`, error)
      logPaymentFailure(
        'getByCode',
        `/payment-methods/code/${code.trim().toUpperCase()}`,
        error
      )
      throw new Error('Error al obtener el método de pago')
    }
  }

  /**
   * Valida si un método de pago existe y está disponible
   * @param {number} paymentMethodId - Payment method ID to validate
   * @returns {Promise<boolean>}
   */
  static async validatePaymentMethod(paymentMethodId) {
    try {
      await this.getById(paymentMethodId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Busca métodos de pago por descripción (búsqueda local)
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<import('../types/payment.js').PaymentMethod[]>}
   */
  static async searchByDescription(searchTerm) {
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        return []
      }

      const paymentMethods = await this.getAll()
      const term = searchTerm.toLowerCase().trim()

      return paymentMethods.filter(
        method =>
          method.description.toLowerCase().includes(term) ||
          method.method_code.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('Error searching payment methods:', error)
      logPaymentFailure('searchByDescription', '/payment-methods', error, {
        note: 'Búsqueda local de métodos de pago',
        extra: { searchTerm },
      })
      throw error
    }
  }

  /**
   * Obtiene métodos de pago filtrados por tipo común
   * @param {string} type - Tipo de método: 'cash', 'card', 'digital', 'bank'
   * @returns {Promise<import('../types/payment.js').PaymentMethod[]>}
   */
  static async getByType(type) {
    try {
      const paymentMethods = await this.getAll()

      const typeMapping = {
        cash: ['CASH', 'EFECTIVO', 'DINERO'],
        card: ['CARD', 'TARJETA', 'CREDITO', 'DEBITO'],
        digital: ['DIGITAL', 'ONLINE', 'VIRTUAL', 'ELECTRONICO'],
        bank: ['BANK', 'BANCO', 'TRANSFERENCIA', 'CHEQUE'],
      }

      const searchTerms = typeMapping[type.toLowerCase()] || []

      return paymentMethods.filter(method => {
        const methodText =
          `${method.method_code} ${method.description}`.toLowerCase()
        return searchTerms.some(term => methodText.includes(term.toLowerCase()))
      })
    } catch (error) {
      console.error('Error filtering payment methods by type:', error)
      logPaymentFailure('getByType', '/payment-methods', error, {
        note: 'Filtrado local de métodos de pago',
        extra: { type },
      })
      throw error
    }
  }

  /**
   * Obtiene el método de pago por defecto (efectivo)
   * @returns {Promise<import('../types/payment.js').PaymentMethod|null>}
   */
  static async getDefaultPaymentMethod() {
    try {
      // Intenta obtener efectivo primero
      try {
        return await this.getByCode('CASH')
      } catch {
        // Si no encuentra CASH, busca por efectivo
        const cashMethods = await this.getByType('cash')
        return cashMethods.length > 0 ? cashMethods[0] : null
      }
    } catch (error) {
      console.error('Error getting default payment method:', error)
      logPaymentFailure('getDefaultPaymentMethod', '/payment-methods', error, {
        note: 'Determinando método de pago por defecto',
      })
      return null
    }
  }

  /**
   * Formatea el código del método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string}
   */
  static formatMethodCode(paymentMethod) {
    if (!paymentMethod || !paymentMethod.method_code) {
      return ''
    }
    return paymentMethod.method_code.toUpperCase()
  }

  /**
   * Formatea la descripción completa del método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string}
   */
  static formatMethodDescription(paymentMethod) {
    if (!paymentMethod) {
      return ''
    }
    return `${this.formatMethodCode(paymentMethod)} - ${
      paymentMethod.description
    }`
  }

  /**
   * Verifica si un método de pago requiere información adicional
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {boolean}
   */
  static requiresAdditionalInfo(paymentMethod) {
    if (!paymentMethod) return false

    const methodCode = paymentMethod.method_code.toUpperCase()
    const additionalInfoMethods = [
      'CARD',
      'BANK',
      'TRANSFER',
      'CHECK',
      'CHEQUE',
    ]

    return additionalInfoMethods.some(code => methodCode.includes(code))
  }

  /**
   * Obtiene información adicional requerida por el método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string[]} Array de campos requeridos
   */
  static getRequiredFields(paymentMethod) {
    if (!paymentMethod) return []

    const methodCode = paymentMethod.method_code.toUpperCase()

    if (methodCode.includes('CARD')) {
      return ['card_number', 'card_holder', 'authorization_code']
    }

    if (methodCode.includes('BANK') || methodCode.includes('TRANSFER')) {
      return ['bank_name', 'account_number', 'reference_number']
    }

    if (methodCode.includes('CHECK') || methodCode.includes('CHEQUE')) {
      return ['check_number', 'bank_name', 'check_date']
    }

    return []
  }

  /**
   * Crea un nuevo método de pago
   * @param {{ method_code: string, description: string, is_active?: boolean, requires_additional_info?: boolean, metadata?: Record<string, any> }} data
   * @returns {Promise<import('../types/payment.js').PaymentMethod>}
   */
  static async create(data) {
    if (!PAYMENT_METHOD_WRITE_ENABLED) {
      const message =
        'La creación de métodos de pago no está disponible. Los endpoints de escritura aún no fueron implementados en el backend.'
      logPaymentFailure('create', '/payment-methods', new Error(message), {
        method: 'POST',
        payload: data,
        note: 'Intento de crear método de pago bloqueado en frontend',
      })
      throw new Error(message)
    }
    try {
      const payload = this.preparePayload(data)
      const response = await apiClient.makeRequest('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return response.data || response
    } catch (error) {
      console.error('Error creating payment method:', error)
      logPaymentFailure('create', '/payment-methods', error, {
        method: 'POST',
        payload: data,
      })
      throw new Error(error?.message || 'Error al crear el método de pago')
    }
  }

  /**
   * Actualiza un método de pago existente
   * @param {number} id
   * @param {{ method_code: string, description: string, is_active?: boolean, requires_additional_info?: boolean, metadata?: Record<string, any> }} data
   * @returns {Promise<import('../types/payment.js').PaymentMethod>}
   */
  static async update(id, data) {
    if (!PAYMENT_METHOD_WRITE_ENABLED) {
      const message =
        'La actualización de métodos de pago no está disponible. Los endpoints de escritura aún no fueron implementados en el backend.'
      logPaymentFailure(
        'update',
        `/payment-methods/${id}`,
        new Error(message),
        {
          method: 'PUT',
          payload: data,
          note: 'Intento de actualización bloqueado en frontend',
        }
      )
      throw new Error(message)
    }
    try {
      if (!id || id <= 0) {
        throw new Error('ID de método de pago inválido')
      }

      const payload = this.preparePayload(data)
      const response = await apiClient.makeRequest(`/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      return response.data || response
    } catch (error) {
      console.error(`Error updating payment method ${id}:`, error)
      logPaymentFailure('update', `/payment-methods/${id}`, error, {
        method: 'PUT',
        payload: data,
      })
      throw new Error(error?.message || 'Error al actualizar el método de pago')
    }
  }

  /**
   * Elimina un método de pago
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async delete(id) {
    if (!PAYMENT_METHOD_WRITE_ENABLED) {
      const message =
        'La eliminación de métodos de pago no está disponible. Los endpoints de escritura aún no fueron implementados en el backend.'
      logPaymentFailure(
        'delete',
        `/payment-methods/${id}`,
        new Error(message),
        {
          method: 'DELETE',
          note: 'Intento de eliminación bloqueado en frontend',
        }
      )
      throw new Error(message)
    }
    try {
      if (!id || id <= 0) {
        throw new Error('ID de método de pago inválido')
      }

      await apiClient.makeRequest(`/payment-methods/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(`Error deleting payment method ${id}:`, error)
      logPaymentFailure('delete', `/payment-methods/${id}`, error, {
        method: 'DELETE',
      })
      throw new Error(error?.message || 'Error al eliminar el método de pago')
    }
  }

  /**
   * Prepara y valida el payload para crear/actualizar métodos de pago
   * @param {{ method_code?: string, code?: string, description?: string, method_description?: string, is_active?: boolean, requires_additional_info?: boolean, metadata?: any }} data
   * @returns {{ method_code: string, description: string, is_active?: boolean, requires_additional_info?: boolean, metadata?: any }}
   */
  static preparePayload(data = {}) {
    const rawCode = data.method_code || data.code || ''
    const methodCode = rawCode.trim().toUpperCase()

    if (!methodCode) {
      throw new Error('El código del método de pago es requerido')
    }

    if (methodCode.length < 2) {
      throw new Error(
        'El código del método de pago debe tener al menos 2 caracteres'
      )
    }

    const rawDescription = data.description || data.method_description || ''
    const description = rawDescription.trim()

    if (!description) {
      throw new Error('La descripción del método de pago es requerida')
    }

    const payload = {
      method_code: methodCode,
      description,
    }

    if (typeof data.is_active === 'boolean') {
      payload.is_active = data.is_active
    }

    if (typeof data.requires_additional_info === 'boolean') {
      payload.requires_additional_info = data.requires_additional_info
    }

    if (data.metadata && typeof data.metadata === 'object') {
      payload.metadata = data.metadata
    }

    return payload
  }

  /**
   * Indica si las operaciones de escritura están habilitadas desde el frontend
   * @returns {boolean}
   */
  static canWrite() {
    return PAYMENT_METHOD_WRITE_ENABLED
  }
}

export { PaymentMethodService }
