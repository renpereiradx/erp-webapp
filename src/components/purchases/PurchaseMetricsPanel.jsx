/**
 * PurchaseMetricsPanel - Panel de Observabilidad Tiempo Real
 * Wave 1: Arquitectura Base Sólida
 * Panel completo de métricas para purchases con dashboards y controles
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Download,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Store y hooks
import usePurchaseStore from '@/store/usePurchaseStore';
import { useI18n } from '@/lib/i18n';

// Types y constantes
import { PURCHASE_STATUS } from '@/types/purchaseTypes';

/**
 * @typedef {Object} PurchaseMetricsPanelProps
 * @property {boolean} compact - Si mostrar versión compacta
 * @property {boolean} realTime - Si actualizar en tiempo real
 * @property {function} onRefresh - Callback para refrescar datos
 * @property {boolean} showControls - Si mostrar controles del panel
 */

/**
 * Panel de métricas y observabilidad para purchases
 */
const PurchaseMetricsPanel = ({
  compact = false,
  realTime = true,
  onRefresh,
  showControls = true
}) => {
  const { t } = useI18n();
  
  // Store state
  const { 
    purchaseOrders, 
    isLoading, 
    getMetrics, 
    hasStaleData,
    resetCircuitBreaker 
  } = usePurchaseStore();

  // Estado local
  const [isVisible, setIsVisible] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(realTime);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos

  // Métricas derivadas del store
  const metrics = useMemo(() => getMetrics(), [getMetrics]);
  
  // Cálculos adicionales
  const totalValue = useMemo(() => {
    return purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  }, [purchaseOrders]);

  const averageOrderValue = useMemo(() => {
    return metrics.totalOrders > 0 ? totalValue / metrics.totalOrders : 0;
  }, [totalValue, metrics.totalOrders]);

  const completionRate = useMemo(() => {
    return metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0;
  }, [metrics.totalOrders, metrics.completedOrders]);

  const cancellationRate = useMemo(() => {
    return metrics.totalOrders > 0 ? (metrics.cancelledOrders / metrics.totalOrders) * 100 : 0;
  }, [metrics.totalOrders, metrics.cancelledOrders]);

  // Estados del sistema
  const systemHealth = useMemo(() => {
    const circuitOpen = metrics.circuitState === 'open';
    const hasStale = hasStaleData();
    const highCancellationRate = cancellationRate > 20;
    
    if (circuitOpen) return { status: 'critical', message: 'Circuit Breaker Open' };
    if (highCancellationRate) return { status: 'warning', message: 'High Cancellation Rate' };
    if (hasStale) return { status: 'warning', message: 'Stale Data Detected' };
    return { status: 'healthy', message: 'All Systems Operational' };
  }, [metrics.circuitState, hasStaleData, cancellationRate]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefresh?.();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Handlers
  const handleToggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const handleManualRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleResetCircuit = useCallback(() => {
    resetCircuitBreaker();
  }, [resetCircuitBreaker]);

  const handleExportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      totalValue,
      averageOrderValue,
      completionRate,
      cancellationRate,
      systemHealth
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, totalValue, averageOrderValue, completionRate, cancellationRate, systemHealth]);

  if (!isVisible) {
    return (
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('purchases.metrics.panel_hidden')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('purchases.metrics.show_panel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('purchases.metrics.title')}
              
              {/* System Health Indicator */}
              <div className="flex items-center gap-2">
                {systemHealth.status === 'healthy' && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('purchases.metrics.healthy')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {systemHealth.message}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {systemHealth.status === 'warning' && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('purchases.metrics.warning')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {systemHealth.message}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {systemHealth.status === 'critical' && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('purchases.metrics.critical')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {systemHealth.message}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardTitle>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center gap-2">
                {/* Auto Refresh Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-refresh" className="text-sm">
                    {t('purchases.metrics.auto_refresh')}
                  </Label>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={handleToggleAutoRefresh}
                  />
                </div>

                {/* Manual Refresh */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('purchases.metrics.refresh')}
                  </TooltipContent>
                </Tooltip>

                {/* Export */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportMetrics}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('purchases.metrics.export')}
                  </TooltipContent>
                </Tooltip>

                {/* Hide Panel */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleVisibility}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('purchases.metrics.hide_panel')}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className={`grid gap-4 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            {/* Total Orders */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('purchases.metrics.total_orders')}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.totalOrders}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Value */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('purchases.metrics.total_value')}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${totalValue.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Orders */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('purchases.metrics.pending_orders')}
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {metrics.pendingOrders}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('purchases.metrics.completion_rate')}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {completionRate.toFixed(1)}%
                    </p>
                  </div>
                  {completionRate >= 80 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {!compact && (
              <>
                {/* Average Order Value */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {t('purchases.metrics.avg_order_value')}
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${averageOrderValue.toFixed(2)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Confirmed Orders */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {t('purchases.metrics.confirmed_orders')}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {metrics.confirmedOrders}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Cancelled Orders */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {t('purchases.metrics.cancelled_orders')}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {metrics.cancelledOrders}
                        </p>
                        <p className="text-xs text-gray-500">
                          ({cancellationRate.toFixed(1)}%)
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Cache Performance */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {t('purchases.metrics.cache_size')}
                        </p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {metrics.cacheSize}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={hasStaleData() ? 'destructive' : 'default'} className="text-xs">
                            {hasStaleData() ? t('purchases.metrics.stale') : t('purchases.metrics.fresh')}
                          </Badge>
                        </div>
                      </div>
                      <Zap className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* System Controls */}
          {!compact && showControls && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {t('purchases.metrics.system_controls')}
              </h4>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Circuit Breaker Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {t('purchases.metrics.circuit_breaker')}:
                  </span>
                  <Badge variant={metrics.circuitState === 'open' ? 'destructive' : 'default'}>
                    {metrics.circuitState.toUpperCase()}
                  </Badge>
                  {metrics.circuitState === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetCircuit}
                      className="text-xs"
                    >
                      {t('purchases.metrics.reset_circuit')}
                    </Button>
                  )}
                </div>

                {/* Circuit Failures */}
                {metrics.circuitFailures > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {t('purchases.metrics.failures')}:
                    </span>
                    <Badge variant="secondary">
                      {metrics.circuitFailures}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default React.memo(PurchaseMetricsPanel);
