/**
 * Purchase Types - Definiciones TypeScript/JSDoc Completas
 * Wave 1: Arquitectura Base Sólida
 * Alineado con PURCHASE_API.md y sistema enterprise
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string|number} id - ID único de la orden de compra
 * @property {number} supplier_id - ID del proveedor
 * @property {string} status - Estado: pending|confirmed|completed|cancelled
 * @property {number} total_amount - Monto total de la orden
 * @property {string} created_at - Fecha de creación ISO 8601
 * @property {string} user_id - ID del usuario que creó la orden
 * @property {PurchaseItem[]} purchase_items - Items de la compra
 * @property {string} [supplier_name] - Nombre del proveedor (joined data)
 * @property {number} [payment_method_id] - ID del método de pago
 * @property {number} [currency_id] - ID de la divisa
 * @property {Object} [metadata] - Metadatos adicionales
 * @property {string} [updated_at] - Última actualización ISO 8601
 * @property {string} [confirmed_at] - Fecha de confirmación ISO 8601
 * @property {string} [completed_at] - Fecha de completado ISO 8601
 * @property {string} [cancelled_at] - Fecha de cancelación ISO 8601
 */

/**
 * @typedef {Object} PurchaseItem
 * @property {string} product_id - ID del producto
 * @property {number} quantity - Cantidad (soporta decimales)
 * @property {number} unit_price - Precio unitario
 * @property {number} [tax_rate_id] - ID de tasa de impuesto (opcional)
 * @property {number} [profit_pct] - Porcentaje de ganancia (opcional)
 * @property {string} [exp_date] - Fecha de vencimiento ISO 8601 (opcional)
 * @property {string} [product_name] - Nombre del producto (joined data)
 * @property {number} [subtotal] - Subtotal calculado (quantity * unit_price)
 * @property {number} [tax_amount] - Monto de impuestos calculado
 * @property {number} [total_with_tax] - Total incluyendo impuestos
 */

/**
 * @typedef {Object} PurchaseEnhancedRequest
 * @property {number} supplier_id - ID del proveedor
 * @property {string} status - Estado inicial (default: 'pending')
 * @property {PurchaseEnhancedProductDetail[]} product_details - Detalles de productos
 * @property {number} payment_method_id - ID del método de pago
 * @property {number} currency_id - ID de la divisa
 * @property {Object} metadata - Metadatos adicionales
 * @property {string} [metadata.purchase_priority] - Prioridad: low|medium|high
 * @property {string} [metadata.delivery_date] - Fecha de entrega esperada
 * @property {string} [metadata.notes] - Notas adicionales
 */

/**
 * @typedef {Object} PurchaseEnhancedProductDetail
 * @property {string} product_id - ID del producto
 * @property {number} quantity - Cantidad (soporta decimales)
 * @property {number} unit_price - Precio unitario
 * @property {number} [tax_rate_id] - ID de tasa de impuesto (opcional)
 * @property {number} [profit_pct] - Porcentaje de ganancia (opcional)
 */

/**
 * @typedef {Object} PurchaseEnhancedResponse
 * @property {boolean} success - Indica si la operación fue exitosa
 * @property {number} purchase_order_id - ID de la orden creada
 * @property {number} total_amount - Monto total de la orden
 * @property {number} items_processed - Número de items procesados
 * @property {string} message - Mensaje de confirmación
 */

/**
 * @typedef {Object} PurchasePayment
 * @property {number} payment_id - ID único del pago
 * @property {number} purchase_order_id - ID de la orden de compra
 * @property {number} amount_paid - Monto pagado en esta transacción
 * @property {number} outstanding_amount - Monto pendiente después del pago
 * @property {number} total_paid_so_far - Total pagado hasta ahora
 * @property {number} total_order_amount - Monto total de la orden
 * @property {string} payment_status - Estado: partial|complete|overpaid
 * @property {boolean} order_fully_paid - Si la orden está completamente pagada
 * @property {string} payment_reference - Referencia del pago
 * @property {string} [payment_notes] - Notas del pago
 * @property {string} processed_at - Fecha de procesamiento ISO 8601
 * @property {string} processed_by - Usuario que procesó el pago
 */

