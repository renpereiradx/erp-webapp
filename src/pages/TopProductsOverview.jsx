import React, { useState, useEffect, useMemo } from 'react';
import useDashboardStore from '@/store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Filter, 
  Columns, 
  ArrowUpDown, 
  Share2, 
  Download, 
  MoreVertical,
  Package,
  RefreshCw
} from 'lucide-react';
// ... (rest of lucide-react imports remain same)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

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

    // Trend helper
    const getTrendIcon = (trend) => {
        // API returns "up", "down", "stable"
        // UI expects styling logic.
        // For simplicity, store doesn't seem to pass mapped icon but string.
        return trend; // Not strictly used for icon rendering in table yet, just prop pass
    };

    // Placeholder image logic since API doesn't return images
    const ProductImagePlaceholder = () => (
        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
            <Package size={20} />
        </div>
    );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Rendimiento de Productos Top</h1>
          <p className="text-sm text-text-secondary font-medium">Resumen de SKUs con mejor desempeño (Últimos 7 días)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="shadow-sm border-border-subtle bg-surface" onClick={() => fetchTopProducts()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </header>

      <DashboardNav />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Ingresos Totales (Top 10)</p>
            <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-text-main tracking-tight">
                {formatCurrency(topProductsMetrics?.total_revenue || 0)}
            </h3>
            <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">
               Generado por los productos listados
            </p>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Producto Estrella</p>
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Award size={20} />
            </div>
          </div>
          <div className="space-y-1">
             <h3 className="text-xl font-black text-text-main tracking-tight truncate" title={topPerformer?.name || '-'}>
                 {topPerformer ? topPerformer.name : '-'}
             </h3>
             <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">
                 {topPerformer ? `${formatNumber(topPerformer.quantity_sold)} Unidades Vendidas` : 'Sin datos'}
             </p>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-surface p-6 rounded-xl shadow-fluent-2 border border-border-subtle hover:shadow-fluent-8 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Alertas de Inventario</p>
            <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-text-main tracking-tight">{inventoryAlertsCount} Alertas</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">Activas</span>
              <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-wider">Verifica el módulo de inventario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
                <Filter size={16} className="mr-2" />
                Filtrar
            </Button>
            <Button variant="ghost" size="sm" className="h-9 px-3 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
                <Columns size={16} className="mr-2" />
                Columnas
            </Button>
            <Button variant="ghost" size="sm" className="h-9 px-3 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
                <ArrowUpDown size={16} className="mr-2" />
                Ordenar
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-9 rounded-full text-text-secondary hover:text-primary hover:bg-blue-50">
                <Share2 size={18} />
            </Button>
            <Button variant="primary" size="md" className="h-10 px-4 shadow-md font-black uppercase tracking-widest text-[11px]">
                <Download size={18} className="mr-2" />
                Exportar a Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="hover:bg-transparent border-border-subtle">
                <TableHead className="w-12 text-center">
                  <Checkbox className="rounded-sm border-slate-300" />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Producto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Categoría</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">Und. Vendidas</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">Ingresos</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">Margen %</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center px-6">Tendencia</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts && topProducts.map((product) => (
                <TableRow key={product.id} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                  <TableCell className="text-center">
                    <Checkbox className="rounded-sm border-slate-300" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                        <Package size={24} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-black text-text-main truncate group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">#{product.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                      {product.category || 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className="text-sm font-black text-text-main">{formatNumber(product.quantity_sold)}</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className="text-sm font-black text-text-main">{formatCurrency(product.revenue)}</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className={`text-sm font-black ${product.margin_percentage >= 30 ? 'text-success' : 'text-text-main'}`}>
                      {product.margin_percentage ? `${product.margin_percentage}%` : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-6">
                    <div className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        product.trend === 'up' ? 'text-success bg-green-50' : 
                        product.trend === 'down' ? 'text-error bg-red-50' : 'text-slate-500 bg-slate-50'
                    }`}>
                        {product.trend === 'up' && <TrendingUp size={14} className="mr-1.5" />}
                        {product.trend === 'down' && <TrendingUp size={14} className="mr-1.5 rotate-180" />}
                        <span>{product.trend_percentage ? `${product.trend_percentage}%` : product.trend}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200">
                      <MoreVertical size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && (!topProducts || topProducts.length === 0) && (
                  <TableRow>
                      <TableCell colSpan={8} className="p-12 text-center">
                          <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                            No se encontraron productos para el período seleccionado.
                          </p>
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-border-subtle flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Mostrando {topProducts?.length || 0} resultados
            </div>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-border-subtle disabled:opacity-30" disabled>
                    Anterior
                </Button>
                <Button variant="secondary" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-border-subtle disabled:opacity-30" disabled>
                    Siguiente
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsOverview;
