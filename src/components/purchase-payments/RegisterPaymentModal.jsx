import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Loader2, Wallet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useI18n } from '@/lib/i18n'
import '@/styles/scss/pages/_purchase-payments-mvp.scss'

const currencyFormatter = (lang, currency) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: currency || 'PYG',
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  })

const normalizeNumber = value => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(
    String(value)
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.')
  )
  if (Number.isNaN(parsed)) return null
  return parsed
}

const defaultCashRegisters = [
  {
    value: 'main',
    label: 'purchasePaymentsMvp.registerModal.cashRegister.main',
  },
  {
    value: 'secondary',
    label: 'purchasePaymentsMvp.registerModal.cashRegister.secondary',
  },
]

const defaultCurrencies = [
  { value: 'PYG', label: 'PYG - Guaraní paraguayo' },
  { value: 'USD', label: 'USD - Dólar estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'BRL', label: 'BRL - Real brasileño' },
]

const paymentMethods = [
  {
    value: 'transfer',
    label: 'purchasePaymentsMvp.registerModal.method.transfer',
  },
  { value: 'cash', label: 'purchasePaymentsMvp.registerModal.method.cash' },
]

const RegisterPaymentModal = ({
  open,
  onOpenChange,
  order,
  onSubmit,
  cashRegisters = defaultCashRegisters,
  currencies = defaultCurrencies,
}) => {
  const { t, lang } = useI18n()

  const pendingAmount = useMemo(
    () => normalizeNumber(order?.pendingAmount),
    [order]
  )
  const defaultCurrency = order?.currency || currencies[0]?.value || 'PYG'

  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [cashRegister, setCashRegister] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!open) return
    const nextCurrency = order?.currency || defaultCurrency
    const normalizedPending = normalizeNumber(order?.pendingAmount)
    const decimals = nextCurrency === 'PYG' ? 0 : 2
    const formattedAmount =
      normalizedPending === null ? '' : normalizedPending.toFixed(decimals)

    setAmount(formattedAmount)
    setReference('')
    setPaymentMethod(paymentMethods[0].value)
    setCurrency(nextCurrency)
    setCashRegister('')
    setNotes('')
    setFormError(null)
  }, [open, order, defaultCurrency])

  const formattedPendingLabel = useMemo(() => {
    if (pendingAmount === null) return '—'
    return currencyFormatter(lang, order?.currency || currency).format(
      pendingAmount
    )
  }, [currency, lang, order?.currency, pendingAmount])

  const numericAmount = useMemo(() => normalizeNumber(amount), [amount])
  const exceedsPending = useMemo(
    () =>
      pendingAmount !== null &&
      numericAmount !== null &&
      numericAmount > pendingAmount,
    [numericAmount, pendingAmount]
  )
  const hasAmountError = useMemo(
    () => numericAmount === null || numericAmount <= 0 || exceedsPending,
    [numericAmount, exceedsPending]
  )

  const handleClose = nextOpen => {
    if (isSubmitting) return
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!order) return

    if (hasAmountError) {
      setFormError(
        exceedsPending
          ? t('purchasePaymentsMvp.registerModal.amount.errorExceeded')
          : t('purchasePaymentsMvp.registerModal.amount.errorRequired')
      )
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    const payload = {
      orderId: order.id,
      amount: numericAmount,
      reference,
      paymentMethod,
      currency,
      cashRegister,
      notes,
    }

    try {
      await onSubmit?.(payload)
      handleClose(false)
    } catch (error) {
      setFormError(
        error?.message || t('purchasePaymentsMvp.registerModal.submitError')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='purchase-payments-mvp-register'>
        <DialogHeader className='purchase-payments-mvp-register__header'>
          <DialogTitle className='purchase-payments-mvp-register__title'>
            {t('purchasePaymentsMvp.registerModal.title')}
          </DialogTitle>
          <DialogDescription className='purchase-payments-mvp-register__subtitle'>
            {order
              ? t('purchasePaymentsMvp.registerModal.orderLabel', {
                  orderId: order.id,
                })
              : t('purchasePaymentsMvp.registerModal.orderFallback')}
          </DialogDescription>
        </DialogHeader>

        <form
          className='purchase-payments-mvp-register__form'
          onSubmit={handleSubmit}
        >
          <div className='purchase-payments-mvp-register__grid'>
            <div className='purchase-payments-mvp-register__field'>
              <label
                className='purchase-payments-mvp-register__label'
                htmlFor='purchase-payment-amount'
              >
                {t('purchasePaymentsMvp.registerModal.amount.label')}
              </label>
              <div
                className={`purchase-payments-mvp-register__input-wrapper${
                  exceedsPending
                    ? ' purchase-payments-mvp-register__input-wrapper--error'
                    : ''
                }`}
              >
                <Wallet
                  className='purchase-payments-mvp-register__input-icon'
                  aria-hidden='true'
                />
                <Input
                  id='purchase-payment-amount'
                  className='purchase-payments-mvp-register__input purchase-payments-mvp-register__input--amount'
                  inputMode='decimal'
                  value={amount}
                  onChange={event => {
                    setAmount(event.target.value)
                    if (formError) setFormError(null)
                  }}
                  placeholder='0.00'
                  aria-invalid={hasAmountError}
                />
              </div>
              {formError && hasAmountError && (
                <p className='purchase-payments-mvp-register__error'>
                  {formError}
                </p>
              )}
              <p className='purchase-payments-mvp-register__hint'>
                {t('purchasePaymentsMvp.registerModal.amount.pending', {
                  amount: formattedPendingLabel,
                })}
              </p>
            </div>

            <div className='purchase-payments-mvp-register__field'>
              <label
                className='purchase-payments-mvp-register__label'
                htmlFor='purchase-payment-reference'
              >
                {t('purchasePaymentsMvp.registerModal.reference.label')}
              </label>
              <Input
                id='purchase-payment-reference'
                className='purchase-payments-mvp-register__input'
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.reference.placeholder'
                )}
                value={reference}
                onChange={event => {
                  setReference(event.target.value)
                  if (formError) setFormError(null)
                }}
              />
            </div>

            <div className='purchase-payments-mvp-register__field'>
              <p className='purchase-payments-mvp-register__label'>
                {t('purchasePaymentsMvp.registerModal.method.label')}
              </p>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className='purchase-payments-mvp-register__method-group'
              >
                {paymentMethods.map(option => (
                  <label
                    key={option.value}
                    className={`purchase-payments-mvp-register__method-option${
                      paymentMethod === option.value
                        ? ' purchase-payments-mvp-register__method-option--active'
                        : ''
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      className='purchase-payments-mvp-register__method-radio'
                    />
                    <span>{t(option.label)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className='purchase-payments-mvp-register__field'>
              <label
                className='purchase-payments-mvp-register__label'
                htmlFor='purchase-payment-currency'
              >
                {t('purchasePaymentsMvp.registerModal.currency.label')}
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger
                  id='purchase-payment-currency'
                  className='purchase-payments-mvp-register__select-trigger'
                >
                  <SelectValue>{currency}</SelectValue>
                </SelectTrigger>
                <SelectContent className='purchase-payments-mvp-register__select-content'>
                  {currencies.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className='purchase-payments-mvp-register__select-item'
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='purchase-payments-mvp-register__field'>
              <label
                className='purchase-payments-mvp-register__label'
                htmlFor='purchase-payment-cash-register'
              >
                {t('purchasePaymentsMvp.registerModal.cashRegister.label')}
              </label>
              <Select value={cashRegister} onValueChange={setCashRegister}>
                <SelectTrigger
                  id='purchase-payment-cash-register'
                  className='purchase-payments-mvp-register__select-trigger'
                >
                  <SelectValue
                    placeholder={t(
                      'purchasePaymentsMvp.registerModal.cashRegister.placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='purchase-payments-mvp-register__select-content'>
                  {cashRegisters.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className='purchase-payments-mvp-register__select-item'
                    >
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='purchase-payments-mvp-register__field purchase-payments-mvp-register__field--full'>
              <label
                className='purchase-payments-mvp-register__label'
                htmlFor='purchase-payment-notes'
              >
                {t('purchasePaymentsMvp.registerModal.notes.label')}
              </label>
              <Textarea
                id='purchase-payment-notes'
                className='purchase-payments-mvp-register__textarea'
                rows={4}
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.notes.placeholder'
                )}
                value={notes}
                onChange={event => {
                  setNotes(event.target.value)
                  if (formError) setFormError(null)
                }}
              />
            </div>
          </div>

          {exceedsPending && (
            <div
              className='purchase-payments-mvp-register__warning'
              role='alert'
            >
              <span
                className='purchase-payments-mvp-register__warning-icon'
                aria-hidden='true'
              >
                !
              </span>
              <div className='purchase-payments-mvp-register__warning-content'>
                <p className='purchase-payments-mvp-register__warning-title'>
                  {t('purchasePaymentsMvp.registerModal.warning.title')}
                </p>
                <p className='purchase-payments-mvp-register__warning-description'>
                  {t('purchasePaymentsMvp.registerModal.warning.message')}
                </p>
              </div>
            </div>
          )}

          {formError && !hasAmountError && (
            <div
              className='purchase-payments-mvp-register__form-error'
              role='alert'
            >
              {formError}
            </div>
          )}

          <div className='purchase-payments-mvp-register__actions'>
            <Button
              type='button'
              variant='outline'
              className='purchase-payments-mvp-register__button'
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              {t('purchasePaymentsMvp.registerModal.cancel')}
            </Button>
            <Button
              type='submit'
              className='purchase-payments-mvp-register__button purchase-payments-mvp-register__button--primary'
              disabled={isSubmitting || hasAmountError}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='purchase-payments-mvp-register__button-icon purchase-payments-mvp-register__button-icon--spin' />
                  {t('purchasePaymentsMvp.registerModal.loading')}
                </>
              ) : (
                <>
                  <CheckCircle className='purchase-payments-mvp-register__button-icon' />
                  {t('purchasePaymentsMvp.registerModal.confirm')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
