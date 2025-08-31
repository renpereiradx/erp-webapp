/**
 * Servicio para la gestión de ventas en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de ventas
 * Implementa manejo de sesiones, pagos y POS según SALE_API.md
 */

import { apiService } from './api';
import { telemetryService } from './telemetryService';
import { MockDataService, MOCK_CONFIG } from '@/config/mockData';

// Configuración de timeouts y reintentos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Utilidad para reintentos con backoff exponencial
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
    }
  }
};

// Fallback demo service usando sistema modular
const demoService = {
  getSales: async (params = {}) => {
    return await MockDataService.getSales({
      page: parseInt(params.page) || 1,
      pageSize: parseInt(params.limit) || 10,
      client_id: params.clientId,
      status: params.status,
      date_from: params.dateFrom,
      date_to: params.dateTo
    });
  },
  
  getSaleById: async (id) => {
    const salesResponse = await MockDataService.getSales({ search: id.toString() });
    const sale = salesResponse.data.find(s => s.id === parseInt(id));
    if (!sale) {
      throw new Error(`Sale with ID ${id} not found`);
    }
    return { success: true, data: sale };
  },
  
  createSale: async (saleData) => {
    // Para demo, simular creación
    const newSale = {
      id: Math.floor(Math.random() * 10000) + 5000,
      ...saleData,
      sale_date: new Date().toISOString(),
      status: saleData.status || 'completed',
      session_id: `sess_${Date.now()}`,
      payment_method: saleData.payment_method || 'cash',
      amount_paid: saleData.amount_paid || saleData.total_amount,
      change_amount: Math.max(0, (saleData.amount_paid || saleData.total_amount) - saleData.total_amount)
    };
    
    return { success: true, data: newSale, sale_id: newSale.id };
  }
};

