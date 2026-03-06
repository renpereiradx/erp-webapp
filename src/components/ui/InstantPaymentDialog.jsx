import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/lib/i18n'

const formatAmount = (value, currencyCode = 'PYG') => {
  const isPYG = currencyCode === 'PYG'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value || 0)
}

const toPositiveAmount = value => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return parsed < 0 ? 0 : parsed
}

/**
 * Diálogo simplificado de pago/cobro instantáneo.
 * Aparece tras crear exitosamente una compra o venta.
 */
const InstantPaymentDialog = ({
  open,
  onConfirmPayment,
  onLeavePending,
  variant = 'purchase',
  orderId,
  totalAmount,
  currencyCode = 'PYG',
  paymentMethodId,
  paymentMethodLabel,
  paymentMethods = [], // New prop to allow selection if needed
}) => {
  const { t } = useI18n()
  const [amount, setAmount] = useState(toPositiveAmount(totalAmount))
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // State for payment method selection if not provided
  const [selectedMethodId, setSelectedMethodId] = useState(
    paymentMethodId || '',
  )

  const confirmRef = useRef(null)
  const amountRef = useRef(null)

  const isSale = variant === 'sale'
  const prefix = isSale
    ? 'sales.collectionDecision'
    : 'purchases.paymentDecision'
  const resolvedCurrencyCode = String(currencyCode || 'PYG').toUpperCase()
  const resolvedTotalAmount = toPositiveAmount(totalAmount)
  const selectedMethod = paymentMethods.find(
    method => String(method.id) === String(selectedMethodId || paymentMethodId),
  )
  const resolvedPaymentMethodLabel =
    paymentMethodLabel ||
    selectedMethod?.description ||
    selectedMethod?.method_code ||
    t('common.paymentMethod', 'Método configurado')

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (open) {
      setAmount(toPositiveAmount(totalAmount))
      setNotes('')
      setShowNotes(false)
      setProcessing(false)
      setError(null)

      // Initialize selected method if ID provided, otherwise default to first available or empty
      if (paymentMethodId) {
        setSelectedMethodId(paymentMethodId)
      } else if (paymentMethods && paymentMethods.length > 0) {
        setSelectedMethodId(paymentMethods[0].id)
      } else {
        setSelectedMethodId('')
      }
    }
  }, [open, totalAmount, paymentMethodId, paymentMethods])

  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      amountRef.current?.focus()
      amountRef.current?.select?.()
    }, 60)

    return () => clearTimeout(timer)
  }, [open])

  const handleConfirm = async () => {
    const normalizedAmount = toPositiveAmount(amount)

    if (!normalizedAmount || normalizedAmount <= 0) {
      setError(
        t(
          `${prefix}.invalidAmount`,
          'Ingresá un monto mayor a cero para continuar',
        ),
      )
      return
    }

    // Validate payment method if we are in charge of selecting it
    if (!paymentMethodId && !selectedMethodId) {
      setError(
        t(
          'common.paymentMethodRequired',
          'Por favor seleccioná un método de pago',
        ),
      )
      return
    }

    setProcessing(true)
    setError(null)
    try {
      if (isSale) {
        await onConfirmPayment({
          sales_order_id: orderId,
          amount: normalizedAmount,
          amount_received: normalizedAmount,
          payment_notes: notes || null,
          paymentMethodId: selectedMethodId, // Pass selected method
        })
      } else {
        await onConfirmPayment({
          orderId,
          amount: normalizedAmount,
          paymentMethodId: selectedMethodId, // Pass selected method
          currencyCode: resolvedCurrencyCode,
          notes: notes || null,
        })
      }
    } catch (err) {
      console.error('Error processing instant payment:', err)
      setError(
        t(
          `${prefix}.paymentError`,
          isSale
            ? 'Error al registrar cobro. La venta fue creada correctamente.'
            : 'Error al registrar pago. La orden fue creada correctamente.',
        ),
      )
      setProcessing(false)
    }
  }

  const handleAmountKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  const handleNotesKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='sm:max-w-lg p-0 overflow-hidden radix-dialog__content'>
        <AlertDialogHeader className='px-6 py-5 border-b bg-muted/30'>
          <div className='flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
              <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
            <div className='space-y-1.5'>
              <AlertDialogTitle className='text-base font-semibold tracking-tight'>
                {t(
                  `${prefix}.title`,
                  isSale
                    ? 'Venta Creada Exitosamente'
                    : 'Orden de Compra Creada',
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm text-muted-foreground'>
                {t(
                  `${prefix}.description`,
                  isSale
                    ? `Venta #${orderId} creada por ${formatAmount(totalAmount, resolvedCurrencyCode)}.`
                    : `Orden #${orderId} creada por ${formatAmount(totalAmount, resolvedCurrencyCode)}.`,
                  {
                    orderId,
                    amount: formatAmount(totalAmount, resolvedCurrencyCode),
                  },
                )}{' '}
                {t(
                  `${prefix}.question`,
                  isSale
                    ? '¿Registrar el cobro ahora?'
                    : '¿Registrar el pago ahora?',
                )}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className='px-6 py-5 space-y-5'>
          <div className='rounded-lg border bg-muted/20 px-4 py-3'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                  {isSale ? 'Venta' : 'Orden'}
                </p>
                <p className='text-sm font-medium'>#{orderId}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                  Total
                </p>
                <p className='text-sm font-semibold'>
                  {formatAmount(resolvedTotalAmount, resolvedCurrencyCode)}
                </p>
              </div>
            </div>
          </div>

          {/* Amount field */}
          <div className='space-y-2'>
            <label
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              htmlFor='instant-payment-amount'
            >
              {t(
                `${prefix}.amountLabel`,
                isSale ? 'Monto a cobrar' : 'Monto a pagar',
              )}
            </label>
            <div className='relative'>
              <input
                ref={amountRef}
                id='instant-payment-amount'
                type='number'
                min='0'
                step='1'
                value={amount}
                onChange={e => {
                  const next = e.target.value
                  setAmount(next === '' ? '' : toPositiveAmount(next))
                }}
                onKeyDown={handleAmountKeyDown}
                disabled={processing}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-16 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              />
              <div className='absolute inset-y-0 right-2 flex items-center px-2 rounded-sm bg-muted pointer-events-none text-muted-foreground text-xs font-medium'>
                {resolvedCurrencyCode}
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              {isSale
                ? 'Podés cobrar total o parcial.'
                : 'Podés pagar total o parcial.'}
            </p>
          </div>

          {/* Payment method: Read-only if pre-selected, Selector if missing */}
          {paymentMethodId ? (
            <div className='space-y-1'>
              <label className='text-sm font-medium text-muted-foreground'>
                {t(`${prefix}.methodLabel`, 'Método de pago')}
              </label>
              <div className='rounded-md border bg-background px-3 py-2'>
                <p className='text-sm font-medium text-foreground flex items-center gap-2'>
                  <span className='inline-block w-2 h-2 rounded-full bg-primary/80'></span>
                  {resolvedPaymentMethodLabel}
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <label
                className='text-sm font-medium leading-none'
                htmlFor='instant-payment-method'
              >
                {t(`${prefix}.methodLabel`, 'Método de pago')}
              </label>
              <select
                id='instant-payment-method'
                value={selectedMethodId}
                onChange={e => setSelectedMethodId(e.target.value)}
                disabled={processing}
                className='flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {paymentMethods.length === 0 && (
                  <option value=''>Cargando métodos...</option>
                )}
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.description || method.method_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collapsible notes field */}
          <div>
            <button
              type='button'
              onClick={() => setShowNotes(!showNotes)}
              disabled={processing}
              className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1'
            >
              {showNotes ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
              {t(`${prefix}.notesLabel`, 'Notas (opcional)')}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                disabled={processing}
                placeholder={t(
                  `${prefix}.notesPlaceholder`,
                  isSale ? 'Notas del cobro...' : 'Notas del pago...',
                )}
                rows={2}
                className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 resize-none'
              />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2'>
              <AlertCircle className='h-4 w-4' />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter className='px-6 py-4 border-t bg-muted/20 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-x-0'>
          <AlertDialogCancel
            onClick={onLeavePending}
            disabled={processing}
            className='sm:w-full mt-0'
          >
            {t(`${prefix}.leavePending`, 'Dejar Pendiente')}
          </AlertDialogCancel>
          <AlertDialogAction
            ref={confirmRef}
            onClick={e => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={processing}
            className={`${isSale ? 'bg-green-600 hover:bg-green-700 text-white' : ''} sm:w-full`}
          >
            {processing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t(`${prefix}.processing`, 'Procesando...')}
              </>
            ) : (
              t(
                isSale ? `${prefix}.collectNow` : `${prefix}.payNow`,
                isSale ? 'Confirmar Cobro' : 'Confirmar Pago',
              )
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default InstantPaymentDialog
