/**
 * Analytics Store - Wave 6: Advanced Analytics & Reporting
 * Enterprise-grade analytics state management
 * 
 * Features:
 * - Real-time analytics data
 * - Business intelligence insights
 * - Report generation and management
 * - Performance metrics tracking
 * - Cache management with offline support
 * 
 * Architecture: Domain-specific store with unified patterns
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { analyticsService } from '@/services/analyticsService';
import { telemetry } from '@/utils/telemetry';
import { createCircuitHelpers } from '@/store/helpers/circuit';
import { createOfflineSnapshotHelpers } from '@/store/helpers/offline';

// Wave 6: Circuit Breaker and Offline helpers
const circuit = createCircuitHelpers('analytics', telemetry);
const offline = createOfflineSnapshotHelpers('analytics-offline-snapshot', 'analytics', telemetry);

/**
 * @typedef {Object} AnalyticsState
 * @property {Object} salesAnalytics - Comprehensive sales analytics data
 * @property {Object} businessIntelligence - BI insights and predictions
 * @property {Object} realTimeDashboard - Real-time dashboard metrics
 * @property {Object} performanceMetrics - System and business performance
 * @property {Array} reports - Generated reports list
 * @property {Object} filters - Current analytics filters
 * @property {Object} loading - Loading states for different operations
 * @property {Object} errors - Error states for analytics operations
 */

const initialState = {
  // Sales Analytics Data
  salesAnalytics: {
    realTime: {
      activeSessions: 0,
      salesInProgress: 0,
      revenueToday: 0,
      conversionRate: 0
    },
    performance: {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      salesGrowth: 0,
      customerRetention: 0
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: []
    },
    customers: {
      newCustomers: 0,
      returningCustomers: 0,
      topCustomers: [],
      customerLifetimeValue: 0
    },
    products: {
      topProducts: [],
      categoryPerformance: [],
      inventoryTurnover: 0,
      stockAlerts: []
    },
    payments: {
      paymentMethods: [],
      transactionVolume: 0,
      processingTime: 0,
      failureRate: 0
    }
  },

  // Business Intelligence
  businessIntelligence: {
    predictions: {
      salesForecast: [],
      demandForecast: [],
      churnPrediction: [],
      seasonalTrends: []
    },
    market: {
      marketShare: 0,
      competitorAnalysis: [],
      industryTrends: [],
      opportunityAreas: []
    },
    operations: {
      efficiencyScore: 0,
      bottlenecks: [],
      optimization: [],
      automation: []
    },
    financial: {
      profitMargins: [],
      costAnalysis: [],
      riskAssessment: [],
      investmentOpportunities: []
    }
  },

  // Real-time Dashboard
  realTimeDashboard: {
    timestamp: null,
    sales: {
      current: 0,
      target: 0,
      growth: 0
    },
    revenue: {
      current: 0,
      target: 0,
      growth: 0
    },
    customers: {
      active: 0,
      new: 0,
      returning: 0
    },
    performance: {
      conversionRate: 0,
      averageOrderValue: 0,
      customerSatisfaction: 0
    }
  },

  // Performance Metrics
  performanceMetrics: {
    coreWebVitals: {},
    userEngagement: {},
    systemPerformance: {},
    businessMetrics: {}
  },

  // Reports Management
  reports: [],
  activeReports: {},

  // Filters and Configuration
  filters: {
    timeRange: '30d',
    dateFrom: null,
    dateTo: null,
    customerSegment: 'all',
    productCategory: 'all',
    salesChannel: 'all',
    region: 'all'
  },

  // UI State
  ui: {
    activeTab: 'overview',
    selectedMetric: null,
    chartType: 'line',
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true
  },

  // Loading States
  loading: {
    salesAnalytics: false,
    businessIntelligence: false,
    realTimeDashboard: false,
    performanceMetrics: false,
    generateReport: false,
    exportData: false
  },

  // Error Management
  errors: {
    salesAnalytics: null,
    businessIntelligence: null,
    realTimeDashboard: null,
    performanceMetrics: null,
    generateReport: null,
    exportData: null
  },

  // Wave 6: Circuit Breaker state
  ...circuit.init(),

  // Wave 6: Offline state
  isOffline: false,
  lastOfflineSnapshot: null,
  offlineBannerShown: false,
  lastOfflineAt: null,
  lastOnlineAt: null,
  autoRefetchOnReconnect: true
};

