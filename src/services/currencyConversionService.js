import { apiClient } from './api.js'
import { paymentApiDebug } from './paymentApiDebug.js'

const SERVICE_NAME = 'CurrencyConversionService'

/**
 * Currency Conversion Service
 * Handles currency conversion using the dedicated API endpoint
 * Based on PAYMENT_CONFIG_API.md documentation
 */

/**
 * @typedef {Object} ConversionCurrencyInfo
 * @property {string} code - Currency code
 * @property {string} name - Currency name
 * @property {number} amount - Amount in this currency
 * @property {number} rate - Exchange rate to base
 */

/**
 * @typedef {Object} ConversionResult
 * @property {boolean} success - Whether conversion was successful
 * @property {ConversionCurrencyInfo} from - Source currency info
 * @property {ConversionCurrencyInfo} to - Target currency info
 * @property {string} date - Date of exchange rate used
 * @property {string} timestamp - ISO timestamp of conversion
 */

class CurrencyConversionService {
  /**
   * Converts an amount from one currency to another using the API
   * @param {string} fromCode - Source currency code (e.g., "USD")
   * @param {string} toCode - Target currency code (e.g., "PYG")
   * @param {number} amount - Amount to convert
   * @param {string} [date] - Optional date for historical conversion (YYYY-MM-DD)
   * @returns {Promise<ConversionResult>}
   */
  static async convert(fromCode, toCode, amount, date) {
    try {
      // Validaciones
      if (!fromCode || typeof fromCode !== 'string') {
        throw new Error('Código de moneda origen inválido')
      }

      if (!toCode || typeof toCode !== 'string') {
        throw new Error('Código de moneda destino inválido')
      }

      if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        throw new Error('El monto debe ser un número válido mayor o igual a 0')
      }

      // Construir query params
      const params = new URLSearchParams({
        from: fromCode.trim().toUpperCase(),
        to: toCode.trim().toUpperCase(),
        amount: String(amount),
      })

      if (date) {
        if (!this.isValidDateFormat(date)) {
          throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')
        }
        params.append('date', date)
      }

      const endpoint = `/currencies/convert?${params.toString()}`
      const response = await apiClient.makeRequest(endpoint)

      return this.normalizeConversionResponse(response)
    } catch (error) {
      console.error(
        '[CurrencyConversionService] Error converting currency:',
        error
      )

      try {
        paymentApiDebug.record({
          service: SERVICE_NAME,
          operation: 'convert',
          endpoint: '/currencies/convert',
          method: 'GET',
          error,
          note: 'Conversión de monedas',
          extra: { fromCode, toCode, amount, date },
        })
      } catch (logError) {
        console.warn(
          '[CurrencyConversionService] No se pudo registrar el diagnóstico:',
          logError
        )
      }

      // Error específico para endpoint no disponible
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error(
          'El servicio de conversión de monedas no está disponible. Verifique que el backend esté actualizado.'
        )
      }

      throw new Error(error?.message || 'Error al convertir moneda')
    }
  }

  /**
   * Normalizes the conversion API response
   * @param {any} response
   * @returns {ConversionResult}
   */
  static normalizeConversionResponse(response) {
    const data = response?.data || response

    return {
      success: data?.success !== false,
      from: {
        code: data?.from?.code || '',
        name: data?.from?.name || '',
        amount:
          typeof data?.from?.amount === 'number'
            ? data.from.amount
            : parseFloat(data?.from?.amount) || 0,
        rate:
          typeof data?.from?.rate === 'number'
            ? data.from.rate
            : parseFloat(data?.from?.rate) || 0,
      },
      to: {
        code: data?.to?.code || '',
        name: data?.to?.name || '',
        amount:
          typeof data?.to?.amount === 'number'
            ? data.to.amount
            : parseFloat(data?.to?.amount) || 0,
        rate:
          typeof data?.to?.rate === 'number'
            ? data.to.rate
            : parseFloat(data?.to?.rate) || 0,
      },
      date: data?.date || new Date().toISOString().split('T')[0],
      timestamp: data?.timestamp || new Date().toISOString(),
    }
  }

  /**
   * Quick conversion helper - returns just the converted amount
   * @param {string} fromCode - Source currency code
   * @param {string} toCode - Target currency code
   * @param {number} amount - Amount to convert
   * @param {string} [date] - Optional date
   * @returns {Promise<number>}
   */
  static async convertAmount(fromCode, toCode, amount, date) {
    const result = await this.convert(fromCode, toCode, amount, date)
    return result.to.amount
  }

  /**
   * Converts to base currency (PYG)
   * @param {string} fromCode - Source currency code
   * @param {number} amount - Amount to convert
   * @param {string} [date] - Optional date
   * @returns {Promise<number>}
   */
  static async convertToBase(fromCode, amount, date) {
    return this.convertAmount(fromCode, 'PYG', amount, date)
  }

  /**
   * Converts from base currency (PYG)
   * @param {string} toCode - Target currency code
   * @param {number} amount - Amount to convert
   * @param {string} [date] - Optional date
   * @returns {Promise<number>}
   */
  static async convertFromBase(toCode, amount, date) {
    return this.convertAmount('PYG', toCode, amount, date)
  }

  /**
   * Formats a conversion result for display
   * @param {ConversionResult} result
   * @returns {string}
   */
  static formatConversionResult(result) {
    if (!result || !result.from || !result.to) {
      return ''
    }

    const fromFormatted = new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(result.from.amount)

    const toFormatted = new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(result.to.amount)

    return `${result.from.code} ${fromFormatted} = ${result.to.code} ${toFormatted}`
  }

  /**
   * Validates date format YYYY-MM-DD
   * @param {string} date
   * @returns {boolean}
   */
  static isValidDateFormat(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  }
}

export { CurrencyConversionService }
