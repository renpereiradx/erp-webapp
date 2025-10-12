/**
 * Store de pagos de ventas - Gestión de pagos para ventas existentes
 * Integración con APIs de sale payment para procesar pagos de órdenes pendientes
 * Funcionalidad: listar ventas, procesar pagos, cancelar ventas, integración con caja
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { salePaymentService } from '@/services/salePaymentService';

const initialState = {
  // Lista de ventas
  sales: [],
  isSalesLoading: false,
  salesError: null,

  // Venta actual
  currentSale: null,
  isCurrentSaleLoading: false,
  currentSaleError: null,

  // Historial de pagos
  paymentHistory: [],
  isPaymentHistoryLoading: false,
  paymentHistoryError: null,

  // Estados de operaciones
  isProcessingSale: false,
  processSaleError: null,
  isProcessingPayment: false,
  processPaymentError: null,
  isCancellingPayment: false,
  cancelPaymentError: null,
  isCancellingSale: false,
  cancelSaleError: null,

  // Preview de cancelación
  cancellationPreview: null,
  isCancellationPreviewLoading: false,
  cancellationPreviewError: null,

  // Estado de verificación
  integrationStatus: null,
  isVerifyingIntegration: false,
  verificationError: null,

  // Estado de filtros y estadísticas
  changeStatistics: null,
  isLoadingStatistics: false,
  statisticsError: null,

  // Filtros activos
  activeFilters: {}
};

export const useSalePaymentStore = create()(
  devtools(
    (set, get) => ({
      ...initialState,

      // =================== GESTIÓN DE VENTAS EXISTENTES ===================

      // =================== CARGA DE VENTAS EXISTENTES ===================

      /**
       * Obtiene lista de ventas por rango de fechas
       */
      getSalesByDateRange: async (filters = {}) => {
        set({ 
          isSalesLoading: true, 
          salesError: null,
          activeFilters: filters 
        });
        
        try {
          const result = await salePaymentService.getSalesByDateRange(filters);
          set({ 
            sales: result.sales || [], 
            isSalesLoading: false 
          });
          return result;
        } catch (error) {
          console.warn('Error loading sales by date range:', error);
          set({ 
            salesError: error, 
            isSalesLoading: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene una venta específica por ID
       */
      getSaleById: async (saleId) => {
        set({ isCurrentSaleLoading: true, currentSaleError: null });

        try {
          const sale = await salePaymentService.getSaleById(saleId);
          set({
            currentSale: sale,
            isCurrentSaleLoading: false
          });
          return sale;
        } catch (error) {
          console.warn('Error loading sale:', error);
          set({
            currentSaleError: error,
            isCurrentSaleLoading: false
          });
          throw error;
        }
      },

      /**
       * Actualiza venta en la lista después de modificaciones
       */
      updateSaleInList: (updatedSale) => {
        const { sales } = get();
        const updatedSales = sales.map(sale => 
          sale.id === updatedSale.id ? updatedSale : sale
        );
        set({ sales: updatedSales });
      },

      // =================== PROCESAMIENTO DE PAGOS ===================

      /**
       * Procesa un pago para una venta existente
       */
      processPayment: async (paymentData) => {
        // Validar datos de pago
        const validationErrors = salePaymentService.validatePaymentData(paymentData);
        if (validationErrors.length > 0) {
          const error = new Error(`Datos inválidos: ${validationErrors.join(', ')}`);
          set({ processPaymentError: error });
          throw error;
        }

        set({ isProcessingPayment: true, processPaymentError: null });
        
        try {
          const result = await salePaymentService.processPayment(paymentData);
          
          // Actualizar venta en lista si está presente
          const { sales } = get();
          const updatedSales = sales.map(sale => 
            sale.sales_order_id === paymentData.sales_order_id ? { ...sale, status: 'COMPLETED' } : sale
          );
          set({ sales: updatedSales });
          
          // Actualizar venta actual si es la misma
          if (get().currentSale?.sales_order_id === paymentData.sales_order_id) {
            set({ currentSale: { ...get().currentSale, status: 'COMPLETED' } });
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
       * Procesa pago con integración de caja registradora
       */
      processSalePaymentWithCashRegister: async (paymentData) => {
        // Validar datos de pago con caja registradora
        const validationErrors = salePaymentService.validateCashRegisterPaymentData(paymentData);
        if (validationErrors.length > 0) {
          const error = new Error(`Datos inválidos: ${validationErrors.join(', ')}`);
          set({ processPaymentError: error });
          throw error;
        }

        set({ isProcessingPayment: true, processPaymentError: null });
        
        try {
          const result = await salePaymentService.processSalePaymentWithCashRegister(paymentData);
          
          // Actualizar venta en lista si está presente
          const { sales } = get();
          const updatedSales = sales.map(sale => 
            sale.sales_order_id === paymentData.sales_order_id ? { ...sale, status: 'COMPLETED' } : sale
          );
          set({ sales: updatedSales });
          
          set({ isProcessingPayment: false });
          return result;
        } catch (error) {
          console.warn('Error processing payment with cash register:', error);
          set({ 
            processPaymentError: error, 
            isProcessingPayment: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene detalles de pago por venta
       */
      getPaymentDetails: async (saleId) => {
        set({ isPaymentHistoryLoading: true, paymentHistoryError: null });
        
        try {
          const paymentDetails = await salePaymentService.getPaymentDetails(saleId);
          set({ 
            paymentHistory: paymentDetails.payments || [], 
            isPaymentHistoryLoading: false 
          });
          return paymentDetails;
        } catch (error) {
          console.warn('Error loading payment details:', error);
          set({ 
            paymentHistoryError: error, 
            isPaymentHistoryLoading: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene estadísticas de vueltos
       */
      getChangeStatistics: async (filters = {}) => {
        set({ isLoadingStatistics: true, statisticsError: null });
        
        try {
          const statistics = await salePaymentService.getChangeStatistics(filters);
          set({ 
            changeStatistics: statistics, 
            isLoadingStatistics: false 
          });
          return statistics;
        } catch (error) {
          console.warn('Error loading change statistics:', error);
          set({ 
            statisticsError: error, 
            isLoadingStatistics: false 
          });
          throw error;
        }
      },

      // =================== CANCELACIONES DE VENTAS ===================

      /**
       * Cancela completamente una venta
       */
      cancelSale: async (saleId, cancellationData = {}) => {
        // Validar datos de cancelación
        const validationErrors = salePaymentService.validateCancellationData(cancellationData);
        if (validationErrors.length > 0) {
          const error = new Error(`Datos inválidos: ${validationErrors.join(', ')}`);
          set({ cancelSaleError: error });
          throw error;
        }

        set({ isCancellingSale: true, cancelSaleError: null });
        
        try {
          const result = await salePaymentService.cancelSale(saleId, cancellationData);
          
          // Actualizar venta en lista
          const { sales } = get();
          const updatedSales = sales.map(sale => 
            sale.sales_order_id === saleId ? { ...sale, status: 'CANCELLED' } : sale
          );
          set({ sales: updatedSales });
          
          // Actualizar venta actual si es la misma
          if (get().currentSale?.sales_order_id === saleId) {
            set({ currentSale: { ...get().currentSale, status: 'CANCELLED' } });
          }
          
          set({ isCancellingSale: false });
          return result;
        } catch (error) {
          console.warn('Error cancelling sale:', error);
          set({ 
            cancelSaleError: error, 
            isCancellingSale: false 
          });
          throw error;
        }
      },

      /**
       * Obtiene preview de cancelación
       */
      getCancellationPreview: async (saleId) => {
        set({ isCancellationPreviewLoading: true, cancellationPreviewError: null });
        
        try {
          const preview = await salePaymentService.getCancellationPreview(saleId);
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
          const integrationStatus = await salePaymentService.verifyIntegration();
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
       * Busca ventas por cliente
       */
      searchSalesByClient: async (clientId, additionalFilters = {}) => {
        return await salePaymentService.searchSalesByClient(clientId, additionalFilters);
      },

      /**
       * Busca ventas por estado
       */
      searchSalesByStatus: async (status, additionalFilters = {}) => {
        return await salePaymentService.searchSalesByStatus(status, additionalFilters);
      },

      /**
       * Obtiene reporte de cambios de precio
       */
      getPriceChangeReport: async (filters = {}) => {
        try {
          const report = await salePaymentService.getPriceChangeReport(filters);
          return report;
        } catch (error) {
          console.warn('Error loading price change report:', error);
          throw error;
        }
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
          salesError: null,
          currentSaleError: null,
          paymentHistoryError: null,
          processPaymentError: null,
          cancelSaleError: null,
          cancellationPreviewError: null,
          verificationError: null,
          statisticsError: null
        });
      },

      /**
       * Limpia estados de navegación
       */
      clearCurrentSale: () => {
        set({
          currentSale: null,
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
      name: 'sale-payment-store',
      version: 1
    }
  )
);
