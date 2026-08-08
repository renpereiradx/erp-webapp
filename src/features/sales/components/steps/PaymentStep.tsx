/**
 * PaymentStep — paso del SaleCheckoutWizard.
 *
 * Selección de método de pago y moneda. Si la moneda difiere de la moneda
 * base, muestra inputs para tasa de cambio y monto original (campos que el
 * backend ahora respeta en el cobro con caja). Opcionalmente precarga la
 * tasa desde el servicio de tipos de cambio.
 */
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { CreditCard, DollarSign } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ExchangeRateService } from '@/services/exchangeRateService'
import { useI18n } from '@/lib/i18n'

export interface PaymentStepRef {
  focus: () => void
}

interface PaymentStepProps {
  paymentMethods: any[]
  paymentMethodId: number
  setPaymentMethodId: (id: number) => void
  currencies: any[]
  currencyId: number
  setCurrencyId: (id: number) => void
  /** Callbacks para que el orquestador conserve el estado de tipo de cambio. */
  exchangeRate: string
  setExchangeRate: (v: string) => void
  originalAmount: string
  setOriginalAmount: (v: string) => void
}

export const PaymentStep = forwardRef<PaymentStepRef, PaymentStepProps>(
  (
    {
      paymentMethods,
      paymentMethodId,
      setPaymentMethodId,
      currencies,
      currencyId,
      setCurrencyId,
      exchangeRate,
      setExchangeRate,
      originalAmount,
      setOriginalAmount,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const firstInputRef = useRef<HTMLButtonElement>(null)

    const baseCurrency = currencies.find((c) => c.is_base || c.is_base_currency)
    const selectedCurrency = currencies.find((c) => String(c.id) === String(currencyId))
    const isMultiCurrency =
      selectedCurrency && baseCurrency && String(selectedCurrency.id) !== String(baseCurrency.id)

    useImperativeHandle(ref, () => ({
      focus: () => firstInputRef.current?.focus(),
    }))

    // Precarga del tipo de cambio cuando se selecciona una moneda distinta.
    useEffect(() => {
      if (!isMultiCurrency || !selectedCurrency || exchangeRate) return
      let cancelled = false
      ExchangeRateService.getLatest(selectedCurrency.id)
        .then((rate: any) => {
          if (cancelled || !rate) return
          const value = rate.rate_to_base ?? rate.rate
          if (value) setExchangeRate(String(value))
        })
        .catch(() => {
          /* el operador ingresa la tasa manualmente */
        })
      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMultiCurrency, selectedCurrency?.id])

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-payment-method">
                {t('sales.checkoutWizard.payment.method', 'Método de pago')}
              </label>
            </div>
            <Select value={String(paymentMethodId)} onValueChange={(v) => setPaymentMethodId(Number(v))}>
              <SelectTrigger id="wizard-payment-method" ref={firstInputRef} className="w-full h-11 bg-surface-container-lowest border-outline-variant focus:ring-primary focus:border-primary">
                <SelectValue placeholder={t('sales.checkoutWizard.payment.method', 'Método de pago')} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name || method.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-currency">
                {t('sales.checkoutWizard.payment.currency', 'Moneda')}
              </label>
            </div>
            <Select value={String(currencyId)} onValueChange={(v) => setCurrencyId(Number(v))}>
              <SelectTrigger id="wizard-currency" className="w-full h-11 bg-surface-container-lowest border-outline-variant focus:ring-primary focus:border-primary">
                <SelectValue placeholder={t('sales.checkoutWizard.payment.currency', 'Moneda')} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={String(currency.id)}>
                    {currency.code || currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isMultiCurrency && (
          <div className="p-4 bg-surface-container-low rounded-md border border-outline-variant space-y-3 animate-in fade-in duration-200">
            <p className="text-label-caps text-on-surface-variant">
              {t('sales.checkoutWizard.payment.multiCurrency', 'Cobro en otra moneda')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant" htmlFor="wizard-exchange-rate">
                  {t('sales.checkoutWizard.payment.exchangeRate', 'Tasa de cambio')}
                </label>
                <Input
                  id="wizard-exchange-rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="h-10 font-data-mono"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant" htmlFor="wizard-original-amount">
                  {t('sales.checkoutWizard.payment.originalAmount', 'Monto original')}
                </label>
                <Input
                  id="wizard-original-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="h-10 font-data-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

PaymentStep.displayName = 'PaymentStep'
