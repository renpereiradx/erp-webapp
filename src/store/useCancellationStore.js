/**
 * Cancellation Store - Enterprise Grade
 * Specialized state management for cancellation operations
 * 
 * Features:
 * - Cancellation impact preview and analysis
 * - Complete reversal workflow management
 * - Risk assessment and recommendation system
 * - Comprehensive audit trails
 * - Multi-step confirmation workflows
 * - Performance analytics for cancellation patterns
 * 
 * Architecture: Specialized store for complex cancellation workflows
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { cancellationService } from '@/services/cancellationService';
import { telemetry } from '@/utils/telemetry';

/**
 * @typedef {Object} CancellationState
 * @property {Object} activeCancellations - Cancelaciones en progreso
 * @property {Array} cancellationHistory - Historial de cancelaciones
 * @property {Object} currentPreview - Preview actual de cancelación
 * @property {Object} statistics - Estadísticas de cancelaciones
 * @property {Object} errors - Errores por operación
 * @property {Object} loading - Estados de carga
 * @property {Object} ui - Estado de UI para cancelaciones
 */

const initialState = {
  // Active cancellations being processed
  activeCancellations: {},
  
  // Cancellation history
  cancellationHistory: [],
  
  // Current cancellation preview
  currentPreview: {
    saleId: null,
    preview: null,
    confirmationSteps: [],
    currentStep: 0,
    userConfirmations: [],
    riskLevel: 'unknown'
  },
  
  // Cancellation statistics
  statistics: {
    today: {
      totalCancellations: 0,
      totalRefunded: 0,
      averageRefund: 0,
      reasons: {}
    },
    week: {
      totalCancellations: 0,
      totalRefunded: 0,
      averageRefund: 0,
      reasons: {}
    },
    month: {
      totalCancellations: 0,
      totalRefunded: 0,
      averageRefund: 0,
      reasons: {}
    },
    patterns: {
      commonReasons: [],
      frequentProducts: [],
      timeDistribution: {},
      riskFactors: []
    },
    lastUpdated: null
  },
  
  // Error management
  errors: {
    preview: null,
    cancel: null,
    loadHistory: null,
    validation: null
  },
  
  // Loading states
  loading: {
    preview: false,
    cancel: false,
    loadHistory: false,
    loadStatistics: false,
    validation: false
  },
  
  // UI state for cancellation workflows
  ui: {
    activeStep: 'preview', // preview, confirmation, processing, completed
    showConfirmationModal: false,
    showImpactDetails: false,
    selectedReason: null,
    customReason: '',
    autoConfirmLowRisk: true,
    filters: {
      dateRange: null,
      reason: null,
      riskLevel: null,
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

export const useCancellationStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        /**
         * Actions for Cancellation Preview
         */
        
        // Generate cancellation preview
        generatePreview: async (saleId) => {
          set((state) => {
            state.loading.preview = true;
            state.errors.preview = null;
            state.currentPreview.saleId = saleId;
          });
          
          telemetry.record('cancellation_store.generate_preview.start', { saleId });
          
          try {
            const preview = await cancellationService.previewCancellation(saleId);
            
            set((state) => {
              state.currentPreview = {
                saleId,
                preview,
                confirmationSteps: get()._generateConfirmationSteps(preview),
                currentStep: 0,
                userConfirmations: [],
                riskLevel: get()._assessRiskLevel(preview)
              };
              
              state.loading.preview = false;
              state.ui.activeStep = 'confirmation';
            });
            
            telemetry.record('cancellation_store.generate_preview.success', {
              saleId,
              riskLevel: get().currentPreview.riskLevel,
              stepsRequired: get().currentPreview.confirmationSteps.length
            });
            
            return preview;
          } catch (error) {
            set((state) => {
              state.loading.preview = false;
              state.errors.preview = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                saleId
              };
              state.currentPreview = { ...initialState.currentPreview };
            });
            
            telemetry.record('cancellation_store.generate_preview.error', {
              saleId,
              error: error.message,
              code: error.code
            });
            
            throw error;
          }
        },
        
        // Validate cancellation possibility
        validateCancellation: async (saleId) => {
          set((state) => {
            state.loading.validation = true;
            state.errors.validation = null;
          });
          
          try {
            const validation = await cancellationService.validateCancellation(saleId);
            
            set((state) => {
              state.loading.validation = false;
            });
            
            telemetry.record('cancellation_store.validate_cancellation', {
              saleId,
              canCancel: validation.canCancel,
              requirementsCount: validation.requirements?.length || 0
            });
            
            return validation;
          } catch (error) {
            set((state) => {
              state.loading.validation = false;
              state.errors.validation = {
                message: error.message,
                timestamp: new Date().toISOString(),
                saleId
              };
            });
            throw error;
          }
        },
        
        /**
         * Actions for Cancellation Execution
         */
        
        // Execute cancellation with confirmation workflow
        executeCancellation: async (saleId, reason = '', options = {}) => {
          const { skipConfirmation = false } = options;
          
          set((state) => {
            state.loading.cancel = true;
            state.errors.cancel = null;
            state.ui.activeStep = 'processing';
          });
          
          telemetry.record('cancellation_store.execute_cancellation.start', {
            saleId,
            reason,
            skipConfirmation,
            riskLevel: get().currentPreview.riskLevel
          });
          
          try {
            const result = await cancellationService.cancelSaleWithConfirmation(
              saleId, 
              reason, 
              {
                skipConfirmation,
                autoConfirmLowImpact: get().ui.autoConfirmLowRisk
              }
            );
            
            set((state) => {
              // Add to active cancellations
              state.activeCancellations[saleId] = {
                saleId,
                result,
                reason,
                timestamp: new Date().toISOString(),
                riskLevel: get().currentPreview.riskLevel
              };
              
              // Add to history
              state.cancellationHistory.unshift({
                saleId,
                ...result,
                reason,
                riskLevel: get().currentPreview.riskLevel,
                timestamp: new Date().toISOString()
              });
              
              // Update statistics
              if (result.success && result.reversal_details) {
                state.statistics.today.totalCancellations += 1;
                state.statistics.today.totalRefunded += result.reversal_details.total_refunded || 0;
                
                if (state.statistics.today.totalCancellations > 0) {
                  state.statistics.today.averageRefund = 
                    state.statistics.today.totalRefunded / state.statistics.today.totalCancellations;
                }
                
                // Track cancellation reasons
                if (reason) {
                  state.statistics.today.reasons[reason] = 
                    (state.statistics.today.reasons[reason] || 0) + 1;
                }
              }
              
              state.loading.cancel = false;
              state.ui.activeStep = result.success ? 'completed' : 'preview';
              
              // Clear current preview after successful cancellation
              if (result.success) {
                state.currentPreview = { ...initialState.currentPreview };
              }
            });
            
            telemetry.record('cancellation_store.execute_cancellation.success', {
              saleId,
              success: result.success,
              totalRefunded: result.reversal_details?.total_refunded || 0,
              reason
            });
            
            return result;
          } catch (error) {
            set((state) => {
              state.loading.cancel = false;
              state.errors.cancel = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                saleId,
                reason
              };
              state.ui.activeStep = 'preview';
            });
            
            telemetry.record('cancellation_store.execute_cancellation.error', {
              saleId,
              error: error.message,
              code: error.code,
              reason
            });
            
            throw error;
          }
        },
        
        /**
         * Actions for Confirmation Workflow
         */
        
        // Process confirmation step
        processConfirmationStep: (confirmed) => {
          set((state) => {
            const { currentStep, confirmationSteps } = state.currentPreview;
            
            // Record user confirmation
            state.currentPreview.userConfirmations[currentStep] = {
              confirmed,
              timestamp: new Date().toISOString(),
              step: confirmationSteps[currentStep]
            };
            
            if (confirmed && currentStep < confirmationSteps.length - 1) {
              // Move to next step
              state.currentPreview.currentStep = currentStep + 1;
            } else if (!confirmed) {
              // User declined, reset workflow
              state.currentPreview = { ...initialState.currentPreview };
              state.ui.activeStep = 'preview';
            } else {
              // All steps confirmed, ready to execute
              state.ui.activeStep = 'ready';
            }
          });
          
          telemetry.record('cancellation_store.confirmation_step', {
            saleId: get().currentPreview.saleId,
            step: get().currentPreview.currentStep,
            confirmed,
            totalSteps: get().currentPreview.confirmationSteps.length
          });
        },
        
        // Skip confirmation workflow
        skipConfirmationWorkflow: () => {
          set((state) => {
            state.ui.activeStep = 'ready';
          });
        },
        
        // Reset confirmation workflow
        resetConfirmationWorkflow: () => {
          set((state) => {
            state.currentPreview = { ...initialState.currentPreview };
            state.ui.activeStep = 'preview';
          });
        },
        
        /**
         * Actions for Data Loading
         */
        
        // Load cancellation history
        loadCancellationHistory: async (params = {}) => {
          set((state) => {
            state.loading.loadHistory = true;
            state.errors.loadHistory = null;
          });
          
          try {
            const history = await cancellationService.getCancellationHistory(params);
            
            set((state) => {
              state.cancellationHistory = history.cancellations || [];
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
              state.errors.loadHistory = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });
            throw error;
          }
        },
        
        // Load cancellation statistics
        loadCancellationStatistics: async (params = {}) => {
          set((state) => {
            state.loading.loadStatistics = true;
          });
          
          try {
            const stats = await cancellationService.getCancellationStatistics(params);
            
            set((state) => {
              const period = params.period || 'month';
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
              state.errors.loadHistory = {
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
        
        // Set active step
        setActiveStep: (step) => {
          set((state) => {
            state.ui.activeStep = step;
          });
        },
        
        // Set cancellation reason
        setCancellationReason: (reason, isCustom = false) => {
          set((state) => {
            if (isCustom) {
              state.ui.customReason = reason;
              state.ui.selectedReason = null;
            } else {
              state.ui.selectedReason = reason;
              state.ui.customReason = '';
            }
          });
        },
        
        // Toggle auto-confirmation for low-risk cancellations
        toggleAutoConfirmLowRisk: () => {
          set((state) => {
            state.ui.autoConfirmLowRisk = !state.ui.autoConfirmLowRisk;
          });
        },
        
        // Update filters
        updateFilters: (filters) => {
          set((state) => {
            state.ui.filters = { ...state.ui.filters, ...filters };
          });
        },
        
        // Show/hide confirmation modal
        toggleConfirmationModal: (show) => {
          set((state) => {
            state.ui.showConfirmationModal = show;
          });
        },
        
        // Show/hide impact details
        toggleImpactDetails: (show) => {
          set((state) => {
            state.ui.showImpactDetails = show;
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
         * Private Helper Methods
         */
        
        // Generate confirmation steps based on preview
        _generateConfirmationSteps: (preview) => {
          const steps = [];
          
          if (preview.impact_analysis.requires_payment_refund) {
            steps.push({
              type: 'payment_refund',
              title: 'Confirmación de Reembolso',
              message: `Se reembolsarán $${preview.impact_analysis.total_to_refund.toFixed(2)} en ${preview.impact_analysis.payments_to_cancel} pago(s).`,
              critical: true
            });
          }
          
          if (preview.impact_analysis.requires_reserve_cancellation) {
            steps.push({
              type: 'reserve_cancellation',
              title: 'Liberación de Reservas',
              message: `Se liberarán ${preview.impact_analysis.active_reserves} reserva(s) activa(s).`,
              critical: false
            });
          }
          
          if (preview.impact_analysis.requires_stock_adjustment) {
            steps.push({
              type: 'stock_adjustment',
              title: 'Restauración de Inventario',
              message: `Se restaurará el stock de ${preview.impact_analysis.physical_products} producto(s).`,
              critical: false
            });
          }
          
          if (preview.recommendations.estimated_complexity === 'high') {
            steps.push({
              type: 'high_complexity_warning',
              title: 'Advertencia de Complejidad Alta',
              message: 'Esta cancelación es de alta complejidad y puede requerir verificación manual posterior.',
              critical: true
            });
          }
          
          // Always add final confirmation
          steps.push({
            type: 'final_confirmation',
            title: 'Confirmación Final',
            message: `¿Está seguro de cancelar la venta ${preview.sale_info.sale_id}?`,
            critical: true
          });
          
          return steps;
        },
        
        // Assess risk level based on preview
        _assessRiskLevel: (preview) => {
          if (!preview.sale_info.can_be_reverted) {
            return 'blocked';
          }
          
          if (preview.recommendations.estimated_complexity === 'high') {
            return 'high';
          }
          
          if (preview.impact_analysis.requires_payment_refund && 
              preview.impact_analysis.total_to_refund > 1000) {
            return 'medium';
          }
          
          if (preview.impact_analysis.requires_reserve_cancellation ||
              preview.impact_analysis.requires_stock_adjustment) {
            return 'medium';
          }
          
          return 'low';
        },
        
        /**
         * Computed Properties (Selectors)
         */
        
        // Get filtered cancellation history
        getFilteredHistory: () => {
          const { filters } = get().ui;
          let history = get().cancellationHistory;
          
          if (filters.reason) {
            history = history.filter(c => c.reason?.includes(filters.reason));
          }
          
          if (filters.riskLevel) {
            history = history.filter(c => c.riskLevel === filters.riskLevel);
          }
          
          if (filters.minAmount) {
            history = history.filter(c => 
              (c.reversal_details?.total_refunded || 0) >= filters.minAmount
            );
          }
          
          if (filters.maxAmount) {
            history = history.filter(c => 
              (c.reversal_details?.total_refunded || 0) <= filters.maxAmount
            );
          }
          
          if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            history = history.filter(c => {
              const date = new Date(c.timestamp);
              return date >= start && date <= end;
            });
          }
          
          return history;
        },
        
        // Get current confirmation progress
        getConfirmationProgress: () => {
          const { currentStep, confirmationSteps, userConfirmations } = get().currentPreview;
          
          return {
            currentStep,
            totalSteps: confirmationSteps.length,
            progress: confirmationSteps.length > 0 ? 
              (currentStep / confirmationSteps.length) * 100 : 0,
            confirmationsGiven: userConfirmations.filter(c => c?.confirmed).length,
            canProceed: currentStep === confirmationSteps.length && 
                       userConfirmations.every(c => c?.confirmed)
          };
        },
        
        // Check if cancellation is ready to execute
        isReadyToExecute: () => {
          const progress = get().getConfirmationProgress();
          return progress.canProceed || get().ui.autoConfirmLowRisk && 
                 get().currentPreview.riskLevel === 'low';
        }
      })),
      {
        name: 'cancellation-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          cancellationHistory: state.cancellationHistory,
          statistics: state.statistics,
          ui: {
            autoConfirmLowRisk: state.ui.autoConfirmLowRisk,
            filters: state.ui.filters,
            pagination: state.ui.pagination
          }
        })
      }
    )
  )
);

export default useCancellationStore;
