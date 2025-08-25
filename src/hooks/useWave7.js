import { useState, useEffect, useCallback } from 'react';
import { useObservability } from '../hooks/useObservability';
import { useMetricsStore } from '../store/useMetricsStore';

export const useWave7 = () => {
  const observability = useObservability();
  const metrics = useMetricsStore();
  const [observabilityState, setObservabilityState] = useState({
    isInitialized: false,
    realTimeActive: true,
    monitoringServices: {
      performance: true,
      business: true,
      system: true,
      errors: true
    },
    alertRules: [],
    dashboardConfig: {
      refreshInterval: 5000,
      autoRefresh: true,
      defaultTimeRange: '5m'
    }
  });

  // Initialize Wave 7 observability system
  const initializeObservability = useCallback(async () => {
    try {
      console.log('🔄 Initializing Wave 7 Observability System...');

      // Set up default alert rules
      const defaultAlertRules = [
        {
          id: 'response-time-high',
          metric: 'performance.responseTime',
          condition: 'greater_than',
          threshold: 1000,
          severity: 'warning',
          enabled: true
        },
        {
          id: 'response-time-critical',
          metric: 'performance.responseTime',
          condition: 'greater_than',
          threshold: 2000,
          severity: 'critical',
          enabled: true
        },
        {
          id: 'cache-hit-ratio-low',
          metric: 'cache.hitRatio',
          condition: 'less_than',
          threshold: 70,
          severity: 'warning',
          enabled: true
        },
        {
          id: 'error-rate-high',
          metric: 'api.errorRate',
          condition: 'greater_than',
          threshold: 5,
          severity: 'critical',
          enabled: true
        },
        {
          id: 'conversion-rate-low',
          metric: 'business.conversionRate',
          condition: 'less_than',
          threshold: 60,
          severity: 'warning',
          enabled: true
        }
      ];

      // Set alert thresholds
      metrics.setAlertThreshold('responseTime', 1000);
      metrics.setAlertThreshold('cacheHitRatio', 70);
      metrics.setAlertThreshold('errorRate', 5);
      metrics.setAlertThreshold('conversionRate', 60);

      // Enable real-time monitoring
      metrics.setRealTimeEnabled(true);

      // Start tracking initial metrics
      observability.trackBusinessEvent('observabilityInitialized', 1);
      observability.trackSystemResources();

      setObservabilityState(prev => ({
        ...prev,
        isInitialized: true,
        alertRules: defaultAlertRules
      }));

      console.log('✅ Wave 7 Observability System initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize Wave 7 Observability:', error);
      observability.trackError(error, { context: 'wave7-initialization' });
      return { success: false, error };
    }
  }, [observability, metrics]);

  // Performance monitoring service
  const performanceMonitoring = useCallback({
    startApiRequestTracking: () => {
      // Intercept fetch to track all API requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        const [url, options = {}] = args;
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          observability.trackApiRequest(
            url, 
            options.method || 'GET', 
            response.status, 
            endTime - startTime
          );
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          observability.trackApiRequest(
            url, 
            options.method || 'GET', 
            0, 
            endTime - startTime
          );
          throw error;
        }
      };
      
      return () => {
        window.fetch = originalFetch;
      };
    },

    trackPagePerformance: () => {
      // Track Core Web Vitals and other performance metrics
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              observability.trackPerformance('LCP', 0, entry.startTime);
              break;
            case 'first-input':
              observability.trackPerformance('FID', 0, entry.processingStart - entry.startTime);
              break;
            case 'layout-shift':
              observability.trackPerformance('CLS', 0, entry.value);
              break;
            case 'navigation':
              observability.trackPerformance('TTFB', 0, entry.responseStart);
              observability.trackPerformance('DOMContentLoaded', 0, entry.domContentLoadedEventEnd);
              break;
            default:
              break;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }

      return () => observer.disconnect();
    }
  }, [observability]);

  // Business intelligence monitoring
  const businessMonitoring = useCallback({
    trackUserJourney: (userId, journeyStep, data = {}) => {
      observability.trackBusinessEvent(`journey_${journeyStep}`, 1);
      observability.trackUserInteraction(journeyStep, 'user-journey', { userId, ...data });
    },

    trackConversionFunnel: (stage, conversionData) => {
      const stages = ['awareness', 'interest', 'consideration', 'purchase', 'retention'];
      const stageIndex = stages.indexOf(stage);
      
      if (stageIndex !== -1) {
        observability.trackBusinessEvent(`funnel_${stage}`, 1);
        
        // Track funnel drop-off
        if (stageIndex > 0) {
          const previousStage = stages[stageIndex - 1];
          observability.trackBusinessEvent(`funnel_${previousStage}_to_${stage}`, 1);
        }
      }
    },

    trackRevenue: (amount, currency = 'USD', source = 'unknown') => {
      observability.trackBusinessEvent('revenue', amount);
      observability.trackBusinessEvent(`revenue_${source}`, amount);
      observability.trackBusinessEvent(`revenue_${currency}`, amount);
    },

    trackUserEngagement: (action, duration = null) => {
      observability.trackUserInteraction(action, 'engagement');
      if (duration !== null) {
        observability.trackBusinessEvent('engagementDuration', duration);
      }
    }
  }, [observability]);

  // System health monitoring
  const systemMonitoring = useCallback({
    monitorResources: () => {
      const interval = setInterval(() => {
        // Memory usage
        if (performance.memory) {
          const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
          observability.queueMetric('system', 'memoryUsage', memoryUsage);
        }

        // Network status
        if (navigator.onLine !== undefined) {
          observability.queueMetric('system', 'networkStatus', navigator.onLine ? 1 : 0);
        }

        // Connection info
        if (navigator.connection) {
          observability.queueMetric('system', 'connectionSpeed', navigator.connection.downlink);
          observability.queueMetric('system', 'connectionRTT', navigator.connection.rtt);
        }

        // Document visibility
        observability.queueMetric('system', 'pageVisible', document.hidden ? 0 : 1);
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    },

    trackServiceHealth: (serviceName, isHealthy, responseTime = null) => {
      observability.queueMetric('services', `${serviceName}_health`, isHealthy ? 1 : 0);
      if (responseTime !== null) {
        observability.queueMetric('services', `${serviceName}_responseTime`, responseTime);
      }
    }
  }, [observability]);

  // Error tracking and monitoring
  const errorMonitoring = useCallback({
    setupGlobalErrorHandling: () => {
      // Unhandled errors
      const errorHandler = (event) => {
        observability.trackError(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript'
        });
      };

      // Unhandled promise rejections
      const rejectionHandler = (event) => {
        observability.trackError(new Error(event.reason), {
          type: 'unhandledRejection',
          promise: event.promise
        });
      };

      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', rejectionHandler);

      return () => {
        window.removeEventListener('error', errorHandler);
        window.removeEventListener('unhandledrejection', rejectionHandler);
      };
    },

    trackApiErrors: (url, method, status, errorMessage) => {
      observability.trackError(new Error(errorMessage), {
        type: 'api',
        url,
        method,
        status
      });
    }
  }, [observability]);

  // Alert management
  const alertManagement = useCallback({
    createAlert: (type, message, metric, value, threshold) => {
      const alert = {
        id: `${type}-${metric}-${Date.now()}`,
        type,
        message,
        metric,
        value,
        threshold,
        timestamp: Date.now(),
        resolved: false
      };

      observability.queueMetric('alerts', type, 1);
      return alert;
    },

    evaluateAlertRules: (metricsData) => {
      return observabilityState.alertRules
        .filter(rule => rule.enabled)
        .map(rule => {
          const metric = metrics.getMetric(...rule.metric.split('.'));
          if (!metric) return null;

          const currentValue = metric.current;
          let triggered = false;

          switch (rule.condition) {
            case 'greater_than':
              triggered = currentValue > rule.threshold;
              break;
            case 'less_than':
              triggered = currentValue < rule.threshold;
              break;
            case 'equals':
              triggered = currentValue === rule.threshold;
              break;
            default:
              break;
          }

          if (triggered) {
            return alertManagement.createAlert(
              rule.severity,
              `${rule.metric} ${rule.condition.replace('_', ' ')} ${rule.threshold}`,
              rule.metric,
              currentValue,
              rule.threshold
            );
          }

          return null;
        })
        .filter(Boolean);
    }
  }, [observabilityState.alertRules, observability, metrics]);

  // Dashboard configuration
  const dashboardConfig = useCallback({
    updateRefreshInterval: (interval) => {
      setObservabilityState(prev => ({
        ...prev,
        dashboardConfig: {
          ...prev.dashboardConfig,
          refreshInterval: interval
        }
      }));
    },

    toggleAutoRefresh: () => {
      setObservabilityState(prev => ({
        ...prev,
        dashboardConfig: {
          ...prev.dashboardConfig,
          autoRefresh: !prev.dashboardConfig.autoRefresh
        }
      }));
    },

    setDefaultTimeRange: (range) => {
      setObservabilityState(prev => ({
        ...prev,
        dashboardConfig: {
          ...prev.dashboardConfig,
          defaultTimeRange: range
        }
      }));
    }
  }, []);

  // Health check system
  const healthCheck = useCallback(async () => {
    const healthStatus = observability.getSystemStatus();
    
    return {
      timestamp: Date.now(),
      overall: healthStatus.healthy,
      score: healthStatus.healthScore,
      services: {
        observability: observabilityState.isInitialized,
        realTime: observabilityState.realTimeActive,
        monitoring: Object.values(observabilityState.monitoringServices).every(Boolean)
      },
      metrics: healthStatus.metrics,
      alerts: metrics.alerts.length
    };
  }, [observability, observabilityState, metrics.alerts]);

  // Export observability data
  const exportObservabilityData = useCallback(() => {
    const exportData = {
      timestamp: Date.now(),
      metrics: metrics.getAllMetrics(),
      alerts: metrics.alerts,
      configuration: observabilityState,
      healthCheck: healthCheck()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `observability-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    observability.trackBusinessEvent('observabilityDataExported', 1);
  }, [metrics, observabilityState, healthCheck, observability]);

  // Initialize Wave 7 on mount
  useEffect(() => {
    if (!observabilityState.isInitialized) {
      initializeObservability();
    }
  }, [initializeObservability, observabilityState.isInitialized]);

  // Set up monitoring services
  useEffect(() => {
    const cleanupFunctions = [];

    if (observabilityState.monitoringServices.performance) {
      cleanupFunctions.push(performanceMonitoring.startApiRequestTracking());
      cleanupFunctions.push(performanceMonitoring.trackPagePerformance());
    }

    if (observabilityState.monitoringServices.system) {
      cleanupFunctions.push(systemMonitoring.monitorResources());
    }

    if (observabilityState.monitoringServices.errors) {
      cleanupFunctions.push(errorMonitoring.setupGlobalErrorHandling());
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [
    observabilityState.monitoringServices,
    performanceMonitoring,
    systemMonitoring,
    errorMonitoring
  ]);

  return {
    // State
    observabilityState,
    setObservabilityState,

    // Core functions
    initializeObservability,
    healthCheck,
    exportObservabilityData,

    // Monitoring services
    performanceMonitoring,
    businessMonitoring,
    systemMonitoring,
    errorMonitoring,

    // Management
    alertManagement,
    dashboardConfig,

    // Utilities
    observability,
    metrics: {
      ...metrics,
      current: metrics.getAllMetrics(),
      health: observability.getSystemStatus()
    }
  };
};

export default useWave7;
