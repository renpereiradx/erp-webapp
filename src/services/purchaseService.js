/**
 * Enhanced Purchase Service - Purchase Order Enhanced API Integration
 * Implements the enhanced purchase order system with auto-pricing and cost separation
 * Follows PURCHASE_API.md specification and MVP patterns
 */

import { apiClient } from './api'
import { telemetryService } from './telemetryService'
import { DEMO_CONFIG } from '../config/demoAuth'
import {
  DEMO_PURCHASE_ORDERS_DATA,
  DEMO_TAX_RATES_DATA,
} from '../config/demoData'
import {
  calculatePurchaseSalePriceGs,
} from '../domain/pricing/purchases/purchasePricingPolicy'
// TypeScript types are available in ../types/purchase.ts

// Configuración de timeouts y reintentos
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// Utilidad para reintentos con backoff exponencial
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === attempts - 1) throw error
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)),
      )
    }
  }
}

class PurchaseService {
  extractPurchasesAndPagination(response, fallback = {}) {
    const arrayCandidates = [
      response,
      response?.data,
      response?.data?.data,
      response?.purchases,
      response?.data?.purchases,
      response?.results,
      response?.data?.results,
      response?.items,
      response?.data?.items,
      response?.rows,
      response?.data?.rows,
    ]

    let data = []
    for (const candidate of arrayCandidates) {
      if (Array.isArray(candidate)) {
        data = candidate
        break
      }
    }

    if (
      data.length === 0 &&
      response &&
      typeof response === 'object' &&
      (response.purchase || response.id)
    ) {
      data = [response]
    }

    const paginationSource =
      (response?.pagination && typeof response.pagination === 'object'
        ? response.pagination
        : null) ||
      (response?.data?.pagination &&
      typeof response.data.pagination === 'object'
        ? response.data.pagination
        : null) ||
      (response?.meta?.pagination &&
      typeof response.meta.pagination === 'object'
        ? response.meta.pagination
        : null) ||
      (response?.data?.meta?.pagination &&
      typeof response.data.meta.pagination === 'object'
        ? response.data.meta.pagination
        : null)

    const page = Number(
      paginationSource?.page ??
        paginationSource?.current_page ??
        response?.page ??
        response?.data?.page ??
        fallback.page ??
        1,
    )

    const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1

    const pageSize = Number(
      paginationSource?.page_size ??
        paginationSource?.pageSize ??
        paginationSource?.per_page ??
        response?.page_size ??
        response?.data?.page_size ??
        fallback.pageSize ??
        50,
    )

    const normalizedPageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50

    const totalPages = Number(
      paginationSource?.total_pages ??
        paginationSource?.totalPages ??
        response?.total_pages ??
        response?.data?.total_pages ??
        0,
    )

    const normalizedTotalPages =
      Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null

    const totalRecords = Number(
      paginationSource?.total_records ??
        paginationSource?.totalRecords ??
        paginationSource?.total_items ??
        paginationSource?.totalItems ??
        response?.total_records ??
        response?.data?.total_records ??
        response?.total_items ??
        response?.data?.total_items ??
        0,
    )

    const normalizedTotalRecords =
      Number.isFinite(totalRecords) && totalRecords >= 0 ? totalRecords : null

    const hasNextFromSource =
      paginationSource?.has_next ??
      paginationSource?.hasNext ??
      paginationSource?.has_more ??
      paginationSource?.hasMore

    const hasPreviousFromSource =
      paginationSource?.has_previous ?? paginationSource?.hasPrevious

    const hasNext =
      typeof hasNextFromSource === 'boolean'
        ? hasNextFromSource
        : normalizedTotalPages
          ? normalizedPage < normalizedTotalPages
          : data.length >= normalizedPageSize

    const hasPrevious =
      typeof hasPreviousFromSource === 'boolean'
        ? hasPreviousFromSource
        : normalizedPage > 1

    return {
      data,
      pagination: {
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalPages: normalizedTotalPages,
        totalRecords: normalizedTotalRecords,
        hasNext,
        hasPrevious,
      },
    }
  }

  // ============ ENHANCED PURCHASE ORDER OPERATIONS ============

