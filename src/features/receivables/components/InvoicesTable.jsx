import React from 'react';
import { Filter, SortAsc, MoreVertical } from 'lucide-react';

const InvoicesTable = ({ invoices = [], outstandingAmount = 0 }) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
      <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white uppercase tracking-tight">Facturas Pendientes</h2>
        <div className="flex gap-3">
          <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            <Filter size={14} /> Filtrar
          </button>
          <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            <SortAsc size={14} /> Ordenar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f9fafb] dark:bg-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
            <tr>
              <th className="px-6 py-4">Nº Factura</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Vencimiento</th>
              <th className="px-6 py-4 text-right">Monto Original</th>
              <th className="px-6 py-4 text-right">Saldo Pendiente</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-800 text-[13px]">
            {invoices.map((inv, idx) => (
              <tr key={idx} className="hover:bg-[#f9fafb] dark:hover:bg-gray-800/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-primary hover:underline cursor-pointer">{inv.id || `INV-2023-00${idx+1}`}</td>
                <td className="px-6 py-4 text-[#111418] dark:text-gray-300 font-medium">{inv.date || 'Oct 12, 2023'}</td>
                <td className="px-6 py-4 text-[#111418] dark:text-gray-300 font-medium">{inv.dueDate || 'Nov 12, 2023'}</td>
                <td className="px-6 py-4 text-right font-mono text-gray-500">{inv.amount || '$10,000'}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-[#111418] dark:text-white">{inv.balance || '$10,000'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    inv.status?.toLowerCase().includes('overdue') 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {inv.status || 'Vencido > 90'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-opacity p-1">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-[#f0f2f4] dark:border-gray-800 bg-[#f9fafb] dark:bg-gray-800/30 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        <p>Mostrando {invoices.length} de 12 facturas</p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded bg-white dark:bg-gray-700 border border-[#f0f2f4] dark:border-gray-600 text-gray-500 hover:text-[#111418] dark:hover:text-white transition-colors">Anterior</button>
          <button className="px-3 py-1.5 rounded bg-white dark:bg-gray-700 border border-[#f0f2f4] dark:border-gray-600 text-gray-500 hover:text-[#111418] dark:hover:text-white transition-colors">Siguiente</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;