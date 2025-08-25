/**
 * Unified Payment Store - Enterprise Grade
 * Central state management for payment operations across Sales and Purchases
 * 
 * Features:
 * - Context-aware payment state (sales/purchases)
 * - Real-time payment processing status
 * - Payment history and analytics
 * - Error state management with recovery
 * - Offline support with queue management
 * - Performance optimizations with selective updates
 * 
 * Architecture: Unified store with context isolation
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { unifiedPaymentService } from '@/services/unifiedPaymentService';
import { salesPaymentAdapter } from '@/services/salesPaymentAdapter';
import { purchasePaymentAdapter } from '@/services/purchasePaymentAdapter';
import { TRANSACTION_CONTEXTS, PAYMENT_TYPES, PAYMENT_STATUS } from '@/services/paymentArchitecture';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} PaymentState
 * @property {Object} activePayments - Pagos activos por contexto
 * @property {Object} paymentHistory - Historial de pagos por contexto
 * @property {Object} statistics - Estadísticas de pagos
 * @property {Object} errors - Errores por contexto
 * @property {Object} loading - Estados de carga por operación
 * @property {Array} offlineQueue - Cola de pagos pendientes (offline)
 * @property {Object} cache - Cache de datos para performance
 */

const initialState = {
  // Payment processing state by context
  activePayments: {
    [TRANSACTION_CONTEXTS.SALE]: {},
    [TRANSACTION_CONTEXTS.PURCHASE]: {}
  },
  
  // Payment history by context
  paymentHistory: {
    [TRANSACTION_CONTEXTS.SALE]: [],
    [TRANSACTION_CONTEXTS.PURCHASE]: []
  },
  
  // Payment statistics
  statistics: {
    [TRANSACTION_CONTEXTS.SALE]: {
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      changeGiven: 0,
      lastUpdated: null
    },
    [TRANSACTION_CONTEXTS.PURCHASE]: {
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      pendingPayments: 0,
      lastUpdated: null
    },
    unified: {
      totalAmount: 0,
      totalTransactions: 0,
      cashVsDigital: { cash: 0, digital: 0 },
      lastUpdated: null
    }
  },
  
  // Error management by context
  errors: {
    [TRANSACTION_CONTEXTS.SALE]: null,
    [TRANSACTION_CONTEXTS.PURCHASE]: null,
    unified: null
  },
  
  // Loading states for different operations
  loading: {
    processPayment: false,
    loadHistory: false,
    loadStatistics: false,
    processMultiple: false
  },
  
  // Offline support
  offlineQueue: [],
  isOnline: true,
  
  // Performance cache
  cache: {
    statistics: {},
    history: {},
    lastCleared: Date.now()
  },
  
  // UI state
  ui: {
    activeContext: TRANSACTION_CONTEXTS.SALE,
    selectedPayments: [],
    filters: {
      dateRange: null,
      paymentType: null,
      status: null
    }
  }
};

