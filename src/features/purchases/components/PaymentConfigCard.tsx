import React from 'react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';

export type PaymentConfigCardProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'paymentMethod'
  | 'setPaymentMethod'
  | 'paymentMethods'
  | 'getPaymentMethodLabel'
  | 'paymentCurrency'
  | 'setPaymentCurrency'
  | 'currencies'
  | 'getCurrencyLabel'
  | 'purchaseNotes'
  | 'setPurchaseNotes'
>;

export const PaymentConfigCard: React.FC<PaymentConfigCardProps> = ({
  paymentMethod,
  setPaymentMethod,
  paymentMethods,
  getPaymentMethodLabel,
  paymentCurrency,
  setPaymentCurrency,
  currencies,
  getCurrencyLabel,
  purchaseNotes,
  setPurchaseNotes,
}) => {
  return (
    <section className='bg-[var(--fluent-surface-card,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-xlarge,8px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] shadow-[var(--fluent-shadow-4)] p-5 animate-in slide-in-from-right-2 duration-500 delay-75'>
      <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white mb-4'>
        Configuración Financiera
      </h3>

      <div className='space-y-4'>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
            Método de Pago
          </label>
          <select
            className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          >
            {paymentMethods.map(m => (
              <option key={m.id} value={m.id}>
                {getPaymentMethodLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
            Moneda de Transacción
          </label>
          <select
            className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
            value={paymentCurrency}
            onChange={e => setPaymentCurrency(e.target.value)}
          >
            {currencies.map(c => (
              <option key={c.id} value={c.currency_code}>
                {c.currency_code} - {getCurrencyLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-1.5 pt-2 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
          <label className='text-xs font-medium text-[var(--fluent-text-secondary,#605E5C)] block'>
            Notas de la Compra (Opcional)
          </label>
          <textarea
            className='w-full px-3 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all resize-none'
            rows={3}
            placeholder='Ej: Pedido urgente de insumos...'
            value={purchaseNotes}
            onChange={e => setPurchaseNotes(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
};