export const saleService = {
  // ============ SESIONES DE VENTA ============
  
  // Iniciar nueva sesión de venta
  startSaleSession: async (sessionData = {}) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.post('/sales/session/start', {
          user_id: sessionData.userId,
          pos_terminal_id: sessionData.posTerminalId || 'POS_001',
          ...sessionData
        });
        telemetryService.recordMetric('sale_session_started', 1, {
          user_id: sessionData.userId,
          pos_terminal: sessionData.posTerminalId
        });
        return response;
      });
    } catch (error) {
      console.warn('API unavailable, using demo session');
      return {
        success: true,
        data: {
          session_id: `sess_${Date.now()}`,
          user_id: sessionData.userId,
          pos_terminal_id: sessionData.posTerminalId || 'POS_001',
          status: 'active',
          started_at: new Date().toISOString()
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('sale_session_start_duration', endTime - startTime);
    }
  },

  // Finalizar sesión de venta
  endSaleSession: async (sessionId, summary = {}) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.post(`/sales/session/${sessionId}/end`, {
          total_sales: summary.totalSales || 0,
          total_amount: summary.totalAmount || 0,
          cash_collected: summary.cashCollected || 0,
          ...summary
        });
        telemetryService.recordMetric('sale_session_ended', 1, {
          session_id: sessionId,
          total_sales: summary.totalSales
        });
        return response;
      });
    } catch (error) {
      console.warn('API unavailable, using demo session end');
      return {
        success: true,
        data: {
          session_id: sessionId,
          status: 'closed',
          ended_at: new Date().toISOString(),
          summary: summary
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('sale_session_end_duration', endTime - startTime);
    }
  },

  // Obtener información de sesión activa
  getActiveSession: async (userId) => {
    try {
      return await withRetry(async () => {
        return await apiService.get(`/sales/session/active?user_id=${userId}`);
      });
    } catch (error) {
      console.warn('API unavailable, no active session');
      return { success: false, error: 'No active session found' };
    }
  },

  // ============ PROCESAMIENTO DE PAGOS ============
  
  // Procesar pago con cálculo automático de cambio según SALE_API.md
  processPayment: async (saleId, paymentData) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        // Mapear datos al formato de la API de pagos
        const requestData = {
          sales_order_id: saleId,
          amount_received: paymentData.amountPaid || paymentData.amount_received,
          payment_reference: paymentData.reference || paymentData.payment_reference || null,
          payment_notes: paymentData.notes || paymentData.payment_notes || null
        };

        // Usar endpoint de procesamiento de pagos
        const response = await apiService.post('/payment/process', requestData);
        
        telemetryService.recordMetric('payment_processed_unified', 1, {
          sale_id: saleId,
          amount_received: requestData.amount_received,
          requires_change: response.requires_change,
          change_amount: response.payment_details?.change_amount || 0
        });
        
        return response;
      });
    } catch (error) {
      console.warn('API unavailable, simulating payment processing');
      
      // Demo: simular procesamiento de pago
      const sale = DEMO_CONFIG_SALES.find(s => s.id === parseInt(saleId));
      if (!sale) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
      
      const amountReceived = paymentData.amountPaid || paymentData.amount_received;
      const changeAmount = Math.max(0, amountReceived - sale.total_amount);
      
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
          payment_reference: paymentData.reference || null
        },
        message: 'Payment processed successfully (demo mode)',
        requires_change: changeAmount > 0,
        processed_at: new Date().toISOString(),
        processed_by: 'Demo User'
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('payment_processing_duration', endTime - startTime);
    }
  },
  
  // Calcular cambio
  calculateChange: async (totalAmount, amountPaid) => {
    try {
      return await withRetry(async () => {
        return await apiService.post('/sales/calculate-change', {
          total_amount: totalAmount,
          amount_paid: amountPaid
        });
      });
    } catch (error) {
      console.warn('API unavailable, calculating change locally');
      const changeAmount = Math.max(0, amountPaid - totalAmount);
      return {
        success: true,
        data: {
          total_amount: totalAmount,
          amount_paid: amountPaid,
          change_amount: changeAmount,
          is_exact: changeAmount === 0
        }
      };
    }
  },

  // ============ CRUD OPERATIONS ============
  // Obtener ventas por rango de fechas según SALE_API.md
  getSales: async (params = {}) => {
    const startTime = performance.now();
    try {
      // Construir query params para el endpoint de date_range
      const queryParams = new URLSearchParams({
        start_date: params.dateFrom || params.start_date || '',
        end_date: params.dateTo || params.end_date || '',
        page: params.page || 1,
        page_size: params.limit || params.page_size || 20
      }).toString();

      return await withRetry(async () => {
        const response = await apiService.get(`/sale/date_range/?${queryParams}`);
        telemetryService.recordMetric('sales_fetched_date_range', response.sales?.length || 0);
        return {
          success: true,
          data: response.sales || [],
          pagination: {
            total: response.total_count || 0,
            totalPages: response.total_pages || 0,
            currentPage: response.page || 1,
            hasNext: response.page < response.total_pages,
            hasPrevious: response.page > 1
          }
        };
      });
    } catch (error) {
      console.warn('🔄 Sales API unavailable, using modular mock data...');
      telemetryService.recordMetric('sales_mock_fallback', 1);
      const result = await demoService.getSales(params);
      
      if (MOCK_CONFIG.development?.verbose) {
        console.log('✅ Sales loaded from modular mock system:', result.data.length);
      }
      
      return result;
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_sales_duration', endTime - startTime);
    }
  },

  // Obtener una venta por ID según SALE_API.md
  getSaleById: async (id) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.get(`/sale/${id}`);
        telemetryService.recordMetric('sale_fetched_by_id', 1, { sale_id: id });
        return response;
      });
    } catch (error) {
      console.warn(`🔄 Sale API unavailable for ID ${id}, using modular mock data...`);
      const result = await demoService.getSaleById(id);
      
      if (MOCK_CONFIG.development?.verbose) {
        console.log(`✅ Sale ${id} loaded from modular mock system`);
      }
      
      return result;
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_sale_by_id_duration', endTime - startTime);
    }
  },

  // Crear una nueva venta usando API unificada según SALE_API.md
  createSale: async (saleData) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        // Mapear datos al formato de la API unificada
        const requestData = {
          sale_id: saleData.saleId || undefined, // Opcional, se genera automáticamente
          client_id: saleData.clientId || saleData.client_id,
          product_details: saleData.items?.map(item => ({
            product_id: item.product_id || item.id,
            quantity: item.quantity,
            tax_rate_id: item.tax_rate_id || null,
            sale_price: item.sale_price || item.unit_price,
            price_change_reason: item.price_change_reason || null
          })) || saleData.product_details || [],
          payment_method_id: saleData.payment_method_id || null,
          currency_id: saleData.currency_id || null,
          allow_price_modifications: saleData.allow_price_modifications || false,
          reserve_id: saleData.reserve_id || null // Para ventas con reserva
        };

        // Usar endpoint principal recomendado
        const response = await apiService.post('/sale/', requestData);
        
        telemetryService.recordMetric('sale_created_unified', 1, {
          total_amount: response.total_amount,
          items_processed: response.items_processed,
          has_price_changes: response.has_price_changes
        });
        
        return response;
      });
    } catch (error) {
      console.warn('🔄 Sale API unavailable, using modular mock data...');
      telemetryService.recordMetric('sale_mock_creation', 1);
      const result = await demoService.createSale({
        client_id: saleData.clientId,
        total_amount: saleData.totalAmount,
        payment_method: saleData.paymentMethod || 'cash',
        amount_paid: saleData.amountPaid,
        items: saleData.items
      });
      
      if (MOCK_CONFIG.development?.verbose) {
        console.log('✅ Sale created in modular mock system:', result.sale_id);
      }
      
      return result;
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('create_sale_duration', endTime - startTime);
    }
  },

  // Actualizar una venta existente
  updateSale: async (id, saleData) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}`, saleData);
        telemetryService.recordMetric('sale_updated', 1, { sale_id: id });
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, cannot update sale ${id}`);
      throw new Error('Sale update unavailable in offline mode');
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('update_sale_duration', endTime - startTime);
    }
  },

  // Preview de impacto de cancelación según SALE_API.md
  previewCancellation: async (saleId) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.get(`/sale/${saleId}/preview-cancellation`);
        
        telemetryService.recordMetric('sale_cancellation_previewed', 1, {
          sale_id: saleId,
          can_be_reverted: response.sale_info?.can_be_reverted
        });
        
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, cannot preview cancellation for sale ${saleId}`);
      
      // Demo fallback
      return {
        success: true,
        sale_info: {
          sale_id: saleId,
          current_status: 'completed',
          total_amount: 100.00,
          can_be_reverted: true
        },
        impact_analysis: {
          total_items: 2,
          physical_products: 1,
          service_products: 1,
          active_reserves: 0,
          payments_to_cancel: 1,
          total_to_refund: 100.00,
          requires_stock_adjustment: true,
          requires_reserve_cancellation: false,
          requires_payment_refund: true
        },
        recommendations: {
          action: 'refund_required',
          backup_recommended: true,
          notify_customer: true,
          estimated_complexity: 'medium'
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('preview_cancellation_duration', endTime - startTime);
    }
  },

  // Cancelar una venta con reversión mejorada según SALE_API.md
  cancelSale: async (id, reason = '') => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const requestData = {
          user_id: 'current_user', // Se debe obtener del contexto de autenticación
          reason: reason
        };

        // Usar endpoint de cancelación mejorada
        const response = await apiService.put(`/sale/${id}`, requestData);
        
        telemetryService.recordMetric('sale_cancelled_enhanced', 1, { 
          sale_id: id, 
          reason,
          payments_cancelled: response.reversal_details?.payments_cancelled || 0,
          total_refunded: response.reversal_details?.total_refunded || 0
        });
        
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, cannot cancel sale ${id}`);
      throw new Error('Sale cancellation unavailable in offline mode');
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('cancel_sale_duration', endTime - startTime);
    }
  },

  // Completar una venta
  completeSale: async (id, paymentData = {}) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}/complete`, {
          payment_method: paymentData.paymentMethod || 'cash',
          amount_paid: paymentData.amountPaid,
          completed_at: new Date().toISOString(),
          ...paymentData
        });
        telemetryService.recordMetric('sale_completed', 1, { 
          sale_id: id, 
          payment_method: paymentData.paymentMethod 
        });
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, cannot complete sale ${id}`);
      throw new Error('Sale completion unavailable in offline mode');
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('complete_sale_duration', endTime - startTime);
    }
  },

  // Procesar reembolso
  refundSale: async (id, refundData) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiService.put(`/sales/${id}/refund`, {
          refund_amount: refundData.refundAmount,
          refund_reason: refundData.refundReason,
          refund_method: refundData.refundMethod || 'original',
          refunded_at: new Date().toISOString(),
          ...refundData
        });
        telemetryService.recordMetric('sale_refunded', 1, { 
          sale_id: id, 
          refund_amount: refundData.refundAmount 
        });
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, cannot refund sale ${id}`);
      throw new Error('Sale refund unavailable in offline mode');
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('refund_sale_duration', endTime - startTime);
    }
  },

  // Obtener ventas por cliente
  getSalesByClient: async (clientId, params = {}) => {
    const startTime = performance.now();
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
        status: params.status || '',
      }).toString();

      return await withRetry(async () => {
        const response = await apiService.get(`/clients/${clientId}/sales?${queryParams}`);
        telemetryService.recordMetric('client_sales_fetched', response.data?.length || 0, { client_id: clientId });
        return response;
      });
    } catch (error) {
      console.warn(`API unavailable, filtering demo sales by client ${clientId}`);
      const clientSales = DEMO_CONFIG_SALES.filter(sale => sale.client_id === parseInt(clientId));
      return {
        success: true,
        data: clientSales,
        pagination: {
          total: clientSales.length,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_sales_by_client_duration', endTime - startTime);
    }
  },

  // Obtener estadísticas de ventas
  getSalesStats: async (params = {}) => {
    const startTime = performance.now();
    try {
      const queryParams = new URLSearchParams({
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
        group_by: params.groupBy || 'day',
        metric: params.metric || 'total',
      }).toString();

      return await withRetry(async () => {
        return await apiService.get(`/sales/statistics?${queryParams}`);
      });
    } catch (error) {
      console.warn('API unavailable, calculating demo statistics');
      
      // Estadísticas locales básicas
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const completedSales = DEMO_CONFIG_SALES.filter(sale => sale.status === 'completed');
      const todaySales = completedSales.filter(sale => sale.sale_date.startsWith(todayString));
      const weekSales = completedSales.filter(sale => new Date(sale.sale_date) >= thisWeekStart);
      const monthSales = completedSales.filter(sale => new Date(sale.sale_date) >= thisMonthStart);
      
      return {
        success: true,
        data: {
          total_sales: completedSales.length,
          total_revenue: completedSales.reduce((sum, sale) => sum + sale.total_amount, 0),
          today_sales: todaySales.length,
          today_revenue: todaySales.reduce((sum, sale) => sum + sale.total_amount, 0),
          week_sales: weekSales.length,
          week_revenue: weekSales.reduce((sum, sale) => sum + sale.total_amount, 0),
          month_sales: monthSales.length,
          month_revenue: monthSales.reduce((sum, sale) => sum + sale.total_amount, 0),
          average_order_value: completedSales.length > 0 ? 
            completedSales.reduce((sum, sale) => sum + sale.total_amount, 0) / completedSales.length : 0
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_sales_stats_duration', endTime - startTime);
    }
  },

  // Obtener ventas del día
  getTodaySales: async () => {
    const startTime = performance.now();
    try {
      const today = new Date().toISOString().split('T')[0];
      return await withRetry(async () => {
        return await apiService.get(`/sales/today/${today}`);
      });
    } catch (error) {
      console.warn('API unavailable, filtering demo sales for today');
      const today = new Date().toISOString().split('T')[0];
      const todaySales = DEMO_CONFIG_SALES.filter(sale => sale.sale_date.startsWith(today));
      return {
        success: true,
        data: todaySales,
        summary: {
          count: todaySales.length,
          total_revenue: todaySales.reduce((sum, sale) => sum + sale.total_amount, 0)
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_today_sales_duration', endTime - startTime);
    }
  },

  // Obtener productos más vendidos
  getTopSellingProducts: async (params = {}) => {
    const startTime = performance.now();
    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 10,
        date_from: params.dateFrom || '',
        date_to: params.dateTo || '',
      }).toString();

      return await withRetry(async () => {
        return await apiService.get(`/sales/top-products?${queryParams}`);
      });
    } catch (error) {
      console.warn('API unavailable, calculating top products from demo data');
      
      // Calcular productos más vendidos localmente
      const productSales = {};
      DEMO_CONFIG_SALE_ITEMS.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            product_id: item.product_id,
            total_quantity: 0,
            total_revenue: 0,
            sales_count: 0
          };
        }
        productSales[item.product_id].total_quantity += item.quantity;
        productSales[item.product_id].total_revenue += item.unit_price * item.quantity;
        productSales[item.product_id].sales_count += 1;
      });
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, params.limit || 10);
      
      return {
        success: true,
        data: topProducts
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_top_products_duration', endTime - startTime);
    }
  },

  // Obtener ventas recientes
  getRecentSales: async (limit = 10) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        return await apiService.get(`/sales/recent?limit=${limit}`);
      });
    } catch (error) {
      console.warn('API unavailable, using demo recent sales');
      const recentSales = DEMO_CONFIG_SALES
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
        .slice(0, limit);
      return {
        success: true,
        data: recentSales
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_recent_sales_duration', endTime - startTime);
    }
  },

  // Buscar ventas
  searchSales: async (query, searchType = 'all') => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        return await apiService.get(`/sales/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      });
    } catch (error) {
      console.warn('API unavailable, searching demo sales');
      const queryLower = query.toLowerCase();
      const filteredSales = DEMO_CONFIG_SALES.filter(sale => {
        return sale.id.toString().includes(queryLower) ||
               sale.total_amount.toString().includes(queryLower) ||
               sale.status.toLowerCase().includes(queryLower) ||
               sale.payment_method.toLowerCase().includes(queryLower);
      });
      return {
        success: true,
        data: filteredSales
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('search_sales_duration', endTime - startTime);
    }
  },

  // DEPRECATED: Esta funcionalidad debe manejarse por separado
  // - Crear venta usando createSale()
  // - Crear reserva usando reservationService.createReservation()
  // - Mantener referencia entre ambas si es necesario
  createSaleWithReservation: async () => {
    console.warn('⚠️  createSaleWithReservation is deprecated. Handle sales and reservations separately.');
    throw new Error('This method has been deprecated. Please create sales and reservations separately for better separation of concerns.');
  },

  // Obtener detalles expandidos de una venta
  getSaleDetails: async (id) => {
    return await apiService.get(`/ventas/${id}/detalles`);
  },

  // Generar factura de venta
  generateInvoice: async (id, format = 'pdf') => {
    return await apiService.get(`/ventas/${id}/factura?format=${format}`, {
      responseType: 'blob'
    });
  },

  // Aplicar descuento a venta
  applyDiscount: async (id, discountData) => {
    return await apiService.put(`/ventas/${id}/descuento`, discountData);
  },

  // Calcular total con impuestos
  calculateTotal: async (items, clientId = null) => {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        return await apiService.post('/sales/calculate-total', {
          items,
          client_id: clientId
        });
      });
    } catch (error) {
      console.warn('API unavailable, calculating total locally');
      
      // Cálculo local de totales
      const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);
      
      const taxRate = 0.16; // IVA 16%
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;
      
      return {
        success: true,
        data: {
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          tax_rate: taxRate
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('calculate_total_duration', endTime - startTime);
    }
  },
  
  // ============ INTEGRACIÓN POS ============
  
  // Sincronizar con terminal POS
  syncPOSTerminal: async (terminalId) => {
    try {
      return await withRetry(async () => {
        return await apiService.post(`/pos/sync/${terminalId}`);
      });
    } catch (error) {
      console.warn('POS sync unavailable, using offline mode');
      return {
        success: true,
        data: {
          terminal_id: terminalId,
          status: 'offline',
          last_sync: new Date().toISOString(),
          mode: 'offline'
        }
      };
    }
  },
  
  // Obtener configuración POS
  getPOSConfig: async (terminalId) => {
    try {
      return await withRetry(async () => {
        return await apiService.get(`/pos/config/${terminalId}`);
      });
    } catch (error) {
      console.warn('POS config unavailable, using default config');
      return {
        success: true,
        data: {
          terminal_id: terminalId,
          receipt_printer: true,
          cash_drawer: true,
          barcode_scanner: false,
          payment_methods: ['cash', 'card', 'transfer'],
          currency: 'MXN',
          tax_rate: 0.16
        }
      };
    }
  },
};

export default saleService;
