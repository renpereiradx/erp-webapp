import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  Wallet,
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const METHOD_OPTIONS = [
  {
    value: 'transfer',
    labelKey: 'purchasePaymentsMvp.registerModal.method.transfer',
    Icon: CreditCard,
  },
  {
    value: 'cash',
    labelKey: 'purchasePaymentsMvp.registerModal.method.cash',
    Icon: Wallet,
  },
]

const CURRENCY_OPTIONS = ['PYG', 'USD']

const CASH_REGISTER_OPTIONS = [
  {
    value: 'main',
    labelKey: 'purchasePaymentsMvp.registerModal.cashRegister.main',
  },
  {
    value: 'secondary',
    labelKey: 'purchasePaymentsMvp.registerModal.cashRegister.secondary',
  },
]

const RegisterPaymentModal = ({ open, onOpenChange, order, onSubmit }) => {
  const { t, lang } = useI18n()

  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState('transfer')
  const [currency, setCurrency] = useState(order?.currency || 'PYG')
  const [cashRegister, setCashRegister] = useState('')
  const [amountError, setAmountError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)

  const resetForm = useCallback(() => {
    setAmount('')
    setReference('')
    setNotes('')
    setMethod('transfer')
    setCurrency(order?.currency || 'PYG')
    setCashRegister('')
    setAmountError(null)
    setFormError(null)
    setSubmitting(false)
  }, [order?.currency])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) {
      resetForm()
    }
    if (onOpenChange) {
      onOpenChange(nextOpen)
    }
  }

  const formatter = useMemo(() => {
    const locale = lang === 'en' ? 'en-US' : 'es-PY'
    const code = order?.currency || 'PYG'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

  const pendingLabel = useMemo(() => {
    if (
      !order ||
      order.pendingAmount === null ||
      order.pendingAmount === undefined
    ) {
      return null
    }
    return formatter.format(Number(order.pendingAmount || 0))
  }, [formatter, order])

  const exceededPendingAmount = useMemo(() => {
    if (
      !order ||
      order.pendingAmount === null ||
      order.pendingAmount === undefined
    ) {
      return false
    }
    const numericAmount = Number.parseFloat(amount)
    const pending = Number(order.pendingAmount)
    if (!Number.isFinite(numericAmount) || !Number.isFinite(pending)) {
      return false
    }
    return numericAmount - pending > 0.009
  }, [amount, order])

  const disableForm = !order
  const isFormDisabled = disableForm || isSubmitting

  const handleSubmit = async event => {
    event.preventDefault()
    setAmountError(null)
    setFormError(null)

    if (!order) {
      setFormError(t('purchasePaymentsMvp.registerModal.feedback.selectOrder'))
      return
    }

    const numericAmount = Number.parseFloat(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setAmountError(
        t('purchasePaymentsMvp.registerModal.amount.errorRequired')
      )
      return
    }

    if (
      order.pendingAmount !== null &&
      order.pendingAmount !== undefined &&
      numericAmount - Number(order.pendingAmount) > 0.009
    ) {
      setAmountError(
        t('purchasePaymentsMvp.registerModal.amount.errorExceeded')
      )
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        orderId: order.id,
        amount: Number(numericAmount.toFixed(2)),
        method,
        currency,
        reference: reference.trim() || null,
        cashRegisterId: cashRegister || null,
        notes: notes.trim() || null,
      })
      resetForm()
      handleDialogChange(false)
    } catch (error) {
      setFormError(
        error?.message || t('purchasePaymentsMvp.registerModal.submitError')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='purchase-payments-mvp-register purchase-payments-mvp-register__register-modal'>
        <form
          className='purchase-payments-mvp-register__register-form'
          onSubmit={handleSubmit}
        >
          <DialogHeader className='purchase-payments-mvp-register__register-header'>
            <DialogTitle className='purchase-payments-mvp-register__register-title'>
              {t('purchasePaymentsMvp.registerModal.title')}
            </DialogTitle>
            <DialogDescription className='purchase-payments-mvp-register__register-description'>
              {order
                ? t('purchasePaymentsMvp.registerModal.orderLabel', {
                    orderId: order.id,
                  })
                : t('purchasePaymentsMvp.registerModal.orderFallback')}
            </DialogDescription>
          </DialogHeader>

          <div className='purchase-payments-mvp-register__register-body'>
            <div className='purchase-payments-mvp-register__register-field'>
              <label
                htmlFor='purchase-payments-amount'
                className='purchase-payments-mvp-register__register-label'
              >
                {t('purchasePaymentsMvp.registerModal.amount.label')}
              </label>
              <div className='purchase-payments-mvp-register__register-input-wrapper purchase-payments-mvp-register__register-input-wrapper--amount'>
                <DollarSign className='purchase-payments-mvp-register__register-input-icon' />
                <Input
                  id='purchase-payments-amount'
                  type='number'
                  min='0'
                  step='0.01'
                  autoComplete='off'
                  inputMode='decimal'
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  disabled={isFormDisabled}
                  aria-invalid={Boolean(amountError)}
                  className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--has-icon'
                  placeholder='0.00'
                />
              </div>
              {pendingLabel && (
                <p className='purchase-payments-mvp-register__register-hint'>
                  {t('purchasePaymentsMvp.registerModal.amount.pending', {
                    amount: pendingLabel,
                  })}
                </p>
              )}
              {amountError && (
                <p className='purchase-payments-mvp-register__register-error'>
                  {amountError}
                </p>
              )}
            </div>

            <div className='purchase-payments-mvp-register__register-field'>
              <label
                className='purchase-payments-mvp-register__register-label'
                htmlFor='purchase-payments-reference'
              >
                {t('purchasePaymentsMvp.registerModal.reference.label')}
              </label>
              <Input
                id='purchase-payments-reference'
                type='text'
                value={reference}
                onChange={event => setReference(event.target.value)}
                disabled={isFormDisabled}
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.reference.placeholder'
                )}
                className='purchase-payments-mvp-register__register-control'
              />
            </div>

            <div className='purchase-payments-mvp-register__register-field purchase-payments-mvp-register__register-field--method'>
              <span className='purchase-payments-mvp-register__register-label'>
                {t('purchasePaymentsMvp.registerModal.method.label')}
              </span>
              <div
                className='purchase-payments-mvp-register__register-radio-group'
                role='radiogroup'
                aria-label={t('purchasePaymentsMvp.registerModal.method.label')}
              >
                {METHOD_OPTIONS.map(option => {
                  const optionId = `purchase-payments-method-${option.value}`
                  const isSelected = method === option.value
                  const Icon = option.Icon

                  return (
                    <label
                      key={option.value}
                      htmlFor={optionId}
                      className={cn(
                        'purchase-payments-mvp-register__register-method-option',
                        {
                          'is-selected': isSelected,
                          'is-disabled': isFormDisabled,
                        }
                      )}
                    >
                      <input
                        id={optionId}
                        type='radio'
                        name='purchase-payments-method'
                        value={option.value}
                        checked={isSelected}
                        disabled={isFormDisabled}
                        onChange={() => setMethod(option.value)}
                        className='purchase-payments-mvp-register__register-method-input'
                      />
                      <Icon className='purchase-payments-mvp-register__register-method-icon' />
                      <span className='purchase-payments-mvp-register__register-method-label'>
                        {t(option.labelKey)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className='purchase-payments-mvp-register__register-field'>
              <label
                className='purchase-payments-mvp-register__register-label'
                htmlFor='purchase-payments-currency'
              >
                {t('purchasePaymentsMvp.registerModal.currency.label')}
              </label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isFormDisabled}
              >
                <SelectTrigger
                  id='purchase-payments-currency'
                  className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--select'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='purchase-payments-mvp-register__register-select-content'>
                  {CURRENCY_OPTIONS.map(option => (
                    <SelectItem
                      key={option}
                      value={option}
                      className='purchase-payments-mvp-register__register-select-item'
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='purchase-payments-mvp-register__register-field'>
              <label className='purchase-payments-mvp-register__register-label'>
                {t('purchasePaymentsMvp.registerModal.cashRegister.label')}
              </label>
              <Select
                value={cashRegister}
                onValueChange={setCashRegister}
                disabled={isFormDisabled}
              >
                <SelectTrigger className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--select'>
                  <SelectValue
                    placeholder={t(
                      'purchasePaymentsMvp.registerModal.cashRegister.placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='purchase-payments-mvp-register__register-select-content'>
                  {CASH_REGISTER_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className='purchase-payments-mvp-register__register-select-item'
                    >
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='purchase-payments-mvp-register__register-field purchase-payments-mvp-register__register-field--full'>
              <label
                className='purchase-payments-mvp-register__register-label'
                htmlFor='purchase-payments-notes'
              >
                {t('purchasePaymentsMvp.registerModal.notes.label')}
              </label>
              <Textarea
                id='purchase-payments-notes'
                value={notes}
                onChange={event => setNotes(event.target.value)}
                disabled={isFormDisabled}
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.notes.placeholder'
                )}
                rows={3}
                className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--textarea'
              />
            </div>

            {exceededPendingAmount && (
              <div
                className='purchase-payments-mvp-register__register-warning'
                role='status'
                aria-live='polite'
              >
                <AlertTriangle className='purchase-payments-mvp-register__register-warning-icon' />
                <div className='purchase-payments-mvp-register__register-warning-copy'>
                  <p className='purchase-payments-mvp-register__register-warning-title'>
                    {t('common.warning')}
                  </p>
                  <p className='purchase-payments-mvp-register__register-warning-text'>
                    {t(
                      'purchasePaymentsMvp.registerModal.amount.errorExceeded'
                    )}
                  </p>
                </div>
              </div>
            )}

            {formError && (
              <div className='purchase-payments-mvp-register__register-alert'>
                <AlertCircle className='purchase-payments-mvp-register__register-alert-icon' />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter className='purchase-payments-mvp-register__register-footer'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleDialogChange(false)}
              disabled={isSubmitting}
              className='purchase-payments-mvp-register__register-button purchase-payments-mvp-register__register-button--ghost'
            >
              {t('purchasePaymentsMvp.registerModal.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={isFormDisabled}
              className='purchase-payments-mvp-register__register-button purchase-payments-mvp-register__register-button--primary'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='purchase-payments-mvp-register__register-button-spinner' />
                  {t('purchasePaymentsMvp.registerModal.loading')}
                </>
              ) : (
                <>
                  <CheckCircle2 className='purchase-payments-mvp-register__register-button-icon' />
                  {t('purchasePaymentsMvp.registerModal.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
