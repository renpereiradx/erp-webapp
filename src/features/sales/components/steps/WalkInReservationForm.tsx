/**
 * WalkInReservationForm — panel del paso Reservas del SaleCheckoutWizard.
 *
 * Cubre el flujo walk-in: el cliente usó una cancha sin reserva previa y
 * quiere pagar. El operador registra el uso acá mismo (cancha + fecha + hora
 * + duración) sin salir de /ventas: la reserva se crea y confirma vía
 * callback, y el ítem entra al carrito con el total autoritativo del backend.
 *
 * La lógica de negocio (CREATE + CONFIRM + carrito) vive en SalesNew.tsx y
 * llega por `onRegisterWalkIn`; este componente solo orquesta la UI y la
 * carga de horarios.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currencyUtils'
import { useI18n } from '@/lib/i18n'
import { reservationService } from '@/services/reservationService'
import {
  getBookableSlots,
  getMaxConsecutiveDuration,
  type BookableSlot,
} from '@/domain/reservation/slotAvailability'

export interface WalkInSpec {
  productId: string
  productName: string
  startTime: string
  duration: number
}

interface WalkInReservationFormProps {
  clientId: string
  /** Product ids ya presentes en el carrito (regla: una reserva por producto). */
  blockedProductIds: Set<string>
  /** Registra el uso (CREATE + CONFIRM + carrito). true si se registró. */
  onRegisterWalkIn: (spec: WalkInSpec) => Promise<boolean>
}

// Extrae la tarifa por hora del producto (misma jerarquía que la agenda:
// unit_prices > campos directos). Solo para el preview — el total final lo
// fija el backend al crear la reserva.
const extractHourlyRate = (product: any): number => {
  const unitPrices = product?.unit_prices
  if (Array.isArray(unitPrices) && unitPrices.length > 0) {
    const first = unitPrices[0]
    return (
      first.price_per_unit || first.unit_price || first.price || first.base_price || first.sale_price || 0
    )
  }
  return product?.base_price || product?.price || product?.unit_price || product?.price_per_unit || product?.sale_price || 0
}

// "2026-08-14T10:00:00Z" | "2026-08-14 10:00:00" → "10:00"
const formatSlotTime = (startTime: string): string => {
  const timePart = startTime.includes('T') ? startTime.split('T')[1] : startTime.split(' ')[1]
  if (!timePart) return startTime
  return timePart.slice(0, 5)
}

