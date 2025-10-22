/**
 * Simple telemetry service for MVP
 * Records basic metrics and events for development and monitoring
 */

// Mock telemetry service for MVP (can be enhanced later)
class TelemetryService {
  constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
    this.metrics = new Map();
    this.events = [];
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags/metadata
   */
  recordMetric(name, value, tags = {}) {
    if (!this.enabled) return;

    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    // Store metrics (in production, this would send to monitoring service)
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metric);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Record an event
   * @param {string} name - Event name
   * @param {Object} properties - Event properties
   */
  recordEvent(name, properties = {}) {
    if (!this.enabled) return;

    const event = {
      name,
      properties,
      timestamp: Date.now()
    };

    this.events.push(event);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
    }

    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  /**
   * Get recorded metrics
   * @param {string} name - Optional metric name to filter
   * @returns {Array|Map} - Metrics data
   */
  getMetrics(name = null) {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return this.metrics;
  }

  /**
   * Get recorded events
   * @returns {Array} - Events data
   */
  getEvents() {
    return this.events;
  }

  /**
   * Clear all telemetry data
   */
  clear() {
    this.metrics.clear();
    this.events.length = 0;
  }

  /**
   * Enable/disable telemetry
   * @param {boolean} enabled - Whether telemetry is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Create singleton instance
const telemetryService = new TelemetryService();

export { telemetryService };
export default telemetryService;
