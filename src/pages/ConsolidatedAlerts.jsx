import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardStore from '@/store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { formatTimeInParaguayTimezone, formatDateInParaguayTimezone, formatReserveDate } from '@/utils/timeUtils';

/**
 * Renderizador de detalles de alerta para mejorar legibilidad
 */
const DetailItem = ({ label, value, navigate }) => {
  const formattedLabel = label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Renderizado especial según el tipo de dato o clave
  const renderValue = () => {
    // Si es una lista de productos
    if ((label.toLowerCase().includes('product') || label.toLowerCase().includes('item')) && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((p, i) => (
            <button 
              key={i} 
              onClick={() => navigate(`/productos?search=${p.name || p.id || p}`)}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#106ebe]/10 text-[#106ebe] hover:bg-[#106ebe]/20 rounded text-xs font-bold transition-colors border border-[#106ebe]/20"
            >
              <span className="material-symbols-outlined text-[14px]">package_2</span>
              {p.name || p.id || p}
            </button>
          ))}
        </div>
      );
    }
    
    // Si es un cliente o lista de clientes
    if ((label.toLowerCase().includes('client') || label.toLowerCase().includes('customer')) && (typeof value === 'string' || typeof value === 'number')) {
        return (
            <button 
              onClick={() => navigate(`/clientes?search=${value}`)}
              className="flex items-center gap-1.5 text-[#106ebe] hover:underline font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              {value}
            </button>
        );
    }

    // Formateo de moneda para campos financieros comunes
    const financialKeys = ['total', 'amount', 'revenue', 'profit', 'cost', 'price', 'balance', 'ticket'];
    if (financialKeys.some(key => label.toLowerCase().includes(key)) && (typeof value === 'number' || !isNaN(Number(value)))) {
      return <span className="font-bold text-[#106ebe]">{formatPYG(value)}</span>;
    }
    
    if (typeof value === 'object' && value !== null) {
      return <pre className="text-[10px] bg-gray-50 dark:bg-black/20 p-2 rounded overflow-x-auto w-full">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    return String(value);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">{formattedLabel}</span>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#374151] shadow-sm flex items-center min-h-[40px]">
        {renderValue()}
      </div>
    </div>
  );
};