export const useAnalyticsStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        /**
         * Actions for Sales Analytics
         */

        // Load comprehensive sales analytics
        loadSalesAnalytics: async (params = {}) => {
          set((state) => {
            state.loading.salesAnalytics = true;
            state.errors.salesAnalytics = null;
          });

          // Wave 6: Check circuit breaker
          if (get()._circuitOpen()) {
            set((state) => {
              state.loading.salesAnalytics = false;
              state.errors.salesAnalytics = {
                message: 'Analytics service temporarily unavailable. Using cached data.',
                timestamp: new Date().toISOString(),
                code: 'CIRCUIT_OPEN'
              };
            });
            throw new Error('Circuit breaker is open');
          }

          try {
            telemetry.record('analytics.sales_analytics.load_start', params);

            const analytics = await analyticsService.getSalesAnalytics(params);

            // Wave 6: Record success
            get()._recordSuccess();

            set((state) => {
              state.salesAnalytics = analytics;
              state.loading.salesAnalytics = false;
              state.errors.salesAnalytics = null;

              // Wave 6: Create offline snapshot
              const snapshot = {
                salesAnalytics: state.salesAnalytics,
                businessIntelligence: state.businessIntelligence,
                realTimeDashboard: state.realTimeDashboard,
                lastUpdated: Date.now()
              };
              get()._persistOfflineSnapshot(snapshot);
            });

            telemetry.record('analytics.sales_analytics.load_success', {
              totalSales: analytics.performance.totalSales,
              trendsCount: analytics.trends.daily.length
            });

            return analytics;
          } catch (error) {
            // Wave 6: Record failure
            get()._recordFailure();

            set((state) => {
              state.loading.salesAnalytics = false;
              state.errors.salesAnalytics = {
                message: error.message,
                timestamp: new Date().toISOString(),
                code: error.code || 'UNKNOWN'
              };
            });

            telemetry.record('analytics.sales_analytics.load_error', {
              error: error.message,
              params
            });

            throw error;
          }
        },

        // Load business intelligence insights
        loadBusinessIntelligence: async (params = {}) => {
          set((state) => {
            state.loading.businessIntelligence = true;
            state.errors.businessIntelligence = null;
          });

          try {
            telemetry.record('analytics.business_intelligence.load_start', params);

            const insights = await analyticsService.getBusinessIntelligence(params);

            set((state) => {
              state.businessIntelligence = insights;
              state.loading.businessIntelligence = false;
            });

            telemetry.record('analytics.business_intelligence.load_success', {
              predictionsCount: insights.predictions.salesForecast.length,
              insightsLoaded: Object.keys(insights).length
            });

            return insights;
          } catch (error) {
            set((state) => {
              state.loading.businessIntelligence = false;
              state.errors.businessIntelligence = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });

            telemetry.record('analytics.business_intelligence.load_error', {
              error: error.message,
              params
            });

            throw error;
          }
        },

        // Load real-time dashboard data
        loadRealTimeDashboard: async () => {
          set((state) => {
            state.loading.realTimeDashboard = true;
            state.errors.realTimeDashboard = null;
          });

          try {
            const dashboard = await analyticsService.getRealTimeDashboard();

            set((state) => {
              state.realTimeDashboard = dashboard;
              state.loading.realTimeDashboard = false;
            });

            telemetry.record('analytics.realtime_dashboard.load_success', {
              timestamp: dashboard.timestamp,
              salesCurrent: dashboard.sales.current
            });

            return dashboard;
          } catch (error) {
            set((state) => {
              state.loading.realTimeDashboard = false;
              state.errors.realTimeDashboard = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });

            telemetry.record('analytics.realtime_dashboard.load_error', {
              error: error.message
            });

            throw error;
          }
        },

        // Load performance metrics
        loadPerformanceMetrics: async (timeRange = '30d') => {
          set((state) => {
            state.loading.performanceMetrics = true;
            state.errors.performanceMetrics = null;
          });

          try {
            const metrics = await analyticsService.getPerformanceMetrics(timeRange);

            set((state) => {
              state.performanceMetrics = metrics;
              state.loading.performanceMetrics = false;
            });

            telemetry.record('analytics.performance_metrics.load_success', {
              timeRange,
              metricsLoaded: Object.keys(metrics).length
            });

            return metrics;
          } catch (error) {
            set((state) => {
              state.loading.performanceMetrics = false;
              state.errors.performanceMetrics = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });

            telemetry.record('analytics.performance_metrics.load_error', {
              error: error.message,
              timeRange
            });

            throw error;
          }
        },

        /**
         * Actions for Report Management
         */

        // Generate custom report
        generateReport: async (reportConfig) => {
          set((state) => {
            state.loading.generateReport = true;
            state.errors.generateReport = null;
          });

          try {
            telemetry.record('analytics.report.generate_start', reportConfig);

            const report = await analyticsService.generateReport(reportConfig);

            set((state) => {
              state.reports.unshift(report);
              state.activeReports[report.id] = report;
              state.loading.generateReport = false;
            });

            telemetry.record('analytics.report.generate_success', {
              reportId: report.id,
              type: report.type
            });

            return report;
          } catch (error) {
            set((state) => {
              state.loading.generateReport = false;
              state.errors.generateReport = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });

            telemetry.record('analytics.report.generate_error', {
              error: error.message,
              reportConfig
            });

            throw error;
          }
        },

        // Export analytics data
        exportData: async (exportConfig) => {
          set((state) => {
            state.loading.exportData = true;
            state.errors.exportData = null;
          });

          try {
            await analyticsService.exportData(exportConfig);

            set((state) => {
              state.loading.exportData = false;
            });

            telemetry.record('analytics.export.success', exportConfig);

            return true;
          } catch (error) {
            set((state) => {
              state.loading.exportData = false;
              state.errors.exportData = {
                message: error.message,
                timestamp: new Date().toISOString()
              };
            });

            telemetry.record('analytics.export.error', {
              error: error.message,
              exportConfig
            });

            throw error;
          }
        },

        /**
         * Actions for Filters and Configuration
         */

        // Update filters
        updateFilters: (newFilters) => {
          set((state) => {
            state.filters = { ...state.filters, ...newFilters };
          });

          telemetry.record('analytics.filters.updated', newFilters);
        },

        // Update UI state
        updateUI: (uiUpdates) => {
          set((state) => {
            state.ui = { ...state.ui, ...uiUpdates };
          });
        },

        // Set active tab
        setActiveTab: (tab) => {
          set((state) => {
            state.ui.activeTab = tab;
          });

          telemetry.record('analytics.ui.tab_changed', { tab });
        },

        /**
         * Real-time Data Management
         */

        // Start real-time updates
        startRealTimeUpdates: () => {
          const { autoRefresh, refreshInterval } = get().ui;
          
          if (!autoRefresh) return;

          const intervalId = setInterval(() => {
            get().loadRealTimeDashboard().catch(error => {
              console.error('Real-time update failed:', error);
            });
          }, refreshInterval);

          telemetry.record('analytics.realtime.started', { refreshInterval });

          return intervalId;
        },

        // Stop real-time updates
        stopRealTimeUpdates: (intervalId) => {
          if (intervalId) {
            clearInterval(intervalId);
            telemetry.record('analytics.realtime.stopped');
          }
        },

        /**
         * Error Management
         */

        // Clear specific error
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
         * Computed Properties
         */

        // Get analytics summary
        getAnalyticsSummary: () => {
          const { salesAnalytics, realTimeDashboard } = get();
          
          return {
            totalSales: salesAnalytics.performance.totalSales,
            totalRevenue: salesAnalytics.performance.totalRevenue,
            conversionRate: realTimeDashboard.performance.conversionRate,
            activeCustomers: realTimeDashboard.customers.active,
            growth: salesAnalytics.performance.salesGrowth,
            lastUpdated: realTimeDashboard.timestamp
          };
        },

        // Get filtered analytics data
        getFilteredAnalytics: () => {
          const { salesAnalytics, filters } = get();
          
          // Apply filters to analytics data
          // TODO: Implement filtering logic based on current filters
          
          return salesAnalytics;
        },

        // ================= WAVE 6: CIRCUIT BREAKER HELPERS =================
        _recordFailure: () => circuit.recordFailure(get, set),
        _recordSuccess: () => circuit.recordSuccess(get, set),
        _circuitOpen: () => circuit.isOpen(get, set),
        _closeCircuit: (reason = 'manual') => circuit.close(get, set, reason),

        // ================= WAVE 6: OFFLINE SNAPSHOT HELPERS =================
        _persistOfflineSnapshot: (snapshot) => { offline.persist(snapshot); },
        hydrateFromStorage: () => {
          const parsed = offline.hydrate();
          if (parsed) {
            set({
              salesAnalytics: parsed.salesAnalytics || get().salesAnalytics,
              businessIntelligence: parsed.businessIntelligence || get().businessIntelligence,
              realTimeDashboard: parsed.realTimeDashboard || get().realTimeDashboard,
              lastOfflineSnapshot: parsed
            });
          }
          return parsed;
        },
        setIsOffline: (flag) => {
          const becoming = !!flag;
          set((s) => {
            const was = s.isOffline;
            if (!was && becoming) {
              try { telemetry.record?.('feature.analytics.offline.banner.show'); } catch (_) {}
              return { isOffline: true, offlineBannerShown: true, lastOfflineAt: Date.now() };
            }
            if (was && !becoming) {
              try { telemetry.record?.('feature.analytics.offline.banner.hide'); } catch (_) {}
              return { isOffline: false, lastOnlineAt: Date.now() };
            }
            return { isOffline: becoming };
          });
        },

        // Force refetch ignoring cache
        forceRefetch: async () => {
          try {
            telemetry.record?.('feature.analytics.force_refetch.start');
            await get().loadSalesAnalytics();
            await get().loadRealTimeDashboard();
            
            set((state) => {
              state.lastOnlineAt = Date.now();
            });
            
            telemetry.record?.('feature.analytics.force_refetch.success');
          } catch (error) {
            telemetry.record?.('feature.analytics.force_refetch.error', { error: error.message });
            throw error;
          }
        }
      })),
      {
        name: 'analytics-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          salesAnalytics: state.salesAnalytics,
          businessIntelligence: state.businessIntelligence,
          filters: state.filters,
          ui: state.ui,
          autoRefetchOnReconnect: state.autoRefetchOnReconnect,
          lastOfflineSnapshot: state.lastOfflineSnapshot
        })
      }
    )
  )
);

export default useAnalyticsStore;
