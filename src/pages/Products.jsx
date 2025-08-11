/**
 * Página Products - Sistema de gestión completo
 * Rediseñada para trabajar con la Business Management API
 * Incluye CRUD completo con modales y gestión de descripciones, precios y stock
 */

import React, { useState, useEffect, Suspense } from 'react';
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
import { shallow } from 'zustand/shallow';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';
import useAuthStore from '@/store/useAuthStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
const ProductModal = React.lazy(() => import('@/components/ProductModal'));
const ProductDetailModal = React.lazy(() => import('@/components/ProductDetailModal'));
const DeleteProductModal = React.lazy(() => import('@/components/DeleteProductModal'));
// utils now used inside ProductCard where needed
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import ProductGrid from '@/features/products/components/ProductGrid';
import ProductSkeletonGrid from '@/features/products/components/ProductSkeletonGrid';
import { telemetry } from '@/utils/telemetry';

const Products = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel, body: themeBody } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const { isAuthenticated, login } = useAuthStore();
  const {
    products,
    isLoading,
    storeError,
    totalProducts,
    currentPage,
    totalPages,
    pageSize,
    categories,
    lastSearchTerm,
    fetchCategories,
    searchProducts,
    loadPage,
    changePageSize,
    clearProducts,
    deleteProduct,
    clearError,
  } = useProductStore((s) => ({
    products: s.products,
    isLoading: s.loading,
    storeError: s.error,
    totalProducts: s.totalProducts,
    currentPage: s.currentPage,
    totalPages: s.totalPages,
    pageSize: s.pageSize,
    categories: s.categories,
    lastSearchTerm: s.lastSearchTerm,
    fetchCategories: s.fetchCategories,
    searchProducts: s.searchProducts,
    loadPage: s.loadPage,
    changePageSize: s.changePageSize,
    clearProducts: s.clearProducts,
    deleteProduct: s.deleteProduct,
    clearError: s.clearError,
  }), shallow);

  // Estados y handlers de búsqueda/filtros centralizados en hook feature
  const {
    apiSearchTerm,
    setApiSearchTerm,
    localSearchTerm,
    setLocalSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStock,
    setSelectedStock,
    filteredProducts,
    handleApiSearch,
    handleApiSearchKeyPress,
    handleClearSearch,
    minChars,
  } = useProductFilters({
    products,
    categories,
    onApiSearch: searchProducts,
  onClear: clearProducts,
  persistKey: 'products.filters.v1',
  autoSearch: true,
  minChars: 4,
  });

  // Atajos de teclado: '/' enfoca la búsqueda, 'Escape' limpia búsqueda local
  useEffect(() => {
    const handler = (e) => {
      // Evitar interferir si se escribe en un input/textarea
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (typing) return;
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('api-search-input');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  // const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper de tarjeta reemplazado por card() de useThemeStyles

  // Tipografías ahora se manejan vía useThemeStyles (themeHeader/themeBody/themeLabel)

  // getBadgeStyles reemplazado por ProductCard

  // Helper de botones reemplazado por button() de useThemeStyles

  // useEffect para cargar categorías cuando hay autenticación
  useEffect(() => {
    const loadCategoriesIfNeeded = async () => {
      if (categories.length === 0) {
        try {
          await fetchCategories();
  } catch {
          // Silent fallback handled by cache system
        }
      }
    };

    loadCategoriesIfNeeded();
  }, [categories.length, fetchCategories]);

  // console.log('🎯 Products: Rendering with', { 
  //   productsCount: products?.length || 0, 
  //   isLoading, 
  //   hasError: !!storeError 
  // });

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category ? category.name : `Categoría ${categoryId}`;
  };

  // Búsqueda en API y enter key ahora gestionados por el hook

  // Funciones para paginación
  const handlePageChange = async (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      await loadPage(page);
    }
  };

  const handlePageSizeChange = async (newPageSize) => {
    await changePageSize(parseInt(newPageSize));
  };

  // Limpieza de búsqueda gestionada por el hook useProductFilters

  // Funciones de utilidad

  // getStockIcon reemplazado por ProductCard

  // Funciones de eventos
  // Efectos hover manuales ya no necesarios; themeButton aplica los estilos correspondientes

  // Funciones para modales
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

  const handleDeleteProduct = (product) => {
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
    // Mostrar un toast de error estandarizado (además del fallback UI)
    errorFrom(new Error(storeError));
    telemetry.record('products.error.store', { message: storeError });
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
              
              {/* Debug: Mostrar botón de login si no está autenticado */}
              {!isAuthenticated && (
                <div className="mb-4">
                  <button
                    onClick={handleDevLogin}
                    className={`${themeButton('secondary')} mr-3`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {isNeoBrutalism ? 'LOGIN RÁPIDO' : 'Login Rápido'}
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  clearError();
                  // Usar la última búsqueda si existe
                  if (lastSearchTerm) {
                    searchProducts(lastSearchTerm);
                  }
                }}
                className={themeButton('primary')}
              >
                {isNeoBrutalism ? 'REINTENTAR' : 'Reintentar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center py-8">
          <h1 
            className={`${themeHeader('h1')} text-primary mb-4`}
          >
            {isNeoBrutalism ? 'GESTIÓN DE PRODUCTOS' : 
             isMaterial ? 'Gestión de Productos' : 
             'Product Management'}
          </h1>
          <p 
            className={`text-muted-foreground max-w-2xl mx-auto mb-4`}
          >
            {isNeoBrutalism ? 'ADMINISTRA TU INVENTARIO CON LA BUSINESS MANAGEMENT API' :
             isMaterial ? 'Administra tu inventario con Material Design' :
             'Manage your inventory with the Business Management API'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              className={themeButton('primary')}
              onClick={handleCreateProduct}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'NUEVO PRODUCTO' : 'Nuevo Producto'}
            </button>
            <button
              className={themeButton('secondary')}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
            </button>
          </div>
        </header>

        {/* Filtros y Búsqueda */}
        <section 
          className={card('p-6')}
        >
          {/* Búsqueda en API */}
          <div className="mb-6">
            <div className={`${themeHeader('h3')} mb-3`}>
              {isNeoBrutalism ? 'BUSCAR EN BASE DE DATOS' : 'Buscar en Base de Datos'}
            </div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="api-search-input"
                  type="text"
                  placeholder={isNeoBrutalism ? "BUSCAR POR NOMBRE O ID..." : "Buscar por nombre o ID..."}
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
              <button
                onClick={handleApiSearch}
                className={`${themeButton('primary')} px-6 py-3`}
              >
                {isNeoBrutalism ? 'BUSCAR' : 'Buscar'}
              </button>
              <button
                onClick={handleClearSearch}
                className={`${themeButton('secondary')} px-6 py-3`}
              >
                {isNeoBrutalism ? 'LIMPIAR' : 'Limpiar'}
              </button>
            </div>

            {/* Ayuda para búsqueda */}
            <div className="text-xs text-muted-foreground mb-4 flex flex-col gap-1">
              <span>
                {isNeoBrutalism ? 
                  'PUEDES BUSCAR POR NOMBRE (EJ: "PUMA") O POR ID COMPLETO (EJ: "BCYDWDKNR")' :
                  'Puedes buscar por nombre (ej: "Puma") o por ID completo (ej: "bcYdWdKNR")'
                }
              </span>
              <span>
                {isNeoBrutalism ?
                  `BÚSQUEDA AUTOMÁTICA: MÍNIMO ${minChars} CARACTERES. ATAJO: '/' PARA ENFOCAR.` :
                  `Búsqueda automática: mínimo ${minChars} caracteres. Atajo: '/' para enfocar.`}
              </span>
            </div>
            
            {/* Control de tamaño de página */}
            <div className="flex items-center gap-3">
              <label 
                htmlFor="pageSize"
                className={`text-sm text-muted-foreground ${themeLabel()}`}
              >
                {isNeoBrutalism ? 'PRODUCTOS POR PÁGINA:' : 'Productos por página:'}
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
              <div className={`${themeHeader('h3')} mb-3`}>
                {isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : 'Filtrar Resultados Actuales'}
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
                {isNeoBrutalism ? 'NO HAY PRODUCTOS CARGADOS' : 'No hay productos cargados'}
              </div>
              <div className={`text-muted-foreground mb-6 ${themeBody()}`}>
                {isNeoBrutalism ? 
                  'UTILIZA LA BÚSQUEDA PARA ENCONTRAR PRODUCTOS EN LA BASE DE DATOS' : 
                  'Utiliza la búsqueda para encontrar productos en la base de datos'
                }
              </div>
              <button
                onClick={handleCreateProduct}
                className={themeButton('primary')}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isNeoBrutalism ? 'CREAR PRIMER PRODUCTO' : 'Crear Primer Producto'}
              </button>
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
                <button
                  onClick={handleClearSearch}
                  className={themeButton('secondary')}
                >
                  {isNeoBrutalism ? 'LIMPIAR BÚSQUEDA' : 'Limpiar búsqueda'}
                </button>
                <button
                  onClick={handleCreateProduct}
                  className={themeButton('primary')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isNeoBrutalism ? 'CREAR PRODUCTO' : 'Crear producto'}
                </button>
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
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1 || isLoading}
                  className={`${themeButton('secondary')} px-3 py-2 ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isNeoBrutalism ? 'PRIMERA' : 'Primera'}
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  className={`${themeButton('secondary')} px-4 py-2 ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isNeoBrutalism ? 'ANTERIOR' : 'Anterior'}
                </button>
                
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
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isLoading}
                      className={`${themeButton(pageNumber === currentPage ? 'primary' : 'secondary')} px-3 py-2 min-w-[40px] ${pageNumber === currentPage ? 'font-bold' : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  className={`${themeButton('secondary')} px-4 py-2 ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isNeoBrutalism ? 'SIGUIENTE' : 'Siguiente'}
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                  className={`${themeButton('secondary')} px-3 py-2 ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isNeoBrutalism ? 'ÚLTIMA' : 'Última'}
                </button>

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
