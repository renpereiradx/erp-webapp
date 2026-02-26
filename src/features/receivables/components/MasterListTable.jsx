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
  { key: 'id', label: 'receivables.master.table.id' },
  { key: 'client', label: 'receivables.master.table.client' },
  { key: 'sale_date', label: 'receivables.master.table.sale_date' },
  { key: 'due_date', label: 'receivables.master.table.due_date' },
  { key: 'original_amt', label: 'receivables.master.table.original_amt', align: 'text-right' },
  { key: 'pending_amt', label: 'receivables.master.table.pending_amt', align: 'text-right' },
  { key: 'status', label: 'receivables.master.table.status', align: 'text-center' },
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
      red: 'bg-error text-white',
      yellow: 'bg-warning text-black',
      blue: 'bg-info text-white',
      green: 'bg-success text-white',
      gray: 'bg-slate-100 text-slate-700'
    };
    return colorMap[statusColor] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm flex flex-col">
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">
          {t('common.pagination.showing', 'Mostrando')} <strong className="text-text-main">{startItem}-{endItem}</strong> {t('common.pagination.of', 'de')} <strong className="text-text-main">{totalItems || safeInvoices.length}</strong> items
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-9 rounded-full text-text-secondary hover:text-primary hover:bg-blue-50" title="Actualizar" onClick={onRefresh}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-9 rounded-full text-text-secondary hover:text-primary hover:bg-blue-50" title="Columnas">
            <Columns className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className="w-12 text-center">
                <input type="checkbox" className="rounded-sm border-slate-300" />
              </TableHead>
              {SORTABLE_COLUMNS.map((col) => (
                <TableHead key={col.key} className={`${col.align || ''} text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary`}>
                  <div
                    className="cursor-pointer select-none hover:text-primary transition-colors flex items-center gap-1"
                    onClick={() => onSort?.(col.key)}
                  >
                    {t(col.label)}
                    {sortBy === col.key && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="size-8 animate-spin text-primary opacity-50" />
                    <p className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.loading.generic')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              safeInvoices.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                  <TableCell className="text-center">
                    <input type="checkbox" className="rounded-sm border-slate-300" />
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-sm font-black text-primary hover:underline uppercase tracking-tight"
                      onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}
                    >
                      #{inv.id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{
                          backgroundColor: inv.clientColor || '#eff6ff',
                          color: '#1d4ed8'
                        }}
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{inv.clientName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-black uppercase tracking-widest text-text-secondary">{inv.issueDate}</TableCell>
                  <TableCell className="text-xs font-black uppercase tracking-widest text-text-secondary">{inv.dueDate}</TableCell>
                  <TableCell className="text-right px-6 text-sm font-black text-text-main opacity-60">{formatPYG(inv.originalAmt)}</TableCell>
                  <TableCell className="text-right px-6 text-sm font-black text-text-main">{formatPYG(inv.pendingAmt)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusVariant(inv.statusColor)}`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
          <span>{t('receivables.master.pagination.rows_per_page')}</span>
          <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange?.(val)}>
            <SelectTrigger className="h-8 min-w-[70px] border-border-subtle bg-white text-[10px] font-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-[10px] font-black">10</SelectItem>
              <SelectItem value="20" className="text-[10px] font-black">20</SelectItem>
              <SelectItem value="50" className="text-[10px] font-black">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">
            {t('receivables.master.pagination.page_info', { page, total: totalPages || 1 })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg border border-border-subtle bg-white disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg border border-border-subtle bg-white disabled:opacity-30"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterListTable;