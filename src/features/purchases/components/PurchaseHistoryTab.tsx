import React from 'react';
import { Search, Building, MoreVertical, Eye, Ban } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
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
  | 'openActionMenu'
  | 'setOpenActionMenu'
  | 'handleViewPurchase'
  | 'canWrite'
  | 'handleCancelPurchase'
>;

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
  openActionMenu,
  setOpenActionMenu,
  handleViewPurchase,
  canWrite,
  handleCancelPurchase,
}) => {
  return (
    <div className='space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500'>
      {/* History Filter Toolbar - Fluent 2 CommandBar style */}
      <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden'>
        <div className='p-4 md:p-5 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col xl:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-4'>
          <div className='flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto'>
            <div className='relative w-full sm:w-80'>
              <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]'
                size={16}
              />
              <input
                type='text'
                placeholder='Buscar por ID o Proveedor...'
                className='w-full pl-9 pr-3 py-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilter()}
              />
            </div>
            <button
              className='w-full sm:w-auto px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] text-sm'
              onClick={handleFilter}
            >
              Buscar
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end'>
            <div className='flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
              <button
                className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                  searchType === 'date'
                    ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                    : 'text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)]'
                }`}
                onClick={() => setSearchType('date')}
              >
                Fecha
              </button>
              <button
                className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                  searchType === 'supplier'
                    ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                    : 'text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)]'
                }`}
                onClick={() => setSearchType('supplier')}
              >
                Proveedor
              </button>
            </div>

            {searchType === 'date' && (
              <div className='flex items-center gap-2 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] px-3 py-1.5 rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                <input
                  type='date'
                  className='bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className='text-[var(--fluent-text-tertiary,#8A8886)]'>
                  →
                </span>
                <input
                  type='date'
                  className='bg-transparent border-none text-xs text-[var(--fluent-text-primary,#212121)] dark:text-white outline-none'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* History Table - Fluent 2 DataGrid */}
        <div className='overflow-x-auto min-h-[400px]'>
          <table className='w-full text-left border-collapse min-w-[900px]'>
            <thead className='bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)]'>
              <tr>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                  Orden ID
                </th>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                  Fecha Pedido
                </th>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                  Proveedor
                </th>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right'>
                  Monto Total
                </th>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-center'>
                  Estado
                </th>
                <th className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] text-right w-20'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]'>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='py-20 text-center text-[var(--fluent-text-tertiary,#8A8886)] text-sm'
                  >
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Search size={32} className="opacity-20" />
                      <p>No se encontraron registros de compra</p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((orderData: any) => {
                  const order = orderData.purchase || orderData;
                  const isCompleted =
                    order.status?.toUpperCase() === 'COMPLETED' ||
                    order.status?.toUpperCase() === 'RECEIVED';
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
                    <tr
                      key={order.id}
                      className='hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[duration:var(--fluent-duration-faster,100ms)]'
                    >
                      <td className='px-5 py-3.5 font-semibold text-[var(--fluent-brand-primary,#0078D4)] text-sm'>
                        <div>#{order.id}</div>
                        {order.branch_id && (
                          <div className='text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1 mt-0.5'>
                            <Building size={10} className="inline mr-1" />
                            <span>Sucursal: {order.branch_id}</span>
                          </div>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-[var(--fluent-text-secondary,#605E5C)] text-sm'>
                        {formatDate(order.order_date)}
                      </td>
                      <td className='px-5 py-3.5 font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white text-sm'>
                        <div>{order.supplier_name || '-'}</div>
                        {order.payment_method && (
                          <div className='text-[10px] text-gray-400 dark:text-gray-500 font-normal mt-0.5'>
                            Pago: <span className='font-semibold'>{order.payment_method}</span>
                          </div>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                        {formatCurrency(
                          order.total_amount,
                          order.currency,
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-center'>
                        <div className='flex flex-col items-center gap-1'>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-[var(--fluent-corner-radius-medium,4px)] text-xs font-semibold ${
                              isCompleted
                                ? 'bg-[rgba(16,124,16,0.1)] text-[var(--fluent-semantic-success,#107C10)]'
                                : isCancelled
                                  ? 'bg-[rgba(209,52,56,0.1)] text-[var(--fluent-semantic-danger,#D13438)]'
                                  : 'bg-[rgba(255,185,0,0.15)] text-[#B87900]'
                            }`}
                          >
                            {getStatusText(order.status)}
                          </span>
                          {hasBalance && (
                            <span className='inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200'>
                              Saldo Pendiente
                            </span>
                          )}
                          {isFullyPaid && isCompleted && (
                            <span className='inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100'>
                              Pagado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-5 py-3.5 text-right'>
                        <div className='relative inline-block'>
                          <button
                            onClick={() =>
                              setOpenActionMenu(
                                openActionMenu === order.id
                                  ? null
                                  : order.id,
                              )
                            }
                            className='p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openActionMenu === order.id && (
                            <div className='absolute right-0 mt-1 w-48 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] z-40 py-1 overflow-hidden'>
                              <button
                                onClick={() => handleViewPurchase(order)}
                                className='w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] flex items-center gap-3 transition-colors'
                              >
                                <Eye
                                  size={16}
                                  className='text-[var(--fluent-brand-primary,#0078D4)]'
                                />{' '}
                                Ver Detalle
                              </button>
                              {!isCancelled && canWrite && (
                                <button
                                  onClick={() =>
                                    handleCancelPurchase(order)
                                  }
                                  className='w-full px-4 py-2.5 text-left text-sm text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors'
                                >
                                  <Ban size={16} /> Anular Orden
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
