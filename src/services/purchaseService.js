/**
 * Enhanced Purchase Service - Purchase Order Enhanced API Integration
 * Implements the enhanced purchase order system with auto-pricing and cost separation
 * Follows PURCHASE_API.md specification and MVP patterns
 */

import { apiClient } from './api'
import { telemetryService } from './telemetryService'
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
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, i))
      )
    }
  }
}

class PurchaseService {
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
          orderData.default_profit_margin || 30.0
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
      let responseData, purchaseOrderId, message

      if (response?.data) {
        // Formato: { data: { ... } }
        responseData = response.data
        purchaseOrderId = response.data.purchase_order_id || response.data.id
        message = response.data.message
      } else if (response?.purchase_order_id || response?.id) {
        // Formato directo: { purchase_order_id: ..., message: ... }
        responseData = response
        purchaseOrderId = response.purchase_order_id || response.id
        message = response.message
      } else {
        // Respuesta mínima o formato inesperado
        responseData = response
        purchaseOrderId = null
        message = 'Orden de compra creada exitosamente'
      }

      telemetryService.recordEvent('enhanced_purchase_order_created', {
        supplier_id: orderData.supplier_id,
        items_count: orderData.order_details?.length || 0,
        auto_pricing: requestData.auto_update_prices,
      })

      return {
        success: true,
        data: responseData,
        purchase_order_id: purchaseOrderId,
        message: message,
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
        performance.now() - startTime
      )
    }
  }

  // Get detailed analysis of purchase order
  async getPurchaseOrderAnalysis(purchaseOrderId) {
    try {
      const response = await apiClient.get(
        `/purchase-orders/${purchaseOrderId}/detailed-analysis`
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
        `/purchase-orders/${purchaseOrderId}/integrity-validation`
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
        `/purchase/supplier_id/${supplierId}`
      )
      const data = Array.isArray(response) ? response : response.data || []

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
          `🔍 Filtered ${enrichedData.length} → ${filteredData.length} orders (active suppliers only)`
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
          supplierName
        )}`
      )
      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error(
        'Error fetching purchase order with supplier validation:',
        error
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
      options
    )
  }

  // Obtener compras por nombre de proveedor (con datos enriquecidos y metadata parsing)
  async getPurchasesBySupplierName(supplierName, options = {}) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/supplier_name/${encodeURIComponent(supplierName)}`
      )
      const data = Array.isArray(response) ? response : response.data || []

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
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
    options = {}
  ) {
    try {
      // Construir query parameters según la nueva especificación API
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        page: parseInt(page).toString(),
        page_size: parseInt(pageSize).toString(),
      })

      const response = await apiClient.makeRequest(
        `/purchase/date_range/?${params.toString()}`
      )
      const data = Array.isArray(response) ? response : response.data || []

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: response.length === parseInt(pageSize),
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
            `Producto ${index + 1}: Fecha de expiración debe ser futura`
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
      return await withRetry(async () => {
        const response = await apiClient.makeRequest(
          `/tax_rate/${start}/${limit}`
        )
        return {
          success: true,
          data: Array.isArray(response) ? response : response.data || [],
        }
      })
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
        endTime - startTime
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
        detail.profit_pct || metadata.profit_pct || 0
      )

      let finalSalePrice = 0
      if (detailSalePrice > 0) {
        finalSalePrice = detailSalePrice
      } else if (metadataSalePrice > 0) {
        finalSalePrice = metadataSalePrice
      } else if (profitPct > 0) {
        // Fallback: calcular con redondeo para PYG
        finalSalePrice = Math.round(unitPrice * (1 + profitPct / 100))
      }

      return {
        ...processedDetail,
        unit: detail.unit || metadata.unit || 'unit',
        tax_rate: parseFloat(detail.tax_rate || metadata.tax_rate || 0),
        profit_pct: profitPct,
        line_total: parseFloat(
          detail.line_total || metadata.line_total || quantity * unitPrice
        ),
        sale_price: finalSalePrice,
      }
    })
  }

  // Calcular precio de venta según la especificación (precio ya incluye IVA)
  calculateSalePrice(unitPrice, profitPct) {
    if (!unitPrice || unitPrice <= 0) return 0

    const margin = profitPct && profitPct > 0 ? profitPct : 30 // Default 30%
    return Number((unitPrice * (1 + margin / 100)).toFixed(2))
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
        `/purchase/${purchaseOrderId}/preview-cancellation`
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
    try {
      const { purchase_order_id, reason, notes } = cancellationRequest

      // El endpoint correcto es PUT /purchase/cancel/{id}
      const response = await apiClient.makeRequest(
        `/purchase/cancel/${purchase_order_id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ reason, notes }),
        }
      )
      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error)
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Error al cancelar orden de compra',
      }
    }
  }

  // ============ NUEVOS ENDPOINTS DE CONSULTA ============

  // Obtener orden específica con validación de proveedor
  async getPurchaseOrderByIdWithSupplierValidation(orderId, supplierName) {
    try {
      const response = await apiClient.makeRequest(
        `/purchase/${orderId}/supplier/${encodeURIComponent(supplierName)}`
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
        error
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
