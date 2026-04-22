import React, { useState, useEffect, useCallback } from 'react'
import useDashboardStore from '@/store/useDashboardStore'
import { formatPYG } from '@/utils/currencyUtils';
import categoryService from '@/services/categoryService';

const hours = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'
]

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

    const [selectedLocation, setSelectedLocation] = useState('All Locations')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [categories, setCategories] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [analysisWeeks, setAnalysisWeeks] = useState(4);

    const loadData = useCallback(async () => {
        fetchSalesHeatmap(analysisWeeks);
        if (!summary) fetchDashboardData();
        
        try {
            const cats = await categoryService.getAll();
            setCategories(cats || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
        setLastUpdate(new Date());
    }, [fetchSalesHeatmap, fetchDashboardData, summary, analysisWeeks]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
    };

    // Data Processing
    const heatmapData = salesHeatmap?.heatmap || [];
    const peakTimes = salesHeatmap?.peak_times || [];
    const peakTime = peakTimes[0] || { day: '-', hour: '-' };

    // Calculate Max Sales for Intensity
    const maxSales = Math.max(...heatmapData.map(d => d.sales_count), 1);

    const getIntensity = (uiDayIndex, hourLabel) => {
        let hour = parseInt(hourLabel);
        if (hourLabel.includes('PM') && hour !== 12) hour += 12;
        if (hourLabel.includes('AM') && hour === 12) hour = 0;

        const apiDay = uiIndexToApiDay(uiDayIndex);
        
        const cell = heatmapData.find(d => d.day === apiDay && d.hour === hour);
        if (!cell) return { ratio: 0, sales: 0, label: '', total_amount: 0 };

        const ratio = cell.sales_count / maxSales;
        let label = '';
        if (ratio > 0.8) label = '$$$';
        else if (ratio > 0.5) label = '$$';
        
        return {
            ratio,
            sales: cell.sales_count,
            label,
            total_amount: cell.total_amount
        };
    };

    const formatCurrency = (val) => {
        if (!val) return '$0';
        return formatPYG(val);
    };

    const getIntensityClasses = (ratio) => {
        if (ratio === 0) return "bg-primary/5 dark:bg-primary/10";
        if (ratio <= 0.1) return "bg-primary/10 dark:bg-primary/20";
        if (ratio <= 0.2) return "bg-primary/20 dark:bg-primary/30";
        if (ratio <= 0.3) return "bg-primary/30";
        if (ratio <= 0.4) return "bg-primary/40";
        if (ratio <= 0.5) return "bg-primary/50";
        if (ratio <= 0.6) return "bg-primary/60";
        if (ratio <= 0.7) return "bg-primary/70";
        if (ratio <= 0.8) return "bg-primary/80";
        if (ratio <= 0.9) return "bg-primary/90";
        return "bg-primary text-white shadow-lg transform hover:scale-105 z-10 font-black"; // Peak
    };

    const getActivityStyle = (type) => {
        switch(type) {
            case 'sale': 
                return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'payments' };
            case 'product': 
                return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: 'inventory_2' };
            case 'client': 
                return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'person' };
            case 'alert':
            case 'error':
                return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: 'error' };
            default:
                return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: 'info' };
        }
    };

    const formatActivityDate = (timestamp) => {
        if (!timestamp) return 'Reciente';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (isToday) return `Hoy ${timeStr}`;
        
        return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${timeStr}`;
    };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
            
            {/* Page Heading & Context */}
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">Mapa de Calor de Ventas por Hora</h1>
                    <p className="text-[#617589] dark:text-gray-400 text-base">Visualizando picos de actividad e intensidad de ventas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                        {loading ? 'Actualizando...' : `Última actualización: ${lastUpdate.toLocaleTimeString()}`}
                    </span>
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>sync</span>
                        Actualizar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Exportar Reporte
                    </button>
                </div>
            </div>


            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Ingresos Totales */}
                <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Ingresos Totales (Día)</p>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded text-lg">payments</span>
                    </div>
                    <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">{formatCurrency(summary?.sales?.total || summary?.sales_today || 0)}</p>
                    <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${(summary?.sales?.trend || summary?.revenue_trend || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span className="material-symbols-outlined text-base">{(summary?.sales?.trend || summary?.revenue_trend || 0) >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span>{Math.abs(summary?.sales?.trend || summary?.revenue_trend || 0)}%</span>
                        <span className="text-gray-400 ml-1 font-normal">vs periodo anterior</span>
                    </div>
                </div>

                {/* Hora Punta */}
                <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Hora Punta (Promedio)</p>
                        <span className="material-symbols-outlined text-orange-500 bg-orange-100 dark:bg-orange-500/20 p-1 rounded text-lg">schedule</span>
                    </div>
                    <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">
                        {peakTime.day} {peakTime.hour}:00
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[#617589] dark:text-gray-400 text-sm font-medium">
                        <span>Mayor afluencia promedio</span>
                    </div>
                </div>

                {/* Ticket Promedio */}
                <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Ticket Promedio</p>
                        <span className="material-symbols-outlined text-purple-500 bg-purple-100 dark:bg-purple-500/20 p-1 rounded text-lg">receipt_long</span>
                    </div>
                    <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">{formatCurrency(summary?.sales?.average_ticket || 0)}</p>
                    <div className="flex items-center gap-1 mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        <span className="material-symbols-outlined text-base">auto_graph</span>
                        <span>Basado en {summary?.sales?.count || 0} transacciones</span>
                    </div>
                </div>

                {/* Cajas Activas */}
                <div className="bg-white dark:bg-[#1a2632] p-5 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Cajas Activas</p>
                        <span className="material-symbols-outlined text-blue-500 bg-blue-100 dark:bg-blue-500/20 p-1 rounded text-lg">storefront</span>
                    </div>
                    <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">{summary?.cash_registers?.open_count || 0}</p>
                    <div className="flex items-center gap-1 mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                         <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>En operación ahora</span>
                    </div>
                </div>

            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                 {/* Heatmap Section (Span 9) */}
                 <div className="xl:col-span-9 flex flex-col gap-4">
                     
                     {/* Heatmap Controls */}
                    <div className="bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center bg-[#f0f2f4] dark:bg-gray-800 rounded-lg p-1">
                            <button 
                                onClick={() => setAnalysisWeeks(prev => Math.max(1, prev - 1))}
                                className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all text-[#617589] hover:text-primary"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span className="px-4 text-sm font-bold text-[#111418] dark:text-white">Análisis de últimas {analysisWeeks} semanas</span>
                            <button 
                                onClick={() => setAnalysisWeeks(prev => Math.min(52, prev + 1))}
                                className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm transition-all text-[#617589] hover:text-primary"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select 
                                    className="appearance-none bg-[#f0f2f4] dark:bg-gray-800 border-none text-[#111418] dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 cursor-pointer font-medium"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                >
                                    <option value="All Locations">Todas las Sucursales</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#617589]">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </div>
                            </div>
                            <div className="relative">
                                <select 
                                    className="appearance-none bg-[#f0f2f4] dark:bg-gray-800 border-none text-[#111418] dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 cursor-pointer font-medium"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="All Categories">Todas las Categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#617589]">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Visualization */}
                    <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Legend */}
                            <div className="flex justify-end items-center gap-2 mb-4 text-xs font-medium text-[#617589] dark:text-gray-400">
                                <span>Baja Intensidad</span>
                                <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-50 to-[#137fec] dark:from-blue-900/20 dark:to-[#137fec]"></div>
                                <span>Alta Intensidad</span>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-[auto_repeat(14,_minmax(0,_1fr))] gap-1">
                                {/* Header Row */}
                                <div className="h-8"></div> {/* Empty corner */}
                                {/* Hours */}
                                {hours.map(hour => (
                                    <div key={`header-${hour}`} className="text-center text-xs font-medium text-[#617589] dark:text-gray-400">{hour}</div>
                                ))}

                                {/* Day Rows */}
                                {uiDays.map((day, dIndex) => (
                                    <React.Fragment key={`row-${day}`}>
                                        <div className="flex items-center text-xs font-bold text-[#111418] dark:text-white pr-2 h-10">{day}</div>
                                        {hours.map(hour => {
                                            const { ratio, sales, label, total_amount } = getIntensity(dIndex, hour);
                                            const isPeak = ratio >= 0.95 && ratio > 0;
                                            const bgClass = getIntensityClasses(ratio);
                                            
                                            return (
                                                <div 
                                                    key={`cell-${day}-${hour}`}
                                                    className={`${bgClass} rounded h-10 group relative hover:border-2 hover:border-primary cursor-pointer transition-all ${isPeak ? 'text-white flex items-center justify-center text-xs font-bold' : ''}`}
                                                >
                                                    {ratio >= 0.6 && !isPeak && <span className="text-white flex items-center justify-center h-full w-full text-xs font-bold">{label}</span>}
                                                    {isPeak && "Peak"}
                                                    
                                                    {/* Tooltip */}
                                                    {ratio > 0 && (
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#1a2632] dark:bg-white text-white dark:text-[#1a2632] p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs font-normal">
                                                            <div className="font-bold border-b border-gray-600 dark:border-gray-300 pb-1 mb-1">{day} {hour}</div>
                                                            <div className="flex justify-between"><span>Revenue:</span> <span className="font-bold">{formatCurrency(total_amount)}</span></div>
                                                            <div className="flex justify-between"><span>Transacciones:</span> <span className="font-bold">{sales}</span></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Side Panel (Span 3) */}
                 <div className="xl:col-span-3 flex flex-col gap-6">
                     
                     {/* Activity Feed */}
                     <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm flex flex-col h-full">
                        <div className="p-4 border-b border-[#f0f2f4] dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-[#111418] dark:text-white">Actividad Reciente</h3>
                            <button className="text-primary text-sm font-medium hover:underline">Ver Todo</button>
                        </div>
                        <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[500px]">
                            {activities && activities.map((item, index) => {
                                const style = getActivityStyle(item.type);
                                const uniqueKey = item.id ? `activity-${item.id}-${index}` : `activity-idx-${index}`;
                                
                                return (
                                    <div key={uniqueKey} className="flex gap-3">
                                        <div className={`size-8 rounded-full ${style.bg} ${style.text} flex items-center justify-center flex-shrink-0`}>
                                            <span className="material-symbols-outlined text-sm">{style.icon}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-[#111418] dark:text-white leading-snug break-words line-clamp-2">{item.description}</p>
                                            <p className="text-xs text-[#617589] dark:text-gray-500">
                                                {formatActivityDate(item.timestamp || item.time)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!activities || activities.length === 0) && (
                                <div className="p-8 text-center text-sm font-medium text-[#617589] dark:text-gray-500">
                                    Sin actividad reciente
                                </div>
                            )}
                        </div>
                     </div>

                     {/* Mini Map Widget */}
                     <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[#f0f2f4] dark:border-gray-700">
                            <h3 className="font-bold text-[#111418] dark:text-white">Sucursales Activas</h3>
                        </div>
                        <div className="h-48 bg-gray-100 dark:bg-gray-800 relative group flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">map</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5">
                                <button className="px-4 py-2 bg-white dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold rounded shadow hover:scale-105 transition-transform border border-gray-200 dark:border-gray-700">
                                    Mapa no disponible
                                </button>
                            </div>
                        </div>
                     </div>

                 </div>

            </div>

        </div>
    </div>
  )
}

export default SalesHeatmap
