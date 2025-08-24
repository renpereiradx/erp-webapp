/**
 * Core Sales Service - Enterprise Grade
 * Unified sales processing with complete API integration
 * 
 * Features:
 * - Unified sales processing (with/without reservations)
 * - Complete error categorization and recovery
 * - Circuit breaker and retry patterns
 * - Comprehensive telemetry integration
 * - Enterprise security and validation
 * 
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { apiClient } from './api';
import { telemetry } from '@/utils/telemetry';
import { circuitBreaker } from '@/utils/circuitBreaker';
import { retryWithBackoff } from '@/utils/retry';

/**
 * @typedef {Object} ProductDetail
 * @property {string} product_id - ID del producto
 * @property {number} quantity - Cantidad (acepta decimales)
 * @property {number} [tax_rate_id] - ID de tasa de impuesto
 * @property {number} [sale_price] - Precio modificado (opcional)
 * @property {string} [price_change_reason] - Razón del cambio de precio
 */

/**
 * @typedef {Object} ProcessSaleRequest
 * @property {string} [sale_id] - ID de venta (opcional, se genera automáticamente)
 * @property {string} client_id - ID del cliente
 * @property {ProductDetail[]} product_details - Detalles de productos
 * @property {number} [payment_method_id] - Método de pago (opcional)
 * @property {number} [currency_id] - Moneda (opcional)
 * @property {boolean} allow_price_modifications - Permitir modificaciones de precio
 * @property {number} [reserve_id] - ID de reserva (opcional para ventas con reserva)
 */

/**
 * @typedef {Object} ProcessSaleResponse
 * @property {boolean} success
 * @property {string} sale_id
 * @property {number} total_amount
 * @property {number} items_processed
 * @property {boolean} price_modifications_enabled
 * @property {boolean} has_price_changes
 * @property {string} message
 * @property {string} [error]
 */

/**
 * @typedef {Object} SaleDetails
 * @property {string} id
 * @property {string} client_id
 * @property {string} client_name
 * @property {string} sale_date
 * @property {number} total_amount
 * @property {string} status
 * @property {string} user_id
 * @property {string} user_name
 * @property {number} [payment_method_id]
 * @property {string} [payment_method]
 * @property {number} [currency_id]
 * @property {string} [currency]
 * @property {SaleItemDetail[]} details
 */

/**
 * @typedef {Object} SaleItemDetail
 * @property {number} id
 * @property {string} order_id
 * @property {string} product_id
 * @property {string} product_name
 * @property {number} quantity
 * @property {number} base_price
 * @property {number} unit_price
 * @property {number} subtotal
 * @property {number} tax_amount
 * @property {number} total_with_tax
 * @property {boolean} price_modified
 * @property {number} reserve_id
 * @property {number} tax_rate_id
 * @property {number} tax_rate
 */

/**
 * @typedef {Object} SalesListResponse
 * @property {SaleDetails[]} sales
 * @property {number} total_count
 * @property {number} page
 * @property {number} page_size
 * @property {number} total_pages
 */

/**
 * @typedef {Object} PriceChangeReport
 * @property {string} product_id
 * @property {string} product_name
 * @property {number} original_price
 * @property {number} modified_price
 * @property {number} price_difference
 * @property {number} percentage_change
 * @property {string} user_id
 * @property {string} reason
 * @property {string} timestamp
 * @property {string} change_id
 */

// Error categorization system
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  NETWORK: 'network',
  SYSTEM: 'system',
  AUTHORIZATION: 'authorization'
};

