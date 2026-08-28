/**
 * PaymentStep — paso del SaleCheckoutWizard.
 *
 * Selección de método de pago y moneda de cobro. Política: la venta se emite
 * en moneda base (PYG); si el operador elige cobrar en otra divisa, muestra el
 * input de tasa de cambio (precargada desde Tipos de Cambio y editable) y el
 * equivalente CALCULADO del total en esa divisa — el monto ya no se tipea a
 * mano. El monto recibido en divisa se carga en el paso de Cobro.
 */
import { forwardRef, useImperativeHandle, useEffect, useMemo, useRef } from 'react'
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
import { computeForeignDue } from '@/domain/sale/calculations/foreignPayment'
import { formatCurrency } from '@/utils/currencyUtils'
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
  /** Total del carrito en moneda base: se usa para el equivalente en divisa. */
  totalAmount: number
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
      totalAmount,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const firstInputRef = useRef<HTMLButtonElement>(null)

    const baseCurrency = currencies.find((c) => c.is_base || c.is_base_currency)
    const selectedCurrency = currencies.find((c) => String(c.id) === String(currencyId))
    const isMultiCurrency =
      selectedCurrency && baseCurrency && String(selectedCurrency.id) !== String(baseCurrency.id)

    const rate = Number(exchangeRate) || 0
    const foreignDue = useMemo(
      () => (isMultiCurrency ? computeForeignDue(totalAmount, rate) : 0),
      [isMultiCurrency, totalAmount, rate],
    )

    useImperativeHandle(ref, () => ({
      focus: () => firstInputRef.current?.focus(),
    }))

    // Precarga del tipo de cambio cuando se selecciona una divisa distinta.
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
          /* sin tasa cargada el operador debe tipearla acá: sin tasa no se
             puede avanzar al cobro (el wizard bloquea Avanzar), porque un
             cobro en divisa sin tasa nunca llega al backend como divisa. */
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
              <label className="text-label-caps text-on-surface-deep" htmlFor="wizard-payment-method">
                {t('sales.checkoutWizard.payment.method', 'Método de pago')}
              </label>
            </div>
            <Select value={String(paymentMethodId)} onValueChange={(v) => setPaymentMethodId(Number(v))}>
              <SelectTrigger id="wizard-payment-method" ref={firstInputRef} className="w-full h-11 bg-surface border-divider focus:ring-primary focus:border-primary">
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
              <label className="text-label-caps text-on-surface-deep" htmlFor="wizard-currency">
                {t('sales.checkoutWizard.payment.currency', 'Moneda de cobro')}
              </label>
            </div>
            <Select
              value={String(currencyId)}
              onValueChange={(v) => {
                // Al cambiar la divisa la tasa previa queda obsoleta (era de
                // la otra moneda): se limpia para que el efecto de precarga
                // traiga la que corresponde.
                setExchangeRate('')
                setCurrencyId(Number(v))
              }}
            >
              <SelectTrigger id="wizard-currency" className="w-full h-11 bg-surface border-divider focus:ring-primary focus:border-primary">
                <SelectValue placeholder={t('sales.checkoutWizard.payment.currency', 'Moneda de cobro')} />
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
          <div className="p-4 bg-surface-muted rounded-md border border-divider space-y-3 animate-in fade-in duration-200">
            <p className="text-label-caps text-on-surface-deep">
              {t('sales.checkoutWizard.payment.multiCurrency', 'Cobro en otra moneda')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-deep" htmlFor="wizard-exchange-rate">
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
                <p className="text-xs text-on-surface-deep">
                  {t(
                    'sales.checkoutWizard.payment.exchangeRateHint',
                    '1 {currency} = ? {base}. Se precarga del día; ajustala si tu cotización es otra.',
                    { currency: selectedCurrency?.code || '', base: baseCurrency?.code || 'PYG' },
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-deep" htmlFor="wizard-foreign-due">
                  {t('sales.checkoutWizard.payment.foreignDue', 'Total en {currency}', {
                    currency: selectedCurrency?.code || '',
                  })}
                </label>
                <div
                  id="wizard-foreign-due"
                  className="h-10 flex items-center px-3 rounded-sm bg-surface-subtle border border-divider font-data-mono text-sm font-bold"
                >
                  {foreignDue > 0
                    ? formatCurrency(foreignDue, selectedCurrency?.code || '')
                    : t('sales.checkoutWizard.payment.ratePending', 'Cargá la tasa para ver el equivalente')}
                </div>
                <p className="text-xs text-on-surface-deep">
                  {t(
                    'sales.checkoutWizard.payment.foreignDueHint',
                    'Equivalente calculado con la tasa de arriba. El documento se emite en {base}.',
                    { base: baseCurrency?.code || 'PYG' },
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

PaymentStep.displayName = 'PaymentStep'
