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
  }
};

export default salesService;
