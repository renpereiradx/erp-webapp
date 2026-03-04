import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Columns, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

const SORTABLE_COLUMNS = [
  { key: 'id', label: 'receivables.master.table.id', fallback: 'ID' },
  { key: 'client', label: 'receivables.master.table.client', fallback: 'Cliente' },
  { key: 'sale_date', label: 'receivables.master.table.sale_date', fallback: 'Fecha Emisión' },
  { key: 'due_date', label: 'receivables.master.table.due_date', fallback: 'Vencimiento' },
  { key: 'original_amt', label: 'receivables.master.table.original_amt', align: 'text-right', fallback: 'Monto Original' },
  { key: 'pending_amt', label: 'receivables.master.table.pending_amt', align: 'text-right', fallback: 'Saldo Pendiente' },
  { key: 'status', label: 'receivables.master.table.status', align: 'text-center', fallback: 'Estado' },
];

/**
 * Tabla principal para la lista maestra de cuentas por cobrar.
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
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[statusColor] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col flex-1">
      {/* Toolbar inside Grid */}
      <div className="px-4 py-3 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="text-sm text-[#617589] font-medium">
          Mostrando <span className="text-[#111418] dark:text-white font-bold">{startItem}-{endItem}</span> de <span className="text-[#111418] dark:text-white font-bold">{totalItems || safeInvoices.length}</span> registros
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Actualizar" onClick={onRefresh}>
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
          <button className="p-1.5 text-[#617589] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Columnas">
            <span className="material-symbols-outlined text-[20px]">view_column</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white dark:bg-[#1a202c] border-b border-[#e5e7eb] dark:border-gray-700">
              <th className="py-3 px-4 w-12 text-center">
                <input className="fluent-checkbox cursor-pointer" type="checkbox" />
              </th>
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 text-xs font-semibold text-[#617589] uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${col.align === 'text-right' ? 'text-right' : col.align === 'text-center' ? 'text-center' : ''}`}
                  onClick={() => onSort?.(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'text-right' ? 'justify-end' : col.align === 'text-center' ? 'justify-center' : ''}`}>
                    {t(col.label, col.fallback)}
                    {sortBy === col.key && (
                      <span className="material-symbols-outlined text-[16px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f4] dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="size-8 animate-spin text-primary opacity-50" />
                    <p className="text-sm font-semibold text-[#617589]">{t('receivables.loading.generic', 'Cargando...')}</p>
                  </div>
                </td>
              </tr>
             ) : safeInvoices.length === 0 ? (
               <tr>
                 <td colSpan={9} className="text-center py-12">
                   <p className="text-sm text-[#617589] font-medium">{t('receivables.empty', 'No se encontraron registros')}</p>
                 </td>
               </tr>
            ) : (
              safeInvoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-[#f8faff] dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <input className="fluent-checkbox cursor-pointer mx-auto" type="checkbox" />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      className="text-primary font-medium hover:underline text-sm"
                      onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}
                    >
                      #{inv.id}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: inv.clientColor || '#eff6ff',
                          color: '#1d4ed8'
                        }}
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <button 
                        className="text-[#111418] dark:text-white text-sm font-medium hover:text-primary hover:underline transition-colors text-left"
                        onClick={(e) => { e.preventDefault(); navigate(`/receivables/client-profile/${inv.clientId || 'CLI-001'}`); }}
                      >
                        {inv.clientName}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#617589] text-sm">{inv.issueDate}</td>
                  <td className="py-3 px-4 text-[#617589] text-sm">{inv.dueDate}</td>
                  <td className="py-3 px-4 text-[#617589] text-sm text-right tabular-nums font-mono">{formatPYG(inv.originalAmt)}</td>
                  <td className="py-3 px-4 text-[#111418] dark:text-white text-sm font-semibold text-right tabular-nums font-mono">{formatPYG(inv.pendingAmt)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusVariant(inv.statusColor)}`}>
                      {inv.status === 'OVERDUE' ? 'VENCIDO' : 
                       inv.status === 'PENDING' ? 'PENDIENTE' : 
                       inv.status === 'PARTIAL' ? 'P. PARCIAL' : 
                       inv.status === 'PAID' ? 'PAGADO' : inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[#617589] hover:text-[#111418] dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="border-t border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#1a202c] p-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#617589]">
          <span>{t('receivables.master.pagination.rows_per_page', 'Filas por página:')}</span>
          <select 
            className="bg-transparent font-medium text-[#111418] dark:text-white focus:outline-none cursor-pointer"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange?.(e.target.value)}
          >
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#617589]">
            {t('receivables.master.pagination.page_info', { page, total: totalPages || 1 }, `Página ${page} de ${totalPages || 1}`)}
          </span>
          <div className="flex items-center">
            <button 
              className="p-1 rounded-md text-[#111418] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button 
              className="p-1 rounded-md text-[#111418] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterListTable;