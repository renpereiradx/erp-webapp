/**
 * Wave 6: Optimización & Performance Enterprise
 * Performance Monitor - Web Vitals & Analytics
 * 
 * Sistema completo de monitoreo de performance:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Métricas personalizadas de ERP
 * - Real User Monitoring (RUM)
 * - Performance budgets
 * - Alertas automáticas
 * 
 * @since Wave 6 - Optimización & Performance Enterprise
 * @author Sistema ERP
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { useEffect, useRef } from 'react';

// ====================================
// CORE WEB VITALS MONITORING
// ====================================

/**
 * Configuración de umbrales de performance
 */
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  
  // Métricas custom ERP
  CLIENT_LOAD: { good: 1000, poor: 3000 },
  PRODUCT_SEARCH: { good: 500, poor: 1500 },
  RESERVATION_SAVE: { good: 800, poor: 2000 }
};

/**
 * Inicializar monitoreo de Web Vitals
 */
export const initializeWebVitals = () => {
  console.log('📊 Initializing Web Vitals monitoring');
  
  // Largest Contentful Paint
  getLCP((metric) => {
    reportWebVital('LCP', metric);
  });
  
  // First Input Delay
  getFID((metric) => {
    reportWebVital('FID', metric);
  });
  
  // Cumulative Layout Shift
  getCLS((metric) => {
    reportWebVital('CLS', metric);
  });
  
  // First Contentful Paint
  getFCP((metric) => {
    reportWebVital('FCP', metric);
  });
  
  // Time to First Byte
  getTTFB((metric) => {
    reportWebVital('TTFB', metric);
  });
};

/**
 * Reportar métrica de Web Vital
 */
function reportWebVital(name, metric) {
  const { value, delta, rating } = metric;
  const threshold = PERFORMANCE_THRESHOLDS[name];
  
  // Log para debugging
  console.log(`📈 ${name}: ${value}ms (${rating})`);
  
  // Determinar estado
  let status = 'good';
  if (value > threshold.poor) status = 'poor';
  else if (value > threshold.good) status = 'needs-improvement';
  
  // Enviar a analytics
  sendToAnalytics('web_vital', {
    metric_name: name,
    metric_value: Math.round(value),
    metric_delta: Math.round(delta),
    metric_rating: rating,
    metric_status: status
  });
  
  // Alertas para métricas pobres
  if (status === 'poor') {
    console.warn(`⚠️ Poor ${name}: ${value}ms`);
    triggerPerformanceAlert(name, value, threshold.poor);
  }
}

// ====================================
// CUSTOM ERP METRICS
// ====================================

/**
 * Clase para métricas personalizadas del ERP
 */
export class ERPPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initializeObservers();
  }
  
  /**
   * Inicializar observers de performance
   */
  initializeObservers() {
    // Observer para navigation timing
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processNavigationEntry(entry);
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      
      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processResourceEntry(entry);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      
      // Measure timing
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processMeasureEntry(entry);
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
    }
  }
  
  /**
   * Procesar entrada de navegación
   */
  processNavigationEntry(entry) {
    const metrics = {
      dns_time: entry.domainLookupEnd - entry.domainLookupStart,
      connection_time: entry.connectEnd - entry.connectStart,
      request_time: entry.responseStart - entry.requestStart,
      response_time: entry.responseEnd - entry.responseStart,
      dom_parse_time: entry.domContentLoadedEventEnd - entry.responseEnd,
      dom_ready_time: entry.domContentLoadedEventEnd - entry.navigationStart,
      load_complete_time: entry.loadEventEnd - entry.navigationStart
    };
    
    Object.entries(metrics).forEach(([name, value]) => {
      this.reportCustomMetric(`navigation_${name}`, value);
    });
  }
  
  /**
   * Procesar entrada de recurso
   */
  processResourceEntry(entry) {
    const isAPICall = entry.name.includes('/api/');
    const isChunk = entry.name.includes('chunk');
    
    if (isAPICall) {
      this.reportCustomMetric('api_call_duration', entry.duration, {
        endpoint: entry.name.split('/api/')[1]
      });
    }
    
    if (isChunk) {
      this.reportCustomMetric('chunk_load_time', entry.duration, {
        chunk_name: entry.name.split('/').pop()
      });
    }
  }
  
  /**
   * Procesar entrada de medida
   */
  processMeasureEntry(entry) {
    this.reportCustomMetric(entry.name, entry.duration);
  }
  
  /**
   * Medir operación ERP
   */
  measureERPOperation(operationName, startCallback, endCallback) {
    const startMark = `${operationName}_start`;
    const endMark = `${operationName}_end`;
    const measureName = `${operationName}_duration`;
    
    return async (...args) => {
      performance.mark(startMark);
      
      try {
        const result = await startCallback(...args);
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        if (endCallback) endCallback(result);
        return result;
      } catch (error) {
        performance.mark(endMark);
        performance.measure(`${measureName}_error`, startMark, endMark);
        throw error;
      }
    };
  }
  
  /**
   * Reportar métrica personalizada
   */
  reportCustomMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      metadata
    };
    
    this.metrics.set(`${name}_${Date.now()}`, metric);
    
    // Determinar estado basado en umbrales
    const threshold = PERFORMANCE_THRESHOLDS[name.toUpperCase()];
    let status = 'unknown';
    
    if (threshold) {
      if (value <= threshold.good) status = 'good';
      else if (value <= threshold.poor) status = 'needs-improvement';
      else status = 'poor';
    }
    
    // Log para debugging
    console.log(`📊 ERP Metric: ${name} = ${value}ms (${status})`);
    
    // Enviar a analytics
    sendToAnalytics('erp_metric', {
      metric_name: name,
      metric_value: Math.round(value),
      metric_status: status,
      ...metadata
    });
    
    // Alertas para métricas pobres
    if (status === 'poor') {
      triggerPerformanceAlert(name, value, threshold.poor);
    }
  }
  
  /**
   * Obtener resumen de métricas
   */
  getMetricsSummary() {
    const summary = {
      total_metrics: this.metrics.size,
      metrics_by_category: {},
      performance_score: 0
    };
    
    this.metrics.forEach((metric) => {
      const category = metric.name.split('_')[0];
      if (!summary.metrics_by_category[category]) {
        summary.metrics_by_category[category] = {
          count: 0,
          avg_value: 0,
          total_value: 0
        };
      }
      
      summary.metrics_by_category[category].count++;
      summary.metrics_by_category[category].total_value += metric.value;
      summary.metrics_by_category[category].avg_value = 
        summary.metrics_by_category[category].total_value / 
        summary.metrics_by_category[category].count;
    });
    
    return summary;
  }
}

