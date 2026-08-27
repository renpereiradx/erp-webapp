/**
 * CollectionStep — paso final del SaleCheckoutWizard.
 *
 * Selección de caja de cobro (precarga la caja activa del operador) + monto
 * recibido + cálculo de vuelto en vivo. El orquestador decide qué hacer al
 * confirmar (pos-checkout atómico o dejar pendiente); este paso solo recoge
 * los datos del cobro y reporta el estado de validez.
 *
 * Cobro en divisa: con foreignCurrency activo, el monto recibido se carga en
 * ESA divisa (lo que el cliente entrega físicamente) y el VUELTO se da en
 * guaraníes —moneda base—, con el equivalente en divisa como referencia. El
 * monto aplicado al saldo viaja siempre en moneda base.
 */
import { forwardRef, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cashRegisterService } from '@/services/cashRegisterService'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'
import {
  computeForeignDue,
  computeBaseFromForeign,
  computeForeignChange,
  computeBaseChange,
} from '@/domain/sale/calculations/foreignPayment'
import {
  partitionOpenRegisters,
  resolveDefaultRegisterId,
  type RegisterOption,
} from '../../registerSelection'

export interface CollectionStepRef {
  focus: () => void
}

export interface CollectionData {
  /** Monto aplicado al saldo, SIEMPRE en la moneda del documento (base). */
  amountReceived: number
  paymentMethodId: number
  cashRegisterId: number | null
  notes: string | null
  /** Cobro en divisa: nulls cuando se cobra en moneda base. */
  currencyId: number | null
  exchangeRate: number | null
  /** Lo que el cliente entregó físicamente, en la divisa de cobro. */
  foreignAmountReceived: number | null
}

export interface ForeignCurrencySpec {
  id: number
  code: string
  /** Tasa confirmada por el operador (multiplicador divisa → moneda base). */
  rate: number
}

interface CollectionStepProps {
  totalAmount: number
  currencyCode?: string
  paymentMethodId: number
  isCash: boolean
  /** Divisa de cobro distinta de la base; null/undefined = cobro en base. */
  foreignCurrency?: ForeignCurrencySpec | null
  /** Sucursal activa: las cajas de otras sucursales no son seleccionables. */
  currentBranchId?: number | null
  /** Notifica al orquestador los datos actuales del cobro. */
  onDataChange: (data: CollectionData) => void
}

