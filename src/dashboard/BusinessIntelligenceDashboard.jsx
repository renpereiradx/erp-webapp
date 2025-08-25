// Wave 8: Enterprise Business Intelligence Dashboard
// Real-time analytics and business metrics

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

// Business Intelligence Dashboard Component
export const BusinessIntelligenceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data - in production, this would come from APIs
  const mockData = useMemo(() => ({
    kpis: {
      totalRevenue: { value: 45230, change: 12.5, trend: 'up' },
      activeUsers: { value: 1847, change: -3.2, trend: 'down' },
      conversionRate: { value: 3.24, change: 8.1, trend: 'up' },
      avgOrderValue: { value: 127.50, change: 5.7, trend: 'up' }
    },
    performance: {
      pageLoadTime: 1.8,
      coreWebVitals: {
        lcp: { value: 2.1, status: 'good' },
        fid: { value: 85, status: 'good' },
        cls: { value: 0.08, status: 'good' }
      },
      availability: 99.97,
      errorRate: 0.12
    },
    sales: [
      { date: '2025-08-18', revenue: 4200, orders: 35, users: 128 },
      { date: '2025-08-19', revenue: 3800, orders: 28, users: 115 },
      { date: '2025-08-20', revenue: 5100, orders: 42, users: 156 },
      { date: '2025-08-21', revenue: 4600, orders: 38, users: 142 },
      { date: '2025-08-22', revenue: 5800, orders: 48, users: 178 },
      { date: '2025-08-23', revenue: 6200, orders: 52, users: 189 },
      { date: '2025-08-24', revenue: 7100, orders: 58, users: 201 },
      { date: '2025-08-25', revenue: 6800, orders: 55, users: 198 }
    ],
    userSegments: [
      { name: 'Enterprise', value: 35, color: '#8884d8' },
      { name: 'SMB', value: 45, color: '#82ca9d' },
      { name: 'Startup', value: 20, color: '#ffc658' }
    ],
    systemHealth: {
      cpu: 34,
      memory: 67,
      disk: 23,
      network: 45
    }
  }), []);

  useEffect(() => {
    // Simulate API call
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(mockData);
      } catch (err) {
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Set up real-time updates
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange, mockData]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`$${metrics.kpis.totalRevenue.value.toLocaleString()}`}
          change={metrics.kpis.totalRevenue.change}
          trend={metrics.kpis.totalRevenue.trend}
          icon={DollarSign}
        />
        <KPICard
          title="Active Users"
          value={metrics.kpis.activeUsers.value.toLocaleString()}
          change={metrics.kpis.activeUsers.change}
          trend={metrics.kpis.activeUsers.trend}
          icon={Users}
        />
        <KPICard
          title="Conversion Rate"
          value={`${metrics.kpis.conversionRate.value}%`}
          change={metrics.kpis.conversionRate.change}
          trend={metrics.kpis.conversionRate.trend}
          icon={TrendingUp}
        />
        <KPICard
          title="Avg Order Value"
          value={`$${metrics.kpis.avgOrderValue.value}`}
          change={metrics.kpis.avgOrderValue.change}
          trend={metrics.kpis.avgOrderValue.trend}
          icon={ShoppingCart}
        />
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PerformanceMetric
              title="Page Load Time"
              value={`${metrics.performance.pageLoadTime}s`}
              status="good"
            />
            <PerformanceMetric
              title="Availability"
              value={`${metrics.performance.availability}%`}
              status="excellent"
            />
            <PerformanceMetric
              title="Error Rate"
              value={`${metrics.performance.errorRate}%`}
              status="good"
            />
            <PerformanceMetric
              title="Core Web Vitals"
              value="All Good"
              status="excellent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle>User Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.userSegments}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {metrics.userSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ResourceUsage title="CPU" usage={metrics.systemHealth.cpu} />
            <ResourceUsage title="Memory" usage={metrics.systemHealth.memory} />
            <ResourceUsage title="Disk" usage={metrics.systemHealth.disk} />
            <ResourceUsage title="Network" usage={metrics.systemHealth.network} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, change, trend, icon: Icon }) => {
  const isPositive = trend === 'up';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Metric Component
const PerformanceMetric = ({ title, value, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <p className="text-xl font-bold mb-2">{value}</p>
      <Badge className={getStatusColor(status)}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    </div>
  );
};

// Resource Usage Component
const ResourceUsage = ({ title, usage }) => {
  const getUsageColor = (usage) => {
    if (usage < 50) return 'bg-green-600';
    if (usage < 80) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-sm text-gray-900">{usage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getUsageColor(usage)}`}
          style={{ width: `${usage}%` }}
        />
      </div>
    </div>
  );
};

export default BusinessIntelligenceDashboard;
