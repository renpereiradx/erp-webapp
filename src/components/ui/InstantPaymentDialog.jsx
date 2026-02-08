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
}) => {
  const { t } = useI18n()
  const [amount, setAmount] = useState(totalAmount || 0)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
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
    }
  }, [open, totalAmount])

  const handleConfirm = async () => {
    setProcessing(true)
    setError(null)
    try {
      if (isSale) {
        await onConfirmPayment({
          sales_order_id: orderId,
          amount: amount,
          amount_received: amount,
          payment_notes: notes || null,
        })
      } else {
        await onConfirmPayment({
          orderId,
          amount,
          paymentMethodId,
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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <AlertDialogTitle>
                {t(`${prefix}.title`, isSale ? 'Venta Creada Exitosamente' : 'Orden de Compra Creada')}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-2">
            {t(`${prefix}.description`, isSale
              ? `Venta #${orderId} creada por ${formatAmount(totalAmount, currencyCode)}.`
              : `Orden #${orderId} creada por ${formatAmount(totalAmount, currencyCode)}.`,
              { orderId, amount: formatAmount(totalAmount, currencyCode) }
            )}
            {' '}
            {t(`${prefix}.question`, isSale ? '¿Registrar el cobro ahora?' : '¿Registrar el pago ahora?')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {/* Amount field */}
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="instant-payment-amount">
              {t(`${prefix}.amountLabel`, isSale ? 'Monto a cobrar' : 'Monto a pagar')}
            </label>
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
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
          </div>

          {/* Payment method indicator (read-only) */}
          {paymentMethodLabel && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t(`${prefix}.methodLabel`, 'Método de pago')}
              </label>
              <p className="mt-1 text-sm text-foreground">{paymentMethodLabel} ({currencyCode})</p>
            </div>
          )}

          {/* Collapsible notes field */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              disabled={processing}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 resize-none"
              />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
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
            autoFocus
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
