import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Plus,
  Calendar,
  MoreVertical,
  Eye,
  Ban,
  Package,
  AlertCircle,
  ShoppingCart,
  Check,
  History,
  CheckCircle,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import useDashboardStore from '@/store/useDashboardStore'
import useAuthStore from '@/store/useAuthStore'
import { useAuth } from '@/contexts/AuthContext'
import supplierService from '@/services/supplierService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'
import purchaseService from '@/services/purchaseService'
import {
  fetchPurchasesBySupplierTerm,
  purchasePaymentsMvpService,
} from '@/services/purchasePaymentsMvpService'
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog'
import { formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import { calculatePurchaseSalePriceGs, calculateProfitMargin } from '@/domain/purchase/pricing/purchasePricingPolicy'
import { PurchaseWithFullDetails } from '@/types'
import { useBranch } from '@/contexts/BranchContext'

import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic'
import { PurchaseProductModal } from '@/features/purchases/components/PurchaseProductModal'

import { PurchaseCartTable } from '@/features/purchases/components/PurchaseCartTable'
import { PurchaseTotalsCard } from '@/features/purchases/components/PurchaseTotalsCard'
import { SupplierSelectionCard } from '@/features/purchases/components/SupplierSelectionCard'
import { PaymentConfigCard } from '@/features/purchases/components/PaymentConfigCard'
import { PurchaseHistoryTab } from '@/features/purchases/components/PurchaseHistoryTab'

import { PurchaseCancelModal } from '@/features/purchases/components/PurchaseCancelModal'
import { PurchaseConfirmationModal } from '@/features/purchases/components/PurchaseConfirmationModal'

/**
 * Purchases Page - Fluent Design System 2
 * Refactored with Tailwind CSS using Fluent 2 design tokens.
 * Modal optimized for low-height desktop screens (720p+).
 */
const Purchases = () => {
  const logic = usePurchasesLogic()
  const {
    activeProductIndex,
    activeSupplierIndex,
    activeTab,
    canWrite,
    cancelPreviewData,
    createdOrderData,
    currencies,
    editingItemId,
    effectiveProfitPct,
    effectiveSalePrice,
    endDate,
    error,
    filteredModalProducts,
    formatDate,
    getCurrencyLabel,
    getPaymentMethodLabel,
    getProductName,
    getStatusText,
    getSupplierName,
    handleCancelPurchase,
    handleConfirmAddProduct,
    handleConfirmCancellation,
    handleEditItem,
    handleFilter,
    handleInstantPaymentConfirm,
    handleLeavePurchasePending,
    handleModalProductSearchKeyDown,
    handleProductSelect,
    handleSavePurchase,
    handleSupplierSearchKeyDown,
    handleSupplierSelect,
    handleViewPurchase,
    isModalOpen,
    latestPurchaseResult,
    loading,
    modalPriceIncludesTax,
    modalProductSearch,
    modalProductSearchRef,
    modalProfitPct,
    modalQuantity,
    modalQuantityRef,
    modalSalePrice,
    modalSelectedProduct,
    modalTaxRateId,
    modalUnitPrice,
    openActionMenu,
    orderToCancel,
    paymentCurrency,
    paymentMethod,
    paymentMethods,
    pricingMode,
    productDropdownRef,
    purchaseItems,
    purchaseNotes,
    purchaseOrders,
    purchaseTotals,
    searchTerm,
    searchType,
    searchingProducts,
    searchingSuppliers,
    selectedSupplier,
    setActiveProductIndex,
    setActiveSupplierIndex,
    setActiveTab,
    setEndDate,
    setIsModalOpen,
    setModalPriceIncludesTax,
    setModalProductSearch,
    setModalProfitPct,
    setModalQuantity,
    setModalSalePrice,
    setModalTaxRateId,
    setModalUnitPrice,
    setOpenActionMenu,
    setPaymentCurrency,
    setPaymentMethod,
    setPricingMode,
    setPurchaseItems,
    setPurchaseNotes,
    setSearchTerm,
    setSearchType,
    setSelectedSupplier,
    setShowCancelPreview,
    setShowConfirmationModal,
    setShowInstantPayment,
    setShowProductDropdown,
    setShowSupplierDropdown,
    setStartDate,
    setSupplierSearch,
    showCancelPreview,
    showConfirmationModal,
    showInstantPayment,
    showProductDropdown,
    showSupplierDropdown,
    startDate,
    supplierResults,
    supplierSearch,
    supplierSearchRef,
    t,
    taxRates,
    toast
  } = logic

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header Section */}
      <header className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8'>
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>
              {t('purchases.management.title', 'Gestión de Compras')}
            </h1>
            <p className='text-text-secondary text-sm font-medium mt-1'>
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
                        {/* Left Column: Items & Summary */}
            <div className='lg:col-span-8 space-y-4 md:space-y-6'>
              <PurchaseCartTable {...logic} />
              <PurchaseTotalsCard {...logic} />
            </div>

            {/* Right Column: Configuration & Supplier - Fluent 2 */}
                        {/* Right Column: Configuration & Supplier - Fluent 2 */}
            <aside className='lg:col-span-4 space-y-4 md:space-y-6'>
              <SupplierSelectionCard {...logic} />
              <PaymentConfigCard {...logic} />
            </aside>
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

      {showInstantPayment && createdOrderData && (
        <InstantPaymentDialog
          open={showInstantPayment}
          onConfirmPayment={handleInstantPaymentConfirm}
          onLeavePending={handleLeavePurchasePending}
          orderId={createdOrderData.id}
          totalAmount={createdOrderData.totalAmount}
          currencyCode={createdOrderData.currencyCode}
          paymentMethodId={createdOrderData.paymentMethodId}
          paymentMethodLabel={createdOrderData.paymentMethodLabel}
          paymentMethods={paymentMethods}
        />
      )}

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default Purchases
