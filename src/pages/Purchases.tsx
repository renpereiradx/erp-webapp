import { useState, useEffect } from 'react'
import { AlertCircle, History, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import ToastContainer from '@/components/ui/ToastContainer'

import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic'
import { PurchaseProductModal } from '@/features/purchases/components/PurchaseProductModal'

import { PurchaseCartTable } from '@/features/purchases/components/PurchaseCartTable'
import { PurchaseTotalsCard } from '@/features/purchases/components/PurchaseTotalsCard'
import { PurchaseHistoryTab } from '@/features/purchases/components/PurchaseHistoryTab'
import { PurchaseCheckoutWizard } from '@/features/purchases/components/PurchaseCheckoutWizard'
import type { PurchaseCollectionData } from '@/features/purchases/components/steps/PurchaseCollectionStep'

import { PurchaseCancelModal } from '@/features/purchases/components/PurchaseCancelModal'
import { PurchaseConfirmationModal } from '@/features/purchases/components/PurchaseConfirmationModal'
import CreateTransferModal from '@/features/transfers/components/CreateTransferModal'
import type { PreloadedTransferItem } from '@/features/transfers/types'

/**
 * Purchases Page — Fluent Design System 2 (DESIGN.md).
 * Contenedor puro: la lógica vive en usePurchasesLogic y la presentación
 * en los componentes del feature.
 */
const Purchases = () => {
  const { t } = useI18n()
  const [showCheckoutWizard, setShowCheckoutWizard] = useState(false);
  // F.5: precarga de la transferencia post-compra ("Enviar a sucursal…").
  const [transferPreload, setTransferPreload] = useState<{
    items: PreloadedTransferItem[];
    branchId: number | null;
  } | null>(null)
  const logic = usePurchasesLogic();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (logic.activeTab === 'nueva-compra' && event.key === 'F12' && logic.purchaseItems.length > 0) {
        event.preventDefault();
        setShowCheckoutWizard(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [logic.activeTab, logic.purchaseItems]);

  const {
    activeTab,
    error,
    paymentMethods,
    setActiveTab,
    toast,
  } = logic

  // onConfirmWizard: crea la orden de compra y luego procesa el pago.
  // Flujo de 2 llamadas (create → pay); si el pago falla, la orden queda creada.
  // Sin useCallback: handleSavePurchase devuelve el resultado creado, así no se
  // depende de leer estado post-await (evita stale closures del primer render).
  const onConfirmWizard = async (collection: PurchaseCollectionData) => {
    // 1. Crear la orden de compra.
    const saved = await logic.handleSavePurchase()
    // Si la creación falló, handleSavePurchase ya mostró el toast; abortamos.
    if (!saved?.success || !saved?.id) return
    // 2. Procesar el pago al proveedor.
    try {
      await logic.handleInstantPaymentConfirm({
        orderId: saved.id,
        amount: collection.amountPaid,
        paymentMethodId: logic.paymentMethod ? Number(logic.paymentMethod) : null,
        currencyCode: logic.paymentCurrency,
        notes: collection.notes,
        cash_register_id: collection.cashRegisterId,
      })
    } finally {
      setShowCheckoutWizard(false)
      // F.5: post-compra se muestra el resultado con el CTA "Enviar a
      // sucursal…" (transferencia precargada con los ítems de la compra).
      logic.setShowConfirmationModal(true)
    }
  }

  // onLeavePendingWizard: guarda la orden sin pagar (queda pendiente de pago).
  const onLeavePendingWizard = async () => {
    const saved = await logic.handleSavePurchase()
    if (saved?.success && saved?.id) {
      logic.handleLeavePurchasePending()
    }
    setShowCheckoutWizard(false)
  }

  const tabs = [
    { id: 'nueva-compra', label: t('purchases.tab.new', 'Nueva Compra'), icon: <Plus size={16} aria-hidden="true" /> },
    { id: 'historial', label: t('purchases.tab.history', 'Historial de Compras'), icon: <History size={16} aria-hidden="true" /> },
  ]

  return (
    <div className='mx-auto w-full max-w-container-max flex flex-col gap-lg animate-in fade-in duration-150'>
      <PageHeader
        breadcrumb={t('purchases.title', 'Compras')}
        title={t('purchases.management.title', 'Gestión de Compras')}
        subtitle={t('purchases.management.subtitle', 'Abastecimiento y órdenes de compra a proveedores')}
        actions={
          <div
            role='tablist'
            aria-label={t('purchases.management.title', 'Gestión de Compras')}
            className='flex items-center gap-1 p-1 bg-surface-muted rounded-button border border-border-subtle'
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                role='tab'
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-sm px-lg py-2 rounded-sm text-body-sm-bold transition-colors duration-150 cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-surface text-primary shadow-fluent-2'
                    : 'text-on-surface-deep hover:text-foreground'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        }
      />

      <main className='w-full flex flex-col gap-lg'>
        {error && (
          <div
            role='alert'
            className='p-md bg-error-container text-on-error-container rounded-md flex items-center gap-sm'
          >
            <AlertCircle className='size-4 shrink-0' aria-hidden='true' />
            <p className='text-body-sm-bold'>{error}</p>
          </div>
        )}

        {activeTab === 'nueva-compra' && (
          <div className='space-y-lg'>
            <PurchaseCartTable {...logic} />
            <PurchaseTotalsCard {...logic} onCheckout={() => setShowCheckoutWizard(true)} />
          </div>
        )}

        {activeTab === 'historial' && (
          <PurchaseHistoryTab {...logic} />
        )}
      </main>

      {/* PRODUCT MODAL - Extracted to component */}
      <PurchaseProductModal {...logic} />

      {/* CANCEL ORDER MODAL - Extracted to component */}
      <PurchaseCancelModal {...logic} />

      {/* CONFIRMATION MODAL - Extracted to component */}
      <PurchaseConfirmationModal
        {...logic}
        onSendToBranch={() => {
          const result = logic.latestPurchaseResult
          if (!result) return
          setTransferPreload({
            items: (result.transferable_items || []) as PreloadedTransferItem[],
            branchId: result.branch_id ?? null,
          })
        }}
      />

      {/* F.5: transferencia precargada con los ítems de la compra recién
          registrada; origen = sucursal donde la compra cargó stock. */}
      {transferPreload && (
        <CreateTransferModal
          open
          onOpenChange={(open) => {
            if (!open) setTransferPreload(null)
          }}
          sourceBranchId={transferPreload.branchId}
          initialItems={transferPreload.items}
        />
      )}

      <PurchaseCheckoutWizard
        isOpen={showCheckoutWizard}
        onClose={() => setShowCheckoutWizard(false)}
        purchaseItems={logic.purchaseItems}
        purchaseTotals={logic.purchaseTotals}
        selectedSupplier={logic.selectedSupplier}
        supplierSearch={logic.supplierSearch}
        setSupplierSearch={logic.setSupplierSearch}
        supplierResults={logic.supplierResults}
        searchingSuppliers={logic.searchingSuppliers}
        showSupplierDropdown={logic.showSupplierDropdown}
        setShowSupplierDropdown={logic.setShowSupplierDropdown}
        activeSupplierIndex={logic.activeSupplierIndex}
        setActiveSupplierIndex={logic.setActiveSupplierIndex}
        onSupplierSelect={logic.handleSupplierSelect}
        onClearSupplier={() => logic.setSelectedSupplier(null)}
        onSearchKeyDown={logic.handleSupplierSearchKeyDown}
        searchRef={logic.supplierSearchRef}
        getSupplierName={logic.getSupplierName}
        paymentMethods={paymentMethods}
        paymentMethod={logic.paymentMethod}
        setPaymentMethod={logic.setPaymentMethod}
        currencies={logic.currencies}
        paymentCurrency={logic.paymentCurrency}
        setPaymentCurrency={logic.setPaymentCurrency}
        purchaseNotes={logic.purchaseNotes}
        setPurchaseNotes={logic.setPurchaseNotes}
        getPaymentMethodLabel={logic.getPaymentMethodLabel}
        getCurrencyLabel={logic.getCurrencyLabel}
        onConfirm={onConfirmWizard}
        onLeavePending={onLeavePendingWizard}
        loading={logic.loading}
        error={error}
      />

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default Purchases
