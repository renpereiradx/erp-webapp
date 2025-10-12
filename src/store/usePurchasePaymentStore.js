/**
 * Store de pagos de compras - Gestión completa de órdenes y pagos a proveedores
 * Integración con APIs de purchase payment siguiendo patrón MVP
 * Funcionalidad: creación de órdenes, procesamiento de pagos, cancelaciones
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { purchasePaymentService } from '@/services/purchasePaymentService';

const initialState = {
  // Lista de órdenes de compra
  purchaseOrders: [],
  isPurchaseOrdersLoading: false,
  purchaseOrdersError: null,

  // Orden de compra actual
  currentPurchaseOrder: null,
  isCurrentPurchaseOrderLoading: false,
  currentPurchaseOrderError: null,

  // Historial de pagos
  paymentHistory: [],
  isPaymentHistoryLoading: false,
  paymentHistoryError: null,

  // Estados de operaciones
  isCreatingOrder: false,
  createOrderError: null,
  isProcessingPayment: false,
  processPaymentError: null,
  isCancellingPayment: false,
  cancelPaymentError: null,
  isCancellingOrder: false,
  cancelOrderError: null,

  // Preview de cancelación
  cancellationPreview: null,
  isCancellationPreviewLoading: false,
  cancellationPreviewError: null,

  // Estado de verificación
  integrationStatus: null,
  isVerifyingIntegration: false,
  verificationError: null,

  // Filtros activos
  activeFilters: {}
};

export const usePurchasePaymentStore = create()(
  devtools(
    (set, get) => ({
      ...initialState,

      // =================== GESTIÓN DE ÓRDENES DE COMPRA ===================

      /**
       * Crea una nueva orden de compra
       */
      createPurchaseOrder: async (purchaseData) => {
        // Validar datos antes de enviar
        const validationErrors = purchasePaymentService.validateCreatePurchaseOrderData(purchaseData);
        if (validationErrors.length > 0) {
          const error = new Error(`Datos inválidos: ${validationErrors.join(', ')}`);
          set({ createOrderError: error });
          throw error;
        }

        set({ isCreatingOrder: true, createOrderError: null });
        
        try {
          const newOrder = await purchasePaymentService.createPurchaseOrder(purchaseData);
          
          // Agregar nueva orden al inicio de la lista
          const { purchaseOrders } = get();
          set({ 
            purchaseOrders: [newOrder, ...purchaseOrders],
            isCreatingOrder: false 
          });
          
          return newOrder;
        } catch (error) {
          console.warn('Error creating purchase order:', error);
          set({ 
            createOrderError: error, 
            isCreatingOrder: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene lista de órdenes de compra con filtros
       */
      getPurchaseOrders: async (filters = {}) => {
        set({ 
          isPurchaseOrdersLoading: true, 
          purchaseOrdersError: null,
          activeFilters: filters 
        });
        
        try {
          const purchaseOrders = await purchasePaymentService.getPurchaseOrders(filters);
          set({ 
            purchaseOrders, 
            isPurchaseOrdersLoading: false 
          });
          return purchaseOrders;
        } catch (error) {
          console.warn('Error loading purchase orders:', error);
          set({ 
            purchaseOrdersError: error, 
            isPurchaseOrdersLoading: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene una orden de compra específica por ID
       */
      getPurchaseOrderById: async (purchaseOrderId) => {
        set({ isCurrentPurchaseOrderLoading: true, currentPurchaseOrderError: null });
        
        try {
          const purchaseOrder = await purchasePaymentService.getPurchaseOrderById(purchaseOrderId);
          set({ 
            currentPurchaseOrder: purchaseOrder, 
            isCurrentPurchaseOrderLoading: false 
          });
          return purchaseOrder;
        } catch (error) {
          console.warn('Error loading purchase order:', error);
          set({ 
            currentPurchaseOrderError: error, 
            isCurrentPurchaseOrderLoading: false 
          });
          throw error;
        }
      },

      /**
       * Actualiza orden en la lista después de modificaciones
       */
      updatePurchaseOrderInList: (updatedOrder) => {
        const { purchaseOrders } = get();
        const updatedOrders = purchaseOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
        set({ purchaseOrders: updatedOrders });
      },

      // =================== PROCESAMIENTO DE PAGOS ===================

      /**
       * Procesa un pago para una orden de compra
       */
      processPayment: async (purchaseOrderId, paymentData) => {
        // Validar datos de pago
        const validationErrors = purchasePaymentService.validatePaymentData(paymentData);
        if (validationErrors.length > 0) {
          const error = new Error(`Datos inválidos: ${validationErrors.join(', ')}`);
          set({ processPaymentError: error });
          throw error;
        }

        set({ isProcessingPayment: true, processPaymentError: null });
        
        try {
          const result = await purchasePaymentService.processPayment(purchaseOrderId, paymentData);
          
          // Actualizar orden en lista si está presente
          if (result.updated_purchase_order) {
            get().updatePurchaseOrderInList(result.updated_purchase_order);
          }
          
          // Actualizar orden actual si es la misma
          if (get().currentPurchaseOrder?.id === purchaseOrderId) {
            set({ currentPurchaseOrder: result.updated_purchase_order });
          }
          
          set({ isProcessingPayment: false });
          return result;
        } catch (error) {
          console.warn('Error processing payment:', error);
          set({ 
            processPaymentError: error, 
            isProcessingPayment: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene historial de pagos de una orden
       */
      getPaymentHistory: async (purchaseOrderId) => {
        set({ isPaymentHistoryLoading: true, paymentHistoryError: null });
        
        try {
          const paymentHistory = await purchasePaymentService.getPaymentHistory(purchaseOrderId);
          set({ 
            paymentHistory, 
            isPaymentHistoryLoading: false 
          });
          return paymentHistory;
        } catch (error) {
          console.warn('Error loading payment history:', error);
          set({ 
            paymentHistoryError: error, 
            isPaymentHistoryLoading: false 
          });
          throw error;
        }
      },

      // =================== CANCELACIONES ===================

      /**
       * Cancela un pago específico
       */
      cancelPayment: async (purchaseOrderId, paymentId, cancellationData = {}) => {
        set({ isCancellingPayment: true, cancelPaymentError: null });
        
        try {
          const result = await purchasePaymentService.cancelPayment(purchaseOrderId, paymentId, cancellationData);
          
          // Actualizar orden en lista si está presente
          if (result.updated_purchase_order) {
            get().updatePurchaseOrderInList(result.updated_purchase_order);
          }
          
          // Actualizar orden actual si es la misma
          if (get().currentPurchaseOrder?.id === purchaseOrderId) {
            set({ currentPurchaseOrder: result.updated_purchase_order });
          }
          
          // Refrescar historial de pagos
          if (get().paymentHistory.length > 0) {
            get().getPaymentHistory(purchaseOrderId);
          }
          
          set({ isCancellingPayment: false });
          return result;
        } catch (error) {
          console.warn('Error cancelling payment:', error);
          set({ 
            cancelPaymentError: error, 
            isCancellingPayment: false 
          });
          throw error;
        }
      },

      /**
       * Cancela completamente una orden de compra
       */
      cancelPurchaseOrder: async (purchaseOrderId, cancellationData = {}) => {
        set({ isCancellingOrder: true, cancelOrderError: null });
        
        try {
          const result = await purchasePaymentService.cancelPurchaseOrder(purchaseOrderId, cancellationData);
          
          // Actualizar orden en lista
          if (result.cancelled_purchase_order) {
            get().updatePurchaseOrderInList(result.cancelled_purchase_order);
          }
          
          // Actualizar orden actual si es la misma
          if (get().currentPurchaseOrder?.id === purchaseOrderId) {
            set({ currentPurchaseOrder: result.cancelled_purchase_order });
          }
          
          set({ isCancellingOrder: false });
          return result;
        } catch (error) {
          console.warn('Error cancelling purchase order:', error);
          set({ 
            cancelOrderError: error, 
            isCancellingOrder: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene preview de cancelación
       */
      getCancellationPreview: async (purchaseOrderId) => {
        set({ isCancellationPreviewLoading: true, cancellationPreviewError: null });
        
        try {
          const preview = await purchasePaymentService.getCancellationPreview(purchaseOrderId);
          set({ 
            cancellationPreview: preview, 
            isCancellationPreviewLoading: false 
          });
          return preview;
        } catch (error) {
          console.warn('Error loading cancellation preview:', error);
          set({ 
            cancellationPreviewError: error, 
            isCancellationPreviewLoading: false 
          });
          throw error;
        }
      },

      // =================== VERIFICACIÓN DE SISTEMA ===================

      /**
       * Verifica la integridad de la integración
       */
      verifyIntegration: async () => {
        set({ isVerifyingIntegration: true, verificationError: null });
        
        try {
          const integrationStatus = await purchasePaymentService.verifyIntegration();
          set({ 
            integrationStatus, 
            isVerifyingIntegration: false 
          });
          return integrationStatus;
        } catch (error) {
          console.warn('Error verifying integration:', error);
          set({ 
            verificationError: error, 
            isVerifyingIntegration: false 
          });
          throw error;
        }
      },

      // =================== UTILIDADES DE BÚSQUEDA Y FILTRADO ===================

      /**
       * Busca órdenes por término
       */
      searchPurchaseOrders: async (searchTerm, additionalFilters = {}) => {
        const filters = {
          ...additionalFilters,
          search: searchTerm
        };
        
        return await get().getPurchaseOrders(filters);
      },

      /**
       * Filtra órdenes por estado
       */
      filterByStatus: async (status, additionalFilters = {}) => {
        const filters = {
          ...additionalFilters,
          status
        };
        
        return await get().getPurchaseOrders(filters);
      },

      /**
       * Filtra órdenes por proveedor
       */
      filterBySupplier: async (supplierId, additionalFilters = {}) => {
        const filters = {
          ...additionalFilters,
          supplier_id: supplierId
        };
        
        return await get().getPurchaseOrders(filters);
      },

      // =================== UTILIDADES DE ESTADO ===================

      /**
       * Limpia errores específicos
       */
      clearError: (errorType) => {
        set({ [`${errorType}Error`]: null });
      },

      /**
       * Limpia todos los errores
       */
      clearAllErrors: () => {
        set({
          purchaseOrdersError: null,
          currentPurchaseOrderError: null,
          paymentHistoryError: null,
          createOrderError: null,
          processPaymentError: null,
          cancelPaymentError: null,
          cancelOrderError: null,
          cancellationPreviewError: null,
          verificationError: null
        });
      },

      /**
       * Limpia estados de navegación
       */
      clearCurrentOrder: () => {
        set({
          currentPurchaseOrder: null,
          paymentHistory: [],
          cancellationPreview: null
        });
      },

      /**
       * Reset completo del store
       */
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'purchase-payment-store',
      version: 1
    }
  )
);
