import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  CreditCard,
  Target,
  Clock,
  MapPin,
  Eye,
  MousePointer,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useMonitoringStore } from '../../store/useMonitoringStore';
import { useSalesStore } from '../../store/useSalesStore';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const BusinessMetricsPanel = () => {
  const { 
    businessMetrics, 
    performanceData, 
    alertsData,
    refreshBusinessMetrics 
  } = useMonitoringStore();
  const { sales } = useSalesStore();

  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('conversion');
  const [heatmapView, setHeatmapView] = useState('hourly');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Datos simulados para demostración (en producción vendrían del backend)
  const conversionFunnelData = useMemo(() => [
    { name: 'Visitantes', value: 10000, percentage: 100, color: '#8884d8' },
    { name: 'Ver Productos', value: 7500, percentage: 75, color: '#82ca9d' },
    { name: 'Agregar al Carrito', value: 3200, percentage: 32, color: '#ffc658' },
    { name: 'Iniciar Compra', value: 1800, percentage: 18, color: '#ff7c7c' },
    { name: 'Completar Pago', value: 1260, percentage: 12.6, color: '#8dd1e1' }
  ], []);

  const userJourneyHeatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    return days.map(day => ({
      day,
      data: hours.map(hour => ({
        hour,
        interactions: Math.floor(Math.random() * 100) + 10,
        conversions: Math.floor(Math.random() * 20) + 1,
        averageTime: Math.floor(Math.random() * 300) + 60
      }))
    }));
  }, [heatmapView]);

  const salesPerformanceData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'dd/MM', { locale: es }),
        ventas: Math.floor(Math.random() * 150) + 50,
        conversion: (Math.random() * 5 + 10).toFixed(1),
        ingresos: Math.floor(Math.random() * 50000) + 20000,
        visitors: Math.floor(Math.random() * 1000) + 500,
        bounceRate: (Math.random() * 30 + 20).toFixed(1)
      };
    });
    return last30Days;
  }, [selectedTimeRange]);

  const paymentMethodAnalytics = useMemo(() => [
    { method: 'Tarjeta Crédito', transactions: 456, success: 98.2, average: 245.50, color: '#0088FE' },
    { method: 'Tarjeta Débito', transactions: 312, success: 99.1, average: 178.30, color: '#00C49F' },
    { method: 'Transferencia', transactions: 189, success: 95.8, average: 520.75, color: '#FFBB28' },
    { method: 'Efectivo', transactions: 98, success: 100, average: 89.25, color: '#FF8042' },
    { method: 'PayPal', transactions: 67, success: 97.5, average: 156.80, color: '#8884d8' }
  ], []);

  const kpiMetrics = useMemo(() => {
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((acc, sale) => acc + sale.total, 0) || 0;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    return [
      {
        title: 'Ventas Totales',
        value: totalSales.toLocaleString(),
        change: '+12.5%',
        trend: 'up',
        icon: ShoppingCart,
        color: 'text-blue-600'
      },
      {
        title: 'Ingresos',
        value: `$${totalRevenue.toLocaleString()}`,
        change: '+8.3%',
        trend: 'up',
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        title: 'Valor Promedio',
        value: `$${avgOrderValue.toFixed(2)}`,
        change: '-2.1%',
        trend: 'down',
        icon: Target,
        color: 'text-orange-600'
      },
      {
        title: 'Tasa Conversión',
        value: '12.6%',
        change: '+3.7%',
        trend: 'up',
        icon: TrendingUp,
        color: 'text-purple-600'
      }
    ];
  }, [sales]);

  const customerSegmentData = useMemo(() => [
    { segment: 'Nuevos', count: 234, revenue: 45000, avgOrder: 192.31, color: '#8884d8' },
    { segment: 'Recurrentes', count: 189, revenue: 78000, avgOrder: 412.70, color: '#82ca9d' },
    { segment: 'VIP', count: 45, revenue: 95000, avgOrder: 2111.11, color: '#ffc658' },
    { segment: 'Inactivos', count: 67, revenue: 12000, avgOrder: 179.10, color: '#ff7c7c' }
  ], []);

  const handleRefresh = () => {
    refreshBusinessMetrics();
    setLastRefresh(new Date());
  };

  const HeatmapCell = ({ x, y, value, width, height }) => {
    const intensity = Math.min(value / 100, 1);
    const opacity = 0.1 + intensity * 0.9;
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#3b82f6"
        fillOpacity={opacity}
        stroke="#e5e7eb"
        strokeWidth={0.5}
      />
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value}%`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshBusinessMetrics();
    }, 30000); // Refresh cada 30 segundos

    return () => clearInterval(interval);
  }, [refreshBusinessMetrics]);

  return (
    <div className="space-y-6 p-6">
      {/* Header con controles */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Métricas de Negocio
          </h2>
          <p className="text-gray-600">
            Análisis profundo del rendimiento empresarial y optimización de conversiones
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${kpi.color}`} />
                  <div className={`flex items-center gap-1 text-sm ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="h-4 w-4" />
                    {kpi.change}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="conversion" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conversion">Conversión</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Maps</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="optimization">Optimización</TabsTrigger>
        </TabsList>

        {/* Panel de Conversión */}
        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel de Conversión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Embudo de Conversión
                </CardTitle>
                <CardDescription>
                  Análisis del flujo de usuarios desde visita hasta compra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={conversionFunnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString()} usuarios (${conversionFunnelData.find(d => d.value === value)?.percentage}%)`,
                        name
                      ]}
                    />
                    <Bar dataKey="value" fill="#8884d8">
                      <LabelList dataKey="percentage" position="top" formatter={(value) => `${value}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Métodos de Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Análisis de Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Distribución y éxito por método de pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={paymentMethodAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'transactions' ? `${value} transacciones` :
                        name === 'success' ? `${value}% éxito` :
                        formatCurrency(value),
                        name === 'transactions' ? 'Transacciones' :
                        name === 'success' ? 'Tasa Éxito' : 'Valor Promedio'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="transactions" />
                    <Line yAxisId="right" type="monotone" dataKey="success" stroke="#ff7300" name="success" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tendencias de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tendencias de Ventas y Conversión
              </CardTitle>
              <CardDescription>
                Evolución temporal del rendimiento de ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={salesPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'ventas' ? `${value} ventas` :
                      name === 'visitors' ? `${value} visitantes` :
                      name === 'ingresos' ? formatCurrency(value) :
                      `${value}%`,
                      name === 'ventas' ? 'Ventas' :
                      name === 'visitors' ? 'Visitantes' :
                      name === 'ingresos' ? 'Ingresos' :
                      name === 'conversion' ? 'Conversión' : 'Bounce Rate'
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="visitors" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Bar yAxisId="left" dataKey="ventas" fill="#82ca9d" />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#ff7300" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Panel de Heat Maps */}
        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de Calor - User Journey
              </CardTitle>
              <CardDescription>
                Análisis de interacciones por horario y día de la semana
              </CardDescription>
              <div className="flex gap-2">
                <select
                  value={heatmapView}
                  onChange={(e) => setHeatmapView(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="hourly">Vista por Hora</option>
                  <option value="daily">Vista por Día</option>
                  <option value="weekly">Vista por Semana</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Interacciones */}
                  <div>
                    <h4 className="font-medium mb-2">Interacciones por Hora</h4>
                    <div className="grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} className="space-y-1">
                          {userJourneyHeatmapData.map((day, dayIndex) => {
                            const hourData = day.data[hour];
                            const intensity = hourData.interactions / 100;
                            return (
                              <div
                                key={`${dayIndex}-${hour}`}
                                className="w-4 h-4 rounded-sm"
                                style={{
                                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                                }}
                                title={`${day.day} ${hour}:00 - ${hourData.interactions} interacciones`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>23:00</span>
                    </div>
                  </div>

                  {/* Conversiones */}
                  <div>
                    <h4 className="font-medium mb-2">Conversiones por Hora</h4>
                    <div className="grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} className="space-y-1">
                          {userJourneyHeatmapData.map((day, dayIndex) => {
                            const hourData = day.data[hour];
                            const intensity = hourData.conversions / 20;
                            return (
                              <div
                                key={`${dayIndex}-${hour}`}
                                className="w-4 h-4 rounded-sm"
                                style={{
                                  backgroundColor: `rgba(34, 197, 94, ${0.1 + intensity * 0.9})`
                                }}
                                title={`${day.day} ${hour}:00 - ${hourData.conversions} conversiones`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>23:00</span>
                    </div>
                  </div>

                  {/* Tiempo Promedio */}
                  <div>
                    <h4 className="font-medium mb-2">Tiempo Promedio (seg)</h4>
                    <div className="grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div key={hour} className="space-y-1">
                          {userJourneyHeatmapData.map((day, dayIndex) => {
                            const hourData = day.data[hour];
                            const intensity = hourData.averageTime / 360;
                            return (
                              <div
                                key={`${dayIndex}-${hour}`}
                                className="w-4 h-4 rounded-sm"
                                style={{
                                  backgroundColor: `rgba(245, 158, 11, ${0.1 + intensity * 0.9})`
                                }}
                                title={`${day.day} ${hour}:00 - ${hourData.averageTime}s promedio`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>23:00</span>
                    </div>
                  </div>
                </div>

                {/* Leyenda de días */}
                <div className="flex justify-center">
                  <div className="flex gap-2 text-sm text-gray-600">
                    {userJourneyHeatmapData.map((day, index) => (
                      <span key={index}>{day.day}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Panel de Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Indicadores de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">First Contentful Paint</span>
                    <span className="text-green-600 font-bold">1.2s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">Largest Contentful Paint</span>
                    <span className="text-yellow-600 font-bold">2.1s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Cumulative Layout Shift</span>
                    <span className="text-green-600 font-bold">0.05</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">First Input Delay</span>
                    <span className="text-green-600 font-bold">45ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tiempos de Respuesta API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={salesPerformanceData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Panel de Segmentos */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentación de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ segment, percentage }) => `${segment} (${percentage}%)`}
                    >
                      {customerSegmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valor por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerSegmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="avgOrder" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Panel de Optimización */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Oportunidades de Mejora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <p className="font-medium text-yellow-800">Carrito Abandonado</p>
                    <p className="text-sm text-yellow-600">23% de carritos abandonados en checkout</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <p className="font-medium text-red-800">Tiempo de Carga</p>
                    <p className="text-sm text-red-600">Página de productos lenta en móviles</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="font-medium text-blue-800">Conversión Móvil</p>
                    <p className="text-sm text-blue-600">15% menor que escritorio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Acciones Recomendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Implementar recordatorios de carrito</p>
                      <p className="text-sm text-gray-600">Email después de 1h de abandono</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Optimizar imágenes de productos</p>
                      <p className="text-sm text-gray-600">Reducir tiempo de carga 40%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Simplificar checkout móvil</p>
                      <p className="text-sm text-gray-600">Reducir pasos de 4 a 2</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Impacto Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Conversión Esperada</span>
                      <span className="text-sm font-medium">+2.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Ingresos Adicionales</span>
                      <span className="text-sm font-medium">$45,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">ROI Proyectado</span>
                      <span className="text-sm font-medium">315%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer con información de actualización */}
      <div className="text-center text-sm text-gray-500 mt-8">
        Última actualización: {format(lastRefresh, 'dd/MM/yyyy HH:mm:ss', { locale: es })}
      </div>
    </div>
  );
};

export default BusinessMetricsPanel;
