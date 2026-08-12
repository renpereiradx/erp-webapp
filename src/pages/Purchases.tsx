import { useState, useEffect } from 'react'
import { AlertCircle, History, Plus, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
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

/**
 * Purchases Page - Fluent Design System 2
 * Refactored with Tailwind CSS using Fluent 2 design tokens.
 * Modal optimized for low-height desktop screens (720p+).
 */
const Purchases = () => {
  const [showCheckoutWizard, setShowCheckoutWizard] = useState(false);
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
    t,
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

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header Section */}
      <header className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8'>
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className='text-headline-lg text-on-surface leading-none mb-1'>
              {t('purchases.management.title', 'Gestión de Compras')}
            </h1>
            <p className='text-body-md text-on-surface-variant'>
              {t('purchases.management.subtitle', 'Abastecimiento y órdenes de compra a proveedores')}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit'>
          {[
            { id: 'nueva-compra', label: 'Nueva Orden', icon: <Plus size={16} /> },
            { id: 'historial', label: 'Historial', icon: <History size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-surface-dark text-primary shadow-fluent-2'
                  : 'text-text-secondary hover:text-text-main'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className='w-full'>
        {error && (
          <div className='mb-6 p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3'>
            <AlertCircle className="text-error" size={18} />
            <p className='text-xs font-bold text-error uppercase tracking-wider'>{error}</p>
          </div>
        )}

        {activeTab === 'nueva-compra' && (
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6'>
            <div className='lg:col-span-12 space-y-4 md:space-y-6'>
              <PurchaseCartTable {...logic} />
              <PurchaseTotalsCard {...logic} onCheckout={() => setShowCheckoutWizard(true)} />
            </div>
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
      <PurchaseConfirmationModal {...logic} />

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
