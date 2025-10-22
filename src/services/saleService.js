/**
 * Servicio para la gestión de ventas en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de ventas
 * Implementa manejo de sesiones, pagos y POS según SALE_API.md
 */

import BusinessManagementAPI from './BusinessManagementAPI'
import { telemetryService } from './telemetryService'
import { MockDataService, MOCK_CONFIG } from '@/config/mockData'

// Configuración de timeouts y reintentos
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// 🔧 FIX: Utilidad para reintentos con backoff exponencial
// IMPORTANTE: El token se debe obtener DENTRO de cada intento, no fuera
// Esto asegura que si el token se renovó o cambió, se use el más reciente
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      // ✅ El token se obtiene DENTRO de fn() en cada iteración
      // No necesitamos pasarlo aquí, BusinessManagementAPI.makeRequest
      // ya lo obtiene fresco en cada llamada
      return await fn()
    } catch (error) {
      // No reintentar en errores 401 - significa que el token está mal/expirado
      if (
        error.code === 'UNAUTHORIZED' ||
        error.message?.includes('Sesión expirada')
      ) {
        console.error('🚫 Token inválido detectado, no se reintentará')
        throw error // Lanzar inmediatamente, no reintentar
      }

      // Para otros errores, reintentar con backoff exponencial
      if (i === attempts - 1) throw error

      const delay = RETRY_DELAY * Math.pow(2, i)
      console.log(`🔄 Reintento ${i + 1}/${attempts} en ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Fallback demo service usando sistema modular
const demoService = {
  getSales: async (params = {}) => {
    const response = await MockDataService.getSales({
      page: parseInt(params.page) || 1,
      pageSize: parseInt(params.limit || params.page_size) || 10,
      client_id: params.clientId,
      status: params.status,
      date_from: params.dateFrom || params.start_date,
      date_to: params.dateTo || params.end_date,
    })

    // Transformar a la estructura esperada por SALE_GET_BY_RANGE_API.md
    const transformedData = response.data.map(sale => ({
      sale: {
        sale_id:
          sale.id ||
          sale.sale_id ||
          `MOCK-${Math.random().toString(36).substr(2, 9)}`,
        client_id: sale.client_id,
        client_name: sale.client_name || 'Cliente Demo',
        sale_date: sale.sale_date || new Date().toISOString(),
        total_amount: sale.total_amount || 0,
        status: sale.status || 'PAID',
        user_id: 'demo-user',
        user_name: 'Usuario Demo',
        payment_method_id: 1,
        payment_method: sale.payment_method || 'Efectivo',
        currency_id: 1,
        currency: 'Guaraní Paraguayo',
        metadata: {
          discounts: [],
          price_changes: [],
          reserve_details: null,
        },
      },
      details: sale.items || [],
    }))

    return {
      ...response,
      data: transformedData,
    }
  },

  getSaleById: async id => {
    const salesResponse = await MockDataService.getSales({
      search: id.toString(),
    })
    const sale = salesResponse.data.find(s => s.id === parseInt(id))
    if (!sale) {
      throw new Error(`Sale with ID ${id} not found`)
    }
    return { success: true, data: sale }
  },

  createSale: async saleData => {
    // Para demo, simular creación
    const newSale = {
      id: Math.floor(Math.random() * 10000) + 5000,
      ...saleData,
      sale_date: new Date().toISOString(),
      status: saleData.status || 'completed',
      session_id: `sess_${Date.now()}`,
      payment_method: saleData.payment_method || 'cash',
      amount_paid: saleData.amount_paid || saleData.total_amount,
      change_amount: Math.max(
        0,
        (saleData.amount_paid || saleData.total_amount) - saleData.total_amount
      ),
    }

    return { success: true, data: newSale, sale_id: newSale.id }
  },

  getPendingSalesByClient: async clientId => {
    if (!clientId) {
      return { success: true, data: [] }
    }

    const response = await MockDataService.getSales({
      client_id: clientId,
    })

    const pendingSales = response.data
      .filter(sale => (sale.status || '').toUpperCase() === 'PENDING')
      .map(sale => ({
        sale_id:
          sale.id ||
          sale.sale_id ||
          `PENDING-${Math.random().toString(36).substr(2, 9)}`,
        client_id: sale.client_id,
        client_name: sale.client_name || 'Cliente Demo',
        sale_date: sale.sale_date || new Date().toISOString(),
        total_amount: sale.total_amount || 0,
        status: sale.status || 'PENDING',
        user_id: sale.user_id || 'demo-user',
        user_name: sale.user_name || 'Usuario Demo',
        payment_method_id: sale.payment_method_id || 1,
        payment_method: sale.payment_method || 'Efectivo',
        currency_id: sale.currency_id || 1,
        currency: sale.currency || 'PYG',
        details: sale.items || [],
        items: sale.items?.length || 0,
        subtotal_amount: sale.subtotal_amount || sale.total_amount || 0,
        tax_amount: sale.tax_amount || 0,
        discount_amount: sale.discount_amount || 0,
        has_discounts:
          Array.isArray(sale.items) &&
          sale.items.some(item =>
            Boolean(item.discount_amount || item.discount_percent)
          ),
        has_price_changes: false,
      }))

    return { success: true, data: pendingSales }
  },

  addProductsToSale: async (saleId, payload = {}) => {
    const productsCount = payload.product_details?.length || 0

    return {
      success: true,
      sale_id: saleId,
      products_added: productsCount,
      previous_total: 0,
      added_amount:
        payload.product_details?.reduce(
          (sum, item) => sum + (item.sale_price || 0),
          0
        ) || 0,
      new_total: 0,
      sale_status: 'PENDING',
      price_modifications_enabled: Boolean(payload.allow_price_modifications),
      has_price_changes: Boolean(payload.allow_price_modifications),
      has_discounts: payload.product_details?.some(
        item => item.discount_amount || item.discount_percent
      ),
      message: `Se agregaron ${productsCount} productos en modo demo`,
    }
  },
}

export const saleService = {
  // ============ SESIONES DE VENTA ============

  // Iniciar nueva sesión de venta
  startSaleSession: async (sessionData = {}) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.post('/sales/session/start', {
          user_id: sessionData.userId,
          pos_terminal_id: sessionData.posTerminalId || 'POS_001',
          ...sessionData,
        })
        telemetryService.recordMetric('sale_session_started', 1, {
          user_id: sessionData.userId,
          pos_terminal: sessionData.posTerminalId,
        })
        return response
      })
    } catch (error) {
      console.warn('API unavailable, using demo session')
      return {
        success: true,
        data: {
          session_id: `sess_${Date.now()}`,
          user_id: sessionData.userId,
          pos_terminal_id: sessionData.posTerminalId || 'POS_001',
          status: 'active',
          started_at: new Date().toISOString(),
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'sale_session_start_duration',
        endTime - startTime
      )
    }
  },

  // Finalizar sesión de venta
  endSaleSession: async (sessionId, summary = {}) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.post(
          `/sales/session/${sessionId}/end`,
          {
            total_sales: summary.totalSales || 0,
            total_amount: summary.totalAmount || 0,
            cash_collected: summary.cashCollected || 0,
            ...summary,
          }
        )
        telemetryService.recordMetric('sale_session_ended', 1, {
          session_id: sessionId,
          total_sales: summary.totalSales,
        })
        return response
      })
    } catch (error) {
      console.warn('API unavailable, using demo session end')
      return {
        success: true,
        data: {
          session_id: sessionId,
          status: 'closed',
          ended_at: new Date().toISOString(),
          summary: summary,
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'sale_session_end_duration',
        endTime - startTime
      )
    }
  },

  // Obtener información de sesión activa
  getActiveSession: async userId => {
    try {
      return await withRetry(async () => {
        return await apiService.get(`/sales/session/active?user_id=${userId}`)
      })
    } catch (error) {
      console.warn('API unavailable, no active session')
      return { success: false, error: 'No active session found' }
    }
  },

  // ============ PROCESAMIENTO DE PAGOS ============

  // Procesar pago con cálculo automático de cambio según SALE_API.md
  processPayment: async (saleId, paymentData) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        // Mapear datos al formato correcto de SALE_API.md
        const requestData = {
          sale_order_id: saleId, // Usar nombre correcto del campo
          payment_method_id: paymentData.payment_method_id || 1,
          amount: paymentData.amount || paymentData.amountPaid,
          currency_id: paymentData.currency_id || 1,
          reference_number:
            paymentData.reference_number || paymentData.reference || null,
          notes: paymentData.notes || null,
        }

        // Usar endpoint correcto según SALE_API.md
        const response = await apiService.post('/sales/payments', requestData)

        telemetryService.recordMetric('payment_processed_unified', 1, {
          sale_id: saleId,
          amount_received: requestData.amount_received,
          requires_change: response.requires_change,
          change_amount: response.payment_details?.change_amount || 0,
        })

        return response
      })
    } catch (error) {
      console.warn('API unavailable, simulating payment processing')

      // Demo: simular procesamiento de pago
      const sale = DEMO_CONFIG_SALES.find(s => s.id === parseInt(saleId))
      if (!sale) {
        throw new Error(`Sale with ID ${saleId} not found`)
      }

      const amountReceived =
        paymentData.amountPaid || paymentData.amount_received
      const changeAmount = Math.max(0, amountReceived - sale.total_amount)

      return {
        success: true,
        payment_id: Math.floor(Math.random() * 10000),
        sale_id: saleId,
        client_name: 'Cliente Demo',
        payment_details: {
          total_due: sale.total_amount,
          amount_received: amountReceived,
          change_amount: changeAmount,
          currency_code: 'MXN',
          payment_method: 'Efectivo',
          payment_reference: paymentData.reference || null,
        },
        message: 'Payment processed successfully (demo mode)',
        requires_change: changeAmount > 0,
        processed_at: new Date().toISOString(),
        processed_by: 'Demo User',
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'payment_processing_duration',
        endTime - startTime
      )
    }
  },

  // Calcular cambio
  calculateChange: async (totalAmount, amountPaid) => {
    try {
      return await withRetry(async () => {
        return await apiService.post('/sales/calculate-change', {
          total_amount: totalAmount,
          amount_paid: amountPaid,
        })
      })
    } catch (error) {
      console.warn('API unavailable, calculating change locally')
      const changeAmount = Math.max(0, amountPaid - totalAmount)
      return {
        success: true,
        data: {
          total_amount: totalAmount,
          amount_paid: amountPaid,
          change_amount: changeAmount,
          is_exact: changeAmount === 0,
        },
      }
    }
  },

  // ============ CRUD OPERATIONS ============

  // Obtener ventas por rango de fechas según SALE_GET_BY_RANGE_API.md
  // ACTUALIZADO: Usa query parameters (estándar HTTP correcto)
  getSalesByDateRange: async (params = {}) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const api = new BusinessManagementAPI()

        // Validar parámetros según documentación
        const page = Math.max(1, parseInt(params.page || 1))
        const pageSize = Math.min(
          100,
          Math.max(1, parseInt(params.page_size || params.limit || 50))
        )
        const startDate = params.start_date || params.dateFrom
        const endDate = params.end_date || params.dateTo

        // Validar que las fechas requeridas estén presentes
        if (!startDate || !endDate) {
          throw new Error('start_date and end_date are required')
        }

        // Construir query parameters usando URLSearchParams (estándar HTTP)
        const queryParams = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          page: page.toString(),
          page_size: pageSize.toString(),
        })

        // GET con query parameters (estándar HTTP correcto)
        const response = await api.makeRequest(
          `/sale/date_range/?${queryParams.toString()}`,
          {
            method: 'GET',
            // 🔧 FIX: NO pasar headers explícitos - se agregan automáticamente
          }
        )

        telemetryService.recordMetric(
          'sales_fetched_by_date_range',
          response?.data?.length || 0
        )

        // 🔧 NORMALIZAR: Backend cambió estructura de respuesta
        // Antes: { id, client_name, status, ... }
        // Ahora: { sale: { sale_id, client_name, status, ... }, details: [...] }
        const normalizedData =
          response?.data?.map(item => {
            // Si tiene estructura anidada, aplanarla
            if (item.sale) {
              return {
                id: item.sale.sale_id,
                client_id: item.sale.client_id,
                client_name: item.sale.client_name,
                sale_date: item.sale.sale_date,
                total_amount: item.sale.total_amount,
                status: item.sale.status,
                user_id: item.sale.user_id,
                user_name: item.sale.user_name,
                payment_method_id: item.sale.payment_method_id,
                payment_method: item.sale.payment_method,
                created_at: item.sale.created_at,
                updated_at: item.sale.updated_at,
                remaining_balance: item.sale.remaining_balance,
                total_paid: item.sale.total_paid,
                // Preservar details si existen
                details: item.details || [],
              }
            }
            // Si ya está en formato plano, retornar como está
            return item
          }) || []

        // Respuesta con paginación según SALE_GET_BY_RANGE_API.md
        return {
          success: true,
          data: normalizedData,
          pagination: response?.pagination || {
            page: page,
            page_size: pageSize,
            total_records: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        }
      })
    } catch (error) {
      console.warn(
        '🔄 Sales date range API unavailable, using modular mock data...'
      )
      telemetryService.recordMetric('sales_mock_fallback', 1)

      const result = await demoService.getSales(params)

      if (MOCK_CONFIG.development?.verbose) {
        console.log(
          '✅ Sales loaded from modular mock system:',
          result.data.length
        )
      }

      return result
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_sales_by_date_range_duration',
        endTime - startTime
      )
    }
  },

  // Obtener ventas del día actual
  getTodaySales: async (params = {}) => {
    const startTime = performance.now()
    try {
      // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayDate = `${year}-${month}-${day}`

      return await saleService.getSalesByDateRange({
        start_date: todayDate,
        end_date: todayDate,
        page: params.page || 1,
        page_size: params.page_size || params.limit || 50,
      })
    } catch (error) {
      console.warn('API unavailable, filtering demo sales for today')
      // También usar fecha local en el fallback
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayDate = `${year}-${month}-${day}`
      const todaySales = DEMO_CONFIG_SALES.filter(sale =>
        sale.sale_date.startsWith(todayDate)
      )
      return {
        success: true,
        data: todaySales,
        summary: {
          count: todaySales.length,
          total_revenue: todaySales.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          ),
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_today_sales_duration',
        endTime - startTime
      )
    }
  },

  // Obtener ventas por nombre de cliente
  getSalesByClientName: async (clientName, params = {}) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const api = new BusinessManagementAPI()

        // Validar parámetros
        const page = Math.max(1, parseInt(params.page || 1))
        const pageSize = Math.min(
          100,
          Math.max(1, parseInt(params.page_size || 50))
        )

        if (!clientName || clientName.trim() === '') {
          throw new Error('client name is required')
        }

        // Construir query parameters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        })

        // Codificar el nombre del cliente para caracteres especiales
        const encodedName = encodeURIComponent(clientName.trim())

        // GET con nombre en la ruta y paginación en query params
        const response = await api.makeRequest(
          `/sale/client_name/${encodedName}?${queryParams.toString()}`,
          {
            method: 'GET',
            // 🔧 FIX: NO pasar headers explícitos - se agregan automáticamente
          }
        )

        telemetryService.recordMetric(
          'sales_fetched_by_client_name',
          response?.data?.length || 0
        )

        return {
          success: true,
          data: response?.data || [],
          pagination: response?.pagination || {
            page: page,
            page_size: pageSize,
            total_records: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        }
      })
    } catch (error) {
      console.warn(
        `🔄 Sales client name search API unavailable for "${clientName}", using modular mock data...`
      )
      telemetryService.recordMetric('sales_client_name_mock_fallback', 1)

      // Filtrar mock data por nombre de cliente (case-insensitive partial search)
      const searchLower = clientName.toLowerCase()
      const result = await demoService.getSales({
        ...params,
        clientName: searchLower,
      })

      // Filtrar por nombre
      const filteredData = result.data.filter(saleData => {
        const sale = saleData.sale || saleData
        const name = sale.client_name || ''
        return name.toLowerCase().includes(searchLower)
      })

      if (MOCK_CONFIG.development?.verbose) {
        console.log(
          `✅ Sales filtered by client name "${clientName}":`,
          filteredData.length
        )
      }

      return {
        ...result,
        data: filteredData,
        pagination: {
          ...result.pagination,
          total_records: filteredData.length,
          total_pages: Math.ceil(
            filteredData.length / (params.page_size || 50)
          ),
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_sales_by_client_name_duration',
        endTime - startTime
      )
    }
  },

  // DEPRECATED: Usar getSalesByDateRange en su lugar
  getSales: async (params = {}) => {
    console.warn('⚠️  getSales is deprecated. Use getSalesByDateRange instead.')
    return await saleService.getSalesByDateRange(params)
  },

  // Obtener una venta por ID según SALE_API.md
  getSaleById: async id => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.get(`/sales/orders/${id}`)
        telemetryService.recordMetric('sale_fetched_by_id', 1, { sale_id: id })
        return response
      })
    } catch (error) {
      console.warn(
        `🔄 Sale API unavailable for ID ${id}, using modular mock data...`
      )
      const result = await demoService.getSaleById(id)

      if (MOCK_CONFIG.development?.verbose) {
        console.log(`✅ Sale ${id} loaded from modular mock system`)
      }

      return result
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_sale_by_id_duration',
        endTime - startTime
      )
    }
  },

  // Crear una nueva venta usando API unificada según SALE_WITH_DISCOUNT_API.md
  createSale: async saleData => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        // Validar estructura según la nueva API
        if (!saleData.client_id) {
          throw new Error('client_id es requerido')
        }
        if (
          !saleData.product_details ||
          !Array.isArray(saleData.product_details) ||
          saleData.product_details.length === 0
        ) {
          throw new Error(
            'product_details es requerido y debe contener al menos un producto'
          )
        }

        // Transformar datos al formato esperado por la nueva API
        const requestData = {
          client_id: saleData.client_id,
          product_details: saleData.product_details.map(item => {
            const productDetail = {
              product_id: item.product_id,
              quantity: item.quantity,
            }

            // Solo incluir campos opcionales si tienen valores
            if (item.tax_rate_id) {
              productDetail.tax_rate_id = item.tax_rate_id
            }
            if (item.sale_price) {
              productDetail.sale_price = item.sale_price
            }
            if (item.price_change_reason) {
              productDetail.price_change_reason = item.price_change_reason
            }
            if (item.discount_amount) {
              productDetail.discount_amount = item.discount_amount
            }
            if (item.discount_percent) {
              productDetail.discount_percent = item.discount_percent
            }
            if (item.discount_reason) {
              productDetail.discount_reason = item.discount_reason
            }

            return productDetail
          }),
          payment_method_id: saleData.payment_method_id || 1,
          currency_id: saleData.currency_id || 1,
          allow_price_modifications:
            saleData.allow_price_modifications || false,
        }

        // Solo incluir campos opcionales de nivel superior si tienen valores
        if (saleData.sale_id) {
          requestData.sale_id = saleData.sale_id
        }
        if (saleData.reserve_id) {
          requestData.reserve_id = saleData.reserve_id
        }

        // Validar que si hay descuentos, tienen justificación
        for (const item of requestData.product_details) {
          if (
            (item.discount_amount || item.discount_percent) &&
            !item.discount_reason
          ) {
            throw new Error(
              `Se requiere justificación para el descuento aplicado al producto ${item.product_id}`
            )
          }
        }

        // Log específico para reservas y descuentos
        if (requestData.reserve_id) {
          console.log('📋 Creating sale with reservation:', {
            reserve_id: requestData.reserve_id,
            client_id: requestData.client_id,
          })
        }

        const hasDiscounts = requestData.product_details.some(
          item =>
            item.discount_amount || item.discount_percent || item.sale_price
        )
        if (hasDiscounts) {
          console.log('💰 Creating sale with price modifications/discounts')
        }

        // Log completo del payload enviado al backend
        console.log('📤 Complete payload being sent to backend:')
        console.log(JSON.stringify(requestData, null, 2))

        const api = new BusinessManagementAPI()
        // ACTUALIZADO: Usar /sale/ según SALE_GET_BY_RANGE_API.md
        // 🔧 FIX: NO pasar headers explícitos - defaultHeaders ya incluye Content-Type
        // y authHeaders se agrega automáticamente. Si pasamos headers aquí,
        // sobrescribe el Authorization header.
        const response = await api.makeRequest('/sale/', {
          method: 'POST',
          body: JSON.stringify(requestData),
        })

        telemetryService.recordMetric('sale_created_with_discounts', 1, {
          total_amount: response.total_amount || 0,
          items_processed: requestData.product_details?.length || 0,
          has_discounts: response.has_discounts || false,
          has_price_changes: response.has_price_changes || false,
          reserve_processed: response.reserve_processed || false,
        })

        return response
      })
    } catch (error) {
      console.error('❌ Error creating sale:', error)

      // Re-lanzar el error para que el frontend lo maneje apropiadamente
      throw error
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric('create_sale_duration', endTime - startTime)
    }
  },

  // Obtener ventas pendientes por cliente según PENDING_SALE_BY_CLIENT.md
  getPendingSalesByClient: async clientId => {
    const startTime = performance.now()

    try {
      if (!clientId) {
        return { success: true, data: [] }
      }

      return await withRetry(async () => {
        const api = new BusinessManagementAPI()
        const encodedClient = encodeURIComponent(clientId)
        const response = await api.makeRequest(
          `/sale/client_id/${encodedClient}/pending`,
          {
            method: 'GET',
          }
        )

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : []

        telemetryService.recordMetric('pending_sales_fetched', data.length, {
          client_id: clientId,
        })

        return { success: true, data }
      })
    } catch (error) {
      console.warn(
        `🔄 Pending sales API unavailable for client ${clientId}, using mock data...`
      )
      telemetryService.recordMetric('pending_sales_mock_fallback', 1, {
        client_id: clientId,
      })
      return await demoService.getPendingSalesByClient(clientId)
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_pending_sales_duration',
        endTime - startTime
      )
    }
  },

  // Agregar productos a una venta existente según ADD_PRODUCT_TO_SALE.md
  addProductsToSale: async (saleId, payload = {}) => {
    const startTime = performance.now()

    try {
      if (!saleId) {
        throw new Error('saleId es requerido para agregar productos')
      }

      if (!payload.product_details || payload.product_details.length === 0) {
        throw new Error('Se debe proporcionar al menos un producto')
      }

      return await withRetry(async () => {
        const api = new BusinessManagementAPI()
        const encodedSaleId = encodeURIComponent(saleId)

        const requestBody = {
          product_details: payload.product_details,
          allow_price_modifications: Boolean(payload.allow_price_modifications),
        }

        const response = await api.makeRequest(
          `/sale/${encodedSaleId}/products`,
          {
            method: 'POST',
            body: JSON.stringify(requestBody),
          }
        )

        telemetryService.recordMetric(
          'sale_products_added',
          payload.product_details.length,
          {
            sale_id: saleId,
            allow_price_modifications: requestBody.allow_price_modifications,
          }
        )

        return response
      })
    } catch (error) {
      console.error(`Error adding products to sale ${saleId}:`, error)
      throw error
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'add_products_to_sale_duration',
        endTime - startTime
      )
    }
  },

  // Actualizar una venta existente
  updateSale: async (id, saleData) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}`, saleData)
        telemetryService.recordMetric('sale_updated', 1, { sale_id: id })
        return response
      })
    } catch (error) {
      console.warn(`API unavailable, cannot update sale ${id}`)
      throw new Error('Sale update unavailable in offline mode')
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric('update_sale_duration', endTime - startTime)
    }
  },

  // ============ REVERSIÓN DE VENTAS según REVERT_SALE_API.md ============

  // Vista previa de reversión de venta
  previewSaleCancellation: async saleId => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const api = new BusinessManagementAPI()
        // Ruta correcta según documentación actualizada
        const response = await api.makeRequest(
          `/sale/${saleId}/preview-cancellation`,
          {
            method: 'GET',
          }
        )

        telemetryService.recordMetric('sale_reversion_previewed', 1, {
          sale_id: saleId,
          total_products: response.summary?.total_products || 0,
          total_refund: response.summary?.total_refund || 0,
        })

        return response
      })
    } catch (error) {
      console.warn(
        `API unavailable, cannot preview sale cancellation for ${saleId}`
      )

      // Demo fallback
      return {
        success: true,
        sale: {
          id: saleId,
          status: 'PAID',
          total_amount: 1625000.0,
          client_id: 'CLI001',
          sale_date: new Date().toISOString(),
        },
        products: [
          {
            product_id: 'PROD001',
            product_name: 'Producto Demo',
            product_type: 'PHYSICAL',
            quantity: 2.0,
            unit_price: 812500.0,
            will_restore_stock: true,
            will_revert_reserve: false,
            reserve_id: null,
          },
        ],
        reserves: [],
        payments: [
          {
            payment_id: 1,
            amount_received: 1625000.0,
            payment_date: new Date().toISOString(),
            status: 'COMPLETED',
          },
        ],
        summary: {
          total_products: 1,
          stock_movements: 1,
          reserves_to_handle: 0,
          payments_to_refund: 1,
          total_refund: 1625000.0,
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'preview_sale_cancellation_duration',
        endTime - startTime
      )
    }
  },

  // Ejecutar reversión de venta
  revertSale: async (saleId, reason = 'Manual cancellation from API') => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const api = new BusinessManagementAPI()
        // Ruta correcta según documentación actualizada
        // 🔧 FIX: NO pasar headers explícitos - se agregan automáticamente
        const response = await api.makeRequest(`/sale/${saleId}`, {
          method: 'PUT',
          body: JSON.stringify({ reason }),
        })

        telemetryService.recordMetric('sale_reverted', 1, {
          sale_id: saleId,
          has_reason: !!reason,
        })

        return response
      })
    } catch (error) {
      console.error(`Error reverting sale ${saleId}:`, error)

      // Re-lanzar el error para que el frontend lo maneje
      throw error
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric('revert_sale_duration', endTime - startTime)
    }
  },

  // Preview de impacto de cancelación según SALE_API.md (DEPRECATED - usar previewSaleCancellation)
  previewCancellation: async saleId => {
    console.warn(
      '⚠️  previewCancellation is deprecated. Use previewSaleCancellation instead.'
    )
    return await saleService.previewSaleCancellation(saleId)
  },

  // Cancelar una venta con reversión mejorada según SALE_API.md (DEPRECATED - usar revertSale)
  cancelSale: async (id, reason = '') => {
    console.warn('⚠️  cancelSale is deprecated. Use revertSale instead.')
    return await saleService.revertSale(id, reason)
  },

  // Completar una venta
  completeSale: async (id, paymentData = {}) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}/complete`, {
          payment_method: paymentData.paymentMethod || 'cash',
          amount_paid: paymentData.amountPaid,
          completed_at: new Date().toISOString(),
          ...paymentData,
        })
        telemetryService.recordMetric('sale_completed', 1, {
          sale_id: id,
          payment_method: paymentData.paymentMethod,
        })
        return response
      })
    } catch (error) {
      console.warn(`API unavailable, cannot complete sale ${id}`)
      throw new Error('Sale completion unavailable in offline mode')
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'complete_sale_duration',
        endTime - startTime
      )
    }
  },

  // Procesar reembolso
  refundSale: async (id, refundData) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}/refund`, {
          refund_amount: refundData.refundAmount,
          refund_reason: refundData.refundReason,
          refund_method: refundData.refundMethod || 'original',
          refunded_at: new Date().toISOString(),
          ...refundData,
        })
        telemetryService.recordMetric('sale_refunded', 1, {
          sale_id: id,
          refund_amount: refundData.refundAmount,
        })
        return response
      })
    } catch (error) {
      console.warn(`API unavailable, cannot refund sale ${id}`)
      throw new Error('Sale refund unavailable in offline mode')
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric('refund_sale_duration', endTime - startTime)
    }
  },

  // Obtener ventas por cliente
  getSalesByClient: async (clientId, params = {}) => {
    const startTime = performance.now()
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
        status: params.status || '',
      }).toString()

      return await withRetry(async () => {
        const response = await apiService.get(
          `/clients/${clientId}/sales?${queryParams}`
        )
        telemetryService.recordMetric(
          'client_sales_fetched',
          response.data?.length || 0,
          { client_id: clientId }
        )
        return response
      })
    } catch (error) {
      console.warn(
        `API unavailable, filtering demo sales by client ${clientId}`
      )
      const clientSales = DEMO_CONFIG_SALES.filter(
        sale => sale.client_id === parseInt(clientId)
      )
      return {
        success: true,
        data: clientSales,
        pagination: {
          total: clientSales.length,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_sales_by_client_duration',
        endTime - startTime
      )
    }
  },

  // Obtener estadísticas de ventas
  getSalesStats: async (params = {}) => {
    const startTime = performance.now()
    try {
      const queryParams = new URLSearchParams({
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
        group_by: params.groupBy || 'day',
        metric: params.metric || 'total',
      }).toString()

      return await withRetry(async () => {
        return await apiService.get(`/sales/statistics?${queryParams}`)
      })
    } catch (error) {
      console.warn('API unavailable, calculating demo statistics')

      // Estadísticas locales básicas
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      const thisWeekStart = new Date(
        today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
      )
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      const completedSales = DEMO_CONFIG_SALES.filter(
        sale => sale.status === 'completed'
      )
      const todaySales = completedSales.filter(sale =>
        sale.sale_date.startsWith(todayString)
      )
      const weekSales = completedSales.filter(
        sale => new Date(sale.sale_date) >= thisWeekStart
      )
      const monthSales = completedSales.filter(
        sale => new Date(sale.sale_date) >= thisMonthStart
      )

      return {
        success: true,
        data: {
          total_sales: completedSales.length,
          total_revenue: completedSales.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          ),
          today_sales: todaySales.length,
          today_revenue: todaySales.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          ),
          week_sales: weekSales.length,
          week_revenue: weekSales.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          ),
          month_sales: monthSales.length,
          month_revenue: monthSales.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          ),
          average_order_value:
            completedSales.length > 0
              ? completedSales.reduce(
                  (sum, sale) => sum + sale.total_amount,
                  0
                ) / completedSales.length
              : 0,
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_sales_stats_duration',
        endTime - startTime
      )
    }
  },

  // Obtener productos más vendidos
  getTopSellingProducts: async (params = {}) => {
    const startTime = performance.now()
    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 10,
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
      }).toString()

      return await withRetry(async () => {
        return await apiService.get(`/sales/top-products?${queryParams}`)
      })
    } catch (error) {
      console.warn('API unavailable, calculating top products from demo data')

      // Calcular productos más vendidos localmente
      const productSales = {}
      DEMO_CONFIG_SALE_ITEMS.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            product_id: item.product_id,
            total_quantity: 0,
            total_revenue: 0,
            sales_count: 0,
          }
        }
        productSales[item.product_id].total_quantity += item.quantity
        productSales[item.product_id].total_revenue +=
          item.unit_price * item.quantity
        productSales[item.product_id].sales_count += 1
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, params.limit || 10)

      return {
        success: true,
        data: topProducts,
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_top_products_duration',
        endTime - startTime
      )
    }
  },

  // Obtener ventas recientes
  getRecentSales: async (limit = 10) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        return await apiService.get(`/sales/recent?limit=${limit}`)
      })
    } catch (error) {
      console.warn('API unavailable, using demo recent sales')
      const recentSales = DEMO_CONFIG_SALES.sort(
        (a, b) => new Date(b.sale_date) - new Date(a.sale_date)
      ).slice(0, limit)
      return {
        success: true,
        data: recentSales,
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'get_recent_sales_duration',
        endTime - startTime
      )
    }
  },

  // Buscar ventas
  searchSales: async (query, searchType = 'all') => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        return await apiService.get(
          `/sales/search?q=${encodeURIComponent(query)}&type=${searchType}`
        )
      })
    } catch (error) {
      console.warn('API unavailable, searching demo sales')
      const queryLower = query.toLowerCase()
      const filteredSales = DEMO_CONFIG_SALES.filter(sale => {
        return (
          sale.id.toString().includes(queryLower) ||
          sale.total_amount.toString().includes(queryLower) ||
          sale.status.toLowerCase().includes(queryLower) ||
          sale.payment_method.toLowerCase().includes(queryLower)
        )
      })
      return {
        success: true,
        data: filteredSales,
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'search_sales_duration',
        endTime - startTime
      )
    }
  },

  // DEPRECATED: Esta funcionalidad debe manejarse por separado
  // - Crear venta usando createSale()
  // - Crear reserva usando reservationService.createReservation()
  // - Mantener referencia entre ambas si es necesario
  createSaleWithReservation: async () => {
    console.warn(
      '⚠️  createSaleWithReservation is deprecated. Handle sales and reservations separately.'
    )
    throw new Error(
      'This method has been deprecated. Please create sales and reservations separately for better separation of concerns.'
    )
  },

  // Obtener detalles expandidos de una venta
  getSaleDetails: async id => {
    return await apiService.get(`/ventas/${id}/detalles`)
  },

  // Generar factura de venta
  generateInvoice: async (id, format = 'pdf') => {
    return await apiService.get(`/ventas/${id}/factura?format=${format}`, {
      responseType: 'blob',
    })
  },

  // Aplicar descuento a venta
  applyDiscount: async (id, discountData) => {
    return await apiService.put(`/ventas/${id}/descuento`, discountData)
  },

  // Calcular total con impuestos
  calculateTotal: async (items, clientId = null) => {
    const startTime = performance.now()
    try {
      return await withRetry(async () => {
        return await apiService.post('/sales/calculate-total', {
          items,
          client_id: clientId,
        })
      })
    } catch (error) {
      console.warn('API unavailable, calculating total locally')

      // Cálculo local de totales
      const subtotal = items.reduce((sum, item) => {
        return sum + item.quantity * item.unit_price
      }, 0)

      const taxRate = 0.16 // IVA 16%
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount

      return {
        success: true,
        data: {
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          tax_rate: taxRate,
        },
      }
    } finally {
      const endTime = performance.now()
      telemetryService.recordMetric(
        'calculate_total_duration',
        endTime - startTime
      )
    }
  },

  // ============ INTEGRACIÓN POS ============

  // Sincronizar con terminal POS
  syncPOSTerminal: async terminalId => {
    try {
      return await withRetry(async () => {
        return await apiService.post(`/pos/sync/${terminalId}`)
      })
    } catch (error) {
      console.warn('POS sync unavailable, using offline mode')
      return {
        success: true,
        data: {
          terminal_id: terminalId,
          status: 'offline',
          last_sync: new Date().toISOString(),
          mode: 'offline',
        },
      }
    }
  },

  // Obtener configuración POS
  getPOSConfig: async terminalId => {
    try {
      return await withRetry(async () => {
        return await apiService.get(`/pos/config/${terminalId}`)
      })
    } catch (error) {
      console.warn('POS config unavailable, using default config')
      return {
        success: true,
        data: {
          terminal_id: terminalId,
          receipt_printer: true,
          cash_drawer: true,
          barcode_scanner: false,
          payment_methods: ['cash', 'card', 'transfer'],
          currency: 'MXN',
          tax_rate: 0.16,
        },
      }
    }
  },
}

export default saleService
