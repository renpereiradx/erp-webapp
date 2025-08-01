/**
 * Página Products - Sistema de gestión completo
 * Rediseñada para trabajar con la Business Management API
 * Incluye CRUD completo con modales y gestión de descripciones, precios y stock
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import useAuthStore from '@/store/useAuthStore';
import ProductModal from '@/components/ProductModal';
import ProductDetailModal from '@/components/ProductDetailModal';
import DeleteProductModal from '@/components/DeleteProductModal';
import { createProductSummary, getStockStatus, formatPrice, isEnrichedProduct } from '@/utils/productUtils';
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';

const Products = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const { toasts, success, error: showError, removeToast } = useToast();
  const { isAuthenticated, login } = useAuthStore();
  const { 
    products, 
    loading: isLoading, 
    error: storeError, 
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
    clearError 
  } = useProductStore();

  // Estados locales para UI
  const [apiSearchTerm, setApiSearchTerm] = useState(''); // Para búsqueda en API
  const [localSearchTerm, setLocalSearchTerm] = useState(''); // Para filtro local
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  
  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper functions para estilos (mejorados)
  const getCardStyles = () => {
    if (isNeoBrutalism) return {
      background: 'var(--background)',
      border: '4px solid var(--border)',
      borderRadius: '0px',
      boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      transition: 'all 200ms ease',
      overflow: 'hidden',
      padding: '24px'
    };
    if (isMaterial) return {
      background: 'var(--md-surface-main, var(--card))',
      border: 'none',
      borderRadius: 'var(--md-corner-medium, 12px)',
      boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
      transition: 'all 200ms ease',
      overflow: 'hidden',
      padding: 'var(--md-spacing-3, 24px)'
    };
    if (isFluent) return {
      background: 'var(--fluent-surface-card, var(--card))',
      border: '1px solid var(--fluent-border-neutral, var(--border))',
      borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
      boxShadow: 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))',
      transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)',
      overflow: 'hidden',
      padding: 'var(--fluent-size-160, 16px)'
    };
    return {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 200ms ease',
      overflow: 'hidden',
      padding: '24px'
    };
  };

  const getTypographyStyles = (level = 'base') => {
    if (isNeoBrutalism) return {
      title: {
        fontSize: '3.5rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
        marginBottom: '1.5rem'
      },
      heading: {
        fontSize: '1.875rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2',
        marginBottom: '1rem'
      },
      subheading: {
        fontSize: '1.25rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        marginBottom: '0.5rem'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      }
    }[level] || {
      fontSize: '1rem',
      fontWeight: '600',
      letterSpacing: '0.01em'
    };
    
    return {
      title: { fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' },
      heading: { fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem' },
      subheading: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' },
      base: { fontSize: '0.875rem', fontWeight: '400' },
      small: { fontSize: '0.75rem', fontWeight: '400' }
    }[level] || { fontSize: '0.875rem', fontWeight: '400' };
  };

  const getBadgeStyles = (type) => {
    const getBackgroundColor = () => {
      switch (type) {
        case 'inactive':
          return isNeoBrutalism ? 'var(--brutalist-pink)' : 'var(--destructive)';
        case 'low-stock':
          return isNeoBrutalism ? 'var(--brutalist-orange)' : 'var(--warning)';
        default: // active
          return isNeoBrutalism ? 'var(--brutalist-lime)' : 'var(--success)';
      }
    };

    return {
      background: getBackgroundColor(),
      color: isNeoBrutalism ? '#000000' : 'white',
      border: isNeoBrutalism ? '2px solid var(--border)' : 'none',
      borderRadius: isNeoBrutalism ? '0px' : '4px',
      textTransform: isNeoBrutalism ? 'uppercase' : 'none',
      fontWeight: isNeoBrutalism ? 'bold' : '500',
      fontSize: '0.75rem',
      padding: isNeoBrutalism ? '8px 12px' : '4px 8px',
      display: 'inline-block',
      minWidth: '80px',
      textAlign: 'center'
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }
    }[variant];

    return {
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: variant === 'primary' ? 'none' : '1px solid var(--border)',
      background: variant === 'primary' ? 'var(--primary)' : 'var(--background)',
      color: variant === 'primary' ? 'var(--primary-foreground)' : 'var(--foreground)',
      transition: 'all 150ms ease'
    };
  };

  // useEffect para cargar categorías cuando hay autenticación
  useEffect(() => {
    const loadCategoriesIfNeeded = async () => {
      if (categories.length === 0) {
        try {
          await fetchCategories();
        } catch (error) {
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

  // Funciones para búsqueda en API
  const handleApiSearch = async () => {
    if (apiSearchTerm.trim()) {
      try {
        const result = await searchProducts(apiSearchTerm.trim());
        // El store ya maneja los errores internamente
        // Solo mostramos un mensaje si hay un error específico
        if (result && result.error) {
          console.warn('Búsqueda completada con advertencias:', result.error);
        }
      } catch (error) {
        // Esto ya no debería ocurrir con el nuevo searchProducts
        console.error('Error inesperado en handleApiSearch:', error);
      }
    } else {
      clearProducts();
    }
  };

  const handleApiSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApiSearch();
    }
  };

  // Funciones para paginación
  const handlePageChange = async (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      await loadPage(page);
    }
  };

  const handlePageSizeChange = async (newPageSize) => {
    await changePageSize(parseInt(newPageSize));
  };

  // Función para limpiar búsqueda
  const handleClearSearch = () => {
    setApiSearchTerm('');
    setLocalSearchTerm('');
    clearProducts();
  };

  // Funciones de utilidad
  const getStockStatus = (product) => {
    if (!product.is_active) return 'inactive';
    if (product.stock_quantity && product.stock_quantity < 10) return 'low-stock';
    return 'active';
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      case 'low-stock':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Funciones de eventos
  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
    }
  };

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
    } catch (error) {
      showError('Error en auto-login: ' + error.message);
    }
  };

  const handleConfirmDelete = async (product) => {
    try {
      await deleteProduct(product.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      success(`Producto "${product.name}" eliminado exitosamente`);
    } catch (err) {
      showError('Error al eliminar el producto: ' + err.message);
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
  };

  // Lógica de filtrado local (solo para productos ya cargados)
  const filteredProducts = products.filter(product => {
    const matchesLocalSearch = localSearchTerm === '' || 
      product.name.toLowerCase().includes(localSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      product.category_id == selectedCategory;
    const matchesStock = selectedStock === 'all' || 
      (selectedStock === 'active' && product.is_active) ||
      (selectedStock === 'inactive' && !product.is_active);
    
    return matchesLocalSearch && matchesCategory && matchesStock;
  });

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('heading')}
              >
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
              className="text-center p-6"
              style={getCardStyles()}
            >
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <div 
                className="text-destructive mb-4"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'ERROR AL CARGAR' : 'Error al cargar'}
              </div>
              <p className="text-muted-foreground mb-4">{storeError}</p>
              
              {/* Debug: Mostrar botón de login si no está autenticado */}
              {!isAuthenticated && (
                <div className="mb-4">
                  <button
                    onClick={handleDevLogin}
                    style={{
                      ...getButtonStyles('secondary'),
                      marginRight: '12px'
                    }}
                    onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                    onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
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
                style={getButtonStyles('primary')}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
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
            className="text-primary mb-4"
            style={getTypographyStyles('title')}
          >
            {isNeoBrutalism ? 'GESTIÓN DE PRODUCTOS' : 
             isMaterial ? 'Gestión de Productos' : 
             'Product Management'}
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto mb-4"
            style={getTypographyStyles('base')}
          >
            {isNeoBrutalism ? 'ADMINISTRA TU INVENTARIO CON LA BUSINESS MANAGEMENT API' :
             isMaterial ? 'Administra tu inventario con Material Design' :
             'Manage your inventory with the Business Management API'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getButtonStyles('primary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              onClick={handleCreateProduct}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'NUEVO PRODUCTO' : 'Nuevo Producto'}
            </button>
            <button
              style={getButtonStyles('secondary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
            </button>
          </div>
        </header>

        {/* Filtros y Búsqueda */}
        <section 
          className="p-6"
          style={getCardStyles()}
        >
          {/* Búsqueda en API */}
          <div className="mb-6">
            <div 
              className="mb-3"
              style={getTypographyStyles('subheading')}
            >
              {isNeoBrutalism ? 'BUSCAR EN BASE DE DATOS' : 'Buscar en Base de Datos'}
            </div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isNeoBrutalism ? "BUSCAR POR NOMBRE O ID..." : "Buscar por nombre o ID..."}
                  value={apiSearchTerm}
                  onChange={(e) => setApiSearchTerm(e.target.value)}
                  onKeyPress={handleApiSearchKeyPress}
                  className="w-full pl-12 p-3 border rounded-md bg-background"
                  style={isNeoBrutalism ? {
                    border: '3px solid var(--border)',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  } : {}}
                />
              </div>
              <button
                onClick={handleApiSearch}
                style={{
                  ...getButtonStyles('primary'),
                  padding: '12px 24px'
                }}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                {isNeoBrutalism ? 'BUSCAR' : 'Buscar'}
              </button>
              <button
                onClick={handleClearSearch}
                style={{
                  ...getButtonStyles('secondary'),
                  padding: '12px 24px'
                }}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                {isNeoBrutalism ? 'LIMPIAR' : 'Limpiar'}
              </button>
            </div>

            {/* Ayuda para búsqueda */}
            <div className="text-xs text-muted-foreground mb-4">
              {isNeoBrutalism ? 
                'PUEDES BUSCAR POR NOMBRE (EJ: "PUMA") O POR ID COMPLETO (EJ: "BCYDWDKNR")' :
                'Puedes buscar por nombre (ej: "Puma") o por ID completo (ej: "bcYdWdKNR")'
              }
            </div>
            
            {/* Control de tamaño de página */}
            <div className="flex items-center gap-3">
              <label 
                htmlFor="pageSize"
                className="text-sm text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'PRODUCTOS POR PÁGINA:' : 'Productos por página:'}
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
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
              <div 
                className="mb-3"
                style={getTypographyStyles('subheading')}
              >
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
                    className="w-full pl-12 p-3 border rounded-md bg-background"
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
                  className="p-3 border rounded-md"
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
                  className="p-3 border rounded-md"
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
                  <div 
                    className="text-foreground text-2xl font-bold"
                    style={getTypographyStyles('heading')}
                  >
                    {filteredProducts.length}
                  </div>
                  <div 
                    className="text-muted-foreground text-sm"
                    style={getTypographyStyles('small')}
                  >
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
            <div 
              className="text-center py-20"
              style={getCardStyles()}
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'CARGANDO PRODUCTOS...' : 'Cargando productos...'}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay productos cargados */}
          {!isLoading && products.length === 0 && !lastSearchTerm && (
            <div 
              className="text-center py-20"
              style={getCardStyles()}
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground mb-4"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO HAY PRODUCTOS CARGADOS' : 'No hay productos cargados'}
              </div>
              <div 
                className="text-muted-foreground mb-6"
                style={getTypographyStyles('base')}
              >
                {isNeoBrutalism ? 
                  'UTILIZA LA BÚSQUEDA PARA ENCONTRAR PRODUCTOS EN LA BASE DE DATOS' : 
                  'Utiliza la búsqueda para encontrar productos en la base de datos'
                }
              </div>
              <button
                onClick={handleCreateProduct}
                style={getButtonStyles('primary')}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isNeoBrutalism ? 'CREAR PRIMER PRODUCTO' : 'Crear Primer Producto'}
              </button>
            </div>
          )}

          {/* Mensaje cuando la búsqueda no devuelve resultados */}
          {!isLoading && products.length === 0 && lastSearchTerm && (
            <div 
              className="text-center py-20"
              style={getCardStyles()}
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground mb-4"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
              <div 
                className="text-muted-foreground mb-6"
                style={getTypographyStyles('base')}
              >
                {isNeoBrutalism ? 
                  `NO HAY PRODUCTOS QUE COINCIDAN CON "${lastSearchTerm.toUpperCase()}"` : 
                  `No hay productos que coincidan con "${lastSearchTerm}"`
                }
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleClearSearch}
                  style={getButtonStyles('secondary')}
                  onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                >
                  {isNeoBrutalism ? 'LIMPIAR BÚSQUEDA' : 'Limpiar búsqueda'}
                </button>
                <button
                  onClick={handleCreateProduct}
                  style={getButtonStyles('primary')}
                  onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
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
              className="text-center py-20"
              style={getCardStyles()}
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground mb-4"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('base')}
              >
                {isNeoBrutalism ? 
                  `NO HAY PRODUCTOS QUE COINCIDAN CON "${localSearchTerm.toUpperCase()}"` : 
                  `No hay productos que coincidan con "${localSearchTerm}"`
                }
              </div>
            </div>
          )}

          {/* Grid de productos */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                
                // Debug: Log del producto para verificar estructura de datos (comentado para reducir ruido)
                // console.log('🔍 Product data:', {
                //   id: product.id,
                //   name: product.name,
                //   price: product.price,
                //   stock_quantity: product.stock_quantity,
                //   category_id: product.category_id,
                //   is_active: product.is_active,
                //   code: product.code,
                //   fullProduct: product
                // });
                
                const productSummary = createProductSummary(product);
                const stockStatus = getStockStatus(product);
                
                return (
                  <div
                    key={product.id}
                    style={getCardStyles()}
                    className="hover:shadow-lg transition-shadow relative"
                  >
                    {/* Enriched Product Indicators */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {isEnrichedProduct(product) && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" 
                             title="Producto con datos enriquecidos" />
                      )}
                      {productSummary.hasUnitPricing && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" 
                             title="Producto con precios por unidad (kg, caja, etc.)" />
                      )}
                    </div>
                    
                    {/* Product Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 
                          className="font-semibold mb-2 truncate"
                          style={getTypographyStyles('subheading')}
                        >
                          {product.name || 'Sin nombre'}
                        </h3>
                        <div 
                          className="text-xs text-muted-foreground mb-2"
                          style={getTypographyStyles('small')}
                        >
                          {product.code ? `Código: ${product.code}` : `ID: ${product.id}`}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div style={getBadgeStyles(status)}>
                        <div className="flex items-center gap-1">
                          {getStockIcon(status)}
                          <span>
                            {status === 'active' ? 
                              (isNeoBrutalism ? 'ACTIVO' : 'Activo') : 
                              (isNeoBrutalism ? 'INACTIVO' : 'Inactivo')
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Product Info */}
                    <div className="space-y-3 mb-4">
                      {/* Category Info */}
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'CATEGORÍA:' : 'Categoría:'}
                        </span>
                        <span style={getTypographyStyles('small')}>
                          {productSummary.category?.name || getCategoryName(product.category_id)}
                        </span>
                      </div>
                      
                      {/* Price Info - Enhanced */}
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {productSummary.hasUnitPricing 
                            ? (isNeoBrutalism ? 'PRECIO/UNIDAD:' : 'Precio/Unidad:')
                            : (isNeoBrutalism ? 'PRECIO:' : 'Precio:')
                          }
                        </span>
                        <div className="flex items-center gap-1">
                          {productSummary.priceFormatted ? (
                            <span 
                              style={getTypographyStyles('small')}
                              className="font-medium text-green-600"
                            >
                              {productSummary.priceFormatted}
                            </span>
                          ) : productSummary.price ? (
                            <span 
                              style={getTypographyStyles('small')}
                              className="font-medium text-green-600"
                            >
                              {productSummary.price.formatted}
                            </span>
                          ) : (
                            <span 
                              style={getTypographyStyles('small')}
                              className="text-muted-foreground"
                            >
                              {product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}
                            </span>
                          )}
                          {(productSummary.priceFormatted || productSummary.price) && (
                            <DollarSign className="w-3 h-3 text-green-600" />
                          )}
                          {productSummary.hasUnitPricing && (
                            <Tag className="w-3 h-3 text-blue-500" title="Múltiples unidades disponibles" />
                          )}
                        </div>
                      </div>
                      
                      {/* Stock Info - Enhanced with color coding */}
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'STOCK:' : 'Stock:'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span 
                            style={{
                              ...getTypographyStyles('small'),
                              color: stockStatus.color === 'red' ? '#ef4444' :
                                     stockStatus.color === 'orange' ? '#f97316' :
                                     stockStatus.color === 'blue' ? '#3b82f6' :
                                     stockStatus.color === 'green' ? '#10b981' : '#6b7280'
                            }}
                            className="font-medium"
                          >
                            {stockStatus.text}
                            {/* Mostrar cantidad si está disponible */}
                            {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                              <span className="ml-1 text-xs opacity-75">
                                ({product.stock_quantity})
                              </span>
                            )}
                          </span>
                          {stockStatus.status === 'out' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {stockStatus.status === 'low' && <AlertCircle className="w-3 h-3 text-orange-500" />}
                          {stockStatus.status === 'medium' && <Package className="w-3 h-3 text-blue-500" />}
                          {stockStatus.status === 'in-stock' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {stockStatus.status === 'available' && <Package className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                      
                      {/* Description Preview - Only for enriched products */}
                      {productSummary.description && (
                        <div className="border-t pt-2">
                          <p 
                            className="text-xs text-muted-foreground line-clamp-2"
                            style={getTypographyStyles('small')}
                            title={productSummary.description.text}
                          >
                            {productSummary.description.text}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        style={{
                          ...getButtonStyles('secondary'),
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '0.75rem'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'VER' : 'Ver'}
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        style={{
                          ...getButtonStyles('primary'),
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '0.75rem'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        style={{
                          ...getButtonStyles('secondary'),
                          background: 'var(--destructive)',
                          color: 'var(--destructive-foreground)',
                          padding: '8px 12px'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer con paginación */}
        {!isLoading && products.length > 0 && (
          <footer className="text-center py-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 
                  `MOSTRANDO ${filteredProducts.length} DE ${products.length} PRODUCTOS EN ESTA PÁGINA` :
                  `Mostrando ${filteredProducts.length} de ${products.length} productos en esta página`
                }
              </div>
              {lastSearchTerm && (
                <div className="flex items-center gap-2">
                  <div 
                    className="text-muted-foreground"
                    style={getTypographyStyles('small')}
                  >
                    {isNeoBrutalism ? 
                      `BUSQUEDA: "${lastSearchTerm.toUpperCase()}"` :
                      `Búsqueda: "${lastSearchTerm}"`
                    }
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                    style={getTypographyStyles('small')}
                  >
                    {/^[a-zA-Z0-9_-]{10,}$/.test(lastSearchTerm) 
                      ? (isNeoBrutalism ? 'POR ID' : 'por ID')
                      : (isNeoBrutalism ? 'POR NOMBRE' : 'por nombre')
                    }
                  </div>
                </div>
              )}
              {totalProducts > 0 && (
                <div 
                  className="text-muted-foreground"
                  style={getTypographyStyles('small')}
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
                  style={{
                    ...getButtonStyles('secondary'),
                    padding: '8px 12px',
                    opacity: currentPage <= 1 ? 0.5 : 1,
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={isNeoBrutalism && currentPage > 1 ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism && currentPage > 1 ? handleButtonLeave : undefined}
                >
                  {isNeoBrutalism ? 'PRIMERA' : 'Primera'}
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  style={{
                    ...getButtonStyles('secondary'),
                    padding: '8px 16px',
                    opacity: currentPage <= 1 ? 0.5 : 1,
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={isNeoBrutalism && currentPage > 1 ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism && currentPage > 1 ? handleButtonLeave : undefined}
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
                      style={{
                        ...getButtonStyles(pageNumber === currentPage ? 'primary' : 'secondary'),
                        padding: '8px 12px',
                        minWidth: '40px',
                        fontWeight: pageNumber === currentPage ? 'bold' : 'normal'
                      }}
                      onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                      onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  style={{
                    ...getButtonStyles('secondary'),
                    padding: '8px 16px',
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={isNeoBrutalism && currentPage < totalPages ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism && currentPage < totalPages ? handleButtonLeave : undefined}
                >
                  {isNeoBrutalism ? 'SIGUIENTE' : 'Siguiente'}
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                  style={{
                    ...getButtonStyles('secondary'),
                    padding: '8px 12px',
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={isNeoBrutalism && currentPage < totalPages ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism && currentPage < totalPages ? handleButtonLeave : undefined}
                >
                  {isNeoBrutalism ? 'ÚLTIMA' : 'Última'}
                </button>

                {/* Información de página actual */}
                <div 
                  className="text-muted-foreground ml-4"
                  style={getTypographyStyles('small')}
                >
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

      {/* Modales */}
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

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast} 
      />
    </div>
  );
};

export default Products;
