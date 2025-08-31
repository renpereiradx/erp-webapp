/**
 * Store de Zustand para gestión de estado de ventas
 * Maneja el estado global de las ventas, incluyendo CRUD operations y estado de la UI
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import saleService from '@/services/saleService';

const useSaleStore = create()(
  devtools(
    (set, get) => ({
      // Estado inicial
      sales: [],
      currentSale: null,
      saleItems: [],
      loading: false,
      error: null,
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

      // Estado temporal para venta en curso
      currentSaleData: {
        clientId: '',
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        discount: 0,
        notes: '',
      },

      // Acciones para ventas
      fetchSales: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response = await saleService.getSales(filters);
          
          set({
            sales: response.data || [],
            pagination: response.pagination || get().pagination,
            filters,
            loading: false,
          });
          
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
          set({
            currentSale: response.data,
            loading: false,
          });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createSale: async (saleData) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.createSale(saleData);
          
          // Actualizar la lista de ventas
          const sales = get().sales;
          set({
            sales: [response.data, ...sales],
            loading: false,
          });
          
          // Limpiar venta actual
          get().clearCurrentSale();
          
          // Actualizar estadísticas
          get().updateStats();
          
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

      createSaleWithReservation: async (saleData, reservationData) => {
        set({ loading: true, error: null });
        try {
          const response = await saleService.createSaleWithReservation(saleData, reservationData);
          
          // Actualizar la lista de ventas
          const sales = get().sales;
          set({
            sales: [response.data, ...sales],
            loading: false,
          });
          
          // Limpiar venta actual
          get().clearCurrentSale();
          
          // Actualizar estadísticas
          get().updateStats();
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
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

      // Gestión de venta actual (carrito)
      setCurrentSaleClient: (clientId) => {
        const currentSaleData = get().currentSaleData;
        set({
          currentSaleData: {
            ...currentSaleData,
            clientId
          }
        });
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
          // Agregar nuevo ítem
          newItems = [...currentSaleData.items, {
            ...product,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity
          }];
        }
        
        const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.16; // IVA del 16%
        const total = subtotal + tax - currentSaleData.discount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotal,
            tax,
            total
          }
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
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        
        const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.16;
        const total = subtotal + tax - currentSaleData.discount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotal,
            tax,
            total
          }
        });
      },

      removeItemFromCurrentSale: (itemId) => {
        const currentSaleData = get().currentSaleData;
        const newItems = currentSaleData.items.filter(item => item.id !== itemId);
        
        const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.16;
        const total = subtotal + tax - currentSaleData.discount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotal,
            tax,
            total
          }
        });
      },

      applyDiscount: (discountAmount) => {
        const currentSaleData = get().currentSaleData;
        const total = currentSaleData.subtotal + currentSaleData.tax - discountAmount;
        
        set({
          currentSaleData: {
            ...currentSaleData,
            discount: discountAmount,
            total: Math.max(0, total)
          }
        });
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
            clientId: '',
            items: [],
            total: 0,
            subtotal: 0,
            tax: 0,
            discount: 0,
            notes: '',
          }
        });
      },

      // Utilidades y helpers
      updateStats: () => {
        const sales = get().sales;
        const today = new Date().toISOString().split('T')[0];
        
        const todaySales = sales.filter(sale => 
          sale.createdAt?.startsWith(today) && sale.status !== 'cancelled'
        );
        
        const totalRevenue = sales
          .filter(sale => sale.status === 'completed')
          .reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        const todayRevenue = todaySales
          .filter(sale => sale.status === 'completed')
          .reduce((sum, sale) => sum + (sale.total || 0), 0);
        
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

      // Selectores
      getSalesByStatus: (status) => {
        return get().sales.filter(sale => sale.status === status);
      },

      getSalesByClient: (clientId) => {
        return get().sales.filter(sale => sale.clientId === clientId);
      },

      getTodaySalesCount: () => {
        const sales = get().sales;
        const today = new Date().toISOString().split('T')[0];
        return sales.filter(sale => 
          sale.createdAt?.startsWith(today) && sale.status !== 'cancelled'
        ).length;
      },

      getCurrentSaleItemsCount: () => {
        return get().currentSaleData.items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    { name: 'sale-store' }
  )
);

export default useSaleStore;
