import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes
 */
const formatPYG = (value) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(value).replace('PYG', 'Gs.');
};

const KPICard = ({ title, subtitle, value, highlight, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
  };

  // Fuente dinámica para KPIs de categoría
  const fontSizeClass = getDynamicFontClass(value, { 
    baseClass: 'text-2xl', 
    mediumClass: 'text-xl', 
    smallClass: 'text-lg' 
  });

  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-[#137fec] group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        {highlight && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded">
            {highlight}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 leading-none">{title}</p>
      <h3 className="text-base md:text-lg font-black mt-2 uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate">{subtitle}</h3>
      <p className={`font-black text-slate-900 dark:text-white mt-3 font-mono tracking-tighter leading-none ${fontSizeClass}`}>
        {typeof value === 'number' ? formatPYG(value) : value}
      </p>
    </div>
  );
};

const CategoryProfitability = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getCategories', period);

  if (loading) return <div className="p-16 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest text-[10px]">Analizando rendimiento por familias de producto...</div>;
  if (error) return <div className="p-10 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl m-6 font-black uppercase tracking-tight text-xs">Error operativo: {error}</div>;

  const { categories = [], summary = {} } = data || {};

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white leading-none">Rentabilidad por Categoría</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Auditoría financiera de márgenes operativos (Gs.)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-1 sm:flex-none items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-4 md:px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                  period === p 
                    ? 'bg-white dark:bg-slate-700 shadow-md text-[#137fec]' 
                    : 'text-slate-500 hover:text-[#137fec]'
                }`}
              >
                {p === 'month' ? 'Mes' : p === 'quarter' ? 'Trim.' : 'Año'}
              </button>
            ))}
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#137fec] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all">
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <KPICard 
          title="Líder en Beneficio" 
          subtitle={summary?.most_profitable_name || 'Sin datos'} 
          value={(summary?.total_profit || 0) * 0.42} 
          highlight="+12.5% UP" 
          icon={TrendingUp} 
          color="blue" 
        />
        <KPICard 
          title="Márgenes Críticos" 
          subtitle={summary?.least_profitable_name || 'Sin datos'} 
          value="8.4% BRUTO" 
          highlight="ALTA PRIORIDAD" 
          icon={AlertTriangle} 
          color="orange" 
        />
        <KPICard 
          title="Consolidado Total" 
          subtitle="Rendimiento Global" 
          value={summary?.total_profit || 0} 
          icon={Wallet} 
          color="indigo" 
        />
      </div>

      {/* Main Analysis Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 dark:bg-slate-950/30">
          <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] text-[10px] leading-none">Matriz de Desempeño</h2>
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input className="w-full pl-10 pr-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Buscar categoría..." />
          </div>
        </div>

        {/* Mobile: Category Card List */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {categories?.map((cat) => (
            <div key={cat.category_id} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{cat.category_name}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{cat.product_count} SKUs Auditados</span>
                </div>
                <span className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">{cat.gross_margin_pct}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Impacto Rentabilidad</span>
                    <span>{cat.gross_margin_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${cat.gross_margin_pct}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volumen Ventas</span>
                  <span className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-300">{cat.units_sold} UDS</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Matrix Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Categoría / Segmento</th>
                <th className="px-8 py-5 text-center">SKUs</th>
                <th className="px-8 py-5 text-right font-mono">Volumen</th>
                <th className="px-8 py-5">Contribución Ingresos</th>
                <th className="px-8 py-5">Impacto Rentabilidad</th>
                <th className="px-8 py-5 text-right">M. Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {categories?.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] group-hover:text-[#137fec] transition-colors">{cat.category_name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sector Operativo</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-black font-mono text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200/50">
                      {cat.product_count || 0}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-mono font-black tracking-tighter text-slate-600 dark:text-slate-400">{cat.units_sold}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#137fec]/30 h-full" style={{ width: '42%' }}></div>
                      </div>
                      <span className="font-mono font-black text-slate-400 text-[10px] w-8">42%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-1000" style={{ width: `${cat.gross_margin_pct}%` }}></div>
                      </div>
                      <span className="font-mono font-black text-emerald-500 text-[10px] w-8">{cat.gross_margin_pct}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">{cat.gross_margin_pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 md:px-8 py-5 bg-slate-50/30 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Total: {categories?.length || 0} Familias Auditadas</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 transition-all"><ChevronLeft size={14} /></button>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[#137fec] hover:bg-blue-50 transition-all shadow-sm"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Heatmap Section - Reorganización para Mobile */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-10 group hover:border-[#137fec]/50 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 md:mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 md:p-4 bg-[#137fec]/10 rounded-2xl text-[#137fec]">
              <Layers size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white leading-none">Eficiencia Real</h2>
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Ingresos vs Rentabilidad Neta</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#137fec]/30"></span>
              <span className="text-slate-400">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-emerald-500">Beneficio</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 md:gap-y-10">
          {categories?.slice(0, 4).map((cat) => (
            <div key={cat.category_id} className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">{cat.category_name}</span>
                <span className="text-[8px] md:text-[9px] font-mono font-black text-slate-400 tracking-tighter uppercase truncate max-w-[120px]">{formatPYG(cat.revenue)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2.5 md:h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-[#137fec]/30 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="h-2.5 md:h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${cat.gross_margin_pct}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryProfitability;
