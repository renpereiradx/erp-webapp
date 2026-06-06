import React from 'react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { formatCurrency } from '@/utils/currencyUtils';

export type PurchaseTotalsCardProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'purchaseItems'
  | 'purchaseTotals'
  | 'handleSavePurchase'
  | 'loading'
  | 'canWrite'
  | 'selectedSupplier'
  | 'setPurchaseItems'
  | 'setSelectedSupplier'
  | 'setSupplierSearch'
>;

export const PurchaseTotalsCard: React.FC<PurchaseTotalsCardProps> = ({
  purchaseItems,
  purchaseTotals,
  handleSavePurchase,
  loading,
  canWrite,

  selectedSupplier,
  setPurchaseItems,
  setSelectedSupplier,
  setSupplierSearch,
}) => {
  return (
    <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5 animate-in slide-in-from-bottom-2 duration-500 delay-75'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-3'>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
              Artículos Totales
            </span>
            <span className='font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] px-2.5 py-0.5 rounded-[var(--fluent-corner-radius-medium,4px)]'>
              {purchaseItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
              Total Compra
            </span>
            <span className='text-[var(--fluent-text-primary,#212121)] dark:text-white font-bold'>
              {formatCurrency(purchaseTotals.subtotal)}
            </span>
          </div>

          {/* Liquidación IVA Breakdown */}
          <div className='pt-1.5 space-y-1 border-t border-[var(--fluent-border-subtle,#F0F0F0)] dark:border-[var(--fluent-neutral-grey-140,#484644)]'>
            <p className='text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1'>Liquidación IVA (Incluido)</p>
            {purchaseTotals.iva10 > 0 && (
              <div className='flex justify-between items-center'>
                <span className='text-[11px] text-gray-500 dark:text-gray-400'>IVA 10%</span>
                <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.iva10)}</span>
              </div>
            )}
            {purchaseTotals.iva5 > 0 && (
              <div className='flex justify-between items-center'>
                <span className='text-[11px] text-gray-500 dark:text-gray-400'>IVA 5%</span>
                <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.iva5)}</span>
              </div>
            )}
            {purchaseTotals.exento > 0 && (
              <div className='flex justify-between items-center'>
                <span className='text-[11px] text-gray-500 dark:text-gray-400'>Exento</span>
                <span className='text-[11px] font-medium text-gray-700 dark:text-gray-300'>{formatCurrency(purchaseTotals.exento)}</span>
              </div>
            )}
          </div>

          <div className='flex justify-between items-center text-sm'>
            <span className='text-[var(--fluent-text-secondary,#605E5C)]'>
              Venta Esperada
            </span>
            <span className='font-medium text-[var(--fluent-brand-primary,#0078D4)]'>
              {formatCurrency(
                purchaseItems.reduce(
                  (s, i) => s + i.quantity * i.sale_price,
                  0,
                ),
              )}
            </span>
          </div>
          <div className='h-px bg-[var(--fluent-border-neutral,#E1DFDD)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] my-2'></div>
          <div className='flex justify-between items-center text-sm'>
            <span className='font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
              Ganancia Proyectada
            </span>
            <div className='text-right'>
              <span
                className={`text-lg font-bold ${purchaseItems.reduce((s, i) => s + i.quantity * i.sale_price, 0) - purchaseItems.reduce((s, i) => s + i.quantity * i.unit_price, 0) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
              >
                {formatCurrency(
                  purchaseItems.reduce(
                    (s, i) => s + i.quantity * i.sale_price,
                    0,
                  ) -
                    purchaseItems.reduce(
                      (s, i) => s + i.quantity * i.unit_price,
                      0,
                    ),
                )}
              </span>
              {purchaseItems.length > 0 &&
                purchaseItems.reduce(
                  (s, i) => s + i.quantity * i.unit_price,
                  0,
                ) > 0 && (
                  <span className='ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]'>
                    (+
                    {(
                      (purchaseItems.reduce(
                        (s, i) => s + i.quantity * i.sale_price,
                        0,
                      ) /
                        purchaseItems.reduce(
                          (s, i) => s + i.quantity * i.unit_price,
                          0,
                        ) -
                        1) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                )}
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-3 justify-end'>
          <button
            className='w-full py-3 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] disabled:opacity-50 disabled:pointer-events-none text-sm'
            onClick={handleSavePurchase}
            disabled={
              !selectedSupplier ||
              purchaseItems.length === 0 ||
              loading ||
              !canWrite
            }
          >
            {loading ? 'Procesando...' : 'Confirmar y Guardar Compra'}
          </button>
          <button
            className='w-full py-3 border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] hover:bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)] text-[var(--fluent-text-secondary,#605E5C)] font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] text-sm'
            onClick={() => {
              if (confirm('¿Borrar toda la orden?')) {
                setPurchaseItems([]);
                setSelectedSupplier(null);
                setSupplierSearch('');
              }
            }}
          >
            Cancelar Todo
          </button>
        </div>
      </div>
    </section>
  );
};
