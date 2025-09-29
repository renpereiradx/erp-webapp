import { apiClient } from './api.js';

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
      const response = await apiClient.makeRequest('/payment-methods');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching payment methods:', error);

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        throw new Error('El sistema de métodos de pago no está disponible. Los endpoints de Payment API no han sido implementados en el backend.');
      }

      throw new Error('Error al obtener los métodos de pago del servidor');
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
        throw new Error('ID de método de pago inválido');
      }

      const response = await apiClient.makeRequest(`/payment-methods/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching payment method ${id}:`, error);
      throw new Error('Error al obtener el método de pago');
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
        throw new Error('Código de método de pago inválido');
      }

      const response = await apiClient.makeRequest(`/payment-methods/code/${code.trim().toUpperCase()}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching payment method ${code}:`, error);
      throw new Error('Error al obtener el método de pago');
    }
  }

  /**
   * Valida si un método de pago existe y está disponible
   * @param {number} paymentMethodId - Payment method ID to validate
   * @returns {Promise<boolean>}
   */
  static async validatePaymentMethod(paymentMethodId) {
    try {
      await this.getById(paymentMethodId);
      return true;
    } catch (error) {
      return false;
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
        return [];
      }

      const paymentMethods = await this.getAll();
      const term = searchTerm.toLowerCase().trim();

      return paymentMethods.filter(method =>
        method.description.toLowerCase().includes(term) ||
        method.method_code.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching payment methods:', error);
      throw error;
    }
  }

  /**
   * Obtiene métodos de pago filtrados por tipo común
   * @param {string} type - Tipo de método: 'cash', 'card', 'digital', 'bank'
   * @returns {Promise<import('../types/payment.js').PaymentMethod[]>}
   */
  static async getByType(type) {
    try {
      const paymentMethods = await this.getAll();

      const typeMapping = {
        'cash': ['CASH', 'EFECTIVO', 'DINERO'],
        'card': ['CARD', 'TARJETA', 'CREDITO', 'DEBITO'],
        'digital': ['DIGITAL', 'ONLINE', 'VIRTUAL', 'ELECTRONICO'],
        'bank': ['BANK', 'BANCO', 'TRANSFERENCIA', 'CHEQUE']
      };

      const searchTerms = typeMapping[type.toLowerCase()] || [];

      return paymentMethods.filter(method => {
        const methodText = `${method.method_code} ${method.description}`.toLowerCase();
        return searchTerms.some(term => methodText.includes(term.toLowerCase()));
      });
    } catch (error) {
      console.error('Error filtering payment methods by type:', error);
      throw error;
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
        return await this.getByCode('CASH');
      } catch {
        // Si no encuentra CASH, busca por efectivo
        const cashMethods = await this.getByType('cash');
        return cashMethods.length > 0 ? cashMethods[0] : null;
      }
    } catch (error) {
      console.error('Error getting default payment method:', error);
      return null;
    }
  }

  /**
   * Formatea el código del método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string}
   */
  static formatMethodCode(paymentMethod) {
    if (!paymentMethod || !paymentMethod.method_code) {
      return '';
    }
    return paymentMethod.method_code.toUpperCase();
  }

  /**
   * Formatea la descripción completa del método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string}
   */
  static formatMethodDescription(paymentMethod) {
    if (!paymentMethod) {
      return '';
    }
    return `${this.formatMethodCode(paymentMethod)} - ${paymentMethod.description}`;
  }

  /**
   * Verifica si un método de pago requiere información adicional
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {boolean}
   */
  static requiresAdditionalInfo(paymentMethod) {
    if (!paymentMethod) return false;

    const methodCode = paymentMethod.method_code.toUpperCase();
    const additionalInfoMethods = ['CARD', 'BANK', 'TRANSFER', 'CHECK', 'CHEQUE'];

    return additionalInfoMethods.some(code => methodCode.includes(code));
  }

  /**
   * Obtiene información adicional requerida por el método de pago
   * @param {import('../types/payment.js').PaymentMethod} paymentMethod - Payment method object
   * @returns {string[]} Array de campos requeridos
   */
  static getRequiredFields(paymentMethod) {
    if (!paymentMethod) return [];

    const methodCode = paymentMethod.method_code.toUpperCase();

    if (methodCode.includes('CARD')) {
      return ['card_number', 'card_holder', 'authorization_code'];
    }

    if (methodCode.includes('BANK') || methodCode.includes('TRANSFER')) {
      return ['bank_name', 'account_number', 'reference_number'];
    }

    if (methodCode.includes('CHECK') || methodCode.includes('CHEQUE')) {
      return ['check_number', 'bank_name', 'check_date'];
    }

    return [];
  }

}

export { PaymentMethodService };