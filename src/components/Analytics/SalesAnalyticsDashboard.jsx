/**
 * Sales Analytics Dashboard
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Comprehensive analytics dashboard for sales system with real-time metrics,
 * business intelligence, and interactive data visualization.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Target, BarChart3, PieChart, Filter, Calendar,
  RefreshCw, Download, Settings, Maximize2, Minimize2 
} from 'lucide-react';

import useAnalyticsStore from '@/store/useAnalyticsStore';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';

// Analytics sub-components
import MetricsCard from './MetricsCard';
import SalesTrendsChart from './SalesTrendsChart';
import ProductPerformanceChart from './ProductPerformanceChart';
import CustomerAnalyticsChart from './CustomerAnalyticsChart';
import RealTimeMetrics from './RealTimeMetrics';
import BusinessIntelligencePanel from './BusinessIntelligencePanel';

const SalesAnalyticsDashboard = ({ className = "" }) => {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Analytics store state
  const {
    salesAnalytics,
    businessIntelligence,
    realTimeDashboard,
    performanceMetrics,
    filters,
    ui,
    loading,
    errors,
    loadSalesAnalytics,
    loadBusinessIntelligence,
    loadRealTimeDashboard,
    loadPerformanceMetrics,
    updateFilters,
    setActiveTab,
    toggleAutoRefresh
  } = useAnalyticsStore(state => ({
    salesAnalytics: state.salesAnalytics,
    businessIntelligence: state.businessIntelligence,
    realTimeDashboard: state.realTimeDashboard,
    performanceMetrics: state.performanceMetrics,
    filters: state.filters,
    ui: state.ui,
    loading: state.loading,
    errors: state.errors,
    loadSalesAnalytics: state.loadSalesAnalytics,
    loadBusinessIntelligence: state.loadBusinessIntelligence,
    loadRealTimeDashboard: state.loadRealTimeDashboard,
    loadPerformanceMetrics: state.loadPerformanceMetrics,
    updateFilters: state.updateFilters,
    setActiveTab: state.setActiveTab,
    toggleAutoRefresh: state.toggleAutoRefresh
  }));

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadSalesAnalytics(),
          loadRealTimeDashboard(),
          loadPerformanceMetrics()
        ]);
      } catch (error) {
        console.error('Error loading initial analytics data:', error);
      }
    };

    loadInitialData();
  }, [loadSalesAnalytics, loadRealTimeDashboard, loadPerformanceMetrics]);

  // Auto-refresh logic
  useEffect(() => {
    let interval;
    
    if (ui.autoRefresh && ui.refreshInterval > 0) {
      interval = setInterval(() => {
        loadRealTimeDashboard();
      }, ui.refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ui.autoRefresh, ui.refreshInterval, loadRealTimeDashboard]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSalesAnalytics(),
        loadRealTimeDashboard(),
        loadPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadSalesAnalytics, loadRealTimeDashboard, loadPerformanceMetrics]);

  // Filter handlers
  const handleTimeRangeChange = useCallback((timeRange) => {
    updateFilters({ timeRange });
  }, [updateFilters]);

  const handleDateRangeChange = useCallback((dateRange) => {
    updateFilters({
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to
    });
  }, [updateFilters]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const { performance, realTime } = salesAnalytics;
    
    return [
      {
        id: 'revenue',
        title: t('analytics.metrics.totalRevenue'),
        value: formatCurrency(performance.totalRevenue),
        change: performance.salesGrowth,
        trend: performance.salesGrowth >= 0 ? 'up' : 'down',
        icon: DollarSign,
        color: 'green'
      },
      {
        id: 'sales',
        title: t('analytics.metrics.totalSales'),
        value: formatNumber(performance.totalSales),
        change: realTime.conversionRate,
        trend: realTime.conversionRate >= 0 ? 'up' : 'down',
        icon: ShoppingCart,
        color: 'blue'
      },
      {
        id: 'customers',
        title: t('analytics.metrics.activeCustomers'),
        value: formatNumber(realTime.activeSessions),
        change: salesAnalytics.customers.newCustomers / (salesAnalytics.customers.newCustomers + salesAnalytics.customers.returningCustomers) * 100,
        trend: 'up',
        icon: Users,
        color: 'purple'
      },
      {
        id: 'aov',
        title: t('analytics.metrics.avgOrderValue'),
        value: formatCurrency(performance.averageOrderValue),
        change: 5.2, // Would come from analytics
        trend: 'up',
        icon: Target,
        color: 'orange'
      }
    ];
  }, [salesAnalytics, t]);

  // Tab content configuration
  const tabConfig = [
    {
      id: 'overview',
      label: t('analytics.tabs.overview'),
      icon: BarChart3
    },
    {
      id: 'sales',
      label: t('analytics.tabs.sales'),
      icon: TrendingUp
    },
    {
      id: 'products',
      label: t('analytics.tabs.products'),
      icon: PieChart
    },
    {
      id: 'customers',
      label: t('analytics.tabs.customers'),
      icon: Users
    },
    {
      id: 'intelligence',
      label: t('analytics.tabs.intelligence'),
      icon: Target
    }
  ];

  return (
    <div className={cn(
      "analytics-dashboard w-full h-full",
      fullscreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('analytics.dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('analytics.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <Select 
            value={filters.timeRange} 
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('analytics.filters.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('analytics.filters.last7days')}</SelectItem>
              <SelectItem value="30d">{t('analytics.filters.last30days')}</SelectItem>
              <SelectItem value="90d">{t('analytics.filters.last90days')}</SelectItem>
              <SelectItem value="1y">{t('analytics.filters.lastYear')}</SelectItem>
              <SelectItem value="custom">{t('analytics.filters.custom')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker (for custom range) */}
          {filters.timeRange === 'custom' && (
            <DatePickerWithRange
              from={filters.dateFrom}
              to={filters.dateTo}
              onSelect={handleDateRangeChange}
            />
          )}

          {/* Auto-refresh indicator */}
          <Badge variant={ui.autoRefresh ? "default" : "secondary"}>
            <RefreshCw className={cn(
              "w-3 h-3 mr-1",
              ui.autoRefresh && "animate-spin"
            )} />
            {ui.autoRefresh ? t('analytics.autoRefresh.on') : t('analytics.autoRefresh.off')}
          </Badge>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading.salesAnalytics}
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-2",
              refreshing && "animate-spin"
            )} />
            {t('analytics.actions.refresh')}
          </Button>

          {/* Export Button */}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.actions.export')}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {Object.values(errors).some(Boolean) && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">
            {t('analytics.errors.loadingFailed')}
          </p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyMetrics.map((metric) => (
          <MetricsCard
            key={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            icon={metric.icon}
            color={metric.color}
            loading={loading.salesAnalytics}
          />
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs 
        value={ui.activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          {tabConfig.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t('analytics.realtime.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeMetrics
                  data={realTimeDashboard}
                  loading={loading.realTimeDashboard}
                />
              </CardContent>
            </Card>

            {/* Sales Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t('analytics.trends.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesTrendsChart
                  data={salesAnalytics.trends}
                  loading={loading.salesAnalytics}
                  timeRange={filters.timeRange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Business Intelligence Panel */}
          <BusinessIntelligencePanel
            data={businessIntelligence}
            loading={loading.businessIntelligence}
            onLoadBI={loadBusinessIntelligence}
          />
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <SalesTrendsChart
            data={salesAnalytics.trends}
            loading={loading.salesAnalytics}
            timeRange={filters.timeRange}
            detailed={true}
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductPerformanceChart
            data={salesAnalytics.products}
            loading={loading.salesAnalytics}
          />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <CustomerAnalyticsChart
            data={salesAnalytics.customers}
            loading={loading.salesAnalytics}
          />
        </TabsContent>

        {/* Business Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <BusinessIntelligencePanel
            data={businessIntelligence}
            loading={loading.businessIntelligence}
            onLoadBI={loadBusinessIntelligence}
            expanded={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAnalyticsDashboard;
