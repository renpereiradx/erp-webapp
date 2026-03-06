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
    // Si es una lista de productos (Stock Bajo)
    if (label === 'products' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((p, i) => (
            <button 
              key={i} 
              onClick={() => navigate(`/productos?search=${p.name || p.id}`)}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#106ebe]/10 text-[#106ebe] hover:bg-[#106ebe]/20 rounded text-xs font-bold transition-colors border border-[#106ebe]/20"
            >
              <span className="material-symbols-outlined text-[14px]">package_2</span>
              {p.name || p.id}
            </button>
          ))}
        </div>
      );
    }
    
    // Si es un cliente o lista de clientes (Nuevos Clientes)
    if ((label.includes('client') || label.includes('customer')) && typeof value === 'string') {
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

    if (label === 'total' || label === 'amount' || label === 'revenue' || label === 'profit') {
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
    const formatted = formatReserveDate(dateString);
    return formatted ? formatted.relativeTime : 'hace poco';
  };

  // Mapeo de iconos por categoría
  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('inv')) return 'inventory_2';
    if (cat.includes('fin')) return 'payments';
    if (cat.includes('sal')) return 'shopping_cart';
    if (cat.includes('sec')) return 'shield';
    if (cat.includes('infra')) return 'dns';
    return 'notifications';
  };

  const getCategoryLabel = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('inv')) return 'Inventario';
    if (cat.includes('fin')) return 'Finanzas';
    if (cat.includes('sal')) return 'Ventas';
    if (cat.includes('sec')) return 'Seguridad';
    if (cat.includes('infra')) return 'Infraestructura';
    return 'Sistema';
  };

  // Cálculo de métricas enriquecidas
  const metrics = useMemo(() => {
    if (!alerts) return { total: 0, critical: 0, inventory: 0, sales: 0 };
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      inventory: alerts.filter(a => a.category?.toLowerCase().includes('inv')).length,
      sales: alerts.filter(a => a.category?.toLowerCase().includes('sal')).length
    };
  }, [alerts]);

  // Lógica de filtrado
  const filteredAlerts = useMemo(() => {
      if (!alerts) return [];
      let result = alerts;
      
      if (filterSeverity !== 'all') {
        result = result.filter(a => a.severity === filterSeverity);
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
    <div className="flex flex-col gap-6 font-display animate-in fade-in duration-500">
      
      {/* Encabezado y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white leading-none">Alertas Consolidadas</h1>
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">
            Monitoreo en tiempo real de eventos críticos del sistema. 
            Actualizado: {formatTimeInParaguayTimezone(lastUpdated)}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Marcar todo como leído
          </button>
          <button 
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#106ebe] text-white text-sm font-medium hover:bg-[#005a9e] transition-colors shadow-sm disabled:opacity-50"
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
        <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#617589] dark:text-gray-400">Total Activas</span>
            <span className="material-symbols-outlined text-[#617589] text-[20px]">notifications</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.total}</span>
          </div>
        </div>

        {/* Card de Stock Bajo (Inventario) */}
        <div 
            className={`flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-orange-500 shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterCategory === 'inv' ? 'ring-2 ring-orange-500/20' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'inv' ? 'all' : 'inv')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-600">Stock Bajo</span>
            <span className="material-symbols-outlined text-orange-600 text-[20px]">inventory_2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.inventory}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Alertas de almacén</span>
          </div>
        </div>

        {/* Card de Nuevos Clientes / Ventas */}
        <div 
            className={`flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-[#106ebe] shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterCategory === 'sal' ? 'ring-2 ring-[#106ebe]/20' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'sal' ? 'all' : 'sal')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#106ebe]">Clientes / Ventas</span>
            <span className="material-symbols-outlined text-[#106ebe] text-[20px]">groups</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.sales}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Novedades comerciales</span>
          </div>
        </div>

        {/* Card Críticas */}
        <div 
            className={`flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-red-500 shadow-fluent-shadow cursor-pointer transition-transform hover:scale-[1.02] ${filterSeverity === 'critical' ? 'ring-2 ring-red-500/20' : ''}`}
            onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-600">Acción Urgente</span>
            <span className="material-symbols-outlined text-red-600 text-[20px] fill-current">error</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.critical}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Prioridad alta</span>
          </div>
        </div>
      </div>

      {/* Filtros y Barra de Herramientas */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1b2631] p-2 rounded-xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1">
          <div className="relative min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] pl-9 pr-3 text-sm focus:border-[#106ebe] focus:outline-none focus:ring-1 focus:ring-[#106ebe] dark:text-white placeholder:text-[#617589] font-medium" 
              placeholder="Buscar por producto, cliente o ID..."
            />
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-[#374151] mx-1 shrink-0"></div>
          
          <button 
            className={`flex shrink-0 h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors ${
              (filterSeverity === 'all' && filterCategory === 'all') 
                ? 'bg-[#106ebe]/10 text-[#106ebe] border border-[#106ebe]/20 font-bold' 
                : 'bg-[#f6f7f8] dark:bg-[#101922] border border-slate-200 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111418] dark:text-white'
            }`}
            onClick={() => { setFilterSeverity('all'); setFilterCategory('all'); }}
          >
            Todas las Alertas
          </button>

          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="flex shrink-0 h-8 items-center gap-2 rounded-full border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] px-3 text-xs font-medium text-[#111418] dark:text-white outline-none focus:ring-1 focus:ring-[#106ebe]"
          >
            <option value="all">Severidad: Todas</option>
            <option value="critical">Crítica</option>
            <option value="warning">Advertencia</option>
            <option value="info">Información</option>
          </select>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex shrink-0 h-8 items-center gap-2 rounded-full border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] px-3 text-xs font-medium text-[#111418] dark:text-white outline-none focus:ring-1 focus:ring-[#106ebe]"
          >
            <option value="all">Categoría: Todas</option>
            <option value="inv">Inventario (Stock)</option>
            <option value="sal">Ventas / Clientes</option>
            <option value="fin">Finanzas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-2">
          <span className="text-xs text-[#617589] font-medium hidden sm:block mr-2">Ordenar por: Reciente</span>
          <button className="p-2 text-[#617589] hover:text-[#106ebe] rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </button>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="flex flex-col gap-3 pb-10">
        {filteredAlerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1b2631] rounded-xl border border-dashed border-slate-300 dark:border-[#374151]">
            <span className="material-symbols-outlined text-6xl text-[#617589] mb-4">notifications_off</span>
            <p className="text-[#617589] font-bold uppercase tracking-widest text-xs">Sistema Sin Alertas</p>
            <p className="text-[#617589] text-xs opacity-60 mt-1">No se encontraron alertas activas bajo estos filtros.</p>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const severityColorClass = alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-[#106ebe]';
          const severityBg = alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : alert.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
          const severityText = alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-orange-600' : 'text-[#106ebe]';
          const badgeClass = alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-red-600/10' : 
                             alert.severity === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-orange-600/10' : 
                             'bg-blue-50 dark:bg-blue-900/20 text-[#106ebe] dark:text-blue-300 ring-[#106ebe]/20';
          
          const severityLabel = alert.severity === 'critical' ? 'Crítica' : alert.severity === 'warning' ? 'Advertencia' : 'Información';

          return (
            <div 
              key={alert.id}
              className={`group relative flex flex-col rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow transition-all duration-300 ${isExpanded ? 'ring-1 ring-[#106ebe]/20' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),_0_8px_16px_rgba(0,0,0,0.08)]'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${severityColorClass} rounded-l-xl z-10`}></div>
              
              <div 
                className="flex flex-col sm:flex-row items-start sm:items-center p-4 pl-6 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleAlert(alert.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`size-10 rounded-full ${severityBg} flex items-center justify-center shrink-0 ${severityText}`}>
                    <span className="material-symbols-outlined">{getCategoryIcon(alert.category)}</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-[#111418] dark:text-white leading-tight">{alert.title || alert.message}</h3>
                    <span className="text-sm text-[#617589] dark:text-gray-400 font-medium">#{alert.id} • {getCategoryLabel(alert.category)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${badgeClass}`}>
                    {severityLabel}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#617589] font-bold">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {getRelativeTime(alert.created_at)}
                  </div>
                  <button className="p-1 text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors">
                    <span className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col gap-6 border-t border-slate-200 dark:border-[#374151] bg-[#f6f7f8]/50 dark:bg-[#101922]/30 p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div>
                        <h4 className="text-xs font-semibold text-[#111418] dark:text-white uppercase tracking-wider mb-2">Descripción del Problema</h4>
                        <p className="text-sm text-[#617589] dark:text-gray-300 leading-relaxed font-medium">
                          {alert.message}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">ID de Diagnóstico</span>
                          <span className="text-xs font-mono font-bold text-[#111418] dark:text-white">ALT_SYS_{alert.id}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Fecha Exacta</span>
                          <span className="text-xs font-bold dark:text-white">{formatDateInParaguayTimezone(alert.created_at)} a las {formatTimeInParaguayTimezone(alert.created_at)}</span>
                        </div>
                      </div>
                      
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#374151]">
                           <h4 className="text-xs font-semibold text-[#111418] dark:text-white uppercase tracking-wider">Detalles Técnicos</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(alert.details).map(([key, val]) => (
                                <DetailItem key={key} label={key} value={val} navigate={navigate} />
                            ))}
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:w-72 space-y-4">
                      <div className="bg-white dark:bg-[#1b2631] rounded-xl p-4 border border-slate-200 dark:border-[#374151] shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-semibold text-[#617589]">Acciones Directas</span>
                          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        </div>
                        <div className="space-y-3">
                          {alert.category?.includes('inv') && (
                            <button 
                                onClick={() => navigate('/productos')}
                                className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                            >
                                <span className="material-symbols-outlined text-orange-500 group-hover:scale-110 transition-transform">inventory_2</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-[#111418] dark:text-white">Reponer Stock</span>
                                    <span className="text-[9px] text-[#617589]">Ir a catálogo</span>
                                </div>
                            </button>
                          )}
                          {alert.category?.includes('sal') && (
                            <button 
                                onClick={() => navigate('/clientes')}
                                className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                            >
                                <span className="material-symbols-outlined text-[#106ebe] group-hover:scale-110 transition-transform">person_search</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-[#111418] dark:text-white">Ver Perfiles</span>
                                    <span className="text-[9px] text-[#617589]">Ir a clientes</span>
                                </div>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button className="flex items-center justify-center gap-2 h-9 w-full rounded-lg bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs font-medium shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">notifications_off</span>
                          Silenciar
                        </button>
                        <button 
                          className="flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-[#106ebe] text-white hover:bg-[#005a9e] transition-colors text-sm font-bold shadow-md"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(alert.action_url) navigate(alert.action_url); 
                          }}
                        >
                          Gestionar Alerta
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
