import { apiClient } from './api.js';

/**
 * Exchange Rate Service - Handles all exchange rate-related API operations
 * Based on PAYMENT_API.md documentation
 */
class ExchangeRateService {

  /**
   * Obtiene el tipo de cambio de una moneda en una fecha específica
   * @param {import('../types/payment.js').ExchangeRateQuery} query - Query parameters
   * @returns {Promise<import('../types/payment.js').ExchangeRate>}
   */
  static async getByDate(query) {
    try {
      if (!query || !query.currency_id || query.currency_id <= 0) {
        throw new Error('ID de moneda inválido');
      }

      const params = new URLSearchParams();
      if (query.date) {
        // Validar formato de fecha YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
          throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }
        params.append('date', query.date);
      }

      const url = `/exchange-rate/currency/${query.currency_id}`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

      const response = await apiClient.makeRequest(fullUrl);
      const data = response.data || response;

      // Parse response if it's a JSON string
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.warn('Could not parse exchange rate response as JSON:', data);
          return data;
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error('El sistema de tipos de cambio no está disponible. Los endpoints de Payment API no han sido implementados en el backend.');
      }

      throw new Error('Error al obtener el tipo de cambio del servidor');
    }
  }

  /**
   * Obtiene tipos de cambio de una moneda en un rango de fechas
   * @param {import('../types/payment.js').ExchangeRateRangeQuery} query - Range query parameters
   * @returns {Promise<import('../types/payment.js').ExchangeRate[]>}
   */
  static async getByRange(query) {
    try {
      if (!query || !query.currency_id || query.currency_id <= 0) {
        throw new Error('ID de moneda inválido');
      }

      if (!query.start_date || !query.end_date) {
        throw new Error('Fechas de inicio y fin son requeridas');
      }

      // Validar formato de fechas
      if (!/^\d{4}-\d{2}-\d{2}$/.test(query.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(query.end_date)) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
      }

      // Validar que start_date <= end_date
      if (new Date(query.start_date) > new Date(query.end_date)) {
        throw new Error('La fecha de inicio debe ser anterior o igual a la fecha de fin');
      }

      const params = new URLSearchParams({
        start_date: query.start_date,
        end_date: query.end_date
      });

      const response = await apiClient.makeRequest(
        `/exchange-rate/currency/${query.currency_id}/range?${params.toString()}`
      );
      const data = response.data || response;

      // Parse response if it's a JSON string (for arrays)
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.warn('Could not parse exchange rate range response as JSON:', data);
          return data;
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching exchange rate range:', error);
      throw new Error('Error al obtener los tipos de cambio');
    }
  }

  /**
   * Obtiene el tipo de cambio más reciente de una moneda
   * @param {number} currencyId - Currency ID
   * @returns {Promise<import('../types/payment.js').ExchangeRate>}
   */
  static async getLatest(currencyId) {
    return this.getByDate({ currency_id: currencyId });
  }

  /**
   * Convierte un monto de una moneda a otra
   * @param {number} amount - Amount to convert
   * @param {number} fromCurrencyId - Source currency ID
   * @param {number} toCurrencyId - Target currency ID
   * @param {string} [date] - Optional date for historical conversion
   * @returns {Promise<number>}
   */
  static async convertCurrency(amount, fromCurrencyId, toCurrencyId, date) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Monto inválido');
      }

      if (!fromCurrencyId || !toCurrencyId || fromCurrencyId <= 0 || toCurrencyId <= 0) {
        throw new Error('IDs de moneda inválidos');
      }

      // Si es la misma moneda, no hay conversión
      if (fromCurrencyId === toCurrencyId) {
        return amount;
      }

      // Obtener tipos de cambio para ambas monedas
      const fromRate = await this.getByDate({ currency_id: fromCurrencyId, date });
      const toRate = await this.getByDate({ currency_id: toCurrencyId, date });

      // Validar que las tasas tienen el formato correcto
      if (!fromRate || typeof fromRate.rate_to_base !== 'number') {
        throw new Error(`Tipo de cambio inválido para moneda origen (ID: ${fromCurrencyId})`);
      }

      if (!toRate || typeof toRate.rate_to_base !== 'number') {
        throw new Error(`Tipo de cambio inválido para moneda destino (ID: ${toCurrencyId})`);
      }

      // Convertir a moneda base y luego a moneda objetivo
      const amountInBase = amount * fromRate.rate_to_base;
      const convertedAmount = amountInBase / toRate.rate_to_base;

      return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error('Error al convertir moneda');
    }
  }

  /**
   * Convierte un monto con información detallada del resultado
   * @param {number} amount - Amount to convert
   * @param {number} fromCurrencyId - Source currency ID
   * @param {number} toCurrencyId - Target currency ID
   * @param {string} [date] - Optional date for historical conversion
   * @returns {Promise<import('../types/payment.js').CurrencyConversionResult>}
   */
  static async convertCurrencyDetailed(amount, fromCurrencyId, toCurrencyId, date) {
    try {
      const convertedAmount = await this.convertCurrency(amount, fromCurrencyId, toCurrencyId, date);

      // Obtener información adicional para el resultado detallado
      const [fromRate, toRate] = await Promise.all([
        this.getByDate({ currency_id: fromCurrencyId, date }),
        this.getByDate({ currency_id: toCurrencyId, date })
      ]);

      return {
        originalAmount: amount,
        convertedAmount,
        fromRate,
        toRate,
        conversionDate: date || new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error in detailed currency conversion:', error);
      throw error;
    }
  }

  /**
   * Valida si existe un tipo de cambio para una moneda en una fecha
   * @param {number} currencyId - Currency ID
   * @param {string} [date] - Optional date to check
   * @returns {Promise<import('../types/payment.js').ExchangeRateValidation>}
   */
  static async validateExchangeRate(currencyId, date) {
    try {
      const exchangeRate = await this.getByDate({ currency_id: currencyId, date });

      if (!exchangeRate) {
        return {
          hasRate: false,
          isRecent: false,
          warning: 'No se encontró tipo de cambio para esta moneda'
        };
      }

      // Verificar si el tipo de cambio es reciente (menos de 24 horas)
      const rateDate = new Date(exchangeRate.date);
      const now = new Date();
      const diffHours = Math.abs(now - rateDate) / (1000 * 60 * 60);
      const isRecent = diffHours <= 24;

      return {
        hasRate: true,
        isRecent,
        warning: !isRecent ? 'El tipo de cambio no es reciente (más de 24 horas)' : undefined
      };
    } catch (error) {
      return {
        hasRate: false,
        isRecent: false,
        warning: 'Error al validar tipo de cambio'
      };
    }
  }

  /**
   * Obtiene el histórico de tipos de cambio para múltiples monedas
   * @param {number[]} currencyIds - Array of currency IDs
   * @param {string} startDate - Start date YYYY-MM-DD
   * @param {string} endDate - End date YYYY-MM-DD
   * @returns {Promise<{[currencyId: number]: import('../types/payment.js').ExchangeRate[]}>}
   */
  static async getMultipleCurrencyRates(currencyIds, startDate, endDate) {
    try {
      if (!Array.isArray(currencyIds) || currencyIds.length === 0) {
        throw new Error('Se requiere al menos un ID de moneda');
      }

      const results = {};

      // Obtener tipos de cambio para cada moneda en paralelo
      const promises = currencyIds.map(async (currencyId) => {
        try {
          const rates = await this.getByRange({
            currency_id: currencyId,
            start_date: startDate,
            end_date: endDate
          });
          results[currencyId] = rates;
        } catch (error) {
          console.error(`Error fetching rates for currency ${currencyId}:`, error);
          results[currencyId] = [];
        }
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error fetching multiple currency rates:', error);
      throw error;
    }
  }

  /**
   * Formatea un tipo de cambio para mostrar
   * @param {number} rate - Exchange rate value
   * @param {string} [currencyCode] - Currency code for context
   * @returns {string}
   */
  static formatExchangeRate(rate, currencyCode = '') {
    if (!rate || typeof rate !== 'number') {
      return '0.00';
    }

    const formatted = new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(rate);

    return currencyCode ? `${formatted} (${currencyCode}/PYG)` : formatted;
  }

  /**
   * Calcula la diferencia porcentual entre dos tipos de cambio
   * @param {number} oldRate - Previous rate
   * @param {number} newRate - Current rate
   * @returns {number} Percentage change
   */
  static calculateRateChange(oldRate, newRate) {
    if (!oldRate || !newRate || oldRate <= 0) {
      return 0;
    }

    return parseFloat((((newRate - oldRate) / oldRate) * 100).toFixed(2));
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns {string}
   */
  static getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Valida formato de fecha YYYY-MM-DD
   * @param {string} date - Date string to validate
   * @returns {boolean}
   */
  static isValidDateFormat(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

}

export { ExchangeRateService };