import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

/**
 * Filter ribbon for accounts payable dashboard.
 * Includes period, vendor, priority, and currency filters.
 */
const FilterRibbon = () => {
  return (
    <div className="payables-dashboard__filter-ribbon">
      <div className="payables-dashboard__filter-group">
        <label className="payables-dashboard__filter-label">Periodo</label>
        {/* Placeholder Select until fully integrated with data */}
        <select className="input input--small min-w-[180px]">
          <option>Este Mes (Mayo 2024)</option>
          <option>Último Trimestre</option>
          <option>Año Fiscal 2024</option>
        </select>
      </div>
      
      <div className="payables-dashboard__filter-group">
        <label className="payables-dashboard__filter-label">Proveedor</label>
        <select className="input input--small min-w-[220px]">
          <option>Todos los proveedores</option>
          <option>Global Logistics S.A.</option>
          <option>Tech Solutions Inc.</option>
          <option>Office Depot Corp.</option>
        </select>
      </div>
      
      <div className="payables-dashboard__filter-group">
        <label className="payables-dashboard__filter-label">Prioridad</label>
        <div className="flex gap-2">
          {/* Using Badge-like styles via class names or small buttons */}
          <button className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold border border-primary/20">Alta</button>
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-transparent hover:border-slate-300">Media</button>
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-transparent hover:border-slate-300">Baja</button>
        </div>
      </div>
      
      <div className="payables-dashboard__filter-group">
        <label className="payables-dashboard__filter-label">Moneda</label>
        <select className="input input--small">
          <option>USD - Dólar</option>
          <option>MXN - Peso</option>
          <option>EUR - Euro</option>
        </select>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
          <Filter className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
          <Search className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default FilterRibbon;
