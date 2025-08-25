/**
 * Sales Trends Chart Component
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Interactive chart displaying sales trends over time with
 * multiple metrics, comparison modes, and responsive design.
 */

import React, { memo, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const SalesTrendsChart = memo(({
  data,
  loading = false,
  timeRange = '30d',
  detailed = false,
  className = "",
  height = 400
}) => {
  
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showComparison, setShowComparison] = useState(false);

  // Chart color themes
  const colorTheme = {
    revenue: {
      primary: '#10B981',
      secondary: '#34D399',
      area: '#10B981',
      gradient: 'url(#revenueGradient)'
    },
    sales: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      area: '#3B82F6',
      gradient: 'url(#salesGradient)'
    },
    customers: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      area: '#8B5CF6',
      gradient: 'url(#customersGradient)'
    },
    aov: {
      primary: '#F59E0B',
      secondary: '#FBBF24',
      area: '#F59E0B',
      gradient: 'url(#aovGradient)'
    }
  };

  // Process and format chart data
  const chartData = useMemo(() => {
    if (!data || !data[timeRange === 'daily' ? 'daily' : timeRange === 'weekly' ? 'weekly' : 'monthly']) {
      return [];
    }

    const timeData = data[timeRange === 'daily' ? 'daily' : timeRange === 'weekly' ? 'weekly' : 'monthly'];
    
    return timeData.map(item => ({
      ...item,
      date: formatDate(item.date),
      formattedRevenue: formatCurrency(item.revenue),
      formattedSales: formatNumber(item.sales),
      formattedCustomers: formatNumber(item.customers),
      formattedAov: formatCurrency(item.aov)
    }));
  }, [data, timeRange]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
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
              {entry.dataKey === 'revenue' || entry.dataKey === 'aov' 
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Chart type configurations
  const chartConfigs = {
    line: {
      component: LineChart,
      elements: (colors) => (
        <>
          <Line
            type="monotone"
            dataKey={selectedMetric}
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: colors.primary }}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey={`${selectedMetric}Previous`}
              stroke={colors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </>
      )
    },
    area: {
      component: AreaChart,
      elements: (colors) => (
        <>
          <defs>
            <linearGradient id={`${selectedMetric}Gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke={colors.primary}
            fillOpacity={1}
            fill={colors.gradient}
            strokeWidth={2}
          />
        </>
      )
    },
    bar: {
      component: BarChart,
      elements: (colors) => (
        <Bar
          dataKey={selectedMetric}
          fill={colors.primary}
          radius={[2, 2, 0, 0]}
        />
      )
    }
  };

  const ChartComponent = chartConfigs[chartType].component;
  const colors = colorTheme[selectedMetric];

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Tendencias de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles para el período seleccionado</p>
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
              <TrendingUp className="w-5 h-5" />
              Tendencias de Ventas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis de rendimiento en el tiempo
            </p>
          </div>

          {detailed && (
            <div className="flex items-center gap-2">
              {/* Metric Selector */}
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Ingresos</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="customers">Clientes</SelectItem>
                  <SelectItem value="aov">Valor Promedio</SelectItem>
                </SelectContent>
              </Select>

              {/* Chart Type Selector */}
              <div className="flex rounded-md border">
                <Button
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="rounded-r-none"
                >
                  <Activity className="w-4 h-4" />
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className="rounded-none border-x"
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className="rounded-l-none"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {timeRange === '7d' ? 'Últimos 7 días' :
               timeRange === '30d' ? 'Últimos 30 días' :
               timeRange === '90d' ? 'Últimos 90 días' : 'Período personalizado'}
            </Badge>
            
            {detailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs"
              >
                {showComparison ? 'Ocultar' : 'Mostrar'} comparación
              </Button>
            )}
          </div>

          {/* Current metric value */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-lg font-semibold" style={{ color: colors.primary }}>
              {chartData.length > 0 ? (
                selectedMetric === 'revenue' || selectedMetric === 'aov' 
                  ? formatCurrency(chartData[chartData.length - 1][selectedMetric])
                  : formatNumber(chartData[chartData.length - 1][selectedMetric])
              ) : '-'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                tickFormatter={(value) => 
                  selectedMetric === 'revenue' || selectedMetric === 'aov' 
                    ? formatCurrency(value, { compact: true })
                    : formatNumber(value, { compact: true })
                }
              />
              <Tooltip content={<CustomTooltip />} />
              {detailed && <Legend />}
              
              {chartConfigs[chartType].elements(colors)}
              
              {/* Average line */}
              {detailed && chartData.length > 0 && (
                <ReferenceLine 
                  y={chartData.reduce((sum, item) => sum + item[selectedMetric], 0) / chartData.length}
                  stroke={colors.secondary}
                  strokeDasharray="2 2"
                  label={{ value: "Promedio", position: "topRight" }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Chart Statistics */}
        {detailed && chartData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="font-semibold text-green-600">
                {selectedMetric === 'revenue' || selectedMetric === 'aov'
                  ? formatCurrency(Math.max(...chartData.map(d => d[selectedMetric])))
                  : formatNumber(Math.max(...chartData.map(d => d[selectedMetric])))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Mínimo</p>
              <p className="font-semibold text-red-600">
                {selectedMetric === 'revenue' || selectedMetric === 'aov'
                  ? formatCurrency(Math.min(...chartData.map(d => d[selectedMetric])))
                  : formatNumber(Math.min(...chartData.map(d => d[selectedMetric])))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Promedio</p>
              <p className="font-semibold text-blue-600">
                {selectedMetric === 'revenue' || selectedMetric === 'aov'
                  ? formatCurrency(chartData.reduce((sum, item) => sum + item[selectedMetric], 0) / chartData.length)
                  : formatNumber(chartData.reduce((sum, item) => sum + item[selectedMetric], 0) / chartData.length)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Tendencia</p>
              <p className={cn(
                "font-semibold flex items-center justify-center gap-1",
                chartData[chartData.length - 1][selectedMetric] > chartData[0][selectedMetric] 
                  ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  chartData[chartData.length - 1][selectedMetric] < chartData[0][selectedMetric] && "rotate-180"
                )} />
                {chartData[chartData.length - 1][selectedMetric] > chartData[0][selectedMetric] ? 'Creciendo' : 'Decreciendo'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SalesTrendsChart.displayName = 'SalesTrendsChart';

export default SalesTrendsChart;