/**
 * @typedef {Object} PaymentProcessRequest
 * @property {number} purchase_order_id - ID de la orden de compra
 * @property {number} amount_paid - Monto a pagar
 * @property {string} payment_reference - Referencia del pago
 * @property {string} [payment_notes] - Notas del pago (opcional)
 */

/**
 * @typedef {Object} PaymentProcessResponse
 * @property {boolean} success - Indica si la operación fue exitosa
 * @property {number} payment_id - ID del pago procesado
 * @property {number} purchase_order_id - ID de la orden de compra
 * @property {PaymentDetail} payment_details - Detalles del pago
 * @property {string} message - Mensaje de confirmación
 * @property {string} processed_at - Fecha de procesamiento ISO 8601
 * @property {string} processed_by - Usuario que procesó el pago
 */

/**
 * @typedef {Object} PaymentDetail
 * @property {number} amount_paid - Monto pagado en esta transacción
 * @property {number} outstanding_amount - Monto pendiente después del pago
 * @property {number} total_paid_so_far - Total pagado hasta ahora
 * @property {number} total_order_amount - Monto total de la orden
 * @property {string} payment_status - Estado: partial|complete|overpaid
 * @property {boolean} order_fully_paid - Si la orden está completamente pagada
 */

/**
 * @typedef {Object} CancellationPreview
 * @property {boolean} success - Indica si el preview fue exitoso
 * @property {PurchaseInfo} purchase_info - Información de la orden
 * @property {ImpactAnalysis} impact_analysis - Análisis de impacto
 * @property {CancellationRecommendations} recommendations - Recomendaciones
 * @property {string} generated_at - Fecha de generación ISO 8601
 */

/**
 * @typedef {Object} PurchaseInfo
 * @property {number} purchase_order_id - ID de la orden de compra
 * @property {string} current_status - Estado actual de la orden
 * @property {number} total_amount - Monto total de la orden
 * @property {string} order_date - Fecha de la orden ISO 8601
 * @property {string} created_by - Usuario que creó la orden
 * @property {boolean} can_be_cancelled - Si puede ser cancelada
 */

/**
 * @typedef {Object} ImpactAnalysis
 * @property {number} total_items - Total de items en la orden
 * @property {number} payments_to_cancel - Pagos a cancelar
 * @property {number} total_to_reverse - Total a revertir
 * @property {number} stock_adjustments_required - Ajustes de stock requeridos
 * @property {number} price_updates_required - Actualizaciones de precio requeridas
 * @property {boolean} requires_payment_reversal - Si requiere reversión de pagos
 * @property {boolean} requires_stock_adjustment - Si requiere ajuste de stock
 * @property {boolean} requires_price_reversion - Si requiere reversión de precios
 */

/**
 * @typedef {Object} CancellationRecommendations
 * @property {string} action - Acción recomendada: proceed|proceed_with_caution|abort
 * @property {boolean} backup_recommended - Si se recomienda backup
 * @property {boolean} notify_supplier - Si notificar al proveedor
 * @property {string} estimated_complexity - Complejidad estimada: low|medium|high
 */

/**
 * @typedef {Object} CancellationResponse
 * @property {boolean} success - Indica si la cancelación fue exitosa
 * @property {string} message - Mensaje de confirmación
 * @property {string} purchase_id - ID de la orden cancelada
 * @property {string} cancelled_at - Fecha de cancelación ISO 8601
 * @property {string[]} actions_performed - Acciones realizadas
 */

/**
 * @typedef {Object} PaymentStatistics
 * @property {StatisticsPeriod} period - Período de las estadísticas
 * @property {OrderStatistics} order_statistics - Estadísticas de órdenes
 * @property {FinancialSummary} financial_summary - Resumen financiero
 * @property {string} generated_at - Fecha de generación ISO 8601
 */

