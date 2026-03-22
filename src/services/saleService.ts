/**
 * Servicio de Gestión de Ventas
 * Proporciona una interfaz limpia para interactuar con la API de ventas
 * Implementa patrones descritos en SALE_API.md y SALE_PAYMENT_API.md
 */

import { apiClient } from './api'
import { DEMO_SALES_RESPONSE, IS_DEMO_MODE } from '@/config/demoSalePayments'
import { 
  SaleRequest, 
  SaleEnhancedResponse, 
  PaginatedSalesResponse,
  SaleWithMetadataResponse,
  SalePaymentStatusResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  AddProductsToSaleRequest
} from '@/types'
import { validateSaleOrder } from '@/domain/sale/validators/saleValidator'
import { calculateSaleTotals } from '@/domain/sale/calculations/saleCalculator'

export const saleService = {
  extractSalesAndPagination(response: any, fallback: any = {}) {
    const arrayCandidates = [
      response,
      response?.data,
      response?.data?.data,
      response?.sales,
      response?.data?.sales,
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
      (response.sale_id || response.id)
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
        fallback.page_size ??
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
        response?.total_count ??
        response?.data?.total_count ??
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
        page_size: normalizedPageSize,
        pageSize: normalizedPageSize,
        total_pages: normalizedTotalPages,
        totalPages: normalizedTotalPages,
        total_records: normalizedTotalRecords,
        totalRecords: normalizedTotalRecords,
        has_next: hasNext,
        hasNext,
        has_previous: hasPrevious,
        hasPrevious,
      },
    }
  },

  // ============ GESTIÓN DE SESIONES ============

  async startSaleSession(data: any) {
    try {
      const response = await apiClient.makeRequest('/sale/session/start', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error starting sale session:', error)
      return { success: false, error: error.message }
    }
  },

  async endSaleSession(sessionId: string, summary: any) {
    try {
      const response = await apiClient.makeRequest(
        `/sale/session/${sessionId}/end`,
        {
          method: 'POST',
          body: JSON.stringify(summary),
        },
      )
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error ending sale session:', error)
      return { success: false, error: error.message }
    }
  },

  // ============ PROCESAMIENTO DE PAGOS ============

  async processPayment(saleId: string, paymentData: any) {
    try {
      // Usar nuevo método de BusinessManagementAPI
      const response = await apiClient.processSalePayment({
        sales_order_id: saleId,
        ...paymentData,
      })
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error processing payment:', error)
      return { success: false, error: error.message }
    }
  },

  async calculateChange(totalAmount: number, amountPaid: number) {
    // Cálculo local para rapidez, o llamar a API si existe
    const change = amountPaid - totalAmount
    return {
      success: true,
      data: {
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_amount: change >= 0 ? change : 0,
        is_covered: change >= 0,
      },
    }
  },

  // ============ CONSULTA DE VENTAS ============

  async getSales(params: any = {}) {
    try {
      // Si hay rango de fechas, usar el endpoint específico
      if (
        params.dateFrom ||
        params.dateTo ||
        params.start_date ||
        params.end_date
      ) {
        return this.getSalesByDateRange(params)
      }

      // Si hay cliente, usar endpoint de cliente
      if (params.clientId || params.client_id) {
        return this.getSalesByClientId(
          params.clientId || params.client_id,
          params.page,
          params.page_size || params.limit
        )
      }

      if (params.clientName) {
        return this.getSalesByClientName(params.clientName, params.page, params.page_size)
      }

      // Fallback a lista general si existiera, o usar rango de hoy por defecto
      const today = new Date().toISOString().split('T')[0]
      return this.getSalesByDateRange({
        start_date: today,
        end_date: today,
        ...params,
      })
    } catch (error: any) {
      console.error('Error fetching sales:', error)
      return { success: false, error: error.message }
    }
  },

  async getSalesByDateRange(params: any = {}) {
    if (IS_DEMO_MODE) {
      return DEMO_SALES_RESPONSE
    }
    try {
      const startDate = params.start_date || params.dateFrom
      const endDate = params.end_date || params.dateTo
      const page = params.page || 1
      const pageSize = params.page_size || params.limit || 50

      if (!startDate || !endDate) {
        throw new Error('start_date and end_date are required')
      }

      const response = await apiClient.getSalesByDateRange(startDate, endDate, page, pageSize)

      const { data, pagination } = this.extractSalesAndPagination(
        response,
        { start_date: startDate, end_date: endDate, page, page_size: pageSize }
      )

      return {
        success: true,
        data,
        pagination,
      }
    } catch (error: any) {
      console.error('Error fetching sales by date range:', error)
      return { success: false, error: error.message }
    }
  },

  async getSalesByClient(clientId: string) {
    return this.getSalesByClientId(clientId)
  },

  async getSalesByClientId(clientId: string, page = 1, pageSize = 50) {
    if (IS_DEMO_MODE) {
      return DEMO_SALES_RESPONSE
    }
    try {
      const response = await apiClient.getSalesByClientId(clientId, page, pageSize)

      const { data, pagination } = this.extractSalesAndPagination(response, {
        page,
        page_size: pageSize,
      })

      return {
        success: true,
        data,
        pagination,
      }
    } catch (error: any) {
      console.error('Error fetching sales by client ID:', error)
      return { success: false, error: error.message }
    }
  },

  async getSalesByClientName(name: string, page = 1, pageSize = 50) {
    if (IS_DEMO_MODE) {
      return DEMO_SALES_RESPONSE
    }
    try {
      const response = await apiClient.getSalesByClientName(name, page, pageSize)

      const { data, pagination } = this.extractSalesAndPagination(response, {
        page,
        page_size: pageSize,
      })

      return {
        success: true,
        data,
        pagination,
      }
    } catch (error: any) {
      console.error('Error fetching sales by client name:', error)
      return { success: false, error: error.message }
    }
  },

  async getPendingSalesByClient(clientId: string) {
    // Intentar endpoint específico de pendientes si existe
    try {
      const response = await apiClient.getSalesByClientId(clientId, 1, 100)
      // Filtrar pendientes en el cliente por ahora si el endpoint no lo hace
      const { data } = this.extractSalesAndPagination(response)
      return { 
        success: true, 
        data: data.filter((s: any) => s.sale?.status === 'PENDING' || s.status === 'PENDING') 
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getSaleById(id: string) {
    if (IS_DEMO_MODE) {
      const sale = (DEMO_SALES_PAYMENTS || []).find(s => String(s.id) === String(id));
      return { success: true, data: sale || DEMO_SALES_PAYMENTS[0] };
    }
    try {
      const response = await apiClient.getSaleById(id)
      return { success: true, data: response }
    } catch (error: any) {
      console.error(`Error fetching sale ${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  async getSaleMetadata(id: string) {
    try {
      const response = await apiClient.getSaleWithMetadata(id)
      return { success: true, data: response }
    } catch (error: any) {
      console.error(`Error fetching metadata for sale ${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  async getSalePaymentStatus(id: string) {
    try {
      const response = await apiClient.getSalePaymentStatus(id)
      return { success: true, data: response }
    } catch (error: any) {
      console.error(`Error fetching payment status for sale ${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  // ============ OPERACIONES CRUD ============

  async previewSaleCancellation(id: string) {
    try {
      const response = await apiClient.previewSaleCancellation(id)
      return response
    } catch (error: any) {
      console.error(`Error previewing cancellation for sale ${id}:`, error)
      throw error
    }
  },

  async createSale(saleData: SaleRequest) {
    if (IS_DEMO_MODE) {
      return {
        success: true,
        sale_id: `DEMO-SALE-${Date.now()}`,
        total_amount: 150000,
        items_processed: saleData.product_details?.length || 0,
        message: 'Venta demo creada exitosamente',
        data: { id: `DEMO-SALE-${Date.now()}`, status: 'PENDING' }
      }
    }
    try {
      // Validar con dominio antes de enviar
      const validation = validateSaleOrder(saleData);
      if (!validation.isValid) {
        return { success: false, error: 'Validación de dominio fallida', details: validation.errors };
      }

      const response = await apiClient.createSale(saleData)

      const saleId =
        response?.sale_id ||
        response?.id ||
        response?.data?.sale_id ||
        response?.data?.id

      return {
        success: true,
        data: response,
        sale_id: saleId,
        warnings: response?.warnings || response?.data?.warnings || [],
      }
    } catch (error: any) {
      console.error('Error creating sale:', error)
      return { success: false, error: error.message }
    }
  },

  async addProductsToSale(saleId: string, payload: AddProductsToSaleRequest) {
    try {
      const response = await apiClient.addProductsToSale(saleId, payload)
      return { success: true, data: response }
    } catch (error: any) {
      console.error(`Error adding products to sale ${saleId}:`, error)
      return { success: false, error: error.message }
    }
  },

  async revertSale(id: string, reason: string) {
    try {
      const response = await apiClient.cancelSale(id, reason)
      return { success: true, data: response }
    } catch (error: any) {
      console.error(`Error reverting sale ${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  // ============ DOMAIN HELPER ============

  calculateLocalTotals(items: any[]) {
    // Normalizar items para el dominio
    const domainItems = items.map(item => ({
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || item.sale_price || 0),
      discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
      discount_percent: item.discount_percent ? Number(item.discount_percent) : undefined,
      tax_rate: item.tax_rate ? Number(item.tax_rate) : undefined,
      price_includes_tax: item.price_includes_tax !== undefined ? Boolean(item.price_includes_tax) : true
    }));

    return calculateSaleTotals(domainItems);
  },

  // ============ ESTADÍSTICAS ============

  async getTodaySales() {
    const today = new Date().toISOString().split('T')[0]
    return this.getSalesByDateRange({ start_date: today, end_date: today })
  },

  async getSalesStats(params: any = {}) {
    try {
      const response = await apiClient.makeRequest('/sale/stats', {
        method: 'GET',
        params,
      })
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error fetching sales stats:', error)
      return { success: false, error: error.message }
    }
  },

  async getTopSellingProducts(params: any = {}) {
    try {
      const response = await apiClient.makeRequest('/sale/top-products', {
        method: 'GET',
        params,
      })
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error fetching top products:', error)
      return { success: false, error: error.message }
    }
  },
}

export default saleService
