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
import { useEffect, useMemo, useRef, useState } from 'react'
import { ShoppingCart, CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useCheckoutShortcuts } from '@/features/sales/hooks/useCheckoutShortcuts'
import { SupplierStep, SupplierStepRef } from './steps/SupplierStep'
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
  purchaseTotals: {
    subtotal: number
    iva10: number
    iva5: number
    exento?: number
    total?: number
  }

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

  const totalAmount =
    purchaseTotals.total ?? purchaseTotals.subtotal + (purchaseTotals.iva10 || 0) + (purchaseTotals.iva5 || 0)
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-surface-container-lowest shadow-fluent-16 rounded-md flex flex-col md:flex-row overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
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
                  {t('purchases.checkoutWizard.title', 'Concretar Compra')}
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  {t('purchases.checkoutWizard.subtitle', 'Registrá la orden y el pago al proveedor')}
                </p>
              </div>
            </div>
            {/* Indicador de progreso */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {steps.map((stepId, idx) => {
                const done = idx < currentStepIdx
                const active = idx === currentStepIdx
                return (
                  <div key={stepId} className="flex items-center">
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
                    {idx < steps.length - 1 && <ChevronRight size={12} className="text-outline mx-0.5" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface-container-lowest">
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
              disabled={loading}
              className="h-12 px-4 text-on-surface-variant hover:bg-surface-container"
            >
              <ChevronLeft size={16} className="mr-1" />
              {t('purchases.checkoutWizard.action.back', 'Volver')}
            </Button>
            <div className="flex-1" />
            {isLastStep && (
              <Button variant="outline" onClick={onLeavePending} disabled={loading} className="h-12 px-4">
                {t('purchases.checkoutWizard.action.leavePending', 'Solo guardar orden')}
              </Button>
            )}
            <Button
              onClick={handlePrimary}
              disabled={loading || !isStepValid()}
              className="h-12 px-6 bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('purchases.checkoutWizard.action.processing', 'Procesando...')}
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
              {t('purchases.checkoutWizard.cart', 'Orden')} · {purchaseItems.length}{' '}
              {t('purchases.checkoutWizard.items', 'Artículos')} ({itemCount})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {purchaseItems.length === 0 ? (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                {t('purchases.checkoutWizard.cartEmpty', 'No hay ítems en la orden')}
              </p>
            ) : (
              purchaseItems.map((item, idx) => (
                <div
                  key={item.product_id || idx}
                  className="flex items-start justify-between gap-2 py-2 border-b border-surface-variant/50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {item.product_name || item.name || item.product_id}
                    </p>
                    <p className="text-xs text-on-surface-variant font-data-mono">
                      {item.quantity} {item.unit} × {formatCurrency(Number(item.unit_price) || 0, paymentCurrency)}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-data-mono text-on-surface shrink-0">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), paymentCurrency)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="px-5 py-4 border-t border-surface-variant space-y-1.5 bg-surface-container-low">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>{t('purchases.checkoutWizard.subtotal', 'Subtotal')}</span>
              <span className="font-data-mono">{formatCurrency(purchaseTotals.subtotal, paymentCurrency)}</span>
            </div>
            {(purchaseTotals.iva10 > 0 || purchaseTotals.iva5 > 0) && (
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{t('purchases.checkoutWizard.taxSummary', 'Liquidación IVA')}</span>
                <span className="font-data-mono">
                  {formatCurrency((purchaseTotals.iva10 || 0) + (purchaseTotals.iva5 || 0), paymentCurrency)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-surface-variant">
              <span className="text-label-caps text-on-surface-variant">
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
