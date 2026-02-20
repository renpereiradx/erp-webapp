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
      red: 'destructive',
      yellow: 'warning',
      blue: 'info',
      green: 'success',
      gray: 'secondary'
    };
    return colorMap[statusColor] || 'secondary';
  };

  return (
    <div className="rec-grid-container">
      <div className="rec-grid-toolbar">
        <div className="rec-grid-toolbar__info">
          {t('common.pagination.showing', 'Mostrando')} <strong>{startItem}-{endItem}</strong> {t('common.pagination.of', 'de')} <strong>{totalItems || safeInvoices.length}</strong> items
        </div>
        <div className="rec-grid-toolbar__actions">
          <Button variant="ghost" size="icon" title="Actualizar" onClick={onRefresh}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Columnas">
            <Columns className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><input type="checkbox" className="fluent-checkbox" /></TableHead>
              {SORTABLE_COLUMNS.map((col) => (
                <TableHead key={col.key} className={col.align || ''}>
                  <div
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => onSort?.(col.key)}
                  >
                    {t(col.label)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('receivables.loading.generic')}
                </TableCell>
              </TableRow>
            ) : (
              safeInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell><input type="checkbox" className="fluent-checkbox" /></TableCell>
                  <TableCell>
                    <a
                      href="#"
                      className="text-primary font-medium hover:underline"
                      onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}
                    >
                      #{inv.id}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: inv.clientColor || '#eff6ff',
                          color: '#1d4ed8'
                        }}
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <span className="font-medium">{inv.clientName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary">{inv.issueDate}</TableCell>
                  <TableCell className="text-secondary">{inv.dueDate}</TableCell>
                  <TableCell className="text-secondary text-right font-mono">{formatPYG(inv.originalAmt)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatPYG(inv.pendingAmt)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(inv.statusColor)}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rec-pagination">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('receivables.master.pagination.rows_per_page')}</span>
          <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange?.(val)}>
            <SelectTrigger className="rec-pagination__select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {t('receivables.master.pagination.page_info', { page, total: totalPages || 1 })}
          </span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
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