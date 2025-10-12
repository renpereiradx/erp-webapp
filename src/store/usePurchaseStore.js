/**
 * Store de Zustand para gestión de estado de compras
 * Maneja el estado global de las órdenes de compra siguiendo patrones MVP
 * Implementa arrays simples según GUIA_MVP_DESARROLLO.md
 * Incluye soporte para nuevos campos: unit, tax_rate, profit_pct, line_total, sale_price, metadata, supplier_status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import purchaseService from '@/services/purchaseService';
import { telemetryService } from '@/services/telemetryService';
import { DEMO_TAX_RATES_DATA } from '@/config/mockData/purchases.js';

const usePurchaseStore = create()(
  devtools(
    (set, get) => ({
      // ============ Estado MVP (Arrays simples) ============
      purchaseOrders: [],
      currentPurchaseOrder: null,
      loading: false,
      error: null,
      
      // ============ Datos de apoyo ============
      taxRates: DEMO_TAX_RATES_DATA,
      suppliers: [], // Se cargarán desde el store de proveedores
      
      // ============ Estado temporal para nueva orden (MVP) ============
      currentOrderData: {
        supplierId: null,
        supplierName: '',
        items: [],
        totalAmount: 0,
        subtotalAmount: 0,
        taxAmount: 0,
        expectedDelivery: null,
        notes: '',
        status: 'PENDING',
        // Nuevos campos para enhanced purchase orders
        auto_update_prices: true,
        default_profit_margin: 30.0,
        payment_method_id: null,
        currency_id: null,
        metadata: {}
      },
      
      // ============ Configuración y filtros ============
      filters: {
        page: 1,
        limit: 10,
        supplierId: '',
        status: '',
        sortBy: 'order_date',
        sortOrder: 'desc',
        showInactiveSuppliers: false, // Nuevo filtro para supplier_status
      },
      pagination: {
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrevious: false,
      },
      
      // ============ CRUD OPERATIONS (MVP Style) ============
      
      fetchPurchaseOrders: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response = await purchaseService.getPurchasesPaginated(
            filters.page, 
            filters.limit, 
            {
              supplier_id: filters.supplierId,
              status: filters.status
            }
          );
          
          if (response.success) {
            set({
              purchaseOrders: response.data || [],
              pagination: response.pagination || get().pagination,
              filters,
              loading: false,
            });
            
            telemetryService.recordEvent('purchase_orders_fetched', {
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

      fetchPurchaseOrderById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.getPurchaseById(id);
          
          if (response.success) {
            set({
              currentPurchaseOrder: response.data,
              loading: false,
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createPurchaseOrder: async (orderData = null) => {
        set({ loading: true, error: null });
        try {
          // Si no se proporciona orderData, usar currentOrderData
          const dataToSend = orderData || get().currentOrderData;

          const response = await purchaseService.createPurchase({
            supplierId: dataToSend.supplierId,
            supplierName: dataToSend.supplierName,
            items: dataToSend.items,
            expectedDelivery: dataToSend.expectedDelivery,
            notes: dataToSend.notes,
            status: dataToSend.status || 'PENDING'
          });

          if (response.success) {
            // Actualizar la lista de órdenes (MVP: array simple)
            const purchaseOrders = get().purchaseOrders;
            set({
              purchaseOrders: [response.data, ...purchaseOrders],
              loading: false,
            });

            // Limpiar orden actual
            get().clearCurrentOrder();

            telemetryService.recordEvent('purchase_order_created', {
              order_id: response.data?.id || response.purchaseOrderId,
              supplier_id: dataToSend.supplierId,
              total_amount: dataToSend.totalAmount
            });
          }

          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Enhanced purchase order creation with auto-pricing
      createEnhancedPurchaseOrder: async (orderData) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.createEnhancedPurchaseOrder(orderData);

          if (response.success) {
            // Actualizar la lista de órdenes
            const purchaseOrders = get().purchaseOrders;
            set({
              purchaseOrders: [response.data, ...purchaseOrders],
              loading: false,
            });

            // Limpiar orden actual
            get().clearCurrentOrder();

            telemetryService.recordEvent('enhanced_purchase_order_created', {
              order_id: response.purchase_order_id,
              supplier_id: orderData.supplier_id,
              auto_pricing: orderData.auto_update_prices
            });
          }

          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Get purchase order analysis
      getPurchaseOrderAnalysis: async (purchaseOrderId) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.getPurchaseOrderAnalysis(purchaseOrderId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Validate purchase order integrity
      validatePurchaseOrderIntegrity: async (purchaseOrderId) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.validatePurchaseOrderIntegrity(purchaseOrderId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Get product unit costs
      getProductUnitCosts: async (productId, unit = null, limit = 10) => {
        return await purchaseService.getProductUnitCosts(productId, unit, limit);
      },

      // Calculate suggested price
      calculateSuggestedPrice: async (priceData) => {
        return await purchaseService.calculateSuggestedPrice(priceData);
      },

      cancelPurchaseOrder: async (id, reason = '') => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.cancelPurchase(id, reason);
          
          if (response.success) {
            // Actualizar estado en la lista
            const purchaseOrders = get().purchaseOrders.map(order =>
              order.id === id ? { ...order, status: 'cancelled' } : order
            );
            
            set({ purchaseOrders, loading: false });
            
            telemetryService.recordEvent('purchase_order_cancelled', {
              order_id: id,
              reason
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateOrderStatus: async (id, newStatus, notes = '') => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.updatePurchaseOrderStatus(id, newStatus, notes);
          
          if (response.success) {
            // Actualizar estado en la lista
            const purchaseOrders = get().purchaseOrders.map(order =>
              order.id === id ? { ...order, status: newStatus } : order
            );
            
            set({ purchaseOrders, loading: false });
            
            telemetryService.recordEvent('purchase_order_status_updated', {
              order_id: id,
              new_status: newStatus
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // ============ GESTIÓN DE ORDEN ACTUAL (MVP Style) ============
      
      setCurrentOrderSupplier: (supplierId, supplierName = '') => {
        const currentOrderData = get().currentOrderData;
        set({
          currentOrderData: {
            ...currentOrderData,
            supplierId,
            supplierName
          }
        });
        
        telemetryService.recordEvent('purchase_supplier_selected', { supplier_id: supplierId });
      },

      addItemToCurrentOrder: (product, quantity = 1, unitPrice = 0, options = {}) => {
        const currentOrderData = get().currentOrderData;
        const existingItemIndex = currentOrderData.items.findIndex(item => item.productId === product.id);

        let newItems;
        if (existingItemIndex >= 0) {
          // Actualizar cantidad del ítem existente
          newItems = currentOrderData.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Agregar nuevo ítem con campos enriquecidos
          const unitPriceValue = unitPrice || product.price || 0;
          newItems = [...currentOrderData.items, {
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: unitPriceValue,
            totalPrice: unitPriceValue * quantity,
            expDate: null,
            taxRateId: 1, // IVA por defecto
            // Nuevos campos enriquecidos
            unit: options.unit || product.unit || 'unit',
            profit_pct: options.profit_pct || product.profit_pct || currentOrderData.default_profit_margin || 30,
            tax_rate: options.tax_rate || 10, // IVA Paraguay
            line_total: unitPriceValue * quantity,
            sale_price: purchaseService.calculateSalePrice(unitPriceValue, options.profit_pct || 30)
          }];
        }
        
        // Recalcular totales (MVP: cálculos simples)
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subtotalAmount * 0.16; // IVA del 16%
        const totalAmount = subtotalAmount + taxAmount;
        
        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('item_added_to_purchase', {
          product_id: product.id,
          quantity: quantity,
          unit_price: unitPrice
        });
      },

      updateItemQuantity: (productId, quantity) => {
        const currentOrderData = get().currentOrderData;
        
        if (quantity <= 0) {
          get().removeItemFromCurrentOrder(productId);
          return;
        }
        
        const newItems = currentOrderData.items.map(item =>
          item.productId === productId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        
        // Recalcular totales
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subtotalAmount * 0.16;
        const totalAmount = subtotalAmount + taxAmount;
        
        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('purchase_item_quantity_updated', {
          product_id: productId,
          new_quantity: quantity
        });
      },

      updateItemPrice: (productId, unitPrice) => {
        const currentOrderData = get().currentOrderData;
        
        const newItems = currentOrderData.items.map(item =>
          item.productId === productId
            ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
            : item
        );
        
        // Recalcular totales
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subtotalAmount * 0.16;
        const totalAmount = subtotalAmount + taxAmount;
        
        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('purchase_item_price_updated', {
          product_id: productId,
          new_price: unitPrice
        });
      },

      removeItemFromCurrentOrder: (productId) => {
        const currentOrderData = get().currentOrderData;
        const newItems = currentOrderData.items.filter(item => item.productId !== productId);
        
        // Recalcular totales
        const subtotalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subtotalAmount * 0.16;
        const totalAmount = subtotalAmount + taxAmount;
        
        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount,
            taxAmount,
            totalAmount
          }
        });
        
        telemetryService.recordEvent('item_removed_from_purchase', { product_id: productId });
      },

      setOrderNotes: (notes) => {
        const currentOrderData = get().currentOrderData;
        set({
          currentOrderData: {
            ...currentOrderData,
            notes
          }
        });
      },

      setExpectedDelivery: (expectedDelivery) => {
        const currentOrderData = get().currentOrderData;
        set({
          currentOrderData: {
            ...currentOrderData,
            expectedDelivery
          }
        });
      },

      clearCurrentOrder: () => {
        set({
          currentOrderData: {
            supplierId: null,
            supplierName: '',
            items: [],
            totalAmount: 0,
            subtotalAmount: 0,
            taxAmount: 0,
            expectedDelivery: null,
            notes: '',
            status: 'PENDING',
            // Nuevos campos
            auto_update_prices: true,
            default_profit_margin: 30.0,
            payment_method_id: null,
            currency_id: null,
            metadata: {}
          }
        });

        telemetryService.recordEvent('purchase_order_cleared');
      },

      // ============ NUEVOS MÉTODOS PARA ENDPOINTS ENRIQUECIDOS ============

      // Vista previa de cancelación
      previewPurchaseOrderCancellation: async (purchaseOrderId) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.previewPurchaseOrderCancellation(purchaseOrderId);
          set({ loading: false });
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Cancelar orden con detalles
      cancelPurchaseOrderWithDetails: async (cancellationRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.cancelPurchaseOrderWithDetails(cancellationRequest);

          if (response.success) {
            // Actualizar estado en la lista
            const purchaseOrders = get().purchaseOrders.map(order =>
              order.id === cancellationRequest.purchase_order_id
                ? { ...order, status: 'CANCELLED' }
                : order
            );

            set({ purchaseOrders, loading: false });

            telemetryService.recordEvent('purchase_order_cancelled_with_details', {
              order_id: cancellationRequest.purchase_order_id,
              reason: cancellationRequest.cancellation_reason,
              force_cancel: cancellationRequest.force_cancel
            });
          }

          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Obtener orden con validación de proveedor
      getPurchaseOrderWithSupplierValidation: async (orderId, supplierName) => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.getPurchaseOrderByIdWithSupplierValidation(orderId, supplierName);

          if (response.success) {
            set({
              currentPurchaseOrder: response.data,
              loading: false,
            });
          }

          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Obtener compras por proveedor con filtros enriquecidos
      fetchPurchasesBySupplier: async (supplierId, options = {}) => {
        set({ loading: true, error: null });
        try {
          const filters = get().filters;
          const serviceOptions = {
            showInactiveSuppliers: filters.showInactiveSuppliers || false,
            ...options
          };

          const response = await purchaseService.getPurchasesBySupplier(supplierId, serviceOptions);

          if (response.success) {
            set({
              purchaseOrders: response.data || [],
              loading: false,
            });

            telemetryService.recordEvent('purchases_by_supplier_fetched', {
              supplier_id: supplierId,
              count: response.data?.length || 0,
              show_inactive: serviceOptions.showInactiveSuppliers
            });
          }

          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Actualizar configuración de orden actual
      updateCurrentOrderSettings: (settings) => {
        const currentOrderData = get().currentOrderData;
        set({
          currentOrderData: {
            ...currentOrderData,
            ...settings
          }
        });

        telemetryService.recordEvent('purchase_order_settings_updated', settings);
      },

      // ============ UTILIDADES Y HELPERS (MVP) ============
      
      fetchTaxRates: async (start = 1, limit = 10) => {
        try {
          const response = await purchaseService.getTaxRates(start, limit);
          if (response.success) {
            set({ taxRates: response.data });
          }
          return response;
        } catch (error) {
          console.error('Error fetching tax rates:', error);
          // Mantener las tasas demo como fallback
        }
      },

      searchOrders: async (searchTerm, searchType = 'supplier') => {
        set({ loading: true, error: null });
        try {
          const response = await purchaseService.searchPurchases(searchTerm, searchType);
          
          if (response.success) {
            set({
              purchaseOrders: response.data || [],
              loading: false
            });
          }
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      exportOrdersData: () => {
        const orders = get().purchaseOrders;
        return orders.map(order => ({
          id: order.id,
          proveedor: order.supplier_name,
          fecha: order.order_date,
          total: order.total_amount,
          estado: order.status,
          entrega_esperada: order.expected_delivery,
          notas: order.notes
        }));
      },

      // ============ SELECTORES (MVP Simple) ============
      
      getOrdersByStatus: (status) => {
        return get().purchaseOrders.filter(order => order.status === status);
      },

      getOrdersBySupplier: (supplierId) => {
        return get().purchaseOrders.filter(order => order.supplier_id === supplierId);
      },

      getCurrentOrderItemsCount: () => {
        return get().currentOrderData.items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getCurrentOrderTotal: () => {
        return get().currentOrderData.totalAmount;
      },
      
      canCreateOrder: () => {
        const { supplierId, items, totalAmount } = get().currentOrderData;
        return supplierId && items.length > 0 && totalAmount > 0;
      },

      // ============ GESTIÓN DE ESTADO ============
      
      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
      },

      resetFilters: () => {
        set({
          filters: {
            page: 1,
            limit: 10,
            supplierId: '',
            status: '',
            sortBy: 'order_date',
            sortOrder: 'desc',
          }
        });
      },

      clearError: () => set({ error: null }),

      clearCurrentPurchaseOrder: () => set({ currentPurchaseOrder: null }),
    }),
    { name: 'purchase-store' }
  )
);

export default usePurchaseStore;
