/**
 * PurchaseCollectionStep — paso final del PurchaseCheckoutWizard.
 *
 * Selección de caja de pago (precarga la caja activa del operador) + monto
 * a pagar al proveedor. A diferencia de las ventas (donde se calcula vuelto),
 * en compras el monto es lo que se le paga al proveedor.
 */
import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cashRegisterService } from '@/services/cashRegisterService'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'

export interface PurchaseCollectionStepRef {
  focus: () => void
}

export interface PurchaseCollectionData {
  amountPaid: number
  cashRegisterId: number | null
  notes: string | null
}

interface PurchaseCollectionStepProps {
  totalAmount: number
  currencyCode?: string
  /** Notifica al orquestador los datos actuales del pago. */
  onDataChange: (data: PurchaseCollectionData) => void
}

export const PurchaseCollectionStep = forwardRef<
  PurchaseCollectionStepRef,
  PurchaseCollectionStepProps
>(({ totalAmount, currencyCode = 'PYG', onDataChange }, ref) => {
  const { t } = useI18n()
  const amountRef = useRef<HTMLInputElement>(null)

  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [cashRegisterId, setCashRegisterId] = useState<string | number | null>(null)
  const [isLoadingRegisters, setIsLoadingRegisters] = useState(false)
  const [amountPaid, setAmountPaid] = useState<string>(String(totalAmount || ''))
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  useImperativeHandle(ref, () => ({
    focus: () => {
      amountRef.current?.focus()
      amountRef.current?.select?.()
    },
  }))

  // Carga cajas abiertas + caja activa.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoadingRegisters(true)
      try {
        const [allRegisters, activeRegister] = await Promise.all([
          cashRegisterService.getCashRegisters().catch(() => []),
          cashRegisterService.getActiveCashRegister().catch(() => null),
        ])
        if (cancelled) return
        const raw = Array.isArray(allRegisters) ? allRegisters : (allRegisters as any)?.data || []
        const openRegisters = raw.filter((r: any) => (r.status || r.state || '').toUpperCase() === 'OPEN')
        setCashRegisters(openRegisters)
        if (activeRegister) {
          const activeId = activeRegister.id || activeRegister.cash_register_id
          const isActiveInBranch = openRegisters.some(
            (r: any) => (r.id || r.cash_register_id) === activeId,
          )
          setCashRegisterId(isActiveInBranch ? activeId : null)
        } else {
          setCashRegisterId(null)
        }
      } finally {
        if (!cancelled) setIsLoadingRegisters(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Reporta los datos al orquestador cada vez que cambian.
  useEffect(() => {
    onDataChange({
      amountPaid: Number(amountPaid) || 0,
      cashRegisterId: cashRegisterId ? Number(cashRegisterId) : null,
      notes: notes.trim() || null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountPaid, cashRegisterId, notes])

  return (
    <div className="space-y-5">
      {/* Caja de pago */}
      <div className="space-y-2">
        <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-purchase-cash-register">
          {t('purchases.checkoutWizard.collection.cashRegister', 'Caja de pago')}
        </label>
        <select
          id="wizard-purchase-cash-register"
          value={cashRegisterId || ''}
          onChange={(e) => setCashRegisterId(e.target.value || null)}
          disabled={isLoadingRegisters}
          className="flex h-11 w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          <option value="">
            {t('purchases.checkoutWizard.collection.noCashRegister', 'Sin caja asignada')}
          </option>
          {isLoadingRegisters && (
            <option disabled>
              {t('purchases.checkoutWizard.collection.loadingRegisters', 'Cargando cajas...')}
            </option>
          )}
          {cashRegisters.map((reg: any) => (
            <option key={reg.id || reg.cash_register_id} value={reg.id || reg.cash_register_id}>
              {reg.name || reg.description || `Caja #${reg.id || reg.cash_register_id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Monto a pagar */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-2 mb-2">
            <Calculator size={14} />
            {t('purchases.checkoutWizard.collection.amountPaid', 'Monto a pagar')}
          </label>
          <Input
            ref={amountRef}
            type="number"
            min="0"
            step="1"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="h-14 text-2xl font-bold font-data-mono px-4"
            placeholder="0"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs font-bold"
          onClick={() => setAmountPaid(String(totalAmount))}
        >
          {t('purchases.checkoutWizard.collection.exact', 'Exacto')}: {formatCurrency(totalAmount, currencyCode)}
        </Button>
      </div>

      {/* Notas del pago */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {t('purchases.checkoutWizard.collection.notes', 'Notas del pago (opcional)')}
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('purchases.checkoutWizard.collection.notesPlaceholder', 'Notas del pago...')}
            rows={2}
            className="mt-2 w-full rounded-md border border-input bg-surface-container-lowest px-3 py-2 text-sm resize-none"
          />
        )}
      </div>
    </div>
  )
})

PurchaseCollectionStep.displayName = 'PurchaseCollectionStep'