const ConsolidatedAlerts = () => {
  const navigate = useNavigate();
  const { alerts, fetchDashboardData, loading } = useDashboardStore();
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData().then(() => setLastUpdated(new Date()));
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData();
    setLastUpdated(new Date());
  };

  const toggleAlert = (id) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'hace poco';
    const formatted = formatReserveDate(dateString);
    return formatted ? formatted.relativeTime : 'hace poco';
  };

  // Extraer categorías únicas de las alertas reales
  const availableCategories = useMemo(() => {
    if (!alerts) return [];
    const cats = new Set();
    alerts.forEach(a => {
        if (a.category) cats.add(a.category.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [alerts]);

  // Mapeo de iconos por categoría (mejorado)
  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('inv') || cat.includes('stock')) return 'inventory_2';
    if (cat.includes('fin') || cat.includes('pay') || cat.includes('cash')) return 'payments';
    if (cat.includes('sal') || cat.includes('order')) return 'shopping_cart';
    if (cat.includes('sec') || cat.includes('auth')) return 'shield';
    if (cat.includes('infra') || cat.includes('sys')) return 'dns';
    if (cat.includes('client') || cat.includes('cust')) return 'groups';
    return 'notifications';
  };

  const getCategoryLabel = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('inv') || cat.includes('stock')) return 'Inventario';
    if (cat.includes('fin')) return 'Finanzas';
    if (cat.includes('sal')) return 'Ventas';
    if (cat.includes('sec')) return 'Seguridad';
    if (cat.includes('infra')) return 'Infraestructura';
    if (cat.includes('client') || cat.includes('cust')) return 'Clientes';
    
    // Capitalize fallback
    return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Sistema';
  };

  // Cálculo de métricas enriquecidas
  const metrics = useMemo(() => {
    if (!alerts) return { total: 0, critical: 0, inventory: 0, sales: 0 };
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical' || a.severity === 'error').length,
      inventory: alerts.filter(a => {
          const c = a.category?.toLowerCase() || '';
          return c.includes('inv') || c.includes('stock');
      }).length,
      sales: alerts.filter(a => {
        const c = a.category?.toLowerCase() || '';
        return c.includes('sal') || c.includes('client') || c.includes('cust');
      }).length
    };
  }, [alerts]);

  // Lógica de filtrado
  const filteredAlerts = useMemo(() => {
      if (!alerts) return [];
      let result = alerts;
      
      if (filterSeverity !== 'all') {
        result = result.filter(a => a.severity === filterSeverity || (filterSeverity === 'critical' && a.severity === 'error'));
      }

      if (filterCategory !== 'all') {
        result = result.filter(a => a.category?.toLowerCase().includes(filterCategory.toLowerCase()));
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(a => 
          a.title?.toLowerCase().includes(query) || 
          a.message?.toLowerCase().includes(query) ||
          String(a.id).includes(query)
        );
      }
      
      return result;
  }, [alerts, filterSeverity, filterCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-6 font-display animate-in fade-in duration-500 p-4 md:p-8">
      
      {/* Encabezado y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white leading-none">Alertas Consolidadas</h1>
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">
            Monitoreo en tiempo real de eventos críticos del sistema. 
            Actualizado: {formatTimeInParaguayTimezone(lastUpdated)}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Marcar todo como leído
          </button>
          <button 
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#106ebe] text-white text-sm font-bold hover:bg-[#005a9e] transition-colors shadow-sm disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Actualizar Datos
          </button>
        </div>
      </div>


      {/* Tarjetas de Resumen KPI - Enfocadas en categorías de interés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col p-5 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#617589] dark:text-gray-400">Total Activas</span>
            <span className="material-symbols-outlined text-[#617589] text-[20px]">notifications</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111418] dark:text-white">{metrics.total}</span>
          </div>
        </div>

        {/* Card de Stock Bajo (Inventario) */}
        <div 
            className={`flex flex-col p-5 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-orange-500 shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterCategory === 'inventory' ? 'ring-2 ring-orange-500/20' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'inventory' ? 'all' : 'inventory')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Stock Bajo</span>
            <span className="material-symbols-outlined text-orange-600 text-[20px]">inventory_2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111418] dark:text-white">{metrics.inventory}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-bold uppercase tracking-tight ml-2">Alertas</span>
          </div>
        </div>

        {/* Card de Clientes / Ventas */}
        <div 
            className={`flex flex-col p-5 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-[#106ebe] shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterCategory === 'sales' ? 'ring-2 ring-[#106ebe]/20' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'sales' ? 'all' : 'sales')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#106ebe]">Clientes / Ventas</span>
            <span className="material-symbols-outlined text-[#106ebe] text-[20px]">groups</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111418] dark:text-white">{metrics.sales}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-bold uppercase tracking-tight ml-2">Eventos</span>
          </div>
        </div>

        {/* Card Críticas */}
        <div 
            className={`flex flex-col p-5 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-red-500 shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterSeverity === 'critical' ? 'ring-2 ring-red-500/20' : ''}`}
            onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Acción Urgente</span>
            <span className="material-symbols-outlined text-red-600 text-[20px] fill-current">error</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111418] dark:text-white">{metrics.critical}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-bold uppercase tracking-tight ml-2">Críticas</span>
          </div>
        </div>
      </div>

      {/* Filtros y Barra de Herramientas */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1b2631] p-3 rounded-xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1">
          <div className="relative min-w-[240px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] pl-10 pr-3 text-sm focus:border-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#106ebe]/20 dark:text-white placeholder:text-[#617589] font-bold" 
              placeholder="Filtrar por contenido o ID..."
            />
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-[#374151] mx-1 shrink-0"></div>
          
          <button 
            className={`flex shrink-0 h-9 items-center gap-2 rounded-full px-4 text-xs font-bold transition-all ${
              (filterSeverity === 'all' && filterCategory === 'all') 
                ? 'bg-[#106ebe] text-white shadow-md' 
                : 'bg-[#f6f7f8] dark:bg-[#101922] border border-slate-200 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111418] dark:text-white'
            }`}
            onClick={() => { setFilterSeverity('all'); setFilterCategory('all'); }}
          >
            Todas
          </button>

          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="flex shrink-0 h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] px-4 text-xs font-bold text-[#111418] dark:text-white outline-none focus:ring-2 focus:ring-[#106ebe]/20 cursor-pointer"
          >
            <option value="all">Severidad: Todas</option>
            <option value="critical">Crítica / Error</option>
            <option value="warning">Advertencia</option>
            <option value="info">Información</option>
          </select>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex shrink-0 h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] px-4 text-xs font-bold text-[#111418] dark:text-white outline-none focus:ring-2 focus:ring-[#106ebe]/20 cursor-pointer"
          >
            <option value="all">Categoría: Todas</option>
            {availableCategories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-2">
          <span className="text-xs text-[#617589] font-bold hidden sm:block mr-2 uppercase tracking-tighter">Ordenar: Reciente</span>
          <button className="size-10 flex items-center justify-center text-[#617589] hover:text-[#106ebe] rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#374151]">
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </button>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="flex flex-col gap-3 pb-10">
        {filteredAlerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1b2631] rounded-2xl border border-dashed border-slate-300 dark:border-[#374151] animate-in fade-in zoom-in duration-300">
            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-[#617589] opacity-40">notifications_off</span>
            </div>
            <p className="text-[#617589] font-black uppercase tracking-[0.2em] text-sm">Sistema Sin Alertas</p>
            <p className="text-[#617589] text-xs opacity-60 mt-2 font-medium">No se encontraron alertas activas bajo estos filtros.</p>
            <button 
                onClick={() => { setFilterSeverity('all'); setFilterCategory('all'); setSearchQuery(''); }}
                className="mt-6 text-primary text-xs font-bold hover:underline"
            >
                Limpiar todos los filtros
            </button>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const severityColorClass = (alert.severity === 'critical' || alert.severity === 'error') ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-[#106ebe]';
          const severityBg = (alert.severity === 'critical' || alert.severity === 'error') ? 'bg-red-100 dark:bg-red-900/30' : alert.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
          const severityText = (alert.severity === 'critical' || alert.severity === 'error') ? 'text-red-600' : alert.severity === 'warning' ? 'text-orange-600' : 'text-[#106ebe]';
          const badgeClass = (alert.severity === 'critical' || alert.severity === 'error') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-red-600/10' : 
                             alert.severity === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-orange-600/10' : 
                             'bg-blue-50 dark:bg-blue-900/20 text-[#106ebe] dark:text-blue-300 ring-[#106ebe]/20';
          
          const severityLabel = (alert.severity === 'critical' || alert.severity === 'error') ? 'Crítica' : alert.severity === 'warning' ? 'Advertencia' : 'Información';

          return (
            <div 
              key={alert.id}
              className={`group relative flex flex-col rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow transition-all duration-300 ${isExpanded ? 'ring-2 ring-[#106ebe]/30 border-transparent shadow-xl' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),_0_8px_16px_rgba(0,0,0,0.08)]'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${severityColorClass} rounded-l-xl z-10`}></div>
              
              <div 
                className="flex flex-col sm:flex-row items-start sm:items-center p-5 pl-7 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleAlert(alert.id)}
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className={`size-12 rounded-xl ${severityBg} flex items-center justify-center shrink-0 ${severityText} shadow-inner`}>
                    <span className="material-symbols-outlined text-[24px]">{getCategoryIcon(alert.category)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-lg font-black text-[#111418] dark:text-white leading-tight tracking-tight">{alert.title || alert.message}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#617589] dark:text-gray-400 font-bold uppercase tracking-widest">{getCategoryLabel(alert.category)}</span>
                        <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="text-xs text-[#617589] dark:text-gray-400 font-mono">ID: {alert.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
                  <span className={`inline-flex items-center rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ring-1 ring-inset ${badgeClass}`}>
                    {severityLabel}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#617589] font-black uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {getRelativeTime(alert.created_at)}
                  </div>
                  <button className="size-8 flex items-center justify-center text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 rounded-full">
                    <span className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col gap-6 border-t border-slate-200 dark:border-[#374151] bg-[#f6f7f8]/50 dark:bg-[#101922]/30 p-7 animate-in slide-in-from-top-4 duration-300 ease-out">
                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-[#111418] dark:text-white uppercase tracking-[0.2em] mb-3 opacity-70">Descripción del Evento</h4>
                        <p className="text-base text-[#111418] dark:text-gray-200 leading-relaxed font-bold tracking-tight">
                          {alert.message}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-[#617589] uppercase tracking-[0.2em]">Referencia Interna</span>
                          <span className="text-sm font-mono font-black text-[#106ebe] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-block w-fit">ALT_SYS_{alert.id}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-[#617589] uppercase tracking-[0.2em]">Registro Temporal</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {formatDateInParaguayTimezone(alert.created_at)} • {formatTimeInParaguayTimezone(alert.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#374151]">
                           <h4 className="text-[10px] font-black text-[#111418] dark:text-white uppercase tracking-[0.2em] opacity-70">Metadatos y Contexto</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {Object.entries(alert.details).map(([key, val]) => (
                                <DetailItem key={key} label={key} value={val} navigate={navigate} />
                            ))}
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:w-80 space-y-5">
                      <div className="bg-white dark:bg-[#1b2631] rounded-2xl p-6 border border-slate-200 dark:border-[#374151] shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#106ebe]/5 rounded-full -mr-12 -mt-12"></div>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-xs font-black uppercase tracking-widest text-[#617589]">Resolución</span>
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="space-y-4 relative z-10">
                          {alert.category?.includes('inv') && (
                            <button 
                                onClick={() => navigate('/productos')}
                                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            >
                                <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-black text-[#111418] dark:text-white tracking-tight">Reponer Stock</span>
                                    <span className="text-[10px] text-[#617589] font-bold uppercase opacity-70">Ver Catálogo</span>
                                </div>
                            </button>
                          )}
                          {(alert.category?.includes('sal') || alert.category?.includes('client')) && (
                            <button 
                                onClick={() => navigate('/clientes')}
                                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            >
                                <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#106ebe] group-hover:scale-110 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">person_search</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-black text-[#111418] dark:text-white tracking-tight">Revisar Clientes</span>
                                    <span className="text-[10px] text-[#617589] font-bold uppercase opacity-70">Gestión CRM</span>
                                </div>
                            </button>
                          )}
                          <button 
                                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            >
                                <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-black text-[#111418] dark:text-white tracking-tight">Ver Reporte</span>
                                    <span className="text-[10px] text-[#617589] font-bold uppercase opacity-70">Log de Sistema</span>
                                </div>
                            </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button className="flex items-center justify-center gap-3 h-11 w-full rounded-xl bg-white dark:bg-[#1b2631] border-2 border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-black uppercase tracking-widest shadow-sm">
                          <span className="material-symbols-outlined text-[20px]">notifications_off</span>
                          Silenciar
                        </button>
                        <button 
                          className="flex items-center justify-center gap-3 h-12 w-full rounded-xl bg-[#106ebe] text-white hover:bg-[#005a9e] transition-all text-sm font-black uppercase tracking-[0.15em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(alert.action_url) navigate(alert.action_url); 
                          }}
                        >
                          Gestionar
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsolidatedAlerts;
