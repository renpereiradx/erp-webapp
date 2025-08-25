// Wave 8: Enterprise Observability System
// Real-time monitoring and alerting for production

import React, { useState, useEffect } from 'react';

class ObservabilitySystem {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.traces = [];
    this.logs = [];
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    // Initialize collectors
    this.initializeMetricsCollection();
    this.initializeErrorTracking();
    this.initializePerformanceMonitoring();
    this.initializeUserActivityTracking();
  }

  // Metrics Collection
  initializeMetricsCollection() {
    // Custom metrics for ERP business logic
    this.businessMetrics = {
      clientOperations: 0,
      salesTransactions: 0,
      userSessions: 0,
      apiCalls: 0,
      errors: 0,
      responseTime: []
    };

    // System metrics
    this.systemMetrics = {
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      bundleSize: 0
    };

    // Start metrics collection
    this.startMetricsCollection();
  }

  startMetricsCollection() {
    if (!this.isEnabled) return;

    // Collect system metrics every 10 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000);

    // Send metrics to monitoring service every 30 seconds
    setInterval(() => {
      this.sendMetrics();
    }, 30000);
  }

  collectSystemMetrics() {
    // Memory usage
    if (performance.memory) {
      this.systemMetrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }

    // Performance metrics
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.systemMetrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.systemMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }
    }

    // Network quality
    if (navigator.connection) {
      this.systemMetrics.connectionType = navigator.connection.effectiveType;
      this.systemMetrics.downlink = navigator.connection.downlink;
      this.systemMetrics.rtt = navigator.connection.rtt;
    }
  }

  // Business Metrics Tracking
  trackClientOperation(operation, duration, success = true) {
    this.businessMetrics.clientOperations++;
    
    const metric = {
      timestamp: Date.now(),
      operation,
      duration,
      success,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId()
    };

    this.metrics.set(`client_operation_${Date.now()}`, metric);
    
    // Track response time
    this.businessMetrics.responseTime.push(duration);
    if (this.businessMetrics.responseTime.length > 100) {
      this.businessMetrics.responseTime.shift();
    }

    if (!success) {
      this.businessMetrics.errors++;
      this.trackError(new Error(`Client operation failed: ${operation}`));
    }
  }

  trackSalesTransaction(amount, productCount, success = true) {
    this.businessMetrics.salesTransactions++;
    
    const metric = {
      timestamp: Date.now(),
      amount,
      productCount,
      success,
      userId: this.getCurrentUserId()
    };

    this.metrics.set(`sales_transaction_${Date.now()}`, metric);

    if (!success) {
      this.businessMetrics.errors++;
    }
  }

  trackUserSession(event) {
    const metric = {
      timestamp: Date.now(),
      event, // 'start', 'end', 'activity'
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      page: window.location.pathname,
      referrer: document.referrer
    };

    this.metrics.set(`user_session_${Date.now()}`, metric);

    if (event === 'start') {
      this.businessMetrics.userSessions++;
    }
  }

  trackAPICall(endpoint, method, duration, status) {
    this.businessMetrics.apiCalls++;
    
    const metric = {
      timestamp: Date.now(),
      endpoint,
      method,
      duration,
      status,
      userId: this.getCurrentUserId()
    };

    this.metrics.set(`api_call_${Date.now()}`, metric);

    if (status >= 400) {
      this.businessMetrics.errors++;
    }
  }

  // Error Tracking
  initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'promise_rejection'
      });
    });

    // React error boundary support
    this.setupReactErrorTracking();
  }

  trackError(error, context = {}) {
    const errorData = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      severity: this.getErrorSeverity(error)
    };

    this.logs.push({
      level: 'error',
      ...errorData
    });

    // Send critical errors immediately
    if (errorData.severity === 'critical') {
      this.sendErrorAlert(errorData);
    }

    console.error('Observability: Error tracked', errorData);
  }

  getErrorSeverity(error) {
    // Classify error severity
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium';
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'medium';
    }
    if (error.stack && error.stack.includes('business-critical')) {
      return 'critical';
    }
    return 'low';
  }

  // Performance Monitoring
  initializePerformanceMonitoring() {
    // Core Web Vitals
    this.observeWebVitals();
    
    // Resource timing
    this.observeResourceTiming();
    
    // Long tasks
    this.observeLongTasks();
  }

  observeWebVitals() {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.set('lcp', {
          value: lastEntry.startTime,
          timestamp: Date.now()
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.set('fid', {
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now()
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.set('cls', {
          value: clsValue,
          timestamp: Date.now()
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.set(`resource_${Date.now()}`, {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType,
              timestamp: Date.now()
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackError(new Error('Long task detected'), {
            duration: entry.duration,
            startTime: entry.startTime,
            type: 'performance'
          });
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  // User Activity Tracking
  initializeUserActivityTracking() {
    // Page views
    this.trackPageView();
    
    // User interactions
    this.setupInteractionTracking();
    
    // Session management
    this.setupSessionTracking();
  }

  trackPageView() {
    const pageView = {
      timestamp: Date.now(),
      page: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    this.metrics.set(`page_view_${Date.now()}`, pageView);
  }

  setupInteractionTracking() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.dataset.track) {
        this.trackUserInteraction('click', {
          element: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.substring(0, 100)
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      this.trackUserInteraction('form_submit', {
        formId: form.id,
        formName: form.name,
        action: form.action
      });
    });
  }

  trackUserInteraction(type, data) {
    const interaction = {
      timestamp: Date.now(),
      type,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      page: window.location.pathname
    };

    this.metrics.set(`interaction_${Date.now()}`, interaction);
  }

  setupSessionTracking() {
    // Session start
    this.trackUserSession('start');

    // Session end (beforeunload)
    window.addEventListener('beforeunload', () => {
      this.trackUserSession('end');
      this.sendMetrics(); // Send final metrics
    });

    // Activity tracking
    let lastActivity = Date.now();
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        const now = Date.now();
        if (now - lastActivity > 30000) { // 30 seconds of inactivity
          this.trackUserSession('activity');
        }
        lastActivity = now;
      });
    });
  }

  // Data Export and Integration
  sendMetrics() {
    if (!this.isEnabled || this.metrics.size === 0) return;

    const metricsData = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
      businessMetrics: this.businessMetrics,
      systemMetrics: this.systemMetrics,
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };

    // Send to monitoring service
    this.sendToMonitoringService(metricsData);
    
    // Clear sent metrics
    this.metrics.clear();
  }

  sendToMonitoringService(data) {
    // In production, send to your monitoring service (DataDog, New Relic, etc.)
    if (process.env.VITE_MONITORING_ENDPOINT) {
      fetch(process.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_MONITORING_API_KEY}`
        },
        body: JSON.stringify(data)
      }).catch(err => {
        console.warn('Failed to send metrics:', err);
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Observability Metrics:', data);
    }
  }

  sendErrorAlert(errorData) {
    // Send immediate alert for critical errors
    if (process.env.VITE_ALERT_ENDPOINT) {
      fetch(process.env.VITE_ALERT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_ALERT_API_KEY}`
        },
        body: JSON.stringify({
          type: 'error_alert',
          severity: 'critical',
          error: errorData,
          timestamp: Date.now()
        })
      }).catch(err => {
        console.warn('Failed to send error alert:', err);
      });
    }
  }

  // Helper methods
  getCurrentUserId() {
    // Get user ID from your auth system
    return localStorage.getItem('userId') || 'anonymous';
  }

  getSessionId() {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Public API for components
  track(event, data = {}) {
    this.trackUserInteraction(event, data);
  }

  startTransaction(name) {
    const startTime = performance.now();
    return {
      finish: (success = true) => {
        const duration = performance.now() - startTime;
        this.trackClientOperation(name, duration, success);
      }
    };
  }

  setUserContext(userId, userInfo = {}) {
    localStorage.setItem('userId', userId);
    this.metrics.set('user_context', {
      userId,
      userInfo,
      timestamp: Date.now()
    });
  }

  // React error boundary integration
  setupReactErrorTracking() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if it's a React error
      const errorMessage = args[0];
      if (typeof errorMessage === 'string' && errorMessage.includes('React')) {
        this.trackError(new Error(errorMessage), {
          type: 'react_error',
          arguments: args
        });
      }
      originalConsoleError.apply(console, args);
    };
  }
}

// Create singleton instance
export const observability = new ObservabilitySystem();

// React hook for observability
export const useObservability = () => {
  return {
    track: (event, data) => observability.track(event, data),
    startTransaction: (name) => observability.startTransaction(name),
    trackError: (error, context) => observability.trackError(error, context),
    setUserContext: (userId, userInfo) => observability.setUserContext(userId, userInfo)
  };
};

// HOC for automatic component tracking
export const withObservability = (WrappedComponent, componentName) => {
  return function ObservabilityWrappedComponent(props) {
    useEffect(() => {
      const transaction = observability.startTransaction(`component_render_${componentName}`);
      
      return () => {
        transaction.finish();
      };
    }, []);

    const handleError = (error, errorInfo) => {
      observability.trackError(error, {
        ...errorInfo,
        component: componentName,
        type: 'component_error'
      });
    };

    return React.createElement(WrappedComponent, { ...props, onError: handleError });
  };
};

export default observability;
