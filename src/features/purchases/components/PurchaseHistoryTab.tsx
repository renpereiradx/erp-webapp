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
      <section className='bg-surface-container-lowest rounded-md border border-surface-variant shadow-whisper overflow-hidden'>
        <div className='p-4 md:p-5 border-b border-surface-variant flex flex-col xl:flex-row justify-between items-center bg-surface-container-low gap-4'>
          <div className='flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto'>
            <div className='relative w-full sm:w-80'>
              <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 text-outline'
                size={16}
              />
              <input
                type='text'
                placeholder='Buscar por ID o Proveedor...'
                className='w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-surface-variant rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilter()}
              />
            </div>
            <button
              className='w-full sm:w-auto px-5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md shadow-sm active:scale-[0.98] transition-all duration-150 text-sm'
              onClick={handleFilter}
            >
              Buscar
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end'>
            <div className='flex p-0.5 bg-surface-container rounded-md'>
              <button
                className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-150 ${
                  searchType === 'date'
                    ? 'bg-surface-container-lowest shadow-sm text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSearchType('date')}
              >
                Fecha
              </button>
              <button
                className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-150 ${
                  searchType === 'supplier'
                    ? 'bg-surface-container-lowest shadow-sm text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSearchType('supplier')}
              >
                Proveedor
              </button>
            </div>

            {searchType === 'date' && (
              <div className='flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-md border border-surface-variant'>
                <input
                  type='date'
                  className='bg-transparent border-none text-xs text-on-surface outline-none'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className='text-outline'>
                  →
                </span>
                <input
                  type='date'
                  className='bg-transparent border-none text-xs text-on-surface outline-none'
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
            <thead className='bg-surface-container text-xs font-semibold text-on-surface-variant'>
              <tr>
                <th className='px-5 py-3 border-b border-surface-variant'>
                  Orden ID
                </th>
                <th className='px-5 py-3 border-b border-surface-variant'>
                  Fecha Pedido
                </th>
                <th className='px-5 py-3 border-b border-surface-variant'>
                  Proveedor
                </th>
                <th className='px-5 py-3 border-b border-surface-variant text-right'>
                  Monto Total
                </th>
                <th className='px-5 py-3 border-b border-surface-variant text-center'>
                  Estado
                </th>
                <th className='px-5 py-3 border-b border-surface-variant text-right w-20'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)]'>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='py-20 text-center text-outline text-sm'
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
                      className='hover:bg-surface-container-highest transition-colors duration-100'
                    >
                      <td className='px-5 py-3.5 font-semibold text-primary text-sm'>
                        <div>#{order.id}</div>
                        {order.branch_id && (
                          <div className='text-[10px] text-gray-400 dark:text-gray-500 font-normal flex items-center gap-1 mt-0.5'>
                            <Building size={10} className="inline mr-1" />
                            <span>Sucursal: {order.branch_id}</span>
                          </div>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-on-surface-variant text-sm'>
                        {formatDate(order.order_date)}
                      </td>
                      <td className='px-5 py-3.5 font-medium text-on-surface text-sm'>
                        <div>{order.supplier_name || '-'}</div>
                        {order.payment_method && (
                          <div className='text-[10px] text-gray-400 dark:text-gray-500 font-normal mt-0.5'>
                            Pago: <span className='font-semibold'>{order.payment_method}</span>
                          </div>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-right font-semibold text-on-surface'>
                        {formatCurrency(
                          order.total_amount,
                          order.currency,
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-center'>
                        <div className='flex flex-col items-center gap-1'>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                              isCompleted
                                ? 'bg-[rgba(16,124,16,0.1)] text-success'
                                : isCancelled
                                  ? 'bg-[rgba(209,52,56,0.1)] text-error'
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
                            className='p-1.5 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-md transition-all'
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openActionMenu === order.id && (
                            <div className='absolute right-0 mt-1 w-48 bg-surface-container-lowest rounded-md shadow-md border border-surface-variant z-40 py-1 overflow-hidden'>
                              <button
                                onClick={() => handleViewPurchase(order)}
                                className='w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-highest flex items-center gap-3 transition-colors'
                              >
                                <Eye
                                  size={16}
                                  className='text-primary'
                                />{' '}
                                Ver Detalle
                              </button>
                              {!isCancelled && canWrite && (
                                <button
                                  onClick={() =>
                                    handleCancelPurchase(order)
                                  }
                                  className='w-full px-4 py-2.5 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors'
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
