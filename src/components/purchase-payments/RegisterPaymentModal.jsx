import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
} from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cashRegisterService } from '@/services/cashRegisterService'
import { CurrencyService } from '@/services/currencyService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

/**
 * Normaliza el saldo pendiente según la moneda para que coincida con el valor mostrado.
 * Para PYG: redondea a entero (sin decimales).
 * Para otras monedas: redondea a 2 decimales.
 * Esto asegura que la validación use el mismo valor que se muestra al usuario.
 */
const getNormalizedPendingAmount = (pendingAmount, currencyCode) => {
  if (pendingAmount === null || pendingAmount === undefined) return null
  const raw = Number(pendingAmount)
  if (!Number.isFinite(raw)) return null
  const code = (currencyCode || DEFAULT_CURRENCY_CODE).toUpperCase()
  if (code === 'PYG') {
    return Math.round(raw)
  }
  return Math.round(raw * 100) / 100
}

const RegisterPaymentModal = ({ open, onOpenChange, order, onSubmit }) => {
  const { t, lang } = useI18n()

  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [currencyCode, setCurrencyCode] = useState(
    (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
  )
  const [cashRegister, setCashRegister] = useState('')
  const [amountError, setAmountError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)
  const [cashRegistersError, setCashRegistersError] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isPaymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [isCurrenciesLoading, setCurrenciesLoading] = useState(false)
  const [currenciesError, setCurrenciesError] = useState(null)

  const resetForm = useCallback(() => {
    setAmount('')
    setReference('')
    setNotes('')
    setPaymentMethodId('')
    setCurrencyCode((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
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
    const pending = getNormalizedPendingAmount(order.pendingAmount, order.currency)
    if (!Number.isFinite(numericAmount) || pending === null) {
      return false
    }
    return numericAmount > pending
  }, [amount, order])

  const disableForm = !order
  const isFormDisabled = disableForm || isSubmitting

  const formatLocalizedCurrency = useCallback(
    (value, currencyCode = 'PYG') => {
      const locale = lang === 'en' ? 'en-US' : 'es-PY'
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
        maximumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
      })
      return formatter.format(Number(value || 0))
    },
    [lang]
  )

  const loadPaymentMethods = useCallback(async () => {
    setPaymentMethodsLoading(true)
    setPaymentMethodsError(null)

    try {
      const methods = await PaymentMethodService.getAll()
      setPaymentMethods(methods)

      setPaymentMethodId(currentValue => {
        if (currentValue) {
          return currentValue
        }

        const defaultMethod =
          methods.find(candidate => candidate.is_default) ||
          methods.find(candidate => {
            if (!candidate.method_code) {
              return false
            }
            return candidate.method_code.toUpperCase().includes('CASH')
          }) ||
          methods[0]

        return defaultMethod?.id ? String(defaultMethod.id) : ''
      })
    } catch (error) {
      console.error(
        'Error loading payment methods for purchase payments',
        error
      )
      setPaymentMethods([])
      setPaymentMethodsError(
        error?.message ||
          t('purchasePaymentsMvp.registerModal.method.loadError')
      )
    } finally {
      setPaymentMethodsLoading(false)
    }
  }, [t])

  const loadCurrencies = useCallback(async () => {
    setCurrenciesLoading(true)
    setCurrenciesError(null)

    try {
      const currencyList = await CurrencyService.getAll()
      setCurrencies(currencyList)

      setCurrencyCode(currentValue => {
        if (currentValue) {
          return currentValue
        }

        const defaultCurrency =
          order?.currency ||
          currencyList[0]?.currency_code ||
          DEFAULT_CURRENCY_CODE

        return String(defaultCurrency).toUpperCase()
      })
    } catch (error) {
      console.error('Error loading currencies for purchase payments', error)
      setCurrencies([])
      setCurrenciesError(
        error?.message ||
          t('purchasePaymentsMvp.registerModal.currency.loadError')
      )
    } finally {
      setCurrenciesLoading(false)
    }
  }, [order?.currency, t])

  const loadCashRegisters = useCallback(async () => {
    setCashRegistersLoading(true)
    setCashRegistersError(null)

    try {
      const [allCashRegisters, activeCashRegister] = await Promise.all([
        cashRegisterService.getCashRegisters(),
        cashRegisterService.getActiveCashRegister().catch(() => null),
      ])

      const openCashRegisters =
        allCashRegisters?.filter(cashRegisterItem => {
          const status =
            cashRegisterItem?.status || cashRegisterItem?.state || ''
          return (
            status.toUpperCase() === 'OPEN' || status.toUpperCase() === 'ACTIVE'
          )
        }) || []

      const cashRegistersWithBalance = await Promise.all(
        openCashRegisters.map(async cashRegisterItem => {
          if (
            typeof cashRegisterItem.current_balance === 'number' &&
            cashRegisterItem.current_balance > 0
          ) {
            return cashRegisterItem
          }

          try {
            const movements = await cashRegisterService.getMovements(
              cashRegisterItem.id
            )
            return calculateCashRegisterBalance(cashRegisterItem, movements)
          } catch (movementError) {
            console.warn(
              'Unable to calculate cash register balance from movements',
              movementError
            )
            return cashRegisterItem
          }
        })
      )

      setCashRegisters(cashRegistersWithBalance)

      const preferredRegisterId =
        activeCashRegister?.id || cashRegistersWithBalance[0]?.id || null

      if (preferredRegisterId) {
        setCashRegister(current => current || String(preferredRegisterId))
      }
    } catch (error) {
      console.error('Error loading cash registers for purchase payments', error)
      setCashRegisters([])
      setCashRegistersError(
        error?.message ||
          t('purchasePaymentsMvp.registerModal.cashRegister.loadError')
      )
    } finally {
      setCashRegistersLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!open) return
    loadCashRegisters()
  }, [loadCashRegisters, open])

  useEffect(() => {
    if (!open) return
    loadPaymentMethods()
    loadCurrencies()
  }, [loadCurrencies, loadPaymentMethods, open])

  useEffect(() => {
    if (!cashRegister) return
    const exists = cashRegisters.some(
      register => String(register.id) === String(cashRegister)
    )
    if (!exists) {
      setCashRegister('')
    }
  }, [cashRegister, cashRegisters])

  useEffect(() => {
    if (!paymentMethodId || !paymentMethods.length) {
      return
    }

    const exists = paymentMethods.some(method => {
      if (!method) {
        return false
      }
      const candidateId = method.id ?? method.payment_method_id
      if (candidateId == null) {
        return false
      }
      return String(candidateId) === String(paymentMethodId)
    })

    if (!exists) {
      setPaymentMethodId('')
    }
  }, [paymentMethodId, paymentMethods])

  const currencySelectorData = useMemo(() => {
    const normalizedCurrencies = (currencies.length ? currencies : [])
      .map(currency => {
        if (!currency || typeof currency !== 'object') {
          return null
        }

        const rawCode =
          currency.currency_code ||
          currency.code ||
          currency.currencyCode ||
          currency.value

        if (!rawCode) {
          return null
        }

        const normalizedCode = String(rawCode).toUpperCase()
        const resolvedName =
          currency.currency_name ||
          currency.currencyName ||
          currency.name ||
          normalizedCode

        return {
          ...currency,
          currency_code: normalizedCode,
          currency_name: resolvedName,
          name: resolvedName,
        }
      })
      .filter(Boolean)

    if (normalizedCurrencies.length) {
      return normalizedCurrencies
    }

    const fallbackCode = (
      order?.currency || DEFAULT_CURRENCY_CODE
    ).toUpperCase()

    return [
      {
        id: fallbackCode,
        currency_code: fallbackCode,
        currency_name: fallbackCode,
        name: fallbackCode,
      },
    ]
  }, [currencies, order?.currency])

  const paymentMethodOptions = useMemo(
    () =>
      paymentMethods
        .map(method => {
          const identifier =
            method?.id ??
            method?.payment_method_id ??
            method?.value ??
            method?.method_code

          if (identifier == null) {
            return null
          }

          const normalizedId = String(identifier)
          const rawCode = String(
            method?.method_code ||
              method?.code ||
              method?.value ||
              method?.name ||
              ''
          ).toUpperCase()
          const label =
            method?.display_name ||
            method?.name ||
            method?.method_name ||
            method?.label ||
            method?.description ||
            rawCode ||
            normalizedId

          return {
            id: normalizedId,
            label,
          }
        })
        .filter(Boolean),
    [paymentMethods]
  )

  useEffect(() => {
    if (!currencyCode || !currencySelectorData.length) {
      return
    }

    const exists = currencySelectorData.some(currency => {
      const code = currency?.currency_code || currency?.code
      if (!code) {
        return false
      }
      return code.toUpperCase() === currencyCode.toUpperCase()
    })

    if (!exists) {
      const fallback =
        currencySelectorData[0]?.currency_code?.toUpperCase() ||
        (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
      setCurrencyCode(fallback)
    }
  }, [currencyCode, currencySelectorData, order?.currency])

  const cashRegisterOptions = useMemo(
    () =>
      cashRegisters.map(register => {
        const currencyCode = register.currency || 'PYG'
        const label =
          register.name ||
          register.description ||
          register.label ||
          `Caja #${register.id}`

        return {
          value: String(register.id),
          label,
          balanceLabel:
            typeof register.current_balance === 'number'
              ? t('purchasePaymentsMvp.registerModal.cashRegister.balance', {
                  amount: formatLocalizedCurrency(
                    register.current_balance,
                    currencyCode
                  ),
                })
              : null,
          meta:
            register.location ||
            register.branch ||
            register.branch_name ||
            register.site ||
            null,
        }
      }),
    [cashRegisters, formatLocalizedCurrency, t]
  )

  const hasPaymentMethods = paymentMethodOptions.length > 0
  const hasCurrencyOptions = currencySelectorData.length > 0
  const resolvedCashRegisterValue = cashRegister || CASH_REGISTER_NONE_VALUE
  const isSubmitDisabled =
    isFormDisabled ||
    isCashRegistersLoading ||
    isPaymentMethodsLoading ||
    isCurrenciesLoading ||
    !hasPaymentMethods ||
    !hasCurrencyOptions ||
    !paymentMethodId ||
    !currencyCode ||
    Boolean(paymentMethodsError) ||
    Boolean(currenciesError)

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

    const normalizedPending = getNormalizedPendingAmount(order.pendingAmount, order.currency)
    if (normalizedPending !== null && numericAmount > normalizedPending) {
      setAmountError(
        t('purchasePaymentsMvp.registerModal.amount.errorExceeded')
      )
      return
    }

    if (!paymentMethodId) {
      setFormError(t('purchasePaymentsMvp.registerModal.method.errorRequired'))
      return
    }

    const parsedPaymentMethodId = Number(paymentMethodId)
    if (!Number.isFinite(parsedPaymentMethodId) || parsedPaymentMethodId <= 0) {
      setFormError(t('purchasePaymentsMvp.registerModal.method.errorRequired'))
      return
    }

    const normalizedCurrency = String(currencyCode || '').toUpperCase()
    if (!normalizedCurrency) {
      setFormError(
        t('purchasePaymentsMvp.registerModal.currency.errorRequired')
      )
      return
    }

    let parsedCashRegisterId = null
    if (cashRegister) {
      const numericCashRegisterId = Number(cashRegister)
      if (!Number.isFinite(numericCashRegisterId)) {
        setFormError(
          t('purchasePaymentsMvp.registerModal.cashRegister.errorRequired')
        )
        return
      }
      parsedCashRegisterId = numericCashRegisterId
    }

    setSubmitting(true)

    try {
      await onSubmit({
        orderId: order.id,
        amount: Number(numericAmount.toFixed(2)),
        paymentMethodId: parsedPaymentMethodId,
        payment_method_id: parsedPaymentMethodId,
        currencyCode: normalizedCurrency,
        currency: normalizedCurrency,
        currency_code: normalizedCurrency,
        reference: reference.trim() || null,
        cashRegisterId: parsedCashRegisterId ?? undefined,
        cash_register_id: parsedCashRegisterId ?? undefined,
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
              <label
                className='purchase-payments-mvp-register__register-label'
                htmlFor='purchase-payments-method'
              >
                {t('purchasePaymentsMvp.registerModal.method.label')}
              </label>
              {isPaymentMethodsLoading ? (
                <p className='purchase-payments-mvp-register__register-hint'>
                  {t('purchasePaymentsMvp.registerModal.method.loading')}
                </p>
              ) : hasPaymentMethods ? (
                <select
                  id='purchase-payments-method'
                  value={paymentMethodId || ''}
                  onChange={event => setPaymentMethodId(event.target.value)}
                  disabled={
                    isFormDisabled ||
                    isPaymentMethodsLoading ||
                    !hasPaymentMethods
                  }
                  className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--select purchase-payments-mvp-register__register-control--native'
                >
                  {!paymentMethodId && (
                    <option value='' disabled>
                      {t(
                        'purchasePaymentsMvp.registerModal.method.placeholder'
                      )}
                    </option>
                  )}
                  {paymentMethodOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className='purchase-payments-mvp-register__register-hint'>
                  {paymentMethodsError ||
                    t('purchasePaymentsMvp.registerModal.method.empty')}
                </p>
              )}
              {paymentMethodsError && (
                <p className='purchase-payments-mvp-register__register-error'>
                  {paymentMethodsError}
                </p>
              )}
            </div>

            <div className='purchase-payments-mvp-register__register-field'>
              <label
                className='purchase-payments-mvp-register__register-label'
                htmlFor='purchase-payments-currency'
              >
                {t('purchasePaymentsMvp.registerModal.currency.label')}
              </label>
              <select
                id='purchase-payments-currency'
                value={currencyCode || ''}
                onChange={event =>
                  setCurrencyCode(event.target.value.toUpperCase())
                }
                disabled={
                  isFormDisabled || isCurrenciesLoading || !hasCurrencyOptions
                }
                className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--select purchase-payments-mvp-register__register-control--native'
              >
                {!currencyCode && (
                  <option value='' disabled>
                    {t(
                      'purchasePaymentsMvp.registerModal.currency.placeholder'
                    )}
                  </option>
                )}
                {currencySelectorData.map(currency => {
                  const code = currency?.currency_code || currency?.code || ''
                  if (!code) {
                    return null
                  }
                  const normalizedCode = code.toUpperCase()
                  const displayName =
                    currency?.currency_name || currency?.name || normalizedCode

                  return (
                    <option key={normalizedCode} value={normalizedCode}>
                      {displayName !== normalizedCode
                        ? `${normalizedCode} · ${displayName}`
                        : normalizedCode}
                    </option>
                  )
                })}
              </select>
              {!hasCurrencyOptions && !isCurrenciesLoading && (
                <p className='purchase-payments-mvp-register__register-hint'>
                  {t('purchasePaymentsMvp.registerModal.currency.empty')}
                </p>
              )}
              {currenciesError && (
                <p className='purchase-payments-mvp-register__register-error'>
                  {currenciesError}
                </p>
              )}
            </div>

            <div className='purchase-payments-mvp-register__register-field'>
              <label className='purchase-payments-mvp-register__register-label'>
                {t('purchasePaymentsMvp.registerModal.cashRegister.label')}
              </label>
              <Select
                value={resolvedCashRegisterValue}
                onValueChange={value => {
                  if (value === CASH_REGISTER_NONE_VALUE) {
                    setCashRegister('')
                    return
                  }
                  setCashRegister(value)
                }}
                modal={false}
                disabled={isFormDisabled || isCashRegistersLoading}
              >
                <SelectTrigger className='purchase-payments-mvp-register__register-control purchase-payments-mvp-register__register-control--select w-full'>
                  <SelectValue
                    placeholder={t(
                      isCashRegistersLoading
                        ? 'purchasePaymentsMvp.registerModal.cashRegister.loading'
                        : 'purchasePaymentsMvp.registerModal.cashRegister.placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='purchase-payments-mvp-register__register-select-content'>
                  <SelectItem
                    value={CASH_REGISTER_NONE_VALUE}
                    className='purchase-payments-mvp-register__register-select-item'
                  >
                    {t('purchasePaymentsMvp.registerModal.cashRegister.none')}
                  </SelectItem>
                  {cashRegisterOptions.length ? (
                    cashRegisterOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className='purchase-payments-mvp-register__register-select-item'
                      >
                        <span className='purchase-payments-mvp-register__register-cash-register-option'>
                          <span className='purchase-payments-mvp-register__register-cash-register-name'>
                            {option.label}
                          </span>
                          {option.balanceLabel && (
                            <span className='purchase-payments-mvp-register__register-cash-register-balance'>
                              {option.balanceLabel}
                            </span>
                          )}
                          {option.meta && (
                            <span className='purchase-payments-mvp-register__register-cash-register-meta'>
                              {option.meta}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem
                      value='__empty__'
                      disabled
                      className='purchase-payments-mvp-register__register-select-item'
                    >
                      {t(
                        isCashRegistersLoading
                          ? 'purchasePaymentsMvp.registerModal.cashRegister.loading'
                          : 'purchasePaymentsMvp.registerModal.cashRegister.empty'
                      )}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className='purchase-payments-mvp-register__register-hint'>
                {t(
                  'purchasePaymentsMvp.registerModal.cashRegister.optionalHelper'
                )}
              </p>
              {cashRegistersError && (
                <p className='purchase-payments-mvp-register__register-error'>
                  {cashRegistersError}
                </p>
              )}
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
              disabled={isSubmitDisabled}
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