export const CollectionStep = forwardRef<CollectionStepRef, CollectionStepProps>(
  (
    {
      totalAmount,
      currencyCode = 'PYG',
      paymentMethodId,
      isCash,
      foreignCurrency,
      currentBranchId,
      onDataChange,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const amountRef = useRef<HTMLInputElement>(null)

    const foreignCode = foreignCurrency?.code || ''
    const rate = foreignCurrency?.rate || 0
    const isForeign = !!foreignCurrency && rate > 0
    const foreignDue = useMemo(
      () => (isForeign ? computeForeignDue(totalAmount, rate) : 0),
      [isForeign, totalAmount, rate],
    )

    const [openRegisters, setOpenRegisters] = useState<RegisterOption[]>([])
    const [cashRegisterId, setCashRegisterId] = useState<string | number | null>(null)
    const [isLoadingRegisters, setIsLoadingRegisters] = useState(false)
    // En modo divisa, lo que tipea el operador es lo que entrega el cliente
    // (en ESA divisa); en modo base, el monto en guaraníes como siempre.
    const [amountInput, setAmountInput] = useState<string>(() =>
      isForeign && foreignDue > 0 ? String(foreignDue) : String(totalAmount || ''),
    )
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

    // Reporta los datos al orquestador cada vez que cambian. amountReceived
    // (base) se deriva de lo tipeado con la tasa; los metadatos de divisa
    // acompañan al pago para que el backend valide y audite la conversión.
    useEffect(() => {
      const typedAmount = Number(amountInput) || 0
      const isCashForeign = isForeign && isCash
      const foreignReceived = isCashForeign ? typedAmount : isForeign ? foreignDue : null
      const baseReceived = isCashForeign
        ? computeBaseFromForeign(typedAmount, rate) || totalAmount
        : isForeign
          ? totalAmount
          : typedAmount
      onDataChange({
        amountReceived: baseReceived,
        paymentMethodId: Number(paymentMethodId) || 0,
        cashRegisterId: cashRegisterId ? Number(cashRegisterId) : null,
        notes: notes.trim() || null,
        currencyId: isForeign ? foreignCurrency!.id : null,
        exchangeRate: isForeign ? rate : null,
        foreignAmountReceived: foreignReceived,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amountInput, cashRegisterId, notes, paymentMethodId, isForeign, foreignDue, rate])

    // Vuelto: se entrega en guaraníes (base). La cifra en divisa es solo
    // referencia para el operador.
    const foreignChange = computeForeignChange(Number(amountInput) || 0, foreignDue)
    const baseChange = isForeign
      ? computeBaseChange(Number(amountInput) || 0, rate, totalAmount)
      : Math.max(0, (Number(amountInput) || 0) - totalAmount)

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
                {isForeign
                  ? t('sales.checkoutWizard.collection.amountReceivedForeign', 'Monto recibido ({currency})', {
                      currency: foreignCode,
                    })
                  : t('sales.checkoutWizard.collection.amountReceived', 'Monto recibido')}
              </label>
              <Input
                ref={amountRef}
                type="number"
                min="0"
                step={isForeign ? '0.01' : '1'}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="h-14 text-2xl font-bold font-data-mono px-4"
                placeholder="0"
              />
              {isForeign && (
                <p className="mt-1.5 text-xs text-on-surface-variant font-data-mono">
                  {t('sales.checkoutWizard.collection.foreignDueLabel', 'A cobrar: {amount}', {
                    amount: formatCurrency(foreignDue, foreignCode),
                  })}
                  {' · '}
                  {t('sales.checkoutWizard.collection.baseEquivalent', 'Equivale a {amount}', {
                    amount: formatCurrency(computeBaseFromForeign(Number(amountInput) || 0, rate), currencyCode),
                  })}
                </p>
              )}
            </div>

            {isForeign ? (
              // En divisa los billetes rápidos en guaraníes no aplican; queda
              // "Exacto" (y el monto tipeado a mano).
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold"
                  onClick={() => setAmountInput(String(foreignDue))}
                >
                  {t('sales.checkoutWizard.collection.exact', 'Exacto')}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {[50000, 100000, 150000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold font-data-mono"
                    onClick={() => setAmountInput(String(amt))}
                  >
                    {formatCurrency(amt, currencyCode)}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold"
                  onClick={() => setAmountInput(String(totalAmount))}
                >
                  {t('sales.checkoutWizard.collection.exact', 'Exacto')}
                </Button>
              </div>
            )}

            <div className="p-4 bg-on-surface rounded-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t('sales.checkoutWizard.change', 'Vuelto')}
                </span>
                {isForeign && (
                  <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wide">
                    {t('sales.checkoutWizard.collection.changeInBase', 'se entrega en {base}', {
                      base: currencyCode,
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black font-data-mono text-emerald-400">
                  {formatCurrency(baseChange, currencyCode)}
                </span>
                {isForeign && foreignChange > 0 && (
                  <span className="text-xs text-on-surface-variant font-data-mono">
                    ≈ {formatCurrency(foreignChange, foreignCode)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cobro en divisa sin efectivo: no hay input, solo la aclaración */}
        {!isCash && isForeign && (
          <p className="flex items-start gap-2 text-xs text-on-surface-variant">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              {t(
                'sales.checkoutWizard.collection.foreignNonCashHint',
                'Se cobrará el equivalente a {amount} con la tasa cargada (1 {currency} = {rate} {base}).',
                {
                  amount: formatCurrency(foreignDue, foreignCode),
                  currency: foreignCode,
                  rate,
                  base: currencyCode,
                },
              )}
            </span>
          </p>
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
