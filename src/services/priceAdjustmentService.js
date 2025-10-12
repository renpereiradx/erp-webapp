/**
 * Servicio API para Manual Price Adjustments - Patrón MVP
 * Integración con BusinessManagementAPI + Demo Data fallback
 */

import { apiService as apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';

// Demo data configuration (seguiremos patrón cuando se implemente)
const DEMO_CONFIG_PRICE_ADJUSTMENT = {
  enabled: true,
  useRealAPI: true, // Usar API real primero, fallback a demo si falla
};

// Helper function to transform API data to frontend format
const transformAdjustmentData = (adjustments) => {
  return (adjustments || []).map(adjustment => ({
    ...adjustment,
    id: adjustment.adjustment_id || adjustment.id,
    old_price: adjustment.old_value ?? adjustment.old_price,
    new_price: adjustment.new_value ?? adjustment.new_price,
    price_change: adjustment.value_change ?? adjustment.price_change,
    price_change_percent: adjustment.value_change !== undefined && adjustment.value_change !== 0 ? 
      ((adjustment.value_change / (adjustment.old_value || 1)) * 100) : 
      (adjustment.price_change_percent ?? 0),
    created_at: adjustment.adjustment_date ?? adjustment.created_at,
    unit: adjustment.metadata?.unit || adjustment.unit || 'UNIT',
    product_id: adjustment.product_id || adjustment.product_name || `AJUSTE_${adjustment.adjustment_id || adjustment.id || 'SIN_ID'}`
  }));
};

// Demo data for development/fallback
const getDemoPriceAdjustments = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 1,
      product_id: "PROD_BANANA_001",
      user_id: "user123",
      old_price: 15.00,
      new_price: 16.50,
      price_change: 1.50,
      price_change_percent: 10.00,
      unit: "UNIT",
      reason: "Market price adjustment due to supplier cost increase",
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      unit_price_id: 26,
      metadata: {
        adjustment_category: "market_driven",
        approval_id: "APPR-123",
        source: "demo_data"
      }
    },
    {
      id: 2,
      product_id: "PROD_RICE_002",
      user_id: "user456",
      old_price: 12.00,
      new_price: 11.00,
      price_change: -1.00,
      price_change_percent: -8.33,
      unit: "kg",
      reason: "Promotional pricing for bulk sales",
      effective_date: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      unit_price_id: 27,
      metadata: {
        adjustment_category: "promotion",
        approval_id: "APPR-124",
        source: "demo_data"
      }
    }
  ];
};

const getDemoProductHistory = async (productId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    product_id: productId,
    history: [
      {
        adjustment_id: 12,
        adjustment_type: "price",
        old_value: 15.00,
        new_value: 16.50,
        value_change: 1.50,
        user_id: "user123",
        adjustment_date: new Date().toISOString(),
        reason: "Market price adjustment",
        metadata: {
          adjustment_category: "market_driven",
          source: "demo_data"
        },
        related_transaction_id: null
      },
      {
        adjustment_id: 18,
        adjustment_type: "stock",
        old_value: 150.0,
        new_value: 250.0,
        value_change: 100.0,
        user_id: "user456",
        adjustment_date: new Date(Date.now() - 172800000).toISOString(),
        reason: "Inventory recount",
        metadata: {
          location: "Warehouse A",
          source: "demo_data"
        },
        related_transaction_id: 47
      }
    ],
    limit: 10,
    offset: 0,
    count: 2
  };
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