export const WalkInReservationForm = ({
  clientId,
  blockedProductIds,
  onRegisterWalkIn,
}: WalkInReservationFormProps) => {
  const { t } = useI18n()

  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState('')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD local
  const [slots, setSlots] = useState<BookableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsEmpty, setSlotsEmpty] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Canchas disponibles para el walk-in.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await reservationService.getProducts()
        if (!cancelled) setProducts(list || [])
      } catch {
        if (!cancelled) setProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchSlots = useCallback(async () => {
    if (!productId || !date) return
    setLoadingSlots(true)
    try {
      const data = await reservationService.getSchedulesForProductAndDate(productId, date)
      setSlots(data || [])
      setSlotsEmpty((data || []).length === 0)
      setStartTime('')
    } catch {
      setSlots([])
      setSlotsEmpty(true)
      setStartTime('')
    } finally {
      setLoadingSlots(false)
    }
  }, [productId, date])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const bookableSlots = useMemo(() => getBookableSlots(slots), [slots])
  const selectedProduct = products.find((p) => (p.id || p.product_id) === productId)
  const maxDuration = getMaxConsecutiveDuration(slots, startTime, selectedProduct?.max_duration || 4)

  // Re-clampear la duración al cambiar de horario/cancha.
  useEffect(() => {
    setDuration((d) => Math.max(1, Math.min(d, Math.max(maxDuration, 1))))
  }, [maxDuration])

  const handleGenerateSchedules = async () => {
    if (!productId || !date) return
    setGenerating(true)
    try {
      await reservationService.generateSchedules({ target_date: date, product_ids: [productId] })
      await fetchSlots()
    } catch {
      // El toast de error lo maneja el operador reintentando; queda el estado vacío visible.
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !productId || !startTime || duration < 1 || submitting) return
    setSubmitting(true)
    try {
      const ok = await onRegisterWalkIn({
        productId,
        productName: selectedProduct?.name || selectedProduct?.product_name || productId,
        startTime,
        duration,
      })
      if (ok) {
        // Reset de la selección; la validación de "una reserva por venta"
        // corre en SalesNew al registrar la siguiente.
        setStartTime('')
        setDuration(1)
      }
      // Refrescar disponibilidad (el slot registrado ya no está libre).
      await fetchSlots()
    } finally {
      setSubmitting(false)
    }
  }

  const hourlyRate = extractHourlyRate(selectedProduct)
  const estimatedTotal = hourlyRate * duration

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-title-md text-on-surface">
          {t('sales.checkoutWizard.walkIn.title', 'Registrar uso de cancha (sin reserva)')}
        </h3>
        <p className="text-body-sm text-on-surface-variant">
          {t(
            'sales.checkoutWizard.walkIn.subtitle',
            'El cliente ya usó la cancha: registrá el horario y sumalo al carrito para cobrar',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Cancha */}
        <div>
          <label className="text-label-caps text-on-surface-variant" htmlFor="walkin-product">
            {t('sales.checkoutWizard.walkIn.court', 'Cancha')}
          </label>
          <select
            id="walkin-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
          >
            <option value="">
              {t('sales.checkoutWizard.walkIn.selectCourt', 'Seleccionar cancha...')}
            </option>
            {/* Las canchas ya en el carrito (vía reserva) van al final y
                deshabilitadas, para no confundir con una selección. */}
            {[...products]
              .sort((a, b) => {
                const aBlocked = blockedProductIds.has(String(a.id || a.product_id))
                const bBlocked = blockedProductIds.has(String(b.id || b.product_id))
                return Number(aBlocked) - Number(bBlocked)
              })
              .map((p) => {
                const id = p.id || p.product_id
                const blocked = blockedProductIds.has(String(id))
                return (
                  <option key={id} value={id} disabled={blocked}>
                    {p.name || p.product_name || id}
                    {blocked ? ` — ${t('sales.checkoutWizard.walkIn.inCart', '(ya en el carrito)')}` : ''}
                  </option>
                )
              })}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="text-label-caps text-on-surface-variant" htmlFor="walkin-date">
            {t('sales.checkoutWizard.walkIn.date', 'Fecha')}
          </label>
          <input
            id="walkin-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-data-mono text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Horarios */}
      <div>
        <label className="text-label-caps text-on-surface-variant" htmlFor="walkin-start">
          {t('sales.checkoutWizard.walkIn.startTime', 'Hora de inicio')}
        </label>
        {loadingSlots ? (
          <div className="mt-1 flex items-center gap-2 h-11 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm text-on-surface-variant">
            <Loader2 size={14} className="animate-spin" />
            {t('sales.checkoutWizard.walkIn.loadingSlots', 'Cargando horarios...')}
          </div>
        ) : slotsEmpty ? (
          <div className="mt-1 rounded-md border border-outline-variant bg-surface-container-lowest p-3 space-y-2">
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <CalendarClock size={13} />
              {t(
                'sales.checkoutWizard.walkIn.noSlots',
                'No hay horarios generados para esta cancha en la fecha elegida.',
              )}
            </p>
            <button
              type="button"
              onClick={handleGenerateSchedules}
              disabled={generating || !productId}
              className="w-full h-10 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              {t('sales.checkoutWizard.walkIn.generate', 'Generar horarios del día')}
            </button>
          </div>
        ) : (
          <select
            id="walkin-start"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-data-mono text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
          >
            <option value="">
              {t('sales.checkoutWizard.walkIn.selectSlot', 'Seleccionar horario...')}
            </option>
            {bookableSlots.map((s) => (
              <option key={s.start_time} value={s.start_time}>
                {formatSlotTime(s.start_time)} – {formatSlotTime(s.end_time)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Duración */}
      <div className="rounded-md border border-outline-variant bg-surface-container-low p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-label-caps text-on-surface-variant">
            {t('sales.checkoutWizard.walkIn.duration', 'Duración')}
          </span>
          <span className="font-data-mono font-black text-sm text-primary">
            {duration} h
            {maxDuration < (selectedProduct?.max_duration || 4) && (
              <span className="ml-1 text-[10px] font-bold text-on-surface-variant">
                ({t('sales.checkoutWizard.walkIn.maxAvailable', 'máx {n}', { n: maxDuration })})
              </span>
            )}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={Math.max(maxDuration, 1)}
          step={1}
          value={Math.min(duration, Math.max(maxDuration, 1))}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          disabled={!startTime}
          className="w-full accent-primary cursor-pointer disabled:opacity-40"
        />
      </div>

      {/* Preview de precio (estimado; el total final lo fija el backend) */}
      {hourlyRate > 0 && startTime && (
        <div className="rounded-md bg-surface-container-low border border-outline-variant px-4 py-3 flex justify-between items-center">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            {t('sales.checkoutWizard.walkIn.estimate', 'Estimado ({h} × {rate}/h)', {
              h: duration,
              rate: formatCurrency(hourlyRate),
            })}
          </span>
          <span className="font-data-mono font-black text-lg text-on-surface tracking-tighter">
            {formatCurrency(estimatedTotal)}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!clientId || !productId || !startTime || submitting}
        className={cn(
          'w-full h-12 rounded-md text-sm font-bold uppercase tracking-wider transition-all',
          'bg-primary text-on-primary shadow-sm hover:bg-primary/90',
          'disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2',
        )}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting
          ? t('sales.checkoutWizard.walkIn.registering', 'Registrando...')
          : t('sales.checkoutWizard.walkIn.add', 'Registrar uso y sumar al carrito')}
      </button>
    </form>
  )
}
