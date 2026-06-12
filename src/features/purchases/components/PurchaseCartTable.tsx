import React from 'react';
import { Plus, Package, X } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';

export type PurchaseCartTableProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'purchaseItems'
  | 'setIsModalOpen'
  | 'canWrite'
  | 't'
  | 'handleEditItem'
  | 'setPurchaseItems'
>;

export const PurchaseCartTable: React.FC<PurchaseCartTableProps> = ({
  purchaseItems,
  setIsModalOpen,
  canWrite,
  t,
  handleEditItem,
  setPurchaseItems,
}) => {
  return (
    <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] overflow-hidden animate-in slide-in-from-bottom-2 duration-500'>
      <div className='px-5 py-4 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex flex-col sm:flex-row justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] gap-3'>
        <div>
          <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
            Productos en la Orden
          </h3>
          <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5'>
            Artículos a ingresar al inventario
          </p>
        </div>
        <button
          className='w-full sm:w-auto bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white px-4 py-2 rounded-[var(--fluent-corner-radius-medium,4px)] font-semibold text-sm shadow-[var(--fluent-shadow-2)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none'
          onClick={() => setIsModalOpen(true)}
          disabled={!canWrite}
        >
          <Plus size={16} strokeWidth={2.5} />
          Agregar Artículo
        </button>
      </div>

      <div className='overflow-x-auto min-h-[300px]'>
        <table className='w-full text-left border-collapse min-w-[800px]'>
          <thead className='bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)] sticky top-0 z-10'>
            <tr>
              <th className='px-4 py-3'>ID / SKU</th>
              <th className='px-4 py-3'>Producto</th>
              <th className='px-4 py-3 text-center'>{t('purchases.form.quantity', 'Cant.')}</th>
              <th className='px-4 py-3 text-right'>{t('purchases.form.unit_price', 'Costo Unit.')}</th>
              <th className='px-4 py-3 text-right'>{t('purchases.form.profit_margin', 'Margen')}</th>
              <th className='px-4 py-3 text-right'>{t('purchases.form.subtotal', 'Subtotal')}</th>
              <th className='px-4 py-3 text-right'>{t('purchases.modal.sale_price', 'Venta Esp.')}</th>
              <th className='px-4 py-3 w-12'></th>
            </tr>
          </thead>
          <tbody className='divide-y divide-[var(--fluent-border-neutral,#E1DFDD)] dark:divide-[var(--fluent-neutral-grey-140,#484644)] relative'>
            {purchaseItems.length === 0 ? (
              <tr>
                <td colSpan={8} className='py-20 text-center relative'>
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--fluent-text-tertiary,#8A8886)]'>
                    <div className='w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center'>
                      <Package size={32} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className='text-sm font-medium'>
                      {t('purchases.form.no_products', 'No hay artículos seleccionados')}
                    </p>
                    <p className='text-xs text-slate-400'>Haz clic en "Agregar Artículo" para comenzar</p>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseItems.map(item => (
                <tr
                  key={item.id}
                  className='hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] transition-colors duration-[duration:var(--fluent-duration-faster,100ms)] group/row cursor-pointer'
                  onDoubleClick={() => handleEditItem(item)}
                >
                  <td className='px-4 py-3'>
                    <div className='text-xs font-mono text-[var(--fluent-text-secondary,#605E5C)]'>
                      #{item.product_id}
                    </div>
                    <div className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                      {item.sku}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white group-hover/row:text-[var(--fluent-brand-primary,#0078D4)] transition-colors'>
                      {item.name}
                    </div>
                    <div className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                      Unidad: {item.unit}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-center font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                    {formatNumber(item.quantity)} <span className='text-[10px] font-normal text-[var(--fluent-text-tertiary,#8A8886)]'>{item.unit}</span>
                  </td>
                  <td className='px-4 py-3 text-right text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className='px-4 py-3 text-right font-semibold text-[var(--fluent-semantic-success,#107C10)]'>
                    {item.profit_pct.toFixed(1)}%
                  </td>
                  <td className='px-4 py-3 text-right font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                      {formatCurrency(item.sale_price * item.quantity)}
                    </div>
                    <div className='text-[10px] text-[var(--fluent-semantic-success,#107C10)]'>
                      +{formatCurrency((item.sale_price - item.unit_price) * item.quantity)}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      onClick={() => setPurchaseItems(prev => prev.filter(i => i.id !== item.id))}
                      className='p-1.5 text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
