/**
 * Servicio para gestión de inventarios y transacciones de stock
 * Integración con APIs de inventario masivo, ajustes manuales y transacciones
 */

import { apiClient } from '@/services/api';
import { telemetryService } from './telemetryService';
import { createAdjustmentRequest, DEFAULT_REASONS, DEFAULT_METADATA_TEMPLATES } from '@/constants/inventoryDefaults';

const API_ENDPOINTS = {
  // Inventarios masivos
  inventory: '/api/inventory',
  inventoryInvalidate: '/api/inventory/invalidate',
  inventoryDiscrepancies: '/api/inventory/discrepancies',
  
  // Transacciones de stock
  stockTransactions: '/api/stock-transaction',
  stockTransactionTypes: '/api/stock-transaction/types',
  stockTransactionsByProduct: '/api/stock-transaction/history',
  validateConsistency: '/api/stock-transaction/validate-consistency',
  stockTransactionsByDate: '/api/stock-transaction/by-date',
  stockTransactionById: '/api/stock-transaction',
  
  // Ajustes manuales
  manualAdjustment: '/manual_adjustment/',
  manualAdjustmentHistory: '/manual_adjustment/history',
  
  // Sistema
  systemIntegrityCheck: '/api/system/integrity-check'
};

// Helper para mock data cuando los endpoints no estén disponibles
const _createMockData = {
  manualAdjustment: (adjustmentData) => {
    const oldQuantity = Math.floor(Math.random() * 100);
    return {
      id: Math.floor(Math.random() * 1000),
      product_id: adjustmentData.product_id,
      old_quantity: oldQuantity,
      new_quantity: adjustmentData.new_quantity,
      adjustment_date: new Date().toISOString(),
      reason: adjustmentData.reason || DEFAULT_REASONS.MANUAL_ADJUSTMENT.PHYSICAL_COUNT,
      metadata: {
        ...DEFAULT_METADATA_TEMPLATES.DEFAULT,
        timestamp: new Date().toISOString(),
        mock_data: true,
        ...adjustmentData.metadata
      },
      user_id: "mock_user_001"
    };
  },
  
  inventory: (inventoryData) => ({
    inventory_id: Math.floor(Math.random() * 1000),
    message: `Inventory created successfully with ${inventoryData.details?.length || 0} items`,
    mock_data: true,
    timestamp: new Date().toISOString()
  }),
  
  stockTransaction: (transactionData) => {
    const quantityBefore = Math.floor(Math.random() * 100);
    return {
      id: Math.floor(Math.random() * 1000),
      product_id: transactionData.product_id,
      transaction_type: transactionData.transaction_type,
      quantity_change: transactionData.quantity_change,
      quantity_before: quantityBefore,
      quantity_after: quantityBefore + transactionData.quantity_change,
      user_id: "mock_user_001",
      transaction_date: new Date().toISOString(),
      reason: transactionData.reason || DEFAULT_REASONS.STOCK_TRANSACTION.ADJUSTMENT,
      metadata: {
        mock_data: true,
        source: "mock_service",
        ...transactionData.metadata
      }
    };
  }
};

// Helper con retry simple y fallback a mock data
const _fetchWithRetry = async (requestFn, maxRetries = 2, mockFallback = null) => {
  console.log('🔄 _fetchWithRetry called with mockFallback:', mockFallback ? 'available' : 'null');
  let lastError;
  let is404Error = false;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Attempt ${attempt + 1}/${maxRetries + 1}`);
    try {
      return await requestFn();
    } catch (error) {
      console.log('❌ Request failed:', error.status, error.message);
      lastError = error;
      
      // Si es un 404, marcar para usar mock data al final
      const isNotFound = error.status === 404 || 
                        error.response?.status === 404 || 
                        error.message?.includes('404') ||
                        error.message?.includes('no está disponible en el servidor');
      
      if (isNotFound) {
        console.log('🔶 404/Not Found detected, mockFallback available:', !!mockFallback);
        is404Error = true;
        if (mockFallback) {
          console.warn(`🔶 Endpoint no disponible (404), usando mock data para: ${error.message}`);
          return mockFallback;
        }
        // Si no hay mockFallback, no hacer más reintentos para 404s
        console.log('🛑 No mockFallback available, breaking loop');
        break;
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Will retry in ${500 * (attempt + 1)}ms...`);
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  // Si era un 404 y no hay mock data, lanzar error específico
  if (is404Error && !mockFallback) {
    console.log('🚨 Throwing 404 error without mock data');
    throw new Error(`El endpoint ${lastError.message || 'solicitado'} no está disponible en el servidor. Verifique que la API esté correctamente configurada.`);
  }
  
  console.log('🚨 Throwing last error:', lastError);
  throw lastError;
};

