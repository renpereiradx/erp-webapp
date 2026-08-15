/**
 * ReservationsStep — paso del SaleCheckoutWizard.
 *
 * Dos capacidades:
 * 1. Listar las reservas CONFIRMED del cliente (migra ReservationModal):
 *    toggle por reserva con la regla "una reserva por producto".
 * 2. Registrar un uso walk-in (cliente sin reserva que ya jugó) vía
 *    WalkInReservationForm — crea la reserva desde acá, sin salir de /ventas.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { History, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'
import { WalkInReservationForm, type WalkInSpec } from './WalkInReservationForm'

export interface ReservationsStepRef {
  focus: () => void
}

interface ReservationsStepProps {
  pendingReservations: any[]
  selectedResIds: Set<number>
  onToggleSelection: (id: number) => void
  formatDateTime: (date: any) => string
  // Walk-in: registrar uso de cancha sin reserva previa.
  clientId: string | null
  blockedProductIds: Set<string>
  onRegisterWalkIn: (spec: WalkInSpec) => Promise<boolean>
}

export const ReservationsStep = forwardRef<ReservationsStepRef, ReservationsStepProps>(
  (
    { pendingReservations, selectedResIds, onToggleSelection, formatDateTime, clientId, blockedProductIds, onRegisterWalkIn },
    ref,
  ) => {
    const { t } = useI18n()
    const listRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => listRef.current?.querySelector<HTMLElement>('button')?.focus(),
    }))

    return (
      <div className="space-y-5">
        {pendingReservations.length > 0 && (
          <div>
            <h3 className="text-title-md text-on-surface">
              {t('sales.checkoutWizard.reservations.title', 'Reservas confirmadas')}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {t(
                'sales.checkoutWizard.reservations.subtitle',
                'Seleccioná las reservas para sumarlas al carrito',
              )}
            </p>
          </div>
        )}

        {pendingReservations.length > 0 && (
          <div ref={listRef} className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {pendingReservations.map((res, index) => {
              const resId = Number(res.reserve_id || res.id)
              const isSelected = selectedResIds.has(resId)
              // Regla de negocio: UNA reserva por venta (el backend recibe un
              // único p_reserve_id). Con una reserva ya marcada, las demás
              // quedan bloqueadas (comportamiento tipo radio).
              const blocked = selectedResIds.size > 0 && !isSelected

              return (
                <button
                  key={`${resId}-${index}`}
                  type="button"
                  disabled={blocked}
                  onClick={() => onToggleSelection(resId)}
                  className={cn(
                    'w-full text-left p-4 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : blocked
                        ? 'border-outline-variant bg-surface-container-low opacity-50 cursor-not-allowed'
                        : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40',
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'size-5 rounded-md border-2 flex items-center justify-center transition-all',
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-outline bg-surface-container-lowest',
                        )}
                      >
                        {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} className="opacity-0" />}
                      </div>
                      <span className="font-bold text-[13px] text-on-surface uppercase leading-tight">
                        {res.product_name || 'Servicio de reserva'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded uppercase">
                      #{resId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1 pl-7">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <History size={12} />
                        <span className="text-[10px] font-bold uppercase">Inicio:</span>
                        <span className="text-[11px] font-medium text-on-surface">
                          {formatDateTime(res.start_time)}
                        </span>
                      </div>
                      {res.duration_hours && (
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="text-[10px] font-bold uppercase">Duración:</span>
                          <span className="text-[11px] font-medium text-on-surface">
                            {res.duration_hours}h
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-[9px] font-bold text-outline uppercase tracking-widest">
                        {t('sales.checkoutWizard.total', 'Total')}
                      </span>
                      <span
                        className={cn(
                          'text-lg font-black font-data-mono tracking-tighter',
                          isSelected ? 'text-emerald-600' : 'text-on-surface',
                        )}
                      >
                        {formatCurrency(Number(res.total_amount) || 0)}
                      </span>
                    </div>
                  </div>

                  {blocked && (
                    <div className="mt-2 text-[10px] font-bold uppercase text-on-surface-variant bg-surface-container rounded px-2 py-1 inline-block">
                      {t('sales.checkoutWizard.reservations.oneReservationPerSale', 'Solo se permite una reserva por venta')}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Registrar uso walk-in (sin reserva previa) */}
        <WalkInReservationForm
          clientId={clientId || ''}
          blockedProductIds={blockedProductIds}
          onRegisterWalkIn={onRegisterWalkIn}
        />
      </div>
    )
  },
)

ReservationsStep.displayName = 'ReservationsStep'
