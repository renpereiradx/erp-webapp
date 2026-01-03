import { apiClient } from './api.js'
import { paymentApiDebug } from './paymentApiDebug.js'

const SERVICE_NAME = 'PaymentBootstrapService'

/**
 * Payment Bootstrap Service
 * Provides a single endpoint to load all payment-related data for frontend initialization
 * Based on PAYMENT_CONFIG_API.md documentation
 */

/**
 * @typedef {Object} BootstrapCurrency
 * @property {number} id - Currency ID
 * @property {string} currency_code - Currency code (e.g., "PYG", "USD")
 * @property {string} name - Currency display name
 * @property {string} symbol - Currency symbol (e.g., "₲", "$")
 * @property {number} decimal_places - Number of decimal places (0-2)
 * @property {boolean} is_base - Whether this is the system base currency
 */

/**
 * @typedef {Object} BootstrapPaymentMethod
 * @property {number} id - Payment method ID
 * @property {string} method_code - Method code (e.g., "CASH", "CARD")
 * @property {string} description - Method description
 * @property {string} [icon] - Optional icon name
 */

/**
 * @typedef {Object} BootstrapExchangeRate
 * @property {number} currency_id - Currency ID
 * @property {string} currency_code - Currency code
 * @property {number} rate_to_base - Rate to base currency
 */

/**
 * @typedef {Object} BootstrapExchangeRates
 * @property {string} date - ISO date string
 * @property {BootstrapExchangeRate[]} rates - Array of exchange rates
 */

/**
 * @typedef {Object} BootstrapConfig
 * @property {number} base_currency_id - Base currency ID
 * @property {string} base_currency_code - Base currency code
 * @property {number} default_decimals - Default decimal places
 */

/**
 * @typedef {Object} PaymentBootstrapResponse
 * @property {BootstrapCurrency[]} currencies - Available currencies
 * @property {BootstrapPaymentMethod[]} payment_methods - Available payment methods
 * @property {BootstrapExchangeRates} exchange_rates - Current exchange rates
 * @property {BootstrapConfig} config - System configuration
 * @property {string} generated_at - ISO datetime when bootstrap was generated
 */

class PaymentBootstrapService {
  /**
   * Fetches all payment-related data in a single call
   * @returns {Promise<PaymentBootstrapResponse>}
   */
  static async getBootstrap() {
    try {
      const response = await apiClient.makeRequest('/payments/bootstrap')
      return this.normalizeBootstrapResponse(response)
    } catch (error) {
      console.error(
        '[PaymentBootstrapService] Error fetching bootstrap:',
        error
      )

      try {
        paymentApiDebug.record({
          service: SERVICE_NAME,
          operation: 'getBootstrap',
          endpoint: '/payments/bootstrap',
          method: 'GET',
          error,
          note: 'Bootstrap inicial de pagos para frontend',
        })
      } catch (logError) {
        console.warn(
          '[PaymentBootstrapService] No se pudo registrar el diagnóstico:',
          logError
        )
      }

      // Si el endpoint no está disponible, intentar cargar datos individualmente
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error(
          'El endpoint de bootstrap de pagos no está disponible. Use los endpoints individuales como fallback.'
        )
      }

      throw new Error('Error al cargar la configuración de pagos')
    }
  }

  /**
   * Normalizes the bootstrap response for frontend consumption
   * @param {any} response - Raw API response
   * @returns {PaymentBootstrapResponse}
   */
  static normalizeBootstrapResponse(response) {
    const data = response?.data || response

    return {
      currencies: this.normalizeCurrencies(data?.currencies),
      payment_methods: this.normalizePaymentMethods(data?.payment_methods),
      exchange_rates: this.normalizeExchangeRates(data?.exchange_rates),
      config: this.normalizeConfig(data?.config),
      generated_at: data?.generated_at || new Date().toISOString(),
    }
  }

  /**
   * Normalizes currencies array from bootstrap response
   * @param {any[]} currencies
   * @returns {BootstrapCurrency[]}
   */
  static normalizeCurrencies(currencies) {
    if (!Array.isArray(currencies)) {
      return []
    }

    return currencies.map(c => ({
      id: c.id,
      currency_code: c.currency_code || c.code || '',
      name: c.name || c.currency_name || '',
      symbol: c.symbol || '',
      decimal_places:
        typeof c.decimal_places === 'number' ? c.decimal_places : 2,
      is_base: Boolean(c.is_base || c.is_base_currency),
    }))
  }

  /**
   * Normalizes payment methods from bootstrap response
   * @param {any[]} methods
   * @returns {BootstrapPaymentMethod[]}
   */
  static normalizePaymentMethods(methods) {
    if (!Array.isArray(methods)) {
      return []
    }

    return methods.map(m => ({
      id: m.id,
      method_code: m.method_code || m.code || '',
      description: m.description || m.name || '',
      icon: m.icon || null,
    }))
  }

  /**
   * Normalizes exchange rates from bootstrap response
   * @param {any} exchangeRates
   * @returns {BootstrapExchangeRates}
   */
  static normalizeExchangeRates(exchangeRates) {
    if (!exchangeRates) {
      return {
        date: new Date().toISOString().split('T')[0],
        rates: [],
      }
    }

    const rates = Array.isArray(exchangeRates.rates)
      ? exchangeRates.rates.map(r => ({
          currency_id: r.currency_id,
          currency_code: r.currency_code || '',
          rate_to_base:
            typeof r.rate_to_base === 'number'
              ? r.rate_to_base
              : parseFloat(r.rate_to_base) || 0,
        }))
      : []

    return {
      date: exchangeRates.date || new Date().toISOString().split('T')[0],
      rates,
    }
  }

  /**
   * Normalizes config from bootstrap response
   * @param {any} config
   * @returns {BootstrapConfig}
   */
  static normalizeConfig(config) {
    if (!config) {
      return {
        base_currency_id: 1,
        base_currency_code: 'PYG',
        default_decimals: 0,
      }
    }

    return {
      base_currency_id: config.base_currency_id || 1,
      base_currency_code: config.base_currency_code || 'PYG',
      default_decimals:
        typeof config.default_decimals === 'number'
          ? config.default_decimals
          : 0,
    }
  }

  /**
   * Gets the base currency from bootstrap data
   * @param {PaymentBootstrapResponse} bootstrapData
   * @returns {BootstrapCurrency|null}
   */
  static getBaseCurrency(bootstrapData) {
    if (!bootstrapData?.currencies) {
      return null
    }

    return bootstrapData.currencies.find(c => c.is_base) || null
  }

  /**
   * Gets exchange rate for a specific currency from bootstrap data
   * @param {PaymentBootstrapResponse} bootstrapData
   * @param {string} currencyCode - Currency code (e.g., "USD")
   * @returns {BootstrapExchangeRate|null}
   */
  static getExchangeRate(bootstrapData, currencyCode) {
    if (!bootstrapData?.exchange_rates?.rates) {
      return null
    }

    return (
      bootstrapData.exchange_rates.rates.find(
        r => r.currency_code === currencyCode
      ) || null
    )
  }

  /**
   * Gets a payment method by code from bootstrap data
   * @param {PaymentBootstrapResponse} bootstrapData
   * @param {string} methodCode - Method code (e.g., "CASH")
   * @returns {BootstrapPaymentMethod|null}
   */
  static getPaymentMethodByCode(bootstrapData, methodCode) {
    if (!bootstrapData?.payment_methods) {
      return null
    }

    return (
      bootstrapData.payment_methods.find(m => m.method_code === methodCode) ||
      null
    )
  }
}

export { PaymentBootstrapService }
