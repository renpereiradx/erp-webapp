import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Zap, 
  Package, 
  Calendar, 
  RefreshCcw, 
  Info,
  Banknote
} from 'lucide-react';
import salesAnalyticsService from '@/services/salesAnalyticsService';
import { MOCK_VELOCITY } from '@/services/mocks/salesAnalyticsMock';

const TrendsVelocity = () => {
  const [velocityData, setVelocityData] = useState(MOCK_VELOCITY.data);
  const [heatmapData, setHeatmapData] = useState(null);
  const [trendsData, setTrendsData] = useState({ daily: [], hourly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [velRes, heatRes, dailyTrends, hourlyTrends] = await Promise.all([
          salesAnalyticsService.getVelocity({ period: 'month' }),
          salesAnalyticsService.getHeatmap({ period: 'month' }),
          salesAnalyticsService.getTrends({ period: 'month', granularity: 'daily' }),
          salesAnalyticsService.getTrends({ period: 'month', granularity: 'hourly' })
        ]);
        
        if (velRes && velRes.success) setVelocityData(velRes.data);
        if (heatRes && heatRes.success) setHeatmapData(heatRes.data);
        setTrendsData({
          daily: dailyTrends?.success ? dailyTrends.data.data_points : [],
          hourly: hourlyTrends?.success ? hourlyTrends.data.data_points : []
        });
      } catch (error) {
        console.error("Error fetching velocity or heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getHeatmapIntensity = (dayIdx, hourIdx) => {
    if (!heatmapData || !heatmapData.data) return 0.1;
    const value = heatmapData.data[dayIdx][hourIdx];
    const max = 1000000; // Consistent with mock max
    const ratio = value / max;
    return ratio > 0.8 ? 0.9 : ratio > 0.5 ? 0.6 : ratio > 0.2 ? 0.3 : 0.1;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
  };

  const periodLabel = heatmapData?.period 
    ? `${new Date(heatmapData.period.start_date).toLocaleDateString()} - ${new Date(heatmapData.period.end_date).toLocaleDateString()}`
    : 'Periodo actual';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight uppercase">Tendencias Temporales y Velocidad</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Análisis detallado de frecuencia de transacciones y picos de demanda operativa.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold shadow-sm font-mono uppercase tracking-tighter">
              <Calendar size={18} className="text-slate-400" />
              <span>{periodLabel}</span>
            </div>
            <button className="flex items-center gap-2 bg-[#137fec] hover:bg-[#137fec]/90 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-md shadow-[#137fec]/20 uppercase tracking-wider">
              <RefreshCcw size={18} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <VelocityKPICard 
            title="Ventas por Día" 
            value={formatCurrency(velocityData.overall.sales_per_day)} 
            icon={<Banknote size={20} />} 
            status="Promedio diario estable"
            trend={<TrendingUp size={14} className="text-emerald-500" />}
          />
          <VelocityKPICard 
            title="Ventas por Hora" 
            value={formatCurrency(velocityData.overall.sales_per_hour)} 
            icon={<Zap size={20} />} 
            status="Hora pico: 14:00 - 15:00"
            trend={<TrendingUp size={14} className="text-orange-500" />}
          />
          <VelocityKPICard 
            title="Unidades por Día" 
            value={velocityData.overall.units_per_day} 
            icon={<Package size={20} />} 
            status="+5% unidades vs mes anterior"
            isBadge={true}
          />
          <VelocityKPICard 
            title="Ciclo de Venta" 
            value={`${velocityData.overall.avg_minutes_between_sales} min`} 
            icon={<Clock size={20} />} 
            status="Tiempo prom. entre ventas"
          />
        </div>

        {/* Heatmap Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight uppercase">Heatmap de Ventas</h2>
              <Info size={18} className="text-slate-400 cursor-help" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baja</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.6, 0.9].map(op => (
                  <div key={op} className="size-3 rounded-sm bg-[#137fec]" style={{ opacity: op }}></div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alta</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-2">
                <div></div>
                {Array.from({length: 24}).map((_, i) => (
                  <div key={i} className="text-[10px] font-black text-slate-400 text-center font-mono">{i % 2 === 0 ? i.toString().padStart(2, '0') : ''}</div>
                ))}
              </div>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, dIdx) => (
                <div key={day} className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-1">
                  <div className="text-[10px] font-black text-slate-500 flex items-center pr-2 uppercase tracking-tighter">{day}</div>
                  {Array.from({length: 24}).map((_, hIdx) => {
                    const opacity = getHeatmapIntensity(dIdx, hIdx);
                    return (
                      <div key={hIdx} className="h-8 rounded-sm bg-[#137fec] hover:scale-110 transition-transform cursor-pointer shadow-sm border border-black/5" style={{ opacity }}></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ventas por Día de la Semana */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
            <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight mb-8 uppercase">Ventas por Día</h2>
            <div className="flex-1 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData.daily}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', fontFamily: 'Inter, sans-serif'}} 
                    formatter={(value) => [formatCurrency(value), 'Ventas']}
                  />
                  <Bar dataKey="sales" fill="#137fec" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas por Hora del Día */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight uppercase">Ventas por Hora</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Distribución horaria</p>
              </div>
              <div className="bg-[#137fec]/10 text-[#137fec] text-[10px] font-black px-2 py-1 rounded uppercase font-mono tracking-widest">Pico: 14:00</div>
            </div>
            <div className="flex-1 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData.hourly}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', fontFamily: 'Inter, sans-serif'}} 
                    formatter={(value) => [formatCurrency(value), 'Ventas']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
    </div>
  );
};

const VelocityKPICard = ({ title, value, icon, status, trend, isBadge }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 hover:border-[#137fec] transition-all group">
    <div className="flex justify-between items-start">
      <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest group-hover:text-[#137fec] transition-colors">{title}</p>
      <div className="text-[#137fec] bg-[#137fec]/10 p-2 rounded-lg">
        {icon}
      </div>
    </div>
    <p className="text-slate-900 dark:text-white text-3xl font-black tracking-tight font-mono leading-none">{value}</p>
    <div className="flex items-center gap-1.5 mt-2">
      {trend}
      {isBadge ? (
        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter font-mono">
          {status}
        </span>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight">{status}</p>
      )}
    </div>
  </div>
);

export default TrendsVelocity;