export const usePaymentStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        /**
         * Actions for Payment Processing
         */
        
        // Process unified payment (Sales or Purchases)
        processPayment: async (paymentData) => {
          const { context } = paymentData;
          
          set((state) => {
            state.loading.processPayment = true;
            state.errors[context] = null;
          });
          
          telemetry.record('payment_store.process_payment.start', {
            context,
            amount: paymentData.amount,
            paymentType: paymentData.paymentType
          });
          
          try {
            let result;
            
            // Use appropriate adapter based on context
            if (context === TRANSACTION_CONTEXTS.SALE) {
              result = await salesPaymentAdapter.processSalesPayment(paymentData);
            } else if (context === TRANSACTION_CONTEXTS.PURCHASE) {
              result = await purchasePaymentAdapter.processPurchasePayment(paymentData);
            } else {
              throw new Error(`Invalid payment context: ${context}`);
            }
            
            // Update state with successful payment
            set((state) => {
              // Add to active payments
              state.activePayments[context][result.paymentId] = {
                ...result,
                timestamp: new Date().toISOString()
              };
              
              // Add to history
              state.paymentHistory[context].unshift(result);
              
              // Update statistics
              state.statistics[context].totalAmount += result.amount;
              state.statistics[context].totalTransactions += 1;
              state.statistics[context].averageAmount = 
                state.statistics[context].totalAmount / state.statistics[context].totalTransactions;
              state.statistics[context].lastUpdated = new Date().toISOString();
              
              // Update unified statistics
              state.statistics.unified.totalAmount += result.amount;
              state.statistics.unified.totalTransactions += 1;
              
              // Update cash vs digital tracking
              if (paymentData.paymentType === PAYMENT_TYPES.CASH) {
                state.statistics.unified.cashVsDigital.cash += result.amount;
              } else {
                state.statistics.unified.cashVsDigital.digital += result.amount;
              }
              
              state.statistics.unified.lastUpdated = new Date().toISOString();
              
              // Clear loading and errors
              state.loading.processPayment = false;
              state.errors[context] = null;
            });
            
            telemetry.record('payment_store.process_payment.success', {
              context,
              paymentId: result.paymentId,
              amount: result.amount,
              change: result.change || 0
            });
            
            return result;
          } catch (error) {
            set((state) => {
              state.loading.processPayment = false;
              state.errors[context] = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                recoverable: error.recoverable || false
              };
            });
            
            telemetry.record('payment_store.process_payment.error', {
              context,
              error: error.message,
              code: error.code
            });
            
            throw error;
          }
        },
        
        // Process multiple payments (for mixed payment scenarios)
        processMultiplePayments: async (transactionId, payments, context) => {
          set((state) => {
            state.loading.processMultiple = true;
            state.errors[context] = null;
          });
          
          try {
            let results;
            
            if (context === TRANSACTION_CONTEXTS.SALE) {
              results = await salesPaymentAdapter.processMultiplePayments(transactionId, payments);
            } else {
              // For purchases, process each payment individually
              results = {
                success: true,
                payments: [],
                totalPaid: 0,
                transactionCount: 0
              };
              
              for (const payment of payments) {
                const result = await purchasePaymentAdapter.processPurchasePayment({
                  purchaseId: transactionId,
                  ...payment
                });
                results.payments.push(result);
                results.totalPaid += payment.amount;
                results.transactionCount += 1;
              }
            }
            
            // Update state for each successful payment
            if (results.success) {
              set((state) => {
                results.payments.forEach((payment) => {
                  // Add to active payments
                  state.activePayments[context][payment.paymentId] = {
                    ...payment,
                    timestamp: new Date().toISOString(),
                    isPartOfMultiple: true
                  };
                  
                  // Add to history
                  state.paymentHistory[context].unshift(payment);
                });
                
                // Update statistics
                state.statistics[context].totalAmount += results.totalPaid;
                state.statistics[context].totalTransactions += results.transactionCount;
                state.statistics[context].averageAmount = 
                  state.statistics[context].totalAmount / state.statistics[context].totalTransactions;
                
                state.loading.processMultiple = false;
              });
            }
            
            return results;
          } catch (error) {
            set((state) => {
              state.loading.processMultiple = false;
              state.errors[context] = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        /**
         * Actions for Data Management
         */
        
        // Load payment history for specific context
        loadPaymentHistory: async (context, params = {}) => {
          set((state) => {
            state.loading.loadHistory = true;
            state.errors[context] = null;
          });
          
          try {
            const history = await unifiedPaymentService.getPaymentHistory({
              context,
              ...params
            });
            
            set((state) => {
              state.paymentHistory[context] = history.payments || [];
              state.loading.loadHistory = false;
              
              // Update cache
              const cacheKey = `${context}_${JSON.stringify(params)}`;
              state.cache.history[cacheKey] = {
                data: history,
                timestamp: Date.now()
              };
            });
            
            return history;
          } catch (error) {
            set((state) => {
              state.loading.loadHistory = false;
              state.errors[context] = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        // Load payment statistics
        loadPaymentStatistics: async (context, params = {}) => {
          set((state) => {
            state.loading.loadStatistics = true;
          });
          
          try {
            let stats;
            
            if (context === TRANSACTION_CONTEXTS.SALE) {
              stats = await salesPaymentAdapter.getSalesPaymentStatistics(params);
            } else if (context === TRANSACTION_CONTEXTS.PURCHASE) {
              stats = await purchasePaymentAdapter.getPurchasePaymentStatistics(params);
            } else {
              stats = await unifiedPaymentService.getPaymentStatistics(params);
            }
            
            set((state) => {
              if (context === 'unified') {
                state.statistics.unified = {
                  ...state.statistics.unified,
                  ...stats,
                  lastUpdated: new Date().toISOString()
                };
              } else {
                state.statistics[context] = {
                  ...state.statistics[context],
                  ...stats,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              state.loading.loadStatistics = false;
              
              // Update cache
              const cacheKey = `${context}_stats_${JSON.stringify(params)}`;
              state.cache.statistics[cacheKey] = {
                data: stats,
                timestamp: Date.now()
              };
            });
            
            return stats;
          } catch (error) {
            set((state) => {
              state.loading.loadStatistics = false;
              state.errors.unified = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        /**
         * Actions for Offline Support
         */
        
        // Add payment to offline queue
        addToOfflineQueue: (paymentData) => {
          set((state) => {
            state.offlineQueue.push({
              ...paymentData,
              id: `offline_${Date.now()}_${Math.random()}`,
              timestamp: new Date().toISOString()
            });
          });
          
          telemetry.record('payment_store.offline_queue.added', {
            context: paymentData.context,
            queueSize: get().offlineQueue.length
          });
        },
        
        // Process offline queue when online
        processOfflineQueue: async () => {
          const { offlineQueue, processPayment } = get();
          
          if (offlineQueue.length === 0) return;
          
          const results = {
            successful: [],
            failed: []
          };
          
          for (const payment of offlineQueue) {
            try {
              const result = await processPayment(payment);
              results.successful.push({ payment, result });
            } catch (error) {
              results.failed.push({ payment, error });
            }
          }
          
          // Clear processed payments from queue
          set((state) => {
            state.offlineQueue = state.offlineQueue.filter(
              payment => !results.successful.some(s => s.payment.id === payment.id)
            );
          });
          
          telemetry.record('payment_store.offline_queue.processed', {
            successful: results.successful.length,
            failed: results.failed.length,
            remaining: get().offlineQueue.length
          });
          
          return results;
        },
        
        // Update online status
        setOnlineStatus: (isOnline) => {
          set((state) => {
            state.isOnline = isOnline;
          });
          
          // Auto-process offline queue when coming online
          if (isOnline && get().offlineQueue.length > 0) {
            setTimeout(() => get().processOfflineQueue(), 1000);
          }
        },
        
        /**
         * Actions for UI State Management
         */
        
        // Set active context (sales/purchases)
        setActiveContext: (context) => {
          set((state) => {
            state.ui.activeContext = context;
          });
        },
        
        // Update filters
        updateFilters: (filters) => {
          set((state) => {
            state.ui.filters = { ...state.ui.filters, ...filters };
          });
        },
        
        // Select/deselect payments for bulk operations
        togglePaymentSelection: (paymentId) => {
          set((state) => {
            const selected = state.ui.selectedPayments;
            const index = selected.indexOf(paymentId);
            
            if (index === -1) {
              selected.push(paymentId);
            } else {
              selected.splice(index, 1);
            }
          });
        },
        
        // Clear all selections
        clearSelection: () => {
          set((state) => {
            state.ui.selectedPayments = [];
          });
        },
        
        /**
         * Actions for Error Management
         */
        
        // Clear error for specific context
        clearError: (context) => {
          set((state) => {
            state.errors[context] = null;
          });
        },
        
        // Clear all errors
        clearAllErrors: () => {
          set((state) => {
            Object.keys(state.errors).forEach(context => {
              state.errors[context] = null;
            });
          });
        },
        
        /**
         * Actions for Cache Management
         */
        
        // Clear cache (for performance)
        clearCache: () => {
          set((state) => {
            state.cache = {
              statistics: {},
              history: {},
              lastCleared: Date.now()
            };
          });
        },
        
        // Get cached data
        getCachedData: (type, key) => {
          const cache = get().cache[type]?.[key];
          if (!cache) return null;
          
          // Check if cache is still valid (5 minutes)
          const isExpired = Date.now() - cache.timestamp > 5 * 60 * 1000;
          return isExpired ? null : cache.data;
        },
        
        /**
         * Computed Properties (Selectors)
         */
        
        // Get payments for active context
        getActivePayments: () => {
          const { activeContext } = get().ui;
          return get().activePayments[activeContext];
        },
        
        // Get history for active context
        getActiveHistory: () => {
          const { activeContext } = get().ui;
          return get().paymentHistory[activeContext];
        },
        
        // Get statistics for active context
        getActiveStatistics: () => {
          const { activeContext } = get().ui;
          return get().statistics[activeContext];
        },
        
        // Get filtered history
        getFilteredHistory: () => {
          const { activeContext, filters } = get().ui;
          let history = get().paymentHistory[activeContext];
          
          if (filters.paymentType) {
            history = history.filter(p => p.paymentType === filters.paymentType);
          }
          
          if (filters.status) {
            history = history.filter(p => p.status === filters.status);
          }
          
          if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            history = history.filter(p => {
              const date = new Date(p.processedAt);
              return date >= start && date <= end;
            });
          }
          
          return history;
        }
      })),
      {
        name: 'payment-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          paymentHistory: state.paymentHistory,
          statistics: state.statistics,
          offlineQueue: state.offlineQueue,
          ui: state.ui
        })
      }
    )
  )
);

// Subscribe to online/offline events
if (typeof window !== 'undefined') {
  const store = usePaymentStore.getState();
  
  window.addEventListener('online', () => {
    store.setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    store.setOnlineStatus(false);
  });
  
  // Initialize online status
  store.setOnlineStatus(navigator.onLine);
}

export default usePaymentStore;
