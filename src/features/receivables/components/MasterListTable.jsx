import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

const SORTABLE_COLUMNS = [
  { key: 'id', label: 'receivables.master.table.id', fallback: 'ID Factura' },
  { key: 'client', label: 'receivables.master.table.client', fallback: 'Cliente' },
  { key: 'sale_date', label: 'receivables.master.table.sale_date', fallback: 'Emisión' },
  { key: 'due_date', label: 'receivables.master.table.due_date', fallback: 'Vencimiento' },
  { key: 'original_amt', label: 'receivables.master.table.original_amt', align: 'text-right', fallback: 'Monto Total' },
  { key: 'pending_amt', label: 'receivables.master.table.pending_amt', align: 'text-right', fallback: 'Imp. Pendiente' },
  { key: 'status', label: 'receivables.master.table.status', align: 'text-center', fallback: 'Estado' },
];

/**
 * Tabla principal para la lista maestra de cuentas por cobrar.
 * Optimizada para alta densidad y 1920x1080.
 */
const MasterListTable = ({
  invoices = [],
  loading,
  pagination = {},
  sorting = {},
  onPageChange,
  onPageSizeChange,
  onSort,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const { page = 1, pageSize = 20, totalItems = 0, totalPages = 0 } = pagination;
  const { sortBy, sortOrder } = sorting;

  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalItems) || safeInvoices.length;

  const getStatusVariant = (statusColor) => {
    const colorMap = {
      red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-800/50',
      yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
      orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-100 dark:border-orange-900/50',
      blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
      green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
      gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    };
    return colorMap[statusColor] || colorMap.gray;
  };

  return (
    <div className="bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Toolbar inside Grid */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mostrando <span className="text-slate-900 dark:text-white font-black">{startItem}-{endItem}</span> de <span className="text-slate-900 dark:text-white font-black">{totalItems || safeInvoices.length}</span> registros
        </div>
        <div className="flex gap-2.5">
          <button className="p-1.5 text-slate-400 hover:text-primary transition-all" title="Configurar Columnas">
            <Settings size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-primary transition-all" title="Actualizar" onClick={onRefresh}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-800/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
              <th className="px-4 py-4 w-12 text-center">
                <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer" type="checkbox" />
              </th>
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${col.align === 'text-right' ? 'text-right' : col.align === 'text-center' ? 'text-center' : ''}`}
                  onClick={() => onSort?.(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'text-right' ? 'justify-end' : col.align === 'text-center' ? 'justify-center' : ''}`}>
                    {t(col.label, col.fallback)}
                    {sortBy === col.key && (
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-20 bg-white dark:bg-[#1b2633]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('receivables.loading.generic', 'Cargando registros...')}</p>
                  </div>
                </td>
              </tr>
             ) : safeInvoices.length === 0 ? (
               <tr>
                 <td colSpan={9} className="text-center py-20 text-slate-400 font-medium italic">
                   {t('receivables.empty', 'No se encontraron registros en el periodo seleccionado')}
                 </td>
               </tr>
            ) : (
              safeInvoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                  <td className="px-4 py-3.5 text-center">
                    <input className="rounded border-slate-300 text-primary focus:ring-primary/25 size-4 cursor-pointer mx-auto" type="checkbox" />
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      className="text-primary font-mono font-bold hover:underline text-[13px]"
                      onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}
                    >
                      #{inv.id}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-7 rounded-full flex items-center justify-center text-[10px] font-black border border-primary/5 uppercase"
                        style={{
                          backgroundColor: inv.clientColor || '#eff6ff',
                          color: '#1d4ed8'
                        }}
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <button 
                        className="text-slate-900 dark:text-white font-extrabold hover:text-primary hover:underline transition-colors text-left"
                        onClick={(e) => { e.preventDefault(); navigate(`/receivables/client-profile/${inv.clientId || 'CLI-001'}`); }}
                      >
                        {inv.clientName}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium font-mono text-xs whitespace-nowrap">{inv.issueDate}</td>
                  <td className={`px-4 py-3.5 font-bold font-mono text-xs whitespace-nowrap ${inv.statusColor === 'red' ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}>{inv.dueDate}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-bold text-right font-mono text-[13px] whitespace-nowrap">{formatPYG(inv.originalAmt)}</td>
                  <td className={`px-4 py-3.5 text-right font-black font-mono text-[13px] whitespace-nowrap ${inv.pendingAmt > 0 && inv.statusColor === 'red' ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}>{formatPYG(inv.pendingAmt)}</td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusVariant(inv.statusColor)}`}>
                      {inv.status === 'OVERDUE' ? 'VENCIDO' : 
                       inv.status === 'PENDING' ? 'PENDIENTE' : 
                       inv.status === 'PARTIAL' ? 'P. PARCIAL' : 
                       inv.status === 'PAID' ? 'PAGADO' : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 p-4 flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <span>Filas por página:</span>
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[10px] focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:border-primary/30"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange?.(e.target.value)}
          >
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t('receivables.master.pagination.page_info', { page, total: totalPages || 1 }, `Página ${page} de ${totalPages || 1}`)}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterListTable;
