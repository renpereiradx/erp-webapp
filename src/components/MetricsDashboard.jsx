import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { useMetricsStore } from '../store/useMetricsStore';

const MetricsDashboard = () => {
  const {
    metrics,
    realTimeEnabled,
    setRealTimeEnabled,
    getHealthScore,
    getMetricsByCategory,
    getMetricTrend,
    alerts,
    dismissAlert,
    exportMetrics,
    lastUpdate
  } = useMetricsStore();

  const [selectedTimeRange, setSelectedTimeRange] = useState('5m');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const healthScore = getHealthScore();

  // Time range options
  const timeRangeOptions = [
    { value: '1m', label: '1 Minuto', ms: 60000 },
    { value: '5m', label: '5 Minutos', ms: 300000 },
    { value: '15m', label: '15 Minutos', ms: 900000 },
    { value: '1h', label: '1 Hora', ms: 3600000 },
    { value: '6h', label: '6 Horas', ms: 21600000 },
    { value: '24h', label: '24 Horas', ms: 86400000 }
  ];

  const selectedTimeRangeMs = timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.ms || 300000;

  // Categorize metrics
  const categorizedMetrics = useMemo(() => {
    return {
      performance: getMetricsByCategory('performance'),
      cache: getMetricsByCategory('cache'),
      circuit: getMetricsByCategory('circuit'),
      business: getMetricsByCategory('business'),
      system: getMetricsByCategory('system')
    };
  }, [metrics, getMetricsByCategory]);

  // Prepare chart data
  const performanceChartData = useMemo(() => {
    const responseTimeMetric = categorizedMetrics.performance.responseTime;
    if (!responseTimeMetric?.history) return [];

    const cutoff = Date.now() - selectedTimeRangeMs;
    return responseTimeMetric.history
      .filter(point => point.timestamp > cutoff)
      .map(point => ({
        time: new Date(point.timestamp).toLocaleTimeString(),
        responseTime: point.value,
        timestamp: point.timestamp
      }));
  }, [categorizedMetrics.performance, selectedTimeRangeMs]);

  const cacheEfficiencyData = useMemo(() => {
    const cache = categorizedMetrics.cache;
    return [
      {
        name: 'Cache Hits',
        value: cache.hits?.current || 0,
        color: '#10B981'
      },
      {
        name: 'Cache Misses',
        value: cache.misses?.current || 0,
        color: '#EF4444'
      }
    ];
  }, [categorizedMetrics.cache]);

  const businessMetricsData = useMemo(() => {
    const business = categorizedMetrics.business;
    return [
      {
        name: 'Conversión',
        value: business.conversionRate?.current || 0,
        target: 85,
        color: '#8B5CF6'
      },
      {
        name: 'Satisfacción',
        value: business.customerSatisfaction?.current || 0,
        target: 90,
        color: '#06B6D4'
      }
    ];
  }, [categorizedMetrics.business]);

  const systemHealthData = useMemo(() => {
    return [
      {
        name: 'Salud del Sistema',
        value: healthScore,
        fill: healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444'
      }
    ];
  }, [healthScore]);

  // Health score color
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Metric trend indicators
  const getTrendIcon = (category, name) => {
    const trend = getMetricTrend(category, name, selectedTimeRangeMs);
    if (!trend) return null;

    if (trend.direction === 'up') {
      return <span className="text-green-500 text-sm">↗ +{trend.percentChange.toFixed(1)}%</span>;
    }
    if (trend.direction === 'down') {
      return <span className="text-red-500 text-sm">↘ {trend.percentChange.toFixed(1)}%</span>;
    }
    return <span className="text-gray-500 text-sm">→ Sin cambios</span>;
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger a re-render to update charts with latest data
      setSelectedTimeRange(prev => prev);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Métricas</h1>
            <p className="text-gray-600">Monitoreo en tiempo real del sistema ERP</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-actualizar</span>
            </label>

            {/* Real-time Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Tiempo real</span>
            </label>

            {/* Export Button */}
            <button
              onClick={exportMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Última actualización: {new Date(lastUpdate).toLocaleString()}
          </p>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas Activas</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-md border-l-4 ${
                  alert.type === 'critical' 
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm opacity-75">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salud del Sistema</p>
              <p className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
                {healthScore}%
              </p>
            </div>
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={systemHealthData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill={systemHealthData[0]?.fill} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo de Respuesta</p>
              <p className="text-3xl font-bold text-gray-900">
                {categorizedMetrics.performance.responseTime?.current?.toFixed(0) || 0}ms
              </p>
              {getTrendIcon('performance', 'responseTime')}
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cache Hit Ratio */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ratio de Cache</p>
              <p className="text-3xl font-bold text-gray-900">
                {categorizedMetrics.cache.hitRatio?.current?.toFixed(1) || 0}%
              </p>
              {getTrendIcon('cache', 'hitRatio')}
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
              <p className="text-3xl font-bold text-gray-900">
                {categorizedMetrics.business.conversionRate?.current?.toFixed(1) || 0}%
              </p>
              {getTrendIcon('business', 'conversionRate')}
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempo de Respuesta</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Hora: ${value}`}
                  formatter={(value) => [`${value}ms`, 'Tiempo de Respuesta']}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Efficiency */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eficiencia de Cache</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cacheEfficiencyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cacheEfficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Negocio</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessMetricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Valor Actual']} />
                <Bar dataKey="value" fill="#8B5CF6" />
                <Bar dataKey="target" fill="#E5E7EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circuit Breaker Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Circuit Breakers</h3>
          <div className="space-y-4">
            {Object.entries(categorizedMetrics.circuit).map(([key, metric]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">
                    {typeof metric.current === 'number' ? metric.current.toFixed(1) : metric.current}
                  </span>
                  {getTrendIcon('circuit', key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Detalladas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Métrica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(categorizedMetrics).map(([category, categoryMetrics]) =>
                Object.entries(categoryMetrics).map(([metricName, metric]) => (
                  <tr key={`${category}-${metricName}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {metricName.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {typeof metric.current === 'number' ? metric.current.toFixed(2) : metric.current}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.stats?.avg?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.stats ? `${metric.stats.min.toFixed(2)} / ${metric.stats.max.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getTrendIcon(category, metricName)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
