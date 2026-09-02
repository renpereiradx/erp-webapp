import React from 'react';
import { Search, Building, MoreVertical, Eye, Ban } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { useI18n } from '@/lib/i18n';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import DataState from '@/components/ui/DataState';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';

export type PurchaseHistoryTabProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'searchTerm'
  | 'setSearchTerm'
  | 'handleFilter'
  | 'searchType'
  | 'setSearchType'
  | 'startDate'
  | 'setStartDate'
  | 'endDate'
  | 'setEndDate'
  | 'purchaseOrders'
  | 'formatDate'
  | 'getStatusText'
  | 'handleViewPurchase'
  | 'canWrite'
  | 'handleCancelPurchase'
  | 'loading'
  | 'error'
>;

const headClass = 'text-label-caps uppercase text-on-surface-deep';

export const PurchaseHistoryTab: React.FC<PurchaseHistoryTabProps> = ({
  searchTerm,
  setSearchTerm,
  handleFilter,
  searchType,
  setSearchType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  purchaseOrders,
  formatDate,
  getStatusText,
  handleViewPurchase,
  canWrite,
  handleCancelPurchase,
  loading,
  error,
}) => {
  const { t } = useI18n();

  const renderStatusBadge = (status?: string) => {
    const normalized = status?.toUpperCase();
    const isCompleted = normalized === 'COMPLETED' || normalized === 'RECEIVED';
    const isCancelled = normalized === 'CANCELLED';
    return (
      <Badge variant={isCompleted ? 'success' : isCancelled ? 'destructive' : 'warning'}>
        {getStatusText(status)}
      </Badge>
    );
  };

  return (
    <div className='space-y-lg'>
      {/* History Filter Toolbar */}
      <section className='bg-surface rounded-md shadow-whisper border-0 overflow-hidden'>
        <div className='p-md lg:p-lg border-b border-divider flex flex-col xl:flex-row justify-between items-center bg-surface-muted gap-md'>
          <div className='flex flex-col sm:flex-row items-center gap-md w-full xl:w-auto'>
            <div className='relative w-full sm:w-80'>
              <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 text-outline-fg'
                size={16}
                aria-hidden='true'
              />
              <Input
                type='text'
                aria-label={t('purchases.search.placeholder', 'Buscar por proveedor o ID...')}
                placeholder={t('purchases.search.placeholder', 'Buscar por proveedor o ID...')}
                className='pl-9 bg-surface'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilter()}
              />
            </div>
            <Button variant='primary' onClick={handleFilter} className='w-full sm:w-auto'>
              {t('purchases.history.search', 'Buscar')}
            </Button>
          </div>

          <div className='flex flex-wrap items-center gap-md w-full xl:w-auto justify-end'>
            <div
              role='tablist'
              aria-label={t('purchases.search.type', 'Tipo de búsqueda')}
              className='flex p-0.5 bg-surface-subtle rounded-md'
            >
              {([
                { id: 'date', label: t('purchases.search.by_date', 'Fecha') },
                { id: 'supplier', label: t('purchases.search.by_supplier', 'Proveedor') },
              ]).map(option => (
                <button
                  key={option.id}
                  role='tab'
                  aria-selected={searchType === option.id}
                  onClick={() => setSearchType(option.id)}
                  className={cn(
                    'px-md py-1.5 text-body-sm-bold rounded-sm transition-colors duration-150 cursor-pointer',
                    searchType === option.id
                      ? 'bg-surface text-primary shadow-fluent-2'
                      : 'text-on-surface-deep hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {searchType === 'date' && (
              <div className='flex items-center gap-sm bg-surface px-md py-1.5 rounded-md border border-border-subtle'>
                <input
                  type='date'
                  aria-label={t('purchases.search.start_date', 'Fecha inicio')}
                  className='bg-transparent text-body-sm text-foreground outline-none'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className='text-outline-fg' aria-hidden='true'>→</span>
                <input
                  type='date'
                  aria-label={t('purchases.search.end_date', 'Fecha fin')}
                  className='bg-transparent text-body-sm text-foreground outline-none'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {!loading && !error && purchaseOrders.length > 0 && (
          <div className='overflow-x-auto'>
            <Table className='min-w-[900px]'>
              <TableHeader className='bg-surface-muted'>
                <TableRow className='hover:bg-surface-muted border-0'>
                  <TableHead className={`${headClass} px-lg py-md`}>{t('purchases.table.id', 'ID Compra')}</TableHead>
                  <TableHead className={`${headClass} px-lg py-md`}>{t('purchases.history.order_date', 'Fecha Pedido')}</TableHead>
                  <TableHead className={`${headClass} px-lg py-md`}>{t('purchases.table.supplier', 'Proveedor')}</TableHead>
                  <TableHead className={`${headClass} px-lg py-md text-right`}>{t('purchases.history.total_amount', 'Monto Total')}</TableHead>
                  <TableHead className={`${headClass} px-lg py-md text-center`}>{t('purchases.table.status', 'Estado')}</TableHead>
                  <TableHead className={`${headClass} px-lg py-md text-right w-20`}>{t('purchases.table.actions', 'Acciones')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow className='hover:bg-transparent border-0'>
                    <TableCell colSpan={6} className='py-lg'>
                      <GenericSkeletonList count={5} data-testid='purchases-history-loading' />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow className='hover:bg-transparent border-0'>
                    <TableCell colSpan={6} className='py-lg'>
                      <DataState
                        variant='error'
                        testId='purchases-history-error'
                        title={t('purchases.error.title', 'Error al cargar compras')}
                        message={error}
                        onRetry={handleFilter}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && purchaseOrders.length === 0 && (
                  <TableRow className='hover:bg-transparent border-0'>
                    <TableCell colSpan={6} className='py-lg'>
                      <DataState
                        variant='empty'
                        testId='purchases-history-empty'
                        title={t('purchases.empty.title', 'Sin órdenes de compra')}
                        description={t('purchases.empty.message', 'No hay órdenes de compra registradas')}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && purchaseOrders.map((orderData: any) => {
                  const order = orderData.purchase || orderData;
                  const isCancelled =
                    order.status?.toUpperCase() === 'CANCELLED';

                  // Calcular estado de pago si la información está disponible
                  const payments = orderData.payments || {};
                  const totalAmount = order.total_amount || 0;
                  const totalPaid = payments.total_paid || 0;
                  const isFullyPaid =
                    payments.is_fully_paid ||
                    (totalPaid >= totalAmount && totalAmount > 0);
                  const hasBalance =
                    !isFullyPaid && totalAmount > 0 && !isCancelled;

                  return (
                    <TableRow
                      key={order.id}
                      className='hover:bg-surface-muted transition-colors duration-150'
                    >
                      <TableCell className='px-lg py-3.5'>
                        <div className='text-data-mono font-data-mono text-primary'>
                          #{order.id}
                        </div>
                        {order.branch_id && (
                          <div className='text-body-sm text-outline-fg flex items-center gap-1 mt-0.5'>
                            <Building size={12} aria-hidden='true' />
                            <span>
                              {t('purchases.history.branch', 'Sucursal')}: {order.branch_id}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='px-lg py-3.5 text-data-mono font-data-mono text-on-surface-deep'>
                        {formatDate(order.order_date)}
                      </TableCell>
                      <TableCell className='px-lg py-3.5'>
                        <div className='text-body-md-bold text-foreground'>
                          {order.supplier_name || '-'}
                        </div>
                        {order.payment_method && (
                          <div className='text-body-sm text-outline-fg mt-0.5'>
                            {t('purchases.history.payment', 'Pago')}:{' '}
                            <span className='text-body-sm-bold'>{order.payment_method}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='px-lg py-3.5 text-right text-data-mono font-data-mono text-foreground'>
                        {formatCurrency(order.total_amount, order.currency)}
                      </TableCell>
                      <TableCell className='px-lg py-3.5'>
                        <div className='flex flex-col items-center gap-1'>
                          {renderStatusBadge(order.status)}
                          {hasBalance && (
                            <Badge variant='warning' size='sm'>
                              {t('purchases.history.pending_balance', 'Saldo Pendiente')}
                            </Badge>
                          )}
                          {isFullyPaid && (
                            <Badge variant='success' size='sm'>
                              {t('purchases.history.paid', 'Pagado')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='px-lg py-3.5 text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={t('purchases.table.actions_aria', 'Abrir menú de acciones')}
                            >
                              <MoreVertical size={18} aria-hidden='true' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem onClick={() => handleViewPurchase(order)}>
                              <Eye size={16} className='text-primary' aria-hidden='true' />
                              {t('purchases.history.view_detail', 'Ver Detalle')}
                            </DropdownMenuItem>
                            {!isCancelled && canWrite && (
                              <DropdownMenuItem
                                onClick={() => handleCancelPurchase(order)}
                                className='text-error focus:text-error'
                              >
                                <Ban size={16} aria-hidden='true' />
                                {t('purchases.history.cancel_order', 'Anular Orden')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};
