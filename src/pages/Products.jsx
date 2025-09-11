import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
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
  const products = useProductStore(state => state.products);
  const isLoading = useProductStore(state => state.isLoading);
  const error = useProductStore(state => state.error);
  const lastSearchTerm = useProductStore(state => state.lastSearchTerm);
  const isOffline = useProductStore(state => state.isOffline);
  const searchProducts = useProductStore(state => state.searchProducts);
  const deleteProduct = useProductStore(state => state.deleteProduct);
  const reactivateProduct = useProductStore(state => state.reactivateProduct);
  const fetchProducts = useProductStore(state => state.fetchProducts);
  const hydrateFromStorage = useProductStore(state => state.hydrateFromStorage);

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
    if (typeof hydrateFromStorage === 'function') {
      hydrateFromStorage();
    }
    
    // Si no hay productos después de hidratar, hacer una búsqueda inicial
    // para cargar productos con datos financieros
    if (products.length === 0 && !isLoading) {
      searchProducts('').catch(console.error);
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State adicional para manejo de errores de búsqueda
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // State para filtros locales
  const [localFilter, setLocalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [rawProducts, setRawProducts] = useState([]); // Productos originales sin filtrar
  const [showFilters, setShowFilters] = useState(false);

  // Detectar el tipo de búsqueda
  const detectSearchType = (term) => {
    if (!term) return 'none';
    const trimmed = term.trim();
    
    // Detectar si parece un código de barras: 8-15 dígitos
    const looksLikeBarcode = /^\d{8,15}$/.test(trimmed);
    if (looksLikeBarcode) return 'barcode';
    
    // Detectar si parece un ID: entre 8-30 caracteres alfanuméricos/guiones
    const looksLikeId = /^[a-zA-Z0-9_-]{8,30}$/.test(trimmed) && 
                       !/\s/.test(trimmed) && 
                       trimmed.length >= 8;
    
    return looksLikeId ? 'id' : 'name';
  };

  const searchType = detectSearchType(apiSearchTerm);

  // Función para aplicar filtros locales
  const applyLocalFilters = (productsToFilter) => {
    if (!productsToFilter || productsToFilter.length === 0) return [];

    let filtered = [...productsToFilter];

    // Filtro por texto local
    if (localFilter.trim()) {
      const filterTerm = localFilter.trim().toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(filterTerm) ||
        product.id?.toLowerCase().includes(filterTerm) ||
        product.barcode?.toLowerCase().includes(filterTerm) ||
        product.category?.name?.toLowerCase().includes(filterTerm) ||
        product.description?.toLowerCase().includes(filterTerm)
      );
    }

    // Filtro por estado (predeterminado: solo activos)
    if (statusFilter === 'active') {
      filtered = filtered.filter(product => product.state === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(product => product.state === false);
    }
    // Si es 'all', no filtramos por estado

    return filtered;
  };

  // Aplicar filtros cuando cambien los filtros o los productos originales
  const filteredProducts = applyLocalFilters(rawProducts);
  
  // Usar productos filtrados localmente si tenemos filtros activos, sino usar del store
  const displayProducts = showFilters ? filteredProducts : products;

  const handleApiSearch = async (e) => {
    e.preventDefault();
    const trimmed = apiSearchTerm?.trim();
    
    // Para IDs, permitir búsqueda inmediata (mínimo 8 caracteres)
    // Para nombres, requerir mínimo 3 caracteres
    const minLength = searchType === 'id' ? 8 : 3;
    
    if (!trimmed || trimmed.length < minLength) {
      return;
    }
    
    // Limpiar errores previos y mostrar estado de carga
    setSearchError(null);
    setIsSearching(true);
    
    try {
      const result = await searchProducts(trimmed);
      
      // Guardar productos originales para filtrado local
      const productsArray = Array.isArray(result?.data) ? result.data : 
                           Array.isArray(result) ? result : 
                           result ? [result] : [];
      
      setRawProducts(productsArray);
      setShowFilters(productsArray.length > 1); // Mostrar filtros solo si hay múltiples resultados
      
      // Limpiar filtros locales en nueva búsqueda
      setLocalFilter('');
      setStatusFilter('active'); // Predeterminado: solo activos
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchError({
        type: searchType,
        term: trimmed,
        message: error.message || 'Error en la búsqueda'
      });
      setRawProducts([]);
      setShowFilters(false);
    } finally {
      setIsSearching(false);
    }
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

  const handleReactivateProduct = async (product) => {
    if (window.confirm(`¿Reactivar producto ${product.name}?`)) {
      try {
        await reactivateProduct(product.id);
        // Refrescar búsqueda si hay término activo
        if (lastSearchTerm) {
          searchProducts(lastSearchTerm);
        }
      } catch (error) {
        console.error('Error reactivating product:', error);
      }
    }
  };

  const handleModalSuccess = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    if (lastSearchTerm) searchProducts(lastSearchTerm);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setLocalFilter('');
    setStatusFilter('active');
    setRawProducts([]);
    setShowFilters(false);
  };

  // Limpiar filtros cuando se limpia la búsqueda principal
  useEffect(() => {
    if (!apiSearchTerm.trim()) {
      clearFilters();
    }
  }, [apiSearchTerm]);

  return (
    <div className="space-y-6">
      {isOffline && <div className="bg-amber-100 text-amber-800 p-2 text-center text-sm rounded-md">{t('products.offline_banner')}</div>}
      
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        actions={<Button onClick={handleCreateProduct} variant="primary"><Plus className="w-4 h-4 mr-2" />{t('products.new')}</Button>}
      />

      {showMetrics && <MetricsPanel />}

      {/* Contenedor principal con posición relativa para los modales */}
      <div className="relative" id="products-content-container">
        <div className={styles.card('p-4')}>
          <form onSubmit={handleApiSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                placeholder={
                  searchType === 'barcode' 
                    ? t('products.search.placeholder_barcode') || 'Buscar por código de barras...'
                    : searchType === 'id' 
                      ? t('products.search.placeholder_id') || 'Buscar por ID de producto...'
                      : t('products.search.placeholder') || 'Buscar por nombre, ID o código de barras...'
                }
                value={apiSearchTerm}
                onChange={(e) => {
                  setApiSearchTerm(e.target.value);
                  // Limpiar errores cuando el usuario empiece a escribir
                  if (searchError) setSearchError(null);
                }}
                className={`flex-grow ${styles.input()}`}
              />
              {apiSearchTerm && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    searchType === 'id' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {searchType === 'id' ? 'ID' : 'Nombre'}
                  </span>
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              variant="secondary"
              disabled={
                !apiSearchTerm?.trim() || 
                apiSearchTerm.trim().length < (searchType === 'id' ? 8 : 3) ||
                isSearching
              }
            >
              {isSearching ? 'Buscando...' : t('products.search')}
            </Button>
          </form>
          
          {/* Indicador de ayuda */}
          {apiSearchTerm && apiSearchTerm.length > 0 && !searchError && (
            <div className="mt-2 text-xs text-muted-foreground">
              {searchType === 'id' 
                ? `💡 Detectado como ID de producto (${apiSearchTerm.length}/8+ caracteres)`
                : `💡 Buscando por nombre (${apiSearchTerm.length}/3+ caracteres)`
              }
            </div>
          )}
          
          {/* Error de búsqueda */}
          {searchError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-sm font-medium">
                  {searchError.type === 'id' ? '🆔 Error de búsqueda por ID' : '📝 Error de búsqueda por nombre'}
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {searchError.type === 'id' && searchError.message.includes('500') 
                  ? `El servidor tuvo un problema al buscar el ID "${searchError.term}". Esto puede deberse a un error temporal del servidor.`
                  : searchError.type === 'id' && searchError.message.includes('404')
                  ? `No se encontró ningún producto con el ID "${searchError.term}".`
                  : `Error al buscar "${searchError.term}": ${searchError.message}`
                }
              </p>
              {searchError.type === 'id' && searchError.message.includes('500') && (
                <p className="text-xs text-red-600 mt-2">
                  💡 Sugerencia: Intenta buscar por nombre o verifica que el ID sea correcto.
                </p>
              )}
              <button 
                onClick={() => setSearchError(null)}
                className="text-xs text-red-600 underline mt-2 hover:text-red-800"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Filtros locales - Solo se muestran cuando hay múltiples resultados */}
        {showFilters && (
          <div className={styles.card('p-4')}>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Filtrar resultados ({filteredProducts.length} de {rawProducts.length})</span>
              </div>
              {(localFilter || statusFilter !== 'active') && (
                <button
                  onClick={() => {
                    setLocalFilter('');
                    setStatusFilter('active');
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por texto */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Buscar en resultados
                </label>
                <Input
                  placeholder="Ej: Dunk, Air, Pro, código de barras..."
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                  className={`text-sm ${styles.input()}`}
                />
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Estado del producto
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`text-sm ${styles.input()} cursor-pointer`}
                >
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>

            {/* Indicadores de filtros activos */}
            {(localFilter || statusFilter !== 'active') && (
              <div className="flex flex-wrap gap-2 mt-3">
                {localFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Texto: "{localFilter}"
                    <button
                      onClick={() => setLocalFilter('')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'active' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Estado: {statusFilter === 'all' ? 'Todos' : 'Inactivos'}
                    <button
                      onClick={() => setStatusFilter('active')}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading && displayProducts.length === 0 ? (
          <DataState variant="loading" skeletonVariant="productGrid" />
        ) : error && displayProducts.length === 0 ? (
          <DataState variant="error" title={t('products.error.loading')} message={error} onRetry={() => fetchProducts()} />
        ) : displayProducts.length === 0 ? (
          <DataState variant="empty" title={t('products.no_results')} description={t('products.no_products_loaded')} onAction={handleCreateProduct} actionLabel={t('products.create_first')} />
        ) : (
          <ProductGrid 
            products={displayProducts}
            onView={handleViewProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteRequest}
            onReactivate={handleReactivateProduct}
          />
        )}

        {/* TODO: Add Pagination Component */}
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        {showProductModal && <ProductModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} product={editingProduct} onSuccess={handleModalSuccess} container={document.getElementById('products-content-container')} />}
        {showDetailModal && <ProductDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} product={selectedProduct} container={document.getElementById('products-content-container')} />}
        {showDeleteModal && <DeleteProductModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} product={selectedProduct} onConfirm={handleConfirmDelete} loading={isLoading} />}
      </Suspense>
    </div>
  );
};

export default ProductsPage;