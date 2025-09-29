import { apiClient } from './api.js';

/**
 * Currency Service - Handles all currency-related API operations
 * Based on PAYMENT_API.md documentation
 */
class CurrencyService {

  /**
   * Obtiene todas las monedas disponibles
   * @returns {Promise<import('../types/payment.js').Currency[]>}
   */
  static async getAll() {
    try {
      const response = await apiClient.makeRequest('/currencies');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching currencies:', error);

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error('El sistema de monedas no está disponible. Los endpoints de Payment API no han sido implementados en el backend.');
      }

      throw new Error('Error al obtener las monedas del servidor');
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
        throw new Error('ID de moneda inválido');
      }

      const response = await apiClient.makeRequest(`/currencies/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching currency ${id}:`, error);
      throw new Error('Error al obtener la moneda');
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
        throw new Error('Código de moneda inválido');
      }

      const response = await apiClient.makeRequest(`/currencies/code/${code.trim().toUpperCase()}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching currency ${code}:`, error);
      throw new Error('Error al obtener la moneda');
    }
  }

  /**
   * Valida si una moneda existe y está disponible
   * @param {number} currencyId - Currency ID to validate
   * @returns {Promise<boolean>}
   */
  static async validateCurrency(currencyId) {
    try {
      await this.getById(currencyId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene todas las monedas excepto la moneda base (PYG)
   * @returns {Promise<import('../types/payment.js').Currency[]>}
   */
  static async getAllExceptBase() {
    try {
      const currencies = await this.getAll();
      return currencies.filter(currency => currency.currency_code !== 'PYG');
    } catch (error) {
      console.error('Error fetching non-base currencies:', error);
      throw error;
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
        return [];
      }

      const currencies = await this.getAll();
      const term = searchTerm.toLowerCase().trim();

      return currencies.filter(currency =>
        currency.name.toLowerCase().includes(term) ||
        currency.currency_code.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching currencies:', error);
      throw error;
    }
  }

  /**
   * Obtiene la moneda base del sistema (PYG)
   * @returns {Promise<import('../types/payment.js').Currency>}
   */
  static async getBaseCurrency() {
    try {
      return await this.getByCode('PYG');
    } catch (error) {
      console.error('Error fetching base currency:', error);
      throw new Error('Error al obtener la moneda base');
    }
  }

  /**
   * Formatea el código de moneda para mostrar
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {string}
   */
  static formatCurrencyCode(currency) {
    if (!currency || !currency.currency_code) {
      return '';
    }
    return currency.currency_code.toUpperCase();
  }

  /**
   * Formatea el nombre completo de la moneda
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {string}
   */
  static formatCurrencyName(currency) {
    if (!currency) {
      return '';
    }
    return `${this.formatCurrencyCode(currency)} - ${currency.name}`;
  }

  /**
   * Verifica si una moneda es la moneda base
   * @param {import('../types/payment.js').Currency} currency - Currency object
   * @returns {boolean}
   */
  static isBaseCurrency(currency) {
    return currency && currency.currency_code === 'PYG';
  }

}

export { CurrencyService };