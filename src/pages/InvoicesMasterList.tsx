import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoreVertical, RefreshCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPYG, formatNumber } from '@/utils/currencyUtils';
import { usePayables } from '@/features/accounts-payable/hooks/usePayables';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';
import type { PayablesInvoice } from '@/features/accounts-payable/hooks/usePayables';

/**
 * Lista maestra de facturas CxP.
 * Migración FASE 4: .tsx + PageHeader + 3 estados; el debounce inline de
 * setTimeout pasa a useDebounce, el listener manual de resize a useIsMobile
 * (patrón §2.10). El toggle tabla/grid, checkboxes y botones de acción por
 * fila sin handler se eliminaron (§2.6).
 */

const PAGE_SIZE = 20;

interface InvoicesFilters {
  search: string
  status: string
  priority: string
  startDate: string
  endDate: string
  page: number
  pageSize: number
}

const getStatusTone = (status = '') => {
  switch (status.toUpperCase()) {
    case 'VENCIDO':
      return 'bg-error/10 text-error border-error/20';
    case 'PARCIAL':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'PAGADO':
      return 'bg-success/10 text-success border-success/20';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
};

const InvoicesMasterList = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { loading, error, fetchPayables, payables, pagination } = usePayables();

  const [filters, setFilters] = useState<InvoicesFilters>({
    search: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: PAGE_SIZE,
  });

  // Debounce del bloque de filtros (antes: setTimeout manual en useEffect)
  const debouncedFilters = useDebounce(filters, 400);

  const loadData = useCallback(
    async (currentFilters: InvoicesFilters) => {
      const apiParams = {
        status: currentFilters.status || undefined,
        priority: currentFilters.priority || undefined,
        search: currentFilters.search || undefined,
        start_date: currentFilters.startDate || undefined,
        end_date: currentFilters.endDate || undefined,
      };
      await fetchPayables(apiParams, {
        page: currentFilters.page,
        page_size: currentFilters.pageSize,
      });
    },
    [fetchPayables],
  );

  useEffect(() => {
    loadData(debouncedFilters);
  }, [loadData, debouncedFilters]);

  const handleFilterChange = (key: keyof InvoicesFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: PAGE_SIZE,
    });
  };

  const hasActiveFilters =
    filters.search || filters.status || filters.priority || filters.startDate || filters.endDate;

  const totalPages = pagination.totalPages || 1;
  const page = pagination.page || filters.page;

  const renderRow = (invoice: PayablesInvoice) => {
    const statusTone = getStatusTone(invoice.status);
    const isOverdue = invoice.status?.toUpperCase() === 'VENCIDO';
    const progress =
      invoice.totalAmount > 0
        ? ((invoice.totalAmount - invoice.pendingAmount) / invoice.totalAmount) * 100
        : 0;

    return (
      <tr
        key={invoice.id}
        className="hover:bg-surface-muted transition-colors duration-150 cursor-pointer border-l-2 border-transparent hover:border-primary"
        onClick={() => navigate(`/payables/detail/${invoice.id}`)}
      >
        <td className="px-md py-sm">
          <span className="text-body-sm-bold font-data-mono text-data-mono text-foreground">#{invoice.id}</span>
        </td>
        <td className="px-md py-sm">
          <button
            type="button"
            className="flex items-center gap-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (invoice.vendorId) navigate(`/payables/suppliers/${invoice.vendorId}/analysis`);
            }}
          >
            <div className="size-9 shrink-0 rounded-md bg-surface-muted flex items-center justify-center border border-border-subtle overflow-hidden">
              {invoice.logo ? (
                <img className="size-full object-cover" src={invoice.logo} alt="" />
              ) : (
                <span className="text-body-sm-bold text-primary">{invoice.initials}</span>
              )}
            </div>
            <span className="text-body-md-bold text-foreground truncate">{invoice.vendor}</span>
          </button>
        </td>
        <td className="px-md py-sm hidden lg:table-cell">
          <span className={`text-body-sm-bold font-data-mono text-data-mono ${isOverdue ? 'text-error' : 'text-foreground'}`}>
            {invoice.dueDate}
          </span>
        </td>
        <td className="px-md py-sm text-right">
          <div className="flex flex-col gap-xs items-end">
            <span className="text-body-md font-data-mono text-data-mono text-foreground">
              {formatPYG(invoice.totalAmount)}
            </span>
            {invoice.pendingAmount > 0 && (
              <span className={`text-body-sm-bold font-data-mono text-data-mono ${isOverdue ? 'text-error' : 'text-on-surface-deep'}`}>
                {t('bi.payables.invoices.pendingShort', 'Pdte', {})}: {formatPYG(invoice.pendingAmount)}
              </span>
            )}
            <div className="w-24 h-1 bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
              <div
                className={`h-full transition-all duration-300 ${isOverdue ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${formatNumber(progress)}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-md py-sm text-center hidden md:table-cell">
          <span className={`inline-flex items-center px-sm py-xs rounded-xs text-body-sm-bold uppercase border ${statusTone}`}>
            {invoice.status}
          </span>
        </td>
        <td className="px-md py-sm text-right hidden md:table-cell">
          <MoreVertical size={16} className="text-on-surface-deep opacity-0 group-hover:opacity-100" aria-hidden="true" />
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.payables.breadcrumb', 'Finanzas', {})}
          title={t('bi.payables.invoices.title', 'Lista Maestra de Facturas', {})}
          subtitle={t('bi.payables.invoices.subtitle', 'Libro mayor de cuentas por pagar', {})}
          actions={
            <button
              type="button"
              onClick={() => loadData(filters)}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              {t('bi.payables.invoices.sync', 'Sincronizar', {})}
            </button>
          }
        />

        {/* Filtros alineados con la API */}
        <section className="bg-surface p-sm md:p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-md mt-lg">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-md">
            <input
              type="text"
              aria-label={t('bi.payables.invoices.search', 'Buscar por ID, proveedor o RUC...', {})}
              placeholder={t('bi.payables.invoices.search', 'Buscar por ID, proveedor o RUC...', {})}
              className="w-full py-sm px-md bg-surface-muted border border-border-subtle focus:ring-2 focus:ring-primary/20 rounded-sm text-body-md text-foreground transition-all outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />

            <div className="flex flex-wrap items-center gap-sm">
              <select
                aria-label={t('bi.payables.invoices.statusFilter', 'Estado', {})}
                className="bg-surface-muted border border-border-subtle rounded-sm text-body-sm-bold px-sm py-sm outline-none cursor-pointer min-w-[140px] text-foreground"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">{t('bi.payables.invoices.allStatuses', 'Estados: Todos', {})}</option>
                <option value="PENDING">{t('bi.receivables.status.PENDING', 'PENDIENTE', {})}</option>
                <option value="PARTIAL">{t('bi.receivables.status.PARTIAL', 'PARCIAL', {})}</option>
                <option value="OVERDUE">{t('bi.receivables.status.OVERDUE', 'VENCIDO', {})}</option>
                <option value="PAID">{t('bi.receivables.status.PAID', 'PAGADO', {})}</option>
              </select>
              <select
                aria-label={t('bi.payables.invoices.priorityFilter', 'Prioridad', {})}
                className="bg-surface-muted border border-border-subtle rounded-sm text-body-sm-bold px-sm py-sm outline-none cursor-pointer min-w-[140px] text-foreground"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">{t('bi.payables.invoices.allPriorities', 'Prioridad: Todas', {})}</option>
                <option value="URGENT">URGENTE</option>
                <option value="HIGH">ALTA</option>
                <option value="MEDIUM">MEDIA</option>
                <option value="LOW">BAJA</option>
              </select>

              <div className="flex items-center gap-sm bg-surface-muted border border-border-subtle rounded-sm px-sm py-xs">
                <div className="flex flex-col">
                  <span className="text-label-caps uppercase text-on-surface-deep">{t('bi.receivables.master.filter.from', 'Desde', {})}</span>
                  <input
                    type="date"
                    aria-label={t('bi.receivables.master.filter.from', 'Desde', {})}
                    className="bg-transparent border-none p-0 text-body-sm-bold outline-none text-foreground cursor-pointer"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="w-px h-6 bg-border-subtle mx-xs" />
                <div className="flex flex-col">
                  <span className="text-label-caps uppercase text-on-surface-deep">{t('bi.receivables.master.filter.to', 'Hasta', {})}</span>
                  <input
                    type="date"
                    aria-label={t('bi.receivables.master.filter.to', 'Hasta', {})}
                    className="bg-transparent border-none p-0 text-body-sm-bold outline-none text-foreground cursor-pointer"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="p-sm text-on-surface-deep hover:text-error rounded-md transition-colors"
                  aria-label={t('common.clearFilters', 'Limpiar Filtros', {})}
                >
                  <RefreshCcw size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Listado */}
        <main className="mt-lg flex flex-col border border-border-subtle rounded-md bg-surface shadow-whisper overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between px-md py-sm bg-surface-muted border-b border-border-subtle">
            <span className="text-label-caps uppercase text-on-surface-deep">
              {t('bi.payables.invoices.showing', 'Mostrando {n} facturas registradas', { n: payables.length })}
            </span>
          </div>

          {loading && payables.length === 0 ? (
            <div className="p-md">
              <GenericSkeletonList count={8} data-testid="invoices-skeleton-list" />
            </div>
          ) : error ? (
            <ErrorState
              title={t('bi.payables.invoices.errorTitle', 'Fallo de comunicación', {})}
              message={t('bi.payables.invoices.errorBody', 'Hubo un problema al conectar con los servicios financieros.', {})}
              onRetry={() => loadData(filters)}
            />
          ) : payables.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('bi.payables.invoices.emptyTitle', 'Sin facturas registradas', {})}
              description={t('bi.payables.invoices.emptyBody', 'No hay cuentas por pagar para los filtros aplicados.', {})}
              actionLabel={t('common.clearFilters', 'Limpiar Filtros', {})}
              onAction={clearFilters}
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-muted border-b border-border-subtle">
                    <th className="px-md py-sm text-label-caps uppercase text-on-surface-deep">
                      {t('bi.payables.invoices.col.id', 'ID Factura', {})}
                    </th>
                    <th className="px-md py-sm text-label-caps uppercase text-on-surface-deep">
                      {t('bi.payables.invoices.col.vendor', 'Proveedor / Emisor', {})}
                    </th>
                    <th className="px-md py-sm text-label-caps uppercase text-on-surface-deep hidden lg:table-cell">
                      {t('bi.payables.invoices.col.due', 'Vencimiento', {})}
                    </th>
                    <th className="px-md py-sm text-label-caps uppercase text-on-surface-deep text-right">
                      {t('bi.payables.invoices.col.balance', 'Balance Financiero', {})}
                    </th>
                    <th className="px-md py-sm text-label-caps uppercase text-on-surface-deep text-center hidden md:table-cell">
                      {t('bi.payables.invoices.col.status', 'Estado', {})}
                    </th>
                    <th className="px-md py-sm w-10 hidden md:table-cell" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {payables.map((invoice) => renderRow(invoice))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación server-side real */}
          {!loading && !error && payables.length > 0 && (
            <div className="px-md py-sm border-t border-border-subtle bg-surface-muted flex items-center justify-between">
              <span className="text-label-caps uppercase text-on-surface-deep">
                {t('bi.payables.invoices.pageInfo', 'Página {p} de {t}', { p: page, t: totalPages })}
              </span>
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
                  className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 transition-colors hover:bg-surface"
                  disabled={page <= 1}
                  onClick={() => handleFilterChange('page', page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
                  className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 transition-colors hover:bg-surface"
                  disabled={page >= totalPages}
                  onClick={() => handleFilterChange('page', page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InvoicesMasterList
