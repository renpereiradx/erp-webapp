/**
 * Sales Telemetry Service
 * Wave 7: Observability & Monitoring
 * 
 * Enhanced telemetry service specifically for sales operations
 * with business metrics, performance tracking, and error monitoring
 */

import telemetryService from './telemetryService';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';

class SalesTelemetryService {
  constructor() {
    this.namespace = 'sales';
    this.sessionId = this.generateSessionId();
    this.metrics = new Map();
    this.performanceObserver = null;
    this.errorBuffer = [];
    this.maxErrorBuffer = 100;
    
    this.initializePerformanceMonitoring();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `sales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        this.observeMetric('largest-contentful-paint', (entry) => {
          this.recordMetric('performance.lcp', {
            value: entry.startTime,
            rating: this.getLCPRating(entry.startTime),
            sessionId: this.sessionId
          });
        });

        // First Input Delay (FID)
        this.observeMetric('first-input', (entry) => {
          this.recordMetric('performance.fid', {
            value: entry.processingStart - entry.startTime,
            rating: this.getFIDRating(entry.processingStart - entry.startTime),
            sessionId: this.sessionId
          });
        });

        // Cumulative Layout Shift (CLS)
        this.observeMetric('layout-shift', (entry) => {
          if (!entry.hadRecentInput) {
            this.recordMetric('performance.cls', {
              value: entry.value,
              rating: this.getCLSRating(entry.value),
              sessionId: this.sessionId
            });
          }
        });
      } catch (error) {
        console.warn('Performance monitoring initialization failed:', error);
      }
    }
  }

  /**
   * Observe performance metrics
   */
  observeMetric(type, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Rating calculations for Core Web Vitals
   */
  getLCPRating(value) {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  }

  getFIDRating(value) {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
  }

  getCLSRating(value) {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  }

  /**
   * Record sales operation metrics
   */
  recordSalesOperation(operation, data = {}) {
    const timestamp = Date.now();
    const eventName = `${this.namespace}.${operation}`;
    
    const enrichedData = {
      ...data,
      timestamp,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Record payment processing metrics
   */
  recordPaymentMetrics(operation, data = {}) {
    const eventName = `${this.namespace}.payment.${operation}`;
    
    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Record user interaction metrics
   */
  recordUserInteraction(interaction, data = {}) {
    const eventName = `${this.namespace}.interaction.${interaction}`;
    
    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Record error with categorization
   */
  recordError(error, context = {}) {
    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      code: error.code || 'UNKNOWN',
      severity: this.categorizeErrorSeverity(error),
      context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // Add to error buffer
    this.errorBuffer.push(errorData);
    if (this.errorBuffer.length > this.maxErrorBuffer) {
      this.errorBuffer.shift();
    }

    this.recordMetric(`${this.namespace}.error`, errorData);
    telemetryService.record(`${this.namespace}.error`, errorData);

    // Record error rate metrics
    this.updateErrorRate();
  }

  /**
   * Categorize error severity
   */
  categorizeErrorSeverity(error) {
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return 'high';
    }
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return 'medium';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    return 'low';
  }

  /**
   * Update error rate metrics
   */
  updateErrorRate() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errorBuffer.filter(error => error.timestamp > oneHourAgo);
    const errorRate = recentErrors.length;
    
    this.recordMetric(`${this.namespace}.error.rate`, {
      count: errorRate,
      timeWindow: '1h',
      timestamp: now,
      sessionId: this.sessionId
    });
  }

  /**
   * Record business metrics
   */
  recordBusinessMetrics(type, data = {}) {
    const eventName = `${this.namespace}.business.${type}`;
    
    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Record conversion funnel step
   */
  recordConversionStep(step, data = {}) {
    const eventName = `${this.namespace}.conversion.${step}`;
    
    const enrichedData = {
      ...data,
      step,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Record API performance
   */
  recordApiPerformance(endpoint, method, duration, status, data = {}) {
    const eventName = `${this.namespace}.api.${method.toLowerCase()}`;
    
    const enrichedData = {
      endpoint,
      method,
      duration,
      status,
      rating: this.getApiPerformanceRating(duration),
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.recordMetric(eventName, enrichedData);
    telemetryService.record(eventName, enrichedData);
  }

  /**
   * Get API performance rating
   */
  getApiPerformanceRating(duration) {
    return duration <= 200 ? 'excellent' : 
           duration <= 500 ? 'good' : 
           duration <= 1000 ? 'fair' : 'poor';
  }

  /**
   * Record metric locally
   */
  recordMetric(name, data) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const entries = this.metrics.get(name);
    entries.push(data);
    
    // Keep only last 1000 entries per metric
    if (entries.length > 1000) {
      entries.shift();
    }
  }

  /**
   * Get aggregated metrics
   */
  getMetrics(name = null) {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const aggregated = {};
    for (const [key, values] of this.metrics.entries()) {
      aggregated[key] = values;
    }
    return aggregated;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const lcpEntries = this.metrics.get(`performance.lcp`) || [];
    const fidEntries = this.metrics.get(`performance.fid`) || [];
    const clsEntries = this.metrics.get(`performance.cls`) || [];

    return {
      lcp: this.calculateMetricSummary(lcpEntries, 'value'),
      fid: this.calculateMetricSummary(fidEntries, 'value'),
      cls: this.calculateMetricSummary(clsEntries, 'value'),
      sessionId: this.sessionId
    };
  }

  /**
   * Calculate metric summary
   */
  calculateMetricSummary(entries, field) {
    if (entries.length === 0) return null;

    const values = entries.map(entry => entry[field]).filter(v => v !== undefined);
    if (values.length === 0) return null;

    values.sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(timeWindow = '1h') {
    const now = Date.now();
    const timeWindowMs = timeWindow === '1h' ? 60 * 60 * 1000 : 
                        timeWindow === '24h' ? 24 * 60 * 60 * 1000 : 
                        60 * 60 * 1000;
    
    const cutoff = now - timeWindowMs;
    const recentErrors = this.errorBuffer.filter(error => error.timestamp > cutoff);
    
    const bySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});

    const byType = recentErrors.reduce((acc, error) => {
      const type = error.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: recentErrors.length,
      timeWindow,
      bySeverity,
      byType,
      sessionId: this.sessionId
    };
  }

  /**
   * Get business metrics summary
   */
  getBusinessMetricsSummary() {
    const salesMetrics = this.metrics.get(`${this.namespace}.operation`) || [];
    const paymentMetrics = this.metrics.get(`${this.namespace}.payment.success`) || [];
    const conversionMetrics = this.metrics.get(`${this.namespace}.conversion.complete`) || [];

    return {
      totalSales: salesMetrics.length,
      successfulPayments: paymentMetrics.length,
      completedConversions: conversionMetrics.length,
      conversionRate: salesMetrics.length > 0 ? 
        (conversionMetrics.length / salesMetrics.length) * 100 : 0,
      sessionId: this.sessionId
    };
  }

  /**
   * Export telemetry data
   */
  exportData(format = 'json') {
    const data = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      performance: this.getPerformanceSummary(),
      errors: this.getErrorSummary(),
      business: this.getBusinessMetricsSummary()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.errorBuffer = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Start operation timer
   */
  startTimer(operation) {
    return telemetryService.startTimer(`${this.namespace}.${operation}`);
  }

  /**
   * End operation timer
   */
  endTimer(timer, data = {}) {
    const duration = telemetryService.endTimer(timer, data);
    this.recordSalesOperation('timer', {
      operation: timer.name?.replace(`${this.namespace}.`, ''),
      duration,
      ...data
    });
    return duration;
  }
}

// Create singleton instance
const salesTelemetryService = new SalesTelemetryService();

export default salesTelemetryService;
