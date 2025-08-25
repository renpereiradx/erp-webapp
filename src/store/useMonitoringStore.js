/**
 * Monitoring Store
 * Wave 7: Observability & Monitoring
 * 
 * Centralized state management for monitoring, alerts, and observability
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import salesTelemetryService from '@/services/salesTelemetryService';
import errorTrackingService from '@/services/errorTrackingService';
import telemetryService from '@/services/telemetryService';

const useMonitoringStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    isMonitoring: false,
    realTimeData: {
      performance: null,
      errors: null,
      business: null,
      system: null
    },
    historicalData: {
      performance: [],
      errors: [],
      business: [],
      system: []
    },
    alerts: [],
    unacknowledgedAlerts: 0,
    dashboardConfig: {
      refreshInterval: 30000, // 30 seconds
      autoRefresh: true,
      showAlerts: true,
      showPerformance: true,
      showErrors: true,
      showBusiness: true
    },
    thresholds: {
      performance: {
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        apiResponse: { good: 200, poor: 1000 }
      },
      errors: {
        rate: { warning: 10, critical: 25 },
        criticalCount: { warning: 1, critical: 3 }
      },
      business: {
        conversionRate: { poor: 50, good: 80 },
        paymentSuccessRate: { poor: 95, good: 98 }
      }
    },
    filters: {
      timeRange: '1h',
      errorSeverity: 'all',
      errorCategory: 'all',
      businessMetric: 'all'
    },
    refreshInterval: null,

    // Actions
    startMonitoring: () => {
      const state = get();
      if (state.isMonitoring) return;

      set({ isMonitoring: true });

      // Subscribe to error alerts
      const unsubscribeAlerts = errorTrackingService.onAlert((alert) => {
        get().addAlert(alert);
      });

      // Start refresh interval
      const interval = setInterval(() => {
        if (get().dashboardConfig.autoRefresh) {
          get().refreshData();
        }
      }, state.dashboardConfig.refreshInterval);

      set({ 
        refreshInterval: interval,
        unsubscribeAlerts
      });

      // Initial data load
      get().refreshData();
    },

    stopMonitoring: () => {
      const state = get();
      if (!state.isMonitoring) return;

      if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
      }

      if (state.unsubscribeAlerts) {
        state.unsubscribeAlerts();
      }

      set({ 
        isMonitoring: false,
        refreshInterval: null,
        unsubscribeAlerts: null
      });
    },

    refreshData: async () => {
      try {
        const performance = salesTelemetryService.getPerformanceSummary();
        const errors = errorTrackingService.getErrorStats(get().filters.timeRange);
        const business = salesTelemetryService.getBusinessMetricsSummary();
        const alerts = errorTrackingService.getAlerts();

        set({
          realTimeData: {
            performance,
            errors,
            business,
            system: get().getSystemMetrics()
          },
          alerts,
          unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length
        });

        // Add to historical data
        get().addHistoricalData('performance', performance);
        get().addHistoricalData('errors', errors);
        get().addHistoricalData('business', business);

        telemetryService.record('monitoring.data.refreshed', {
          timestamp: Date.now(),
          dataTypes: ['performance', 'errors', 'business', 'alerts']
        });
      } catch (error) {
        console.error('Failed to refresh monitoring data:', error);
        errorTrackingService.recordError(error, { source: 'monitoring', operation: 'refresh' });
      }
    },

    addHistoricalData: (type, data) => {
      if (!data) return;

      set((state) => {
        const historical = [...state.historicalData[type]];
        historical.push({
          ...data,
          timestamp: Date.now()
        });

        // Keep only last 100 entries
        if (historical.length > 100) {
          historical.shift();
        }

        return {
          historicalData: {
            ...state.historicalData,
            [type]: historical
          }
        };
      });
    },

    addAlert: (alert) => {
      set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
        unacknowledgedAlerts: state.unacknowledgedAlerts + (alert.acknowledged ? 0 : 1)
      }));
    },

    acknowledgeAlert: (alertId) => {
      errorTrackingService.acknowledgeAlert(alertId);
      set((state) => ({
        alerts: state.alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true, acknowledgedAt: Date.now() }
            : alert
        ),
        unacknowledgedAlerts: Math.max(0, state.unacknowledgedAlerts - 1)
      }));
    },

    resolveAlert: (alertId) => {
      errorTrackingService.resolveAlert(alertId);
      set((state) => ({
        alerts: state.alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true, resolvedAt: Date.now() }
            : alert
        )
      }));
    },

    acknowledgeAllAlerts: () => {
      const state = get();
      state.alerts
        .filter(alert => !alert.acknowledged)
        .forEach(alert => errorTrackingService.acknowledgeAlert(alert.id));

      set((state) => ({
        alerts: state.alerts.map(alert => ({
          ...alert,
          acknowledged: true,
          acknowledgedAt: Date.now()
        })),
        unacknowledgedAlerts: 0
      }));
    },

    updateDashboardConfig: (config) => {
      set((state) => ({
        dashboardConfig: { ...state.dashboardConfig, ...config }
      }));

      // Restart monitoring with new config if currently monitoring
      const state = get();
      if (state.isMonitoring) {
        state.stopMonitoring();
        state.startMonitoring();
      }
    },

    updateThresholds: (thresholds) => {
      set((state) => ({
        thresholds: { ...state.thresholds, ...thresholds }
      }));

      // Update error tracking thresholds
      if (thresholds.errors) {
        errorTrackingService.updateThresholds(thresholds.errors);
      }
    },

    updateFilters: (filters) => {
      set((state) => ({
        filters: { ...state.filters, ...filters }
      }));

      // Refresh data with new filters
      get().refreshData();
    },

    getSystemMetrics: () => {
      const metrics = {
        timestamp: Date.now(),
        memory: null,
        network: null,
        storage: null
      };

      if (typeof window !== 'undefined') {
        // Memory usage (if available)
        if (window.performance?.memory) {
          metrics.memory = {
            used: window.performance.memory.usedJSHeapSize,
            total: window.performance.memory.totalJSHeapSize,
            limit: window.performance.memory.jsHeapSizeLimit,
            usage: (window.performance.memory.usedJSHeapSize / window.performance.memory.totalJSHeapSize) * 100
          };
        }

        // Network status
        if (navigator.connection) {
          metrics.network = {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          };
        }

        // Storage usage (if available)
        if (navigator.storage?.estimate) {
          navigator.storage.estimate().then(estimate => {
            metrics.storage = {
              quota: estimate.quota,
              usage: estimate.usage,
              available: estimate.quota - estimate.usage,
              percentage: (estimate.usage / estimate.quota) * 100
            };
          });
        }
      }

      return metrics;
    },

    getPerformanceScore: () => {
      const performance = get().realTimeData.performance;
      if (!performance) return null;

      const thresholds = get().thresholds.performance;
      let score = 0;
      let count = 0;

      // LCP Score
      if (performance.lcp?.avg) {
        const lcp = performance.lcp.avg;
        if (lcp <= thresholds.lcp.good) score += 100;
        else if (lcp <= thresholds.lcp.poor) score += 50;
        else score += 0;
        count++;
      }

      // FID Score
      if (performance.fid?.avg) {
        const fid = performance.fid.avg;
        if (fid <= thresholds.fid.good) score += 100;
        else if (fid <= thresholds.fid.poor) score += 50;
        else score += 0;
        count++;
      }

      // CLS Score
      if (performance.cls?.avg) {
        const cls = performance.cls.avg;
        if (cls <= thresholds.cls.good) score += 100;
        else if (cls <= thresholds.cls.poor) score += 50;
        else score += 0;
        count++;
      }

      return count > 0 ? Math.round(score / count) : null;
    },

    getErrorSeverityColor: (severity) => {
      const colors = {
        critical: 'rgb(239, 68, 68)', // red-500
        high: 'rgb(249, 115, 22)',     // orange-500
        medium: 'rgb(245, 158, 11)',   // amber-500
        low: 'rgb(34, 197, 94)'        // green-500
      };
      return colors[severity] || colors.low;
    },

    getAlertLevelColor: (level) => {
      const colors = {
        critical: 'rgb(239, 68, 68)', // red-500
        warning: 'rgb(245, 158, 11)',  // amber-500
        info: 'rgb(59, 130, 246)'      // blue-500
      };
      return colors[level] || colors.info;
    },

    exportData: (format = 'json') => {
      const state = get();
      const data = {
        realTimeData: state.realTimeData,
        historicalData: state.historicalData,
        alerts: state.alerts,
        configuration: {
          dashboardConfig: state.dashboardConfig,
          thresholds: state.thresholds,
          filters: state.filters
        },
        telemetry: salesTelemetryService.exportData('object'),
        errors: errorTrackingService.exportErrors('object'),
        timestamp: Date.now()
      };

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      return data;
    },

    clearData: () => {
      set({
        realTimeData: {
          performance: null,
          errors: null,
          business: null,
          system: null
        },
        historicalData: {
          performance: [],
          errors: [],
          business: [],
          system: []
        },
        alerts: [],
        unacknowledgedAlerts: 0
      });

      salesTelemetryService.clearMetrics();
      errorTrackingService.clearErrors();
    },

    // Computed values
    getHealthStatus: () => {
      const state = get();
      const performanceScore = state.getPerformanceScore();
      const errorCount = state.realTimeData.errors?.total || 0;
      const criticalAlerts = state.alerts.filter(a => a.level === 'critical' && !a.resolved).length;

      if (criticalAlerts > 0 || errorCount > state.thresholds.errors.rate.critical) {
        return 'critical';
      }

      if (errorCount > state.thresholds.errors.rate.warning || (performanceScore && performanceScore < 50)) {
        return 'warning';
      }

      return 'healthy';
    }
  }))
);

export default useMonitoringStore;
