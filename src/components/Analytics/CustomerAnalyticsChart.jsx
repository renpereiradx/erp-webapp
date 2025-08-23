/**
 * Customer Analytics Chart Component
 * Wave 6: Advanced Analytics & Reporting - Phase 2
 * 
 * Comprehensive customer analytics with segmentation, behavior analysis,
 * lifetime value tracking, and retention metrics visualization.
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Users, TrendingUp, Heart, Clock, Target, 
  Filter, MoreHorizontal, Eye, UserCheck,
  UserX, Crown, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/utils/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const CustomerAnalyticsChart = memo(({
  data,
  loading = false,
  className = "",
  height = 500,
  onCustomerClick,
  onSegmentClick
}) => {

  const [viewMode, setViewMode] = useState('overview'); // overview, segments, lifetime, retention
  const [timeRange, setTimeRange] = useState('3m'); // 1m, 3m, 6m, 1y
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showDetails, setShowDetails] = useState(false);

  // Color schemes for different segments
  const segmentColors = {
    'VIP': '#8B5CF6',
    'Frequent': '#10B981', 
    'Regular': '#3B82F6',
    'New': '#F59E0B',
    'At Risk': '#EF4444'
  };

  // Process customer segments data
  const segmentsData = useMemo(() => {
    if (!data?.customerSegments) return [];

    return data.customerSegments.map(segment => ({
      ...segment,
      color: segmentColors[segment.name] || '#6B7280',
      formattedValue: formatCurrency(segment.totalValue),
      formattedCount: formatNumber(segment.customerCount),
      percentageOfTotal: segment.percentageOfTotal || 0
    }));
  }, [data]);

  // Process acquisition trends
  const acquisitionData = useMemo(() => {
    if (!data?.acquisitionTrends) return [];

    return data.acquisitionTrends.map(item => ({
      ...item,
      date: formatDate(item.date, { format: 'short' }),
      formattedNew: formatNumber(item.newCustomers),
      formattedReturning: formatNumber(item.returningCustomers),
      totalCustomers: item.newCustomers + item.returningCustomers
    }));
  }, [data]);

  // Top customers data
  const topCustomers = useMemo(() => {
    if (!data?.topCustomers) return [];

    return data.topCustomers.slice(0, 10).map((customer, index) => ({
      ...customer,
      rank: index + 1,
      formattedValue: formatCurrency(customer.lifetimeValue),
      formattedOrders: formatNumber(customer.totalOrders),
      lastOrderDate: formatDate(customer.lastOrder, { format: 'short' }),
      tier: customer.lifetimeValue > 10000 ? 'VIP' : 
            customer.lifetimeValue > 5000 ? 'Premium' : 'Regular'
    }));
  }, [data]);

  // Retention metrics
  const retentionData = useMemo(() => {
    if (!data?.retentionMetrics) return [];

    return data.retentionMetrics.map(item => ({
      ...item,
      month: `Mes ${item.month}`,
      retentionRate: item.retentionRate * 100,
      churnRate: (1 - item.retentionRate) * 100
    }));
  }, [data]);

  // Customer behavior radar data
  const behaviorData = useMemo(() => {
    if (!data?.behaviorPatterns) return [];

    return [{
      metric: 'Frecuencia de Compra',
      value: data.behaviorPatterns.purchaseFrequency || 0,
      fullMark: 100
    }, {
      metric: 'Valor Promedio',
      value: data.behaviorPatterns.averageOrderValue || 0,
      fullMark: 100
    }, {
      metric: 'Lealtad',
      value: data.behaviorPatterns.loyaltyScore || 0,
      fullMark: 100
    }, {
      metric: 'Satisfacción',
      value: data.behaviorPatterns.satisfactionScore || 0,
      fullMark: 100
    }, {
      metric: 'Engagement',
      value: data.behaviorPatterns.engagementScore || 0,
      fullMark: 100
    }];
  }, [data]);

  // Custom tooltip for charts
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border rounded-lg shadow-md p-3 min-w-[200px]">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">
                {entry.dataKey}
              </span>
            </div>
            <span className="font-medium text-foreground">
              {typeof entry.value === 'number' && entry.value > 1000
                ? formatNumber(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="w-full" style={{ height }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!segmentsData.length && !acquisitionData.length)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Análisis de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de clientes disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Análisis de Clientes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Segmentación, comportamiento y retención de clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Ocultar' : 'Mostrar'} detalles
            </Button>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Mes</SelectItem>
                <SelectItem value="3m">3 Meses</SelectItem>
                <SelectItem value="6m">6 Meses</SelectItem>
                <SelectItem value="1y">1 Año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="segments">Segmentos</TabsTrigger>
            <TabsTrigger value="retention">Retención</TabsTrigger>
            <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{formatNumber(data?.newCustomers || 0)}</p>
                <p className="text-xs text-muted-foreground">Nuevos Clientes</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{formatNumber(data?.returningCustomers || 0)}</p>
                <p className="text-xs text-muted-foreground">Clientes Recurrentes</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{formatPercentage(data?.customerRetentionRate || 0)}</p>
                <p className="text-xs text-muted-foreground">Tasa Retención</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Crown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{formatCurrency(data?.averageCustomerLifetimeValue || 0)}</p>
                <p className="text-xs text-muted-foreground">CLV Promedio</p>
              </div>
            </div>

            {/* Acquisition Trends */}
            <div className="w-full" style={{ height: height - 100 }}>
              <h4 className="text-sm font-medium mb-4">Tendencias de Adquisición</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={acquisitionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value, { compact: true })}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="newCustomers" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="Nuevos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="returningCustomers" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Recurrentes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Segments Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4">Segmentos de Clientes</h4>
                <div className="space-y-3">
                  {segmentsData.map((segment, index) => (
                    <div 
                      key={segment.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSegmentClick?.(segment)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {segment.formattedCount} clientes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{segment.formattedValue}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(segment.percentageOfTotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Customers */}
              <div>
                <h4 className="text-sm font-medium mb-4">Top Clientes</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {topCustomers.map((customer) => (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onCustomerClick?.(customer)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={customer.avatar} />
                          <AvatarFallback>
                            {customer.name?.split(' ').map(n => n[0]).join('') || 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{customer.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: customer.tier === 'VIP' ? '#8B5CF6' : 
                                           customer.tier === 'Premium' ? '#10B981' : '#6B7280',
                                color: customer.tier === 'VIP' ? '#8B5CF6' : 
                                       customer.tier === 'Premium' ? '#10B981' : '#6B7280'
                              }}
                            >
                              {customer.tier}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              #{customer.rank}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{customer.formattedValue}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.formattedOrders} pedidos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention" className="space-y-6">
            <div className="w-full" style={{ height }}>
              <h4 className="text-sm font-medium mb-4">Análisis de Retención</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="retentionRate" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Retención"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="churnRate" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                    name="Abandono"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Retention Insights */}
            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-lg font-bold">{formatPercentage(85)}</p>
                  <p className="text-xs text-muted-foreground">Retención Mes 1</p>
                </div>
                <div className="text-center">
                  <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-lg font-bold">{formatPercentage(65)}</p>
                  <p className="text-xs text-muted-foreground">Retención Mes 6</p>
                </div>
                <div className="text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-lg font-bold">{formatPercentage(45)}</p>
                  <p className="text-xs text-muted-foreground">Retención Mes 12</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Behavior Radar */}
              <div>
                <h4 className="text-sm font-medium mb-4">Patrones de Comportamiento</h4>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={behaviorData}>
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fontSize: 10 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Radar
                        name="Comportamiento"
                        dataKey="value"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Puntuación']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Behavior Metrics */}
              <div>
                <h4 className="text-sm font-medium mb-4">Métricas de Comportamiento</h4>
                <div className="space-y-4">
                  {behaviorData.map((metric, index) => (
                    <div key={metric.metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.metric}</span>
                        <span className="font-medium">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </div>

                {/* Behavior Insights */}
                {showDetails && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Insights de Comportamiento
                    </h5>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>• Los clientes VIP tienen 3x más engagement promedio</p>
                      <p>• La satisfacción correlaciona fuertemente con retención</p>
                      <p>• Frecuencia de compra indica oportunidades de upselling</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

CustomerAnalyticsChart.displayName = 'CustomerAnalyticsChart';

export default CustomerAnalyticsChart;
