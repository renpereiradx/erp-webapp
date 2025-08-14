/**
 * Página Products - Sistema de gestión completo
 * Rediseñada para trabajar con la Business Management API
 * Incluye CRUD completo con modales y gestión de descripciones, precios y stock
 */

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useTheme } from 'next-themes';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingCart,
  Layers,
  Tag,
  Zap,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';
import useAuthStore from '@/store/useAuthStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { startFPS, getPerfSnapshot } from '@/utils/perfMetrics';
const ProductModal = React.lazy(() => import('@/components/ProductModal'));
const ProductDetailModal = React.lazy(() => import('@/components/ProductDetailModal'));
const DeleteProductModal = React.lazy(() => import('@/components/DeleteProductModal'));
// utils now used inside ProductCard where needed
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import ProductGrid from '@/features/products/components/ProductGrid';
import ProductSkeletonGrid from '@/features/products/components/ProductSkeletonGrid';
import { telemetry } from '@/utils/telemetry';
import PageHeader from '@/components/ui/PageHeader';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const Products = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel, body: themeBody } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const { isAuthenticated, login } = useAuthStore();
  const { t } = useI18n();
  // Usar selectores específicos para evitar problemas de snapshot
  const products = useProductStore((s) => s.products);
  const isLoading = useProductStore((s) => s.loading);
  const storeError = useProductStore((s) => s.error);
  const totalProducts = useProductStore((s) => s.totalProducts);
  const currentPage = useProductStore((s) => s.currentPage);
  const totalPages = useProductStore((s) => s.totalPages);
  const pageSize = useProductStore((s) => s.pageSize);
  const categories = useProductStore((s) => s.categories);
  const lastSearchTerm = useProductStore((s) => s.lastSearchTerm);
  const selectedIds = useProductStore((s) => s.selectedIds);
  const isOffline = useProductStore((s) => s.isOffline);
  const errorCounters = useProductStore((s) => s.errorCounters);

  // Acciones separadas para evitar problemas de snapshot
  const fetchCategories = useProductStore((s) => s.fetchCategories);
  const searchProducts = useProductStore((s) => s.searchProducts);
  const loadPage = useProductStore((s) => s.loadPage);
  const changePageSize = useProductStore((s) => s.changePageSize);
  const clearProducts = useProductStore((s) => s.clearProducts);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const clearError = useProductStore((s) => s.clearError);
  const toggleSelect = useProductStore((s) => s.toggleSelect);
  const clearSelection = useProductStore((s) => s.clearSelection);
  const selectAllCurrent = useProductStore((s) => s.selectAllCurrent);
  const bulkActivate = useProductStore((s) => s.bulkActivate);
  const bulkDeactivate = useProductStore((s) => s.bulkDeactivate);
  const optimisticUpdateProduct = useProductStore((s) => s.optimisticUpdateProduct);
  const hydrateFromStorage = useProductStore((s) => s.hydrateFromStorage);

  // Modal & selection states (faltaban, causaban ReferenceError)
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Local/UI state for search, filters and small config
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const minChars = 3;
  const isNeoBrutalism = false; // feature switch for special visual styles
  const isMaterial = theme === 'material';

  // Utility handlers
  const handlePageSizeChange = (value) => changePageSize(Number(value));
  const handlePageChange = (page) => loadPage(page);

  const handleApiSearch = () => {
    if (!apiSearchTerm || apiSearchTerm.length < minChars) return;
    // Cancel previous controller
    try {
      if (apiSearchAbortRef.current) {
        apiSearchAbortRef.current.abort();
      }
      if (typeof AbortController !== 'undefined') {
        apiSearchAbortRef.current = new AbortController();
      }
      const signal = apiSearchAbortRef.current?.signal;
      // call store search with abort signal
      searchProducts(apiSearchTerm, { signal }).catch((r) => {
        // ignore AbortError
        if (r?.name === 'AbortError') return;
        return r;
      });
    } catch (e) {
      // fallback simple call
      searchProducts(apiSearchTerm);
    }
  };
  const handleApiSearchKeyPress = (e) => {
    if (e.key === 'Enter') handleApiSearch();
    if (e.key === '/') {
      const el = document.getElementById('api-search-input');
      if (el) el.focus();
    }
  };
  const handleClearSearch = () => {
    setApiSearchTerm('');
    clearProducts();
  };

  // Hydrate offline snapshot from localStorage on mount
  useEffect(() => {
    try {
      hydrateFromStorage?.();
    } catch (e) {
      // ignore
    }
  }, [hydrateFromStorage]);

  const getCategoryName = (id) => {
    const c = categories.find((c) => c.id === id);
    return c ? c.name : '';
  };

  // Aplicar filtros locales sobre products
  const filteredProducts = products.filter((p) => {
    if (localSearchTerm && !String(p.name || '').toLowerCase().includes(localSearchTerm.toLowerCase())) return false;
    if (selectedCategory !== 'all' && String(p.category_id) !== String(selectedCategory)) return false;
    if (selectedStock === 'active' && !p.is_active) return false;
    if (selectedStock === 'inactive' && p.is_active) return false;
    return true;
  });

  // Accesibilidad: región aria-live y focus restore
  const [liveMessage, setLiveMessage] = useState('');
  const lastFocusRef = useRef(null);
  const prevModalsRef = useRef({ product: false, detail: false, delete: false });
  const apiSearchAbortRef = useRef(null);

  // Inline editing (mínimo)
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineFlag] = useFeatureFlag('newInlineEdit', true);
  const [lastInlineSaved, setLastInlineSaved] = useState(null);

  const announce = (msg) => setLiveMessage(msg);

  // Observa cambios de resultados para anunciar
  useEffect(() => {
    if (!isLoading) {
      if (lastSearchTerm) {
        announce(`${totalProducts} productos encontrados para "${lastSearchTerm}"`);
      } else {
        announce(`${totalProducts} productos en listado`);
      }
    }
  }, [isLoading, totalProducts, lastSearchTerm]);

  // Restaurar foco al cerrar modales
  useEffect(() => {
    const prev = prevModalsRef.current;
    if (prev.product && !showProductModal && lastFocusRef.current) lastFocusRef.current.focus();
    if (prev.detail && !showDetailModal && lastFocusRef.current) lastFocusRef.current.focus();
    if (prev.delete && !showDeleteModal && lastFocusRef.current) lastFocusRef.current.focus();
    prevModalsRef.current = { product: showProductModal, detail: showDetailModal, delete: showDeleteModal };
  }, [showProductModal, showDetailModal, showDeleteModal]);

  // Wrappers para acciones bulk con anuncio
  const handleBulkActivate = async () => {
    const count = selectedIds.length;
    if (!count) return;
    await bulkActivate();
    announce(`${count} productos activados`);
  };
  const handleBulkDeactivate = async () => {
    const count = selectedIds.length;
    if (!count) return;
    await bulkDeactivate();
    announce(`${count} productos desactivados`);
  };

  const handleInlineSave = async (id, patchOrValue) => {
    const patch = typeof patchOrValue === 'object' && patchOrValue !== null ? patchOrValue : { name: patchOrValue };
    const ok = await optimisticUpdateProduct(id, patch);
    if (ok) {
      announce(`Producto ${id} actualizado`);
      setLastInlineSaved({ id, ts: Date.now() });
      // flash highlight card
      requestAnimationFrame(() => {
        const node = document.querySelector(`[aria-label="Producto ${products.find(p=>p.id===id)?.name || id}"] .group`);
        if (node) {
          node.classList.add('ring-2','ring-green-400');
          setTimeout(()=> node.classList.remove('ring-2','ring-green-400'), 1200);
        }
      });
    }
    setInlineEditingId(null);
  };

  // Modificar handlers para guardar elemento con foco previo
  const handleCreateProduct = () => {
    lastFocusRef.current = document.activeElement;
    setEditingProduct(null);
    setShowProductModal(true);
  };
  const handleEditProduct = (product) => {
    lastFocusRef.current = document.activeElement;
    setEditingProduct(product);
    setShowProductModal(true);
  };
  const handleViewProduct = (product) => {
    lastFocusRef.current = document.activeElement;
    setSelectedProduct(product);
    setShowDetailModal(true);
  };
  const handleDeleteProduct = (product) => {
    lastFocusRef.current = document.activeElement;
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Función para auto-login de desarrollo - removida para producción
  // const handleDevLogin = async () => {
  //   try {
  //     setIsLoading(true);
  //     await enableDevAuth();
  //     success('Auto-login exitoso! Recargando categorías...');
  //     await fetchCategories();
  //   } catch (error) {
  //     showError('Error en auto-login: ' + error.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Función para auto-login de desarrollo
  const handleDevLogin = async () => {
    try {
      await login({ username: 'myemail', password: 'mypassword' });
      success('Auto-login exitoso! Recargando categorías...');
      await fetchCategories();
    } catch (err) {
      errorFrom(err, { fallback: 'Error en auto-login' });
    }
  };

  const handleConfirmDelete = async (product) => {
    try {
      await deleteProduct(product.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      success(`Producto "${product.name}" eliminado exitosamente`);
  telemetry.record('products.delete.success', { id: product.id });
    } catch (err) {
  telemetry.record('products.delete.error', { id: product.id, message: err?.message });
      errorFrom(err, { fallback: 'Error al eliminar producto' });
    }
  };

  const handleModalSuccess = () => {
    // Refrescar la búsqueda actual si existe
    if (lastSearchTerm) {
      searchProducts(lastSearchTerm);
    }
    success('Operación completada exitosamente');
    setShowProductModal(false);
    setEditingProduct(null);
  telemetry.record('products.modal.success');
  };

  // Filtrado local gestionado por el hook useProductFilters

  // Emitir toast cuando el store exponga un error (evitar side-effects en render)
  useEffect(() => {
    if (storeError && !storeError.includes('No se encontraron productos')) {
      errorFrom(new Error(storeError));
      telemetry.record('products.error.store', { message: storeError });
      announce(`Error: ${storeError}`);
    }
  }, [storeError, errorFrom]);

  // Iniciar muestreo de FPS y registro de snapshots
  useEffect(() => {
    startFPS();
    const id = setInterval(() => {
      const snap = getPerfSnapshot();
      telemetry.record('products.perf.snapshot', snap);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <div className={`text-muted-foreground ${themeHeader('h2')}`}>
                {isNeoBrutalism ? 'CARGANDO PRODUCTOS...' : 'Cargando productos...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (storeError && !storeError.includes('No se encontraron productos')) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div 
              className={card('text-center p-6')}
            >
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <div className={`text-destructive mb-4 ${themeHeader('h2')}`}>
                {isNeoBrutalism ? 'ERROR AL CARGAR' : 'Error al cargar'}
              </div>
              <p className="text-muted-foreground mb-4">{storeError}</p>
              {!isAuthenticated && (
                <div className="mb-4">
                  <Button
                    onClick={handleDevLogin}
                    variant="secondary"
                    className="mr-3"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {isNeoBrutalism ? 'LOGIN RÁPIDO' : 'Login Rápido'}
                  </Button>
                </div>
              )}
              <Button
                onClick={() => {
                  clearError();
                  if (lastSearchTerm) {
                    searchProducts(lastSearchTerm);
                  }
                }}
                variant="primary"
              >
                {isNeoBrutalism ? 'REINTENTAR' : 'Reintentar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featureFlags = { productsNewUI: true };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">{liveMessage}</div>
      <div className="max-w-7xl mx-auto space-y-8">
        {isOffline && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded flex items-center gap-3" role="status" aria-live="polite">
            <AlertTriangle className="w-4 h-4" />
            <span>Modo offline: mostrando datos locales. Reintenta cuando vuelva la conexión.</span>
            <Button size="sm" variant="outline" onClick={() => {
              if (lastSearchTerm) searchProducts(lastSearchTerm, { force: true }); else loadPage(1);
            }}>Reintentar</Button>
          </div>
        )}
        
        {/* Header */}
        <PageHeader
          title={isNeoBrutalism ? 'GESTIÓN DE PRODUCTOS' : isMaterial ? t('products.title') : t('products.title')}
          subtitle={isNeoBrutalism ? 'ADMINISTRA TU INVENTARIO CON LA BUSINESS MANAGEMENT API' : isMaterial ? 'Administra tu inventario con Material Design' : 'Manage your inventory with the Business Management API'}
          actions={(
            <>
              <Button variant="primary" onClick={handleCreateProduct}>
                <Plus className="w-5 h-5 mr-2" />
                {isNeoBrutalism ? 'NUEVO PRODUCTO' : t('products.new')}
              </Button>
              <Button variant="secondary">
                <BarChart3 className="w-5 h-5 mr-2" />
                {isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
              </Button>
            </>
          )}
          compact
          breadcrumb={isMaterial ? 'Inventario · Productos' : undefined}
        />

        {/* Filtros y Búsqueda */}
        <section 
          className={card('p-6')}
        >
          {/* Búsqueda en API */}
          <div className="mb-6">
            <div className={`${themeHeader('h3')} mb-3`}>
              {isNeoBrutalism ? 'BUSCAR EN BASE DE DATOS' : t('products.search.db')}
            </div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="api-search-input"
                  type="text"
                  placeholder={isNeoBrutalism ? "BUSCAR POR NOMBRE O ID..." : t('products.search.placeholder')}
                  value={apiSearchTerm}
                  onChange={(e) => setApiSearchTerm(e.target.value)}
                  onKeyPress={handleApiSearchKeyPress}
                  className={`${themeInput()} w-full pl-12 p-3 bg-background`}
                  style={isNeoBrutalism ? {
                    border: '3px solid var(--border)',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  } : {}}
                  aria-label={isNeoBrutalism ? 'Buscar productos por nombre o ID' : 'Buscar productos por nombre o ID'}
                />
              </div>
              <Button
                onClick={handleApiSearch}
                variant="primary"
                size="lg"
              >
                {isNeoBrutalism ? 'BUSCAR' : t('products.search')}
              </Button>
              <Button
                onClick={handleClearSearch}
                variant="secondary"
                size="lg"
              >
                {isNeoBrutalism ? 'LIMPIAR' : t('products.clear')}
              </Button>
            </div>

            {/* Ayuda para búsqueda */}
            <div className="text-xs text-muted-foreground mb-4 flex flex-col gap-1">
              <span>
                {isNeoBrutalism ?
                  t('products.search.help1') :
                  t('products.search.help1')}
              </span>
              <span>
                {t('products.search.help2').replace('{minChars}', String(minChars))}
              </span>
            </div>
            
            {/* Control de tamaño de página */}
            <div className="flex items-center gap-3">
              <label 
                htmlFor="pageSize"
                className={`text-sm text-muted-foreground ${themeLabel()}`}
              >
                {t('products.page_size_label')}
               </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className={`${themeInput()} px-3 py-2 bg-background`}
                style={isNeoBrutalism ? {
                  border: '3px solid var(--border)',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                } : {}}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Filtros locales - solo si hay productos cargados */}
          {products.length > 0 && (
            <div className="border-t pt-6">
              <div className={`${themeHeader('h3')} mb-3 flex items-center justify-between`}> 
                <span>{isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : 'Filtrar Resultados Actuales'}</span>
                {featureFlags.productsNewUI && (
                  <div className="flex gap-2 items-center text-xs">
                    {selectedIds.length > 0 ? (
                      <>
                        <span className="text-muted-foreground">{selectedIds.length} seleccionados</span>
                        <Button size="sm" variant="secondary" onClick={bulkActivate}>{isNeoBrutalism ? 'ACTIVAR' : 'Activar'}</Button>
                        <Button size="sm" variant="secondary" onClick={bulkDeactivate}>{isNeoBrutalism ? 'DESACTIVAR' : 'Desactivar'}</Button>
                        <Button size="sm" variant="ghost" onClick={clearSelection}>{isNeoBrutalism ? 'LIMPIAR' : 'Limpiar'}</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={selectAllCurrent}>{isNeoBrutalism ? 'SELECCIONAR TODO' : 'Seleccionar todo'}</Button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={isNeoBrutalism ? "FILTRAR POR NOMBRE..." : "Filtrar por nombre..."}
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setLocalSearchTerm('');
                    }}
                    className={`${themeInput()} w-full pl-12 p-3 bg-background`}
                    style={isNeoBrutalism ? {
                      border: '3px solid var(--border)',
                      borderRadius: '0px',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    } : {}}
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`${themeInput()} p-3`}
                  style={isNeoBrutalism ? {
                    border: '3px solid var(--border)',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  } : {
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <option value="all" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                    {isNeoBrutalism ? 'TODAS LAS CATEGORÍAS' : 'Todas las categorías'}
                  </option>
                  {categories.map(category => (
                    <option 
                      key={category.id} 
                      value={category.id}
                      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                    >
                      {isNeoBrutalism ? category.name.toUpperCase() : category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className={`${themeInput()} p-3`}
                  style={isNeoBrutalism ? {
                    border: '3px solid var(--border)',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  } : {
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <option value="all" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                    {isNeoBrutalism ? 'TODOS LOS ESTADOS' : 'Todos los estados'}
                  </option>
                  <option value="active" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                    {isNeoBrutalism ? 'ACTIVOS' : 'Activos'}
                  </option>
                  <option value="inactive" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                    {isNeoBrutalism ? 'INACTIVOS' : 'Inactivos'}
                  </option>
                </select>

                <div className="text-center">
                  <div className={`text-foreground text-2xl font-bold`}>
                    {filteredProducts.length}
                  </div>
                  <div className={`text-muted-foreground text-sm ${themeLabel()}`}>
                    {isNeoBrutalism ? 'PRODUCTOS' : 'Productos'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Lista de Productos */}
        <section>
          {/* Estado de carga */}
          {isLoading && (
            <ProductSkeletonGrid />
          )}

          {/* Mensaje cuando no hay productos cargados */}
          {!isLoading && products.length === 0 && !lastSearchTerm && (
            <div 
              className={card('text-center py-20')}
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div className={`text-muted-foreground mb-4 ${themeHeader('h2')}`}>
                {t('products.no_products_loaded')}
               </div>
              <div className={`text-muted-foreground mb-6 ${themeBody()}`}>
                {t('products.search.help1')}
              </div>
              <Button
                onClick={handleCreateProduct}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('products.create_first')}
              </Button>
            </div>
          )}

          {/* Mensaje cuando la búsqueda no devuelve resultados */}
          {!isLoading && products.length === 0 && lastSearchTerm && (
            <div 
              className={card('text-center py-20')}
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div className={`text-muted-foreground mb-4 ${themeHeader('h2')}`}>
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
              <div className={`text-muted-foreground mb-6 ${themeBody()}`}>
                {isNeoBrutalism ? 
                  `NO HAY PRODUCTOS QUE COINCIDAN CON "${lastSearchTerm.toUpperCase()}"` : 
                  `No hay productos que coincidan con "${lastSearchTerm}"`
                }
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleClearSearch}
                  variant="secondary"
                >
                  {isNeoBrutalism ? 'LIMPIAR BÚSQUEDA' : 'Limpiar búsqueda'}
                </Button>
                <Button
                  onClick={handleCreateProduct}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isNeoBrutalism ? 'CREAR PRODUCTO' : 'Crear producto'}
                </Button>
              </div>
            </div>
          )}

          {/* Mensaje cuando hay productos pero el filtro local no encuentra nada */}
          {!isLoading && products.length > 0 && filteredProducts.length === 0 && localSearchTerm && (
            <div 
              className={card('text-center py-20')}
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className={`text-muted-foreground mb-4 ${themeHeader('h2')}`}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
              <div className={`text-muted-foreground ${themeBody()}`}>
                {isNeoBrutalism ? 
                  `NO HAY PRODUCTOS QUE COINCIDAN CON "${localSearchTerm.toUpperCase()}"` : 
                  `No hay productos que coincidan con "${localSearchTerm}"`
                }
              </div>
            </div>
          )}

          {/* Grid de productos */}
          {!isLoading && filteredProducts.length > 0 && (
            <ProductGrid
              products={filteredProducts}
              isNeoBrutalism={isNeoBrutalism}
              getCategoryName={getCategoryName}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onToggleSelect={toggleSelect}
              selectedIds={selectedIds}
              inlineEditingId={inlineEditingId}
              onStartInlineEdit={(id) => inlineFlag && setInlineEditingId(id)}
              onCancelInlineEdit={() => setInlineEditingId(null)}
              onInlineSave={handleInlineSave}
            />
          )}
        </section>

        {/* Footer con paginación */}
        {!isLoading && products.length > 0 && (
          <footer className="text-center py-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <div className={`text-muted-foreground ${themeLabel()}`}>
                {isNeoBrutalism ? 
                  `MOSTRANDO ${filteredProducts.length} DE ${products.length} PRODUCTOS EN ESTA PÁGINA` :
                  `Mostrando ${filteredProducts.length} de ${products.length} productos en esta página`
                }
              </div>
              {lastSearchTerm && (
                <div className="flex items-center gap-2">
                  <div 
                    className={`text-muted-foreground ${themeLabel()}`}
                  >
                    {isNeoBrutalism ? 
                      `BUSQUEDA: "${lastSearchTerm.toUpperCase()}"` :
                      `Búsqueda: "${lastSearchTerm}"`
                    }
                  </div>
                  <div className={`text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 ${themeLabel()}`}>
                    {/^[a-zA-Z0-9_-]{10,}$/.test(lastSearchTerm) 
                      ? (isNeoBrutalism ? 'POR ID' : 'por ID')
                      : (isNeoBrutalism ? 'POR NOMBRE' : 'por nombre')
                    }
                  </div>
                </div>
              )}
              {totalProducts > 0 && (
                <div 
                  className={`text-muted-foreground ${themeLabel()}`}
                >
                  {isNeoBrutalism ? 
                    `TOTAL ENCONTRADOS: ${totalProducts}` :
                    `Total encontrados: ${totalProducts}`
                  }
                </div>
              )}
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1 || isLoading}
                  variant="secondary"
                  size="sm"
                >
                  {isNeoBrutalism ? 'PRIMERA' : 'Primera'}
                </Button>
                
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  variant="secondary"
                  size="sm"
                >
                  {isNeoBrutalism ? 'ANTERIOR' : 'Anterior'}
                </Button>
                
                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isLoading}
                      variant={pageNumber === currentPage ? 'primary' : 'secondary'}
                      size="sm"
                      className={pageNumber === currentPage ? 'font-bold' : ''}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  variant="secondary"
                  size="sm"
                >
                  {isNeoBrutalism ? 'SIGUIENTE' : 'Siguiente'}
                </Button>

                <Button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                  variant="secondary"
                  size="sm"
                >
                  {isNeoBrutalism ? 'ÚLTIMA' : 'Última'}
                </Button>

                {/* Información de página actual */}
                <div className={`text-muted-foreground ml-4 ${themeLabel()}`}>
                  {isNeoBrutalism ? 
                    `PÁGINA ${currentPage} DE ${totalPages}` :
                    `Página ${currentPage} de ${totalPages}`
                  }
                </div>
              </div>
            )}
          </footer>
        )}

      </div>

      {/* Modales (lazy) */}
      <Suspense fallback={null}>
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={editingProduct}
          onSuccess={handleModalSuccess}
        />

        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProduct}
          onRefresh={() => {
            if (lastSearchTerm) {
              searchProducts(lastSearchTerm);
            }
          }}
        />

        <DeleteProductModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          product={selectedProduct}
          onConfirm={handleConfirmDelete}
          loading={isLoading}
        />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast} 
      />
    </div>
  );
};

export default Products;
