import React, { useState, useEffect, useMemo } from 'react';
import useDashboardStore from '@/store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const TopProductsOverview = () => {
    const { 
        topProducts, 
        topProductsMetrics, 
        alerts, 
        fetchTopProducts, 
        fetchDashboardData, 
        loading 
    } = useDashboardStore();

    useEffect(() => {
        fetchTopProducts();
        if (!alerts || alerts.length === 0) fetchDashboardData();
    }, [fetchTopProducts, fetchDashboardData, alerts]);

    const formatCurrency = (value) => formatPYG(value);

    const formatNumber = (value) => {
        return new Intl.NumberFormat('es-PY').format(value || 0);
    };

    // Calculate metrics
    const topPerformer = topProducts && topProducts.length > 0 ? topProducts[0] : null;
    
    const inventoryAlertsCount = useMemo(() => {
        if (!alerts) return 0;
        return alerts.filter(a => a.category === 'inventory').length;
    }, [alerts]);

    // Mapping stock status to Stitch styles
    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'in_stock':
            case 'in stock':
                return { color: 'text-[#111418] dark:text-white', dot: 'bg-green-500', text: 'En Stock' };
            case 'low_stock':
            case 'low stock':
                return { color: 'text-orange-600 dark:text-orange-400 font-medium', dot: 'bg-orange-500 animate-pulse', text: 'Stock Bajo' };
            case 'out_of_stock':
            case 'out of stock':
                return { color: 'text-red-600 dark:text-red-400 font-medium', dot: 'bg-red-500', text: 'Sin Stock' };
            default:
                return { color: 'text-[#111418] dark:text-white', dot: 'bg-gray-400', text: status || 'Desconocido' };
        }
    };

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto space-y-6">
      {/* Top Navigation */}

      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#111418] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Rendimiento de Productos Top</h1>
          <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal">Últimos 30 Días | Resumen de los SKUs con mejor desempeño</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Revenue Card */}
        <div className="flex flex-col gap-2 !rounded-[12px] p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Ingresos Totales</p>
            <span className="material-symbols-outlined text-green-600 bg-green-100 dark:bg-green-900/30 !rounded-full p-1 text-[16px]">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[#111418] dark:text-white tracking-tight text-3xl font-bold leading-tight">
                {formatCurrency(topProductsMetrics?.total_revenue || 0)}
            </p>
            <span className="text-[#078838] text-sm font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 !rounded-[6px]">+12% vs prev</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 !rounded-full mt-2 overflow-hidden">
            <div className="bg-[#137fec] h-1.5 rounded-full w-[75%]" ></div>
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="flex flex-col gap-2 !rounded-[12px] p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Producto Estrella</p>
            <span className="material-symbols-outlined text-[#137fec] bg-blue-100 dark:bg-blue-900/30 !rounded-full p-1 text-[16px]">emoji_events</span>
          </div>
          <p className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold leading-tight truncate" title={topPerformer?.name}>
            {topPerformer ? topPerformer.name : 'Cargando...'}
          </p>
          <p className="text-[#617589] dark:text-gray-400 text-sm">
            {topPerformer ? `${topPerformer.category || 'General'} • ${formatNumber(topPerformer.quantity_sold)} Unidades` : '-'}
          </p>
        </div>

        {/* Inventory Alerts Card */}
        <div className="flex flex-col gap-2 !rounded-[12px] p-6 bg-white dark:bg-[#1e2832] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-[#617589] dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Alertas de Stock</p>
            <span className="material-symbols-outlined text-orange-600 bg-orange-100 dark:bg-orange-900/30 rounded-full p-1 text-[16px]">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[#111418] dark:text-white tracking-tight text-3xl font-bold leading-tight">{inventoryAlertsCount} Productos</p>
            <span className="text-orange-600 text-sm font-medium">Stock Bajo</span>
          </div>
          <p className="text-[#617589] dark:text-gray-400 text-sm">Requiere reabastecimiento inmediato</p>
        </div>
      </div>

      {/* ToolBar & Table Container */}
      <div className="flex flex-col bg-white dark:bg-[#1e2832] !rounded-[12px] border border-[#dbe0e6] dark:border-[#2a3642] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap justify-between gap-4 p-4 border-b border-[#f0f2f4] dark:border-[#2a3642]">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-white/5 !rounded-[8px] border border-transparent transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span className="text-sm font-medium">Filtrar</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-white/5 !rounded-[8px] border border-transparent transition-colors">
              <span className="material-symbols-outlined text-[20px]">view_column</span>
              <span className="text-sm font-medium">Columnas</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-white/5 !rounded-[8px] border border-transparent transition-colors">
              <span className="material-symbols-outlined text-[20px]">sort</span>
              <span className="text-sm font-medium">Ordenar</span>
            </button>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-[#111418] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-white/5 !rounded-[8px] border border-transparent transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <button className="flex cursor-pointer items-center justify-center overflow-hidden !rounded-[8px] h-9 bg-[#137fec] hover:bg-blue-600 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] px-4 shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="truncate">Exportar a Excel</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-black/20 border-b border-[#f0f2f4] dark:border-[#2a3642]">
                <th className="p-4 w-12 text-center">
                  <Checkbox className="!rounded-[4px] border-gray-300 text-[#137fec] focus:ring-[#137fec] h-4 w-4 bg-white dark:bg-[#1e2832] dark:border-gray-600" />
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre del Producto</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Precio Prom.</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Und. Vendidas</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ingresos</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Tendencia (7d)</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#2a3642]">
              {topProducts && topProducts.map((product) => {
                const statusInfo = getStatusStyle(product.stock_status);
                const avgPrice = product.quantity_sold > 0 ? product.revenue / product.quantity_sold : 0;
                
                return (
                  <tr key={product.id} className="group hover:bg-[#f0f2f4]/50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="p-4 text-center">
                      <Checkbox className="!rounded-[4px] border-gray-300 text-[#137fec] focus:ring-[#137fec] h-4 w-4 bg-white dark:bg-[#1e2832] dark:border-gray-600" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 !rounded-[8px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-slate-400 border border-gray-200 dark:border-gray-600 flex-shrink-0">
                          <span className="material-symbols-outlined text-[24px]">package_2</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#111418] dark:text-white group-hover:text-[#137fec] transition-colors">{product.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">SKU-{product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 !rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-medium text-right font-mono">
                        {formatCurrency(avgPrice)}
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-medium text-right font-mono">
                        {formatNumber(product.quantity_sold)}
                    </td>
                    <td className="p-4 text-sm text-[#111418] dark:text-white font-bold text-right font-mono">
                        {formatCurrency(product.revenue)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 !rounded-full ${statusInfo.dot}`}></div>
                        <span className={`text-sm ${statusInfo.color}`}>{statusInfo.text}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center h-8">
                        {product.trend === 'up' ? (
                            <svg fill="none" height="20" stroke="#137fec" strokeWidth="2" viewBox="0 0 60 20" width="60">
                                <path d="M0 15 L10 12 L20 18 L30 8 L40 10 L50 5 L60 2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        ) : product.trend === 'down' ? (
                            <svg fill="none" height="20" stroke="#ef4444" strokeWidth="2" viewBox="0 0 60 20" width="60">
                                <path d="M0 5 L10 8 L20 6 L30 10 L40 12 L50 15 L60 18" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        ) : (
                            <svg fill="none" height="20" stroke="#6b7280" strokeWidth="2" viewBox="0 0 60 20" width="60">
                                <path d="M0 10 L10 10 L20 10 L30 10 L40 10 L50 10 L60 10" strokeDasharray="2 2"></path>
                            </svg>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-[#111418] dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity !rounded-full p-1">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {!loading && (!topProducts || topProducts.length === 0) && (
                  <tr>
                      <td colSpan={9} className="p-12 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-slate-300 text-[48px]">inventory_2</span>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                                No se encontraron productos para el período seleccionado.
                            </p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f2f4] dark:border-[#2a3642] bg-gray-50 dark:bg-black/10">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrando 1 a {topProducts?.length || 0} de {topProducts?.length || 0} resultados</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="px-3 py-1 !rounded-[8px] border border-[#dbe0e6] dark:border-[#2a3642] bg-white dark:bg-[#1e2832] text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30" disabled>
                Anterior
            </Button>
            <Button variant="outline" size="sm" className="px-3 py-1 !rounded-[8px] border border-[#dbe0e6] dark:border-[#2a3642] bg-white dark:bg-[#1e2832] text-sm text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30" disabled>
                Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsOverview;
