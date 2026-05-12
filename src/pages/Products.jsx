// ===========================================================================
// Products Page - Refactored Container
// Patrón: Feature-Sliced Design + Tailwind + Fluent 2
// ===========================================================================

import React from 'react';
import {
  useProductsLogic,
  ProductsHeader,
  ProductsFilters,
  ProductsTable,
  ProductsPagination,
  ProductsEmptyState,
  ProductFormModal,
  ProductDetailsModal,
} from '@/features/products';
import ToastContainer from '@/components/ui/ToastContainer';

const Products = () => {
  const {
    // State
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    categories,
    searchTerm,
    selectedIds,
    isSearching,
    viewMode,
    showFilters,
    localFilters,
    isFormModalOpen,
    isDetailsModalOpen,
    selectedProduct,
    toast,
    searchInputRef,
    // Setters
    setShowFilters,
    setLocalFilters,
    // Handlers
    handleSearch,
    handleSearchKeyDown,
    handlePreviousPage,
    handleNextPage,
    handleApplyFilters,
    handleClearFilters,
    handleRefresh,
    toggleSelectAll,
    toggleSelectProduct,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleEditFromDetails,
    clearError,
  } = useProductsLogic();

  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalProducts);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
      <ProductsHeader
        onRefresh={handleRefresh}
        loading={loading}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <ProductsFilters
        isSearching={isSearching}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onSearchKeyDown={handleSearchKeyDown}
        searchInputRef={searchInputRef}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        localFilters={localFilters}
        setLocalFilters={setLocalFilters}
        categories={categories}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="bg-white border border-border-subtle rounded-xl shadow-fluent-2 overflow-hidden">
        <ProductsTable
          products={products}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectProduct={toggleSelectProduct}
          onOpenDetailsModal={handleOpenDetailsModal}
          onOpenEditModal={handleOpenEditModal}
        >
          <ProductsEmptyState
            loading={loading}
            error={error}
            productsLength={products.length}
            viewMode={viewMode}
            searchTerm={searchTerm}
            onRetry={() => {
              clearError();
              handleRefresh();
            }}
            onOpenCreateModal={handleOpenCreateModal}
          />
        </ProductsTable>

        <ProductsPagination
          startIndex={startIndex}
          endIndex={endIndex}
          totalProducts={totalProducts}
          currentPage={currentPage}
          totalPages={totalPages}
          loading={loading}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
        />
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        product={selectedProduct}
      />

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default Products;
