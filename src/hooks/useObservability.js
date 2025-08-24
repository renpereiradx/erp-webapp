import { useState, useEffect, useCallback, useRef } from 'react';
import { useMetricsStore } from '../store/useMetricsStore';

export const useObservability = () => {
  const {
    addMetric,
    getMetric,
    getAllMetrics,
    getHealthScore,
    realTimeEnabled
  } = useMetricsStore();

  const metricsQueue = useRef([]);
  const batchInterval = useRef(null);
  const performanceObserver = useRef(null);

  // Batch metrics to avoid overwhelming the store
  const flushMetrics = useCallback(() => {
    if (metricsQueue.current.length === 0) return;

    metricsQueue.current.forEach(({ category, name, value }) => {
      addMetric(category, name, value);
    });

    metricsQueue.current = [];
  }, [addMetric]);

  // Queue metric for batching
  const queueMetric = useCallback((category, name, value) => {
    metricsQueue.current.push({ category, name, value });
  }, []);

  // Start batching system
  useEffect(() => {
    batchInterval.current = setInterval(flushMetrics, 1000); // Flush every second
    return () => {
      if (batchInterval.current) {
        clearInterval(batchInterval.current);
      }
    };
  }, [flushMetrics]);

  // Performance monitoring
  const trackPerformance = useCallback((name, startTime, endTime = performance.now()) => {
    const duration = endTime - startTime;
    queueMetric('performance', name, duration);
    queueMetric('performance', 'responseTime', duration);
  }, [queueMetric]);

  // API request tracking
  const trackApiRequest = useCallback((url, method, status, duration) => {
    queueMetric('api', 'totalRequests', 1);
    queueMetric('api', `${method.toLowerCase()}Requests`, 1);
    queueMetric('performance', 'apiResponseTime', duration);

    if (status >= 200 && status < 300) {
      queueMetric('api', 'successfulRequests', 1);
      queueMetric('circuit', 'successes', 1);
    } else {
      queueMetric('api', 'failedRequests', 1);
      queueMetric('circuit', 'failures', 1);
    }

    // Track specific endpoints
    const endpoint = new URL(url).pathname;
    queueMetric('endpoints', endpoint.replace(/[^a-zA-Z0-9]/g, '_'), duration);
  }, [queueMetric]);

  // Cache tracking
  const trackCacheHit = useCallback((key) => {
    queueMetric('cache', 'hits', 1);
    queueMetric('cache', 'totalOperations', 1);
  }, [queueMetric]);

  const trackCacheMiss = useCallback((key) => {
    queueMetric('cache', 'misses', 1);
    queueMetric('cache', 'totalOperations', 1);
  }, [queueMetric]);

  // Business metrics tracking
  const trackBusinessEvent = useCallback((event, value = 1) => {
    queueMetric('business', event, value);
    
    // Track common business flows
    switch (event) {
      case 'purchaseStarted':
        queueMetric('business', 'startedPurchases', 1);
        break;
      case 'purchaseCompleted':
        queueMetric('business', 'completedPurchases', 1);
        break;
      case 'userRegistered':
        queueMetric('business', 'newUsers', 1);
        break;
      case 'sessionStarted':
        queueMetric('business', 'activeSessions', 1);
        break;
      default:
        break;
    }
  }, [queueMetric]);

  // Error tracking
  const trackError = useCallback((error, context = {}) => {
    queueMetric('errors', 'totalErrors', 1);
    queueMetric('errors', error.name || 'UnknownError', 1);
    
    if (context.component) {
      queueMetric('errors', `component_${context.component}`, 1);
    }

    // Log error for debugging
    console.error('Tracked error:', error, context);
  }, [queueMetric]);

  // User interaction tracking
  const trackUserInteraction = useCallback((action, component, data = {}) => {
    queueMetric('interactions', action, 1);
    queueMetric('interactions', `${component}_${action}`, 1);
    queueMetric('interactions', 'totalInteractions', 1);

    // Track engagement metrics
    if (data.timeSpent) {
      queueMetric('engagement', 'averageTimeSpent', data.timeSpent);
    }
  }, [queueMetric]);

  // System resource tracking
  const trackSystemResources = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory;
      queueMetric('system', 'memoryUsed', memory.usedJSHeapSize);
      queueMetric('system', 'memoryTotal', memory.totalJSHeapSize);
      queueMetric('system', 'memoryLimit', memory.jsHeapSizeLimit);
    }

    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      queueMetric('system', 'connectionSpeed', connection.downlink);
      queueMetric('system', 'connectionRTT', connection.rtt);
    }
  }, [queueMetric]);

  // Performance Observer for detailed metrics
  useEffect(() => {
    if (typeof window === 'undefined' || !realTimeEnabled) return;

    try {
      performanceObserver.current = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'navigation':
              queueMetric('performance', 'domContentLoaded', entry.domContentLoadedEventEnd);
              queueMetric('performance', 'loadComplete', entry.loadEventEnd);
              break;
            case 'paint':
              queueMetric('performance', entry.name.replace(/[^a-zA-Z0-9]/g, ''), entry.startTime);
              break;
            case 'largest-contentful-paint':
              queueMetric('performance', 'largestContentfulPaint', entry.startTime);
              break;
            case 'first-input':
              queueMetric('performance', 'firstInputDelay', entry.processingStart - entry.startTime);
              break;
            case 'layout-shift':
              queueMetric('performance', 'cumulativeLayoutShift', entry.value);
              break;
            default:
              break;
          }
        });
      });

      performanceObserver.current.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, [realTimeEnabled, queueMetric]);

  // System resource monitoring
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(trackSystemResources, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [realTimeEnabled, trackSystemResources]);

  // Real-time performance wrapper
  const withPerformanceTracking = useCallback((name, fn) => {
    return async (...args) => {
      const startTime = performance.now();
      try {
        const result = await fn(...args);
        trackPerformance(name, startTime);
        return result;
      } catch (error) {
        trackError(error, { operation: name });
        throw error;
      }
    };
  }, [trackPerformance, trackError]);

  // HTTP request interceptor
  const trackFetch = useCallback((url, options = {}) => {
    const startTime = performance.now();
    
    return fetch(url, options)
      .then(response => {
        const endTime = performance.now();
        trackApiRequest(url, options.method || 'GET', response.status, endTime - startTime);
        return response;
      })
      .catch(error => {
        const endTime = performance.now();
        trackApiRequest(url, options.method || 'GET', 0, endTime - startTime);
        trackError(error, { url, method: options.method });
        throw error;
      });
  }, [trackApiRequest, trackError]);

  // Component lifecycle tracking
  const useComponentTracking = useCallback((componentName) => {
    const mountTime = useRef(performance.now());
    const [renderCount, setRenderCount] = useState(0);

    useEffect(() => {
      // Track component mount
      trackUserInteraction('mount', componentName);
      
      return () => {
        // Track component unmount and time spent
        const timeSpent = performance.now() - mountTime.current;
        trackUserInteraction('unmount', componentName, { timeSpent });
      };
    }, [componentName]);

    useEffect(() => {
      // Track renders
      setRenderCount(prev => prev + 1);
      if (renderCount > 0) {
        queueMetric('performance', `${componentName}_renders`, renderCount);
      }
    });

    return { renderCount };
  }, [trackUserInteraction, queueMetric]);

  // Alert system
  const createAlert = useCallback((type, message, metric, value, threshold) => {
    const alert = {
      id: `${type}-${metric}-${Date.now()}`,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now()
    };

    // Queue alert as a metric
    queueMetric('alerts', type, 1);
    
    return alert;
  }, [queueMetric]);

  // Get current status
  const getSystemStatus = useCallback(() => {
    const healthScore = getHealthScore();
    const metrics = getAllMetrics();
    
    return {
      healthy: healthScore >= 70,
      healthScore,
      status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'degraded',
      metrics: {
        performance: metrics['performance.responseTime']?.current || 0,
        cacheHitRatio: metrics['cache.hitRatio']?.current || 0,
        errorRate: (metrics['errors.totalErrors']?.current || 0) / Math.max(1, metrics['api.totalRequests']?.current || 1) * 100,
        activeUsers: metrics['business.activeSessions']?.current || 0
      }
    };
  }, [getHealthScore, getAllMetrics]);

  return {
    // Core tracking functions
    trackPerformance,
    trackApiRequest,
    trackCacheHit,
    trackCacheMiss,
    trackBusinessEvent,
    trackError,
    trackUserInteraction,
    trackSystemResources,
    
    // Advanced utilities
    withPerformanceTracking,
    trackFetch,
    useComponentTracking,
    createAlert,
    getSystemStatus,
    
    // Direct metric access
    queueMetric,
    flushMetrics
  };
};

export default useObservability;
