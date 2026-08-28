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
    <section className='bg-surface rounded-md border border-surface-deep shadow-whisper p-5 animate-in slide-in-from-right-2 duration-500 delay-75'>
      <h3 className='text-base font-semibold text-foreground mb-4'>
        Configuración Financiera
      </h3>

      <div className='space-y-4'>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-on-surface-deep block'>
            Método de Pago
          </label>
          <select
            className='w-full px-3 py-2 bg-surface-muted border border-surface-deep rounded-md text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer'
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
          <label className='text-xs font-medium text-on-surface-deep block'>
            Moneda de Transacción
          </label>
          <select
            className='w-full px-3 py-2 bg-surface-muted border border-surface-deep rounded-md text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer'
            value={paymentCurrency}
            onChange={e => setPaymentCurrency(e.target.value)}
          >
            {currencies.map(c => (
              <option key={c.id} value={c.code || c.currency_code}>
                {c.code || c.currency_code} - {getCurrencyLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-1.5 pt-2 border-t border-surface-deep'>
          <label className='text-xs font-medium text-on-surface-deep block'>
            Notas de la Compra (Opcional)
          </label>
          <textarea
            className='w-full px-3 py-2 bg-surface-muted border border-surface-deep rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none'
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