// ====================================
// REACT PERFORMANCE MONITOR HOOK
// ====================================

/**
 * Hook para monitorear performance de componentes React
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    
    if (lastRenderTime.current > 0) {
      const renderTime = now - lastRenderTime.current;
      
      // Reportar tiempo de re-render
      sendToAnalytics('component_render', {
        component_name: componentName,
        render_time: Math.round(renderTime),
        render_count: renderCount.current
      });
      
      // Alertar renders lentos
      if (renderTime > 16) { // 60fps = 16ms
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    }
    
    lastRenderTime.current = now;
  });
  
  return {
    renderCount: renderCount.current,
    measureRender: (callback) => {
      const start = performance.now();
      const result = callback();
      const end = performance.now();
      
      sendToAnalytics('component_operation', {
        component_name: componentName,
        operation_time: Math.round(end - start)
      });
      
      return result;
    }
  };
};

// ====================================
// PERFORMANCE BUDGETS
// ====================================

/**
 * Verificar presupuestos de performance
 */
export const checkPerformanceBudgets = () => {
  const budgets = {
    bundle_size: 250 * 1024, // 250KB
    initial_load: 3000,      // 3s
    route_change: 1000,      // 1s
    api_response: 2000       // 2s
  };
  
  // Verificar tamaño de bundle
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      let totalBundleSize = 0;
      
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('chunk') || entry.name.includes('bundle')) {
          totalBundleSize += entry.transferSize || 0;
        }
      });
      
      if (totalBundleSize > budgets.bundle_size) {
        console.warn(`💰 Bundle size exceeded budget: ${totalBundleSize} > ${budgets.bundle_size}`);
        
        triggerPerformanceAlert('bundle_size', totalBundleSize, budgets.bundle_size);
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// ====================================
// ANALYTICS & REPORTING
// ====================================

/**
 * Enviar datos a analytics
 */
function sendToAnalytics(eventType, data) {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventType, data);
  }
  
  // Analytics custom endpoint
  if (navigator.sendBeacon) {
    const payload = JSON.stringify({
      type: eventType,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    navigator.sendBeacon('/api/analytics/performance', payload);
  }
  
  // Fallback para entornos de desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`📈 Analytics: ${eventType}`, data);
  }
}

/**
 * Disparar alerta de performance
 */
function triggerPerformanceAlert(metricName, value, threshold) {
  const alert = {
    type: 'performance_alert',
    metric: metricName,
    value: Math.round(value),
    threshold: threshold,
    severity: value > threshold * 2 ? 'critical' : 'warning',
    timestamp: Date.now(),
    url: window.location.href
  };
  
  // Log de alerta
  console.warn(`🚨 Performance Alert: ${metricName} = ${value} > ${threshold}`);
  
  // Enviar alerta
  sendToAnalytics('performance_alert', alert);
  
  // Notificación push para alertas críticas
  if (alert.severity === 'critical' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('Performance Alert', {
        body: `${metricName} is critically slow: ${Math.round(value)}ms`,
        icon: '/icons/icon-192x192.png',
        tag: 'performance-alert'
      });
    });
  }
}

// ====================================
// PERFORMANCE MONITOR COMPONENT
// ====================================

/**
 * Componente React para monitoreo de performance
 */
export const PerformanceMonitor = ({ children }) => {
  useEffect(() => {
    // Inicializar monitoreo
    initializeWebVitals();
    checkPerformanceBudgets();
    
    const monitor = new ERPPerformanceMonitor();
    
    // Guardar instancia global
    window.erpPerformanceMonitor = monitor;
    
    console.log('✅ Performance Monitor initialized');
    
    return () => {
      console.log('🔄 Performance Monitor cleanup');
    };
  }, []);
  
  return <>{children}</>;
};

// ====================================
// EXPORTS
// ====================================

export const performanceMonitor = new ERPPerformanceMonitor();

export default PerformanceMonitor;
