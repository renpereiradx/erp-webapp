/**
 * PaymentMethodGrid — selección de método de pago para los wizards de checkout.
 *
 * Patrón canónico (DESIGN.md §6.9): grilla de tarjetas con icono, hotkeys
 * [1..9] y semántica de radiogroup. Compartido por el paso de Pago de
 * SaleCheckoutWizard y PurchaseCheckoutWizard — la lógica de hotkeys vive
 * acá una sola vez.
 *
 * Hotkeys: mientras el paso está montado, las teclas 1..9 seleccionan el
 * método en esa posición. Se ignoran si el foco está en un campo de texto
 * (input/textarea/select/contentEditable) o si un dropdown está abierto
 * (Radix Select de moneda consume el teclado mientras navega opciones).
 */
import { useEffect, useRef, type Ref } from 'react'
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

/** Icono del método según su nombre (efectivo/tarjeta/transferencia/otro). */
export const paymentMethodIcon = (name: string) => {
  const n = (name || '').toLowerCase()
  if (n.includes('efectivo') || n.includes('cash')) return Banknote
  if (n.includes('transfer')) return Landmark
  if (n.includes('tarjeta') || n.includes('credit') || n.includes('debit') || n.includes('card')) return CreditCard
  return Wallet
}

interface PaymentMethodGridProps {
  methods: any[]
  /** Id del método seleccionado, siempre como string (los wizards lo converten). */
  selectedId: string
  onSelect: (id: string) => void
  /** Label visible del método; default: method.name || method.description. */
  labelFor?: (method: any) => string
  /** Id del elemento que etiqueta la grilla (para aria-labelledby). */
  labelledbyId: string
  /** Ref al primer botón: el paso lo usa para su focus() imperativo. */
  firstButtonRef?: Ref<HTMLButtonElement>
}

export const PaymentMethodGrid = ({
  methods,
  selectedId,
  onSelect,
  labelFor,
  labelledbyId,
  firstButtonRef,
}: PaymentMethodGridProps) => {
  const { t } = useI18n()
  const internalFirstRef = useRef<HTMLButtonElement>(null)
  const firstRef = firstButtonRef ?? internalFirstRef

  // Hotkeys [1..9]: elegir método sin mouse (mockup POS). Solo fuera de
  // campos de texto y con dropdowns cerrados.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      ) {
        return
      }
      // Un dropdown abierto (ej. Select de moneda) consume el teclado: no
      // cambiar de método mientras el operador navega opciones.
      if (target?.closest?.('[role="listbox"],[role="option"],[data-radix-popper-content-wrapper]')) return
      const digit = Number(e.key)
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) return
      const method = methods[digit - 1]
      if (!method) return
      e.preventDefault()
      onSelect(String(method.id))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [methods, onSelect])

  const labelOf = (method: any) =>
    labelFor ? labelFor(method) : method.name || method.description || String(method.id)

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      role="radiogroup"
      aria-labelledby={labelledbyId}
    >
      {methods.map((method, idx) => {
        const selected = String(method.id) === String(selectedId)
        const Icon = paymentMethodIcon(method.name || method.description)
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            ref={idx === 0 ? firstRef : undefined}
            onClick={() => onSelect(String(method.id))}
            data-testid={`payment-method-${method.id}`}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-md border-2 transition-colors duration-150 min-h-[76px] cursor-pointer',
              selected
                ? 'border-primary bg-primary-container/40'
                : 'border-divider bg-surface hover:border-primary/50 hover:bg-surface-muted',
            )}
          >
            <Icon size={24} className={selected ? 'text-primary' : 'text-on-surface-deep'} aria-hidden="true" />
            <span className="text-body-sm-bold text-foreground text-center leading-tight">
              <span className="font-data-mono text-on-surface-deep">[{idx + 1}]</span>{' '}
              {labelOf(method)}
            </span>
          </button>
        )
      })}
      {methods.length === 0 && (
        <p className="col-span-full text-body-sm text-on-surface-deep py-2">
          {t('checkout.paymentMethodsEmpty', 'No hay métodos de pago disponibles')}
        </p>
      )}
    </div>
  )
}

export default PaymentMethodGrid
