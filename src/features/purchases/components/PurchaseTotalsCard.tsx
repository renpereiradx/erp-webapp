import React from 'react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currencyUtils';

export type PurchaseTotalsCardProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'purchaseItems'
  | 'purchaseTotals'
  | 'loading'
  | 'canWrite'
  | 'setPurchaseItems'
  | 'setSelectedSupplier'
  | 'setSupplierSearch'
> & {
  onCheckout: () => void;
};

export const PurchaseTotalsCard: React.FC<PurchaseTotalsCardProps> = ({
  purchaseItems,
  purchaseTotals,
  loading,
  canWrite,
  setPurchaseItems,
  setSelectedSupplier,
  setSupplierSearch,
  onCheckout,
}) => {
  const { t } = useI18n();

  // Valores derivados para presentación (misma aritmética de siempre).
  const totalCost = purchaseItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const expectedSale = purchaseItems.reduce((s, i) => s + i.quantity * i.sale_price, 0);
  const projectedProfit = expectedSale - totalCost;
  const profitPct =
    totalCost > 0 ? ((expectedSale / totalCost - 1) * 100).toFixed(1) : null;
  const totalItems = purchaseItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <section className='bg-surface rounded-md shadow-whisper border-0 p-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-lg'>
        <div className='space-y-sm'>
          <div className='flex justify-between items-center text-body-md'>
            <span className='text-on-surface-deep'>
              {t('purchases.totals.items', 'Artículos Totales')}
            </span>
            <span className='text-data-mono font-data-mono text-foreground bg-surface-subtle px-2 py-0.5 rounded-sm'>
              {totalItems}
            </span>
          </div>
          <div className='flex justify-between items-center text-body-md'>
            <span className='text-on-surface-deep'>
              {t('purchases.totals.total', 'Total Compra')}
            </span>
            <span className='text-data-mono font-data-mono text-foreground'>
              {formatCurrency(purchaseTotals.subtotal)}
            </span>
          </div>

          {/* Liquidación IVA Breakdown (por tasa, dinámico) */}
          <div className='pt-sm space-y-1 border-t border-border-subtle'>
            <p className='text-label-caps uppercase text-outline-fg'>
              {t('purchases.totals.vatIncluded', 'Liquidación IVA (Incluido)')}
            </p>
            {purchaseTotals.tax_buckets.map(bucket => (
              <div key={bucket.percent} className='flex justify-between items-center'>
                <span className='text-body-sm text-on-surface-deep'>
                  {t('purchases.totals.vatRate', 'IVA {pct}%', { pct: bucket.percent })}
                </span>
                <span className='text-body-sm font-data-mono text-foreground'>
                  {formatCurrency(bucket.amount)}
                </span>
              </div>
            ))}
            {purchaseTotals.exento > 0 && (
              <div className='flex justify-between items-center'>
                <span className='text-body-sm text-on-surface-deep'>
                  {t('purchases.totals.exempt', 'Exento')}
                </span>
                <span className='text-body-sm font-data-mono text-foreground'>
                  {formatCurrency(purchaseTotals.exento)}
                </span>
              </div>
            )}
          </div>

          <div className='flex justify-between items-center text-body-md'>
            <span className='text-on-surface-deep'>
              {t('purchases.totals.expected_sale', 'Venta Esperada')}
            </span>
            <span className='text-data-mono font-data-mono text-primary'>
              {formatCurrency(expectedSale)}
            </span>
          </div>
          <div className='h-px bg-divider my-1'></div>
          <div className='flex justify-between items-center text-body-md'>
            <span className='text-body-md-bold text-foreground'>
              {t('purchases.totals.projected_profit', 'Ganancia Proyectada')}
            </span>
            <div className='text-right'>
              <span
                className={`text-title-md text-data-mono font-data-mono ${projectedProfit >= 0 ? 'text-success' : 'text-error'}`}
              >
                {formatCurrency(projectedProfit)}
              </span>
              {profitPct && totalCost > 0 && (
                <span className='ml-1.5 text-body-sm text-success'>
                  (+{profitPct}%)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-md justify-end'>
          <Button
            variant='primary'
            size='lg'
            onClick={onCheckout}
            disabled={purchaseItems.length === 0 || loading || !canWrite}
          >
            {loading
              ? t('purchases.totals.processing', 'Procesando...')
              : t('purchases.totals.buy', 'Comprar (F12)')}
          </Button>
          <Button
            variant='secondary'
            size='lg'
            onClick={() => {
              if (confirm(t('purchases.totals.clear_confirm', '¿Borrar toda la orden?'))) {
                setPurchaseItems([]);
                setSelectedSupplier(null);
                setSupplierSearch('');
              }
            }}
          >
            {t('purchases.totals.clear_all', 'Cancelar Todo')}
          </Button>
        </div>
      </div>
    </section>
  );
};
