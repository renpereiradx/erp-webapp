/**
 * Servicio de Gestión de Ventas
 * Proporciona una interfaz limpia para interactuar con la API de ventas
 * Implementa patrones descritos en SALE_API.md y SALE_PAYMENT_API.md
 */

import { apiClient } from './api'
import { DEMO_SALES_RESPONSE, IS_DEMO_MODE } from '@/config/demoSalePayments'
import { 
  SaleRequest, 
  AddProductsToSaleRequest
} from '@/types'
import { validateSaleOrder } from '@/domain/sale/validators/saleValidator'
import { calculateSaleTotals } from '@/domain/sale/calculations/saleCalculator'
import { extractListResponse } from '@/utils/extractListResponse'

export const saleService = {
  extractSalesAndPagination(response: any, fallback: any = {}) {
    return extractListResponse(
      response,
      {
        itemKeys: ['sales'],
        isSingleItem: r => r.sale_id || r.id,
        pageSizeFallbackKeys: ['page_size', 'pageSize'],
        extraTotalKeys: ['total_count'],
        includeLegacyPaginationKeys: true,
      },
      fallback,
    )
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

  async getSalesByClientName(name: string, page = 1, pageSize = 50, filters: any = {}) {
    if (IS_DEMO_MODE) {
      return DEMO_SALES_RESPONSE
    }
    try {
      const response = await apiClient.getSalesByClientName(name, page, pageSize)

      let { data, pagination } = this.extractSalesAndPagination(response, {
        page,
        page_size: pageSize,
      })

      // Filtrado local por fechas si se proporcionan y el API no las soporta nativamente
      if (filters.start_date || filters.end_date) {
        const startStr = filters.start_date ? filters.start_date : null;
        const endStr = filters.end_date ? filters.end_date : null;

        data = data.filter((sale: any) => {
          const saleDateStr = sale.sale_date || sale.issue_date || sale.date;
          if (!saleDateStr) return true;
          
          // Normalizar fecha de la venta a YYYY-MM-DD
          const saleDatePart = saleDateStr.split('T')[0];
          
          if (startStr && saleDatePart < startStr) return false;
          if (endStr && saleDatePart > endStr) return false;
          return true;
        });
      }

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

  async getPendingSalesByClient(clientId: string, clientName?: string) {
    const onlyPending = (rawSales: any[]) =>
      rawSales.filter((s: any) => {
        const status = (s.sale?.status || s.status || '').toUpperCase()
        return status === 'PENDING'
      })

    // 1) Intentar por el nuevo endpoint especifico
    try {
      const response = await apiClient.getPendingSalesByClientId(clientId)
      const { data } = this.extractSalesAndPagination(response)
      return { success: true, data: data }
    } catch (errorPendingEndpoint: any) {
      // Si el endpoint no existe aun, hacemos fallback a filtrar manualmente
      try {
        const response = await apiClient.getSalesByClientId(clientId, 1, 100)
        const { data } = this.extractSalesAndPagination(response)
        return { success: true, data: onlyPending(data) }
      } catch (errorById: any) {
        const notFoundById =
          String(errorById?.message || '')
            .toLowerCase()
            .includes('not found') ||
          String(errorById?.message || '')
            .toLowerCase()
            .includes('endpoint')

        // 2) Fallback por client_name si tenemos nombre
        if (notFoundById && clientName) {
          try {
            const byName = await apiClient.getSalesByClientName(clientName, 1, 100)
            const { data } = this.extractSalesAndPagination(byName)
            return { success: true, data: onlyPending(data) }
          } catch (errorByName) {
            console.warn('Fallback by client_name failed:', errorByName)
          }
        }

        // 3) Fallback final por rango de fechas y filtro local
        try {
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(endDate.getDate() - 90)

          const fallback = await apiClient.getSalesByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            1,
            200,
          )

          const { data } = this.extractSalesAndPagination(fallback)
          const filteredByClient = data.filter((s: any) => {
            const saleClientId = String(
              s.sale?.client_id || s.client_id || s.clientId || '',
            )
            const saleClientName = String(s.sale?.client_name || s.client_name || '')

            if (saleClientId && String(clientId)) {
              return saleClientId === String(clientId)
            }
            if (clientName) {
              return saleClientName.toLowerCase() === String(clientName).toLowerCase()
            }
            return false
          })

          return { success: true, data: onlyPending(filteredByClient) }
        } catch (fallbackError: any) {
          return { success: false, error: fallbackError.message || errorById?.message }
        }
      }
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

  async addProductsToSale(saleId: string, payload: AddProductsToSaleRequest, branchId?: number | string) {
    try {
      const headers: Record<string, string> = {}
      if (branchId) {
        headers['X-Branch-ID'] = String(branchId)
      }
      const response = await apiClient.addProductsToSale(saleId, payload, { headers })
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

  async completeSale(id: string, paymentData: any) {
    return this.processPayment(id, paymentData)
  },

  async calculateTotal(items: any[], _clientId: string | null = null) {
    try {
      const totals = this.calculateLocalTotals(items)
      return { success: true, data: totals }
    } catch (error: any) {
      console.error('Error calculating total:', error)
      return { success: false, error: error.message }
    }
  },

  // ============ DOMAIN HELPER ============

  calculateLocalTotals(items: any[]) {
    // Normalizar items para el dominio
    const domainItems = items.map(item => ({
      quantity: Number(item.quantity || 0),
      unit_price: (() => {
        const original = Number(item.originalPrice)
        const current = Number(item.price || item.unit_price || item.sale_price || 0)
        const hasInputDiscount = Number(item.discountInput || 0) > 0
        const hasDerivedDiscount = Number.isFinite(original) && original > 0 && current < original
        if ((hasInputDiscount || hasDerivedDiscount) && Number.isFinite(original) && original > 0) {
          return original
        }
        return current
      })(),
      discount_amount:
        item.discount_amount
          ? Number(item.discount_amount)
          : item.discountType === 'amount'
            ? Number(item.discountInput)
            : undefined,
      discount_percent:
        item.discount_percent
          ? Number(item.discount_percent)
          : item.discountType === 'percent'
            ? Number(item.discountInput)
            : undefined,
      tax_rate: item.taxRate !== undefined ? Number(item.taxRate) : (item.tax_rate ? Number(item.tax_rate) : undefined),
      price_includes_tax: item.price_includes_tax !== undefined ? Boolean(item.price_includes_tax) : true
    }));

    return calculateSaleTotals(domainItems);
  },

  // ============ ESTADÍSTICAS ============

  async getTodaySales() {
    const today = new Date().toISOString().split('T')[0]
    return this.getSalesByDateRange({ start_date: today, end_date: today })
  },

  async salesScan(barcode: string, branchId?: number) {
    try {
      const response = await apiClient.salesScan(barcode, branchId)
      return { success: true, data: response }
    } catch (error: any) {
      console.error('Error scanning barcode in saleService:', error)
      return { success: false, error: error.message }
    }
  },
}

export default saleService
