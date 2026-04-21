import React from 'react';
import { Filter, Search } from 'lucide-react';

/**
 * Filter ribbon for accounts payable dashboard.
 * Polished to match Stitch perfectly with rounded-xl.
 */
const FilterRibbon = ({ filters = {}, onFilterChange = () => {} }) => {
  const handleChange = (key, value) => {
    if (typeof onFilterChange === 'function') {
      onFilterChange(key, value);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-6 overflow-hidden font-display">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Periodo</label>
        <select 
          value={filters.period || 'month'}
          onChange={(e) => handleChange('period', e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/10 min-w-[180px] p-2.5 outline-none transition-all cursor-pointer"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="quarter">Último Trimestre</option>
          <option value="year">Año Fiscal</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Moneda</label>
        <select 
          value={filters.currency || 'PYG'}
          onChange={(e) => handleChange('currency', e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm font-medium focus:ring-4 focus:ring-primary/10 p-2.5 outline-none transition-all cursor-pointer"
        >
          <option value="PYG">PYG - Guaraní</option>
          <option value="USD">USD - Dólar</option>
        </select>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Filtros avanzados">
          <Filter className="w-5 h-5" />
        </button>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Buscar..."
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-primary/30 rounded-lg text-sm outline-none transition-all w-48 focus:w-64"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterRibbon;
