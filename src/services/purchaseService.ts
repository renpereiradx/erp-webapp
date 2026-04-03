import { apiClient } from './api'
import { DEMO_CONFIG } from '../config/demoAuth'
import {
  DEMO_PURCHASE_ORDERS_DATA,
} from '../config/demoData'
import {
  calculatePurchaseSalePriceGs,
} from '@/domain/purchase/pricing/purchasePricingPolicy'
import { validatePurchaseOrder } from '@/domain/purchase/validators/purchaseOrderValidator'
import { calculatePurchaseTotals as domainCalculatePurchaseTotals } from '@/domain/purchase/calculations/purchaseCalculator'
import { 
  PurchaseOrderRequest, 
  PurchaseOrderOperationResponse
} from '@/types'
import { telemetryService } from './telemetryService'

// Servicio de compras
export const purchaseService = {
  extractPurchasesAndPagination: (response: any, fallback: any = {}) => {
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

    let data: any[] = []
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
  },

  // ============ ENHANCED PURCHASE ORDER OPERATIONS ============

  // Create enhanced purchase order with auto-pricing
  createEnhancedPurchaseOrder: async (orderData: PurchaseOrderRequest): Promise<any> => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        purchase_order_id: Math.floor(Math.random() * 1000),
        total_amount: 150000,
        items_processed: orderData.order_details?.length || 0,
        message: 'Orden de compra demo creada exitosamente'
      };
    }
    const startTime = performance.now()
    try {
      const response = await apiClient.createCompletePurchase(orderData)

      // Manejar diferentes formatos de respuesta del servidor
      let responseData, purchaseOrderId, message, warnings

      if (response?.data) {
        responseData = response.data
        purchaseOrderId = response.data.purchase_order_id || response.data.id
        message = response.data.message
        warnings = response.data.warnings || []
      } else if (response?.purchase_order_id || response?.id) {
        responseData = response
        purchaseOrderId = response.purchase_order_id || response.id
        message = response.message
        warnings = response.warnings || []
      } else {
        responseData = response
        purchaseOrderId = null
        message = 'Orden de compra creada exitosamente'
        warnings = []
      }

      telemetryService.recordEvent('enhanced_purchase_order_created', {
        supplier_id: orderData.supplier_id,
        items_count: orderData.order_details?.length || 0,
        auto_pricing: orderData.auto_update_prices,
        warnings_count: warnings.length,
      })

      return {
        success: true,
        data: responseData,
        purchase_order_id: purchaseOrderId,
        message: message,
        warnings: warnings, // API v2.6
      }
    } catch (error: any) {
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
        message: error.response?.data?.message || error.message, // API v2.7: Mensaje descriptivo de validación
      }
    } finally {
      telemetryService.recordMetric(
        'create_enhanced_purchase_duration',
        performance.now() - startTime,
      )
    }
  },

  // ============ CRUD OPERATIONS (MVP Style) ============

  // Obtener compras por proveedor ID (con datos enriquecidos y metadata parsing)
  getPurchasesBySupplier: async (supplierId: number, options: any = {}) => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: purchaseService.processEnhancedPurchaseData(DEMO_PURCHASE_ORDERS_DATA, options),
      };
    }
    try {
      const response = await apiClient.getPurchasesBySupplierId(supplierId)
      const { data } = purchaseService.extractPurchasesAndPagination(response)

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = purchaseService.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
      }
    } catch (error: any) {
      console.error('❌ Error fetching purchases by supplier:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener compras del proveedor',
      }
    }
  },

  // Obtener una orden de compra por ID
  getPurchaseById: async (id: number | string) => {
    if (DEMO_CONFIG.enabled) {
      const demoOrder = (DEMO_PURCHASE_ORDERS_DATA || []).find(
        o => String(o.id) === String(id) || String(o.purchase?.id) === String(id)
      );
      return {
        success: true,
        data: demoOrder || DEMO_PURCHASE_ORDERS_DATA[0],
      };
    }
    try {
      const response = await apiClient.getPurchaseById(Number(id));
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error(`Error fetching purchase order ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Error al obtener orden de compra',
      };
    }
  },

  // Obtener orden de compra específica con validación de proveedor
  getPurchaseOrderWithSupplierValidation: async (purchaseOrderId: number | string, supplierName: string) => {
    if (DEMO_CONFIG.enabled) {
      const demoOrder = (DEMO_PURCHASE_ORDERS_DATA || []).find(
        o => String(o.id) === String(purchaseOrderId) || String(o.purchase?.id) === String(purchaseOrderId)
      );
      return {
        success: true,
        data: demoOrder || DEMO_PURCHASE_ORDERS_DATA[0],
      };
    }
    try {
      const response = await apiClient.getPurchaseByIdAndSupplier(
        parseInt(purchaseOrderId as string),
        supplierName,
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
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
  },

  // Método helper para obtener compras de los últimos N días
  getRecentPurchases: async (days = 30, page = 1, pageSize = 50, options = {}) => {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    return purchaseService.getPurchasesByDateRange(
      startDateStr,
      endDate,
      page,
      pageSize,
      options,
    )
  },

  // Obtener compras por nombre de proveedor (con datos enriquecidos y metadata parsing)
  getPurchasesBySupplierName: async (supplierName: string, options: any = {}) => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: purchaseService.processEnhancedPurchaseData(DEMO_PURCHASE_ORDERS_DATA, options),
        pagination: { page: 1, pageSize: 50, hasNext: false, hasPrevious: false },
      };
    }
    try {
      const response = await apiClient.getPurchasesBySupplierName(supplierName)
      const { data, pagination } = purchaseService.extractPurchasesAndPagination(response)

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = purchaseService.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
        pagination,
      }
    } catch (error: any) {
      console.error('❌ Error fetching purchases by supplier name:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al buscar compras del proveedor',
      }
    }
  },

  // Obtener compras por rango de fechas (con datos enriquecidos, metadata parsing y paginación)
  getPurchasesByDateRange: async (
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
    options: any = {},
  ) => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: DEMO_PURCHASE_ORDERS_DATA,
        pagination: { page: 1, pageSize: 50, hasNext: false, hasPrevious: false },
      }
    }
    try {
      const response = await apiClient.getPurchasesByDateRange(startDate, endDate, page, pageSize)

      const { data, pagination } = purchaseService.extractPurchasesAndPagination(
        response,
        { page, pageSize },
      )

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = purchaseService.processEnhancedPurchaseData(data, options)

      return {
        success: true,
        data: enrichedData,
        pagination,
      }
    } catch (error: any) {
      console.error('Error fetching purchases by date range:', error)
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Error al obtener compras por fecha',
      }
    }
  },

  // Validar datos de compra antes del envío (compatible con ambos formatos)
  validatePurchaseData: (purchaseData: any) => {
    // Delegar a la lógica de dominio
    const normalizedData = {
      ...purchaseData,
      supplier_id: purchaseData.supplier_id || purchaseData.supplierId,
      order_details: purchaseData.order_details || purchaseData.items
    };
    
    return validatePurchaseOrder(normalizedData);
  },

  // Obtener tasas de impuestos disponibles
  getTaxRates: async (start = 1, limit = 10) => {
    const startTime = performance.now()
    try {
      const { taxRateService } = await import('./taxRateService')
      const taxRates = await taxRateService.getPaginated(start, limit)
      return {
        success: true,
        data: taxRates,
      }
    } catch (error: any) {
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
  },

  // Procesar datos enriquecidos con parsing de metadata (según PURCHASE_API.md)
  processEnhancedPurchaseData: (purchaseOrders: any[], filterOptions: any = {}) => {
    if (!Array.isArray(purchaseOrders)) {
      return purchaseOrders
    }

    let processedData = purchaseOrders.map(orderData => {
      // Si ya tiene la estructura procesada, devolverla tal como está
      if (orderData.purchase && orderData.details) {
        // Procesar metadata en los detalles si están disponibles
        const enhancedDetails = purchaseService.processDetailsMetadata(orderData.details)

        const enhancedPurchase = {
          ...orderData.purchase,
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
  },

  // Get detailed analysis of purchase order
  getPurchaseOrderAnalysis: async (purchaseOrderId: number | string) => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: { status: 'Analyzed (DEMO)' } };
    }
    try {
      const response = await apiClient.makeRequest(`/purchase-orders/${purchaseOrderId}/detailed-analysis`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error fetching purchase order analysis:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener análisis de la orden',
      };
    }
  },

  // Validate purchase order integrity
  validatePurchaseOrderIntegrity: async (purchaseOrderId: number | string) => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: { status: 'Valid (DEMO)' } };
    }
    try {
      const response = await apiClient.makeRequest(`/purchase-orders/${purchaseOrderId}/integrity-validation`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error validating purchase order integrity:', error);
      return {
        success: false,
        error: error.message || 'Error al validar integridad',
      };
    }
  },

  // Actualizar estado de orden
  updatePurchaseOrderStatus: async (id: number | string, newStatus: string, notes: string = '') => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: { id, status: newStatus } };
    }
    try {
      const response = await apiClient.makeRequest(`/purchase/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, notes }),
      });
      return { success: true, data: response };
    } catch (error: any) {
      console.error(`Error updating purchase order ${id} status:`, error);
      return { success: false, error: error.message };
    }
  },

  // Procesar metadata de detalles de compra según la nueva especificación
  processDetailsMetadata: (details: any[]) => {
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

      metadata = metadata || {}

      const unitPrice = parseFloat(detail.unit_price || 0)
      const quantity = parseFloat(detail.quantity || 0)

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
  },

  // Calcular precio de venta según la especificación (precio ya incluye IVA)
  calculateSalePrice: (unitPrice: number, profitPct: number) => {
    return calculatePurchaseSalePriceGs(unitPrice, profitPct)
  },

  // Calcular totales de compra (compatible con ambos formatos)
  calculatePurchaseTotals: (items: any[], taxRate = 0) => {
    const normalizedItems = (items || []).map(item => ({
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || item.unitPrice || 0),
      tax_rate: item.tax_rate ?? item.taxRate,
      price_includes_tax: item.price_includes_tax !== undefined ? Boolean(item.price_includes_tax) : true
    }));

    return domainCalculatePurchaseTotals(normalizedItems, taxRate);
  },

  // ============ NUEVOS ENDPOINTS DE CANCELACIÓN ============

  previewPurchaseOrderCancellation: async (purchaseOrderId: number | string) => {
    if (DEMO_CONFIG.enabled) {
      return {
        success: true,
        data: { can_be_cancelled: true, recommendations: ['Seguro para cancelar'] }
      };
    }
    try {
      const response = await (apiClient as any).previewPurchaseCancellation(purchaseOrderId as number)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('Error previewing purchase order cancellation:', error)
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Error al obtener vista previa de cancelación',
      }
    }
  },

  cancelPurchaseOrderWithDetails: async (cancellationRequest: any) => {
    if (DEMO_CONFIG.enabled) {
      return { success: true, data: { message: 'Cancelado (DEMO)' } };
    }
    const startTime = performance.now()
    try {
      const response = await apiClient.cancelPurchaseOrder(cancellationRequest)

      telemetryService.recordEvent('purchase_order_cancelled', {
        order_id: cancellationRequest.purchase_order_id,
      })

      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('Error cancelling purchase order:', error)
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
  },
}

export default purchaseService
