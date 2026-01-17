import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

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
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import '@/styles/scss/components/_register-sale-payment-modal.scss'

const CASH_REGISTER_NONE_VALUE = '__none__'

/**
 * Normaliza el saldo pendiente para que coincida con el valor mostrado al usuario.
 * Para PYG (guaraníes): redondea a entero (sin decimales).
 * Esto asegura que la validación use el mismo valor que se muestra al usuario.
 */
const getNormalizedBalanceDue = balanceDue => {
  if (balanceDue === null || balanceDue === undefined) return null
  const raw = Number(balanceDue)
  if (!Number.isFinite(raw)) return null
  // PYG siempre sin decimales
  return Math.round(raw)
}

/**
 * Modal para registrar pagos de órdenes de venta
 * Siguiendo el patrón MVP y Fluent Design System
 *
 * @param {boolean} open - Estado de apertura del modal
 * @param {function} onOpenChange - Callback para cambiar estado del modal
 * @param {object} sale - Objeto de venta con: { id, balance_due, total_amount, client_name }
 * @param {function} onSubmit - Callback para enviar el pago
 */
const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }) => {
  const { t, lang } = useI18n()

  // Form state
  const [amountReceived, setAmountReceived] = useState('')
  const [amountToApply, setAmountToApply] = useState('')
  const [notes, setNotes] = useState('')
  const [cashRegisterId, setCashRegisterId] = useState('')

  // Rastrear si el usuario editó manualmente el "Monto a Aplicar"
  const userEditedAmountToApply = useRef(false)

  // Validation and UI state
  const [amountReceivedError, setAmountReceivedError] = useState(null)
  const [amountToApplyError, setAmountToApplyError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)

  // Cash registers state
  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)
  const [cashRegistersError, setCashRegistersError] = useState(null)

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setNotes('')
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [])

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
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }, [lang])

  const formatLocalizedCurrency = useCallback(
    value => {
      return formatter.format(Number(value || 0))
    },
    [formatter]
  )

  // Formatear número con puntos cada tres dígitos (ej: 1.000, 10.000)
  const formatNumberWithDots = useCallback(value => {
    if (!value) return ''
    // Remover todo excepto dígitos
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    // Agregar puntos cada tres dígitos
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }, [])

  // Parsear número con puntos a número puro
  const parseNumberWithDots = useCallback(value => {
    if (!value) return ''
    return value.toString().replace(/\./g, '')
  }, [])

  // Validaciones en tiempo real
  const validationErrors = useMemo(() => {
    const errors = {
      amountReceived: null,
      amountToApply: null,
      hasErrors: false,
    }

    // Si no hay sale, no validar aún
    if (!sale) return errors

    // Validar monto recibido
    if (amountReceived) {
      const numericReceived = Number.parseFloat(
        parseNumberWithDots(amountReceived)
      )
      if (!Number.isFinite(numericReceived)) {
        errors.amountReceived = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericReceived < 0) {
        errors.amountReceived = 'El monto recibido no puede ser negativo'
        errors.hasErrors = true
      } else if (numericReceived === 0) {
        errors.amountReceived = 'El monto recibido debe ser mayor a 0'
        errors.hasErrors = true
      }
    }

    // Validar monto a aplicar
    if (amountToApply && amountReceived) {
      const numericReceived = Number.parseFloat(
        parseNumberWithDots(amountReceived)
      )
      const numericToApply = Number.parseFloat(
        parseNumberWithDots(amountToApply)
      )
      const balanceDue = getNormalizedBalanceDue(sale.balance_due)

      if (!Number.isFinite(numericToApply)) {
        errors.amountToApply = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericToApply < 0) {
        errors.amountToApply = 'El monto a aplicar no puede ser negativo'
        errors.hasErrors = true
      } else if (numericToApply === 0) {
        errors.amountToApply = 'El monto a aplicar debe ser mayor a 0'
        errors.hasErrors = true
      } else if (numericToApply > numericReceived) {
        errors.amountToApply =
          'No puedes aplicar más dinero del que has recibido'
        errors.hasErrors = true
      } else if (balanceDue !== null && numericToApply > balanceDue) {
        errors.amountToApply = 'No puedes pagar más de lo que debes'
        errors.hasErrors = true
      }
    }

    return errors
  }, [amountReceived, amountToApply, sale, parseNumberWithDots])

  // Calcular vuelto (change)
  const change = useMemo(() => {
    const received = Number.parseFloat(parseNumberWithDots(amountReceived)) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    const calculatedChange = received - toApply
    return calculatedChange > 0 ? calculatedChange : 0
  }, [amountReceived, amountToApply, parseNumberWithDots])

  // Verificar si la factura ya está completamente pagada
  const isAlreadyPaid = useMemo(() => {
    if (!sale) return false
    const balanceDue = Number(sale.balance_due || 0)
    return balanceDue <= 0
  }, [sale])

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
        setCashRegisterId(current => current || String(preferredRegisterId))
      }
    } catch (error) {
      console.error('Error loading cash registers for sale payments', error)
      setCashRegisters([])
      setCashRegistersError(
        error?.message || t('sales.registerPaymentModal.cashRegister.loadError')
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
    if (!cashRegisterId) return
    const exists = cashRegisters.some(
      register => String(register.id) === String(cashRegisterId)
    )
    if (!exists) {
      setCashRegisterId('')
    }
  }, [cashRegisterId, cashRegisters])

  // Auto-completar "Monto a Aplicar" cuando cambia "Monto Recibido"
  useEffect(() => {
    if (!amountReceived || !sale) {
      setAmountToApply('')
      userEditedAmountToApply.current = false
      return
    }

    const numericReceived = Number.parseFloat(parseNumberWithDots(amountReceived))
    if (!Number.isFinite(numericReceived) || numericReceived <= 0) {
      setAmountToApply('')
      userEditedAmountToApply.current = false
      return
    }

    // Calcular monto a aplicar = MIN(monto_recibido, balance_pendiente)
    const balanceDue = getNormalizedBalanceDue(sale.balance_due) || 0
    const autoAmountToApply = Math.min(numericReceived, balanceDue)

    // Si el usuario editó manualmente, verificar si el monto recibido cambió
    // significativamente (más de ₲100 de diferencia)
    if (userEditedAmountToApply.current && amountToApply) {
      const currentToApply = Number.parseFloat(parseNumberWithDots(amountToApply))
      // Si el monto recibido es menor que el monto a aplicar, forzar actualización
      if (numericReceived < currentToApply) {
        setAmountToApply(
          formatNumberWithDots(String(Math.round(autoAmountToApply)))
        )
        userEditedAmountToApply.current = false
        return
      }
      // Si la diferencia es significativa, permitir que el usuario lo maneje manualmente
      return
    }

    // Auto-completar
    setAmountToApply(formatNumberWithDots(String(Math.round(autoAmountToApply))))
  }, [amountReceived, sale, parseNumberWithDots, formatNumberWithDots, amountToApply])

  const cashRegisterOptions = useMemo(
    () =>
      cashRegisters.map(register => {
        const currencyCode = register.currency || 'PYG'
        const label =
          register.name ||
          register.description ||
          register.label ||
          `Caja #${register.id}`

        const status = register.status || register.state || ''
        const isOpen =
          status.toUpperCase() === 'OPEN' || status.toUpperCase() === 'ACTIVE'

        return {
          value: String(register.id),
          label,
          balanceLabel:
            typeof register.current_balance === 'number'
              ? t('sales.registerPaymentModal.cashRegister.balance', {
                  amount: formatLocalizedCurrency(register.current_balance),
                })
              : null,
          meta:
            register.location ||
            register.branch ||
            register.branch_name ||
            register.site ||
            null,
          isOpen,
        }
      }),
    [cashRegisters, formatLocalizedCurrency, t]
  )

  const selectedCashRegister = useMemo(() => {
    if (!cashRegisterId) return null
    return cashRegisters.find(
      register => String(register.id) === String(cashRegisterId)
    )
  }, [cashRegisterId, cashRegisters])

  const isCashRegisterClosed = useMemo(() => {
    if (!selectedCashRegister) return false
    const status = selectedCashRegister.status || selectedCashRegister.state || ''
    return (
      status.toUpperCase() !== 'OPEN' && status.toUpperCase() !== 'ACTIVE'
    )
  }, [selectedCashRegister])

  const disableForm = !sale || isAlreadyPaid
  const isFormDisabled = disableForm || isSubmitting
  const resolvedCashRegisterValue = cashRegisterId || CASH_REGISTER_NONE_VALUE

  // Deshabilitar submit si:
  // - Formulario deshabilitado
  // - Cajas están cargando
  // - Hay errores de validación en tiempo real
  // - Falta monto recibido o monto a aplicar
  // - Factura ya está pagada
  const isSubmitDisabled =
    isFormDisabled ||
    isCashRegistersLoading ||
    validationErrors.hasErrors ||
    !amountReceived ||
    !amountToApply ||
    isAlreadyPaid

  const handleSubmit = async event => {
    event.preventDefault()
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)

    if (!sale) {
      setFormError(t('sales.registerPaymentModal.feedback.selectSale'))
      return
    }

    // Validar amount_received (parsear valor formateado)
    const numericAmountReceived = Number.parseFloat(
      parseNumberWithDots(amountReceived)
    )
    if (
      !Number.isFinite(numericAmountReceived) ||
      numericAmountReceived < 0
    ) {
      setAmountReceivedError(
        t('sales.registerPaymentModal.amountReceived.errorRequired')
      )
      return
    }

    // amount_to_apply es opcional - si está vacío, se usa amount_received
    const parsedAmountToApply = amountToApply
      ? Number.parseFloat(parseNumberWithDots(amountToApply))
      : null
    const numericAmountToApply =
      parsedAmountToApply !== null
        ? parsedAmountToApply
        : numericAmountReceived

    // Si amount_to_apply está especificado, validar que sea > 0
    if (parsedAmountToApply !== null && parsedAmountToApply <= 0) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorRequired')
      )
      return
    }

    // Validar que amount_to_apply no exceda balance_due
    const normalizedBalanceDue = getNormalizedBalanceDue(sale.balance_due)
    if (normalizedBalanceDue !== null && numericAmountToApply > normalizedBalanceDue) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorExceeded')
      )
      return
    }

    // Validar que amount_to_apply no exceda amount_received
    if (numericAmountToApply > numericAmountReceived) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorExceedsReceived')
      )
      return
    }

    // Cash register es opcional - el sistema puede manejarlo automáticamente
    const parsedCashRegisterId = cashRegisterId ? Number(cashRegisterId) : null

    setSubmitting(true)

    try {
      const payload = {
        sales_order_id: sale.id || sale.sale_id,
        amount_received: Number(numericAmountReceived.toFixed(2)),
        payment_notes: notes.trim() || null,
      }

      // amount_to_apply es opcional
      if (parsedAmountToApply !== null) {
        payload.amount_to_apply = Number(numericAmountToApply.toFixed(2))
      }

      // cash_register_id es opcional
      if (parsedCashRegisterId !== null && Number.isFinite(parsedCashRegisterId)) {
        payload.cash_register_id = parsedCashRegisterId
      }

      await onSubmit(payload)
      resetForm()
      handleDialogChange(false)
    } catch (error) {
      setFormError(
        error?.message || t('sales.registerPaymentModal.submitError')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const balanceDueLabel = useMemo(() => {
    if (
      !sale ||
      sale.balance_due === null ||
      sale.balance_due === undefined
    ) {
      return null
    }
    return formatLocalizedCurrency(sale.balance_due)
  }, [formatLocalizedCurrency, sale])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal'>
        <form
          className='register-sale-payment-modal__form'
          onSubmit={handleSubmit}
        >
          <DialogHeader className='register-sale-payment-modal__header'>
            <DialogTitle className='register-sale-payment-modal__title'>
              {sale
                ? t('sales.registerPaymentModal.titleWithOrder', {
                    orderId: sale.id || sale.sale_id,
                  })
                : t('sales.registerPaymentModal.title')}
            </DialogTitle>
            <DialogDescription className='register-sale-payment-modal__description'>
              {balanceDueLabel
                ? t('sales.registerPaymentModal.balanceDue', {
                    amount: balanceDueLabel,
                  })
                : t('sales.registerPaymentModal.orderFallback')}
            </DialogDescription>
          </DialogHeader>

          <div className='register-sale-payment-modal__body'>
            {/* Warning: Factura ya está completamente pagada */}
            {isAlreadyPaid && (
              <div
                className='register-sale-payment-modal__alert'
                role='alert'
                aria-live='assertive'
              >
                <AlertCircle className='register-sale-payment-modal__alert-icon' />
                <span>
                  Esta factura ya está completamente pagada. No se pueden
                  registrar más pagos.
                </span>
              </div>
            )}

            {/* Warning: Cash register closed */}
            {!isAlreadyPaid && isCashRegisterClosed && (
              <div
                className='register-sale-payment-modal__warning'
                role='status'
                aria-live='polite'
              >
                <AlertTriangle className='register-sale-payment-modal__warning-icon' />
                <div className='register-sale-payment-modal__warning-content'>
                  <p className='register-sale-payment-modal__warning-title'>
                    {t('common.warning')}
                  </p>
                  <p className='register-sale-payment-modal__warning-text'>
                    {t('sales.registerPaymentModal.cashRegister.closedWarning')}
                  </p>
                </div>
              </div>
            )}

            {/* Amount Received (Cash) */}
            <div className='register-sale-payment-modal__field'>
              <label
                htmlFor='sale-payment-amount-received'
                className='register-sale-payment-modal__label'
              >
                {t('sales.registerPaymentModal.amountReceived.label')}
              </label>
              <Input
                id='sale-payment-amount-received'
                type='text'
                autoComplete='off'
                inputMode='numeric'
                value={amountReceived}
                onChange={event => {
                  const value = event.target.value
                  const numeric = parseNumberWithDots(value)
                  const formatted = formatNumberWithDots(numeric)
                  setAmountReceived(formatted)
                  // Limpiar error manual al editar
                  setAmountReceivedError(null)
                }}
                disabled={isFormDisabled}
                aria-invalid={Boolean(
                  amountReceivedError || validationErrors.amountReceived
                )}
                className='register-sale-payment-modal__control'
                placeholder='0'
              />
              {(amountReceivedError || validationErrors.amountReceived) && (
                <p className='register-sale-payment-modal__error'>
                  {amountReceivedError || validationErrors.amountReceived}
                </p>
              )}
            </div>

            {/* Amount to Apply */}
            <div className='register-sale-payment-modal__field'>
              <label
                htmlFor='sale-payment-amount-to-apply'
                className='register-sale-payment-modal__label'
              >
                {t('sales.registerPaymentModal.amountToApply.label')}
              </label>
              <Input
                id='sale-payment-amount-to-apply'
                type='text'
                autoComplete='off'
                inputMode='numeric'
                value={amountToApply}
                onChange={event => {
                  const value = event.target.value
                  const numeric = parseNumberWithDots(value)
                  const formatted = formatNumberWithDots(numeric)
                  setAmountToApply(formatted)
                  // Marcar que el usuario editó manualmente
                  userEditedAmountToApply.current = true
                  // Limpiar error manual al editar
                  setAmountToApplyError(null)
                }}
                disabled={isFormDisabled}
                aria-invalid={Boolean(
                  amountToApplyError || validationErrors.amountToApply
                )}
                className='register-sale-payment-modal__control'
                placeholder='0'
              />
              {balanceDueLabel && !validationErrors.amountToApply && (
                <p className='register-sale-payment-modal__hint'>
                  {t('sales.registerPaymentModal.amountToApply.pending', {
                    amount: balanceDueLabel,
                  })}
                </p>
              )}
              {(amountToApplyError || validationErrors.amountToApply) && (
                <p className='register-sale-payment-modal__error'>
                  {amountToApplyError || validationErrors.amountToApply}
                </p>
              )}
            </div>

            {/* Cash Register */}
            <div className='register-sale-payment-modal__field'>
              <label className='register-sale-payment-modal__label'>
                {t('sales.registerPaymentModal.cashRegister.label')}
              </label>
              <Select
                value={resolvedCashRegisterValue}
                onValueChange={value => {
                  if (value === CASH_REGISTER_NONE_VALUE) {
                    setCashRegisterId('')
                    return
                  }
                  setCashRegisterId(value)
                }}
                modal={false}
                disabled={isFormDisabled || isCashRegistersLoading}
              >
                <SelectTrigger className='register-sale-payment-modal__control register-sale-payment-modal__control--select w-full'>
                  <SelectValue
                    placeholder={t(
                      isCashRegistersLoading
                        ? 'sales.registerPaymentModal.cashRegister.loading'
                        : 'sales.registerPaymentModal.cashRegister.placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='register-sale-payment-modal__select-content'>
                  <SelectItem
                    value={CASH_REGISTER_NONE_VALUE}
                    className='register-sale-payment-modal__select-item'
                  >
                    {t('sales.registerPaymentModal.cashRegister.none')}
                  </SelectItem>
                  {cashRegisterOptions.length ? (
                    cashRegisterOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className='register-sale-payment-modal__select-item'
                      >
                        <span className='register-sale-payment-modal__cash-register-option'>
                          <span className='register-sale-payment-modal__cash-register-name'>
                            {option.label}
                            {!option.isOpen && (
                              <span className='register-sale-payment-modal__cash-register-status'>
                                {' '}
                                (
                                {t(
                                  'sales.registerPaymentModal.cashRegister.closed'
                                )}
                                )
                              </span>
                            )}
                          </span>
                          {option.balanceLabel && (
                            <span className='register-sale-payment-modal__cash-register-balance'>
                              {option.balanceLabel}
                            </span>
                          )}
                          {option.meta && (
                            <span className='register-sale-payment-modal__cash-register-meta'>
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
                      className='register-sale-payment-modal__select-item'
                    >
                      {t(
                        isCashRegistersLoading
                          ? 'sales.registerPaymentModal.cashRegister.loading'
                          : 'sales.registerPaymentModal.cashRegister.empty'
                      )}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {cashRegistersError && (
                <p className='register-sale-payment-modal__error'>
                  {cashRegistersError}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className='register-sale-payment-modal__field register-sale-payment-modal__field--full'>
              <label
                className='register-sale-payment-modal__label'
                htmlFor='sale-payment-notes'
              >
                {t('sales.registerPaymentModal.notes.label')}
              </label>
              <Textarea
                id='sale-payment-notes'
                value={notes}
                onChange={event => setNotes(event.target.value)}
                disabled={isFormDisabled}
                placeholder={t('sales.registerPaymentModal.notes.placeholder')}
                rows={3}
                className='register-sale-payment-modal__control register-sale-payment-modal__control--textarea'
              />
            </div>

            {/* Change Display - Siempre visible cuando hay montos ingresados */}
            {amountReceived && amountToApply && !validationErrors.hasErrors && (
              <div className='register-sale-payment-modal__change-box'>
                <p className='register-sale-payment-modal__change-label'>
                  {change > 0
                    ? t('sales.registerPaymentModal.change.willReturn')
                    : t('sales.registerPaymentModal.change.noChange')}
                </p>
                <p className='register-sale-payment-modal__change-value'>
                  {formatLocalizedCurrency(change)}
                </p>
              </div>
            )}

            {/* Form error */}
            {formError && (
              <div className='register-sale-payment-modal__alert'>
                <AlertCircle className='register-sale-payment-modal__alert-icon' />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter className='register-sale-payment-modal__footer'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleDialogChange(false)}
              disabled={isSubmitting}
              className='register-sale-payment-modal__button register-sale-payment-modal__button--ghost'
            >
              {t('sales.registerPaymentModal.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={isSubmitDisabled}
              className='register-sale-payment-modal__button register-sale-payment-modal__button--primary'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='register-sale-payment-modal__button-spinner' />
                  {t('sales.registerPaymentModal.loading')}
                </>
              ) : (
                <>
                  <CheckCircle2 className='register-sale-payment-modal__button-icon' />
                  {t('sales.registerPaymentModal.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterSalePaymentModal
