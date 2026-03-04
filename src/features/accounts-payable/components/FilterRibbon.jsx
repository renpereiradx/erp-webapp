import React from 'react';
import { Filter, Search } from 'lucide-react';

/**
 * Filter ribbon for accounts payable dashboard.
 * Polished to match Stitch perfectly with rounded-xl.
 */
const FilterRibbon = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-6 overflow-hidden">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Periodo</label>
        <select className="bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/10 min-w-[180px] p-2.5 outline-none transition-all">
          <option>Este Mes (Mayo 2024)</option>
          <option>Último Trimestre</option>
          <option>Año Fiscal 2024</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Proveedor</label>
        <select className="bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/10 min-w-[220px] p-2.5 outline-none transition-all">
          <option>Todos los proveedores</option>
          <option>Global Logistics S.A.</option>
          <option>Tech Solutions Inc.</option>
          <option>Office Depot Corp.</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Prioridad</label>
        <div className="flex gap-2">
          <span className="px-3.5 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">Alta</span>
          <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-transparent cursor-pointer hover:border-slate-300 transition-colors">Media</span>
          <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-transparent cursor-pointer hover:border-slate-300 transition-colors">Baja</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Moneda</label>
        <select className="bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/10 p-2.5 outline-none transition-all">
          <option>USD - Dólar</option>
          <option>MXN - Peso</option>
          <option>EUR - Euro</option>
        </select>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
          <Filter className="w-5 h-5" />
        </button>
        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FilterRibbon;
