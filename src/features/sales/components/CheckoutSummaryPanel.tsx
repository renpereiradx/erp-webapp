/**
 * CheckoutSummaryPanel — panel derecho del POS ("Checkout Summary" del mockup):
 * totales (Subtotal → liquidación IVA → Descuentos), TOTAL destacado, sub-card
 * de Precio Final de Venta (ajuste proporcional) y acciones Cobrar/Limpiar.
 *
 * Todos los cálculos llegan listos desde SalesNew.tsx (domain/saleCalculator);
 * acá solo se presentan. El único botón primary de la vista es Cobrar.
 */
import React from 'react';
import { AlertTriangle, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput';
import { useI18n } from '@/lib/i18n';

export interface TaxBucket {
  percent: number;
  amount: number;
}

interface CheckoutSummaryPanelProps {
  itemsCount: number;
  subtotal: number;
  taxBuckets: TaxBucket[];
  exento: number;
  lineDiscounts: number;
  generalDiscount: number;
  total: number;
  /** Desglose de merge con venta pendiente (null = venta simple). */
  pendingTotal: number | null;
  newTotal: number;
  /** Aviso: la venta pendiente continuada es de otra sucursal. */
  branchMismatchWarning: boolean;
  /** Precio final editable (solo en venta simple). */
  finalPriceValue: number;
  onFinalPriceChange: (targetTotal: number) => void;
  canEditFinalPrice: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
  isProcessingSale: boolean;
  canWrite: boolean;
  /** Modo merge: actualiza la venta pendiente en vez de cobrar una nueva. */
  mergeSaleId: string | null;
}

export const CheckoutSummaryPanel: React.FC<CheckoutSummaryPanelProps> = ({
  itemsCount,
  subtotal,
  taxBuckets,
  exento,
  lineDiscounts,
  generalDiscount,
  total,
  pendingTotal,
  newTotal,
  branchMismatchWarning,
  finalPriceValue,
  onFinalPriceChange,
  canEditFinalPrice,
  onCheckout,
  onClearCart,
  isProcessingSale,
  canWrite,
  mergeSaleId,
}) => {
  const { t } = useI18n();
  // Draft del input de Precio Final: mientras se tipea, el valor visible es
  // lo escrito (incluido vacío/borrado). Sin draft, el input controlado con
  // `total` re-escribe el valor derivado en el mismo tick y el cursor "se
  // traga" los dígitos; borrar todo dispararía además un ajuste a 0. El
  // commit solo ocurre con un número válido; al salir (blur) el draft se
  // descarta y vuelve a mostrarse el total real.
  const [finalPriceDraft, setFinalPriceDraft] = React.useState<string | null>(null);

  return (
    // Section plano (patrón PurchaseTotalsCard): el Card legacy de shadcn
    // pierde los overrides (cn sin tailwind-merge) y dejaba rounded-xl + p-6
    // residual → radio de modal y doble padding.
    <section className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
      <div className="pb-md">
        <h2 className="text-title-md text-foreground flex items-center gap-sm">
          <DollarSign size={18} className="text-primary" aria-hidden="true" />
          {t('sales.new.summary.title', 'Resumen de Venta')}
        </h2>
      </div>

      <div className="flex-1 flex flex-col">
        {itemsCount === 0 && (
          <div
            role="status"
            className="mb-md p-md bg-surface-muted text-on-surface-deep rounded-md border border-border-subtle flex items-center gap-sm"
          >
            <Info size={16} className="shrink-0" aria-hidden="true" />
            <p className="text-body-md">
              {t('sales.new.summary.emptyCart', 'Agrega productos al carrito para continuar.')}
            </p>
          </div>
        )}

        {branchMismatchWarning && (
          <div
            role="alert"
            className="mb-md p-md bg-warning/10 text-foreground rounded-md border border-warning/20 flex items-center gap-sm"
          >
            <AlertTriangle size={16} className="shrink-0 text-warning" aria-hidden="true" />
            <p className="text-body-md">
              {t(
                'sales.new.summary.branchWarning',
                'Estás modificando una venta pendiente originada en otra sucursal. Los productos que añadas descontarán inventario de la sucursal origen.',
              )}
            </p>
          </div>
        )}

        {/* Totales */}
        <div className="space-y-sm">
          {pendingTotal !== null ? (
            <div className="space-y-sm mb-sm bg-surface-muted p-md rounded-md">
              <div className="flex justify-between text-body-md text-on-surface-deep">
                <span>{t('sales.new.summary.previousSale', 'Venta Procesada (Anterior)')}</span>
                <span className="font-data-mono">{formatCurrency(pendingTotal)}</span>
              </div>
              <div className="flex justify-between text-body-md-bold text-foreground">
                <span>{t('sales.new.summary.newItems', 'Nuevos Ítems')}</span>
                <span className="font-data-mono">{formatCurrency(newTotal)}</span>
              </div>
              <div className="border-t border-divider my-xs" />
              <div className="flex justify-between text-body-md pt-xs">
                <span className="text-on-surface-deep">{t('sales.new.summary.combinedSubtotal', 'Subtotal Combinado')}</span>
                <span className="font-data-mono font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-body-md mb-sm">
              <span className="text-on-surface-deep">{t('sales.new.summary.subtotal', 'Subtotal')}</span>
              <span className="font-data-mono text-foreground">{formatCurrency(subtotal)}</span>
            </div>
          )}

          {/* Desglose de IVA por tasa (dinámico) */}
          <div className="space-y-xs py-sm border-y border-divider border-dashed">
            {taxBuckets.map((bucket) => (
              <div key={bucket.percent} className="flex justify-between text-label-caps text-on-surface-deep uppercase">
                <span>{t('sales.summary.vatLine', 'Liquidación IVA {pct}%', { pct: bucket.percent })}</span>
                <span className="font-data-mono">{formatCurrency(bucket.amount)}</span>
              </div>
            ))}
            {exento > 0 && (
              <div className="flex justify-between text-label-caps text-on-surface-deep uppercase">
                <span>{t('sales.summary.exempt', 'Monto Exento')}</span>
                <span className="font-data-mono">{formatCurrency(exento)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-body-md-bold text-error">
            <span>{t('sales.new.summary.discounts', 'Descuentos')}</span>
            <span className="font-data-mono">-{formatCurrency(lineDiscounts + generalDiscount)}</span>
          </div>
        </div>

        {/* TOTAL destacado (jerarquía máxima del panel) */}
        <div className="pt-md mt-md border-t border-divider flex justify-between items-end">
          <span className="text-label-caps text-on-surface-deep uppercase">
            {t('sales.new.summary.total', 'Total')}
          </span>
          <span
            className="text-headline-lg font-data-mono text-primary tracking-tight leading-none"
            data-testid="sales-total"
          >
            {formatCurrency(total)}
          </span>
        </div>

        {/* Precio Final de Venta (solo venta simple) */}
        {canEditFinalPrice && (
          <div className="p-md bg-surface-muted rounded-md border border-border-subtle space-y-sm mt-lg">
            <label
              htmlFor="final-sale-price"
              className="text-label-caps text-on-surface-deep uppercase flex items-center gap-1.5"
            >
              <DollarSign size={10} aria-hidden="true" />
              {t('sales.new.summary.finalPrice', 'Precio Final de Venta')}
            </label>
            <div className="relative">
              <Input
                id="final-sale-price"
                type="text"
                inputMode="numeric"
                value={finalPriceDraft !== null ? formatNumberInput(finalPriceDraft) : formatNumberInput(finalPriceValue)}
                onChange={(e) => {
                  const canonical = parseNumberInput(e.target.value);
                  setFinalPriceDraft(canonical);
                  const parsed = Number(canonical);
                  // Solo commitea números válidos; '' no dispara el ajuste
                  // proporcional hasta que haya un valor concreto.
                  if (canonical !== '' && Number.isFinite(parsed)) {
                    onFinalPriceChange(Math.max(0, parsed));
                  }
                }}
                onBlur={() => setFinalPriceDraft(null)}
                disabled={itemsCount === 0}
                className="h-11 pl-4 pr-16 text-body-lg font-data-mono text-primary border-divider bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-input"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-label-caps text-outline-fg uppercase pointer-events-none">
                {t('sales.new.summary.editable', 'Editable')}
              </div>
            </div>
            <p className="text-body-sm text-on-surface-deep px-xs leading-tight">
              {t(
                'sales.new.summary.finalPriceHint',
                'Este monto ajusta proporcionalmente todos los precios en el carrito.',
              )}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col justify-end gap-sm pt-lg mt-auto">
          <Button
            variant={mergeSaleId ? 'warning' : 'primary'}
            onClick={onCheckout}
            disabled={isProcessingSale || itemsCount === 0 || !canWrite}
            className="w-full h-12 text-body-sm-bold rounded-button uppercase tracking-widest"
            data-testid="sales-checkout-button"
          >
            {isProcessingSale
              ? t('sales.processing', 'Procesando...')
              : mergeSaleId
                ? t('sales.new.summary.updateSale', 'Actualizar Venta #{id} (F12)', { id: mergeSaleId })
                : t('sales.new.summary.checkout', 'Cobrar (F12)')}
          </Button>
          <Button variant="secondary" onClick={onClearCart} className="w-full" disabled={itemsCount === 0}>
            {t('sales.new.summary.clear', 'Limpiar Carrito (F4)')}
          </Button>
        </div>
      </div>
    </section>
  );
};
