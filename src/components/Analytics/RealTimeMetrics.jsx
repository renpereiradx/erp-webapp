/**
 * Real Time Metrics Component
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Displays real-time analytics metrics with live updates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Zap,
  Users,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';

const RealTimeMetrics = ({ 
  className = "",
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onRefresh
}) => {
  const { t } = useI18n();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [metrics, setMetrics] = useState({
    totalSales: { value: 0, change: 0, trend: 'up' },
    activeUsers: { value: 0, change: 0, trend: 'up' },
    conversionRate: { value: 0, change: 0, trend: 'up' },
    revenue: { value: 0, change: 0, trend: 'up' }
  });

  // Simulate real-time data updates
  const generateMetrics = () => {
    const baseMetrics = {
      totalSales: Math.floor(Math.random() * 1000) + 500,
      activeUsers: Math.floor(Math.random() * 100) + 50,
      conversionRate: Math.random() * 10 + 2,
      revenue: Math.random() * 50000 + 25000
    };

    return {
      totalSales: {
        value: baseMetrics.totalSales,
        change: (Math.random() - 0.5) * 20,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      activeUsers: {
        value: baseMetrics.activeUsers,
        change: (Math.random() - 0.5) * 10,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      conversionRate: {
        value: baseMetrics.conversionRate,
        change: (Math.random() - 0.5) * 2,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      revenue: {
        value: baseMetrics.revenue,
        change: (Math.random() - 0.5) * 5000,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMetrics = generateMetrics();
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      
      if (onRefresh) {
        onRefresh(newMetrics);
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(handleRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Initial load
  useEffect(() => {
    handleRefresh();
  }, []);

  const MetricCard = ({ title, icon: Icon, value, change, trend, format = 'number' }) => {
    const formatValue = (val) => {
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return formatPercentage(val);
        default:
          return formatNumber(val);
      }
    };

    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
    const trendBg = trend === 'up' ? 'bg-green-50' : 'bg-red-50';

    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">{title}</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`${trendBg} ${trendColor} border-0`}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {formatPercentage(Math.abs(change))}
            </Badge>
          </div>
          
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('analytics.realTime.vs')} {t('analytics.realTime.previous')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">
              {t('analytics.realTime.title')}
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              {t('analytics.realTime.live')}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {t('analytics.realTime.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t('analytics.realTime.metrics.sales')}
            icon={ShoppingCart}
            value={metrics.totalSales.value}
            change={metrics.totalSales.change}
            trend={metrics.totalSales.trend}
            format="number"
          />
          
          <MetricCard
            title={t('analytics.realTime.metrics.revenue')}
            icon={DollarSign}
            value={metrics.revenue.value}
            change={metrics.revenue.change}
            trend={metrics.revenue.trend}
            format="currency"
          />
          
          <MetricCard
            title={t('analytics.realTime.metrics.users')}
            icon={Users}
            value={metrics.activeUsers.value}
            change={metrics.activeUsers.change}
            trend={metrics.activeUsers.trend}
            format="number"
          />
          
          <MetricCard
            title={t('analytics.realTime.metrics.conversion')}
            icon={TrendingUp}
            value={metrics.conversionRate.value}
            change={metrics.conversionRate.change}
            trend={metrics.conversionRate.trend}
            format="percentage"
          />
        </div>
        
        {/* Status indicators */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">{t('analytics.realTime.status.online')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <RefreshCw className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600">
                  {t('analytics.realTime.autoRefresh')}: {autoRefresh ? t('common.on') : t('common.off')}
                </span>
              </div>
            </div>
            
            <div className="text-gray-500">
              {t('analytics.realTime.updateInterval')}: {refreshInterval / 1000}s
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetrics;
