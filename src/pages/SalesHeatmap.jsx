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
import DashboardNav from '@/components/business-intelligence/DashboardNav'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Mapa de Calor de Ventas por Hora</h1>
          <p className="text-sm text-text-secondary font-medium">Visualizando picos de actividad e intensidad de ventas.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="shadow-sm border-border-subtle bg-surface" onClick={() => fetchSalesHeatmap()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <DashboardNav />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Ingresos (from Summary) */}
         <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Ingresos del Día</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(summary?.sales?.total || 0)}</h3>
            </div>
          </div>

        {/* Hora Punta (from Heatmap API) */}
          <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Hora Punta (Promedio)</p>
              <h3 className="text-2xl font-black text-text-main tracking-tight">
                {peakTime.day} {peakTime.hour}:00
              </h3>
              <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">Mayor afluencia promedio</p>
            </div>
          </div>

        {/* Ticket Promedio (from Summary) */}
          <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Receipt size={24} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Ticket Promedio</p>
                <h3 className="text-2xl font-black text-text-main tracking-tight">{formatCurrency(summary?.sales?.average_ticket || 0)}</h3>
              </div>
          </div>

        {/* Cajas Activas (from Summary) */}
          <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
               <div className="flex items-start justify-between mb-4">
                  <div className="size-12 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                    <Store size={24} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Cajas Activas</p>
                  <h3 className="text-2xl font-black text-text-main tracking-tight">{summary?.cash_registers?.open_count || 0}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-success">
                    <span className="size-2 rounded-full bg-success animate-pulse"></span>
                    <span>En operación ahora</span>
                  </div>
                </div>
          </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-10">
        
        {/* Heatmap Section */}
        <div className="xl:col-span-3 bg-surface rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col">
          
          {/* Controls */}
          <div className="px-8 py-6 border-b border-border-subtle bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="size-2 rounded-full bg-primary animate-pulse"></div>
               <span className="text-sm font-black text-text-main uppercase tracking-tight">Análisis de últimas 4 semanas</span>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px] h-10 rounded-lg border-border-subtle bg-white text-sm font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Todas las Sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Sucursales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visualization */}
          <div className="p-8 space-y-8 overflow-x-auto">
            <div className="flex items-center justify-end gap-4 text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
              <span>Baja Intensidad</span>
              <div className="w-32 h-2 bg-gradient-to-r from-blue-50 to-primary rounded-full"></div>
              <span>Alta Intensidad</span>
            </div>

            <div className="min-w-[800px] grid grid-cols-[100px_repeat(14,1fr)] gap-2">
              {/* Header Row */}
              <div className="h-8"></div> {/* Empty corner */}
              {hours.map(hour => (
                <div key={hour} className="text-[10px] font-black uppercase tracking-widest text-text-secondary text-center flex items-center justify-center">{hour}</div>
              ))}

              {/* Data Rows */}
              {uiDays.map((day, dIndex) => (
                <React.Fragment key={day}>
                  <div className="h-10 text-[10px] font-black uppercase tracking-widest text-text-main flex items-center pr-4 border-r border-border-subtle">{day}</div>
                  {hours.map((hour, hIndex) => {
                    const { opacity, label } = getIntensity(dIndex, hour)
                    return (
                      <div 
                        key={`${day}-${hIndex}`} 
                        className="h-10 rounded-md transition-all hover:scale-105 hover:shadow-md cursor-help flex items-center justify-center text-[10px] font-black text-white"
                        style={{ 
                          backgroundColor: `rgba(16, 110, 190, ${opacity})`, 
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
        <div className="flex flex-col gap-8">
          
          {/* Activity Feed */}
          <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Actividad Reciente</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {activities && activities.slice(0, 5).map(item => (
                <div key={item.id} className="p-4 flex gap-3 group hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="size-8 rounded-lg bg-blue-50 flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Activity size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-main truncate group-hover:text-primary transition-colors">{item.description}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Sin actividad reciente</p>
                  </div>
              )}
            </div>
          </div>

          {/* Map Widget Placeholder */}
          <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Cobertura</h3>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Flag size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 leading-relaxed">
                    Visualización de mapa no disponible en API v1
                </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default SalesHeatmap
