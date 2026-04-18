import React, { useState, useEffect, useMemo } from 'react';
import useDashboardStore from '@/store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/lib/i18n';

const TopProductsOverview = () => {
    const { t } = useI18n();
    const { 
        topProducts, 
        topProductsMetrics, 
        alerts, 
        fetchTopProducts, 
        fetchDashboardData, 
        loading 
    } = useDashboardStore();

    const [period, setPeriod] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTopProducts(period);
        if (!alerts || alerts.length === 0) fetchDashboardData();
    }, [fetchTopProducts, fetchDashboardData, alerts, period]);

    const formatCurrency = (value) => formatPYG(value);

    const formatNumber = (value) => {
        return new Intl.NumberFormat('es-PY').format(value || 0);
    };

    // Calculate metrics
    const topPerformer = topProducts && topProducts.length > 0 ? topProducts[0] : null;
    
    const inventoryAlertsCount = useMemo(() => {
        if (!alerts) return 0;
        return alerts.filter(a => a.category === 'inventory' || a.category?.includes('inv')).length;
    }, [alerts]);

    const filteredProducts = useMemo(() => {
        if (!topProducts) return [];
        if (!searchQuery) return topProducts;
        const query = searchQuery.toLowerCase();
        return topProducts.filter(p => 
            p.name?.toLowerCase().includes(query) || 
            p.category?.toLowerCase().includes(query) ||
            String(p.id).includes(query)
        );
    }, [topProducts, searchQuery]);

    // Mapping stock status to Stitch styles
    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'in_stock':
            case 'in stock':
                return { color: 'text-[#111418] dark:text-white', dot: 'bg-green-500', text: t('dashboard.dashboard.topProductsPanel.status.inStock', 'En Stock') };
            case 'low_stock':
            case 'low stock':
                return { color: 'text-orange-600 dark:text-orange-400 font-medium', dot: 'bg-orange-500 animate-pulse', text: t('dashboard.dashboard.topProductsPanel.status.lowStock', 'Stock Bajo') };
            case 'out_of_stock':
            case 'out of stock':
                return { color: 'text-red-600 dark:text-red-400 font-medium', dot: 'bg-red-500', text: t('dashboard.dashboard.topProductsPanel.status.outOfStock', 'Sin Stock') };
            default:
                return { color: 'text-[#111418] dark:text-white', dot: 'bg-gray-400', text: status || t('common.unknown', 'Desconocido') };
        }
    };

    const getPeriodLabel = (p) => {
        switch(p) {
            case 'today': return t('dashboard.dashboard.actions.today', 'Hoy');
            case 'week': return t('dashboard.dashboard.actions.thisWeek', 'Última Semana');
            case 'month': return t('dashboard.dashboard.actions.thisMonth', 'Últimos 30 Días');
            default: return p;
        }
    };

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 p-4 md:p-8">
      
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#111418] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
            {t('dashboard.dashboard.nav.topProducts', 'Rendimiento de Productos Top')}
          </h1>
          <p className="text-[#617589] dark:text-gray-400 text-base font-medium">
            {getPeriodLabel(period)} | {t('dashboard.dashboard.topProductsPanel.subtitle', 'Resumen de los SKUs con mejor desempeño')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#1e2832] p-1 rounded-xl border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm">
            {['today', 'week', 'month'].map((p) => (
                <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${period === p ? 'bg-[#137fec] text-white shadow-md' : 'text-[#617589] hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    {p === 'today' ? 'Hoy' : p === 'week' ? '7D' : '30D'}
                </button>
            ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Revenue Card */}
        <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-xs font-black uppercase tracking-[0.15em]">
              {t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales')}
            </p>
            <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[#111418] dark:text-white tracking-tight text-3xl font-black leading-tight">
                {formatCurrency(topProductsMetrics?.total_revenue || 0)}
            </p>
            <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-[#617589] dark:text-gray-400 font-bold uppercase tracking-wider">Período Seleccionado</span>
            </div>
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-xs font-black uppercase tracking-[0.15em]">
              {t('dashboard.dashboard.topProductsPanel.starProduct', 'Producto Estrella')}
            </p>
            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#137fec]">
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-black leading-tight truncate" title={topPerformer?.name}>
                {topPerformer ? topPerformer.name : t('common.loading', 'Cargando...')}
            </p>
            <p className="text-[#617589] dark:text-gray-400 text-xs font-bold uppercase tracking-wide">
                {topPerformer ? `${topPerformer.category || t('common.general', 'General')} • ${formatNumber(topPerformer.quantity_sold)} ${t('common.units', 'Unidades')}` : '-'}
            </p>
          </div>
        </div>

        {/* Inventory Alerts Card */}
        <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-xs font-black uppercase tracking-[0.15em]">
              {t('dashboard.dashboard.activity.titleShort', 'Alertas de Stock')}
            </p>
            <div className="size-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[#111418] dark:text-white tracking-tight text-3xl font-black leading-tight">
              {inventoryAlertsCount} {t('common.products', 'Productos')}
            </p>
            <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">{t('dashboard.dashboard.kpi.lowStock', 'Stock Bajo Detectado')}</span>
          </div>
        </div>
      </div>

      {/* ToolBar & Table Container */}
      <div className="flex flex-col bg-white dark:bg-[#1e2832] rounded-2xl border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap justify-between gap-4 p-4 border-b border-[#f0f2f4] dark:border-[#2a3642] items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input 
                    type="text"
                    placeholder={t('common.search', 'Buscar producto o categoría...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full pl-10 pr-4 bg-gray-50 dark:bg-black/20 border border-[#dbe0e6] dark:border-[#374151] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#137fec]/20 transition-all dark:text-white"
                />
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <button className="hidden md:flex items-center gap-2 px-3 py-2 text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span className="text-xs font-black uppercase tracking-widest">{t('common.filter', 'Filtros')}</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex cursor-pointer items-center justify-center rounded-xl h-10 bg-[#137fec] hover:bg-blue-600 text-white gap-2 text-xs font-black uppercase tracking-[0.1em] px-5 shadow-md transition-all active:scale-95">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t('common.export', 'Exportar')}</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-black/40 border-b border-[#f0f2f4] dark:border-[#2a3642]">
                <th className="p-4 w-12 text-center">
                  <Checkbox className="rounded-md border-gray-300 text-[#137fec] focus:ring-[#137fec] h-4 w-4 bg-white dark:bg-[#1e2832] dark:border-gray-600" />
                </th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{t('dashboard.dashboard.topProductsPanel.table.productName', 'Nombre del Producto')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{t('common.category', 'Categoría')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-right">{t('dashboard.dashboard.topProductsPanel.table.avgPrice', 'Precio Prom.')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-right">{t('dashboard.dashboard.topProductsPanel.table.unitsSold', 'Und. Vendidas')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-right">{t('dashboard.dashboard.revenue', 'Ingresos')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{t('common.status', 'Estado')}</th>
                <th className="p-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-center">{t('dashboard.dashboard.topProductsPanel.table.trend7d', 'Tendencia')}</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#2a3642]">
              {loading && filteredProducts.length === 0 ? (
                  <tr>
                      <td colSpan={9} className="p-20 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="size-16 rounded-full border-4 border-t-[#137fec] border-gray-100 dark:border-gray-800 animate-spin"></div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                                {t('dashboard.dashboard.topProductsPanel.table.loading', 'Cargando análisis de rendimiento...')}
                            </p>
                          </div>
                      </td>
                  </tr>
              ) : filteredProducts && filteredProducts.map((product) => {
                const statusInfo = getStatusStyle(product.stock_status);
                const avgPrice = product.quantity_sold > 0 ? product.revenue / product.quantity_sold : 0;
                
                return (
                  <tr key={product.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="p-4 text-center">
                      <Checkbox className="rounded-md border-gray-300 text-[#137fec] focus:ring-[#137fec] h-4 w-4 bg-white dark:bg-[#1e2832] dark:border-gray-600" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 border border-gray-200 dark:border-gray-700 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                          <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-black text-[#111418] dark:text-white group-hover:text-[#137fec] transition-colors tracking-tight">{product.name}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold uppercase">ID: {product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                        {product.category || t('common.general', 'General')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-bold text-right font-mono tracking-tighter">
                        {formatCurrency(avgPrice)}
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-black text-right font-mono tracking-tighter">
                        {formatNumber(product.quantity_sold)}
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-black text-right font-mono tracking-tighter text-[#137fec]">
                        {formatCurrency(product.revenue)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full shadow-sm ${statusInfo.dot}`}></div>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${statusInfo.color}`}>{statusInfo.text}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center h-8">
                        {product.trend === 'up' ? (
                            <div className="text-emerald-500 flex items-center gap-1 font-black">
                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                            </div>
                        ) : product.trend === 'down' ? (
                            <div className="text-red-500 flex items-center gap-1 font-black">
                                <span className="material-symbols-outlined text-[20px]">trending_down</span>
                            </div>
                        ) : (
                            <div className="text-gray-400 flex items-center gap-1 font-black">
                                <span className="material-symbols-outlined text-[20px]">trending_flat</span>
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="size-8 flex items-center justify-center text-gray-400 hover:text-[#111418] dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {!loading && filteredProducts.length === 0 && (
                  <tr>
                      <td colSpan={9} className="p-20 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300 text-[48px]">inventory_2</span>
                            </div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                                {t('dashboard.dashboard.topProductsPanel.table.noResults', 'Sin resultados para los criterios de búsqueda.')}
                            </p>
                            <button 
                                onClick={() => { setSearchQuery(''); setPeriod('month'); }}
                                className="text-primary text-xs font-black uppercase tracking-widest hover:underline mt-2"
                            >
                                Restablecer filtros
                            </button>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#f0f2f4] dark:border-[#2a3642] bg-gray-50 dark:bg-black/20 gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            <span>{t('common.pagination.showing', 'Mostrando')} 1 {t('common.pagination.to', 'a')} {filteredProducts.length} {t('common.pagination.of', 'de')} {filteredProducts.length} {t('common.pagination.results', 'resultados')}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border border-[#dbe0e6] dark:border-[#2a3642] bg-white dark:bg-[#1e2832] text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all" disabled>
                {t('common.previous', 'Anterior')}
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border border-[#dbe0e6] dark:border-[#2a3642] bg-white dark:bg-[#1e2832] text-xs font-black uppercase tracking-widest text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all" disabled>
                {t('common.next', 'Siguiente')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsOverview;
