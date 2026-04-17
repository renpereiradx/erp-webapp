import { useEffect, useRef, useState } from 'react'
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
import { cashRegisterService } from '@/services/cashRegisterService'

type Variant = 'purchase' | 'sale'

interface PaymentMethodOption {
  id: string | number
  description?: string
  method_code?: string
}

interface InstantPaymentPayload {
  sales_order_id?: string | number
  orderId?: string | number
  amount: number
  amount_received?: number
  payment_notes?: string | null
  paymentMethodId?: string | number
  currencyCode?: string
  notes?: string | null
  cash_register_id?: string | number | null
}

interface InstantPaymentDialogProps {
  open: boolean
  onConfirmPayment: (payload: InstantPaymentPayload) => Promise<void>
  onLeavePending: () => void
  variant?: Variant
  orderId: string | number
  totalAmount: number
  currencyCode?: string
  paymentMethodId?: string | number | null
  paymentMethodLabel?: string | null
  paymentMethods?: PaymentMethodOption[]
}

const formatAmount = (value: number, currencyCode = 'PYG') => {
  const isPYG = currencyCode === 'PYG'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value || 0)
}

const toPositiveAmount = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return parsed < 0 ? 0 : parsed
}

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
  paymentMethods = [],
}: InstantPaymentDialogProps) => {
  const { t } = useI18n()
  const [amount, setAmount] = useState<string | number>(toPositiveAmount(totalAmount))
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<string | number>(
    paymentMethodId || '',
  )
  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [cashRegisterId, setCashRegisterId] = useState<string | number | null>(null)
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)

  const confirmRef = useRef<HTMLButtonElement | null>(null)
  const amountRef = useRef<HTMLInputElement | null>(null)

  const isSale = variant === 'sale'
  const prefix = isSale ? 'sales.collectionDecision' : 'purchases.paymentDecision'
  const resolvedCurrencyCode = String(currencyCode || 'PYG').toUpperCase()
  const resolvedTotalAmount = toPositiveAmount(totalAmount)
  const selectedMethod = paymentMethods.find(
    method => String(method.id) === String(selectedMethodId || paymentMethodId),
  )
  const resolvedPaymentMethodLabel =
    paymentMethodLabel ||
    selectedMethod?.description ||
    selectedMethod?.method_code ||
    t('common.paymentMethod', 'Metodo configurado')

  useEffect(() => {
    if (!open) return
    setAmount(toPositiveAmount(totalAmount))
    setNotes('')
    setShowNotes(false)
    setProcessing(false)
    setError(null)

    if (paymentMethodId) {
      setSelectedMethodId(paymentMethodId)
    } else if (paymentMethods.length > 0) {
      setSelectedMethodId(paymentMethods[0].id)
    } else {
      setSelectedMethodId('')
    }

    if (isSale) {
      const loadCashRegisters = async () => {
        setCashRegistersLoading(true)
        try {
          const [allRegisters, activeRegister] = await Promise.all([
            cashRegisterService.getCashRegisters().catch(() => []),
            cashRegisterService.getActiveCashRegister().catch(() => null)
          ])
          
          const rawRegisters = Array.isArray(allRegisters) ? allRegisters : (allRegisters as any)?.data || []
          setCashRegisters(rawRegisters)
          
          if (activeRegister) {
            setCashRegisterId(activeRegister.id || activeRegister.cash_register_id)
          } else if (rawRegisters.length > 0) {
            // No default if no active register, user must choose or leave null
            setCashRegisterId(null)
          }
        } catch (err) {
          console.error('Error loading cash registers:', err)
        } finally {
          setCashRegistersLoading(false)
        }
      }
      loadCashRegisters()
    }
  }, [open, totalAmount, paymentMethodId, paymentMethods, isSale])

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
          'Ingresa un monto mayor a cero para continuar',
        ),
      )
      return
    }

    if (!paymentMethodId && !selectedMethodId) {
      setError(
        t('common.paymentMethodRequired', 'Por favor selecciona un metodo de pago'),
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
          paymentMethodId: selectedMethodId,
          cash_register_id: cashRegisterId,
        })
      } else {
        await onConfirmPayment({
          orderId,
          amount: normalizedAmount,
          paymentMethodId: selectedMethodId,
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
                  isSale ? 'Venta Creada Exitosamente' : 'Orden de Compra Creada',
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm text-muted-foreground'>
                {t(
                  `${prefix}.description`,
                  isSale
                    ? `Venta #${orderId} creada por ${formatAmount(resolvedTotalAmount, resolvedCurrencyCode)}.`
                    : `Orden #${orderId} creada por ${formatAmount(resolvedTotalAmount, resolvedCurrencyCode)}.`,
                  {
                    orderId,
                    amount: formatAmount(resolvedTotalAmount, resolvedCurrencyCode),
                  },
                )}{' '}
                {t(
                  `${prefix}.question`,
                  isSale ? '¿Registrar el cobro ahora?' : '¿Registrar el pago ahora?',
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

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium leading-none' htmlFor='instant-payment-amount'>
                {t(`${prefix}.amountLabel`, isSale ? 'Monto a cobrar' : 'Monto a pagar')}
              </label>
              <button
                type='button'
                onClick={() => setAmount(toPositiveAmount(totalAmount))}
                className='text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-colors focus:outline-none'
              >
                {isSale ? 'Cobrar el total' : 'Pagar el total'}
              </button>
            </div>
            <div className='relative group'>
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
                disabled={processing}
                className='flex h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2 pr-16 text-lg font-black tracking-tight text-slate-800 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50'
              />
              <div className='absolute inset-y-1 right-1 flex items-center px-3 rounded-md bg-slate-50 border border-slate-100 pointer-events-none text-slate-500 text-xs font-bold tracking-widest uppercase'>
                {resolvedCurrencyCode}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {paymentMethodId ? (
              <div className='space-y-1'>
                <label className='text-sm font-medium text-muted-foreground'>
                  {t(`${prefix}.methodLabel`, 'Metodo de pago')}
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
                <label className='text-sm font-medium leading-none' htmlFor='instant-payment-method'>
                  {t(`${prefix}.methodLabel`, 'Metodo de pago')}
                </label>
                <select
                  id='instant-payment-method'
                  value={selectedMethodId}
                  onChange={e => setSelectedMethodId(e.target.value)}
                  disabled={processing}
                  className='flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm'
                >
                  {paymentMethods.length === 0 && <option value=''>Cargando metodos...</option>}
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.description || method.method_code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSale && (
              <div className='space-y-2'>
                <label className='text-sm font-medium leading-none' htmlFor='instant-payment-cash-register'>
                  {t('sales.registerPaymentModal.cashRegister.label', 'Caja de Cobro')}
                </label>
                <select
                  id='instant-payment-cash-register'
                  value={cashRegisterId || ''}
                  onChange={e => setCashRegisterId(e.target.value || null)}
                  disabled={processing || isCashRegistersLoading}
                  className='flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm'
                >
                  <option value=''>{t('sales.registerPaymentModal.cashRegister.none', 'Sin caja asignada')}</option>
                  {isCashRegistersLoading && <option disabled>Cargando cajas...</option>}
                  {cashRegisters.map(reg => (
                    <option key={reg.id || reg.cash_register_id} value={reg.id || reg.cash_register_id}>
                      {reg.name || reg.description || `Caja #${reg.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <button
              type='button'
              onClick={() => setShowNotes(!showNotes)}
              disabled={processing}
              className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1'
            >
              {showNotes ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
              {t(`${prefix}.notesLabel`, 'Notas (opcional)')}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={processing}
                placeholder={t(
                  `${prefix}.notesPlaceholder`,
                  isSale ? 'Notas del cobro...' : 'Notas del pago...',
                )}
                rows={2}
                className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none'
              />
            )}
          </div>

          {error && (
            <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2'>
              <AlertCircle className='h-4 w-4' />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter className='px-6 py-4 border-t bg-muted/20 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-x-0'>
          <AlertDialogCancel onClick={onLeavePending} disabled={processing} className='sm:w-full mt-0'>
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
