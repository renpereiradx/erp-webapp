import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  ShoppingCart,
  Truck,
  RotateCw,
  Clock
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

const StockStatusBadge = ({ status }) => {
  const styles = {
    'En Stock': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Stock Bajo': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'Agotado': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  const dotColors = {
    'En Stock': 'bg-emerald-500',
    'Stock Bajo': 'bg-amber-500',
    'Agotado': 'bg-rose-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || ''}`}>
      <span className={`size-1.5 rounded-full ${dotColors[status]}`}></span>
      {status}
    </span>
  );
};

const StockManagement = () => {
  // Mocks locales para esta pantalla de inventario complementaria
  const stockItems = [
    { id: 1, name: 'Laptop Pro 15" M2', sku: 'SKU-2024-001', category: 'Hardware', stock: 2, status: 'Stock Bajo', days: '5 días', cost: 8500000, total: 17000000 },
    { id: 2, name: 'Mouse Wireless XT', sku: 'SKU-2024-045', category: 'Periféricos', stock: 0, status: 'Agotado', days: '0 días', cost: 250000, total: 0 },
    { id: 3, name: 'Monitor 4K Gaming 27"', sku: 'SKU-2024-012', category: 'Visuales', stock: 45, status: 'En Stock', days: '62 días', cost: 3200000, total: 144000000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Control de Stock</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest mt-2">Gestión de inventario crítico y valorización (Gs.)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#137fec] transition-colors" size={18} />
            <input className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 w-64 transition-all" placeholder="Buscar por SKU o Nombre..." type="text"/>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
            <Filter size={16} /> Parámetros
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#137fec] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95">
            <Plus size={16} /> Reabastecer
          </button>
        </div>
      </div>

      {/* Critical Alert Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-10 p-10 rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 size-64 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="size-24 shrink-0 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
            <AlertTriangle size={48} />
          </div>
          <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-xl bg-rose-600 text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-sm">Prioridad Alta</div>
            <h3 className="text-3xl font-black text-rose-950 dark:text-rose-100 leading-none uppercase tracking-tighter">Acción Necesaria: 17 SKU Críticos</h3>
            <p className="text-rose-700 dark:text-rose-300 text-[11px] font-black uppercase tracking-[0.15em] opacity-80 leading-relaxed">Se detectaron desviaciones en los niveles de stock de seguridad. <br/>Riesgo inminente de pérdida de ventas por falta de disponibilidad.</p>
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-4xl font-black text-rose-600 font-mono tracking-tighter leading-none">{formatPYG(54200000)}</span>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Presupuesto Reposición</span>
            </div>
          </div>
          <button className="shrink-0 px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-rose-200/50 active:scale-95 group-hover:shadow-rose-500/20">
            Comenzar Carga
          </button>
        </div>

        <div className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-[#137fec] transition-all">
          <div className="flex justify-between items-start">
            <div className="size-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-[#137fec] shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-3">
              <TrendingUp size={32} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border border-emerald-100/50">+4.5%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">vs mes ant.</span>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] leading-none">Valor Activo Fijo</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-mono mt-4 leading-none">{formatPYG(1840500000)}</p>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 h-2.5 rounded-full mt-8 overflow-hidden shadow-inner border border-slate-100/50 dark:border-slate-700/50 p-0.5">
            <div className="bg-[#137fec] h-full rounded-full shadow-[0_0_15px_rgba(19,127,236,0.4)] transition-all duration-[2500ms] ease-out" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Advanced Inventory Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group/table">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30">
          <h2 className="text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-[0.3em] leading-none">Matriz Operativa de Existencias</h2>
          <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500"></span> Óptimo</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span> Crítico</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span> Nulo</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6 w-1/3">Producto / Segmento</th>
                <th className="px-4 py-6 w-48 font-mono">Referencia</th>
                <th className="px-4 py-6 text-center w-32">Cant.</th>
                <th className="px-4 py-6 text-center">Estatus</th>
                <th className="px-4 py-6 text-right font-mono">Costo Unit.</th>
                <th className="px-4 py-6 text-right font-mono">Valuación Total</th>
                <th className="px-10 py-6 text-center w-24">...</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-mono text-[11px]">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all cursor-pointer group/row">
                  <td className="px-10 py-7 whitespace-nowrap">
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover/row:border-[#137fec]/50 group-hover/row:shadow-md transition-all">
                        <Package className="text-slate-400 group-hover/row:text-[#137fec] transition-colors" size={24} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[12px] group-hover/row:text-[#137fec] transition-colors font-sans leading-none">{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none font-sans opacity-70">{item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-7 font-black text-slate-500 tracking-tighter uppercase text-[10px]">{item.sku}</td>
                  <td className="px-4 py-7 text-center">
                    <span className={`font-black text-base tracking-tighter ${item.stock === 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{item.stock}</span>
                    <span className="text-slate-400 text-[9px] ml-1.5 uppercase font-black opacity-50 font-sans">unidades</span>
                  </td>
                  <td className="px-4 py-7 text-center whitespace-nowrap">
                    <StockStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-7 text-right font-black text-slate-600 dark:text-slate-400 tracking-tighter text-[12px]">{formatPYG(item.cost)}</td>
                  <td className="px-4 py-7 text-right font-black text-[#137fec] text-[13px] tracking-tighter drop-shadow-sm">{formatPYG(item.total)}</td>
                  <td className="px-10 py-7 text-center">
                    <button className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#137fec] hover:border-[#137fec]/50 transition-all shadow-sm active:scale-90">
                      {item.status === 'Agotado' ? <ShoppingCart size={18} /> : <MoreVertical size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-10 py-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/20 dark:bg-slate-950/20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Auditoría en tiempo real • {stockItems.length} de 264 SKU visibles</p>
          <div className="flex gap-3">
            <button className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 transition-all hover:bg-white"><ChevronLeft size={16} /></button>
            <button className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-[#137fec] hover:bg-blue-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Intelligence Micro-stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
        {[
          { label: 'Último Cierre', val: 'Mar 08, 14:25', icon: Clock, color: 'text-slate-400' },
          { label: 'Precisión Auditoría', val: '98.4% CERT', icon: RotateCw, color: 'text-emerald-500' },
          { label: 'En Tránsito (Logística)', val: '4 Pedidos Gs.', icon: Truck, color: 'text-[#137fec]' },
          { label: 'Indice de Rotación', val: '12.5x ANUAL', icon: Activity, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 group hover:border-[#137fec] transition-all cursor-help shadow-sm">
            <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-inner group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none opacity-70">{stat.label}</p>
              <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white leading-none tracking-wider">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockManagement;
