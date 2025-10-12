import { apiClient } from './api.js'
import { paymentApiDebug } from './paymentApiDebug.js'

const SERVICE_NAME = 'CurrencyService'

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
      '[CurrencyService] No se pudo registrar el diagnóstico:',
      logError
    )
  }
}

/**
 * Currency Service - Handles all currency-related API operations
 * Based on PAYMENT_API.md documentation
 */
class CurrencyService {
  /**
   * Normaliza la estructura de moneda proveniente de la API
   * @param {any} payload
   * @returns {import('../types/payment.js').Currency|null}
   */
  static normalizeCurrency(payload) {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const currencyCode = payload.currency_code || payload.code || ''
    const currencyName = payload.currency_name || payload.name || ''

    return {
      id: payload.id,
      currency_code:
        typeof currencyCode === 'string'
          ? currencyCode.toUpperCase()
          : currencyCode,
      currency_name: currencyName,
      // Alias legacy para mantener compatibilidad con componentes existentes
      name: currencyName,
      symbol: payload.symbol || payload.currency_symbol || '',
      is_base_currency: Boolean(payload.is_base_currency),
    }
  }

  /**
   * Normaliza una colección de monedas
   * @param {any} payload
   * @returns {import('../types/payment.js').Currency[]}
   */
  static normalizeCurrencyList(payload) {
    if (!payload) {
      return []
    }

    if (Array.isArray(payload)) {
      return payload.map(this.normalizeCurrency).filter(Boolean)
    }

    if (Array.isArray(payload.data)) {
      return payload.data.map(this.normalizeCurrency).filter(Boolean)
    }

    return []
  }