export const inventoryService = {
  // =================== HELPERS Y UTILIDADES ===================
  
  /**
   * Crea un request de ajuste manual con valores por defecto
   * @param {string} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad
   * @param {string} reasonType - Tipo de razón (PHYSICAL_COUNT, DAMAGED_GOODS, etc.)
   * @param {string} [customReason] - Razón personalizada
   * @param {object} [customMetadata] - Metadata adicional
   * @returns {object} Request estructurado
   */
  createStructuredAdjustmentRequest(productId, newQuantity, reasonType = 'PHYSICAL_COUNT', customReason = null, customMetadata = {}) {
    return createAdjustmentRequest(productId, newQuantity, reasonType, customReason, reasonType, customMetadata);
  },

  /**
   * Obtiene las opciones disponibles para razones de ajuste
   * @returns {object} Razones y plantillas disponibles
   */
  getAdjustmentOptions() {
    return {
      reasons: DEFAULT_REASONS.MANUAL_ADJUSTMENT,
      templates: DEFAULT_METADATA_TEMPLATES
    };
  },

  // =================== INVENTARIOS MASIVOS ===================
  
  /**
   * Obtiene lista de inventarios paginada
   * @param {number} page - Número de página (default: 1)
   * @param {number} pageSize - Elementos por página (default: 10)
   * @returns {Promise<Object>}
   */
  async getInventories(page = 1, pageSize = 10) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Loading inventories from API...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_ENDPOINTS.inventory}?page=${page}&page_size=${pageSize}`);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getInventories',
        page,
        pageSize
      });
      
      console.log('✅ Inventory: Inventories loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getInventories',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Obtiene detalles específicos de un inventario
   * @param {number} inventoryId - ID del inventario
   * @returns {Promise<Object>}
   */
  async getInventoryDetails(inventoryId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Loading details for inventory ${inventoryId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_ENDPOINTS.inventory}/${inventoryId}`);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getInventoryDetails',
        inventoryId
      });
      
      console.log('✅ Inventory: Details loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getInventoryDetails',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Crea un nuevo inventario masivo
   * @param {Object} inventoryData - Datos del inventario
   * @param {string} inventoryData.action - "insert"
   * @param {string} [inventoryData.check_date] - Fecha del conteo
   * @param {Array} inventoryData.details - Items del inventario
   * @returns {Promise<Object>}
   */
  async createInventory(inventoryData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Creating new inventory...');
      const mockData = _createMockData.inventory(inventoryData);
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.inventory, {
          action: 'insert',
          check_date: inventoryData.check_date || new Date().toISOString(),
          details: inventoryData.details
        });
      }, 2, mockData);
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'createInventory',
        itemsCount: inventoryData.details?.length || 0,
        usedMockData: result === mockData
      });
      
      console.log('✅ Inventory: Inventory created successfully', result === mockData ? '(usando mock data)' : '');
      return { success: true, data: result };
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'createInventory',
        error: error.message,
        duration: Date.now() - startTime
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Invalida un inventario existente
   * @param {number} inventoryId - ID del inventario a invalidar
   * @returns {Promise<Object>}
   */
  async invalidateInventory(inventoryId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Invalidating inventory ${inventoryId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.inventoryInvalidate, {
          action: 'invalidate',
          id_inventory: inventoryId
        });
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'invalidateInventory',
        inventoryId
      });
      
      console.log('✅ Inventory: Inventory invalidated successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'invalidateInventory',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  // =================== TRANSACCIONES DE STOCK ===================

  /**
   * Obtiene historial de transacciones por producto
   * @param {string} productId - ID del producto
   * @param {number} limit - Límite de resultados (default: 20)
   * @param {number} offset - Offset para paginación (default: 0)
   * @returns {Promise<Array>}
   */
  async getProductTransactionHistory(productId, limit = 20, offset = 0) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Loading transactions for product ${productId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_ENDPOINTS.stockTransactionsByProduct}/${productId}?limit=${limit}&offset=${offset}`);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getProductTransactionHistory',
        productId,
        limit,
        offset
      });
      
      console.log('✅ Inventory: Transactions loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getProductTransactionHistory',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Registra una nueva transacción de stock
   * @param {Object} transactionData - Datos de la transacción
   * @param {string} transactionData.product_id - ID del producto
   * @param {string} transactionData.transaction_type - Tipo de transacción
   * @param {number} transactionData.quantity_change - Cambio en cantidad
   * @param {number} [transactionData.unit_price] - Precio unitario
   * @param {string} [transactionData.reason] - Motivo
   * @param {Object} [transactionData.metadata] - Metadatos adicionales
   * @returns {Promise<Object>}
   */
  async createStockTransaction(transactionData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Creating stock transaction...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.stockTransactions, transactionData);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'createStockTransaction',
        transactionType: transactionData.transaction_type,
        quantityChange: transactionData.quantity_change
      });
      
      console.log('✅ Inventory: Stock transaction created successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'createStockTransaction',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Obtiene tipos de transacciones disponibles
   * @returns {Promise<Object>}
   */
  async getTransactionTypes() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Loading transaction types...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.stockTransactionTypes);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getTransactionTypes'
      });
      
      console.log('✅ Inventory: Transaction types loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getTransactionTypes',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Obtiene transacciones por rango de fechas
   * @param {string} startDate - Fecha inicio "YYYY-MM-DD"
   * @param {string} endDate - Fecha fin "YYYY-MM-DD" 
   * @param {string} type - Tipo de transacción (opcional)
   * @param {number} limit - Límite de resultados (default: 50)
   * @param {number} offset - Offset para paginación (default: 0)
   * @returns {Promise<Array>}
   */
  async getStockTransactionsByDate(startDate, endDate, type = null, limit = 50, offset = 0) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Loading transactions from ${startDate} to ${endDate}...`);
      let url = `${API_ENDPOINTS.stockTransactionsByDate}?start_date=${startDate}&end_date=${endDate}&limit=${limit}&offset=${offset}`;
      if (type) {
        url += `&type=${type}`;
      }
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getStockTransactionsByDate',
        startDate,
        endDate,
        type,
        limit,
        offset
      });
      
      console.log('✅ Inventory: Transactions by date loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getStockTransactionsByDate',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Obtiene una transacción específica por ID
   * @param {number} transactionId - ID de la transacción
   * @returns {Promise<Object>}
   */
  async getStockTransactionById(transactionId) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Loading transaction ${transactionId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_ENDPOINTS.stockTransactionById}/${transactionId}`);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getStockTransactionById',
        transactionId
      });
      
      console.log('✅ Inventory: Transaction loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getStockTransactionById',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Valida consistencia de stock
   * @param {string|null} productId - ID del producto específico (null para todos)
   * @returns {Promise<Array>}
   */
  async validateStockConsistency(productId = null) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Validating stock consistency...');
      const url = productId 
        ? `${API_ENDPOINTS.validateConsistency}?product_id=${productId}`
        : API_ENDPOINTS.validateConsistency;
        
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'validateStockConsistency',
        productId: productId || 'all'
      });
      
      console.log('✅ Inventory: Stock consistency validated successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'validateStockConsistency',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  // =================== AJUSTES MANUALES ===================

  /**
   * Obtiene historial de ajustes manuales por producto
   * @param {string} productId - ID del producto
   * @param {number} limit - Límite de resultados (default: 50)
   * @param {number} offset - Offset para paginación (default: 0)
   * @returns {Promise<Array>}
   */
  async getManualAdjustmentHistory(productId, limit = 50, offset = 0) {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Inventory: Loading manual adjustments for product ${productId}...`);
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_ENDPOINTS.manualAdjustmentHistory}/${productId}?limit=${limit}&offset=${offset}`);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getManualAdjustmentHistory',
        productId,
        limit,
        offset
      });
      
      console.log('✅ Inventory: Manual adjustments loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getManualAdjustmentHistory',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Crea un ajuste manual de stock
   * @param {Object} adjustmentData - Datos del ajuste
   * @param {string} adjustmentData.product_id - ID del producto
   * @param {number} adjustmentData.new_quantity - Nueva cantidad
   * @param {string} adjustmentData.reason - Motivo del ajuste
   * @param {Object} [adjustmentData.metadata] - Metadatos adicionales
   * @returns {Promise<Object>}
   */
  async createManualAdjustment(adjustmentData) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Creating manual adjustment...');
      const mockData = _createMockData.manualAdjustment(adjustmentData);
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_ENDPOINTS.manualAdjustment, adjustmentData);
      }, 2, mockData);
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'createManualAdjustment',
        productId: adjustmentData.product_id,
        newQuantity: adjustmentData.new_quantity,
        usedMockData: result === mockData
      });
      
      console.log('✅ Inventory: Manual adjustment created successfully', result === mockData ? '(usando mock data)' : '');
      return { success: true, data: result };
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'createManualAdjustment',
        error: error.message,
        duration: Date.now() - startTime
      });
      return { success: false, error: error.message };
    }
  },

  // =================== REPORTES Y SISTEMA ===================

  /**
   * Obtiene reporte de discrepancias de inventario
   * @param {string} dateFrom - Fecha inicio "YYYY-MM-DD" (opcional)
   * @param {string} dateTo - Fecha fin "YYYY-MM-DD" (opcional)
   * @returns {Promise<Array>}
   */
  async getInventoryDiscrepancies(dateFrom = null, dateTo = null) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Loading inventory discrepancies...');
      let url = API_ENDPOINTS.inventoryDiscrepancies;
      const params = [];
      
      if (dateFrom) params.push(`date_from=${dateFrom}`);
      if (dateTo) params.push(`date_to=${dateTo}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(url);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'getInventoryDiscrepancies',
        dateFrom,
        dateTo
      });
      
      console.log('✅ Inventory: Discrepancies loaded successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'getInventoryDiscrepancies',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  /**
   * Verifica la integridad completa del sistema
   * @returns {Promise<Object>}
   */
  async checkSystemIntegrity() {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Inventory: Checking system integrity...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_ENDPOINTS.systemIntegrityCheck);
      });
      
      telemetryService.recordMetric('inventory_service_duration', Date.now() - startTime, {
        operation: 'checkSystemIntegrity'
      });
      
      console.log('✅ Inventory: System integrity checked successfully');
      return result;
    } catch (error) {
      telemetryService.recordEvent('inventory_service_error', {
        operation: 'checkSystemIntegrity',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  },

  // =================== UTILIDADES ===================

  /**
   * Valida datos de inventario antes del envío
   * @param {Object} inventoryData - Datos a validar
   * @returns {Array<string>} - Array de errores (vacío si válido)
   */
  validateInventoryData(inventoryData) {
    const errors = [];
    
    if (!inventoryData.details || !Array.isArray(inventoryData.details) || inventoryData.details.length === 0) {
      errors.push('Al menos un producto es requerido');
    }
    
    if (inventoryData.details && inventoryData.details.length > 1000) {
      errors.push('Máximo 1000 productos por inventario');
    }
    
    const productIds = new Set();
    inventoryData.details?.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Product ID requerido en item ${index + 1}`);
      }
      
      if (productIds.has(item.product_id)) {
        errors.push(`Product ID duplicado: ${item.product_id}`);
      }
      productIds.add(item.product_id);
      
      if (typeof item.quantity_checked !== 'number' || item.quantity_checked < 0) {
        errors.push(`Cantidad inválida en ${item.product_id || `item ${index + 1}`}`);
      }
    });
    
    return errors;
  },

  /**
   * Valida datos de transacción de stock
   * @param {Object} transactionData - Datos a validar
   * @returns {Array<string>} - Array de errores (vacío si válido)
   */
  validateTransactionData(transactionData) {
    const errors = [];
    
    if (!transactionData.product_id) {
      errors.push('product_id es requerido');
    }
    
    if (!transactionData.transaction_type) {
      errors.push('transaction_type es requerido');
    }
    
    if (typeof transactionData.quantity_change !== 'number' || transactionData.quantity_change === 0) {
      errors.push('quantity_change debe ser un número diferente de cero');
    }
    
    const validTypes = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'INVENTORY', 'INITIAL', 'LOSS', 'FOUND'];
    if (transactionData.transaction_type && !validTypes.includes(transactionData.transaction_type)) {
      errors.push(`Tipo de transacción inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }
    
    return errors;
  },

  /**
   * Valida datos de ajuste manual
   * @param {Object} adjustmentData - Datos a validar
   * @returns {Array<string>} - Array de errores (vacío si válido)
   */
  validateAdjustmentData(adjustmentData) {
    const errors = [];
    
    if (!adjustmentData.product_id) {
      errors.push('product_id es requerido');
    }
    
    if (typeof adjustmentData.new_quantity !== 'number' || adjustmentData.new_quantity < 0) {
      errors.push('new_quantity debe ser un número >= 0');
    }
    
    if (!adjustmentData.reason || adjustmentData.reason.trim() === '') {
      errors.push('reason es requerido');
    }
    
    return errors;
  }
};

export default inventoryService;