/**
 * ReservationsStep — paso del SaleCheckoutWizard.
 *
 * Dos capacidades:
 * 1. Listar las reservas CONFIRMED del cliente (migra ReservationModal):
 *    toggle por reserva; se admiten N reservas por venta (cada línea lleva
 *    su reserve_id y el backend las valida y completa todas).
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
  onRegisterWalkIn: (spec: WalkInSpec) => Promise<boolean>
}

export const ReservationsStep = forwardRef<ReservationsStepRef, ReservationsStepProps>(
  (
    { pendingReservations, selectedResIds, onToggleSelection, formatDateTime, clientId, onRegisterWalkIn },
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
            <h3 className="text-title-md text-foreground">
              {t('sales.checkoutWizard.reservations.title', 'Reservas confirmadas')}
            </h3>
            <p className="text-body-sm text-on-surface-deep">
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
              const resId = Number(res.reserve_id || res.id);
              const isSelected = selectedResIds.has(resId);

              return (
                <button
                  key={`${resId}-${index}`}
                  type="button"
                  onClick={() => onToggleSelection(resId)}
                  className={cn(
                    'w-full text-left p-4 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-divider bg-surface hover:border-primary/40',
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'size-5 rounded-md border-2 flex items-center justify-center transition-all',
                          isSelected ? 'bg-primary border-primary text-on-primary' : 'border-outline-fg bg-surface',
                        )}
                      >
                        {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} className="opacity-0" />}
                      </div>
                      <span className="font-bold text-[0.8667rem] text-foreground uppercase leading-tight">
                        {res.product_name || 'Servicio de reserva'}
                      </span>
                    </div>
                    <span className="text-[0.6667rem] font-bold text-on-surface-deep bg-surface-subtle px-2 py-0.5 rounded uppercase">
                      #{resId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1 pl-7">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface-deep">
                        <History size={12} />
                        <span className="text-[0.6667rem] font-bold uppercase">Inicio:</span>
                        <span className="text-[0.7333rem] font-medium text-foreground">
                          {formatDateTime(res.start_time)}
                        </span>
                      </div>
                      {res.duration_hours && (
                        <div className="flex items-center gap-1.5 text-on-surface-deep">
                          <span className="text-[0.6667rem] font-bold uppercase">Duración:</span>
                          <span className="text-[0.7333rem] font-medium text-foreground">
                            {res.duration_hours}h
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-[0.6rem] font-bold text-outline-fg uppercase tracking-widest">
                        {t('sales.checkoutWizard.total', 'Total')}
                      </span>
                      <span
                        className={cn(
                          'text-lg font-black font-data-mono tracking-tighter',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {formatCurrency(Number(res.total_amount) || 0)}
                      </span>
                    </div>
                  </div>

                </button>
              )
            })}
          </div>
        )}

        {/* Registrar uso walk-in (sin reserva previa) */}
        <WalkInReservationForm
          clientId={clientId || ''}
          onRegisterWalkIn={onRegisterWalkIn}
        />
      </div>
    )
  },
)

ReservationsStep.displayName = 'ReservationsStep'