  /**
   * Obtiene todas las monedas disponibles
   * @returns {Promise<import('../types/payment.js').Currency[]>}
   */
  static async getAll() {
    try {
      const response = await apiClient.makeRequest('/currencies')
      return this.normalizeCurrencyList(response)
    } catch (error) {
      console.error('Error fetching currencies:', error)
      logPaymentFailure('getAll', '/currencies', error, {
        note: 'Listado de monedas para paneles de pago',
      })

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error(
          'El sistema de monedas no está disponible. Los endpoints de Payment API no han sido implementados en el backend.'
        )
      }

      throw new Error('Error al obtener las monedas del servidor')
    }
  }

  /**
   * Obtiene una moneda por ID
   * @param {number} id - Currency ID
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async getById(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de moneda inválido')
      }

      const response = await apiClient.makeRequest(`/currencies/${id}`)
      const currency = response.data || response
      return this.normalizeCurrency(currency)
    } catch (error) {
      console.error(`Error fetching currency ${id}:`, error)
      logPaymentFailure('getById', `/currencies/${id}`, error)
      throw new Error('Error al obtener la moneda')
    }
  }

  /**
   * Obtiene una moneda por código
   * @param {string} code - Currency code (e.g., "USD", "PYG")
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async getByCode(code) {
    try {
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('Código de moneda inválido')
      }

      const response = await apiClient.makeRequest(
        `/currencies/code/${code.trim().toUpperCase()}`
      )
      const currency = response.data || response
      return this.normalizeCurrency(currency)
    } catch (error) {
      console.error(`Error fetching currency ${code}:`, error)
      logPaymentFailure(
        'getByCode',
        `/currencies/code/${code.trim().toUpperCase()}`,
        error
      )
      throw new Error('Error al obtener la moneda')
    }
  }

  /**
   * Valida si una moneda existe y está disponible
   * @param {number} currencyId - Currency ID to validate
   * @returns {Promise<boolean>}
   */
  static async validateCurrency(currencyId) {
    try {
      await this.getById(currencyId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtiene todas las monedas excepto la moneda base (PYG)
   * @returns {Promise<import('../types/payment.js').Currency[]>}
   */
  static async getAllExceptBase() {
    try {
      const currencies = await this.getAll()
      return currencies.filter(currency => !currency.is_base_currency)
    } catch (error) {
      console.error('Error fetching non-base currencies:', error)
      logPaymentFailure('getAllExceptBase', '/currencies', error, {
        note: 'Filtrado para excluir moneda base',
      })
      throw error
    }
  }

  /**
   * Busca monedas por nombre (búsqueda local)
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<import('../types/payment.js').Currency[]>}
   */
  static async searchByName(searchTerm) {
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        return []
      }

      const currencies = await this.getAll()
      const term = searchTerm.toLowerCase().trim()

      return currencies.filter(
        currency =>
          (currency.name || '').toLowerCase().includes(term) ||
          currency.currency_code.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('Error searching currencies:', error)
      throw error
    }
  }

  /**
   * Obtiene la moneda base del sistema (PYG)
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async getBaseCurrency() {
    try {
      const currencies = await this.getAll()
      const baseCurrency = currencies.find(
        currency => currency.is_base_currency
      )

      if (baseCurrency) {
        return baseCurrency
      }

      // Fallback histórico
      const pyg = await this.getByCode('PYG')
      if (pyg) {
        return pyg
      }

      throw new Error('No se encontró moneda base configurada')
    } catch (error) {
      console.error('Error fetching base currency:', error)
      logPaymentFailure('getBaseCurrency', '/currencies', error, {
        note: 'Determinando moneda base',
      })
      throw new Error('Error al obtener la moneda base')
    }
  }

  /**
   * Formatea el código de moneda para mostrar
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {string}
   */
  static formatCurrencyCode(currency) {
    if (!currency || !currency.currency_code) {
      return ''
    }
    return currency.currency_code.toUpperCase()
  }

  /**
   * Formatea el nombre completo de la moneda
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {string}
   */
  static formatCurrencyName(currency) {
    if (!currency) {
      return ''
    }
    return `${this.formatCurrencyCode(currency)} - ${currency.name}`
  }

  /**
   * Verifica si una moneda es la moneda base
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {boolean}
   */
  static isBaseCurrency(currency) {
    return Boolean(currency?.is_base_currency)
  }

  /**
   * Crea una nueva moneda
   * @param {{ currency_code: string, currency_name?: string, symbol?: string, is_base_currency?: boolean }} data
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async create(data) {
    let payload
    try {
      payload = this.preparePayload(data)
      const response = await apiClient.makeRequest('/currencies', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return this.normalizeCurrency(response)
    } catch (error) {
      console.error('Error creating currency:', error)
      logPaymentFailure('create', '/currencies', error, {
        method: 'POST',
        payload,
      })
      throw new Error(error?.message || 'Error al crear la moneda')
    }
  }

  /**
   * Actualiza una moneda existente
   * @param {number} id
   * @param {{ currency_code: string, currency_name?: string, symbol?: string, is_base_currency?: boolean }} data
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async update(id, data) {
    let payload
    try {
      if (!id || id <= 0) {
        throw new Error('ID de moneda inválido')
      }

      payload = this.preparePayload(data)
      const response = await apiClient.makeRequest(`/currencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      return this.normalizeCurrency(response)
    } catch (error) {
      console.error(`Error updating currency ${id}:`, error)
      logPaymentFailure('update', `/currencies/${id}`, error, {
        method: 'PUT',
        payload,
      })
      throw new Error(error?.message || 'Error al actualizar la moneda')
    }
  }

  /**
   * Elimina una moneda
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de moneda inválido')
      }

      await apiClient.makeRequest(`/currencies/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(`Error deleting currency ${id}:`, error)
      logPaymentFailure('delete', `/currencies/${id}`, error, {
        method: 'DELETE',
      })
      throw new Error(error?.message || 'Error al eliminar la moneda')
    }
  }

  /**
   * Prepara y valida la carga útil para crear/actualizar monedas
   * @param {{ currency_code: string, currency_name?: string, symbol?: string, is_base_currency?: boolean }} data
   * @returns {{ currency_code: string, currency_name?: string, symbol?: string, is_base_currency?: boolean }}
   */
  static preparePayload(data = {}) {
    const trimmedCode = (data.currency_code || '').trim().toUpperCase()

    if (!trimmedCode) {
      throw new Error('El código de moneda es requerido')
    }

    if (trimmedCode.length !== 3) {
      throw new Error('El código de moneda debe tener exactamente 3 caracteres')
    }

    const rawName = data.currency_name ?? data.name ?? data.description ?? ''
    const normalizedName = typeof rawName === 'string' ? rawName.trim() : ''

    const payload = {
      currency_code: trimmedCode,
      currency_name: normalizedName,
      name: normalizedName,
      description: normalizedName,
      symbol: data.symbol?.trim() || '',
      is_base_currency: Boolean(data.is_base_currency),
    }

    // Mantener compatibilidad: no enviar campos vacíos innecesarios
    if (!payload.currency_name) {
      delete payload.currency_name
      delete payload.name
      delete payload.description
    }

    if (!payload.symbol) {
      delete payload.symbol
    }

    if (!payload.is_base_currency) {
      delete payload.is_base_currency
    }

    return payload
  }
}

export { CurrencyService }
