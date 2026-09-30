/**
 * PurchasePaymentStep — paso 2 del PurchaseCheckoutWizard.
 *
 * Selección de método de pago (grilla de tarjetas con hotkeys [1..9], el
 * patrón canónico compartido con el wizard de ventas vía PaymentMethodGrid),
 * moneda y notas de la compra. Agrupa los tres campos en un solo paso para
 * mantener el wizard ágil (las notas no ameritan un paso separado).
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
import { PaymentMethodGrid } from '@/components/checkout/PaymentMethodGrid'
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" aria-hidden="true" />
            <span className="text-label-caps text-on-surface-deep" id="wizard-purchase-method-label">
              {t('purchases.checkoutWizard.payment.method', 'Método de pago')}
            </span>
          </div>
          <PaymentMethodGrid
            methods={paymentMethods}
            selectedId={paymentMethod}
            onSelect={setPaymentMethod}
            labelFor={getPaymentMethodLabel}
            labelledbyId="wizard-purchase-method-label"
            firstButtonRef={methodRef}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-primary" aria-hidden="true" />
            <label className="text-label-caps text-on-surface-deep" htmlFor="wizard-purchase-currency">
              {t('purchases.checkoutWizard.payment.currency', 'Moneda')}
            </label>
          </div>
          <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
            <SelectTrigger
              id="wizard-purchase-currency"
              className="w-full h-11 bg-surface border-divider focus:ring-primary focus:border-primary"
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

        {/* Notas de la compra */}
        <div className="space-y-2 pt-2 border-t border-divider">
          <div className="flex items-center gap-2">
            <StickyNote size={16} className="text-on-surface-deep" />
            <label className="text-label-caps text-on-surface-deep" htmlFor="wizard-purchase-notes">
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
            className="w-full h-20 p-3 rounded-md border border-border-subtle bg-surface text-body-md text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>
    )
  },
)

PurchasePaymentStep.displayName = 'PurchasePaymentStep'
