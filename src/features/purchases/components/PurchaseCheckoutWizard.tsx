/**
 * PurchaseCheckoutWizard — orquestador del flujo de concreción de compra.
 *
 * Es el equivalente de SaleCheckoutWizard para el módulo de compras. Unifica
 * en un solo Stepper lo que antes eran dos superficies separadas:
 * PurchaseCheckoutModal (proveedor + pago + notas) e InstantPaymentDialog
 * (pago post-creación).
 *
 * Pasos: Proveedor → Pago/Moneda/Notas → Cobro (caja + monto).
 * El carrito y el total quedan siempre visibles en un panel derecho fijo.
 *
 * A diferencia de ventas (que tiene pos-checkout atómico), las compras usan
 * un flujo de 2 llamadas: POST /purchase/complete (crear) → POST /purchase/
 * payment/process (pagar). El paso final orquesta ambas secuencialmente;
 * si el pago falla, la orden queda creada (igual que hoy).
 *
 * La lógica de negocio vive en usePurchasesLogic y llega por callbacks.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useCheckoutShortcuts } from '@/features/sales/hooks/useCheckoutShortcuts';
import { PurchaseTotals } from '@/domain/purchase/calculations/purchaseCalculator';
import { SupplierStep, SupplierStepRef } from './steps/SupplierStep'
import PurchaseBranchBanner from './PurchaseBranchBanner'
import { PurchasePaymentStep, PurchasePaymentStepRef } from './steps/PurchasePaymentStep'
import {
  PurchaseCollectionStep,
  PurchaseCollectionStepRef,
  PurchaseCollectionData,
} from './steps/PurchaseCollectionStep'

type StepId = 'supplier' | 'payment' | 'collection'

interface PurchaseCheckoutWizardProps {
  isOpen: boolean
  onClose: () => void

  // Carrito (panel derecho, solo lectura)
  purchaseItems: any[]
  purchaseTotals: Partial<PurchaseTotals>

  // Proveedor
  selectedSupplier: any | null
  supplierSearch: string
  setSupplierSearch: (v: string) => void
  supplierResults: any[]
  searchingSuppliers: boolean
  showSupplierDropdown: boolean
  setShowSupplierDropdown: (v: boolean) => void
  activeSupplierIndex: number
  setActiveSupplierIndex: (v: number) => void
  onSupplierSelect: (s: any) => void
  onClearSupplier: () => void
  onSearchKeyDown: (e: React.KeyboardEvent) => void
  searchRef: React.RefObject<HTMLDivElement | null>
  getSupplierName: (s: any) => string

  // Pago / moneda / notas
  paymentMethods: any[]
  paymentMethod: string
  setPaymentMethod: (v: string) => void
  currencies: any[]
  paymentCurrency: string
  setPaymentCurrency: (v: string) => void
  purchaseNotes: string
  setPurchaseNotes: (v: string) => void
  getPaymentMethodLabel: (m: any) => string
  getCurrencyLabel: (c: any) => string

  // Cobro (paso final): crear orden + pagar
  onConfirm: (collection: PurchaseCollectionData) => Promise<void>
  onLeavePending: () => Promise<void>

  loading: boolean
  error?: string | null
}

export const PurchaseCheckoutWizard = ({
  isOpen,
  onClose,
  purchaseItems,
  purchaseTotals,
  selectedSupplier,
  supplierSearch,
  setSupplierSearch,
  supplierResults,
  searchingSuppliers,
  showSupplierDropdown,
  setShowSupplierDropdown,
  activeSupplierIndex,
  setActiveSupplierIndex,
  onSupplierSelect,
  onClearSupplier,
  onSearchKeyDown,
  searchRef,
  getSupplierName,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  currencies,
  paymentCurrency,
  setPaymentCurrency,
  purchaseNotes,
  setPurchaseNotes,
  getPaymentMethodLabel,
  getCurrencyLabel,
  onConfirm,
  onLeavePending,
  loading,
  error,
}: PurchaseCheckoutWizardProps) => {
  const { t } = useI18n()

  // Datos del paso de cobro (reportados por PurchaseCollectionStep)
  const [collectionData, setCollectionData] = useState<PurchaseCollectionData>({
    amountPaid: 0,
    cashRegisterId: null,
    notes: null,
  })

  const steps: StepId[] = useMemo(() => ['supplier', 'payment', 'collection'], [])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  const currentStep = steps[currentStepIdx]
  const isLastStep = currentStepIdx === steps.length - 1
  const isFirstStep = currentStepIdx === 0

  // Refs de cada paso para foco por teclado
  const supplierRef = useRef<SupplierStepRef>(null)
  const paymentRef = useRef<PurchasePaymentStepRef>(null)
  const collectionRef = useRef<PurchaseCollectionStepRef>(null)

  // Reset al abrir
  useEffect(() => {
    if (isOpen) setCurrentStepIdx(0)
  }, [isOpen])

  // Foco al montar cada paso (patrón: 60ms)
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => focusCurrentStep(), 60)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOpen])

  const focusCurrentStep = () => {
    switch (currentStep) {
      case 'supplier':
        supplierRef.current?.focus()
        break
      case 'payment':
        paymentRef.current?.focus()
        break
      case 'collection':
        collectionRef.current?.focus()
        break
    }
  }

  // Validación del paso actual
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'supplier':
        return !!selectedSupplier
      case 'payment':
        return !!paymentMethod
      case 'collection':
        return true
      default:
        return false
    }
  }

  // Acción principal: avanzar / confirmar
  const handlePrimary = async () => {
    if (loading) return
    if (isLastStep) {
      await onConfirm(collectionData)
      return
    }
    setCurrentStepIdx((idx) => Math.min(idx + 1, steps.length - 1))
  }

  const handleBack = () => {
    if (loading) return
    if (isFirstStep) {
      onClose()
      return
    }
    setCurrentStepIdx((idx) => Math.max(idx - 1, 0))
  }

  // Teclado: honra purchases.processPurchase (Ctrl+G configurable)
  const primaryLabel = useCheckoutShortcuts(
    isOpen,
    {
      onPrimary: handlePrimary,
      onBack: handleBack,
      onFocusFirst: focusCurrentStep,
      onFocusClient: () => supplierRef.current?.focusSearch(),
      enabled: isStepValid(),
    },
    'purchases.processPurchase',
  )

  // Atajos visibles en el footer (discoverability). Variables según el paso.
  const hints = useMemo<Array<{ kbd: string; label: string }>>(() => {
    const base: Array<{ kbd: string; label: string }> = [
      {
        kbd: primaryLabel,
        label: isLastStep
          ? t('purchases.checkoutWizard.hints.confirm', 'Confirmar')
          : t('purchases.checkoutWizard.hints.next', 'Avanzar'),
      },
      { kbd: t('purchases.checkoutWizard.hints.enterKey', 'Enter'), label: t('purchases.checkoutWizard.hints.advance', 'Avanzar') },
      { kbd: 'Esc', label: t('purchases.checkoutWizard.hints.back', 'Volver') },
      { kbd: 'F2', label: t('purchases.checkoutWizard.hints.focus', 'Foco') },
    ]
    if (currentStep === 'supplier') {
      base.push({ kbd: 'F3', label: t('purchases.checkoutWizard.hints.searchSupplier', 'Buscar proveedor') })
      base.push({ kbd: '↑↓', label: t('purchases.checkoutWizard.hints.navigate', 'Navegar') })
    }
    if (currentStep === 'collection') {
      base.push({ kbd: 'F4', label: t('purchases.checkoutWizard.hints.exactAmount', 'Monto exacto') })
    }
    return base
  }, [primaryLabel, isLastStep, currentStep, t])

  const totalAmount = purchaseTotals.total ?? purchaseTotals.subtotal ?? 0
  const itemCount = purchaseItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)

  const stepLabels: Record<StepId, string> = {
    supplier: t('purchases.checkoutWizard.step.supplier', 'Proveedor'),
    payment: t('purchases.checkoutWizard.step.payment', 'Pago'),
    collection: t('purchases.checkoutWizard.step.collection', 'Cobro'),
  }

  if (!isOpen) return null

  const primaryActionLabel = isLastStep
    ? loading
      ? t('purchases.checkoutWizard.action.processing', 'Procesando...')
      : t('purchases.checkoutWizard.action.confirm', 'Confirmar Compra')
    : t('purchases.checkoutWizard.action.next', 'Avanzar')

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t('purchases.checkoutWizard.title', 'Concretar Compra')}
      data-testid="purchases-checkout-wizard"
    >
      <div className="relative w-full max-w-5xl bg-surface shadow-fluent-16 rounded-xl flex flex-col md:flex-row overflow-hidden min-h-[70vh] max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* ─── Panel izquierdo: Stepper ─────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-surface-muted min-h-0">
          {/* Header con indicador de pasos */}
          <div className="px-6 py-5 border-b border-divider bg-surface-muted">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 bg-primary-container rounded-md flex items-center justify-center text-on-primary-container">
                <ShoppingCart size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-headline-lg-mobile text-foreground leading-none">
                  {t('purchases.checkoutWizard.title', 'Concretar Compra')}
                </h2>
                <p className="text-body-sm text-on-surface-deep">
                  {t('purchases.checkoutWizard.subtitle', 'Registrá la orden y el pago al proveedor')}
                </p>
              </div>
            </div>
            {/* Indicador de progreso (segmentos numerados, igual que ventas) */}
            <div className="flex items-center gap-1 w-full" role="list" aria-label={t('purchases.checkoutWizard.stepsAria', 'Pasos del checkout')}>
              {steps.map((stepId, idx) => {
                const done = idx < currentStepIdx
                const active = idx === currentStepIdx
                return (
                  <Fragment key={stepId}>
                    <div
                      role="listitem"
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-body-sm-bold transition-colors duration-150 min-w-0',
                        active
                          ? 'bg-primary text-on-primary'
                          : done
                            ? 'bg-surface-subtle text-success'
                            : 'bg-surface-subtle text-on-surface-deep',
                      )}
                    >
                      <span className="font-data-mono">{idx + 1}.</span>
                      <span className="truncate">{stepLabels[stepId]}</span>
                      {done && <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />}
                    </div>
                    {idx < steps.length - 1 && (
                      <ChevronRight size={14} className="text-outline-fg shrink-0" aria-hidden="true" />
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface">
            {/* F.5a: la sucursal de carga (= sucursal activa) visible en todo
                el wizard; sin selector libre (modelo depósito puro §4.6). */}
            <div className="mb-md">
              <PurchaseBranchBanner />
            </div>
            {currentStep === 'supplier' && (
              <SupplierStep
                ref={supplierRef}
                selectedSupplier={selectedSupplier}
                supplierSearch={supplierSearch}
                setSupplierSearch={setSupplierSearch}
                supplierResults={supplierResults}
                searchingSuppliers={searchingSuppliers}
                showSupplierDropdown={showSupplierDropdown}
                setShowSupplierDropdown={setShowSupplierDropdown}
                activeSupplierIndex={activeSupplierIndex}
                setActiveSupplierIndex={setActiveSupplierIndex}
                onSupplierSelect={onSupplierSelect}
                onClearSupplier={onClearSupplier}
                onSearchKeyDown={onSearchKeyDown}
                searchRef={searchRef}
                getSupplierName={getSupplierName}
              />
            )}
            {currentStep === 'payment' && (
              <PurchasePaymentStep
                ref={paymentRef}
                paymentMethods={paymentMethods}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                currencies={currencies}
                paymentCurrency={paymentCurrency}
                setPaymentCurrency={setPaymentCurrency}
                purchaseNotes={purchaseNotes}
                setPurchaseNotes={setPurchaseNotes}
                getPaymentMethodLabel={getPaymentMethodLabel}
                getCurrencyLabel={getCurrencyLabel}
              />
            )}
            {currentStep === 'collection' && (
              <PurchaseCollectionStep
                ref={collectionRef}
                totalAmount={totalAmount}
                currencyCode={paymentCurrency}
                onDataChange={setCollectionData}
              />
            )}

            {/* Error inline */}
            {error && (
              <div className="mt-4 rounded-md bg-error-container text-on-error-container p-3 text-body-md flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-divider bg-surface-muted space-y-3">
            {/* Hints de teclado */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-deep">
              {hints.map((h, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <kbd className="font-data-mono px-1.5 py-0.5 rounded-xs border border-divider bg-surface text-foreground text-body-sm-bold leading-none">
                    {h.kbd}
                  </kbd>
                  <span>{h.label}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="h-12 px-4 text-on-surface-deep hover:bg-surface-subtle"
              >
                <ChevronLeft size={16} className="mr-1" aria-hidden="true" />
                {t('purchases.checkoutWizard.action.back', 'Volver')}
              </Button>
              <div className="flex-1" />
              {isLastStep && (
                <Button variant="outline" onClick={onLeavePending} disabled={loading} className="h-12 px-4">
                  {t('purchases.checkoutWizard.action.leavePending', 'Solo guardar orden')}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handlePrimary}
                disabled={loading || !isStepValid()}
                className="h-12 px-6"
                data-testid="wizard-primary-action"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    {t('purchases.checkoutWizard.action.processing', 'Procesando...')}
                  </>
                ) : (
                  <>
                    {primaryActionLabel}
                    <span className="ml-2 text-body-sm font-data-mono opacity-80">({primaryLabel})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Panel derecho: Carrito fijo ──────────────────────────── */}
        <div className="md:w-[360px] flex flex-col bg-surface border-t md:border-t-0 md:border-l border-divider min-h-0">
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
            <p className="text-title-md text-foreground">
              {t('purchases.checkoutWizard.cart', 'Orden')}
            </p>
            <Badge variant="secondary" size="sm" className="font-data-mono">
              {purchaseItems.length} · {itemCount}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2" role="list" aria-label={t('purchases.checkoutWizard.cart', 'Orden')}>
            {purchaseItems.length === 0 ? (
              <p className="text-center py-8 text-body-md text-on-surface-deep">
                {t('purchases.checkoutWizard.cartEmpty', 'No hay ítems en la orden')}
              </p>
            ) : (
              purchaseItems.map((item, idx) => (
                <div
                  key={item.product_id || idx}
                  role="listitem"
                  className="flex items-start justify-between gap-2 py-2 border-b border-divider last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md-bold text-foreground truncate">
                      {item.product_name || item.name || item.product_id}
                    </p>
                    <p className="text-body-sm text-on-surface-deep font-data-mono">
                      {item.quantity} {item.unit} × {formatCurrency(Number(item.unit_price) || 0, paymentCurrency)}
                    </p>
                  </div>
                  <p className="text-body-md-bold font-data-mono text-foreground shrink-0">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), paymentCurrency)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="px-5 py-4 border-t border-divider space-y-1.5 bg-surface-muted">
            <div className="flex justify-between text-body-sm text-on-surface-deep">
              <span>{t('purchases.checkoutWizard.subtotal', 'Subtotal')}</span>
              <span className="font-data-mono">{formatCurrency(purchaseTotals.subtotal ?? 0, paymentCurrency)}</span>
            </div>
            {(purchaseTotals.tax ?? 0) > 0 && (
              <div className="flex justify-between text-body-sm text-on-surface-deep">
                <span>{t('purchases.checkoutWizard.taxSummary', 'Liquidación IVA')}</span>
                <span className="font-data-mono">
                  {formatCurrency(purchaseTotals.tax ?? 0, paymentCurrency)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-divider">
              <span className="text-label-caps uppercase text-on-surface-deep">
                {t('purchases.checkoutWizard.total', 'Total Compra')}
              </span>
              <span className="text-headline-lg-mobile text-primary font-data-mono tracking-tighter">
                {formatCurrency(totalAmount, paymentCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseCheckoutWizard
