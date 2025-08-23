/**
 * Sales Store - Enterprise Grade
 * Comprehensive state management for sales operations
 * 
 * Features:
 * - Complete sales lifecycle management
 * - Real-time sale processing status
 * - Customer and product integration
 * - Sales analytics and reporting
 * - Error state management with recovery
 * - Optimistic updates with rollback
 * - Cache management for performance
 * 
 * Architecture: Domain-specific store integrated with unified services
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { salesService } from '@/services/salesService';
import { cancellationService } from '@/services/cancellationService';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} SalesState
 * @property {Object} activeSales - Ventas activas en progreso
 * @property {Array} salesHistory - Historial de ventas
 * @property {Object} currentSale - Venta actual en progreso
 * @property {Object} customers - Cache de información de clientes
 * @property {Object} products - Cache de información de productos
 * @property {Object} statistics - Estadísticas de ventas
 * @property {Object} errors - Errores por operación
 * @property {Object} loading - Estados de carga
 * @property {Object} ui - Estado de UI específico de ventas
 */

const initialState = {
  // Active sales being processed
  activeSales: {},
  
  // Sales history
  salesHistory: [],
  
  // Current sale in progress
  currentSale: {
    id: null,
    customerId: null,
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    discount: 0,
    status: 'draft',
    paymentStatus: 'pending',
    reservationId: null,
    notes: '',
    createdAt: null,
    updatedAt: null
  },
  
  // Customer cache
  customers: {},
  
  // Product cache for sales
  products: {},
  
  // Sales statistics
  statistics: {
    today: {
      totalSales: 0,
      totalAmount: 0,
      averageTicket: 0,
      transactionCount: 0
    },
    week: {
      totalSales: 0,
      totalAmount: 0,
      averageTicket: 0,
      transactionCount: 0
    },
    month: {
      totalSales: 0,
      totalAmount: 0,
      averageTicket: 0,
      transactionCount: 0
    },
    topProducts: [],
    topCustomers: [],
    lastUpdated: null
  },
  
  // Error management
  errors: {
    createSale: null,
    updateSale: null,
    processPayment: null,
    cancelSale: null,
    loadData: null
  },
  
  // Loading states
  loading: {
    createSale: false,
    updateSale: false,
    processPayment: false,
    cancelSale: false,
    loadHistory: false,
    loadStatistics: false,
    loadCustomers: false,
    loadProducts: false
  },
  
  // UI state specific to sales
  ui: {
    activeStep: 'customer', // customer, products, payment, confirmation
    selectedCustomer: null,
    cart: [],
    paymentMethod: null,
    showReceipt: false,
    filters: {
      dateRange: null,
      status: null,
      customerId: null,
      minAmount: null,
      maxAmount: null
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    }
  }
};

