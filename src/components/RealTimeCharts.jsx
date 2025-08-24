import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { useMetricsStore } from '../store/useMetricsStore';

const RealTimeCharts = () => {
  const { 
    metrics, 
    getMetricsByCategory,
    getMetricTrend,
    realTimeEnabled,
    setRealTimeEnabled
  } = useMetricsStore();

  const [selectedMetric, setSelectedMetric] = useState('performance.responseTime');
  const [timeWindow, setTimeWindow] = useState(300000); // 5 minutes
  const [chartType, setChartType] = useState('line');
  const [updateInterval, setUpdateInterval] = useState(1000);

  // Auto-refresh when real-time is enabled
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      // Force re-render to update charts with latest data
      setSelectedMetric(prev => prev);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeEnabled, updateInterval]);

  // Prepare real-time data for charts
  const chartData = useMemo(() => {
    const metric = metrics[selectedMetric];
    if (!metric || !metric.history) return [];

    const cutoff = Date.now() - timeWindow;
    return metric.history
      .filter(point => point.timestamp > cutoff)
      .map(point => ({
        time: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value,
        timestamp: point.timestamp
      }))
      .slice(-50); // Limit to last 50 points for performance
  }, [metrics, selectedMetric, timeWindow]);

  // Performance comparison data
  const performanceComparisonData = useMemo(() => {
    const performanceMetrics = getMetricsByCategory('performance');
    const cutoff = Date.now() - timeWindow;
    
    const responseTime = performanceMetrics.responseTime?.history || [];
    const apiTime = performanceMetrics.apiResponseTime?.history || [];

    const timePoints = new Set();
    responseTime.concat(apiTime).forEach(point => {
      if (point.timestamp > cutoff) {
        timePoints.add(Math.floor(point.timestamp / 60000) * 60000); // Round to minute
      }
    });

    return Array.from(timePoints).sort().map(timestamp => {
      const minute = Math.floor(timestamp / 60000) * 60000;
      const responseTimePoints = responseTime.filter(p => 
        Math.floor(p.timestamp / 60000) * 60000 === minute
      );
      const apiTimePoints = apiTime.filter(p => 
        Math.floor(p.timestamp / 60000) * 60000 === minute
      );

      return {
        time: new Date(timestamp).toLocaleTimeString(),
        responseTime: responseTimePoints.length > 0 
          ? responseTimePoints.reduce((sum, p) => sum + p.value, 0) / responseTimePoints.length 
          : null,
        apiTime: apiTimePoints.length > 0 
          ? apiTimePoints.reduce((sum, p) => sum + p.value, 0) / apiTimePoints.length 
          : null,
        timestamp
      };
    }).slice(-20);
  }, [getMetricsByCategory, timeWindow]);

  // Cache metrics data
  const cacheMetricsData = useMemo(() => {
    const cacheMetrics = getMetricsByCategory('cache');
    const cutoff = Date.now() - timeWindow;
    
    const hits = cacheMetrics.hits?.history || [];
    const misses = cacheMetrics.misses?.history || [];

    const timePoints = new Set();
    hits.concat(misses).forEach(point => {
      if (point.timestamp > cutoff) {
        timePoints.add(Math.floor(point.timestamp / 30000) * 30000); // Round to 30 seconds
      }
    });

    return Array.from(timePoints).sort().map(timestamp => {
      const period = Math.floor(timestamp / 30000) * 30000;
      const hitPoints = hits.filter(p => 
        Math.floor(p.timestamp / 30000) * 30000 === period
      );
      const missPoints = misses.filter(p => 
        Math.floor(p.timestamp / 30000) * 30000 === period
      );

      const totalHits = hitPoints.length > 0 ? hitPoints[hitPoints.length - 1].value : 0;
      const totalMisses = missPoints.length > 0 ? missPoints[missPoints.length - 1].value : 0;
      const total = totalHits + totalMisses;

      return {
        time: new Date(timestamp).toLocaleTimeString(),
        hits: totalHits,
        misses: totalMisses,
        hitRatio: total > 0 ? (totalHits / total) * 100 : 0,
        timestamp
      };
    }).slice(-20);
  }, [getMetricsByCategory, timeWindow]);

  // Business metrics trend
  const businessTrendData = useMemo(() => {
    const businessMetrics = getMetricsByCategory('business');
    const cutoff = Date.now() - timeWindow;

    const conversions = businessMetrics.completedPurchases?.history || [];
    const starts = businessMetrics.startedPurchases?.history || [];

    const timePoints = new Set();
    conversions.concat(starts).forEach(point => {
      if (point.timestamp > cutoff) {
        timePoints.add(Math.floor(point.timestamp / 120000) * 120000); // Round to 2 minutes
      }
    });

    return Array.from(timePoints).sort().map(timestamp => {
      const period = Math.floor(timestamp / 120000) * 120000;
      const conversionPoints = conversions.filter(p => 
        Math.floor(p.timestamp / 120000) * 120000 === period
      );
      const startPoints = starts.filter(p => 
        Math.floor(p.timestamp / 120000) * 120000 === period
      );

      const totalConversions = conversionPoints.length > 0 
        ? conversionPoints[conversionPoints.length - 1].value 
        : 0;
      const totalStarts = startPoints.length > 0 
        ? startPoints[startPoints.length - 1].value 
        : 0;

      return {
        time: new Date(timestamp).toLocaleTimeString(),
        conversions: totalConversions,
        starts: totalStarts,
        conversionRate: totalStarts > 0 ? (totalConversions / totalStarts) * 100 : 0,
        timestamp
      };
    }).slice(-15);
  }, [getMetricsByCategory, timeWindow]);

  // Available metrics for selection
  const availableMetrics = useMemo(() => {
    return Object.keys(metrics).map(key => ({
      value: key,
      label: key.replace(/([A-Z])/g, ' $1').replace('.', ' - ').trim()
    }));
  }, [metrics]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles para mostrar
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" type="number" 
                   tickFormatter={timestamp => new Date(timestamp).toLocaleTimeString()} />
            <YAxis dataKey="value" />
            <Tooltip labelFormatter={timestamp => new Date(timestamp).toLocaleTimeString()} />
            <Scatter dataKey="value" fill="#3B82F6" />
          </ScatterChart>
        );
      
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Métrica
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableMetrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ventana de tiempo
              </label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={60000}>1 minuto</option>
                <option value={300000}>5 minutos</option>
                <option value={900000}>15 minutos</option>
                <option value={3600000}>1 hora</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de gráfico
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="line">Línea</option>
                <option value="area">Área</option>
                <option value="bar">Barras</option>
                <option value="scatter">Dispersión</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Tiempo real</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actualización (ms)
              </label>
              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={500}>500ms</option>
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedMetric.replace(/([A-Z])/g, ' $1').replace('.', ' - ').trim()}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-metric Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparación de Rendimiento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3B82F6" 
                  name="Tiempo de Respuesta"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="apiTime" 
                  stroke="#10B981" 
                  name="Tiempo API"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas de Cache
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cacheMetricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="hits" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981"
                  name="Cache Hits"
                />
                <Area 
                  type="monotone" 
                  dataKey="misses" 
                  stackId="1"
                  stroke="#EF4444" 
                  fill="#EF4444"
                  name="Cache Misses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendencias de Negocio
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={businessTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="conversions" 
                  fill="#8B5CF6"
                  name="Conversiones"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#F59E0B"
                  name="Tasa de Conversión (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado en Tiempo Real
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Estado del sistema</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-green-600 font-medium">Operativo</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Puntos de datos</span>
              <span className="text-gray-900 font-medium">{chartData.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Última actualización</span>
              <span className="text-gray-900 font-medium">
                {chartData.length > 0 ? chartData[chartData.length - 1].time : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Valor actual</span>
              <span className="text-gray-900 font-medium">
                {chartData.length > 0 ? chartData[chartData.length - 1].value.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeCharts;
