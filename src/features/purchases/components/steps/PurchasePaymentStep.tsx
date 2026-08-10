/**
 * PurchasePaymentStep — paso 2 del PurchaseCheckoutWizard.
 *
 * Selección de método de pago, moneda y notas de la compra. Agrupa los tres
 * campos en un solo paso para mantener el wizard ágil (las notas no ameritan
 * un paso separado).
 */
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { CreditCard, DollarSign, StickyNote } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'

export interface PurchasePaymentStepRef {
  focus: () => void
}

interface PurchasePaymentStepProps {
  paymentMethods: any[]
  paymentMethod: string
  setPaymentMethod: (v: string) => void
  currencies: any[]
  paymentCurrency: string
  setPaymentCurrency: (v: string) => void
  purchaseNotes: string
  setPurchaseNotes: (v: string) => void
  getPaymentMethodLabel: (m: any) => string
  getCurrencyLabel: (c: any) => string
}

export const PurchasePaymentStep = forwardRef<PurchasePaymentStepRef, PurchasePaymentStepProps>(
  (
    {
      paymentMethods,
      paymentMethod,
      setPaymentMethod,
      currencies,
      paymentCurrency,
      setPaymentCurrency,
      purchaseNotes,
      setPurchaseNotes,
      getPaymentMethodLabel,
      getCurrencyLabel,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const methodRef = useRef<HTMLButtonElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => methodRef.current?.focus(),
    }))

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-purchase-method">
                {t('purchases.checkoutWizard.payment.method', 'Método de pago')}
              </label>
            </div>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger
                id="wizard-purchase-method"
                ref={methodRef}
                className="w-full h-11 bg-surface-container-lowest border-outline-variant focus:ring-primary focus:border-primary"
              >
                <SelectValue placeholder={t('purchases.checkoutWizard.payment.method', 'Método de pago')} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {getPaymentMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-purchase-currency">
                {t('purchases.checkoutWizard.payment.currency', 'Moneda')}
              </label>
            </div>
            <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
              <SelectTrigger
                id="wizard-purchase-currency"
                className="w-full h-11 bg-surface-container-lowest border-outline-variant focus:ring-primary focus:border-primary"
              >
                <SelectValue placeholder={t('purchases.checkoutWizard.payment.currency', 'Moneda')} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.code || currency.currency_code}>
                    {currency.code || currency.currency_code} - {getCurrencyLabel(currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notas de la compra */}
        <div className="space-y-2 pt-2 border-t border-surface-variant">
          <div className="flex items-center gap-2">
            <StickyNote size={16} className="text-on-surface-variant" />
            <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-purchase-notes">
              {t('purchases.checkoutWizard.payment.notes', 'Notas de la compra')}
            </label>
          </div>
          <textarea
            id="wizard-purchase-notes"
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder={t(
              'purchases.checkoutWizard.payment.notesPlaceholder',
              'Ej: Pedido urgente de insumos...',
            )}
            className="w-full h-20 p-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>
    )
  },
)

PurchasePaymentStep.displayName = 'PurchasePaymentStep'
