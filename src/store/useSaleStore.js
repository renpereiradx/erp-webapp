/**
 * Store de Zustand para gestión de estado de ventas
 * Maneja el estado global de las ventas, incluyendo CRUD operations, sesiones y pagos
 * Implementa patrones MVP según GUIA_MVP_DESARROLLO.md y SALE_API.md
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import saleService from '@/services/saleService';
import { telemetryService } from '@/services/telemetryService';
import { DEMO_CONFIG_SALES } from '@/config/demoData';

const useSaleStore = create()(
  devtools(
    (set, get) => ({
      // ============ Estado MVP (Arrays simples) ============
      sales: [],
      currentSale: null,
      saleItems: [],
      loading: false,
      error: null,
      
      // ============ Gestión de sesiones ============
      currentSession: null,
      sessionActive: false,
      
      // ============ Procesamiento de pagos ============
      paymentInProgress: false,
      paymentResult: null,
      changeCalculation: null,
      filters: {
        page: 1,
        limit: 10,
        clientId: '',
        dateFrom: '',
        dateTo: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      pagination: {
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrevious: false,
      },
      stats: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        averageOrderValue: 0,
        topSellingProducts: [],
      },

      // ============ Estado temporal para venta en curso (MVP) ============
      currentSaleData: {
        clientId: null,
        sessionId: null,
        items: [],
        totalAmount: 0,
        subtotalAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        notes: '',
        paymentMethod: 'cash',
        amountPaid: 0,
        changeAmount: 0,
        posTerminalId: 'POS_001'
      },

      // ============ GESTIÓN DE SESIONES ============
      
      startSaleSession: async (userId, posTerminalId = 'POS_001') => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.startSaleSession({ userId, posTerminalId });
          
          if (response.success) {
            set({
              currentSession: response.data,
              sessionActive: true,
              currentSaleData: {
                ...get().currentSaleData,
                sessionId: response.data.session_id,
                posTerminalId: posTerminalId
              },
              loading: false
            });
            
            telemetryService.recordEvent('sale_session_started', {
              session_id: response.data.session_id,
              user_id: userId
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      endSaleSession: async (summary = {}) => {
        const session = get().currentSession;
        if (!session) return;
        
        set({ loading: true, error: null });
        try {
          const response = await saleService.endSaleSession(session.session_id, summary);
          
          if (response.success) {
            set({
              currentSession: null,
              sessionActive: false,
              loading: false
            });
            
            telemetryService.recordEvent('sale_session_ended', {
              session_id: session.session_id,
              duration: Date.now() - new Date(session.started_at).getTime()
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      // ============ PROCESAMIENTO DE PAGOS ============
      
      processPayment: async (saleId, paymentData) => {
        set({ paymentInProgress: true, error: null });
        try {
          const response = await saleService.processPayment(saleId, paymentData);
          
          if (response.success) {
            set({
              paymentResult: response.data,
              paymentInProgress: false
            });
            
            telemetryService.recordEvent('payment_processed', {
              sale_id: saleId,
              payment_method: paymentData.paymentMethod,
              amount: paymentData.amountPaid
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, paymentInProgress: false });
          throw error;
        }
      },
      
      calculateChange: async (totalAmount, amountPaid) => {
        try {
          const response = await saleService.calculateChange(totalAmount, amountPaid);
          
          if (response.success) {
            set({ changeCalculation: response.data });
            
            // Actualizar datos de venta actual
            const currentSaleData = get().currentSaleData;
            set({
              currentSaleData: {
                ...currentSaleData,
                amountPaid: amountPaid,
                changeAmount: response.data.change_amount
              }
            });
          }
          
          return response;
        } catch (error) {
          console.error('Error calculating change:', error);
          throw error;
        }
      },
      
      // ============ CRUD OPERATIONS (MVP Style) ============
      fetchSales: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response = await saleService.getSales(filters);
          
          if (response.success) {
            set({
              sales: response.data || [],
              pagination: response.pagination || get().pagination,
              filters,
              loading: false,
            });
            
            telemetryService.recordEvent('sales_fetched', {
              count: response.data?.length || 0,
              filters: JSON.stringify(filters)
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchSaleById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.getSaleById(id);
          
          if (response.success) {
            set({
              currentSale: response.data,
              loading: false,
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createSale: async (saleData = null) => {
        set({ loading: true, error: null });
        try {
          // Si no se proporciona saleData, usar currentSaleData
          const dataToSend = saleData || get().currentSaleData;
          
          const response = await saleService.createSale({
            clientId: dataToSend.clientId,
            sessionId: dataToSend.sessionId,
            paymentMethod: dataToSend.paymentMethod,
            amountPaid: dataToSend.amountPaid,
            items: dataToSend.items,
            totalAmount: dataToSend.totalAmount,
            subtotalAmount: dataToSend.subtotalAmount,
            taxAmount: dataToSend.taxAmount,
            discountAmount: dataToSend.discountAmount,
            notes: dataToSend.notes,
            posTerminalId: dataToSend.posTerminalId
          });
          
          if (response.success) {
            // Actualizar la lista de ventas (MVP: array simple)
            const sales = get().sales;
            set({
              sales: [response.data, ...sales],
              loading: false,
            });
            
            // Limpiar venta actual
            get().clearCurrentSale();
            
            // Actualizar estadísticas
            get().updateStats();
            
            telemetryService.recordEvent('sale_created', {
              sale_id: response.data?.id || response.sale_id,
              total_amount: dataToSend.totalAmount,
              payment_method: dataToSend.paymentMethod
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateSale: async (id, saleData) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.updateSale(id, saleData);
          
          // Actualizar la venta en la lista
          const sales = get().sales.map(sale =>
            sale.id === id ? response.data : sale
          );
          
          set({
            sales,
            currentSale: response.data,
            loading: false,
          });
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      cancelSale: async (id, reason = '') => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.cancelSale(id, reason);
          
          // Actualizar estado de la venta
          const sales = get().sales.map(sale =>
            sale.id === id ? { ...sale, status: 'cancelled' } : sale
          );
          
          set({ sales, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      completeSale: async (id, paymentData = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.completeSale(id, paymentData);
          
          // Actualizar estado de la venta
          const sales = get().sales.map(sale =>
            sale.id === id ? { ...sale, status: 'completed' } : sale
          );
          
          set({ sales, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      refundSale: async (id, refundData) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.refundSale(id, refundData);
          
          // Actualizar estado de la venta
          const sales = get().sales.map(sale =>
            sale.id === id ? { ...sale, status: 'refunded' } : sale
          );
          
          set({ sales, loading: false });
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // DEPRECATED: Removed coupling between sales and reservations
      // Use createSale() and reservationService.createReservation() separately
      createSaleWithReservation: async () => {
        console.warn('⚠️  createSaleWithReservation is deprecated. Handle sales and reservations separately.');
        set({ error: 'This method has been deprecated. Please create sales and reservations separately.', loading: false });
        throw new Error('This method has been deprecated. Please create sales and reservations separately for better separation of concerns.');
      },

      fetchTodaySales: async () => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.getTodaySales();
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchSalesStats: async (params = {}) => {
        try {
          const response = await saleService.getSalesStats(params);
          set({ stats: { ...get().stats, ...response.data } });
          return response;
        } catch (error) {
          console.error('Error fetching sales stats:', error);
          throw error;
        }
      },

      fetchTopSellingProducts: async (params = {}) => {
        try {
          const response = await saleService.getTopSellingProducts(params);
          set({ 
            stats: { 
              ...get().stats, 
              topSellingProducts: response.data || [] 
            } 
          });
          return response;
        } catch (error) {
          console.error('Error fetching top selling products:', error);
          throw error;
        }
      },

      calculateTotal: async (items, clientId = null) => {
        try {
          const response = await saleService.calculateTotal(items, clientId);
          return response;
        } catch (error) {
          console.error('Error calculating total:', error);
          throw error;
        }
      },

      // ============ GESTIÓN DE CARRITO (MVP Style) ============
      
      setCurrentSaleClient: (clientId) => {
        const currentSaleData = get().currentSaleData;
        set({
          currentSaleData: {
            ...currentSaleData,
            clientId
          }
        });
        
        telemetryService.recordEvent('sale_client_selected', { client_id: clientId });
      },
      
      setPaymentMethod: (paymentMethod) => {
        const currentSaleData = get().currentSaleData;
        set({
          currentSaleData: {
            ...currentSaleData,
            paymentMethod
          }
        });
        
        telemetryService.recordEvent('payment_method_selected', { method: paymentMethod });
      },

      addItemToCurrentSale: (product, quantity = 1) => {
        const currentSaleData = get().currentSaleData;
        const existingItemIndex = currentSaleData.items.findIndex(item => item.id === product.id);
        
        let newItems;
        if (existingItemIndex >= 0) {
          // Actualizar cantidad del ítem existente
          newItems = currentSaleData.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Agregar nuevo ítem (MVP: estructura simple)
          newItems = [...currentSaleData.items, {
            id: product.id,
            product_id: product.id,
            name: product.name,
            quantity: quantity,
            unit_price: product.price,
            total_price: product.price * quantity
          }];
        }
        
        // Recalcular totales (MVP: cálculos simples)
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.total_price, 0);
        const taxAmount = subtotalAmount * 0.16; // IVA del 16%
        const totalAmount = subtotalAmount + taxAmount - currentSaleData.discountAmount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('item_added_to_sale', {
          product_id: product.id,
          quantity: quantity,
          unit_price: product.price
        });
      },

      updateItemQuantity: (itemId, quantity) => {
        const currentSaleData = get().currentSaleData;
        
        if (quantity <= 0) {
          get().removeItemFromCurrentSale(itemId);
          return;
        }
        
        const newItems = currentSaleData.items.map(item =>
          item.id === itemId
            ? { ...item, quantity, total_price: item.unit_price * quantity }
            : item
        );
        
        // Recalcular totales
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.total_price, 0);
        const taxAmount = subtotalAmount * 0.16;
        const totalAmount = subtotalAmount + taxAmount - currentSaleData.discountAmount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('item_quantity_updated', {
          item_id: itemId,
          new_quantity: quantity
        });
      },

      removeItemFromCurrentSale: (itemId) => {
        const currentSaleData = get().currentSaleData;
        const newItems = currentSaleData.items.filter(item => item.id !== itemId);
        
        // Recalcular totales
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.total_price, 0);
        const taxAmount = subtotalAmount * 0.16;
        const totalAmount = subtotalAmount + taxAmount - currentSaleData.discountAmount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('item_removed_from_sale', { item_id: itemId });
      },

      applyDiscount: (discountAmount) => {
        const currentSaleData = get().currentSaleData;
        const totalAmount = currentSaleData.subtotalAmount + currentSaleData.taxAmount - discountAmount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            discountAmount: discountAmount,
            totalAmount: Math.max(0, totalAmount)
          }
        });
        
        telemetryService.recordEvent('discount_applied', { discount_amount: discountAmount });
      },

      setNotes: (notes) => {
        const currentSaleData = get().currentSaleData;
        set({
          currentSaleData: {
            ...currentSaleData,
            notes
          }
        });
      },

      clearCurrentSale: () => {
        set({
          currentSaleData: {
            clientId: null,
            sessionId: get().currentSession?.session_id || null,
            items: [],
            totalAmount: 0,
            subtotalAmount: 0,
            taxAmount: 0,
            discountAmount: 0,
            notes: '',
            paymentMethod: 'cash',
            amountPaid: 0,
            changeAmount: 0,
            posTerminalId: 'POS_001'
          }
        });
        
        telemetryService.recordEvent('sale_cart_cleared');
      },

      // ============ UTILIDADES Y HELPERS (MVP) ============
      
      updateStats: () => {
        const sales = get().sales;
        const today = new Date().toISOString().split('T')[0];
        
        const todaySales = sales.filter(sale => 
          sale.sale_date?.startsWith(today) && sale.status !== 'cancelled'
        );
        
        const totalRevenue = sales
          .filter(sale => sale.status === 'completed')
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        
        const todayRevenue = todaySales
          .filter(sale => sale.status === 'completed')
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        
        const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
        
        set({
          stats: {
            ...get().stats,
            total: sales.length,
            today: todaySales.length,
            totalRevenue,
            todayRevenue,
            averageOrderValue,
          }
        });
      },

      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
      },

      resetFilters: () => {
        set({
          filters: {
            page: 1,
            limit: 10,
            clientId: '',
            dateFrom: '',
            dateTo: '',
            status: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }
        });
      },

      clearError: () => set({ error: null }),

      // Limpiar entidad de venta actual (distinto a carrito en curso)
      clearCurrentSaleEntity: () => set({ currentSale: null }),
      
      // Limpiar resultado de pago
      clearPaymentResult: () => set({ paymentResult: null, changeCalculation: null }),

      // ============ SELECTORES (MVP Simple) ============
      
      getSalesByStatus: (status) => {
        return get().sales.filter(sale => sale.status === status);
      },

      getSalesByClient: (clientId) => {
        return get().sales.filter(sale => sale.client_id === clientId);
      },

      getTodaySalesCount: () => {
        const sales = get().sales;
        const today = new Date().toISOString().split('T')[0];
        return sales.filter(sale => 
          sale.sale_date?.startsWith(today) && sale.status !== 'cancelled'
        ).length;
      },

      getCurrentSaleItemsCount: () => {
        return get().currentSaleData.items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getCurrentSaleTotal: () => {
        return get().currentSaleData.totalAmount;
      },
      
      getChangeAmount: () => {
        const { totalAmount, amountPaid } = get().currentSaleData;
        return Math.max(0, amountPaid - totalAmount);
      },
      
      canProcessSale: () => {
        const { clientId, items, totalAmount, paymentMethod, amountPaid } = get().currentSaleData;
        return items.length > 0 && 
               totalAmount > 0 && 
               paymentMethod && 
               (paymentMethod === 'cash' ? amountPaid >= totalAmount : true);
      },
    }),
    { name: 'sale-store' }
  )
);

export default useSaleStore;
