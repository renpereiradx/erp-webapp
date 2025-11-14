import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
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
  },
  { value: 'cash', labelKey: 'purchasePaymentsMvp.registerModal.method.cash' },
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

  const disableForm = !order

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
      <DialogContent className='purchase-payments-mvp__register-modal'>
        <form
          className='purchase-payments-mvp__register-form'
          onSubmit={handleSubmit}
        >
          <DialogHeader className='purchase-payments-mvp__register-header'>
            <DialogTitle className='purchase-payments-mvp__register-title'>
              {t('purchasePaymentsMvp.registerModal.title')}
            </DialogTitle>
            <DialogDescription className='purchase-payments-mvp__register-description'>
              {order
                ? t('purchasePaymentsMvp.registerModal.orderLabel', {
                    orderId: order.id,
                  })
                : t('purchasePaymentsMvp.registerModal.orderFallback')}
            </DialogDescription>
          </DialogHeader>

          <div className='purchase-payments-mvp__register-body'>
            <div className='purchase-payments-mvp__register-field'>
              <label
                htmlFor='purchase-payments-amount'
                className='purchase-payments-mvp__register-label'
              >
                {t('purchasePaymentsMvp.registerModal.amount.label')}
              </label>
              <Input
                id='purchase-payments-amount'
                type='number'
                min='0'
                step='0.01'
                autoComplete='off'
                inputMode='decimal'
                value={amount}
                onChange={event => setAmount(event.target.value)}
                disabled={disableForm || isSubmitting}
                aria-invalid={Boolean(amountError)}
              />
              {pendingLabel && (
                <p className='purchase-payments-mvp__register-hint'>
                  {t('purchasePaymentsMvp.registerModal.amount.pending', {
                    amount: pendingLabel,
                  })}
                </p>
              )}
              {amountError && (
                <p className='purchase-payments-mvp__register-error'>
                  {amountError}
                </p>
              )}
            </div>

            <div className='purchase-payments-mvp__register-grid'>
              <div className='purchase-payments-mvp__register-field'>
                <label
                  className='purchase-payments-mvp__register-label'
                  htmlFor='purchase-payments-method'
                >
                  {t('purchasePaymentsMvp.registerModal.method.label')}
                </label>
                <Select
                  value={method}
                  onValueChange={setMethod}
                  disabled={disableForm || isSubmitting}
                >
                  <SelectTrigger id='purchase-payments-method'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='purchase-payments-mvp__register-field'>
                <label
                  className='purchase-payments-mvp__register-label'
                  htmlFor='purchase-payments-currency'
                >
                  {t('purchasePaymentsMvp.registerModal.currency.label')}
                </label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={disableForm || isSubmitting}
                >
                  <SelectTrigger id='purchase-payments-currency'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='purchase-payments-mvp__register-field'>
              <label
                className='purchase-payments-mvp__register-label'
                htmlFor='purchase-payments-reference'
              >
                {t('purchasePaymentsMvp.registerModal.reference.label')}
              </label>
              <Input
                id='purchase-payments-reference'
                type='text'
                value={reference}
                onChange={event => setReference(event.target.value)}
                disabled={disableForm || isSubmitting}
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.reference.placeholder'
                )}
              />
            </div>

            <div className='purchase-payments-mvp__register-field'>
              <label className='purchase-payments-mvp__register-label'>
                {t('purchasePaymentsMvp.registerModal.cashRegister.label')}
              </label>
              <Select
                value={cashRegister}
                onValueChange={setCashRegister}
                disabled={disableForm || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'purchasePaymentsMvp.registerModal.cashRegister.placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CASH_REGISTER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='purchase-payments-mvp__register-field'>
              <label
                className='purchase-payments-mvp__register-label'
                htmlFor='purchase-payments-notes'
              >
                {t('purchasePaymentsMvp.registerModal.notes.label')}
              </label>
              <Textarea
                id='purchase-payments-notes'
                value={notes}
                onChange={event => setNotes(event.target.value)}
                disabled={disableForm || isSubmitting}
                placeholder={t(
                  'purchasePaymentsMvp.registerModal.notes.placeholder'
                )}
                rows={3}
              />
            </div>

            {formError && (
              <div className='purchase-payments-mvp__register-alert'>
                <AlertCircle className='purchase-payments-mvp__register-alert-icon' />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter className='purchase-payments-mvp__register-footer'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleDialogChange(false)}
              disabled={isSubmitting}
            >
              {t('purchasePaymentsMvp.registerModal.cancel')}
            </Button>
            <Button type='submit' disabled={disableForm || isSubmitting}>
              {isSubmitting
                ? t('purchasePaymentsMvp.registerModal.loading')
                : t('purchasePaymentsMvp.registerModal.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