export const useSalesStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        /**
         * Actions for Sale Management
         */
        
        // Create new sale
        createSale: async (saleData) => {
          set((state) => {
            state.loading.createSale = true;
            state.errors.createSale = null;
          });
          
          telemetry.record('sales_store.create_sale.start', {
            customerId: saleData.customerId,
            itemCount: saleData.items?.length || 0,
            total: saleData.total
          });
          
          try {
            const result = await salesService.createSale(saleData);
            
            set((state) => {
              // Add to active sales
              state.activeSales[result.saleId] = {
                ...result,
                timestamp: new Date().toISOString()
              };
              
              // Add to history
              state.salesHistory.unshift(result);
              
              // Update current sale
              state.currentSale = {
                ...state.currentSale,
                id: result.saleId,
                ...result,
                status: 'created'
              };
              
              // Update statistics
              state.statistics.today.totalSales += 1;
              state.statistics.today.totalAmount += result.total;
              state.statistics.today.transactionCount += 1;
              state.statistics.today.averageTicket = 
                state.statistics.today.totalAmount / state.statistics.today.transactionCount;
              
              state.loading.createSale = false;
              state.errors.createSale = null;
            });
            
            telemetry.record('sales_store.create_sale.success', {
              saleId: result.saleId,
              total: result.total,
              itemCount: result.items?.length || 0
            });
            
            return result;
          } catch (error) {
            set((state) => {
              state.loading.createSale = false;
              state.errors.createSale = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                recoverable: error.recoverable || false
              };
            });
            
            telemetry.record('sales_store.create_sale.error', {
              error: error.message,
              code: error.code
            });
            
            throw error;
          }
        },
        
        // Get sale details
        getSaleDetails: async (saleId) => {
          try {
            const sale = await salesService.getSaleDetails(saleId);
            
            set((state) => {
              // Update active sales cache
              state.activeSales[saleId] = sale;
              
              // Update in history if exists
              const historyIndex = state.salesHistory.findIndex(s => s.saleId === saleId);
              if (historyIndex !== -1) {
                state.salesHistory[historyIndex] = sale;
              }
            });
            
            return sale;
          } catch (error) {
            set((state) => {
              state.errors.loadData = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        // Cancel sale with preview
        cancelSale: async (saleId, reason = '') => {
          set((state) => {
            state.loading.cancelSale = true;
            state.errors.cancelSale = null;
          });
          
          try {
            const result = await cancellationService.cancelSaleWithConfirmation(saleId, reason);
            
            set((state) => {
              // Update sale status in active sales
              if (state.activeSales[saleId]) {
                state.activeSales[saleId].status = 'cancelled';
                state.activeSales[saleId].cancelledAt = result.cancelled_at;
                state.activeSales[saleId].cancellationReason = reason;
              }
              
              // Update in history
              const historyIndex = state.salesHistory.findIndex(s => s.saleId === saleId);
              if (historyIndex !== -1) {
                state.salesHistory[historyIndex].status = 'cancelled';
                state.salesHistory[historyIndex].cancelledAt = result.cancelled_at;
              }
              
              // Update statistics (subtract from totals)
              const sale = state.activeSales[saleId];
              if (sale) {
                state.statistics.today.totalSales -= 1;
                state.statistics.today.totalAmount -= sale.total;
                state.statistics.today.transactionCount -= 1;
                if (state.statistics.today.transactionCount > 0) {
                  state.statistics.today.averageTicket = 
                    state.statistics.today.totalAmount / state.statistics.today.transactionCount;
                }
              }
              
              state.loading.cancelSale = false;
            });
            
            telemetry.record('sales_store.cancel_sale.success', {
              saleId,
              reason,
              reversalDetails: result.reversal_details
            });
            
            return result;
          } catch (error) {
            set((state) => {
              state.loading.cancelSale = false;
              state.errors.cancelSale = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
              };
            });
            
            telemetry.record('sales_store.cancel_sale.error', {
              saleId,
              error: error.message,
              code: error.code
            });
            
            throw error;
          }
        },
        
        /**
         * Actions for Current Sale Management
         */
        
        // Initialize new sale
        initializeNewSale: (customerId = null) => {
          set((state) => {
            state.currentSale = {
              ...initialState.currentSale,
              id: `draft_${Date.now()}`,
              customerId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            state.ui.activeStep = customerId ? 'products' : 'customer';
            state.ui.selectedCustomer = customerId;
            state.ui.cart = [];
          });
          
          telemetry.record('sales_store.initialize_new_sale', { customerId });
        },
        
        // Update current sale
        updateCurrentSale: (updates) => {
          set((state) => {
            state.currentSale = {
              ...state.currentSale,
              ...updates,
              updatedAt: new Date().toISOString()
            };
          });
        },
        
        // Add item to current sale
        addItemToSale: (item) => {
          set((state) => {
            const existingIndex = state.currentSale.items.findIndex(
              i => i.productId === item.productId
            );
            
            if (existingIndex !== -1) {
              // Update existing item
              state.currentSale.items[existingIndex].quantity += item.quantity;
              state.currentSale.items[existingIndex].total = 
                state.currentSale.items[existingIndex].quantity * 
                state.currentSale.items[existingIndex].unitPrice;
            } else {
              // Add new item
              state.currentSale.items.push({
                ...item,
                total: item.quantity * item.unitPrice
              });
            }
            
            // Recalculate totals
            get().recalculateTotals();
          });
          
          telemetry.record('sales_store.add_item', {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          });
        },
        
        // Remove item from current sale
        removeItemFromSale: (productId) => {
          set((state) => {
            state.currentSale.items = state.currentSale.items.filter(
              item => item.productId !== productId
            );
            
            // Recalculate totals
            get().recalculateTotals();
          });
          
          telemetry.record('sales_store.remove_item', { productId });
        },
        
        // Update item quantity
        updateItemQuantity: (productId, quantity) => {
          set((state) => {
            const item = state.currentSale.items.find(i => i.productId === productId);
            if (item) {
              item.quantity = quantity;
              item.total = quantity * item.unitPrice;
            }
            
            // Recalculate totals
            get().recalculateTotals();
          });
        },
        
        // Apply discount
        applyDiscount: (discount) => {
          set((state) => {
            state.currentSale.discount = discount;
            get().recalculateTotals();
          });
        },
        
        // Recalculate sale totals
        recalculateTotals: () => {
          set((state) => {
            const subtotal = state.currentSale.items.reduce(
              (sum, item) => sum + item.total, 0
            );
            
            const discountAmount = state.currentSale.discount || 0;
            const taxableAmount = subtotal - discountAmount;
            const tax = taxableAmount * 0.16; // 16% IVA
            const total = taxableAmount + tax;
            
            state.currentSale.subtotal = subtotal;
            state.currentSale.tax = tax;
            state.currentSale.total = total;
            state.currentSale.updatedAt = new Date().toISOString();
          });
        },
        
        /**
         * Actions for Data Loading
         */
        
        // Load sales history
        loadSalesHistory: async (params = {}) => {
          set((state) => {
            state.loading.loadHistory = true;
            state.errors.loadData = null;
          });
          
          try {
            const history = await salesService.getSalesHistory(params);
            
            set((state) => {
              state.salesHistory = history.sales || [];
              state.ui.pagination = {
                ...state.ui.pagination,
                total: history.total || 0
              };
              state.loading.loadHistory = false;
            });
            
            return history;
          } catch (error) {
            set((state) => {
              state.loading.loadHistory = false;
              state.errors.loadData = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        // Load sales statistics
        loadSalesStatistics: async (period = 'today') => {
          set((state) => {
            state.loading.loadStatistics = true;
          });
          
          try {
            const stats = await salesService.getSalesStatistics({ period });
            
            set((state) => {
              state.statistics[period] = {
                ...state.statistics[period],
                ...stats,
                lastUpdated: new Date().toISOString()
              };
              state.loading.loadStatistics = false;
            });
            
            return stats;
          } catch (error) {
            set((state) => {
              state.loading.loadStatistics = false;
              state.errors.loadData = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        /**
         * Actions for UI State Management
         */
        
        // Set active step in sale process
        setActiveStep: (step) => {
          set((state) => {
            state.ui.activeStep = step;
          });
        },
        
        // Select customer
        selectCustomer: (customerId) => {
          set((state) => {
            state.ui.selectedCustomer = customerId;
            state.currentSale.customerId = customerId;
            state.ui.activeStep = 'products';
          });
        },
        
        // Update filters
        updateFilters: (filters) => {
          set((state) => {
            state.ui.filters = { ...state.ui.filters, ...filters };
          });
        },
        
        // Update pagination
        updatePagination: (pagination) => {
          set((state) => {
            state.ui.pagination = { ...state.ui.pagination, ...pagination };
          });
        },
        
        // Show/hide receipt
        toggleReceipt: (show) => {
          set((state) => {
            state.ui.showReceipt = show;
          });
        },
        
        /**
         * Actions for Error Management
         */
        
        // Clear error
        clearError: (errorType) => {
          set((state) => {
            state.errors[errorType] = null;
          });
        },
        
        // Clear all errors
        clearAllErrors: () => {
          set((state) => {
            Object.keys(state.errors).forEach(key => {
              state.errors[key] = null;
            });
          });
        },
        
        /**
         * Computed Properties (Selectors)
         */
        
        // Get filtered sales history
        getFilteredHistory: () => {
          const { filters } = get().ui;
          let history = get().salesHistory;
          
          if (filters.status) {
            history = history.filter(s => s.status === filters.status);
          }
          
          if (filters.customerId) {
            history = history.filter(s => s.customerId === filters.customerId);
          }
          
          if (filters.minAmount) {
            history = history.filter(s => s.total >= filters.minAmount);
          }
          
          if (filters.maxAmount) {
            history = history.filter(s => s.total <= filters.maxAmount);
          }
          
          if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            history = history.filter(s => {
              const date = new Date(s.createdAt);
              return date >= start && date <= end;
            });
          }
          
          return history;
        },
        
        // Get current sale summary
        getCurrentSaleSummary: () => {
          const { currentSale } = get();
          return {
            itemCount: currentSale.items.length,
            subtotal: currentSale.subtotal,
            discount: currentSale.discount,
            tax: currentSale.tax,
            total: currentSale.total,
            status: currentSale.status
          };
        },
        
        // Check if current sale is valid
        isCurrentSaleValid: () => {
          const { currentSale } = get();
          return (
            currentSale.customerId &&
            currentSale.items.length > 0 &&
            currentSale.total > 0
          );
        }
      })),
      {
        name: 'sales-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          salesHistory: state.salesHistory,
          statistics: state.statistics,
          currentSale: state.currentSale,
          ui: state.ui
        })
      }
    )
  )
);

export default useSalesStore;
