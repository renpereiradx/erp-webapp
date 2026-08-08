/**
 * SaleCheckoutWizard — orquestador del flujo de concreción de venta.
 *
 * Unifica en un solo Stepper los modales hoy dispersos (CheckoutModal,
 * InstantPaymentDialog, modal de ventas pendientes y ReservationModal).
 * El operador recorre: Cliente → (Pendientes) → (Reservas) → Pago → Cobro,
 * con el carrito y el total siempre visibles en un panel derecho fijo.
 *
 * Layout: split fijo (pasos | carrito). Teclado: honra el store global de
 * atajos (sales.processSale, Ctrl+G) con alias F12/Enter por compatibilidad.
 *
 * La lógica de negocio (merge, reservas, pos-checkout, createSale) vive en
 * SalesNew.tsx y llega por callbacks; el wizard solo orquesta la navegación
 * y la UI.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBranch } from '@/contexts/BranchContext'
import { saleService } from '@/services/saleService'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useCheckoutShortcuts } from '@/features/sales/hooks/useCheckoutShortcuts'
import { ClientStep, ClientStepRef } from './steps/ClientStep'
import { PendingSalesStep, PendingSalesStepRef } from './steps/PendingSalesStep'
import { ReservationsStep, ReservationsStepRef } from './steps/ReservationsStep'
import { PaymentStep, PaymentStepRef } from './steps/PaymentStep'
import { CollectionStep, CollectionStepRef, CollectionData } from './steps/CollectionStep'

type StepId = 'client' | 'pending' | 'reservations' | 'payment' | 'collection'

interface SaleCheckoutWizardProps {
  isOpen: boolean
  onClose: () => void

  // Datos del carrito (panel derecho, solo lectura)
  items: any[]
  getItemLineTotal: (item: any) => number

  // Cliente
  client: any | null
  onClientSelect: (client: any) => void
  onClearClient: () => void

  // Ventas pendientes (paso condicional)
  activeSales: any[]
  onContinueSale: (index: number) => void | Promise<void>
  onNewSale: () => void

  // Reservas (paso condicional)
  pendingReservations: any[]
  selectedResIds: Set<number>
  onToggleReservation: (id: number) => void
  onAddReservations: () => void
  formatDateTime: (date: any) => string

  // Pago
  paymentMethods: any[]
  paymentMethodId: number
  setPaymentMethodId: (id: number) => void
  currencies: any[]
  currencyId: number
  setCurrencyId: (id: number) => void

  // Cobro (paso final)
  onConfirm: (collection: CollectionData) => Promise<void>
  onLeavePending: () => Promise<void>

  isProcessingSale: boolean
  error?: string | null
}

export const SaleCheckoutWizard: React.FC<SaleCheckoutWizardProps> = ({
  isOpen,
  onClose,
  items,
  getItemLineTotal,
  client,
  onClientSelect,
  onClearClient,
  activeSales,
  onContinueSale,
  onNewSale,
  pendingReservations,
  selectedResIds,
  onToggleReservation,
  onAddReservations,
  formatDateTime,
  paymentMethods,
  paymentMethodId,
  setPaymentMethodId,
  currencies,
  currencyId,
  setCurrencyId,
  onConfirm,
  onLeavePending,
  isProcessingSale,
  error,
}) => {
  const { t } = useI18n()
  const { currentBranchId } = useBranch()

  // ─── Estado de multi-moneda (pago) ──────────────────────────────────────
  const [exchangeRate, setExchangeRate] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')

  // ─── Estado de ventas pendientes (selección local) ──────────────────────
  const [pendingIndex, setPendingIndex] = useState(0)

  // ─── Datos del paso de cobro (reportados por CollectionStep) ────────────
  const [collectionData, setCollectionData] = useState<CollectionData>({
    amountReceived: 0,
    paymentMethodId: Number(paymentMethodId) || 0,
    cashRegisterId: null,
    notes: null,
  })

  // ─── Pasos visibles (condicionales) ─────────────────────────────────────
  const steps: StepId[] = useMemo(() => {
    const list: StepId[] = ['client']
    if (activeSales.length > 0) list.push('pending')
    if (pendingReservations.length > 0) list.push('reservations')
    list.push('payment', 'collection')
    return list
  }, [activeSales.length, pendingReservations.length])

  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  // Reset al abrir / cambiar de cliente.
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIdx(0)
      setPendingIndex(0)
    }
  }, [isOpen])

  const currentStep = steps[currentStepIdx]
  const isLastStep = currentStepIdx === steps.length - 1
  const isFirstStep = currentStepIdx === 0

  // ─── Refs de cada paso para foco por teclado ────────────────────────────
  const clientRef = useRef<ClientStepRef>(null)
  const pendingRef = useRef<PendingSalesStepRef>(null)
  const reservationsRef = useRef<ReservationsStepRef>(null)
  const paymentRef = useRef<PaymentStepRef>(null)
  const collectionRef = useRef<CollectionStepRef>(null)

  // Foco al montar cada paso (patrón de InstantPaymentDialog: 60ms).
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => focusCurrentStep(), 60)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOpen])

  const focusCurrentStep = () => {
    switch (currentStep) {
      case 'client':
        clientRef.current?.focus()
        break
      case 'pending':
        pendingRef.current?.focus()
        break
      case 'reservations':
        reservationsRef.current?.focus()
        break
      case 'payment':
        paymentRef.current?.focus()
        break
      case 'collection':
        collectionRef.current?.focus()
        break
    }
  }

  // ─── Validación del paso actual (para habilitar Avanzar) ────────────────
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'client':
        return !!client
      case 'pending':
        return pendingIndex >= 0 && pendingIndex < activeSales.length
      case 'reservations':
        return true // omitir es válido
      case 'payment':
        return !!paymentMethodId
      case 'collection':
        return true
      default:
        return false
    }
  }

  // ─── Acción principal: avanzar / confirmar ──────────────────────────────
  const handlePrimary = async () => {
    if (isProcessingSale) return

    // En el paso de pendientes, "continuar" ejecuta el merge antes de avanzar.
    if (currentStep === 'pending') {
      try {
        await onContinueSale(pendingIndex)
      } catch {
        return // el error lo maneja SalesNew (toast SALE_ALREADY_PAID, etc.)
      }
    }

    // En el paso de reservas, "avanzar" aplica las reservas seleccionadas.
    if (currentStep === 'reservations') {
      if (selectedResIds.size > 0) onAddReservations()
    }

    if (isLastStep) {
      await onConfirm(collectionData)
      return
    }

    setCurrentStepIdx((idx) => Math.min(idx + 1, steps.length - 1))
  }

  const handleBack = () => {
    if (isProcessingSale) return
    if (isFirstStep) {
      onClose()
      return
    }
    setCurrentStepIdx((idx) => Math.max(idx - 1, 0))
  }

  // ─── Teclado ────────────────────────────────────────────────────────────
  const primaryLabel = useCheckoutShortcuts(isOpen, {
    onPrimary: handlePrimary,
    onBack: handleBack,
    onFocusFirst: focusCurrentStep,
    onFocusClient: () => clientRef.current?.focusClientSearch(),
    onArrowUp: () => {
      if (currentStep === 'pending') setPendingIndex((i) => Math.max(i - 1, 0))
    },
    onArrowDown: () => {
      if (currentStep === 'pending') setPendingIndex((i) => Math.min(i + 1, activeSales.length - 1))
    },
    enabled: isStepValid(),
  })

  // ─── Cálculos del carrito (panel derecho) ───────────────────────────────
  const totals = useMemo(() => {
    const saleItems = items.map((item) => ({
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.price) || 0,
      discount_amount: item.discountType === 'amount' ? Number(item.discountInput) || 0 : 0,
      discount_percent: item.discountType === 'percent' ? Number(item.discountInput) || 0 : 0,
      tax_rate: Number(item.taxRate) || 0,
    }))
    return saleService.calculateLocalTotals(saleItems)
  }, [items])

  const selectedCurrency = currencies.find((c) => String(c.id) === String(currencyId))
  const currencyCode = selectedCurrency?.code || 'PYG'
  const isCashMethod = paymentMethods.find((m) => String(m.id) === String(paymentMethodId))?.name
    ?.toLowerCase()
    .includes('efectivo')

  const stepLabels: Record<StepId, string> = {
    client: t('sales.checkoutWizard.step.client', 'Cliente'),
    pending: t('sales.checkoutWizard.step.pendingSales', 'Venta pendiente'),
    reservations: t('sales.checkoutWizard.step.reservations', 'Reservas'),
    payment: t('sales.checkoutWizard.step.payment', 'Pago'),
    collection: t('sales.checkoutWizard.step.collection', 'Cobro'),
  }

  if (!isOpen) return null

  const primaryActionLabel = isLastStep
    ? isProcessingSale
      ? t('sales.checkoutWizard.action.processing', 'Procesando...')
      : t('sales.checkoutWizard.action.confirm', 'Confirmar Cobro')
    : t('sales.checkoutWizard.action.next', 'Avanzar')

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-surface-container-lowest shadow-fluent-16 rounded-md flex flex-col md:flex-row overflow-hidden min-h-[70vh] max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* ─── Panel izquierdo: Stepper ─────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-surface-container-low min-h-0">
          {/* Header con indicador de pasos */}
          <div className="px-6 py-5 border-b border-surface-variant bg-surface-container-low">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h2 className="text-headline-lg-mobile text-on-surface leading-none">
                  {t('sales.checkoutWizard.title', 'Concretar Venta')}
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  {t('sales.checkoutWizard.subtitle', 'Revisá y cobrá en una sola operación')}
                </p>
              </div>
            </div>
            {/* Indicador de progreso */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {steps.map((stepId, idx) => {
                const done = idx < currentStepIdx
                const active = idx === currentStepIdx
                return (
                  <React.Fragment key={stepId}>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all',
                        active
                          ? 'bg-primary text-on-primary shadow-sm'
                          : done
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      {done && <CheckCircle2 size={12} />}
                      <span>{stepLabels[stepId]}</span>
                    </div>
                    {idx < steps.length - 1 && <ChevronRight size={12} className="text-outline" />}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface-container-lowest">
            {currentStep === 'client' && (
              <ClientStep
                ref={clientRef}
                client={client}
                onClientSelect={onClientSelect}
                onClearClient={onClearClient}
                pendingSalesCount={activeSales.length}
                reservationsCount={pendingReservations.length}
              />
            )}
            {currentStep === 'pending' && (
              <PendingSalesStep
                ref={pendingRef}
                activeSales={activeSales}
                currentBranchId={currentBranchId}
                selectedIndex={pendingIndex}
                onSelectIndex={setPendingIndex}
              />
            )}
            {currentStep === 'reservations' && (
              <ReservationsStep
                ref={reservationsRef}
                pendingReservations={pendingReservations}
                selectedResIds={selectedResIds}
                onToggleSelection={onToggleReservation}
                formatDateTime={formatDateTime}
              />
            )}
            {currentStep === 'payment' && (
              <PaymentStep
                ref={paymentRef}
                paymentMethods={paymentMethods}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                currencies={currencies}
                currencyId={currencyId}
                setCurrencyId={setCurrencyId}
                exchangeRate={exchangeRate}
                setExchangeRate={setExchangeRate}
                originalAmount={originalAmount}
                setOriginalAmount={setOriginalAmount}
              />
            )}
            {currentStep === 'collection' && (
              <CollectionStep
                ref={collectionRef}
                totalAmount={totals.total}
                currencyCode={currencyCode}
                paymentMethodId={paymentMethodId}
                isCash={!!isCashMethod}
                onDataChange={setCollectionData}
              />
            )}

            {/* Acción especial: nueva venta en paso de pendientes */}
            {currentStep === 'pending' && (
              <div className="mt-4">
                <Button variant="outline" onClick={onNewSale} className="w-full h-11">
                  {t('sales.checkoutWizard.action.newSale', 'Nueva venta')}
                </Button>
              </div>
            )}

            {/* Error inline */}
            {error && (
              <div className="mt-4 rounded-md bg-error-container/50 p-3 text-sm text-destructive flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-surface-variant bg-surface-container-low flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isProcessingSale}
              className="h-12 px-4 text-on-surface-variant hover:bg-surface-container"
            >
              <ChevronLeft size={16} className="mr-1" />
              {t('sales.checkoutWizard.action.back', 'Volver')}
            </Button>
            <div className="flex-1" />
            {isLastStep && (
              <Button
                variant="outline"
                onClick={onLeavePending}
                disabled={isProcessingSale}
                className="h-12 px-4"
              >
                {t('sales.checkoutWizard.action.leavePending', 'Dejar pendiente')}
              </Button>
            )}
            <Button
              onClick={handlePrimary}
              disabled={isProcessingSale || !isStepValid()}
              className="h-12 px-6 bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
            >
              {isProcessingSale ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('sales.checkoutWizard.action.processing', 'Procesando...')}
                </>
              ) : (
                <>
                  {primaryActionLabel}
                  <span className="ml-2 text-xs opacity-80 font-data-mono">({primaryLabel})</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── Panel derecho: Carrito fijo ──────────────────────────── */}
        <div className="md:w-[360px] flex flex-col bg-surface-container-lowest border-t md:border-t-0 md:border-l border-surface-variant min-h-0">
          <div className="px-5 py-4 border-b border-surface-variant">
            <p className="text-label-caps text-on-surface-variant">
              {t('sales.checkoutWizard.cart', 'Carrito')} · {items.length}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {items.length === 0 ? (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                {t('sales.checkoutWizard.cartEmpty', 'El carrito está vacío')}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start justify-between gap-2 py-2 border-b border-surface-variant/50 last:border-0',
                    item.isFromPendingSale && 'opacity-60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-on-surface truncate">
                      {item.isFromPendingSale && (
                        <Badge className="mr-1 bg-surface-variant text-on-surface-variant border-none text-[8px] uppercase align-middle">
                          P
                        </Badge>
                      )}
                      {item.name}
                    </div>
                    <p className="text-xs text-on-surface-variant font-data-mono">
                      {item.quantity} {item.unit} × {formatCurrency(Number(item.price) || 0, currencyCode)}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-data-mono text-on-surface shrink-0">
                    {formatCurrency(getItemLineTotal(item), currencyCode)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="px-5 py-4 border-t border-surface-variant space-y-1.5 bg-surface-container-low">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>{t('sales.checkoutWizard.subtotal', 'Subtotal')}</span>
              <span className="font-data-mono">{formatCurrency(totals.subtotal, currencyCode)}</span>
            </div>
            {totals.discount_total > 0 && (
              <div className="flex justify-between text-xs text-error">
                <span>{t('sales.checkoutWizard.discount', 'Descuento')}</span>
                <span className="font-data-mono">-{formatCurrency(totals.discount_total, currencyCode)}</span>
              </div>
            )}
            {totals.tax_amount > 0 && (
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{t('sales.checkoutWizard.tax', 'Impuestos')}</span>
                <span className="font-data-mono">{formatCurrency(totals.tax_amount, currencyCode)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-surface-variant">
              <span className="text-label-caps text-on-surface-variant">
                {t('sales.checkoutWizard.total', 'Total')}
              </span>
              <span className="text-headline-lg-mobile text-primary font-data-mono tracking-tighter">
                {formatCurrency(totals.total, currencyCode)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaleCheckoutWizard
