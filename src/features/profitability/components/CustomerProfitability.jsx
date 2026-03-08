import React, { useState } from 'react';
import { useProfitability } from '../hooks/useProfitability';
import { getDynamicFontClass } from '@/utils/ui';
import { 
  Search, 
  Users, 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  BarChart3,
  Mail,
  Phone,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
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

const SegmentBadge = ({ segment }) => {
  const styles = {
    PLATINUM: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    GOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    SILVER: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    BRONZE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase tracking-tighter ${styles[segment] || styles.SILVER}`}>
      {segment}
    </span>
  );
};

const CustomerProfitability = () => {
  const [params, setParams] = useState({ period: 'month', page: 1 });
  const { data, loading, error } = useProfitability('getCustomers', params);

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Analizando rentabilidad de clientes...</div>;
  if (error) return <div className="p-8 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-xl m-4 font-bold uppercase tracking-tight text-xs">Error: {error}</div>;

  const { customers, summary } = data;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase leading-none">Rentabilidad Clientes</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">Segmentación y márgenes corporativos en Gs.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button className="flex-1 md:flex-none h-10 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={14} /> <span className="hidden sm:inline">Período:</span> {params.period === 'month' ? 'Mes' : params.period}
          </button>
          <button className="flex-1 md:flex-none h-10 flex items-center justify-center gap-2 px-4 bg-[#137fec] text-white font-black uppercase tracking-widest text-[10px] rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
            <Download size={14} /> Reporte
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-[#137fec] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Clientes Activos</p>
            <Users className="text-[#137fec]" size={18} />
          </div>
          <p className="text-slate-900 dark:text-slate-100 text-3xl font-black font-mono tracking-tighter leading-none">{summary.active_customers}</p>
          <div className="flex items-center gap-1 mt-4 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={12} /> +5.2% CREC.
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-[#137fec] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Ticket Promedio</p>
            <CreditCard className="text-[#137fec]" size={18} />
          </div>
          <p className={`text-slate-900 dark:text-slate-100 font-black font-mono tracking-tighter leading-none ${getDynamicFontClass(summary.average_customer_value, { baseClass: 'text-2xl', mediumClass: 'text-xl', smallClass: 'text-lg' })}`}>
            {formatPYG(summary.average_customer_value)}
          </p>
          <div className="flex items-center gap-1 mt-4 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={12} /> +1.8% VALOR
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-[#137fec] transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Contribución Pareto</p>
            <BarChart3 className="text-[#137fec]" size={18} />
          </div>
          <p className="text-slate-900 dark:text-slate-100 text-3xl font-black font-mono tracking-tighter leading-none">{summary.top_customers_pct}%</p>
          <div className="flex items-center gap-1 mt-4 text-rose-500 text-[10px] font-black uppercase tracking-widest">
            <TrendingDown size={12} /> -0.5% VARIACIÓN
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Main Table / Card List */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-[0.2em] leading-none">Desglose Operativo</h3>
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Filtrar por nombre..." />
            </div>
          </div>

          {/* Mobile: Card List */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map((c) => (
              <div key={c.customer_id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase">{c.customer_name}</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">ID: {c.customer_id}</span>
                  </div>
                  <SegmentBadge segment={c.segment} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresos Totales</p>
                    <p className="text-xs font-black font-mono text-slate-900 dark:text-slate-100">{formatPYG(c.total_revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margen Bruto</p>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">{c.gross_margin_pct}%</span>
                      <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${c.gross_margin_pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.15em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5">Cliente / Identificador</th>
                  <th className="px-6 py-5">Nivel Segmento</th>
                  <th className="px-6 py-5 text-right">Compras</th>
                  <th className="px-6 py-5 text-right">Ingresos (Gs.)</th>
                  <th className="px-6 py-5 text-right">M. Bruto %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-slate-900 dark:text-slate-100 group-hover:text-[#137fec] text-xs uppercase tracking-tight transition-colors">{c.customer_name}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">REF: {c.customer_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <SegmentBadge segment={c.segment} />
                    </td>
                    <td className="px-6 py-5 text-right font-mono font-black text-xs text-slate-600 dark:text-slate-400">{c.total_purchases}</td>
                    <td className="px-6 py-5 text-right font-black font-mono text-sm text-slate-900 dark:text-slate-100 tracking-tighter">{formatPYG(c.total_revenue)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">{c.gross_margin_pct}%</span>
                        <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-[1500ms] ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${c.gross_margin_pct}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-4 md:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Página 1 de 25</p>
            <div className="flex gap-2">
              <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 transition-opacity"><ChevronLeft size={14} /></button>
              <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[#137fec] hover:bg-blue-50 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Side Panels - Apilados en mobile */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-[#137fec] transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2 leading-none">
                <Trophy className="text-amber-500" size={16} /> Elite Platinum
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {customers.slice(0, 3).map((c, i) => (
                <div key={c.customer_id} className="flex items-center justify-between group/item cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-200 dark:text-slate-800 text-2xl font-mono leading-none">{i + 1}</span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase truncate transition-colors">{c.customer_name}</span>
                      <span className="text-[9px] font-mono font-black text-emerald-500 tracking-tighter uppercase">{formatPYG(c.gross_profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group/risk hover:border-rose-500/50 transition-colors">
            <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-950/20">
              <h3 className="font-black text-rose-700 dark:text-rose-400 text-[10px] uppercase tracking-[0.25em] flex items-center gap-2 leading-none">
                <AlertTriangle className="text-rose-600 animate-pulse" size={16} /> Retención Crítica
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center transition-all hover:shadow-md">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase leading-none">Inactivos</span>
                  <span className="text-[9px] font-mono font-black text-rose-500 uppercase mt-1">2 Clientes</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="size-8 rounded-full bg-[#137fec]/10 text-[#137fec] flex items-center justify-center hover:bg-[#137fec] hover:text-white transition-all shadow-sm"><Mail size={12} /></button>
                  <button className="size-8 rounded-full bg-[#137fec]/10 text-[#137fec] flex items-center justify-center hover:bg-[#137fec] hover:text-white transition-all shadow-sm"><Phone size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfitability;
