/**
 * CollectionStep — paso final del SaleCheckoutWizard.
 *
 * Selección de caja de cobro (precarga la caja activa del operador) + monto
 * recibido + cálculo de vuelto en vivo. El orquestador decide qué hacer al
 * confirmar (pos-checkout atómico o dejar pendiente); este paso solo recoge
 * los datos del cobro y reporta el estado de validez.
 */
import { forwardRef, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cashRegisterService } from '@/services/cashRegisterService'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'
import {
  partitionOpenRegisters,
  resolveDefaultRegisterId,
  type RegisterOption,
} from '../../registerSelection'

export interface CollectionStepRef {
  focus: () => void
}

export interface CollectionData {
  amountReceived: number
  paymentMethodId: number
  cashRegisterId: number | null
  notes: string | null
}

interface CollectionStepProps {
  totalAmount: number
  currencyCode?: string
  paymentMethodId: number
  isCash: boolean
  /** Sucursal activa: las cajas de otras sucursales no son seleccionables. */
  currentBranchId?: number | null
  /** Notifica al orquestador los datos actuales del cobro. */
  onDataChange: (data: CollectionData) => void
}

export const CollectionStep = forwardRef<CollectionStepRef, CollectionStepProps>(
  ({ totalAmount, currencyCode = 'PYG', paymentMethodId, isCash, currentBranchId, onDataChange }, ref) => {
    const { t } = useI18n()
    const amountRef = useRef<HTMLInputElement>(null)

    const [openRegisters, setOpenRegisters] = useState<RegisterOption[]>([])
    const [cashRegisterId, setCashRegisterId] = useState<string | number | null>(null)
    const [isLoadingRegisters, setIsLoadingRegisters] = useState(false)
    const [amountReceived, setAmountReceived] = useState<string>(String(totalAmount || ''))
    const [notes, setNotes] = useState('')
    const [showNotes, setShowNotes] = useState(false)

    useImperativeHandle(ref, () => ({
      focus: () => {
        amountRef.current?.focus()
        amountRef.current?.select?.()
      },
    }))

    // Cajas abiertas agrupadas por sucursal: solo las de la sucursal activa son
    // seleccionables; las de otras sucursales se muestran deshabilitadas.
    const { inBranch, otherBranches } = useMemo(
      () => partitionOpenRegisters(openRegisters, currentBranchId),
      [openRegisters, currentBranchId],
    )

    // Carga cajas abiertas + caja activa. La activa se preselecciona SOLO si
    // pertenece a la sucursal actual; si no (o si no hay caja activa), queda
    // "Sin caja" y el backend no adivina ninguna caja.
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
          const open: RegisterOption[] = raw
            .filter((r: any) => (r.status || r.state || '').toUpperCase() === 'OPEN')
            .map((r: any) => ({
              id: Number(r.id ?? r.cash_register_id),
              branchId: r.branch_id ?? null,
            }))
            .filter((r) => Number.isFinite(r.id))
          setOpenRegisters(open)
          const activeId = activeRegister
            ? Number(activeRegister.id ?? activeRegister.cash_register_id)
            : null
          const partition = partitionOpenRegisters(open, currentBranchId)
          setCashRegisterId(resolveDefaultRegisterId(partition.inBranch, activeId))
        } finally {
          if (!cancelled) setIsLoadingRegisters(false)
        }
      }
      load()
      return () => {
        cancelled = true
      }
    }, [currentBranchId])

    // Reporta los datos al orquestador cada vez que cambian.
    useEffect(() => {
      onDataChange({
        amountReceived: Number(amountReceived) || 0,
        paymentMethodId: Number(paymentMethodId) || 0,
        cashRegisterId: cashRegisterId ? Number(cashRegisterId) : null,
        notes: notes.trim() || null,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amountReceived, cashRegisterId, notes, paymentMethodId])

    const change = Math.max(0, (Number(amountReceived) || 0) - totalAmount)

    return (
      <div className="space-y-5">
        {/* Caja de cobro */}
        <div className="space-y-2">
          <label className="text-label-caps text-on-surface-variant" htmlFor="wizard-cash-register">
            {t('sales.checkoutWizard.collection.cashRegister', 'Caja de cobro')}
          </label>
          <div className="relative">
            <select
              id="wizard-cash-register"
              value={cashRegisterId || ''}
              onChange={(e) => setCashRegisterId(e.target.value || null)}
              disabled={isLoadingRegisters}
              className="flex h-11 w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              <option value="">{t('sales.checkoutWizard.collection.noCashRegister', 'Sin caja asignada')}</option>
              {isLoadingRegisters && (
                <option disabled>
                  {t('sales.checkoutWizard.collection.loadingRegisters', 'Cargando cajas...')}
                </option>
              )}
              {inBranch.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {t('sales.checkoutWizard.collection.registerName', `Caja #${reg.id}`, { id: reg.id })}
                </option>
              ))}
              {otherBranches.length > 0 && (
                <optgroup
                  label={t('sales.checkoutWizard.collection.otherBranchGroup', 'Otras sucursales (no disponibles acá)')}
                >
                  {otherBranches.map((reg) => (
                    <option key={reg.id} value={reg.id} disabled>
                      {t('sales.checkoutWizard.collection.registerName', `Caja #${reg.id}`, { id: reg.id })}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Guía: la caja es opcional, pero el operador debe saber qué está pasando. */}
          {!isLoadingRegisters && cashRegisterId == null && (
            <p className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                {t(
                  'sales.checkoutWizard.collection.noCashRegisterHint',
                  'Vas a cobrar sin caja: el pago no quedará vinculado a una caja registradora.',
                )}
              </span>
            </p>
          )}
          {!isLoadingRegisters && inBranch.length === 0 && otherBranches.length > 0 && (
            <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-sm px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                {t(
                  'sales.checkoutWizard.collection.noOpenRegisterInBranch',
                  'No tenés cajas abiertas en esta sucursal. Podés cobrar sin caja o abrir una desde el módulo Cajas.',
                )}
              </span>
            </p>
          )}
        </div>

        {/* Monto recibido (solo efectivo) */}
        {isCash && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-2 mb-2">
                <Calculator size={14} />
                {t('sales.checkoutWizard.collection.amountReceived', 'Monto recibido')}
              </label>
              <Input
                ref={amountRef}
                type="number"
                min="0"
                step="1"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="h-14 text-2xl font-bold font-data-mono px-4"
                placeholder="0"
              />
            </div>

            <div className="flex gap-2">
              {[50000, 100000, 150000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold font-data-mono"
                  onClick={() => setAmountReceived(String(amt))}
                >
                  {formatCurrency(amt, currencyCode)}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setAmountReceived(String(totalAmount))}
              >
                {t('sales.checkoutWizard.collection.exact', 'Exacto')}
              </Button>
            </div>

            <div className="p-4 bg-on-surface rounded-md flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t('sales.checkoutWizard.change', 'Vuelto')}
              </span>
              <span className="text-2xl font-black font-data-mono text-emerald-400">
                {formatCurrency(change, currencyCode)}
              </span>
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t('sales.checkoutWizard.collection.notes', 'Notas (opcional)')}
          </button>
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('sales.checkoutWizard.collection.notesPlaceholder', 'Notas del cobro...')}
              rows={2}
              className="mt-2 w-full rounded-md border border-input bg-surface-container-lowest px-3 py-2 text-sm resize-none"
            />
          )}
        </div>
      </div>
    )
  },
)

CollectionStep.displayName = 'CollectionStep'