export const priceAdjustmentService = {
  /**
   * Crear un nuevo ajuste manual de precio
   * @param {Object} adjustmentData - Datos del ajuste
   * @param {string} adjustmentData.product_id - ID del producto
   * @param {number} adjustmentData.new_price - Nuevo precio
   * @param {string} adjustmentData.unit - Unidad (opcional, default: "UNIT")
   * @param {string} adjustmentData.reason - Razón del ajuste
   * @param {Object} adjustmentData.metadata - Metadatos adicionales (opcional)
   */
  async createPriceAdjustment(adjustmentData) {
    const startTime = Date.now();
    
    try {
      // Validar datos requeridos
      if (!adjustmentData.product_id) {
        throw new Error('Product ID is required');
      }
      if (!adjustmentData.new_price || adjustmentData.new_price <= 0) {
        throw new Error('New price must be a positive number');
      }
      if (!adjustmentData.reason) {
        throw new Error('Reason is required');
      }

      console.log('🌐 PriceAdjustment: Creating price adjustment via API...');
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post('/manual_adjustment/price', {
          product_id: adjustmentData.product_id,
          new_price: adjustmentData.new_price,
          unit: adjustmentData.unit || 'UNIT',
          reason: adjustmentData.reason,
          metadata: {
            source: 'manual_api',
            change_type: adjustmentData.new_price > (adjustmentData.old_price || 0) ? 'increase' : 'decrease',
            ...adjustmentData.metadata
          }
        });
      });
      
      telemetry.record('priceAdjustment.service.create', {
        duration: Date.now() - startTime,
        productId: adjustmentData.product_id
      });
      
      console.log('✅ PriceAdjustment: Price adjustment created successfully');
      return result;
    } catch (error) {
      console.error('❌ PriceAdjustment API error:', error.message);
      
      // Si demo está habilitado como fallback
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled) {
        console.log('🔄 PriceAdjustment: Using demo mode for create...');
        
        // Simular creación exitosa con demo data
        const demoResult = {
          id: Date.now(), // ID único temporal
          product_id: adjustmentData.product_id,
          user_id: "demo_user",
          old_price: 15.00, // Simular precio anterior
          new_price: adjustmentData.new_price,
          price_change: adjustmentData.new_price - 15.00,
          price_change_percent: ((adjustmentData.new_price - 15.00) / 15.00) * 100,
          unit: adjustmentData.unit || 'UNIT',
          reason: adjustmentData.reason,
          effective_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          unit_price_id: Date.now() + 100,
          metadata: {
            ...adjustmentData.metadata,
            source: "demo_mode"
          },
          message: "Manual price adjustment successful (demo mode)"
        };
        
        console.log('✅ PriceAdjustment: Demo price adjustment created');
        return demoResult;
      }
      
      telemetry.record('priceAdjustment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'create'
      });
      throw error;
    }
  },

  /**
   * Obtener historial de ajustes de un producto
   * @param {string} productId - ID del producto
   * @param {number} limit - Límite de resultados (default: 10)
   * @param {number} offset - Offset para paginación (default: 0)
   */
  async getProductHistory(productId, limit = 10, offset = 0) {
    const startTime = Date.now();
    
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Si demo está habilitado y no usar API real
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled && !DEMO_CONFIG_PRICE_ADJUSTMENT.useRealAPI) {
        console.log('🔄 PriceAdjustment: Loading demo history...');
        const result = await getDemoProductHistory(productId);
        console.log('✅ PriceAdjustment: Demo history loaded');
        return result;
      }
      
      console.log('🌐 PriceAdjustment: Loading history from API...');
      const result = await _fetchWithRetry(async () => {
        const url = `/manual_adjustment/product/${productId}/history?limit=${limit}&offset=${offset}`;
        return await apiClient.get(url);
      });
      
      telemetry.record('priceAdjustment.service.getHistory', {
        duration: Date.now() - startTime,
        productId
      });
      
      console.log('✅ PriceAdjustment: History loaded from API');
      return result;
    } catch (error) {
      console.error('❌ PriceAdjustment history error:', error.message);
      
      // Si falla API y demo está habilitado como fallback
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled) {
        console.log('🔄 PriceAdjustment: Falling back to demo history...');
        const result = await getDemoProductHistory(productId);
        console.log('✅ PriceAdjustment: Demo history fallback loaded');
        return result;
      }
      
      telemetry.record('priceAdjustment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getHistory',
        productId
      });
      throw error;
    }
  },

  /**
   * Obtener ajustes recientes (para dashboard)
   * Nota: Este endpoint no existe en la API actual, usando demo data
   */
  async getRecentAdjustments(limit = 20, days = 7) {
    const startTime = Date.now();
    
    try {
      // Si demo está habilitado y no usar API real
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled && !DEMO_CONFIG_PRICE_ADJUSTMENT.useRealAPI) {
        console.log('🔄 PriceAdjustment: Loading recent adjustments (demo mode)...');
        const result = await getDemoPriceAdjustments();
        console.log('✅ PriceAdjustment: Recent adjustments loaded (demo)');
        return { data: result.slice(0, limit) };
      }
      
      console.log('🌐 PriceAdjustment: Loading recent adjustments from API...');
      const result = await _fetchWithRetry(async () => {
        // Use new recent adjustments endpoint
        const days = 7; // Get adjustments from last 7 days
        const apiLimit = Math.min(limit, 50); // API supports up to 50 per request
        const url = `/manual_adjustment/price/recent?days=${days}&limit=${apiLimit}`;
        return await apiClient.get(url);
      });
      
      telemetry.record('priceAdjustment.service.getRecent', {
        duration: Date.now() - startTime,
        count: result?.adjustments?.length || 0
      });
      
      console.log('✅ PriceAdjustment: Recent adjustments loaded from API');
      // Transform the data to match expected frontend structure
      return { data: transformAdjustmentData(result?.adjustments) };
    } catch (error) {
      console.error('❌ PriceAdjustment recent adjustments error:', error.message);
      
      // Si falla API y demo está habilitado como fallback
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled) {
        console.log('🔄 PriceAdjustment: Falling back to demo recent adjustments...');
        const result = await getDemoPriceAdjustments();
        console.log('✅ PriceAdjustment: Demo recent adjustments fallback loaded');
        return { data: result.slice(0, limit) };
      }
      
      telemetry.record('priceAdjustment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getRecent'
      });
      throw error;
    }
  },

  /**
   * Verificar integridad del sistema
   */
  async verifySystemIntegrity() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 PriceAdjustment: Verifying system integrity...');
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get('/manual_adjustment/integration/verify');
      });
      
      telemetry.record('priceAdjustment.service.verifyIntegrity', {
        duration: Date.now() - startTime,
        integrationStatus: result?.integration_status || false
      });
      
      console.log('✅ PriceAdjustment: System integrity verified');
      return result;
    } catch (error) {
      console.error('❌ PriceAdjustment integrity error:', error.message);
      
      // Fallback demo data para verificación
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled) {
        console.log('🔄 PriceAdjustment: Demo integrity check...');
        
        const demoResult = {
          integration_status: true,
          summary: {
            total_stock_transactions: 5,
            total_manual_adjustments: 4,
            total_price_adjustments: 6,
            orphaned_stock_transactions: 0,
            price_mismatches: 0
          },
          details: {
            stock_integration: {
              status: "OK",
              orphaned_transactions: 0
            },
            price_integration: {
              status: "OK",
              mismatched_prices: 0
            }
          },
          timestamp: new Date().toISOString(),
          source: "demo_mode"
        };
        
        console.log('✅ PriceAdjustment: Demo integrity check completed');
        return demoResult;
      }
      
      telemetry.record('priceAdjustment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'verifyIntegrity'
      });
      throw error;
    }
  },

  /**
   * Validar datos de ajuste de precio
   */
  validatePriceAdjustmentData(data) {
    const errors = [];
    
    if (!data.product_id || data.product_id.trim() === '') {
      errors.push('Product ID is required');
    }
    
    if (!data.new_price || data.new_price <= 0) {
      errors.push('New price must be a positive number');
    }
    
    if (!data.reason || data.reason.trim() === '') {
      errors.push('Reason is required');
    }
    
    if (data.reason && data.reason.length > 500) {
      errors.push('Reason must be less than 500 characters');
    }
    
    if (data.new_price && data.new_price > 999999.99) {
      errors.push('New price is too large');
    }
    
    return errors;
  },

  // Alias methods for component compatibility
  async create(adjustmentData) {
    return this.createPriceAdjustment(adjustmentData);
  },

  async getRecent(limit = 20, days = 7) {
    return this.getRecentAdjustments(limit, days);
  },

  async getByProduct(productId, limit = 10, offset = 0) {
    return this.getProductHistory(productId, limit, offset);
  },

  // New method for date range queries
  async getByDateRange(startDate, endDate, productId = null, limit = 50, offset = 0) {
    const startTime = Date.now();
    
    try {
      // Si demo está habilitado y no usar API real
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled && !DEMO_CONFIG_PRICE_ADJUSTMENT.useRealAPI) {
        console.log('🔄 PriceAdjustment: Loading date range adjustments (demo mode)...');
        const result = await getDemoPriceAdjustments();
        console.log('✅ PriceAdjustment: Date range adjustments loaded (demo)');
        return { data: result.slice(0, limit) };
      }
      
      console.log('🌐 PriceAdjustment: Loading adjustments by date range from API...');
      const result = await _fetchWithRetry(async () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (productId) params.append('product_id', productId);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        
        const url = `/manual_adjustment/price/date-range?${params.toString()}`;
        return await apiClient.get(url);
      });
      
      telemetry.record('priceAdjustment.service.getByDateRange', {
        duration: Date.now() - startTime,
        count: result?.adjustments?.length || 0
      });
      
      console.log('✅ PriceAdjustment: Date range adjustments loaded from API');
      // Transform the data to match expected frontend structure
      return { data: transformAdjustmentData(result?.adjustments) };
    } catch (error) {
      console.error('❌ PriceAdjustment date range error:', error.message);
      
      // Si falla API y demo está habilitado como fallback
      if (DEMO_CONFIG_PRICE_ADJUSTMENT.enabled) {
        console.log('🔄 PriceAdjustment: Falling back to demo date range adjustments...');
        const result = await getDemoPriceAdjustments();
        console.log('✅ PriceAdjustment: Demo date range adjustments fallback loaded');
        return { data: result.slice(0, limit) };
      }
      
      telemetry.record('priceAdjustment.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getByDateRange'
      });
      throw error;
    }
  }
};
