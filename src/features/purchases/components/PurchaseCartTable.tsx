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
    <section className='bg-surface-container-lowest rounded-md border border-surface-variant shadow-whisper overflow-hidden animate-in slide-in-from-bottom-2 duration-500'>
      <div className='px-5 py-4 border-b border-surface-variant flex flex-col sm:flex-row justify-between items-center bg-surface-container-low gap-3'>
        <div>
          <h3 className='text-base font-semibold text-on-surface'>
            Productos en la Orden
          </h3>
          <p className='text-xs text-on-surface-variant mt-0.5'>
            Artículos a ingresar al inventario
          </p>
        </div>
        <button
          className='w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-semibold text-sm shadow-sm active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none'
          onClick={() => setIsModalOpen(true)}
          disabled={!canWrite}
        >
          <Plus size={16} strokeWidth={2.5} />
          Agregar Artículo
        </button>
      </div>

      <div className='overflow-x-auto min-h-[300px]'>
        <table className='w-full text-left border-collapse min-w-[800px]'>
          <thead className='bg-surface-container text-xs font-semibold text-on-surface-variant sticky top-0 z-10'>
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
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-outline'>
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
                  className='hover:bg-surface-container-highest transition-colors duration-100 group/row cursor-pointer'
                  onDoubleClick={() => handleEditItem(item)}
                >
                  <td className='px-4 py-3'>
                    <div className='text-xs font-mono text-on-surface-variant'>
                      #{item.product_id}
                    </div>
                    {/* Si hay variante, mostrar su SKU; si no, el SKU del producto */}
                    {(item.variant_sku || item.sku) && item.sku !== '-' && (
                      <div className='text-[10px] text-outline font-mono mt-0.5'>
                        {item.variant_sku || item.sku}
                      </div>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='font-semibold text-sm text-on-surface group-hover/row:text-primary transition-colors'>
                      {item.name}
                    </div>
                    {/* Atributos de variante como badges */}
                    {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {Object.entries(item.variant_attributes).map(([key, val]) => (
                          <span
                            key={key}
                            className='inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-[rgba(0,120,212,0.08)] border border-[rgba(0,120,212,0.2)] text-primary'
                          >
                            <span className='opacity-70 mr-0.5'>{key}:</span>
                            <span className='font-semibold'>{String(val)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Tags del producto */}
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {item.tags.slice(0, 3).map((tag: any) => (
                          <span
                            key={tag.id}
                            className='inline-flex items-center px-1 py-0.5 rounded text-[8px] font-semibold text-white'
                            style={{ backgroundColor: tag.color || '#8b5cf6' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Fallback: variant_name si no hay atributos */}
                    {item.variant_name && (!item.variant_attributes || Object.keys(item.variant_attributes).length === 0) && (
                      <div className='text-[10px] text-outline'>
                        {item.variant_name}
                      </div>
                    )}
                    <div className='text-[10px] text-outline mt-0.5'>
                      Unidad: {item.unit}
                    </div>
                  </td>

                  <td className='px-4 py-3 text-center font-semibold text-on-surface'>
                    {formatNumber(item.quantity)} <span className='text-[10px] font-normal text-outline'>{item.unit}</span>
                  </td>
                  <td className='px-4 py-3 text-right text-sm text-on-surface-variant'>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className='px-4 py-3 text-right font-semibold text-success'>
                    {item.profit_pct.toFixed(1)}%
                  </td>
                  <td className='px-4 py-3 text-right font-semibold text-on-surface'>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='font-semibold text-primary'>
                      {formatCurrency(item.sale_price * item.quantity)}
                    </div>
                    <div className='text-[10px] text-success'>
                      +{formatCurrency((item.sale_price - item.unit_price) * item.quantity)}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      onClick={() => setPurchaseItems(prev => prev.filter(i => i.id !== item.id))}
                      className='p-1.5 text-outline hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all'
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
