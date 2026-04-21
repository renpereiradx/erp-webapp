import React from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Table showing major suppliers with the highest debt.
 * 100% fidelity to Stitch design with high-density layout and rounded-xl.
 */
const SuppliersDebtTable = ({ vendors = [], pagination = {}, onPageChange }) => {
  const formatCurrency = (val) => {
    return formatPYG(val);
  };

  const { page = 1, totalPages = 1, totalItems = 0 } = pagination;

  return (
    <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-xl overflow-hidden mb-8 transition-all hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
      {/* ... header unchanged ... */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">Proveedores con Mayor Deuda</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">Listado de los principales proveedores</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-medium w-full focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all" 
              placeholder="Filtrar por nombre..." 
              type="text"
            />
          </div>
        </div>
      </div>
      
      {/* ... table content unchanged ... */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Nombre del Proveedor</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-right">Saldo Total</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-right">Monto Vencido</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {vendors.map(vendor => (
              <tr key={vendor.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {vendor.name.charAt(0)}
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{vendor.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(vendor.totalBalance)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-sm font-mono font-black tabular-nums ${vendor.overdueAmount > 0 ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(vendor.overdueAmount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 dark:bg-slate-800/20 gap-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Mostrando {vendors.length} de {totalItems || vendors.length} proveedores
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors" 
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
            <button 
              key={p}
              onClick={() => onPageChange(p)}
              className={`size-9 rounded-xl text-xs font-black transition-all ${p === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800'}`}
            >
              {p}
            </button>
          ))}

          <button 
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuppliersDebtTable;