const ERROR_CODES = {
  // Sales errors
  INVALID_PRODUCT_ID: 'INVALID_PRODUCT_ID',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  PRICE_MODIFICATION_NOT_ALLOWED: 'PRICE_MODIFICATION_NOT_ALLOWED',
  RESERVE_NOT_FOUND: 'RESERVE_NOT_FOUND',
  RESERVE_ALREADY_USED: 'RESERVE_ALREADY_USED',
  SALE_NOT_FOUND: 'SALE_NOT_FOUND',
  ALREADY_CANCELLED: 'ALREADY_CANCELLED',
  
  // System errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Categoriza errores según su tipo y proporciona información de recuperación
 */
const categorizeError = (error, context = '') => {
  const errorCode = error.error_code || error.code;
  const httpStatus = error.status || error.response?.status;
  
  let category = ERROR_CATEGORIES.SYSTEM;
  let recoverable = false;
  let retryable = false;
  let userMessage = '';
  let technicalMessage = error.message || 'Unknown error';
  let suggestedAction = '';

  // Categorización por código de error
  switch (errorCode) {
    case ERROR_CODES.INVALID_PRODUCT_ID:
      category = ERROR_CATEGORIES.VALIDATION;
      userMessage = 'Uno o más productos seleccionados no son válidos.';
      suggestedAction = 'Verifique los productos seleccionados y vuelva a intentar.';
      break;
      
    case ERROR_CODES.INSUFFICIENT_STOCK:
      category = ERROR_CATEGORIES.BUSINESS_LOGIC;
      userMessage = 'Stock insuficiente para uno o más productos.';
      suggestedAction = 'Reduzca la cantidad o seleccione otros productos.';
      break;
      
    case ERROR_CODES.INVALID_CLIENT_ID:
      category = ERROR_CATEGORIES.VALIDATION;
      userMessage = 'El cliente seleccionado no es válido.';
      suggestedAction = 'Seleccione un cliente válido de la lista.';
      break;
      
    case ERROR_CODES.PRICE_MODIFICATION_NOT_ALLOWED:
      category = ERROR_CATEGORIES.AUTHORIZATION;
      userMessage = 'No tiene permisos para modificar precios.';
      suggestedAction = 'Contacte a un supervisor para autorizar cambios de precio.';
      break;
      
    case ERROR_CODES.RESERVE_NOT_FOUND:
      category = ERROR_CATEGORIES.VALIDATION;
      userMessage = 'La reserva especificada no existe.';
      suggestedAction = 'Verifique el ID de reserva o procese como venta normal.';
      break;
      
    case ERROR_CODES.RESERVE_ALREADY_USED:
      category = ERROR_CATEGORIES.BUSINESS_LOGIC;
      userMessage = 'La reserva ya ha sido utilizada en otra venta.';
      suggestedAction = 'Procese como venta normal o seleccione otra reserva.';
      break;
  }

  // Categorización por código HTTP
  if (httpStatus) {
    switch (true) {
      case httpStatus === 401:
        category = ERROR_CATEGORIES.AUTHORIZATION;
        userMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
        suggestedAction = 'Redirigir al login';
        break;
        
      case httpStatus === 403:
        category = ERROR_CATEGORIES.AUTHORIZATION;
        userMessage = 'No tiene permisos para realizar esta acción.';
        break;
        
      case httpStatus === 429:
        category = ERROR_CATEGORIES.NETWORK;
        userMessage = 'Demasiadas solicitudes. Por favor, espere un momento.';
        retryable = true;
        break;
        
      case httpStatus >= 500:
        category = ERROR_CATEGORIES.SYSTEM;
        userMessage = 'Error del servidor. Por favor, intente más tarde.';
        retryable = true;
        break;
        
      case httpStatus >= 400 && httpStatus < 500:
        category = ERROR_CATEGORIES.VALIDATION;
        if (!userMessage) {
          userMessage = 'Los datos proporcionados no son válidos.';
        }
        break;
    }
  }

  // Determinar si el error es recuperable
  recoverable = category !== ERROR_CATEGORIES.AUTHORIZATION && 
                category !== ERROR_CATEGORIES.VALIDATION;

  const categorizedError = new Error(userMessage || technicalMessage);
  categorizedError.code = errorCode;
  categorizedError.category = category;
  categorizedError.recoverable = recoverable;
  categorizedError.retryable = retryable;
  categorizedError.technicalMessage = technicalMessage;
  categorizedError.suggestedAction = suggestedAction;
  categorizedError.context = context;
  categorizedError.timestamp = new Date().toISOString();
  
  return categorizedError;
};

/**
 * Wrapper de API con circuit breaker y retry
 */
const apiCallWithResilience = async (apiCall, context, options = {}) => {
  const { 
    retries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000,
    useCircuitBreaker = true 
  } = options;

  const startTime = Date.now();
  
  try {
    const executeCall = async () => {
      if (useCircuitBreaker) {
        return await circuitBreaker.execute(apiCall);
      } else {
        return await apiCall();
      }
    };

    const result = await retryWithBackoff(
      executeCall,
      {
        retries,
        baseDelay,
        maxDelay,
        shouldRetry: (error) => {
          const categorized = categorizeError(error, context);
          return categorized.retryable;
        }
      }
    );

    telemetry.record(`sales.api.${context}.success`, {
      duration: Date.now() - startTime
    });

    return result;
  } catch (error) {
    const categorized = categorizeError(error, context);
    
    telemetry.record(`sales.api.${context}.error`, {
      duration: Date.now() - startTime,
      category: categorized.category,
      code: categorized.code,
      recoverable: categorized.recoverable,
      retryable: categorized.retryable
    });
    
    throw categorized;
  }
};

export const salesService = {
  /**
   * Procesar venta unificada (con o sin reserva)
   * @param {ProcessSaleRequest} saleData - Datos de la venta
   * @returns {Promise<ProcessSaleResponse>}
   */
  async processSale(saleData) {
    telemetry.record('sales.process.start', {
      hasReservation: !!saleData.reserve_id,
      productCount: saleData.product_details?.length || 0,
      allowPriceModifications: saleData.allow_price_modifications
    });

    return apiCallWithResilience(
      () => apiClient.post('/sale/', saleData),
      'process_sale',
      { retries: 2 } // Reducir reintentos para operaciones de escritura
    );
  },

  /**
   * Procesar venta con unidades extendidas
   * @param {ProcessSaleRequest} saleData - Datos de la venta
   * @returns {Promise<ProcessSaleResponse>}
   */
  async processSaleWithUnits(saleData) {
    telemetry.record('sales.process_with_units.start', {
      hasReservation: !!saleData.reserve_id,
      productCount: saleData.product_details?.length || 0
    });

    return apiCallWithResilience(
      () => apiClient.post('/sale/with-units', saleData),
      'process_sale_with_units',
      { retries: 2 }
    );
  },

  /**
   * Obtener detalles de una venta
   * @param {string} saleId - ID de la venta
   * @returns {Promise<SaleDetails>}
   */
  async getSaleDetails(saleId) {
    if (!saleId || typeof saleId !== 'string') {
      throw categorizeError(
        { error_code: 'INVALID_SALE_ID', message: 'ID de venta inválido' },
        'get_sale_details'
      );
    }

    telemetry.record('sales.get_details.start', { saleId });

    return apiCallWithResilience(
      () => apiClient.get(`/sale/${saleId}`),
      'get_sale_details',
      { retries: 3 }
    );
  },

  /**
   * Obtener ventas por rango de fechas
   * @param {Object} params - Parámetros de consulta
   * @param {string} params.startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} params.endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number} [params.page=1] - Página
   * @param {number} [params.pageSize=20] - Tamaño de página
   * @returns {Promise<SalesListResponse>}
   */
  async getSalesByDateRange({ startDate, endDate, page = 1, pageSize = 20 }) {
    // Validación de parámetros
    if (!startDate || !endDate) {
      throw categorizeError(
        { 
          error_code: 'INVALID_DATE_RANGE', 
          message: 'Fechas de inicio y fin son requeridas' 
        },
        'get_sales_by_date_range'
      );
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw categorizeError(
        { 
          error_code: 'INVALID_DATE_RANGE', 
          message: 'La fecha de inicio debe ser anterior a la fecha de fin' 
        },
        'get_sales_by_date_range'
      );
    }

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      page: page.toString(),
      page_size: pageSize.toString()
    });

    telemetry.record('sales.get_by_date_range.start', {
      startDate,
      endDate,
      page,
      pageSize
    });

    return apiCallWithResilience(
      () => apiClient.get(`/sale/date_range/?${params}`),
      'get_sales_by_date_range',
      { retries: 3 }
    );
  },

  /**
   * Obtener reporte de cambios de precio
   * @param {Object} params - Parámetros del reporte
   * @param {string} [params.saleId] - ID de venta específica
   * @param {string} [params.startDate] - Fecha de inicio
   * @param {string} [params.endDate] - Fecha de fin
   * @returns {Promise<PriceChangeReport[]>}
   */
  async getPriceChangeReport(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.saleId) queryParams.append('sale_id', params.saleId);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    telemetry.record('sales.get_price_change_report.start', params);

    return apiCallWithResilience(
      () => apiClient.get(`/sale/price-changes/report?${queryParams}`),
      'get_price_change_report',
      { retries: 3 }
    );
  },

  /**
   * Validar datos de venta antes del procesamiento
   * @param {ProcessSaleRequest} saleData - Datos a validar
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validateSaleData(saleData) {
    const errors = [];

    // Validaciones básicas
    if (!saleData.client_id) {
      errors.push('ID de cliente es requerido');
    }

    if (!saleData.product_details || !Array.isArray(saleData.product_details)) {
      errors.push('Detalles de productos son requeridos');
    } else if (saleData.product_details.length === 0) {
      errors.push('Debe incluir al menos un producto');
    } else {
      // Validar cada producto
      saleData.product_details.forEach((product, index) => {
        if (!product.product_id) {
          errors.push(`Producto ${index + 1}: ID de producto requerido`);
        }
        if (!product.quantity || product.quantity <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (product.sale_price !== undefined && product.sale_price < 0) {
          errors.push(`Producto ${index + 1}: Precio de venta no puede ser negativo`);
        }
        if (product.sale_price !== undefined && !product.price_change_reason) {
          errors.push(`Producto ${index + 1}: Razón del cambio de precio es requerida`);
        }
      });
    }

    // Validación de reserva si está presente
    if (saleData.reserve_id && (!Number.isInteger(saleData.reserve_id) || saleData.reserve_id <= 0)) {
      errors.push('ID de reserva debe ser un número entero positivo');
    }

    const valid = errors.length === 0;

    telemetry.record('sales.validate_data', {
      valid,
      errorCount: errors.length,
      hasReservation: !!saleData.reserve_id,
      productCount: saleData.product_details?.length || 0
    });

    return { valid, errors };
  },

  /**
   * Obtener estadísticas de ventas
   * @param {Object} params - Parámetros de estadísticas
   * @param {string} [params.period='today'] - Período (today, week, month, year)
   * @param {string} [params.startDate] - Fecha de inicio personalizada
   * @param {string} [params.endDate] - Fecha de fin personalizada
   * @returns {Promise<Object>}
   */
  async getSalesStatistics(params = {}) {
    const { period = 'today' } = params;
    
    telemetry.record('sales.get_statistics.start', { period });

    return apiCallWithResilience(
      () => apiClient.get(`/sale/statistics?period=${period}`),
      'get_sales_statistics',
      { retries: 3 }
    );
  },

  /**
   * Crea una nueva venta
   * @param {ProcessSaleRequest} saleData - Datos de la venta
   * @returns {Promise<ProcessSaleResponse>}
   */
  async createSale(saleData) {
    telemetry.record('sales.create.start', {
      hasReservation: !!saleData.reserve_id,
      productCount: saleData.product_details?.length || 0,
    });

    try {
      // Validar datos antes de enviar
      if (!saleData.client_id) {
        return {
          success: false,
          error: 'client_id es requerido',
          error_code: 'INVALID_CLIENT_ID'
        };
      }

      if (!saleData.product_details || !Array.isArray(saleData.product_details) || saleData.product_details.length === 0) {
        return {
          success: false,
          error: 'product_details debe ser un array no vacío',
          error_code: 'INVALID_PRODUCT_DETAILS'
        };
      }

      const response = await apiCallWithResilience(
        () => apiClient.post('/sales', saleData),
        'create_sale',
        { retries: 3 }
      );

      telemetry.record('sales.create.success', {
        sale_id: response.sale_id,
        total_amount: response.total_amount
      });

      return {
        success: true,
        ...response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'create_sale');
      telemetry.error('sales.create.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code,
        category: categorizedError.category
      };
    }
  },

  /**
   * Obtiene lista de ventas con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @param {number} [filters.page] - Página
   * @param {number} [filters.limit] - Límite por página
   * @param {string} [filters.status] - Estado de la venta
   * @param {string} [filters.client_id] - ID del cliente
   * @param {string} [filters.startDate] - Fecha inicio
   * @param {string} [filters.endDate] - Fecha fin
   * @returns {Promise<Object>}
   */
  async getSales(filters = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      client_id,
      startDate,
      endDate,
      ...otherFilters
    } = filters;

    telemetry.record('sales.get_list.start', { filters });

    try {
      const params = {
        page,
        limit,
        ...otherFilters
      };

      if (status) params.status = status;
      if (client_id) params.client_id = client_id;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiCallWithResilience(
        () => apiClient.get('/sales', { params }),
        'get_sales_list',
        { retries: 3 }
      );

      telemetry.record('sales.get_list.success', {
        count: response.data?.length || 0,
        total: response.total || 0
      });

      return {
        success: true,
        data: response.data || response,
        pagination: {
          page,
          limit,
          total: response.total || response.data?.length || 0,
          totalPages: Math.ceil((response.total || 0) / limit)
        }
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'get_sales_list');
      telemetry.error('sales.get_list.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code,
        data: []
      };
    }
  },

  /**
   * Obtiene una venta por ID
   * @param {string} saleId - ID de la venta
   * @returns {Promise<Object>}
   */
  async getSaleById(saleId) {
    if (!saleId || typeof saleId !== 'string') {
      return {
        success: false,
        error: 'ID de venta requerido',
        error_code: 'INVALID_SALE_ID'
      };
    }

    telemetry.record('sales.get_by_id.start', { sale_id: saleId });

    try {
      const response = await apiCallWithResilience(
        () => apiClient.get(`/sales/${saleId}`),
        'get_sale_by_id',
        { retries: 3 }
      );

      telemetry.record('sales.get_by_id.success', { sale_id: saleId });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'get_sale_by_id');
      telemetry.error('sales.get_by_id.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code || 'SALE_NOT_FOUND'
      };
    }
  },

  /**
   * Actualiza una venta existente
   * @param {string} saleId - ID de la venta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateSale(saleId, updateData) {
    if (!saleId || typeof saleId !== 'string') {
      return {
        success: false,
        error: 'ID de venta requerido',
        error_code: 'INVALID_SALE_ID'
      };
    }

    if (!updateData || typeof updateData !== 'object') {
      return {
        success: false,
        error: 'Datos de actualización requeridos',
        error_code: 'INVALID_UPDATE_DATA'
      };
    }

    telemetry.record('sales.update.start', { 
      sale_id: saleId,
      fields: Object.keys(updateData) 
    });

    try {
      const response = await apiCallWithResilience(
        () => apiClient.put(`/sales/${saleId}`, updateData),
        'update_sale',
        { retries: 3 }
      );

      telemetry.record('sales.update.success', { sale_id: saleId });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'update_sale');
      telemetry.error('sales.update.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code
      };
    }
  },

  /**
   * Elimina una venta
   * @param {string} saleId - ID de la venta
   * @returns {Promise<Object>}
   */
  async deleteSale(saleId) {
    if (!saleId || typeof saleId !== 'string') {
      return {
        success: false,
        error: 'ID de venta requerido',
        error_code: 'INVALID_SALE_ID'
      };
    }

    telemetry.record('sales.delete.start', { sale_id: saleId });

    try {
      const response = await apiCallWithResilience(
        () => apiClient.delete(`/sales/${saleId}`),
        'delete_sale',
        { retries: 3 }
      );

      telemetry.record('sales.delete.success', { sale_id: saleId });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'delete_sale');
      telemetry.error('sales.delete.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code
      };
    }
  },

  /**
   * Procesa un pago para una venta
   * @param {Object} paymentData - Datos del pago
   * @param {string} paymentData.sale_id - ID de la venta
   * @param {number} paymentData.amount - Monto del pago
   * @param {number} paymentData.payment_method_id - Método de pago
   * @param {number} [paymentData.received_amount] - Monto recibido para calcular cambio
   * @returns {Promise<Object>}
   */
  async processPayment(paymentData) {
    if (!paymentData.sale_id) {
      return {
        success: false,
        error: 'ID de venta requerido',
        error_code: 'INVALID_SALE_ID'
      };
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return {
        success: false,
        error: 'Monto de pago inválido',
        error_code: 'INVALID_PAYMENT_AMOUNT'
      };
    }

    telemetry.record('sales.payment.start', {
      sale_id: paymentData.sale_id,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method_id
    });

    try {
      // Calcular cambio si se proporciona monto recibido
      let change = 0;
      if (paymentData.received_amount && paymentData.received_amount > paymentData.amount) {
        change = paymentData.received_amount - paymentData.amount;
      }

      const response = await apiCallWithResilience(
        () => apiClient.post('/sales/payments', {
          ...paymentData,
          change_amount: change
        }),
        'process_payment',
        { retries: 3 }
      );

      telemetry.record('sales.payment.success', {
        sale_id: paymentData.sale_id,
        payment_id: response.payment_id,
        change_amount: change
      });

      return {
        success: true,
        payment_id: response.payment_id,
        change_amount: change,
        receipt_data: response.receipt_data,
        ...response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'process_payment');
      telemetry.error('sales.payment.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code
      };
    }
  },

  /**
   * Cancela una venta
   * @param {string} saleId - ID de la venta
   * @param {Object} cancellationData - Datos de cancelación
   * @param {string} cancellationData.reason - Razón de la cancelación
   * @param {boolean} [cancellationData.restock] - Si restituir inventario
   * @returns {Promise<Object>}
   */
  async cancelSale(saleId, cancellationData) {
    if (!saleId || typeof saleId !== 'string') {
      return {
        success: false,
        error: 'ID de venta requerido',
        error_code: 'INVALID_SALE_ID'
      };
    }

    if (!cancellationData?.reason) {
      return {
        success: false,
        error: 'Razón de cancelación requerida',
        error_code: 'CANCELLATION_REASON_REQUIRED'
      };
    }

    telemetry.record('sales.cancel.start', { 
      sale_id: saleId,
      reason: cancellationData.reason
    });

    try {
      const response = await apiCallWithResilience(
        () => apiClient.put(`/sales/${saleId}/cancel`, cancellationData),
        'cancel_sale',
        { retries: 3 }
      );

      telemetry.record('sales.cancel.success', { 
        sale_id: saleId,
        refund_amount: response.refund_amount
      });

      return {
        success: true,
        cancellation_id: response.cancellation_id,
        refund_amount: response.refund_amount,
        ...response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'cancel_sale');
      telemetry.error('sales.cancel.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code
      };
    }
  },

  /**
   * Aplica modificación de precio a una venta
   * @param {Object} modificationData - Datos de modificación
   * @param {string} modificationData.sale_id - ID de la venta
   * @param {string} modificationData.product_id - ID del producto
   * @param {number} modificationData.new_price - Nuevo precio
   * @param {string} modificationData.reason - Razón del cambio
   * @returns {Promise<Object>}
   */
  async applyPriceModification(modificationData) {
    if (!modificationData.sale_id || !modificationData.product_id) {
      return {
        success: false,
        error: 'Sale ID y Product ID requeridos',
        error_code: 'INVALID_MODIFICATION_DATA'
      };
    }

    telemetry.record('sales.price_modification.start', {
      sale_id: modificationData.sale_id,
      product_id: modificationData.product_id,
      new_price: modificationData.new_price
    });

    try {
      const response = await apiCallWithResilience(
        () => apiClient.post('/sales/price-modification', modificationData),
        'apply_price_modification',
        { retries: 3 }
      );

      telemetry.record('sales.price_modification.success', {
        sale_id: modificationData.sale_id,
        modification_id: response.modification_id
      });

      return {
        success: true,
        ...response
      };
    } catch (error) {
      const categorizedError = categorizeError(error, 'apply_price_modification');
      telemetry.error('sales.price_modification.error', categorizedError);
      
      return {
        success: false,
        error: categorizedError.message,
        error_code: categorizedError.code
      };
    }
  }
};

export default salesService;
