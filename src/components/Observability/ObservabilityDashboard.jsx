/**
 * Observability Dashboard Component
 * Wave 7: Observability & Monitoring
 * 
 * Central dashboard for real-time monitoring, alerts, and system health
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Users,
  DollarSign,
  Server,
  Wifi,
  HardDrive,
  Bell,
  BellOff,
  RefreshCw,
  Download,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  BarChart3,
  AlertCircle,
  Info,
  Timer
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMonitoringStore } from '@/store/useMonitoringStore';
import { salesTelemetryService } from '@/services/salesTelemetryService';
import { errorTrackingService } from '@/services/errorTrackingService';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { format, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import BusinessMetricsPanel from './BusinessMetricsPanel';

const ObservabilityDashboard = () => {
  const {
    isMonitoring,
    realTimeData,
    historicalData,
    alerts,
    unacknowledgedAlerts,
    dashboardConfig,
    thresholds,
    filters,
    startMonitoring,
    stopMonitoring,
    refreshData,
    acknowledgeAlert,
    resolveAlert,
    acknowledgeAllAlerts,
    updateDashboardConfig,
    updateFilters,
    getPerformanceScore,
    getHealthStatus,
    exportData
  } = useMonitoringStore();

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  const healthStatus = getHealthStatus();
  const performanceScore = getPerformanceScore();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `observability-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const SystemHealthCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <div className={`flex items-center space-x-2 px-2 py-1 rounded-full ${getHealthStatusColor(healthStatus)}`}>
          {getHealthStatusIcon(healthStatus)}
          <span className="text-sm font-medium capitalize">{healthStatus}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Performance Score</span>
              <span className="text-2xl font-bold">
                {performanceScore ? `${performanceScore}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  performanceScore >= 80 ? 'bg-green-500' : 
                  performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore || 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Alerts</span>
              <span className="text-2xl font-bold text-red-600">{unacknowledgedAlerts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monitoring</span>
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Stopped'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PerformanceMetricsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Performance Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {realTimeData.performance ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {realTimeData.performance.lcp?.avg ? 
                  `${Math.round(realTimeData.performance.lcp.avg)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">LCP (Avg)</div>
              <div className={`text-xs px-2 py-1 rounded ${
                realTimeData.performance.lcp?.avg <= thresholds.performance.lcp.good ? 
                'bg-green-100 text-green-700' : 
                realTimeData.performance.lcp?.avg <= thresholds.performance.lcp.poor ? 
                'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {realTimeData.performance.lcp?.avg <= thresholds.performance.lcp.good ? 'Good' : 
                 realTimeData.performance.lcp?.avg <= thresholds.performance.lcp.poor ? 'Fair' : 'Poor'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {realTimeData.performance.fid?.avg ? 
                  `${Math.round(realTimeData.performance.fid.avg)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">FID (Avg)</div>
              <div className={`text-xs px-2 py-1 rounded ${
                realTimeData.performance.fid?.avg <= thresholds.performance.fid.good ? 
                'bg-green-100 text-green-700' : 
                realTimeData.performance.fid?.avg <= thresholds.performance.fid.poor ? 
                'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {realTimeData.performance.fid?.avg <= thresholds.performance.fid.good ? 'Good' : 
                 realTimeData.performance.fid?.avg <= thresholds.performance.fid.poor ? 'Fair' : 'Poor'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {realTimeData.performance.cls?.avg ? 
                  realTimeData.performance.cls.avg.toFixed(3) : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">CLS (Avg)</div>
              <div className={`text-xs px-2 py-1 rounded ${
                realTimeData.performance.cls?.avg <= thresholds.performance.cls.good ? 
                'bg-green-100 text-green-700' : 
                realTimeData.performance.cls?.avg <= thresholds.performance.cls.poor ? 
                'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {realTimeData.performance.cls?.avg <= thresholds.performance.cls.good ? 'Good' : 
                 realTimeData.performance.cls?.avg <= thresholds.performance.cls.poor ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No performance data available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ErrorMetricsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Error Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {realTimeData.errors ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {realTimeData.errors.total}
                </div>
                <div className="text-sm text-muted-foreground">Total Errors ({filters.timeRange})</div>
              </div>
              <div className="space-y-2">
                {Object.entries(realTimeData.errors.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge 
                      variant={severity === 'critical' ? 'destructive' : 
                              severity === 'high' ? 'default' : 'secondary'}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            {realTimeData.errors.topErrors?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Top Errors</h4>
                <div className="space-y-1">
                  {realTimeData.errors.topErrors.slice(0, 3).map((error, index) => (
                    <div key={error.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1" title={error.message}>
                        {error.message}
                      </span>
                      <Badge variant="outline">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No error data available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const BusinessMetricsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Business Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {realTimeData.business ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.business.totalSales}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPercentage(realTimeData.business.conversionRate / 100)}
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.business.successfulPayments}</div>
              <div className="text-sm text-muted-foreground">Successful Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.business.completedConversions}</div>
              <div className="text-sm text-muted-foreground">Conversions</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No business data available
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AlertsPanel = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Active Alerts</span>
          {unacknowledgedAlerts > 0 && (
            <Badge variant="destructive">{unacknowledgedAlerts}</Badge>
          )}
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={acknowledgeAllAlerts}
            disabled={unacknowledgedAlerts === 0}
          >
            Acknowledge All
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.slice(0, 10).map((alert) => (
              <Alert 
                key={alert.id} 
                className={`cursor-pointer ${alert.acknowledged ? 'opacity-60' : ''}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.type.replace('_', ' ').toUpperCase()}</span>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={alert.level === 'critical' ? 'destructive' : 
                              alert.level === 'warning' ? 'default' : 'secondary'}
                    >
                      {alert.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No active alerts
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ControlPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="monitoring-toggle">Real-time Monitoring</Label>
          <Switch
            id="monitoring-toggle"
            checked={isMonitoring}
            onCheckedChange={isMonitoring ? stopMonitoring : startMonitoring}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-refresh">Auto Refresh</Label>
          <Switch
            id="auto-refresh"
            checked={dashboardConfig.autoRefresh}
            onCheckedChange={(checked) => 
              updateDashboardConfig({ autoRefresh: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select 
            value={filters.timeRange} 
            onValueChange={(value) => updateFilters({ timeRange: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Refresh Interval</Label>
          <Select 
            value={dashboardConfig.refreshInterval.toString()} 
            onValueChange={(value) => 
              updateDashboardConfig({ refreshInterval: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10000">10 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
              <SelectItem value="300000">5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshData} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Observability Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and system health for Sales System
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
          </Badge>
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SystemHealthCard />
        <PerformanceMetricsCard />
        <ErrorMetricsCard />
        <BusinessMetricsCard />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="metrics">Advanced Metrics</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {unacknowledgedAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AlertsPanel />
            </div>
            <div>
              <ControlPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.performance.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lcp.avg" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="LCP (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fid.avg" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="FID (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No historical performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.errors.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData.errors.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#ff7300" 
                      fill="#ff7300"
                      fillOpacity={0.6}
                      name="Total Errors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No historical error data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.business.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.business.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Total Sales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Conversion Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No historical business data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <BusinessMetricsPanel />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel />
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Alert Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level</Label>
                  <Badge 
                    variant={selectedAlert.level === 'critical' ? 'destructive' : 
                            selectedAlert.level === 'warning' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {selectedAlert.level}
                  </Badge>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedAlert.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedAlert.acknowledged ? 'secondary' : 'default'}>
                    {selectedAlert.resolved ? 'Resolved' : 
                     selectedAlert.acknowledged ? 'Acknowledged' : 'Active'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <p className="text-sm bg-muted p-3 rounded mt-1">{selectedAlert.message}</p>
              </div>
              <div className="flex space-x-2">
                {!selectedAlert.acknowledged && (
                  <Button 
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                {!selectedAlert.resolved && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      resolveAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObservabilityDashboard;
