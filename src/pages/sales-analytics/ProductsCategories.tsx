import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RefreshCcw
} from 'lucide-react';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';
// F1 (PLAN_ALINEACION_BI_FRONTEND): formato/paginación extraídos a domain
import { clampPage, roundPct1 } from '@/domain/sales-analytics/format';

const ProductsCategories = () => {
  const [categoriesData, setCategoriesData] = useState<Record<string, any> | null>(null);
  const [productsData, setProductsData] = useState<Record<string, any>>({ products: [], pagination: { page: 1, total_items: 0, total_pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  // Map for UI labels
  const labelMap = {
    'today': 'hoy',
    'week': 'semana',
    'month': 'mes',
    'year': 'año'
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        salesAnalyticsService.getByCategory({ period }),
        salesAnalyticsService.getByProduct({ period, page: 1, page_size: 10 })
      ]);


      if (catRes && catRes.success) setCategoriesData(catRes.data);
      if (prodRes && prodRes.success) setProductsData(prodRes.data);
    } catch (err) {
      console.error("Error fetching sales analytics data:", err);
      const message = err instanceof Error ? err.message : "Error al cargar los datos de analítica";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handlePageChange = async (newPage) => {
    const targetPage = clampPage(newPage, productsData.pagination);
    if (targetPage === productsData.pagination.page) return;
    try {
      const res = await salesAnalyticsService.getByProduct({ period, page: targetPage, page_size: 10 });
      if (res && res.success) setProductsData(res.data);
    } catch (err) {
      console.error("Error fetching page:", err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0);
  };

  if (loading && !categoriesData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <RefreshCcw className="animate-spin text-primary" size={48} />
          <p className="text-lg font-medium text-on-surface-deep font-mono uppercase tracking-widest">Cargando analítica...</p>
      </div>
    );
  }

  if (error && !categoriesData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="p-4 bg-error/10 rounded-full text-error mb-4">
            <TrendingDown size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground uppercase tracking-tight">Error de Conexión</h2>
          <p className="text-on-surface-deep mb-6 max-w-md font-medium">{error}</p>
          <button 
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all uppercase tracking-widest text-xs shadow-whisper"
            onClick={fetchData}
          >
            Reintentar Carga
          </button>
      </div>
    );
  }

  // Si no hay datos (y no está cargando ni en error)
  if (!categoriesData) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">


        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl font-black leading-tight tracking-tight uppercase">Analítica de Productos y Categorías</h1>
            <p className="text-on-surface-deep text-sm font-medium">Visualización detallada del rendimiento comercial por SKU y líneas de producto.</p>
          </div>


          <div className="flex items-center gap-4">
            <div className='flex h-10 items-center rounded-lg bg-surface-subtle/50 p-1 font-mono shadow-sm'>
              {Object.entries(labelMap).map(([apiVal, label]) => (
                <button
                  key={apiVal}
                  onClick={() => setPeriod(apiVal)}
                  className={`flex cursor-pointer h-full items-center justify-center rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-all ${
                    period === apiVal
                      ? 'bg-surface dark:bg-slate-700 shadow-sm text-primary'
                      : 'text-on-surface-deep dark:text-on-surface-deep hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-whisper hover:bg-primary/90 transition-all uppercase tracking-wider">
              <Download size={18} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Top Row: Charts and Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales by Category Card */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border-subtle shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-on-surface-deep text-sm font-bold uppercase tracking-widest">Métricas de Rendimiento</p>
                <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Ventas por Categoría</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary font-mono">{formatCurrency(categoriesData.total_sales)}</p>
                <p className="text-success text-sm font-bold flex items-center justify-end font-mono">
                  <TrendingUp size={14} className="mr-1" />
                  +12% vs mes anterior
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {categoriesData.categories?.map((cat, idx) => (
                <div key={cat.category_id || idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black text-on-surface-deep uppercase tracking-widest">
                    <span>{cat.category_name}</span>
                    <span className="font-mono">{formatCurrency(cat.sales)} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-surface-muted h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${cat.percentage}%`, opacity: 1 - (idx * 0.15) }}
                    ></div>
                  </div>
                </div>
              ))}
              {(!categoriesData.categories || categoriesData.categories.length === 0) && (
                <div className="flex flex-col items-center justify-center py-10 text-on-surface-deep">
                  <p className="text-sm font-medium uppercase tracking-widest">No hay datos por categoría</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performer Card */}
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-warning" size={20} fill="currentColor" />
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest bg-surface/20 px-2 py-0.5 rounded">Top Performer</p>
              </div>
              <h2 className="text-2xl font-black mb-1 uppercase tracking-tight">
                {categoriesData.categories?.[0]?.top_product || "N/A"}
              </h2>
              <p className="text-white/80 text-sm font-medium">Producto líder de este periodo</p>
            </div>
            <div className="py-6 font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface/10 p-3 rounded-lg border border-white/10">
                  <p className="text-white/60 text-[10px] uppercase font-black">Unidades</p>
                  <p className="text-xl font-black">{categoriesData.categories?.[0]?.units_sold || 0}</p>
                </div>
                <div className="bg-surface/10 p-3 rounded-lg border border-white/10">
                  <p className="text-white/60 text-[10px] uppercase font-black">Margen</p>
                  <p className="text-xl font-black">{roundPct1(categoriesData.categories?.[0]?.gross_margin_pct)}%</p>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-surface text-primary font-black rounded-lg hover:bg-surface-muted transition-all flex items-center justify-center gap-2 shadow-md uppercase text-xs tracking-widest">
              <span>Ver Reporte Completo</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Middle Row: Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceTable 
            title="Productos Más Vendidos" 
            icon={<TrendingUp size={18} className="text-success" />} 
            data={categoriesData.categories || []} 
            type="top"
          />
          <PerformanceTable 
            title="Bajo Rendimiento" 
            icon={<TrendingDown size={18} className="text-error" />} 
            data={categoriesData.categories || []} 
            type="bottom"
          />
        </div>

        {/* Bottom Section: Detailed List */}
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border-subtle flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Listado Detallado de Productos</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-border-subtle rounded-lg text-xs font-bold hover:bg-surface-muted transition-colors uppercase tracking-tighter">
                <Download size={14} />
                Exportar CSV
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors uppercase tracking-tighter">
                <Plus size={14} />
                Nuevo Producto
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-surface-muted text-[10px] uppercase text-on-surface-deep font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors">Producto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Ventas</th>
                  <th className="px-6 py-4 text-right">Unidades</th>
                  <th className="px-6 py-4 text-right">P. Promedio</th>
                  <th className="px-6 py-4 text-right">Margen %</th>
                  <th className="px-6 py-4 text-right">Crecimiento %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {productsData.products?.map((product) => (
                  <tr key={product.product_id} className="hover:bg-surface-muted:bg-surface-deep/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{product.product_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-deep font-bold">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-right font-mono">{formatCurrency(product.sales)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold">{product.units_sold}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(product.average_price)}</td>
                    <td className="px-6 py-4 text-success font-black text-right font-mono">{roundPct1(product.gross_margin_pct)}%</td>
                    <td className={`px-6 py-4 font-black text-right font-mono ${product.growth_pct >= 0 ? 'text-success' : 'text-error'}`}>
                      {product.growth_pct >= 0 ? '+' : ''}{roundPct1(product.growth_pct)}%
                    </td>
                  </tr>
                ))}
                {(!productsData.products || productsData.products.length === 0) && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-on-surface-deep font-medium italic">
                      No se encontraron productos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between font-mono">
            <p className="text-xs text-on-surface-deep font-bold uppercase tracking-tighter">
              Página {productsData.pagination.page} de {productsData.pagination.total_pages} ({productsData.pagination.total_items} items)
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePageChange(productsData.pagination.page - 1)}
                disabled={productsData.pagination.page === 1} 
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-deep disabled:opacity-50 hover:bg-surface-muted"
              >
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-black">
                {productsData.pagination.page}
              </button>
              <button 
                onClick={() => handlePageChange(productsData.pagination.page + 1)}
                disabled={productsData.pagination.page === productsData.pagination.total_pages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-on-surface-deep hover:bg-surface-muted disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

const PerformanceTable = ({ title, icon, data, type }) => (
  <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden font-display">
    <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-muted/50">
      <h3 className="font-bold text-foreground flex items-center gap-2 uppercase tracking-tight text-sm">
        {icon}
        {title}
      </h3>
      <button className="text-[10px] text-primary font-black uppercase hover:underline tracking-widest">Ver todos</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-muted text-[10px] uppercase text-on-surface-deep font-black tracking-widest border-b border-border-subtle">
          <tr>
            <th className="px-6 py-3 text-center">Rank</th>
            <th className="px-6 py-3">Producto</th>
            <th className="px-6 py-3 text-right">Unidades</th>
            <th className="px-6 py-3 text-right">{type === 'top' ? 'Margen %' : 'Crecimiento'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-sm font-mono">
          {data?.map((item, idx) => (
            <tr key={idx} className="hover:bg-surface-muted:bg-surface-deep/50 transition-colors">
              <td className="px-6 py-4 font-black text-on-surface-deep text-center">#{idx + 1}</td>
              <td className="px-6 py-4 font-bold text-foreground font-display text-sm">{item.top_product}</td>
              <td className="px-6 py-4 text-right font-bold">{item.units_sold}</td>
              <td className={`px-6 py-4 font-black text-right ${type === 'top' ? 'text-success' : item.growth_pct < 0 ? 'text-error' : 'text-success'}`}>
                {type === 'top' ? `${roundPct1(item.gross_margin_pct)}%` : `${roundPct1(item.growth_pct)}%`}
              </td>
            </tr>
          ))}
          {(!data || data.length === 0) && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">
                Sin datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default ProductsCategories;
