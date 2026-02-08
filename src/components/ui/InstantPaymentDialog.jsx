import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [amount, setAmount] = useState(totalAmount || 0)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  
  // State for payment method selection if not provided
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethodId || '')
  
  const confirmRef = useRef(null)
  const amountRef = useRef(null)

  const isSale = variant === 'sale'
  const prefix = isSale ? 'sales.collectionDecision' : 'purchases.paymentDecision'

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (open) {
      setAmount(totalAmount || 0)
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

  const handleConfirm = async () => {
    // Validate payment method if we are in charge of selecting it
    if (!paymentMethodId && !selectedMethodId) {
      setError(t('common.paymentMethodRequired', 'Por favor seleccioná un método de pago'))
      return
    }

    setProcessing(true)
    setError(null)
    try {
      if (isSale) {
        await onConfirmPayment({
          sales_order_id: orderId,
          amount: amount,
          amount_received: amount,
          payment_notes: notes || null,
          paymentMethodId: selectedMethodId, // Pass selected method
        })
      } else {
        await onConfirmPayment({
          orderId,
          amount,
          paymentMethodId: selectedMethodId, // Pass selected method
          currencyCode,
          notes: notes || null,
        })
      }
    } catch (err) {
      console.error('Error processing instant payment:', err)
      setError(
        t(`${prefix}.paymentError`, isSale
          ? 'Error al registrar cobro. La venta fue creada correctamente.'
          : 'Error al registrar pago. La orden fue creada correctamente.'
        )
      )
      setProcessing(false)
    }
  }

  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  const handleNotesKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md radix-dialog__content">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <AlertDialogTitle>
                {t(`${prefix}.title`, isSale ? 'Venta Creada Exitosamente' : 'Orden de Compra Creada')}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-2 text-muted-foreground">
            {t(`${prefix}.description`, isSale
              ? `Venta #${orderId} creada por ${formatAmount(totalAmount, currencyCode)}.`
              : `Orden #${orderId} creada por ${formatAmount(totalAmount, currencyCode)}.`,
              { orderId, amount: formatAmount(totalAmount, currencyCode) }
            )}
            {' '}
            {t(`${prefix}.question`, isSale ? '¿Registrar el cobro ahora?' : '¿Registrar el pago ahora?')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-3">
          {/* Amount field */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="instant-payment-amount">
              {t(`${prefix}.amountLabel`, isSale ? 'Monto a cobrar' : 'Monto a pagar')}
            </label>
            <div className="relative">
              <input
                ref={amountRef}
                id="instant-payment-amount"
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onKeyDown={handleAmountKeyDown}
                disabled={processing}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                {currencyCode}
              </div>
            </div>
          </div>

          {/* Payment method: Read-only if pre-selected, Selector if missing */}
          {paymentMethodId ? (
             <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {t(`${prefix}.methodLabel`, 'Método de pago')}
              </label>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/80"></span>
                {paymentMethodLabel}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="instant-payment-method">
                {t(`${prefix}.methodLabel`, 'Método de pago')}
              </label>
              <select
                id="instant-payment-method"
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(e.target.value)}
                disabled={processing}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentMethods.length === 0 && <option value="">Cargando métodos...</option>}
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
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              disabled={processing}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {t(`${prefix}.notesLabel`, 'Notas (opcional)')}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                disabled={processing}
                placeholder={t(`${prefix}.notesPlaceholder`, isSale ? 'Notas del cobro...' : 'Notas del pago...')}
                rows={2}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 resize-none"
              />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onLeavePending}
            disabled={processing}
          >
            {t(`${prefix}.leavePending`, 'Dejar Pendiente')}
          </AlertDialogCancel>
          <AlertDialogAction
            ref={confirmRef}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={processing}
            className={isSale ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t(`${prefix}.processing`, 'Procesando...')}
              </>
            ) : (
              t(
                isSale ? `${prefix}.collectNow` : `${prefix}.payNow`,
                isSale ? 'Confirmar Cobro' : 'Confirmar Pago'
              )
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default InstantPaymentDialog
