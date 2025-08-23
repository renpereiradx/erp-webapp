/**
 * Analytics Service - Wave 6: Advanced Analytics & Reporting
 * Enterprise-grade analytics and business intelligence service
 * 
 * Features:
 * - Real-time sales analytics
 * - Business intelligence insights
 * - Predictive analytics
 * - Custom report generation
 * - Performance metrics
 * 
 * Architecture: Domain-specific service with telemetry integration
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import { apiClient } from '@/lib/apiClient';
import { telemetry } from '@/utils/telemetry';
import { createCircuitHelpers } from '@/store/helpers/circuit';

// Circuit breaker for analytics service
const circuit = createCircuitHelpers('analytics', telemetry);

/**
 * Analytics data aggregation service
 */
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive sales analytics
   */
  async getSalesAnalytics(params = {}) {
    const cacheKey = `sales_analytics_${JSON.stringify(params)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        telemetry.record('analytics.sales.cache_hit');
        return cached.data;
      }
    }

    try {
      telemetry.record('analytics.sales.fetch_start', params);

      const response = await apiClient.get('/analytics/sales', { params });
      
      const analytics = {
        // Real-time metrics
        realTime: {
          activeSessions: response.data.realTime?.activeSessions || 0,
          salesInProgress: response.data.realTime?.salesInProgress || 0,
          revenueToday: response.data.realTime?.revenueToday || 0,
          conversionRate: response.data.realTime?.conversionRate || 0
        },

        // Performance metrics
        performance: {
          totalSales: response.data.performance?.totalSales || 0,
          totalRevenue: response.data.performance?.totalRevenue || 0,
          averageOrderValue: response.data.performance?.averageOrderValue || 0,
          salesGrowth: response.data.performance?.salesGrowth || 0,
          customerRetention: response.data.performance?.customerRetention || 0
        },

        // Trend analysis
        trends: {
          daily: response.data.trends?.daily || [],
          weekly: response.data.trends?.weekly || [],
          monthly: response.data.trends?.monthly || [],
          yearly: response.data.trends?.yearly || []
        },

        // Customer insights
        customers: {
          newCustomers: response.data.customers?.newCustomers || 0,
          returningCustomers: response.data.customers?.returningCustomers || 0,
          topCustomers: response.data.customers?.topCustomers || [],
          customerLifetimeValue: response.data.customers?.customerLifetimeValue || 0
        },

        // Product analytics
        products: {
          topProducts: response.data.products?.topProducts || [],
          categoryPerformance: response.data.products?.categoryPerformance || [],
          inventoryTurnover: response.data.products?.inventoryTurnover || 0,
          stockAlerts: response.data.products?.stockAlerts || []
        },

        // Payment analytics
        payments: {
          paymentMethods: response.data.payments?.paymentMethods || [],
          transactionVolume: response.data.payments?.transactionVolume || 0,
          processingTime: response.data.payments?.processingTime || 0,
          failureRate: response.data.payments?.failureRate || 0
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      telemetry.record('analytics.sales.fetch_success', {
        totalSales: analytics.performance.totalSales,
        cacheKey
      });

      return analytics;
    } catch (error) {
      telemetry.record('analytics.sales.fetch_error', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Get business intelligence insights
   */
  async getBusinessIntelligence(params = {}) {
    try {
      telemetry.record('analytics.business_intelligence.fetch_start', params);

      const response = await apiClient.get('/analytics/business-intelligence', { params });
      
      const insights = {
        // Predictive analytics
        predictions: {
          salesForecast: response.data.predictions?.salesForecast || [],
          demandForecast: response.data.predictions?.demandForecast || [],
          churnPrediction: response.data.predictions?.churnPrediction || [],
          seasonalTrends: response.data.predictions?.seasonalTrends || []
        },

        // Market insights
        market: {
          marketShare: response.data.market?.marketShare || 0,
          competitorAnalysis: response.data.market?.competitorAnalysis || [],
          industryTrends: response.data.market?.industryTrends || [],
          opportunityAreas: response.data.market?.opportunityAreas || []
        },

        // Operational insights
        operations: {
          efficiencyScore: response.data.operations?.efficiencyScore || 0,
          bottlenecks: response.data.operations?.bottlenecks || [],
          optimization: response.data.operations?.optimization || [],
          automation: response.data.operations?.automation || []
        },

        // Financial insights
        financial: {
          profitMargins: response.data.financial?.profitMargins || [],
          costAnalysis: response.data.financial?.costAnalysis || [],
          riskAssessment: response.data.financial?.riskAssessment || [],
          investmentOpportunities: response.data.financial?.investmentOpportunities || []
        }
      };

      telemetry.record('analytics.business_intelligence.fetch_success', {
        predictionsCount: insights.predictions.salesForecast.length,
        insightsCount: Object.keys(insights).length
      });

      return insights;
    } catch (error) {
      telemetry.record('analytics.business_intelligence.fetch_error', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateReport(reportConfig) {
    try {
      telemetry.record('analytics.report.generate_start', {
        type: reportConfig.type,
        format: reportConfig.format
      });

      const response = await apiClient.post('/analytics/reports/generate', reportConfig);
      
      const report = {
        id: response.data.id,
        type: reportConfig.type,
        format: reportConfig.format,
        status: response.data.status,
        downloadUrl: response.data.downloadUrl,
        generatedAt: response.data.generatedAt,
        expiresAt: response.data.expiresAt,
        metadata: response.data.metadata
      };

      telemetry.record('analytics.report.generate_success', {
        reportId: report.id,
        type: report.type
      });

      return report;
    } catch (error) {
      telemetry.record('analytics.report.generate_error', {
        error: error.message,
        reportConfig
      });
      throw error;
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getRealTimeDashboard() {
    try {
      const response = await apiClient.get('/analytics/realtime');
      
      const dashboard = {
        timestamp: Date.now(),
        sales: {
          current: response.data.sales?.current || 0,
          target: response.data.sales?.target || 0,
          growth: response.data.sales?.growth || 0
        },
        revenue: {
          current: response.data.revenue?.current || 0,
          target: response.data.revenue?.target || 0,
          growth: response.data.revenue?.growth || 0
        },
        customers: {
          active: response.data.customers?.active || 0,
          new: response.data.customers?.new || 0,
          returning: response.data.customers?.returning || 0
        },
        performance: {
          conversionRate: response.data.performance?.conversionRate || 0,
          averageOrderValue: response.data.performance?.averageOrderValue || 0,
          customerSatisfaction: response.data.performance?.customerSatisfaction || 0
        }
      };

      telemetry.record('analytics.realtime.fetch_success', dashboard);
      
      return dashboard;
    } catch (error) {
      telemetry.record('analytics.realtime.fetch_error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeRange = '30d') {
    try {
      const response = await apiClient.get('/analytics/performance', {
        params: { timeRange }
      });
      
      return {
        coreWebVitals: response.data.coreWebVitals || {},
        userEngagement: response.data.userEngagement || {},
        systemPerformance: response.data.systemPerformance || {},
        businessMetrics: response.data.businessMetrics || {}
      };
    } catch (error) {
      telemetry.record('analytics.performance.fetch_error', {
        error: error.message,
        timeRange
      });
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(exportConfig) {
    try {
      telemetry.record('analytics.export.start', exportConfig);

      const response = await apiClient.post('/analytics/export', exportConfig, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportConfig.filename || 'analytics_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      telemetry.record('analytics.export.success', {
        format: exportConfig.format,
        size: response.data.size
      });

      return true;
    } catch (error) {
      telemetry.record('analytics.export.error', {
        error: error.message,
        exportConfig
      });
      throw error;
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.cache.clear();
    telemetry.record('analytics.cache.cleared');
  }

  /**
   * Get cached data statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
