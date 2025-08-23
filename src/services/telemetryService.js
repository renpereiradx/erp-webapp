/**
 * Telemetry Service
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Handles application telemetry, logging, and performance monitoring
 */

import { v4 as uuidv4 } from 'uuid';

class TelemetryService {
  constructor() {
    this.sessionId = uuidv4();
    this.events = [];
    this.maxEvents = 1000;
    this.isEnabled = process.env.NODE_ENV !== 'test';
    this.flushInterval = 30000; // 30 seconds
    this.startTime = Date.now();
    
    if (this.isEnabled) {
      this.initializeSession();
      this.startPeriodicFlush();
    }
  }

  /**
   * Initialize telemetry session
   */
  initializeSession() {
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, data = {}, tags = []) {
    if (!this.isEnabled) return;

    const event = {
      id: uuidv4(),
      name: eventName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      },
      tags: Array.isArray(tags) ? tags : [tags]
    };

    this.events.push(event);
    
    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Telemetry] ${eventName}:`, data);
    }

    return event.id;
  }

  /**
   * Track analytics event
   */
  trackAnalyticsEvent(action, data = {}) {
    return this.trackEvent('analytics_action', {
      action,
      ...data
    }, ['analytics']);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(operation, duration, metadata = {}) {
    return this.trackEvent('performance_metric', {
      operation,
      duration,
      metadata
    }, ['performance']);
  }

  /**
   * Track error events
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      name: error.name || 'Error',
      context,
      timestamp: new Date().toISOString()
    };

    return this.trackEvent('error', errorData, ['error']);
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(component, action, data = {}) {
    return this.trackEvent('user_interaction', {
      component,
      action,
      ...data
    }, ['ui', 'interaction']);
  }

  /**
   * Track API calls
   */
  trackApiCall(endpoint, method, status, duration, data = {}) {
    return this.trackEvent('api_call', {
      endpoint,
      method,
      status,
      duration,
      ...data
    }, ['api']);
  }

  /**
   * Track page views
   */
  trackPageView(page, data = {}) {
    return this.trackEvent('page_view', {
      page,
      ...data
    }, ['navigation']);
  }

  /**
   * Get events by filter
   */
  getEvents(filter = {}) {
    let filteredEvents = [...this.events];

    if (filter.name) {
      filteredEvents = filteredEvents.filter(event => event.name === filter.name);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filter.tags.some(tag => event.tags.includes(tag))
      );
    }

    if (filter.startTime) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= new Date(filter.startTime)
      );
    }

    if (filter.endTime) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= new Date(filter.endTime)
      );
    }

    return filteredEvents;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    const analyticsEvents = this.getEvents({ tags: ['analytics'] });
    const errorEvents = this.getEvents({ tags: ['error'] });
    const performanceEvents = this.getEvents({ tags: ['performance'] });
    const apiEvents = this.getEvents({ tags: ['api'] });

    return {
      totalEvents: this.events.length,
      analyticsEvents: analyticsEvents.length,
      errorEvents: errorEvents.length,
      performanceEvents: performanceEvents.length,
      apiEvents: apiEvents.length,
      sessionDuration: Date.now() - this.startTime,
      sessionId: this.sessionId,
      averageApiResponseTime: this.calculateAverageApiResponseTime(apiEvents),
      errorRate: this.events.length > 0 ? (errorEvents.length / this.events.length) * 100 : 0
    };
  }

  /**
   * Calculate average API response time
   */
  calculateAverageApiResponseTime(apiEvents) {
    if (apiEvents.length === 0) return 0;
    
    const totalDuration = apiEvents.reduce((sum, event) => {
      return sum + (event.data.duration || 0);
    }, 0);
    
    return totalDuration / apiEvents.length;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const performanceEvents = this.getEvents({ tags: ['performance'] });
    
    const metrics = {
      totalOperations: performanceEvents.length,
      operationTypes: {},
      averageDuration: 0,
      slowestOperation: null,
      fastestOperation: null
    };

    if (performanceEvents.length === 0) return metrics;

    let totalDuration = 0;
    let slowest = performanceEvents[0];
    let fastest = performanceEvents[0];

    performanceEvents.forEach(event => {
      const operation = event.data.operation;
      const duration = event.data.duration || 0;

      // Count operation types
      metrics.operationTypes[operation] = (metrics.operationTypes[operation] || 0) + 1;

      // Calculate totals
      totalDuration += duration;

      // Track slowest and fastest
      if (duration > (slowest.data.duration || 0)) {
        slowest = event;
      }
      if (duration < (fastest.data.duration || 0)) {
        fastest = event;
      }
    });

    metrics.averageDuration = totalDuration / performanceEvents.length;
    metrics.slowestOperation = slowest;
    metrics.fastestOperation = fastest;

    return metrics;
  }

  /**
   * Export events for external analysis
   */
  exportEvents(format = 'json') {
    const data = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      summary: this.getAnalyticsSummary(),
      events: this.events
    };

    switch (format) {
      case 'csv':
        return this.convertToCSV(data.events);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert events to CSV format
   */
  convertToCSV(events) {
    if (events.length === 0) return '';

    const headers = ['id', 'name', 'timestamp', 'sessionId', 'tags', 'data'];
    const csv = [headers.join(',')];

    events.forEach(event => {
      const row = [
        event.id,
        event.name,
        event.timestamp,
        event.sessionId,
        event.tags.join(';'),
        JSON.stringify(event.data).replace(/"/g, '""')
      ];
      csv.push(row.join(','));
    });

    return csv.join('\n');
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
    this.trackEvent('events_cleared');
  }

  /**
   * Start periodic flush to prevent memory issues
   */
  startPeriodicFlush() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        if (this.events.length > this.maxEvents * 0.8) {
          // Keep only recent events
          this.events = this.events.slice(-Math.floor(this.maxEvents * 0.6));
          this.trackEvent('events_flushed');
        }
      }, this.flushInterval);
    }
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.trackEvent('telemetry_toggled', { enabled });
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      isEnabled: this.isEnabled
    };
  }
}

// Create singleton instance
const telemetryService = new TelemetryService();

export default telemetryService;

// Named exports for convenience
export const {
  trackEvent,
  trackAnalyticsEvent,
  trackPerformance,
  trackError,
  trackUserInteraction,
  trackApiCall,
  trackPageView,
  getEvents,
  getAnalyticsSummary,
  getPerformanceMetrics,
  exportEvents,
  clearEvents,
  setEnabled,
  getSessionInfo
} = telemetryService;
