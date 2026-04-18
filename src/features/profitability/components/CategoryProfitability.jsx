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
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes (técnico)
 */
const formatPYG = (value) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(value);
};

const KPICard = ({ title, subtitle, value, highlight, icon: Icon, variant = 'blue' }) => {
  const variantMap = {
    blue: { bg: 'bg-primary/10', text: 'text-primary' },
    orange: { bg: 'bg-warning/10', text: 'text-warning' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  };

  const fontSizeClass = getDynamicFontClass(value, { 
    baseClass: 'text-3xl', 
    mediumClass: 'text-2xl', 
    smallClass: 'text-xl' 
  });

  return (
    <div className="bg-white p-8 rounded-xl border border-border-subtle shadow-fluent-2 transition-all hover:shadow-fluent-8 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-lg ${variantMap[variant].bg} ${variantMap[variant].text} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        {highlight && (
          <span className="text-[10px] font-bold uppercase tracking-tight bg-success/10 text-success px-2.5 py-1 rounded">
            {highlight}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-none">{title}</p>
      <h3 className="text-sm font-bold mt-2 uppercase tracking-tight text-slate-900 truncate">{subtitle}</h3>
      <div className="flex items-baseline gap-1 mt-4">
        {typeof value === 'number' && <span className="text-xs font-bold text-slate-400">Gs.</span>}
        <p className={`font-bold text-slate-900 font-mono tracking-tighter leading-none ${fontSizeClass}`}>
          {typeof value === 'number' ? formatPYG(value) : value}
        </p>
      </div>
    </div>
  );
};

const CategoryProfitability = () => {
  const [period, setPeriod] = useState('month');
  const { data, loading, error } = useProfitability('getCategories', period);

  if (loading) return (
    <div className="p-20 text-center animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Analizando familias de productos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center animate-in slide-in-from-top-4 duration-500">
      <div className="max-w-md mx-auto bg-[#fde7e9] border border-[#fde7e9] p-6 rounded-xl text-[#a4262c]">
        <h4 className="font-bold text-sm uppercase mb-2">Error de Sincronización</h4>
        <p className="text-xs font-medium">{error}</p>
      </div>
    </div>
  );

  const { categories = [], summary = {} } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start gap-6 border-l-4 border-primary pl-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
            <span>Rentabilidad</span> <ChevronRight size={10} /> <span className="text-primary">Categorías</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-none">Rendimiento por Categoría</h1>
          <p className="text-sm font-medium text-slate-500 mt-3 max-w-lg">Auditoría técnica de márgenes operativos y contribución por familia de productos en Guaraníes (Gs.)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-1 sm:flex-none items-center bg-[#f3f2f1] p-1 rounded-lg border border-border-subtle">
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-bold uppercase tracking-tight rounded transition-all ${
                  period === p 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p === 'month' ? 'Mes' : p === 'quarter' ? 'Trim.' : 'Año'}
              </button>
            ))}
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
            <Download size={16} /> <span>EXPORTAR</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <KPICard 
          title="Líder en Beneficio" 
          subtitle={summary?.most_profitable_name || 'Sin datos'} 
          value={(summary?.total_profit || 0) * 0.42} 
          highlight="+12.5% UP" 
          icon={TrendingUp} 
          variant="blue" 
        />
        <KPICard 
          title="Márgenes Críticos" 
          subtitle={summary?.least_profitable_name || 'Sin datos'} 
          value="8.4% BRUTO" 
          highlight="ALTA PRIORIDAD" 
          icon={AlertTriangle} 
          variant="orange" 
        />
        <KPICard 
          title="Consolidado Total" 
          subtitle="Rendimiento Global" 
          value={summary?.total_profit || 0} 
          icon={Wallet} 
          variant="indigo" 
        />
      </div>

      {/* Main Analysis Data Grid */}
      <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-6 bg-[#f3f2f1]/30">
          <h2 className="font-bold text-slate-900 uppercase tracking-[0.2em] text-xs leading-none">Matriz de Desempeño Operativo</h2>
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input className="w-full pl-11 pr-4 py-2.5 bg-white border border-border-base rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Buscar categoría por nombre..." />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-border-subtle text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-8 py-5">Categoría / Segmento</th>
                <th className="px-6 py-5 text-center">SKUs</th>
                <th className="px-6 py-5 text-right font-mono">Volumen</th>
                <th className="px-8 py-5">Contribución Ingresos</th>
                <th className="px-8 py-5">Impacto Rentabilidad</th>
                <th className="px-8 py-5 text-right">M. Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {categories?.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-[#f3f2f1]/50 transition-colors group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 leading-none tracking-tight group-hover:text-primary transition-colors uppercase text-sm">{cat.category_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sector Operativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="px-3 py-1 bg-[#f3f2f1] rounded font-bold font-mono text-[10px] text-slate-600 border border-transparent group-hover:border-border-base transition-colors">
                      {cat.product_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right font-mono font-bold text-slate-700">{cat.units_sold}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-[#f3f2f1] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary/30 h-full" style={{ width: '42%' }}></div>
                      </div>
                      <span className="font-mono font-bold text-slate-400 text-[10px] w-8">42%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-[#f3f2f1] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-success h-full shadow-[0_0_8px_rgba(16,124,16,0.3)] transition-all duration-1000" style={{ width: `${cat.gross_margin_pct}%` }}></div>
                      </div>
                      <span className="font-mono font-bold text-success text-[10px] w-8">{cat.gross_margin_pct}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-bold font-mono text-sm text-success">{cat.gross_margin_pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Style */}
        <div className="px-8 py-5 bg-[#f3f2f1]/20 border-t border-border-subtle flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total: {categories?.length || 0} Familias Auditadas</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-border-base bg-white text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
            <button className="p-2 rounded-lg border border-border-base bg-white text-primary hover:bg-slate-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Efficiency Section */}
      <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 p-10 group transition-all hover:shadow-fluent-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <Layers size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-900 leading-none">Eficiencia de Portafolio</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Relación Ingresos vs Rentabilidad Neta</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-primary/20"></span>
              <span className="text-slate-400">Ingresos</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-success shadow-[0_0_8px_rgba(16,124,16,0.3)]"></span>
              <span className="text-success">Beneficio</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
          {categories?.slice(0, 4).map((cat) => (
            <div key={cat.category_id} className="space-y-5">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-900">{cat.category_name}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">Gs. {formatPYG(cat.revenue)}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="h-1.5 w-full bg-[#f3f2f1] rounded-full overflow-hidden">
                  <div className="bg-primary/20 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="h-1.5 w-full bg-[#f3f2f1] rounded-full overflow-hidden">
                  <div className="bg-success h-full rounded-full shadow-sm transition-all duration-1000" style={{ width: `${cat.gross_margin_pct}%` }}></div>
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
