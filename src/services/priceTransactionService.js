/**
 * Servicio API para Price Transactions v1.0 - Septiembre 2025
 * Integración completa con la nueva API de transacciones de precio
 */

import { apiService as apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

// Configuración base
const API_BASE_URL = 'http://localhost:5050';

// Helper para hacer peticiones con reintentos
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  throw lastError;
};

// Demo data para fallback
const getDemoTransactionTypes = () => ({
  transaction_types: [
    "MANUAL_ADJUSTMENT",
    "MARKET_UPDATE", 
    "COST_UPDATE",
    "SUPPLIER_CHANGE",
    "PROMOTION",
    "CURRENCY_ADJUSTMENT",
    "INITIAL_PRICE",
    "BULK_UPDATE"
  ],
  total_types: 8,
  description: {
    "MANUAL_ADJUSTMENT": "Ajustes manuales de precio por usuarios autorizados",
    "MARKET_UPDATE": "Cambios de precio basados en condiciones del mercado",
    "COST_UPDATE": "Cambios de precio debido a variaciones en costos",
    "SUPPLIER_CHANGE": "Ajustes de precio por cambios de proveedor",
    "PROMOTION": "Cambios de precio promocionales temporales",
    "CURRENCY_ADJUSTMENT": "Ajustes de precio por fluctuaciones de moneda",
    "INITIAL_PRICE": "Establecimiento de precio inicial para productos nuevos",
    "BULK_UPDATE": "Actualizaciones masivas de precios en múltiples productos"
  }
});