  // Create enhanced purchase order with auto-pricing
  async createEnhancedPurchaseOrder(orderData) {
    const startTime = performance.now()
    try {
      const requestData = {
        supplier_id: parseInt(orderData.supplier_id),
        status: orderData.status || 'PENDING',
        order_details: orderData.order_details.map(item => {
          const detail = {
            product_id: String(item.product_id),
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            unit: String(item.unit || 'unit'),
            profit_pct:
              item.profit_pct !== null && item.profit_pct !== undefined
                ? parseFloat(item.profit_pct)
                : null,
            tax_rate_id:
              item.tax_rate_id !== null &&
              item.tax_rate_id !== undefined &&
              item.tax_rate_id !== ''
                ? parseInt(item.tax_rate_id)
                : null,
            price_includes_tax:
              item.price_includes_tax !== undefined
                ? Boolean(item.price_includes_tax)
                : true, // Default API v2.6
            supplier_id: item.supplier_id
              ? parseInt(item.supplier_id)
              : parseInt(orderData.supplier_id),
          }
          // API v1.0: Soporte para precio de venta explícito
          // Si explicit_sale_price está presente, el backend lo usa directamente
          // y ignora profit_pct para el cálculo del precio
          // Se envía el valor tal cual sin ningún cálculo previo
          if (
            item.explicit_sale_price !== null &&
            item.explicit_sale_price !== undefined
          ) {
            detail.explicit_sale_price = item.explicit_sale_price
          }
          return detail
        }),
        auto_update_prices: Boolean(orderData.auto_update_prices !== false),
        default_profit_margin: parseFloat(
          orderData.default_profit_margin || 30.0,
        ),
        payment_method_id: orderData.payment_method_id
          ? parseInt(orderData.payment_method_id)
          : null,
        currency_id: orderData.currency_id
          ? parseInt(orderData.currency_id)
          : null,
      }

      const response = await apiClient.makeRequest('/purchase/complete', {
        method: 'POST',
        body: JSON.stringify(requestData),
      })

      // Manejar diferentes formatos de respuesta del servidor
      let responseData, purchaseOrderId, message, warnings

      if (response?.data) {
        // Formato: { data: { ... } }
        responseData = response.data
        purchaseOrderId = response.data.purchase_order_id || response.data.id
        message = response.data.message
        warnings = response.data.warnings || []
      } else if (response?.purchase_order_id || response?.id) {
        // Formato directo: { purchase_order_id: ..., message: ... }
        responseData = response
        purchaseOrderId = response.purchase_order_id || response.id
        message = response.message
        warnings = response.warnings || []
      } else {
        // Respuesta mínima o formato inesperado
        responseData = response
        purchaseOrderId = null
        message = 'Orden de compra creada exitosamente'
        warnings = []
      }

      telemetryService.recordEvent('enhanced_purchase_order_created', {
        supplier_id: orderData.supplier_id,
        items_count: orderData.order_details?.length || 0,
        auto_pricing: requestData.auto_update_prices,
        warnings_count: warnings.length,
      })

      return {
        success: true,
        data: responseData,
        purchase_order_id: purchaseOrderId,
        message: message,
        warnings: warnings, // API v2.6
      }
    } catch (error) {
      console.error('Error en /purchase/complete:', error)
      telemetryService.recordEvent('enhanced_purchase_order_error', {
        error: error.message,
        status_code: error.response?.status,
      })

      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al crear orden de compra',
      }
    } finally {
      telemetryService.recordMetric(
        'create_enhanced_purchase_duration',
        performance.now() - startTime,
      )
    }
  }

  // Get detailed analysis of purchase order
  async getPurchaseOrderAnalysis(purchaseOrderId) {
    try {
      const response = await apiClient.get(
        `/purchase-orders/${purchaseOrderId}/detailed-analysis`,
      )
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error) {
      console.error('Error fetching purchase order analysis:', error)
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          'Error al obtener análisis de la orden',
      }
    }
  }

  // Validate purchase order integrity
  async validatePurchaseOrderIntegrity(purchaseOrderId) {
    try {
      const response = await apiClient.get(
        `/purchase-orders/${purchaseOrderId}/integrity-validation`,
      )
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error) {
      console.error('Error validating purchase order integrity:', error)
      return {
        success: false,
        error:
          error.response?.data?.error?.message || 'Error al validar integridad',
      }
    }
  }

  // ============ CRUD OPERATIONS (MVP Style) ============

  // Obtener compras por proveedor ID (con datos enriquecidos y metadata parsing)
  async getPurchasesBySupplier(supplierId, options = {}) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/supplier_id/${supplierId}`,
      )
      const { data } = this.extractPurchasesAndPagination(response)

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options)

      // Apply supplier status filter if specified
      let filteredData = enrichedData
      if (options.showInactiveSuppliers === false) {
        filteredData = enrichedData.filter(orderData => {
          const supplierStatus = orderData.purchase?.supplier_status
          return supplierStatus !== false // Show only active suppliers (true or undefined)
        })
        console.log(
          `🔍 Filtered ${enrichedData.length} → ${filteredData.length} orders (active suppliers only)`,
        )
      }

      return {
        success: true,
        data: filteredData,
      }
    } catch (error) {
      console.error('❌ Error fetching purchases by supplier:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener compras del proveedor',
      }
    }
  }

  // Obtener orden de compra específica con validación de proveedor
  async getPurchaseOrderWithSupplierValidation(purchaseOrderId, supplierName) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/${purchaseOrderId}/supplier/${encodeURIComponent(
          supplierName,
        )}`,
      )
      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error(
        'Error fetching purchase order with supplier validation:',
        error,
      )
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener orden de compra',
      }
    }
  }

  // Método helper para obtener compras de los últimos N días
  async getRecentPurchases(days = 30, page = 1, pageSize = 50, options = {}) {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    return this.getPurchasesByDateRange(
      startDateStr,
      endDate,
      page,
      pageSize,
      options,
    )
  }

  // Obtener compras por nombre de proveedor (con datos enriquecidos y metadata parsing)
  async getPurchasesBySupplierName(supplierName, options = {}) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/supplier_name/${encodeURIComponent(supplierName)}`,
      )
      const { data, pagination } = this.extractPurchasesAndPagination(response)

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
        pagination: {
          ...pagination,
          hasMore: pagination.hasNext,
        },
      }
    } catch (error) {
      console.error('❌ Error fetching purchases by supplier name:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al buscar compras del proveedor',
      }
    }
  }

  // Obtener compras por rango de fechas (con datos enriquecidos, metadata parsing y paginación)
  async getPurchasesByDateRange(
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
    options = {},
  ) {
    if (DEMO_CONFIG.enabled) {
      console.log(
        '🧪 [PurchaseService] Demo mode: returning mock purchase orders',
      )
      return {
        success: true,
        data: DEMO_PURCHASE_ORDERS_DATA,
        pagination: { page: 1, pageSize: 50, hasMore: false },
      }
    }
    try {
      const numericPage = parseInt(page)
      const numericPageSize = parseInt(pageSize)

      const response = await apiClient.makeRequest('/purchase/date_range/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          page:
            Number.isFinite(numericPage) && numericPage > 0 ? numericPage : 1,
          page_size:
            Number.isFinite(numericPageSize) && numericPageSize > 0
              ? numericPageSize
              : 50,
        },
      })

      const { data, pagination } = this.extractPurchasesAndPagination(
        response,
        {
          page: numericPage,
          pageSize: numericPageSize,
        },
      )

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
        pagination: {
          ...pagination,
          hasMore: pagination.hasNext,
        },
      }
    } catch (error) {
      console.error('Error fetching purchases by date range:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener compras por fecha',
      }
    }
  }

  // Validar datos de compra antes del envío (compatible con ambos formatos)
  validatePurchaseData(purchaseData) {
    const errors = []

    // Validar supplier_id (nuevo formato) o supplierId (formato anterior)
    if (!purchaseData.supplier_id && !purchaseData.supplierId) {
      errors.push('Debe seleccionar un proveedor')
    }

    // Validar order_details (nuevo formato) o items (formato anterior)
    const items = purchaseData.order_details || purchaseData.items
    if (!items || items.length === 0) {
      errors.push('Debe agregar al menos un producto')
    }

    if (items) {
      items.forEach((item, index) => {
        // Validar product_id (nuevo) o productId (anterior)
        if (!item.product_id && !item.productId) {
          errors.push(`Producto ${index + 1}: ID requerido`)
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`)
        }
        // Validar unit_price (nuevo) o unitPrice (anterior)
        const price = item.unit_price || item.unitPrice
        if (!price || price <= 0) {
          errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`)
        }
        // Validación de fecha de expiración si está presente
        if (item.expDate && new Date(item.expDate) <= new Date()) {
          errors.push(
            `Producto ${index + 1}: Fecha de expiración debe ser futura`,
          )
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Obtener tasas de impuestos disponibles
  async getTaxRates(start = 1, limit = 10) {
    const startTime = performance.now()
    try {
      const { taxRateService } = await import('./taxRateService')
      const taxRates = await taxRateService.getPaginated(start, limit)
      return {
        success: true,
        data: taxRates,
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener tasas de impuestos',
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_tax_rates_duration',
        endTime - startTime,
      )
    }
  }

  // Procesar datos enriquecidos con parsing de metadata (según PURCHASE_API.md)
  processEnhancedPurchaseData(purchaseOrders, filterOptions = {}) {
    if (!Array.isArray(purchaseOrders)) {
      return purchaseOrders
    }

    let processedData = purchaseOrders.map(orderData => {
      // Si ya tiene la estructura procesada, devolverla tal como está
      if (orderData.purchase && orderData.details) {
        // Procesar metadata en los detalles si están disponibles
        const enhancedDetails = this.processDetailsMetadata(orderData.details)

        // Asegurar que el purchase incluye supplier_status si está disponible
        const enhancedPurchase = {
          ...orderData.purchase,
          // Manejar supplier_status si viene en la respuesta
          supplier_status:
            orderData.purchase.supplier_status !== undefined
              ? orderData.purchase.supplier_status
              : true, // default fallback
        }

        return {
          purchase: enhancedPurchase,
          details: enhancedDetails,
          payments: orderData.payments,
          cost_info: orderData.cost_info,
        }
      }

      // Si es formato legacy, procesarlo
      return orderData
    })

    // Aplicar filtro de estado de proveedor si se especifica
    if (filterOptions.showInactiveSuppliers === false) {
      processedData = processedData.filter(orderData => {
        const supplierStatus = orderData.purchase?.supplier_status
        return supplierStatus !== false // Mostrar solo activos (true o undefined)
      })
    }

    return processedData
  }

  // Procesar metadata de detalles de compra según la nueva especificación
  // API v2.4: El metadata contiene sale_price calculado por el backend
  processDetailsMetadata(details) {
    if (!Array.isArray(details)) {
      return details
    }

    return details.map(detail => {
      let processedDetail = { ...detail }
      let metadata = detail.metadata

      // Parsear metadata si es string
      if (metadata && typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata)
          processedDetail.metadata = metadata
        } catch (error) {
          console.warn('Error parsing metadata for detail:', detail.id, error)
          metadata = {}
        }
      }

      // Asegurar que metadata es un objeto
      metadata = metadata || {}

      // Obtener valores numéricos
      const unitPrice = parseFloat(detail.unit_price || 0)
      const quantity = parseFloat(detail.quantity || 0)

      // API v2.4: sale_price viene en el metadata (PurchaseOrderDetailMetadata)
      // Prioridad: 1) detail.sale_price, 2) metadata.sale_price, 3) calcular con profit_pct
      const detailSalePrice = parseFloat(detail.sale_price || 0)
      const metadataSalePrice = parseFloat(metadata.sale_price || 0)
      const profitPct = parseFloat(
        detail.profit_pct || metadata.profit_pct || 0,
      )

      let finalSalePrice = 0
      if (detailSalePrice > 0) {
        finalSalePrice = detailSalePrice
      } else if (metadataSalePrice > 0) {
        finalSalePrice = metadataSalePrice
      } else if (profitPct > 0) {
        // Fallback: calcular con política de redondeo PYG (ceil a múltiplo de 50)
        finalSalePrice = calculatePurchaseSalePriceGs(unitPrice, profitPct)
      }

      return {
        ...processedDetail,
        unit: detail.unit || metadata.unit || 'unit',
        tax_rate: parseFloat(detail.tax_rate || metadata.tax_rate || 0),
        tax_rate_id: detail.tax_rate_id || metadata.tax_rate_id || null,
        profit_pct: profitPct,
        line_total: parseFloat(
          detail.line_total || metadata.line_total || quantity * unitPrice,
        ),
        sale_price: finalSalePrice,
      }
    })
  }

  // Calcular precio de venta según la especificación (precio ya incluye IVA)
  // Usa política de dominio: ceil al múltiplo de 50 más cercano en Gs
  calculateSalePrice(unitPrice, profitPct) {
    return calculatePurchaseSalePriceGs(unitPrice, profitPct)
  }

  // Calcular totales de compra (compatible con ambos formatos)
  calculatePurchaseTotals(items, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      const price = item.unit_price || item.unitPrice || 0
      return sum + item.quantity * price
    }, 0)

    const tax = subtotal * taxRate
    const total = subtotal + tax

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }

  // ============ NUEVOS ENDPOINTS DE CANCELACIÓN ============

  // Vista previa de cancelación de orden
  async previewPurchaseOrderCancellation(purchaseOrderId) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/${purchaseOrderId}/preview-cancellation`,
      )
      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error('Error previewing purchase order cancellation:', error)
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Error al obtener vista previa de cancelación',
      }
    }
  }

  // Cancelar orden de compra definitivamente
  async cancelPurchaseOrderWithDetails(cancellationRequest) {
    const startTime = performance.now()
    try {
      const {
        purchase_order_id,
        reason,
        cancellation_reason,
        force_cancel,
        user_id,
      } = cancellationRequest

      // API v2.6: Payload estructurado para cancelación
      const requestData = {
        purchase_order_id: parseInt(purchase_order_id),
        user_id: user_id || 'system', // El backend debería preferir el ID del token JWT
        cancellation_reason:
          cancellation_reason || reason || 'Cancelado desde la interfaz de usuario',
        force_cancel: Boolean(force_cancel),
      }

      const response = await apiClient.makeRequest('/purchase/cancel', {
        method: 'POST',
        body: JSON.stringify(requestData),
      })

      telemetryService.recordEvent('purchase_order_cancelled', {
        order_id: purchase_order_id,
        reason: requestData.cancellation_reason,
        force_cancel: requestData.force_cancel,
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error)
      telemetryService.recordEvent('purchase_order_cancel_error', {
        order_id: cancellationRequest?.purchase_order_id,
        error: error.message,
      })

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Error al cancelar orden de compra',
      }
    } finally {
      telemetryService.recordMetric(
        'cancel_purchase_order_duration',
        performance.now() - startTime,
      )
    }
  }

  // ============ NUEVOS ENDPOINTS DE CONSULTA ============

  // Obtener orden específica con validación de proveedor
  async getPurchaseOrderByIdWithSupplierValidation(orderId, supplierName) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/${orderId}/supplier/${encodeURIComponent(supplierName)}`,
      )

      // Procesar datos enriquecidos
      const enrichedData = this.processOrderWithSupplierValidation(response)

      return {
        success: true,
        data: enrichedData,
      }
    } catch (error) {
      console.error(
        'Error fetching purchase order with supplier validation:',
        error,
      )
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener orden de compra',
      }
    }
  }

  // Helper para procesar datos de orden con validación de proveedor
  processOrderWithSupplierValidation(orderData) {
    if (!orderData || !orderData.purchase || !orderData.details) {
      return orderData
    }

    // Asegurar que supplier_status esté disponible
    const enhancedPurchase = {
      ...orderData.purchase,
      supplier_status:
        orderData.purchase.supplier_status !== undefined
          ? orderData.purchase.supplier_status
          : true, // default fallback
    }

    // Procesar detalles con metadata
    const enhancedDetails = this.processDetailsMetadata(orderData.details)

    return {
      purchase: enhancedPurchase,
      details: enhancedDetails,
    }
  }
}

// Crear instancia única del servicio
const purchaseService = new PurchaseService()

export { purchaseService }
export default purchaseService

// TypeScript types are exported from ../types/purchase.ts
