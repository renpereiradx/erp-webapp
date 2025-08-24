import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Metrics aggregation service
class MetricsAggregator {
  constructor() {
    this.metrics = new Map();
    this.subscriptions = new Set();
    this.aggregationInterval = 1000; // 1 second
    this.maxHistoryPoints = 100;
    this.startAggregation();
  }

  startAggregation() {
    setInterval(() => {
      this.processMetrics();
      this.notifySubscribers();
    }, this.aggregationInterval);
  }

  addMetric(category, name, value, timestamp = Date.now()) {
    const key = `${category}.${name}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        current: value,
        history: [],
        stats: {
          min: value,
          max: value,
          avg: value,
          count: 1,
          sum: value
        }
      });
    }

    const metric = this.metrics.get(key);
    
    // Update current value
    metric.current = value;
    
    // Add to history
    metric.history.push({ value, timestamp });
    if (metric.history.length > this.maxHistoryPoints) {
      metric.history.shift();
    }

    // Update statistics
    metric.stats.count++;
    metric.stats.sum += value;
    metric.stats.min = Math.min(metric.stats.min, value);
    metric.stats.max = Math.max(metric.stats.max, value);
    metric.stats.avg = metric.stats.sum / metric.stats.count;
  }

  getMetric(category, name) {
    const key = `${category}.${name}`;
    return this.metrics.get(key) || null;
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getMetricsByCategory(category) {
    const result = {};
    for (const [key, value] of this.metrics) {
      if (key.startsWith(`${category}.`)) {
        const metricName = key.substring(category.length + 1);
        result[metricName] = value;
      }
    }
    return result;
  }

  subscribe(callback) {
    this.subscriptions.add(callback);
    return () => this.subscriptions.delete(callback);
  }

  notifySubscribers() {
    const allMetrics = this.getAllMetrics();
    this.subscriptions.forEach(callback => {
      try {
        callback(allMetrics);
      } catch (error) {
        console.error('Metrics subscription error:', error);
      }
    });
  }

  processMetrics() {
    // Calculate derived metrics
    this.calculatePerformanceMetrics();
    this.calculateCacheMetrics();
    this.calculateCircuitBreakerMetrics();
    this.calculateBusinessMetrics();
  }

  calculatePerformanceMetrics() {
    const responseTimeMetric = this.getMetric('performance', 'responseTime');
    if (responseTimeMetric && responseTimeMetric.history.length > 0) {
      const recent = responseTimeMetric.history.slice(-10);
      const avgRecentResponseTime = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
      
      this.addMetric('performance', 'avgResponseTime', avgRecentResponseTime);
      
      // Calculate performance score (0-100)
      const performanceScore = Math.max(0, Math.min(100, 100 - (avgRecentResponseTime / 10)));
      this.addMetric('performance', 'score', performanceScore);
    }
  }

  calculateCacheMetrics() {
    const hits = this.getMetric('cache', 'hits')?.current || 0;
    const misses = this.getMetric('cache', 'misses')?.current || 0;
    const total = hits + misses;
    
    if (total > 0) {
      const hitRatio = (hits / total) * 100;
      this.addMetric('cache', 'hitRatio', hitRatio);
      
      // Cache efficiency score
      const efficiency = Math.min(100, hitRatio * 1.2); // Bonus for high hit ratio
      this.addMetric('cache', 'efficiency', efficiency);
    }
  }

  calculateCircuitBreakerMetrics() {
    const failures = this.getMetric('circuit', 'failures')?.current || 0;
    const successes = this.getMetric('circuit', 'successes')?.current || 0;
    const total = failures + successes;
    
    if (total > 0) {
      const successRate = (successes / total) * 100;
      this.addMetric('circuit', 'successRate', successRate);
      
      // Reliability score
      const reliability = Math.max(0, successRate - (failures * 5)); // Penalty for failures
      this.addMetric('circuit', 'reliability', reliability);
    }
  }

  calculateBusinessMetrics() {
    const completedPurchases = this.getMetric('business', 'completedPurchases')?.current || 0;
    const startedPurchases = this.getMetric('business', 'startedPurchases')?.current || 0;
    
    if (startedPurchases > 0) {
      const conversionRate = (completedPurchases / startedPurchases) * 100;
      this.addMetric('business', 'conversionRate', conversionRate);
    }
  }

  reset() {
    this.metrics.clear();
  }

  getHealthScore() {
    const performance = this.getMetric('performance', 'score')?.current || 0;
    const cache = this.getMetric('cache', 'efficiency')?.current || 0;
    const circuit = this.getMetric('circuit', 'reliability')?.current || 0;
    
    return Math.round((performance + cache + circuit) / 3);
  }
}

// Global metrics aggregator instance
const metricsAggregator = new MetricsAggregator();

// Zustand store for metrics
export const useMetricsStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        metrics: {},
        realTimeEnabled: true,
        lastUpdate: null,
        alertThresholds: {
          responseTime: 500,
          cacheHitRatio: 70,
          errorRate: 5,
          conversionRate: 70
        },
        alerts: [],
        
        // Actions
        updateMetrics: (newMetrics) => {
          set({ 
            metrics: newMetrics, 
            lastUpdate: Date.now() 
          });
          
          // Check for alerts
          get().checkAlerts(newMetrics);
        },

        addMetric: (category, name, value) => {
          metricsAggregator.addMetric(category, name, value);
        },

        getMetric: (category, name) => {
          return metricsAggregator.getMetric(category, name);
        },

        getMetricsByCategory: (category) => {
          return metricsAggregator.getMetricsByCategory(category);
        },

        getAllMetrics: () => {
          return metricsAggregator.getAllMetrics();
        },

        getHealthScore: () => {
          return metricsAggregator.getHealthScore();
        },

        setRealTimeEnabled: (enabled) => {
          set({ realTimeEnabled: enabled });
        },

        setAlertThreshold: (metric, value) => {
          const { alertThresholds } = get();
          set({
            alertThresholds: {
              ...alertThresholds,
              [metric]: value
            }
          });
        },

        checkAlerts: (metrics) => {
          const { alertThresholds, alerts } = get();
          const newAlerts = [];

          // Check response time
          const responseTime = metrics['performance.responseTime']?.current;
          if (responseTime && responseTime > alertThresholds.responseTime) {
            newAlerts.push({
              id: `responseTime-${Date.now()}`,
              type: 'warning',
              metric: 'responseTime',
              message: `Response time ${responseTime}ms exceeds threshold ${alertThresholds.responseTime}ms`,
              timestamp: Date.now(),
              value: responseTime,
              threshold: alertThresholds.responseTime
            });
          }

          // Check cache hit ratio
          const cacheHitRatio = metrics['cache.hitRatio']?.current;
          if (cacheHitRatio && cacheHitRatio < alertThresholds.cacheHitRatio) {
            newAlerts.push({
              id: `cacheHitRatio-${Date.now()}`,
              type: 'warning',
              metric: 'cacheHitRatio',
              message: `Cache hit ratio ${cacheHitRatio.toFixed(1)}% below threshold ${alertThresholds.cacheHitRatio}%`,
              timestamp: Date.now(),
              value: cacheHitRatio,
              threshold: alertThresholds.cacheHitRatio
            });
          }

          // Check conversion rate
          const conversionRate = metrics['business.conversionRate']?.current;
          if (conversionRate && conversionRate < alertThresholds.conversionRate) {
            newAlerts.push({
              id: `conversionRate-${Date.now()}`,
              type: 'critical',
              metric: 'conversionRate',
              message: `Conversion rate ${conversionRate.toFixed(1)}% below threshold ${alertThresholds.conversionRate}%`,
              timestamp: Date.now(),
              value: conversionRate,
              threshold: alertThresholds.conversionRate
            });
          }

          if (newAlerts.length > 0) {
            set({ alerts: [...alerts, ...newAlerts] });
          }
        },

        dismissAlert: (alertId) => {
          const { alerts } = get();
          set({
            alerts: alerts.filter(alert => alert.id !== alertId)
          });
        },

        clearAllAlerts: () => {
          set({ alerts: [] });
        },

        resetMetrics: () => {
          metricsAggregator.reset();
          set({ 
            metrics: {},
            alerts: [],
            lastUpdate: null
          });
        },

        // Advanced metrics operations
        exportMetrics: () => {
          const { metrics } = get();
          const exportData = {
            timestamp: Date.now(),
            metrics,
            healthScore: get().getHealthScore(),
            alerts: get().alerts
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          });
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `metrics-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },

        getMetricTrend: (category, name, timeWindow = 300000) => { // 5 minutes
          const metric = metricsAggregator.getMetric(category, name);
          if (!metric || !metric.history.length) return null;

          const cutoff = Date.now() - timeWindow;
          const recentData = metric.history.filter(point => point.timestamp > cutoff);
          
          if (recentData.length < 2) return null;

          const first = recentData[0].value;
          const last = recentData[recentData.length - 1].value;
          const change = last - first;
          const percentChange = first !== 0 ? (change / first) * 100 : 0;

          return {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            change,
            percentChange,
            current: last,
            previous: first
          };
        }
      }),
      {
        name: 'metrics-store',
        partialize: (state) => ({
          alertThresholds: state.alertThresholds,
          realTimeEnabled: state.realTimeEnabled
        })
      }
    )
  )
);

// Subscribe to metrics aggregator updates
metricsAggregator.subscribe((metrics) => {
  useMetricsStore.getState().updateMetrics(metrics);
});

export { metricsAggregator };