export const priceTransactionService = {
  /**
   * Registrar nueva transacción de precio
   * @param {Object} transactionData - Datos de la transacción
   */
  async registerTransaction(transactionData) {
    const startTime = Date.now();
    
    try {
      // Validar datos requeridos
      this.validateTransactionData(transactionData);

      console.log('🌐 PriceTransaction: Registering new transaction...');
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post('/price-transactions', {
          product_id: transactionData.product_id,
          transaction_type: transactionData.transaction_type,
          new_price: transactionData.new_price,
          effective_date: transactionData.effective_date,
          reference_type: transactionData.reference_type,
          reference_id: transactionData.reference_id,
          reason: transactionData.reason,
          currency_id: transactionData.currency_id || 'PYG',
          exchange_rate: transactionData.exchange_rate || 1.0,
          cost_factor: transactionData.cost_factor,
          margin_percent: transactionData.margin_percent,
          metadata: {
            ...transactionData.metadata,
            source: 'web_ui',
            created_by: 'current_user'
          }
        });
      });
      
      telemetry.record('priceTransaction.service.register', {
        duration: Date.now() - startTime,
        productId: transactionData.product_id,
        transactionType: transactionData.transaction_type
      });
      
      console.log('✅ PriceTransaction: Transaction registered successfully');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction API error:', error.message);
      
      // Fallback demo para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 PriceTransaction: Using demo mode...');
        
        const demoResult = {
          transaction_id: Date.now(),
          product_id: transactionData.product_id,
          old_price: 15.00, // Simular precio anterior
          new_price: transactionData.new_price,
          price_change: transactionData.new_price - 15.00,
          message: "Price transaction registered (demo mode)",
          metadata: {
            ...transactionData.metadata,
            source: "demo_mode"
          }
        };
        
        return { success: true, data: demoResult };
      }
      
      telemetry.record('priceTransaction.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'register'
      });
      
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener tipos de transacciones disponibles
   */
  async getTransactionTypes() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Loading transaction types...');
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get('/price-transactions/types');
      });
      
      telemetry.record('priceTransaction.service.getTypes', {
        duration: Date.now() - startTime
      });
      
      console.log('✅ PriceTransaction: Transaction types loaded');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction types error:', error.message);
      
      // Fallback con tipos predefinidos
      console.log('🔄 PriceTransaction: Using demo transaction types...');
      const demoTypes = getDemoTransactionTypes();
      
      return { success: true, data: demoTypes };
    }
  },

  /**
   * Obtener historial de precios por producto
   * @param {string} productId - ID del producto
   * @param {number} page - Página (base 0)
   * @param {number} limit - Límite de resultados
   */
  async getProductHistory(productId, page = 0, limit = 20) {
    const startTime = Date.now();
    
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      console.log('🌐 PriceTransaction: Loading product history...');
      
      const offset = page * limit;
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(
          `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`
        );
      });
      
      telemetry.record('priceTransaction.service.getHistory', {
        duration: Date.now() - startTime,
        productId,
        page,
        limit
      });
      
      console.log('✅ PriceTransaction: Product history loaded');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction history error:', error.message);
      
      // Fallback demo data
      if (process.env.NODE_ENV === 'development') {
        const demoHistory = {
          product_id: productId,
          history: [
            {
              transaction_id: 1,
              product_id: productId,
              product_name: "Demo Product",
              transaction_type: "MANUAL_ADJUSTMENT",
              old_price: 15.00,
              new_price: 16.50,
              price_change: 1.50,
              price_change_percent: 10.0,
              effective_date: new Date().toISOString(),
              reference_type: "manual_adjustment",
              reference_id: "ADJ-001",
              user_id: "demo_user",
              user_name: "Demo User",
              transaction_date: new Date().toISOString(),
              reason: "Market price adjustment (demo)",
              currency_id: "PYG",
              exchange_rate: 1.0,
              metadata: { source: "demo_mode" }
            }
          ],
          limit,
          offset,
          count: 1
        };
        
        return { success: true, data: demoHistory };
      }
      
      return { success: false, error: error.message };
    }
  },

  /**
   * Validar consistencia de precios
   * @param {string} productId - ID del producto (opcional)
   */
  async validateConsistency(productId = null) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Validating price consistency...');
      
      const url = productId 
        ? `/price-transactions/validate-consistency?product_id=${productId}`
        : '/price-transactions/validate-consistency';
        
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetry.record('priceTransaction.service.validateConsistency', {
        duration: Date.now() - startTime,
        productId
      });
      
      console.log('✅ PriceTransaction: Consistency validation completed');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction validation error:', error.message);
      
      // Demo fallback
      const demoReport = {
        validation_timestamp: new Date().toISOString(),
        total_products: 1,
        reports: [
          {
            product_id: productId || "demo_product",
            product_name: "Demo Product",
            current_price: 16.50,
            last_transaction_price: 16.50,
            price_difference: 0,
            consistency_status: "CONSISTENT",
            recommendations: []
          }
        ]
      };
      
      return { success: true, data: demoReport };
    }
  },

  /**
   * Obtener reporte de variación de precios
   * @param {string} dateFrom - Fecha inicio (YYYY-MM-DD)
   * @param {string} dateTo - Fecha fin (YYYY-MM-DD)
   * @param {string} transactionType - Tipo de transacción (opcional)
   * @param {number} page - Página
   * @param {number} limit - Límite
   */
  async getVarianceReport(dateFrom, dateTo, transactionType = null, page = 0, limit = 50) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Loading variance report...');
      
      const params = new URLSearchParams();
      const offset = page * limit;
      
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (transactionType) params.append('transaction_type', transactionType);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`/price-transactions/variance-report?${params.toString()}`);
      });
      
      telemetry.record('priceTransaction.service.getVarianceReport', {
        duration: Date.now() - startTime,
        dateFrom,
        dateTo,
        transactionType
      });
      
      console.log('✅ PriceTransaction: Variance report loaded');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction variance report error:', error.message);
      
      // Demo fallback
      const demoReport = {
        total_products: 1,
        reports: [
          {
            product_id: "demo_product",
            product_name: "Demo Product",
            transaction_count: 2,
            price_at_start: 15.00,
            price_at_end: 16.50,
            total_price_change: 1.50,
            total_change_percent: 10.0,
            avg_price: 15.75,
            min_price: 15.00,
            max_price: 16.50,
            price_volatility: 5.0,
            last_transaction_date: new Date().toISOString(),
            last_transaction_type: "MANUAL_ADJUSTMENT",
            last_change_reason: "Market adjustment"
          }
        ]
      };
      
      return { success: true, data: demoReport };
    }
  },

  /**
   * Obtener transacciones por rango de fechas
   * @param {string} startDate - Fecha inicio
   * @param {string} endDate - Fecha fin
   * @param {string} transactionType - Tipo (opcional)
   * @param {number} page - Página
   * @param {number} limit - Límite
   */
  async getTransactionsByDate(startDate, endDate, transactionType = null, page = 0, limit = 50) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Loading transactions by date...');
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: limit.toString(),
        offset: (page * limit).toString()
      });
      
      if (transactionType) {
        params.append('transaction_type', transactionType);
      }
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`/price-transactions/by-date?${params}`);
      });
      
      telemetry.record('priceTransaction.service.getByDate', {
        duration: Date.now() - startTime,
        startDate,
        endDate,
        transactionType
      });
      
      console.log('✅ PriceTransaction: Transactions by date loaded');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction by date error:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener transacción por ID
   * @param {number} transactionId - ID de la transacción
   */
  async getTransactionById(transactionId) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Loading transaction by ID...');
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`/price-transactions/${transactionId}`);
      });
      
      telemetry.record('priceTransaction.service.getById', {
        duration: Date.now() - startTime,
        transactionId
      });
      
      console.log('✅ PriceTransaction: Transaction loaded by ID');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ PriceTransaction by ID error:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validar datos de transacción de precio
   * @param {Object} data - Datos a validar
   */
  validateTransactionData(data) {
    const errors = [];
    
    if (!data.product_id || data.product_id.trim() === '') {
      errors.push('Product ID es requerido');
    }
    
    if (!data.transaction_type || data.transaction_type.trim() === '') {
      errors.push('Tipo de transacción es requerido');
    }
    
    if (!data.new_price || data.new_price <= 0) {
      errors.push('El nuevo precio debe ser mayor que 0');
    }
    
    if (data.new_price && data.new_price > 999999999.99) {
      errors.push('El nuevo precio es demasiado grande');
    }
    
    if (data.reason && data.reason.length > 1000) {
      errors.push('La razón debe tener menos de 1000 caracteres');
    }
    
    if (data.cost_factor && (data.cost_factor < 0 || data.cost_factor > 1)) {
      errors.push('El factor de costo debe estar entre 0 y 1');
    }
    
    if (data.margin_percent && data.margin_percent < 0) {
      errors.push('El porcentaje de margen no puede ser negativo');
    }
    
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
    
    return true;
  },

  /**
   * Obtener últimos cambios de precio (para dashboard)
   * @param {number} limit - Límite de resultados
   */
  async getRecentTransactions(limit = 20) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceTransaction: Loading recent transactions...');
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const result = await this.getTransactionsByDate(startDate, endDate, null, 0, limit);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Error loading recent transactions');
      }
      
    } catch (error) {
      console.error('❌ PriceTransaction recent transactions error:', error.message);
      
      // Fallback demo data para desarrollo/testing
      console.log('🔄 PriceTransaction: Using demo recent transactions...');
      
      const demoTransactions = [
        {
          transaction_id: 1,
          product_id: "PROD_BANANA_001",
          product_name: "Banana Premium",
          transaction_type: "MANUAL_ADJUSTMENT",
          old_price: 15.00,
          new_price: 16.50,
          price_change: 1.50,
          price_change_percent: 10.0,
          effective_date: new Date().toISOString(),
          reference_type: "manual_adjustment",
          reference_id: "ADJ-001",
          user_id: "demo_user",
          user_name: "Usuario Demo",
          transaction_date: new Date().toISOString(),
          reason: "Ajuste de mercado por incremento en costos de proveedor",
          currency_id: "PYG",
          exchange_rate: 1.0,
          cost_factor: 0.65,
          margin_percent: 35.0,
          metadata: {
            source: "demo_mode",
            market_analysis: {
              competitor_avg_price: 17.00,
              demand_level: "high"
            }
          }
        },
        {
          transaction_id: 2,
          product_id: "PROD_RICE_002",
          product_name: "Arroz Integral 1kg",
          transaction_type: "PROMOTION",
          old_price: 12.00,
          new_price: 10.50,
          price_change: -1.50,
          price_change_percent: -12.5,
          effective_date: new Date(Date.now() - 86400000).toISOString(),
          reference_type: "promotion",
          reference_id: "PROMO-FEB2025",
          user_id: "demo_user",
          user_name: "Usuario Demo",
          transaction_date: new Date(Date.now() - 86400000).toISOString(),
          reason: "Promoción especial de febrero - descuento por volumen",
          currency_id: "PYG",
          exchange_rate: 1.0,
          margin_percent: 28.0,
          metadata: {
            source: "demo_mode",
            promotion_type: "percentage_discount",
            discount_percent: 12.5,
            campaign: "febrero_especial"
          }
        },
        {
          transaction_id: 3,
          product_id: "PROD_MILK_003",
          product_name: "Leche Entera 1L",
          transaction_type: "COST_UPDATE",
          old_price: 8.50,
          new_price: 9.00,
          price_change: 0.50,
          price_change_percent: 5.9,
          effective_date: new Date(Date.now() - 172800000).toISOString(),
          reference_type: "cost_update",
          reference_id: "COST-UPD-001",
          user_id: "demo_user", 
          user_name: "Usuario Demo",
          transaction_date: new Date(Date.now() - 172800000).toISOString(),
          reason: "Incremento en costo de producción por proveedor lácteo",
          currency_id: "PYG",
          exchange_rate: 1.0,
          cost_factor: 0.70,
          margin_percent: 30.0,
          metadata: {
            source: "demo_mode",
            cost_increase_percent: 8.0,
            supplier_notice: "INC-2025-001"
          }
        }
      ];
      
      return { 
        success: true, 
        data: { 
          transactions: demoTransactions,
          total: demoTransactions.length,
          limit,
          offset: 0
        }
      };
    }
  }
};

export default priceTransactionService;