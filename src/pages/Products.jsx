import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import DataState from '@/components/ui/DataState';
import PageHeader from '@/components/ui/PageHeader';
import MetricsPanel from '@/components/MetricsPanel';
import ProductGrid from '@/features/products/components/ProductGrid';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Lazy load modals
const ProductModal = React.lazy(() => import('@/components/ProductModal'));
const ProductDetailModal = React.lazy(() => import('@/components/ProductDetailModal'));
const DeleteProductModal = React.lazy(() => import('@/components/DeleteProductModal'));

const ProductsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  
  // State from Zustand store
  const {
    products, isLoading, error, lastErrorCode, lastErrorHint, totalProducts, currentPage, totalPages, pageSize,
    lastSearchTerm, selectedIds, isOffline, 
    searchProducts, loadPage, changePageSize, clearProducts, deleteProduct, toggleSelect, clearSelection, 
    selectAllCurrent, bulkActivate, bulkDeactivate, optimisticUpdateProduct, hydrateFromStorage
  } = useProductStore(state => ({ ...state })); // Subscribe to all changes

  // Local UI state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [showMetrics] = useFeatureFlag('productsMetricsPanel', false);
  const [inlineFlag] = useFeatureFlag('newInlineEdit', true);
  const [inlineEditingId, setInlineEditingId] = useState(null);

  useEffect(() => {
    hydrateFromStorage?.();
  }, [hydrateFromStorage]);

  const handleApiSearch = (e) => {
    e.preventDefault();
    if (!apiSearchTerm || apiSearchTerm.length < 3) return;
    searchProducts(apiSearchTerm);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleDeleteRequest = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    await deleteProduct(selectedProduct.id);
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleModalSuccess = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    if (lastSearchTerm) searchProducts(lastSearchTerm);
  };

  return (
    <div className="space-y-6">
      {isOffline && <div className="bg-amber-100 text-amber-800 p-2 text-center text-sm rounded-md">{t('products.offline_banner')}</div>}
      
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        actions={<Button onClick={handleCreateProduct} className={styles.button('primary')}><Plus className="w-4 h-4 mr-2" />{t('products.new')}</Button>}
      />

      {showMetrics && <MetricsPanel />}

      <div className={styles.card('p-4')}>
        <form onSubmit={handleApiSearch} className="flex gap-2">
          <Input 
            placeholder={t('products.search.placeholder')}
            value={apiSearchTerm}
            onChange={(e) => setApiSearchTerm(e.target.value)}
            className={`flex-grow ${styles.input()}`}
          />
          <Button type="submit" className={styles.button('secondary')}>{t('products.search')}</Button>
        </form>
      </div>

      {isLoading && products.length === 0 ? (
        <DataState variant="loading" skeletonVariant="productGrid" />
      ) : error && products.length === 0 ? (
        <DataState variant="error" title={t('products.error.loading')} message={error} onRetry={fetchInitialData} />
      ) : products.length === 0 ? (
        <DataState variant="empty" title={t('products.no_results')} description={t('products.no_products_loaded')} onAction={handleCreateProduct} actionLabel={t('products.create_first')} />
      ) : (
        <ProductGrid 
          products={products}
          onView={handleViewProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* TODO: Add Pagination Component */}

      <Suspense fallback={<div>Loading...</div>}>
        {showProductModal && <ProductModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} product={editingProduct} onSuccess={handleModalSuccess} />}
        {showDetailModal && <ProductDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} product={selectedProduct} />}
        {showDeleteModal && <DeleteProductModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} product={selectedProduct} onConfirm={handleConfirmDelete} loading={isLoading} />}
      </Suspense>
    </div>
  );
};

export default ProductsPage;