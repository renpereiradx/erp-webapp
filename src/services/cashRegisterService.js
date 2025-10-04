/**
 * Servicio para gestión de cajas registradoras
 * Integración con APIs de gestión de efectivo y pagos con caja
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

const API_ENDPOINTS = {
  cashRegisters: '/cash-registers',
  activeCashRegister: '/cash-registers/active',
  openCashRegister: '/cash-registers/open',
  closeCashRegister: (id) => `/cash-registers/${id}/close`,
  cashRegisterMovements: (id) => `/cash-registers/${id}/movements`,
  cashRegisterSummary: (id) => `/cash-registers/${id}/summary`,
  paymentsSale: '/cash-registers/payments/sale',
  paymentsPurchase: '/cash-registers/payments/purchase',
  verifyIntegration: '/cash-registers/verify-integration'
};

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  throw lastError;
};

export const cashRegisterService = {
  // =================== GESTIÓN DE CAJAS REGISTRADORAS ===================

  /**
   * Obtiene la caja registradora activa del usuario
   * @returns {Promise<CashRegister|null>}
   */
  async getActiveCashRegister() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Loading active cash register...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.activeCashRegister);
      });
      
      telemetry.record('cash_register.service.get_active', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ CashRegister: Active cash register loaded');
      return result;
    } catch (error) {
      // 204 No Content o 404 significa no hay caja activa - no es un error real
      if (error.status === 204 || error.status === 404) {
        console.log('📭 CashRegister: No active cash register found (HTTP ' + error.status + ')');
        telemetry.record('cash_register.service.no_active', {
          duration: Date.now() - startTime
        });
        return null;
      }

      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getActiveCashRegister'
      });
      throw error;
    }
  },

  /**
   * Abre una nueva caja registradora
   * @param {OpenCashRegisterRequest} cashRegisterData
   * @returns {Promise<CashRegister>}
   */
  async openCashRegister(cashRegisterData) {
    const startTime = Date.now();

    try {
      console.log('🌐 CashRegister: Opening cash register...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.openCashRegister, cashRegisterData);
      });
      
      telemetry.record('cash_register.service.open', {
        duration: Date.now() - startTime,
        initialBalance: cashRegisterData.initial_balance
      });
      
      console.log('✅ CashRegister: Cash register opened successfully');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'openCashRegister'
      });
      throw error;
    }
  },

  /**
   * Cierra una caja registradora
   * @param {number} cashRegisterId
   * @param {CloseCashRegisterRequest} closeData
   * @returns {Promise<CashRegister>}
   */
  async closeCashRegister(cashRegisterId, closeData = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 CashRegister: Closing cash register ${cashRegisterId}...`);
      console.log('📤 Close payload:', JSON.stringify(closeData, null, 2));
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(API_ENDPOINTS.closeCashRegister(cashRegisterId), closeData);
      });
      
      telemetry.record('cash_register.service.close', {
        duration: Date.now() - startTime,
        cashRegisterId,
        variance: result.variance || 0
      });
      
      console.log('✅ CashRegister: Cash register closed successfully');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'closeCashRegister'
      });
      throw error;
    }
  },

  /**
   * Obtiene lista de cajas registradoras
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>}
   */
  async getCashRegisters(filters = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Loading cash registers...');
      const params = new URLSearchParams(filters);
      const url = params.toString() ? `${API_ENDPOINTS.cashRegisters}?${params}` : API_ENDPOINTS.cashRegisters;
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('cash_register.service.list', {
        duration: Date.now() - startTime,
        count: result?.length || 0
      });
      
      console.log('✅ CashRegister: Cash registers loaded');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCashRegisters'
      });
      throw error;
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
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Registering manual movement...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.cashRegisterMovements(cashRegisterId), movementData);
      });
      
      telemetry.record('cash_register.service.movement', {
        duration: Date.now() - startTime,
        movementType: movementData.movement_type,
        amount: movementData.amount
      });
      
      console.log('✅ CashRegister: Movement registered successfully');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'registerMovement'
      });
      throw error;
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
    const startTime = Date.now();
    
    try {
      console.log(`🌐 CashRegister: Loading movements for cash register ${cashRegisterId}...`);
      const params = new URLSearchParams(filters);
      const url = params.toString() ? 
        `${API_ENDPOINTS.cashRegisterMovements(cashRegisterId)}?${params}` : 
        API_ENDPOINTS.cashRegisterMovements(cashRegisterId);
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('cash_register.service.movements', {
        duration: Date.now() - startTime,
        cashRegisterId,
        count: result?.length || 0
      });
      
      console.log('✅ CashRegister: Movements loaded');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getMovements'
      });
      throw error;
    }
  },

  /**
   * Obtiene resumen de una caja registradora
   * @param {number} cashRegisterId
   * @returns {Promise<CashRegisterSummary>}
   */
  async getCashRegisterSummary(cashRegisterId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 CashRegister: Loading summary for cash register ${cashRegisterId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.cashRegisterSummary(cashRegisterId));
      });
      
      telemetry.record('cash_register.service.summary', {
        duration: Date.now() - startTime,
        cashRegisterId
      });
      
      console.log('✅ CashRegister: Summary loaded');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCashRegisterSummary'
      });
      throw error;
    }
  },

  // =================== PAGOS CON INTEGRACIÓN DE CAJA ===================

  /**
   * Procesa un pago de venta con integración automática de caja
   * @param {ProcessPaymentRequest} paymentData
   * @returns {Promise<SalePaymentWithCashRegisterResponse>}
   */
  async processSalePaymentWithCashRegister(paymentData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Processing sale payment with cash register...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.paymentsSale, paymentData);
      });
      
      telemetry.record('cash_register.service.sale_payment', {
        duration: Date.now() - startTime,
        amountReceived: paymentData.amount_received,
        requiresChange: result.requires_change,
        netCashImpact: result.cash_register_integration?.net_cash_impact || 0
      });
      
      console.log('✅ CashRegister: Sale payment processed with cash integration');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processSalePaymentWithCashRegister'
      });
      throw error;
    }
  },

  /**
   * Procesa un pago de compra con integración automática de caja
   * @param {ProcessPurchasePaymentRequest} paymentData
   * @returns {Promise<PurchasePaymentWithCashRegisterResponse>}
   */
  async processPurchasePaymentWithCashRegister(paymentData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Processing purchase payment with cash register...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.paymentsPurchase, paymentData);
      });
      
      telemetry.record('cash_register.service.purchase_payment', {
        duration: Date.now() - startTime,
        amountPaid: paymentData.amount_paid,
        cashImpact: result.cash_register_integration?.cash_impact || 0
      });
      
      console.log('✅ CashRegister: Purchase payment processed with cash integration');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'processPurchasePaymentWithCashRegister'
      });
      throw error;
    }
  },

  /**
   * Verifica la integridad de la integración
   * @returns {Promise<Object>}
   */
  async verifyIntegration() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 CashRegister: Verifying integration...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.verifyIntegration);
      });
      
      telemetry.record('cash_register.service.verify', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ CashRegister: Integration verified');
      return result;
    } catch (error) {
      telemetry.record('cash_register.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'verifyIntegration'
      });
      throw error;
    }
  },

  // =================== UTILIDADES ===================

  /**
   * Valida datos de apertura de caja
   * @param {OpenCashRegisterRequest} data
   * @returns {Array<string>} Array de errores
   */
  validateOpenCashRegisterData(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Nombre es requerido');
    }

    if (typeof data.initial_balance !== 'number' || data.initial_balance < 0) {
      errors.push('Balance inicial debe ser un número positivo');
    }

    return errors;
  },

  /**
   * Valida datos de movimiento
   * @param {RegisterMovementRequest} data
   * @returns {Array<string>} Array de errores
   */
  validateMovementData(data) {
    const errors = [];
    
    const validTypes = ['INCOME', 'EXPENSE', 'ADJUSTMENT'];
    if (!data.movement_type || !validTypes.includes(data.movement_type)) {
      errors.push(`Tipo de movimiento inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }
    
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('Monto debe ser un número positivo');
    }
    
    if (!data.concept || data.concept.trim() === '') {
      errors.push('Concepto es requerido');
    }
    
    return errors;
  }
};

export default cashRegisterService;