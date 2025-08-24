/**
 * Observability Components Index
 * Wave 7: Observability & Monitoring
 * 
 * Central exports for all observability and monitoring components
 */

export { default as ObservabilityDashboard } from './ObservabilityDashboard.jsx';
export { default as BusinessMetricsPanel } from './BusinessMetricsPanel.jsx';

// Export component constants and configurations
export const OBSERVABILITY_CONFIG = {
  defaultRefreshInterval: 30000,
  maxHistoricalDataPoints: 100,
  maxAlerts: 100,
  defaultTimeRange: '1h',
  performanceThresholds: {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 }
  },
  errorThresholds: {
    rate: { warning: 10, critical: 25 },
    criticalCount: { warning: 1, critical: 3 }
  }
};

export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export const METRIC_TYPES = {
  PERFORMANCE: 'performance',
  ERRORS: 'errors',
  BUSINESS: 'business',
  SYSTEM: 'system'
};

export const TIME_RANGES = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000
};