/**
 * @typedef {Object} StatisticsPeriod
 * @property {string} start_date - Fecha de inicio YYYY-MM-DD
 * @property {string} end_date - Fecha de fin YYYY-MM-DD
 * @property {number} [supplier_id] - ID del proveedor específico (opcional)
 */

/**
 * @typedef {Object} OrderStatistics
 * @property {number} total_orders - Total de órdenes en el período
 * @property {number} fully_paid_orders - Órdenes completamente pagadas
 * @property {number} partially_paid_orders - Órdenes parcialmente pagadas
 * @property {number} unpaid_orders - Órdenes sin pagar
 * @property {number} payment_completion_rate - Tasa de completado de pagos (0-1)
 */

/**
 * @typedef {Object} FinancialSummary
 * @property {number} total_order_amount - Monto total de órdenes
 * @property {number} total_paid_amount - Monto total pagado
 * @property {number} total_outstanding - Monto total pendiente
 * @property {number} payment_percentage - Porcentaje de pago (0-100)
 */

/**
 * @typedef {Object} Pagination
 * @property {number} current_page - Página actual
 * @property {number} per_page - Items por página
 * @property {number} total - Total de items
 * @property {number} total_pages - Total de páginas
 */

/**
 * @typedef {Object} PurchaseFilters
 * @property {string} [search] - Término de búsqueda
 * @property {string} [status] - Filtro por estado
 * @property {number} [supplier_id] - Filtro por proveedor
 * @property {string} [start_date] - Fecha de inicio YYYY-MM-DD
 * @property {string} [end_date] - Fecha de fin YYYY-MM-DD
 * @property {number} [min_amount] - Monto mínimo
 * @property {number} [max_amount] - Monto máximo
 * @property {string} [created_by] - Usuario que creó
 * @property {string} [payment_status] - Estado de pago
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indica si la operación fue exitosa
 * @property {any} [data] - Datos de respuesta (si success=true)
 * @property {string} [error] - Mensaje de error (si success=false)
 * @property {string} [error_code] - Código de error específico
 * @property {string} [message] - Mensaje adicional
 * @property {any} [details] - Detalles adicionales del error
 * @property {string} [context] - Contexto donde ocurrió el error
 * @property {number} [status_code] - Código de estado HTTP
 */

/**
 * @typedef {Object} StoreState
 * @property {PurchaseOrder[]} purchaseOrders - Lista de órdenes de compra
 * @property {PurchaseOrder|null} currentPurchase - Orden actual seleccionada
 * @property {Pagination} pagination - Información de paginación
 * @property {boolean} isLoading - Estado de carga general
 * @property {boolean} isCreating - Estado de creación
 * @property {boolean} isUpdating - Estado de actualización
 * @property {boolean} isDeleting - Estado de eliminación
 * @property {boolean} isLoadingPayments - Estado de carga de pagos
 * @property {string|null} error - Error actual
 * @property {string|null} errorType - Tipo de error actual
 */

/**
 * @typedef {Object} CacheEntry
 * @property {any} data - Datos cacheados
 * @property {number} ts - Timestamp de creación
 * @property {number} [ttl] - Time to live en ms
 */

/**
 * @typedef {Object} CircuitBreakerState
 * @property {number} openUntil - Timestamp hasta cuando está abierto
 * @property {number} failures - Número de fallos actuales
 * @property {number} threshold - Umbral de fallos
 * @property {number} cooldownMs - Tiempo de cooldown en ms
 */

/**
 * @typedef {Object} OfflineData
 * @property {boolean} hasSnapshot - Si tiene snapshot offline
 * @property {string|null} snapshotDate - Fecha del snapshot
 * @property {PurchaseOrder[]} purchases - Órdenes en el snapshot
 */

