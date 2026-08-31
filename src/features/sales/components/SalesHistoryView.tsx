/**
 * SalesHistoryView — tab Historial de ventas: filtros (texto / rango de fechas),
 * tabla según DESIGN.md y estados de datos con DataState (loading skeleton,
 * error con reintentar, empty). La consulta vive en SalesNew.tsx (store de
 * ventas); acá solo se presenta y se disparan los callbacks.
 */
import React from 'react';
import { Ban, Eye, Filter, History, MoreVertical, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataState from '@/components/ui/DataState';
import { formatCurrency } from '@/utils/currencyUtils';
import { useI18n } from '@/lib/i18n';

export interface HistorySaleRow {
  internalKey: string;
  id?: string;
  displayId: string;
  client_name: string;
  total_amount: number;
  date: string | Date | null | undefined;
  status: string;
}

type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary';

const statusVariant = (status: string): StatusVariant => {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusLabelKeys: Record<string, string> = {
  COMPLETED: 'sales.status.completed',
  PENDING: 'sales.status.pending',
  CANCELLED: 'sales.status.cancelled',
  PAID: 'sales.status.paid',
};

interface SalesHistoryViewProps {
  rows: HistorySaleRow[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  historySearch: string;
  onHistorySearchChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onFilter: () => void;
  onLoadLatest: () => void;
  onClear: () => void;
  onViewSale: (sale: HistorySaleRow) => void;
  onCancelSale: (sale: HistorySaleRow) => void;
  canWrite: boolean;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  rows,
  totalCount,
  loading,
  error,
  onRetry,
  historySearch,
  onHistorySearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onFilter,
  onLoadLatest,
  onClear,
  onViewSale,
  onCancelSale,
  canWrite,
}) => {
  const { t } = useI18n();

  const statusLabel = (status: string): string => {
    const key = statusLabelKeys[status];
    const fallback: Record<string, string> = {
      COMPLETED: 'Completada',
      PENDING: 'Pendiente',
      CANCELLED: 'Cancelada',
      PAID: 'Pagada',
    };
    return (key ? t(key, fallback[status]) : null) || status;
  };

  const renderStatusBadge = (status: string) => (
    <Badge variant={statusVariant(status)} size="sm">
      {statusLabel(status)}
    </Badge>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar de filtros */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle p-md space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[260px] space-y-xs">
            <Label htmlFor="history-search" className="text-body-sm-bold text-muted-foreground uppercase">
              {t('sales.history.quickSearch', 'Búsqueda rápida')}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline-fg" />
              <Input
                id="history-search"
                placeholder={t('sales.history.searchPlaceholder', 'Cliente o #Venta')}
                value={historySearch}
                onChange={(e) => onHistorySearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-xs">
            <Label htmlFor="history-from" className="text-body-sm-bold text-muted-foreground uppercase">
              {t('sales.history.from', 'Desde')}
            </Label>
            <Input id="history-from" type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="history-to" className="text-body-sm-bold text-muted-foreground uppercase">
              {t('sales.history.to', 'Hasta')}
            </Label>
            <Input id="history-to" type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="h-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={onFilter} className="gap-2">
              <Filter size={16} /> {t('sales.history.filter', 'Filtrar')}
            </Button>
            <Button variant="secondary" onClick={onLoadLatest} className="gap-2">
              <History size={16} /> {t('sales.history.loadLatest', 'Ver Últimos')}
            </Button>
            <Button variant="ghost" onClick={onClear} aria-label={t('sales.history.clear', 'Limpiar filtros')}>
              <X size={16} />
            </Button>
          </div>
        </div>

        <Badge variant="secondary" size="sm" className="font-data-mono">
          {totalCount} {t('sales.history.records', 'Registros')}
        </Badge>
      </div>

      {/* Estados + tabla */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-md">
            <DataState variant="loading" skeletonProps={{ count: 5, variant: 'list' }} testId="sales-history-loading" />
          </div>
        ) : error ? (
          <div className="p-md">
            <DataState
              variant="error"
              title={t('sales.history.errorTitle', 'Error al cargar')}
              message={error}
              onRetry={onRetry}
              testId="sales-history-error"
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-md">
            <DataState
              variant="empty"
              title={t('sales.history.empty', 'No se encontraron resultados')}
              description={t('sales.history.emptyHint', 'Ajustá la búsqueda o el rango de fechas y volvé a filtrar.')}
              testId="sales-history-empty"
            />
          </div>
        ) : (
          <>
            {/* Tabla (desktop) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-surface-muted">
                  <TableRow className="hover:bg-surface-muted">
                    <TableHead className="text-label-caps uppercase text-on-surface-deep">
                      {t('sales.history.col.id', 'ID')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep">
                      {t('sales.history.col.date', 'Fecha')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep">
                      {t('sales.history.col.client', 'Cliente')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                      {t('sales.history.col.total', 'Total')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">
                      {t('sales.history.col.status', 'Estado')}
                    </TableHead>
                    <TableHead className="w-24">
                      <span className="sr-only">{t('sales.history.col.actions', 'Acciones')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((sale) => (
                    <TableRow key={sale.internalKey} className="hover:bg-surface-muted transition-colors duration-150">
                      <TableCell className="text-body-md font-data-mono text-primary">
                        #{sale.displayId}
                      </TableCell>
                      <TableCell className="text-body-md text-muted-foreground whitespace-nowrap">
                        {sale.date ? new Date(sale.date).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </TableCell>
                      <TableCell className="text-body-md text-foreground">{sale.client_name}</TableCell>
                      <TableCell className="text-right font-data-mono text-body-md-bold text-foreground">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell className="text-center">{renderStatusBadge(sale.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewSale(sale)}
                            aria-label={t('sales.history.viewAria', 'Ver detalle')}
                            className="size-8 text-outline-fg hover:text-primary"
                          >
                            <Eye size={16} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('sales.history.moreAria', 'Más acciones')}
                                className="size-8"
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onViewSale(sale)} className="gap-2">
                                <Eye size={14} /> {t('sales.history.viewDetail', 'Ver Detalle')}
                              </DropdownMenuItem>
                              {sale.status !== 'CANCELLED' && canWrite && (
                                <DropdownMenuItem onClick={() => onCancelSale(sale)} className="gap-2 text-error focus:text-error">
                                  <Ban size={14} /> {t('sales.history.cancelSale', 'Anular Venta')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Tarjetas (mobile) */}
            <div className="md:hidden divide-y divide-divider">
              {rows.map((sale) => (
                <div
                  key={sale.internalKey}
                  className="p-4 space-y-3 transition-colors duration-150 active:bg-surface-muted cursor-pointer"
                  onClick={() => onViewSale(sale)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-body-sm font-data-mono text-primary">#{sale.displayId}</span>
                      <span className="text-label-caps text-outline-fg uppercase">
                        {sale.date ? new Date(sale.date).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                    </div>
                    {renderStatusBadge(sale.status)}
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-label-caps text-outline-fg uppercase mb-0.5">
                        {t('sales.history.col.client', 'Cliente')}
                      </span>
                      <span className="text-body-md-bold text-foreground leading-none truncate max-w-[180px]">
                        {sale.client_name}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-label-caps text-outline-fg uppercase mb-0.5">
                        {t('sales.history.totalAmount', 'Importe Total')}
                      </span>
                      <span className="text-body-md-bold font-data-mono text-foreground leading-none">
                        {formatCurrency(sale.total_amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-divider">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewSale(sale);
                      }}
                      className="flex-1 h-9"
                    >
                      <Eye size={14} className="mr-1.5 text-primary" /> {t('sales.history.details', 'Detalles')}
                    </Button>
                    {sale.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={t('sales.history.cancelSale', 'Anular Venta')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelSale(sale);
                        }}
                        className="h-9 w-10 text-error"
                      >
                        <Ban size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
