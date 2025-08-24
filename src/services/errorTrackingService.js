/**
 * Error Tracking Service
 * Wave 7: Observability & Monitoring
 * 
 * Centralized error collection, categorization, and alerting system
 */

import salesTelemetryService from './salesTelemetryService';
import telemetryService from './telemetryService';

class ErrorTrackingService {
  constructor() {
    this.errors = new Map();
    this.alerts = [];
    this.thresholds = {
      errorRate: {
        warning: 10, // errors per hour
        critical: 25
      },
      apiErrorRate: {
        warning: 5, // errors per hour for API calls
        critical: 15
      },
      criticalErrors: {
        warning: 1, // critical errors per hour
        critical: 3
      }
    };
    this.alertCallbacks = new Set();
    
    this.initializeGlobalErrorHandling();
  }

  /**
   * Initialize global error handling
   */
  initializeGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript',
        severity: 'high'
      }, {
        source: 'global',
        url: window.location.href
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        type: 'promise',
        severity: 'high'
      }, {
        source: 'promise',
        url: window.location.href,
        reason: event.reason
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError({
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          type: 'resource',
          severity: 'medium'
        }, {
          source: 'resource',
          element: event.target.tagName,
          url: event.target.src || event.target.href
        });
      }
    }, true);
  }

  /**
   * Record error with enhanced tracking
   */
  recordError(error, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const errorRecord = {
      id: errorId,
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      code: error.code || 'UNKNOWN',
      type: error.type || 'general',
      severity: error.severity || this.determineSeverity(error),
      category: this.categorizeError(error),
      context: {
        ...context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date(timestamp).toISOString()
      },
      timestamp,
      fingerprint: this.generateFingerprint(error),
      count: 1,
      firstSeen: timestamp,
      lastSeen: timestamp
    };

    // Check if this error has been seen before
    const existingError = this.findSimilarError(errorRecord);
    if (existingError) {
      existingError.count++;
      existingError.lastSeen = timestamp;
      this.errors.set(existingError.id, existingError);
    } else {
      this.errors.set(errorId, errorRecord);
    }

    // Record in telemetry
    salesTelemetryService.recordError(error, context);
    
    // Check for alerts
    this.checkAlertThresholds();
    
    return errorId;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint(error) {
    const key = [
      error.name || 'Unknown',
      error.message || 'Unknown',
      (error.stack || '').split('\n')[0] || 'Unknown'
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Find similar error by fingerprint
   */
  findSimilarError(errorRecord) {
    for (const error of this.errors.values()) {
      if (error.fingerprint === errorRecord.fingerprint) {
        return error;
      }
    }
    return null;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    // Critical errors that break core functionality
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }
    
    // High severity errors that impact user experience
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return 'high';
    }
    
    // Medium severity for validation and business logic errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return 'medium';
    }
    
    // Low severity for minor issues
    return 'low';
  }

  /**
   * Categorize error by type
   */
  categorizeError(error) {
    if (error.type === 'resource') return 'resource';
    if (error.type === 'promise') return 'async';
    if (error.type === 'javascript') return 'runtime';
    
    if (error.name?.includes('Network') || error.code?.includes('NETWORK')) {
      return 'network';
    }
    
    if (error.name?.includes('Validation') || error.code?.includes('VALIDATION')) {
      return 'validation';
    }
    
    if (error.message?.includes('API') || error.context?.source === 'api') {
      return 'api';
    }
    
    return 'application';
  }

  /**
   * Record API error specifically
   */
  recordApiError(endpoint, method, status, error, context = {}) {
    const apiError = {
      ...error,
      type: 'api',
      severity: status >= 500 ? 'high' : status >= 400 ? 'medium' : 'low'
    };

    const apiContext = {
      ...context,
      endpoint,
      method,
      status,
      source: 'api'
    };

    return this.recordError(apiError, apiContext);
  }

  /**
   * Record sales operation error
   */
  recordSalesError(operation, error, context = {}) {
    const salesError = {
      ...error,
      type: 'sales',
      severity: this.getSalesErrorSeverity(operation, error)
    };

    const salesContext = {
      ...context,
      operation,
      source: 'sales'
    };

    return this.recordError(salesError, salesContext);
  }

  /**
   * Determine sales error severity
   */
  getSalesErrorSeverity(operation, error) {
    // Payment errors are critical
    if (operation.includes('payment')) {
      return 'critical';
    }
    
    // Sale creation/completion errors are high priority
    if (operation.includes('create') || operation.includes('complete')) {
      return 'high';
    }
    
    // Other operations are medium priority
    return 'medium';
  }

  /**
   * Check alert thresholds
   */
  checkAlertThresholds() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const hourAgo = now - oneHour;

    // Get errors from last hour
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.lastSeen > hourAgo);

    // Check overall error rate
    const errorRate = recentErrors.length;
    if (errorRate >= this.thresholds.errorRate.critical) {
      this.createAlert('critical', 'error_rate', `Critical error rate: ${errorRate} errors in last hour`);
    } else if (errorRate >= this.thresholds.errorRate.warning) {
      this.createAlert('warning', 'error_rate', `High error rate: ${errorRate} errors in last hour`);
    }

    // Check API error rate
    const apiErrors = recentErrors.filter(error => error.category === 'api');
    if (apiErrors.length >= this.thresholds.apiErrorRate.critical) {
      this.createAlert('critical', 'api_error_rate', `Critical API error rate: ${apiErrors.length} API errors in last hour`);
    } else if (apiErrors.length >= this.thresholds.apiErrorRate.warning) {
      this.createAlert('warning', 'api_error_rate', `High API error rate: ${apiErrors.length} API errors in last hour`);
    }

    // Check critical errors
    const criticalErrors = recentErrors.filter(error => error.severity === 'critical');
    if (criticalErrors.length >= this.thresholds.criticalErrors.critical) {
      this.createAlert('critical', 'critical_errors', `Multiple critical errors: ${criticalErrors.length} critical errors in last hour`);
    } else if (criticalErrors.length >= this.thresholds.criticalErrors.warning) {
      this.createAlert('warning', 'critical_errors', `Critical error detected: ${criticalErrors.length} critical errors in last hour`);
    }
  }

  /**
   * Create alert
   */
  createAlert(level, type, message) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert = {
      id: alertId,
      level,
      type,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Notify alert callbacks
    this.notifyAlertCallbacks(alert);
    
    // Record alert in telemetry
    telemetryService.record('error_tracking.alert', alert);
    
    return alertId;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      telemetryService.record('error_tracking.alert.acknowledged', { alertId });
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      telemetryService.record('error_tracking.alert.resolved', { alertId });
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback) {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Notify alert callbacks
   */
  notifyAlertCallbacks(alert) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow = '1h') {
    const now = Date.now();
    const timeWindowMs = timeWindow === '1h' ? 60 * 60 * 1000 : 
                        timeWindow === '24h' ? 24 * 60 * 60 * 1000 : 
                        timeWindow === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                        60 * 60 * 1000;
    
    const cutoff = now - timeWindowMs;
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.lastSeen > cutoff);

    const stats = {
      total: recentErrors.length,
      bySeverity: {},
      byCategory: {},
      byType: {},
      topErrors: []
    };

    // Group by severity
    recentErrors.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + error.count;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + error.count;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + error.count;
    });

    // Get top errors by count
    stats.topErrors = recentErrors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(error => ({
        id: error.id,
        message: error.message,
        count: error.count,
        severity: error.severity,
        category: error.category,
        fingerprint: error.fingerprint
      }));

    return stats;
  }

  /**
   * Get error details
   */
  getError(errorId) {
    return this.errors.get(errorId);
  }

  /**
   * Get all errors
   */
  getAllErrors(limit = 100) {
    return Array.from(this.errors.values())
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, limit);
  }

  /**
   * Get alerts
   */
  getAlerts(unacknowledgedOnly = false) {
    let alerts = [...this.alerts];
    
    if (unacknowledgedOnly) {
      alerts = alerts.filter(alert => !alert.acknowledged);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors.clear();
    telemetryService.record('error_tracking.cleared', { timestamp: Date.now() });
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    telemetryService.record('error_tracking.thresholds.updated', newThresholds);
  }

  /**
   * Export error data
   */
  exportErrors(format = 'json') {
    const data = {
      errors: Array.from(this.errors.values()),
      alerts: this.alerts,
      stats: this.getErrorStats(),
      thresholds: this.thresholds,
      timestamp: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }
}

// Create singleton instance
const errorTrackingService = new ErrorTrackingService();

export default errorTrackingService;
