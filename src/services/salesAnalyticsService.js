/**
 * Sales Analytics Service
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Provides comprehensive analytics and business intelligence
 * for the sales system with real-time metrics and KPI calculation.
 */

import { apiClient } from '@/services/apiClient';
import { telemetryService } from '@/services/telemetryService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
         startOfMonth, endOfMonth, startOfYear, endOfYear,
         subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * Sales Analytics Service
 * Handles all analytics-related operations including metrics calculation,
 * trend analysis, and business intelligence for the sales system.
 */
class SalesAnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }

    // ===================== CORE METRICS =====================

    /**
     * Get comprehensive sales metrics for a date range
     * @param {Object} params - Date range and filters
     * @param {Date} params.startDate - Start date
     * @param {Date} params.endDate - End date
     * @param {Array} params.filters - Additional filters
     * @returns {Promise<Object>} Sales metrics
     */
    async getSalesMetrics(params = {}) {
        const startTime = performance.now();
        
        try {
            const {
                startDate = startOfDay(new Date()),
                endDate = endOfDay(new Date()),
                filters = []
            } = params;

            // Check cache first
            const cacheKey = this._generateCacheKey('sales-metrics', { startDate, endDate, filters });
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                telemetryService.recordMetric('sales_analytics_cache_hit', 1);
                return cached;
            }

            // Fetch from API
            const response = await apiClient.get('/analytics/sales/metrics', {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    filters: JSON.stringify(filters)
                }
            });

            const metrics = {
                // Revenue Metrics
                totalRevenue: response.data.total_revenue || 0,
                averageOrderValue: response.data.average_order_value || 0,
                revenueGrowth: response.data.revenue_growth || 0,
                revenuePerCustomer: response.data.revenue_per_customer || 0,

                // Sales Performance
                totalSales: response.data.total_sales || 0,
                salesGrowth: response.data.sales_growth || 0,
                conversionRate: response.data.conversion_rate || 0,
                averageTransactionTime: response.data.avg_transaction_time || 0,

                // Product Metrics
                topProducts: response.data.top_products || [],
                categoryBreakdown: response.data.category_breakdown || [],
                productPerformance: response.data.product_performance || [],

                // Customer Metrics
                newCustomers: response.data.new_customers || 0,
                returningCustomers: response.data.returning_customers || 0,
                customerRetentionRate: response.data.customer_retention_rate || 0,
                averageCustomerLifetimeValue: response.data.avg_clv || 0,

                // Payment Analytics
                paymentMethodDistribution: response.data.payment_methods || {},
                paymentSuccessRate: response.data.payment_success_rate || 0,
                averagePaymentTime: response.data.avg_payment_time || 0,

                // Operational Metrics
                peakSalesHours: response.data.peak_hours || [],
                staffPerformance: response.data.staff_performance || [],
                errorRate: response.data.error_rate || 0,

                // Meta information
                lastUpdated: new Date().toISOString(),
                dateRange: { startDate, endDate },
                totalRecords: response.data.total_records || 0
            };

            // Cache the results
            this._setCache(cacheKey, metrics);

            // Record telemetry
            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_metrics_duration', duration);
            telemetryService.recordMetric('sales_analytics_api_call', 1);

            return metrics;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_metrics_error', error, {
                duration,
                params
            });
            throw error;
        }
    }

    /**
     * Get sales trends over time with comparative analysis
     * @param {Object} params - Trend parameters
     * @returns {Promise<Object>} Trend data
     */
    async getSalesTrends(params = {}) {
        const startTime = performance.now();

        try {
            const {
                period = 'daily', // daily, weekly, monthly, yearly
                dateRange = 30, // number of periods
                compareWithPrevious = true,
                metrics = ['revenue', 'sales_count', 'aov']
            } = params;

            const cacheKey = this._generateCacheKey('sales-trends', params);
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

            const response = await apiClient.get('/analytics/sales/trends', {
                params: {
                    period,
                    date_range: dateRange,
                    compare_previous: compareWithPrevious,
                    metrics: metrics.join(',')
                }
            });

            const trends = {
                current: response.data.current || [],
                previous: response.data.previous || [],
                comparison: response.data.comparison || {},
                growth: response.data.growth || {},
                forecast: response.data.forecast || [],
                seasonality: response.data.seasonality || {},
                lastUpdated: new Date().toISOString()
            };

            this._setCache(cacheKey, trends);

            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_trends_duration', duration);

            return trends;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_trends_error', error, {
                duration,
                params
            });
            throw error;
        }
    }

    // ===================== PRODUCT ANALYTICS =====================

    /**
     * Get detailed product performance analytics
     * @param {Object} params - Product analytics parameters
     * @returns {Promise<Object>} Product analytics data
     */
    async getProductAnalytics(params = {}) {
        const startTime = performance.now();

        try {
            const {
                startDate = subDays(new Date(), 30),
                endDate = new Date(),
                limit = 20,
                sortBy = 'revenue',
                category = null
            } = params;

            const cacheKey = this._generateCacheKey('product-analytics', params);
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

            const response = await apiClient.get('/analytics/products', {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    limit,
                    sort_by: sortBy,
                    category
                }
            });

            const analytics = {
                topProducts: response.data.top_products || [],
                categoryPerformance: response.data.category_performance || [],
                productTrends: response.data.product_trends || [],
                inventoryTurnover: response.data.inventory_turnover || [],
                profitabilityAnalysis: response.data.profitability || [],
                recommendations: response.data.recommendations || [],
                lastUpdated: new Date().toISOString()
            };

            this._setCache(cacheKey, analytics);

            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_products_duration', duration);

            return analytics;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_products_error', error, {
                duration,
                params
            });
            throw error;
        }
    }

    // ===================== CUSTOMER ANALYTICS =====================

    /**
     * Get customer behavior and segmentation analytics
     * @param {Object} params - Customer analytics parameters
     * @returns {Promise<Object>} Customer analytics data
     */
    async getCustomerAnalytics(params = {}) {
        const startTime = performance.now();

        try {
            const {
                startDate = subMonths(new Date(), 6),
                endDate = new Date(),
                segmentBy = 'value', // value, frequency, recency
                includeChurn = true
            } = params;

            const cacheKey = this._generateCacheKey('customer-analytics', params);
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

            const response = await apiClient.get('/analytics/customers', {
                params: {
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    segment_by: segmentBy,
                    include_churn: includeChurn
                }
            });

            const analytics = {
                customerSegments: response.data.segments || [],
                lifetimeValue: response.data.lifetime_value || {},
                churnAnalysis: response.data.churn_analysis || {},
                acquisitionTrends: response.data.acquisition_trends || [],
                retentionMetrics: response.data.retention_metrics || {},
                behaviorPatterns: response.data.behavior_patterns || [],
                recommendations: response.data.recommendations || [],
                lastUpdated: new Date().toISOString()
            };

            this._setCache(cacheKey, analytics);

            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_customers_duration', duration);

            return analytics;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_customers_error', error, {
                duration,
                params
            });
            throw error;
        }
    }

    // ===================== REAL-TIME ANALYTICS =====================

    /**
     * Get real-time sales dashboard data
     * @returns {Promise<Object>} Real-time metrics
     */
    async getRealTimeMetrics() {
        const startTime = performance.now();

        try {
            // For real-time data, we use shorter cache (30 seconds)
            const cacheKey = 'realtime-metrics';
            const cached = this._getFromCache(cacheKey, 30 * 1000);
            if (cached) return cached;

            const response = await apiClient.get('/analytics/realtime');

            const metrics = {
                // Current day metrics
                todayRevenue: response.data.today_revenue || 0,
                todaySales: response.data.today_sales || 0,
                todayCustomers: response.data.today_customers || 0,
                
                // Live activity
                activeSessions: response.data.active_sessions || 0,
                currentHourSales: response.data.current_hour_sales || 0,
                lastHourComparison: response.data.last_hour_comparison || 0,
                
                // Recent activity
                recentSales: response.data.recent_sales || [],
                topSellingNow: response.data.top_selling_now || [],
                
                // System health
                systemLoad: response.data.system_load || 0,
                responseTime: response.data.avg_response_time || 0,
                errorRate: response.data.error_rate || 0,
                
                lastUpdated: new Date().toISOString()
            };

            this._setCache(cacheKey, metrics, 30 * 1000);

            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_realtime_duration', duration);

            return metrics;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_realtime_error', error, { duration });
            throw error;
        }
    }

    // ===================== BUSINESS INTELLIGENCE =====================

    /**
     * Get business intelligence insights and recommendations
     * @param {Object} params - BI parameters
     * @returns {Promise<Object>} Business intelligence data
     */
    async getBusinessIntelligence(params = {}) {
        const startTime = performance.now();

        try {
            const {
                analysisType = 'comprehensive', // comprehensive, performance, opportunities
                timeHorizon = 'quarterly',
                includeForecasting = true,
                includePredictive = true
            } = params;

            const cacheKey = this._generateCacheKey('business-intelligence', params);
            const cached = this._getFromCache(cacheKey, 15 * 60 * 1000); // 15 minutes cache
            if (cached) return cached;

            const response = await apiClient.get('/analytics/business-intelligence', {
                params: {
                    analysis_type: analysisType,
                    time_horizon: timeHorizon,
                    include_forecasting: includeForecasting,
                    include_predictive: includePredictive
                }
            });

            const intelligence = {
                // Key insights
                insights: response.data.insights || [],
                recommendations: response.data.recommendations || [],
                opportunities: response.data.opportunities || [],
                risks: response.data.risks || [],
                
                // Forecasting
                salesForecast: response.data.sales_forecast || {},
                revenueForecast: response.data.revenue_forecast || {},
                seasonalPredictions: response.data.seasonal_predictions || {},
                
                // Performance analysis
                performanceScore: response.data.performance_score || 0,
                benchmarkComparison: response.data.benchmark_comparison || {},
                competitiveAnalysis: response.data.competitive_analysis || {},
                
                // Strategic recommendations
                strategicInitiatives: response.data.strategic_initiatives || [],
                resourceOptimization: response.data.resource_optimization || [],
                growthOpportunities: response.data.growth_opportunities || [],
                
                lastUpdated: new Date().toISOString(),
                confidence: response.data.confidence || 0.85
            };

            this._setCache(cacheKey, intelligence, 15 * 60 * 1000);

            const duration = performance.now() - startTime;
            telemetryService.recordMetric('sales_analytics_bi_duration', duration);

            return intelligence;

        } catch (error) {
            const duration = performance.now() - startTime;
            telemetryService.recordError('sales_analytics_bi_error', error, {
                duration,
                params
            });
            throw error;
        }
    }

    // ===================== UTILITIES =====================

    /**
     * Generate cache key for analytics data
     * @private
     */
    _generateCacheKey(type, params) {
        const paramsString = JSON.stringify(params, Object.keys(params).sort());
        return `analytics_${type}_${btoa(paramsString).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    /**
     * Get data from cache if not expired
     * @private
     */
    _getFromCache(key, customTimeout = null) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const timeout = customTimeout || this.cacheTimeout;
        const isExpired = Date.now() - cached.timestamp > timeout;
        
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set data in cache with timestamp
     * @private
     */
    _setCache(key, data, customTimeout = null) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            timeout: customTimeout || this.cacheTimeout
        });

        // Clean up old cache entries periodically
        if (this.cache.size > 100) {
            this._cleanupCache();
        }
    }

    /**
     * Clean up expired cache entries
     * @private
     */
    _cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.timeout) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all analytics cache
     */
    clearCache() {
        this.cache.clear();
        telemetryService.recordMetric('sales_analytics_cache_cleared', 1);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const stats = {
            totalEntries: this.cache.size,
            cacheHitRatio: 0, // Would need tracking to calculate
            memoryUsage: JSON.stringify([...this.cache.values()]).length,
            oldestEntry: null,
            newestEntry: null
        };

        const timestamps = [...this.cache.values()].map(v => v.timestamp);
        if (timestamps.length > 0) {
            stats.oldestEntry = Math.min(...timestamps);
            stats.newestEntry = Math.max(...timestamps);
        }

        return stats;
    }
}

// Export singleton instance
export const salesAnalyticsService = new SalesAnalyticsService();
export default salesAnalyticsService;
