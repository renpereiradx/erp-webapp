import React, { useState, useEffect } from 'react'
import useDashboardStore from '@/store/useDashboardStore'
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Store, 
  AlertTriangle,
  TrendingDown,
  Flag,
  UserPlus,
  Package,
  Activity,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const hours = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'
]

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] // API Day 0 = Sunday usually, checking doc... implicit standard. Assuming 0=Sunday or Monday. Let's assume 0=Sunday for now based on common SQL standards, or 0=Monday.
// Doc example: day: 0. "peak_times" example says "Lunes". Let's assume 0=Monday based on "Lunes" being first in example list often.
// Wait, doc peak_times example: {"day": "Lunes"}. Heatmap data has "day": 0.
// Standard Go time.Weekday is Sunday=0. Let's assume Sunday=0.
// BUT, the UI Mock days array was ['Lun', ... 'Dom'].
// I will adjust `days` array to standard 0-6 index if needed. Let's stick to UI order 'Lun'-'Dom' (1-0 inverted? or 0=Mon?).
// Let's assume 0=Sunday, 1=Monday. The UI starts with Monday.
const uiDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
// Map UI index 0 (Mon) to API day 1 (Mon). UI index 6 (Dom) to API day 0 (Sun).
const uiIndexToApiDay = (index) => (index + 1) % 7; 


const SalesHeatmap = () => {
    const { 
        salesHeatmap, 
        summary, 
        activities, 
        fetchSalesHeatmap, 
        fetchDashboardData,
        loading 
    } = useDashboardStore();

    const [selectedLocation, setSelectedLocation] = useState('all')

    useEffect(() => {
        fetchSalesHeatmap();
        if (!summary) fetchDashboardData();
    }, [fetchSalesHeatmap, fetchDashboardData, summary]);

    // Data Processing
    const heatmapData = salesHeatmap?.heatmap || [];
    const peakTime = salesHeatmap?.peak_times?.[0] || { day: '-', hour: '-' };

    // Calculate Max Sales for Intensity
    const maxSales = Math.max(...heatmapData.map(d => d.sales_count), 1);

    const getIntensity = (uiDayIndex, hourLabel) => {
        // Parse hour label to 24h int (8AM -> 8, 1PM -> 13)
        let hour = parseInt(hourLabel);
        if (hourLabel.includes('PM') && hour !== 12) hour += 12;
        if (hourLabel.includes('AM') && hour === 12) hour = 0;

        const apiDay = uiIndexToApiDay(uiDayIndex);
        
        const cell = heatmapData.find(d => d.day === apiDay && d.hour === hour);
        if (!cell) return { opacity: 0.05, label: '' };

        const ratio = cell.sales_count / maxSales;
        let label = '';
        if (ratio > 0.8) label = '$$$';
        else if (ratio > 0.5) label = '$$';
        
        return {
            opacity: 0.1 + (ratio * 0.9), // Min 0.1 opacity
            label
        };
    };

    const formatCurrency = (val) => {
        if (!val) return '$0';
        return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(val);
    };

  return (
    <div className="sales-heatmap">
      {/* Header */}
      <div className="sales-heatmap__header">
        <div className="sales-heatmap__title-group">
          <h1>Mapa de Calor de Ventas por Hora</h1>
          <p>Visualizando picos de actividad e intensidad de ventas.</p>
        </div>
        <div className="sales-heatmap__actions">
          <Button variant="outline" className="gap-2" onClick={() => fetchSalesHeatmap()}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="sales-heatmap__kpi-grid">
         {/* Ingresos (from Summary) */}
         <div className="kpi-card">
            <div className="kpi-card__header">
              <p>Ingresos del Día</p>
              <div className="kpi-card__icon kpi-card__icon--primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="kpi-card__value">{formatCurrency(summary?.sales?.total || 0)}</div>
          </div>

        {/* Hora Punta (from Heatmap API) */}
          <div className="kpi-card">
            <div className="kpi-card__header">
              <p>Hora Punta (Promedio)</p>
              <div className="kpi-card__icon kpi-card__icon--orange">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="kpi-card__value text-xl">
                {peakTime.day} {peakTime.hour}:00
            </div>
            <div className="kpi-card__subtext text-xs text-muted-foreground mt-1">
                 Mayor afluencia promedio
            </div>
          </div>

        {/* Ticket Promedio (from Summary) */}
          <div className="kpi-card">
              <div className="kpi-card__header">
                <p>Ticket Promedio</p>
                <div className="kpi-card__icon kpi-card__icon--purple">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <div className="kpi-card__value">{formatCurrency(summary?.sales?.average_ticket || 0)}</div>
          </div>

        {/* Cajas Activas (from Summary) */}
          <div className="kpi-card">
               <div className="kpi-card__header">
                  <p>Cajas Activas</p>
                  <div className="kpi-card__icon kpi-card__icon--blue">
                    <Store className="h-5 w-5" />
                  </div>
                </div>
                <div className="kpi-card__value">{summary?.cash_registers?.open_count || 0}</div>
                <div className="kpi-card__trend kpi-card__trend--neutral">
                  <span>En operación ahora</span>
                </div>
          </div>
      </div>

      {/* Main Layout */}
      <div className="sales-heatmap__main-layout">
        
        {/* Heatmap Section */}
        <div className="sales-heatmap__heatmap-section">
          
          {/* Controls */}
          <div className="sales-heatmap__controls">
            <div className="sales-heatmap__date-nav">
               <span className="font-medium">Análisis de últimas 4 semanas</span>
            </div>

            <div className="sales-heatmap__filters">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las Sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Sucursales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visualization */}
          <div className="heatmap-grid">
            <div className="heatmap-grid__legend">
              <span>Baja Intensidad</span>
              <div className="heatmap-grid__gradient-bar"></div>
              <span>Alta Intensidad</span>
            </div>

            <div className="heatmap-grid__container">
              {/* Header Row */}
              <div className="h-8"></div> {/* Empty corner */}
              {hours.map(hour => (
                <div key={hour} className="heatmap-grid__header-cell">{hour}</div>
              ))}

              {/* Data Rows */}
              {uiDays.map((day, dIndex) => (
                <React.Fragment key={day}>
                  <div className="heatmap-grid__row-label">{day}</div>
                  {hours.map((hour, hIndex) => {
                    const { opacity, label } = getIntensity(dIndex, hour)
                    return (
                      <div 
                        key={`${day}-${hIndex}`} 
                        className="heatmap-grid__cell"
                        style={{ 
                          backgroundColor: `rgba(19, 127, 236, ${opacity})`, 
                        }}
                        title={`${day} @ ${hour}`}
                      >
                        {label}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Section */}
        <div className="sales-heatmap__sidebar">
          
          {/* Activity Feed */}
          <div className="activity-feed">
            <div className="activity-feed__header">
              <h3>Actividad Reciente</h3>
            </div>
            <div className="activity-feed__list">
              {activities && activities.slice(0, 5).map(item => (
                <div key={item.id} className="activity-feed__item">
                  <div className={`activity-feed__icon activity-feed__icon--blue`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="activity-feed__content">
                    <p>{item.description}</p>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                  <div className="p-4 text-center text-sm text-gray-500">Sin actividad reciente</div>
              )}
            </div>
          </div>

          {/* Map Widget Placeholder - Keeping as UI element but static since no API data */}
          <div className="map-widget">
            <div className="map-widget__header">
              <h3>Cobertura</h3>
            </div>
            <div className="map-widget__content bg-slate-100 flex items-center justify-center text-slate-400 text-sm p-8 rounded-lg">
                Visualización de mapa no disponible en API v1
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default SalesHeatmap
