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
    <div className="top-products">
      {/* Page Header */}
      <header className="top-products__header">
        <div className="top-products__header-title-group">
          <h1 className="top-products__header-title">Rendimiento de Productos Top</h1>
          <p className="top-products__header-subtitle">Resumen de SKUs con mejor desempeño (Últimos 7 días)</p>
        </div>
        <div>
          <Button variant="outline" className="font-bold gap-2" onClick={() => fetchTopProducts()}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </header>

      <DashboardNav />

      {/* KPI Stats Grid */}
      <div className="top-products__stats-grid">
        {/* Total Revenue */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Ingresos Totales (Top 10)</span>
            <div className="kpi-card__icon kpi-card__icon--success">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__value">
                {formatCurrency(topProductsMetrics?.total_revenue || 0)}
            </span>
          </div>
          <div className="kpi-card__footer text-sm text-muted-foreground mt-2">
               Generado por los productos listados
          </div>
        </div>

        {/* Top Performer */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Producto Estrella</span>
            <div className="kpi-card__icon kpi-card__icon--primary">
              <Award size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
             <span className="kpi-card__value text-xl truncate font-semibold" title={topPerformer?.name || '-'}>
                 {topPerformer ? topPerformer.name : '-'}
             </span>
             <span className="kpi-card__footer">
                 {topPerformer ? `${formatNumber(topPerformer.quantity_sold)} Unidades Vendidas` : 'Sin datos'}
             </span>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Alertas de Inventario</span>
            <div className="kpi-card__icon kpi-card__icon--warning">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__value">{inventoryAlertsCount} Alertas</span>
            <span className="kpi-card__trend kpi-card__trend--warning">Activas</span>
          </div>
          <span className="kpi-card__footer">Verifica el módulo de inventario</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="top-products__table-container">
        {/* Toolbar */}
        <div className="top-products__toolbar">
          <div className="top-products__toolbar-group">
            <Button variant="ghost" className="gap-2">
                <Filter size={20} />
                Filtrar
            </Button>
            <Button variant="ghost" className="gap-2">
                <Columns size={20} />
                Columnas
            </Button>
            <Button variant="ghost" className="gap-2">
                <ArrowUpDown size={20} />
                Ordenar
            </Button>
          </div>
          <div className="top-products__toolbar-group">
            <Button variant="ghost" size="icon">
                <Share2 size={20} />
            </Button>
            <Button variant="primary" className="gap-2 font-bold">
                <Download size={18} />
                Exportar a Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider">Producto</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider">Categoría</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Und. Vendidas</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Ingresos</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Margen %</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-center">Tendencia</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts && topProducts.map((product) => (
              <TableRow key={product.id} className="group cursor-pointer">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="product-cell flex items-center gap-3">
                    <ProductImagePlaceholder />
                    <div className="product-cell__info flex flex-col">
                      <span className="product-cell__name font-medium text-sm">{product.name}</span>
                      <span className="product-cell__sku text-xs text-muted-foreground">{product.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    {product.category || 'General'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                    {formatNumber(product.quantity_sold)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(product.revenue)}
                </TableCell>
                <TableCell className="text-right font-mono">
                    {product.margin_percentage ? `${product.margin_percentage}%` : '-'}
                </TableCell>
                <TableCell className="text-center">
                    {/* Simplified Trend Indicator */}
                    <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                        product.trend === 'up' ? 'text-green-700 bg-green-50' : 
                        product.trend === 'down' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'
                    }`}>
                        {product.trend === 'up' && <TrendingUp size={14} className="mr-1" />}
                        {product.trend === 'down' && <TrendingUp size={14} className="mr-1 rotate-180" />}
                        {product.trend_percentage ? `${product.trend_percentage}%` : product.trend}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={20} className="text-secondary" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {!loading && (!topProducts || topProducts.length === 0) && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron productos para el período seleccionado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination - Mock for now as API limit/offset logic minimal */}
        <div className="top-products__pagination">
            <div className="text-sm text-secondary">
                Mostrando {topProducts?.length || 0} resultados
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                    Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                    Siguiente
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsOverview;