/**
 * @typedef {Object} StoreMetrics
 * @property {number} totalOrders - Total de órdenes
 * @property {number} pendingOrders - Órdenes pendientes
 * @property {number} confirmedOrders - Órdenes confirmadas
 * @property {number} completedOrders - Órdenes completadas
 * @property {number} cancelledOrders - Órdenes canceladas
 * @property {number} cacheSize - Tamaño del cache
 * @property {string} circuitState - Estado del circuit breaker
 * @property {number} circuitFailures - Fallos del circuit breaker
 */

// ==================== CONSTANTES DE TIPOS ====================

/**
 * Estados válidos de órdenes de compra
 */
export const PURCHASE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Estados válidos de pagos
 */
export const PAYMENT_STATUS = {
  PARTIAL: 'partial',
  COMPLETE: 'complete',
  OVERPAID: 'overpaid'
};

/**
 * Prioridades de compra
 */
export const PURCHASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Códigos de error específicos de purchases
 */
export const PURCHASE_ERROR_CODES = {
  // Validación
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  SUPPLIER_NOT_FOUND: 'SUPPLIER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PAYMENT_METHOD_NOT_FOUND: 'PAYMENT_METHOD_NOT_FOUND',
  CURRENCY_NOT_FOUND: 'CURRENCY_NOT_FOUND',
  
  // Permisos
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Pagos
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  PAYMENT_EXCEEDS_BALANCE: 'PAYMENT_EXCEEDS_BALANCE',
  
  // Órdenes
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
  ORDER_CANNOT_BE_MODIFIED: 'ORDER_CANNOT_BE_MODIFIED',
  
  // Sistema
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // API
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR'
};

/**
 * Eventos de telemetría para purchases
 */
export const PURCHASE_TELEMETRY_EVENTS = {
  // Carga de datos
  LOAD_START: 'purchase.purchases.load_start',
  LOAD_SUCCESS: 'purchase.purchases.load_success',
  LOAD_ERROR: 'purchase.purchases.load_error',
  
  // Creación
  CREATE_START: 'purchase.purchases.create_start',
  CREATE_SUCCESS: 'purchase.purchases.create_success',
  CREATE_ERROR: 'purchase.purchases.create_error',
  
  // Actualización
  UPDATE_START: 'purchase.purchases.update_start',
  UPDATE_SUCCESS: 'purchase.purchases.update_success',
  UPDATE_ERROR: 'purchase.purchases.update_error',
  
  // Cancelación
  CANCEL_START: 'purchase.purchases.cancel_start',
  CANCEL_SUCCESS: 'purchase.purchases.cancel_success',
  CANCEL_ERROR: 'purchase.purchases.cancel_error',
  
  // Pagos
  PAYMENT_START: 'purchase.purchases.payment_start',
  PAYMENT_SUCCESS: 'purchase.purchases.payment_success',
  PAYMENT_ERROR: 'purchase.purchases.payment_error',
  
  // Cache
  CACHE_HIT: 'purchase.purchases.cache_hit',
  CACHE_MISS: 'purchase.purchases.cache_miss',
  CACHE_EVICTED: 'purchase.purchases.cache_evicted',
  CACHE_CLEARED: 'purchase.purchases.cache_cleared',
  
  // Circuit Breaker
  CIRCUIT_OPEN: 'purchase.purchases.circuit_open',
  CIRCUIT_CLOSED: 'purchase.purchases.circuit_closed',
  CIRCUIT_RESET: 'purchase.purchases.circuit_reset_manual',
  
  // Offline
  OFFLINE_SNAPSHOT_CREATED: 'purchase.purchases.offline_snapshot_created',
  OFFLINE_SNAPSHOT_LOADED: 'purchase.purchases.offline_snapshot_loaded',
  
  // API
  API_CALL_START: 'purchase.api.call_start',
  API_CALL_SUCCESS: 'purchase.api.call_success',
  API_CALL_ERROR: 'purchase.api.call_error'
};

export default {
  PURCHASE_STATUS,
  PAYMENT_STATUS,
  PURCHASE_PRIORITY,
  PURCHASE_ERROR_CODES,
  PURCHASE_TELEMETRY_EVENTS
};
