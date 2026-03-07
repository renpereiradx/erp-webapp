import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Download,
  Plus
} from 'lucide-react';
import salesAnalyticsService from '@/services/salesAnalyticsService';
import { MOCK_BY_CATEGORY } from '@/services/mocks/salesAnalyticsMock';

const ProductsCategories = () => {
  const [categoriesData, setCategoriesData] = useState(MOCK_BY_CATEGORY.data);
  const [productsData, setProductsData] = useState({ products: [], pagination: { page: 1, total_items: 0, total_pages: 1 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          salesAnalyticsService.getByCategory({ period: 'month' }),
          salesAnalyticsService.getByProduct({ period: 'month', page: 1, page_size: 10 })
        ]);
        
        if (catRes && catRes.success) setCategoriesData(catRes.data);
        if (prodRes && prodRes.success) setProductsData(prodRes.data);
      } catch (error) {
        console.error("Error fetching sales analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePageChange = async (newPage) => {
    try {
      const res = await salesAnalyticsService.getByProduct({ period: 'month', page: newPage, page_size: 10 });
      if (res && res.success) setProductsData(res.data);
    } catch (error) {
      console.error("Error fetching page:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Análisis de Productos y Categorías</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Visualización detallada del rendimiento comercial por SKU y líneas de producto.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors">
            <Calendar size={18} />
            <span>Últimos 30 días</span>
            <TrendingUp size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Top Row: Charts and Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales by Category Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Métricas de Rendimiento</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ventas por Categoría</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#137fec]">{formatCurrency(categoriesData.total_sales)}</p>
                <p className="text-emerald-500 text-sm font-bold flex items-center justify-end">
                  <TrendingUp size={14} className="mr-1" />
                  +12% vs mes anterior
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {categoriesData.categories.map((cat, idx) => (
                <div key={cat.category_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>{cat.category_name}</span>
                    <span>{formatCurrency(cat.sales)} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#137fec] h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${cat.percentage}%`, opacity: 1 - (idx * 0.2) }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performer Card */}
          <div className="bg-[#137fec] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-amber-300" size={20} fill="currentColor" />
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Top Performer</p>
              </div>
              <h2 className="text-2xl font-black mb-1">{categoriesData.categories[0]?.top_product}</h2>
              <p className="text-white/80 text-sm">Producto líder de este periodo</p>
            </div>
            <div className="py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                  <p className="text-white/60 text-[10px] uppercase font-bold">Unidades</p>
                  <p className="text-xl font-bold">{categoriesData.categories[0]?.units_sold}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                  <p className="text-white/60 text-[10px] uppercase font-bold">Margen</p>
                  <p className="text-xl font-bold">{categoriesData.categories[0]?.gross_margin_pct}%</p>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-white text-[#137fec] font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-md">
              <span>Ver Reporte Completo</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Middle Row: Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceTable 
            title="Productos Más Vendidos" 
            icon={<TrendingUp size={18} className="text-emerald-500" />} 
            data={categoriesData.categories} 
            type="top"
          />
          <PerformanceTable 
            title="Bajo Rendimiento" 
            icon={<TrendingDown size={18} className="text-rose-500" />} 
            data={categoriesData.categories} 
            type="bottom"
          />
        </div>

        {/* Bottom Section: Detailed List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Listado Detallado de Productos</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                <Download size={14} />
                Exportar CSV
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#137fec] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors">
                <Plus size={14} />
                Nuevo Producto
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#137fec] transition-colors">Producto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Ventas</th>
                  <th className="px-6 py-4 text-right">Unidades</th>
                  <th className="px-6 py-4 text-right">P. Promedio</th>
                  <th className="px-6 py-4 text-right">Margen %</th>
                  <th className="px-6 py-4 text-right">Crecimiento %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {productsData.products.map((product) => (
                  <tr key={product.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{product.product_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-right">{formatCurrency(product.sales)}</td>
                    <td className="px-6 py-4 text-right">{product.units_sold}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(product.average_price)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-right">{product.gross_margin_pct}%</td>
                    <td className={`px-6 py-4 font-bold text-right ${product.growth_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {product.growth_pct >= 0 ? '+' : ''}{product.growth_pct}%
                    </td>
                  </tr>
                ))}
                {productsData.products.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500 font-medium italic">
                      No se encontraron productos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Mostrando página {productsData.pagination.page} de {productsData.pagination.total_pages} ({productsData.pagination.total_items} productos)
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePageChange(productsData.pagination.page - 1)}
                disabled={productsData.pagination.page === 1} 
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#137fec] text-white text-xs font-bold">
                {productsData.pagination.page}
              </button>
              <button 
                onClick={() => handlePageChange(productsData.pagination.page + 1)}
                disabled={productsData.pagination.page === productsData.pagination.total_pages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
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
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <button className="text-xs text-[#137fec] font-bold hover:underline">Ver todos</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase text-slate-500 font-bold">
          <tr>
            <th className="px-6 py-3 text-center">Rank</th>
            <th className="px-6 py-3">Producto</th>
            <th className="px-6 py-3 text-right">Unidades</th>
            <th className="px-6 py-3 text-right">{type === 'top' ? 'Margen %' : 'Crecimiento'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-400 text-center">#{idx + 1}</td>
              <td className="px-6 py-4 font-semibold">{item.top_product}</td>
              <td className="px-6 py-4 text-right">{item.units_sold}</td>
              <td className={`px-6 py-4 font-bold text-right ${type === 'top' ? 'text-emerald-600' : item.growth_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {type === 'top' ? `${item.gross_margin_pct}%` : `${item.growth_pct}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ProductsCategories;
