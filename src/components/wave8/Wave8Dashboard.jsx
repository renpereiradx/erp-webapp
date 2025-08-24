import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  Database, 
  Globe, 
  Zap, 
  Shield, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Server,
  Network,
  BarChart3,
  Settings,
  RefreshCw,
  Power,
  Eye
} from 'lucide-react';
import { useWave8, useWave8Analytics } from '../../hooks/useWave8';

const Wave8Dashboard = () => {
  const {
    isReady,
    isLoading,
    error,
    config,
    metrics,
    status,
    notifications,
    healthStatus,
    services,
    monitoring,
    system
  } = useWave8();

  const analytics = useWave8Analytics();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Service status icons
  const getStatusIcon = (serviceStatus) => {
    switch (serviceStatus) {
      case 'initialized':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatResponseTime = (ms) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.round(ms)}ms`;
  };

  if (!isReady && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-semibold">Initializing Wave 8...</p>
          <p className="text-sm text-gray-600">API Integration Enterprise</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Wave 8 Error: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => system.clearError()}
            className="ml-2"
          >
            Clear
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wave 8: API Integration Enterprise</h1>
          <p className="text-gray-600">
            Enterprise-grade API management and integration platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={healthStatus?.overall === 'healthy' ? 'default' : 'destructive'}
            className="px-3 py-1"
          >
            {healthStatus?.overall === 'healthy' ? 'System Healthy' : 'System Degraded'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => monitoring.getMetrics()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => system.restart()}
          >
            <Power className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <Alert 
              key={notification.id}
              variant={notification.type === 'error' ? 'destructive' : 'default'}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">{notification.title}:</span> {notification.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalApiCalls)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatResponseTime(metrics.averageResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              -5ms from average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="gateway">API Gateway</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(status).map(([service, serviceStatus]) => (
                    <div key={service} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(serviceStatus)}
                        <span className="capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <Badge variant={serviceStatus === 'initialized' ? 'default' : 'secondary'}>
                        {serviceStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Sync Operations</span>
                    <span className="font-semibold">{formatNumber(metrics.syncOperations)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Errors</span>
                    <span className="font-semibold text-red-600">{formatNumber(metrics.errors)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cache Hit Rate</span>
                    <span className="font-semibold">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rate Limit Hits</span>
                    <span className="font-semibold">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Status */}
          <Card>
            <CardHeader>
              <CardTitle>Active Features</CardTitle>
              <CardDescription>
                Wave 8 enterprise features and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.features.map((feature, index) => (
                  <div key={feature} className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { name: 'API Manager', service: services.apiManager, icon: Globe },
              { name: 'Service Integration', service: services.serviceIntegration, icon: Network },
              { name: 'Data Sync', service: services.dataSync, icon: Database },
              { name: 'API Gateway', service: services.apiGateway, icon: Server },
              { name: 'Connectors', service: services.connectors, icon: Zap },
              { name: 'Authentication', service: services.auth, icon: Shield }
            ].map(({ name, service, icon: Icon }) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Uptime</span>
                      <span>99.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated</span>
                      <span>2 min ago</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Gateway Tab */}
        <TabsContent value="gateway" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Gateway Status</CardTitle>
              <CardDescription>
                Route management and traffic monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-gray-600">Active Routes</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-sm text-gray-600">Load Balancers</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-gray-600">Health Checks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connectors Tab */}
        <TabsContent value="connectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Connectors</CardTitle>
              <CardDescription>
                Manage connections to external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Database', 'REST API', 'WebSocket', 'File System'].map((connector) => (
                  <div key={connector} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{connector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Connected</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
              <CardDescription>
                Monitor real-time and batch synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-lg font-semibold">Real-time Sync</div>
                    <div className="text-sm text-gray-600">3 active streams</div>
                    <Progress value={85} className="mt-2" />
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-lg font-semibold">Batch Sync</div>
                    <div className="text-sm text-gray-600">Next run in 5 min</div>
                    <Progress value={0} className="mt-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                System performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Request Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Rate</span>
                      <span>{analytics.requestTrends?.current || 0} req/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Rate</span>
                      <span>1.2K req/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth</span>
                      <span className="text-green-600">+15%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Error Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Error Rate</span>
                      <span>{analytics.errorAnalysis?.rate?.toFixed(2) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Common</span>
                      <span>Rate Limit (40%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trend</span>
                      <span className="text-green-600">Decreasing</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Wave8Dashboard;
