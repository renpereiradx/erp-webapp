/**
 * Analytics Components Export
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Export centralizado de todos los componentes de analytics
 * para facilitar su importación y uso en otras partes del sistema.
 */

// Legacy exports (mantener compatibilidad)
export { default as SalesDashboard } from './SalesDashboard.jsx';
export { default as AnalyticsDashboard } from './AnalyticsDashboard.jsx';
export { default as BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard.jsx';
export { default as ReportBuilder } from './ReportBuilder.jsx';

// Phase 1: Core Analytics Infrastructure
export { default as salesAnalyticsService } from '../../services/salesAnalyticsService';

// Phase 2: Advanced Visualization Components
export { default as SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
export { default as MetricsCard } from './MetricsCard';
export { default as SalesTrendsChart } from './SalesTrendsChart';
export { default as ProductPerformanceChart } from './ProductPerformanceChart';
export { default as CustomerAnalyticsChart } from './CustomerAnalyticsChart';
export { default as BusinessIntelligencePanel } from './BusinessIntelligencePanel';

// Utility functions
export { formatCurrency, formatNumber, formatPercentage, formatDate } from '../../utils/formatting';

// Utility hooks and helpers
export const useAnalyticsData = () => {
  // Hook personalizado para gestionar datos de analytics
  // Se puede implementar aquí la lógica compartida
};

// Constants
export const ANALYTICS_CONSTANTS = {
  REFRESH_INTERVALS: {
    REAL_TIME: 30000,    // 30 segundos
    STANDARD: 300000,    // 5 minutos
    SLOW: 600000         // 10 minutos
  },
  
  CHART_COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#6366F1',
    PURPLE: '#8B5CF6'
  },
  
  DATE_RANGES: {
    LAST_7_DAYS: '7d',
    LAST_30_DAYS: '30d',
    LAST_90_DAYS: '90d',
    LAST_YEAR: '1y',
    CUSTOM: 'custom'
  }
};

// Types (for TypeScript support when migrating)
export const ANALYTICS_TYPES = {
  METRIC_TYPES: ['revenue', 'sales', 'customers', 'orders'],
  CHART_TYPES: ['line', 'area', 'bar', 'pie', 'radar'],
  VIEW_MODES: ['overview', 'detailed', 'comparison'],
  INSIGHT_PRIORITIES: ['high', 'medium', 'low'],
  ALERT_SEVERITIES: ['critical', 'warning', 'info']
};
