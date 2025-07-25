/**
 * Página Products - Sistema de gestión completo
 * Rediseñada para trabajar con la Business Management API
 * Incluye CRUD completo con modales y gestión de descripciones, precios y stock
 */

import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';
import ProductModal from '@/components/ProductModal';
import ProductDetailModal from '@/components/ProductDetailModal';
import DeleteProductModal from '@/components/DeleteProductModal';

const Products = () => {
  const { theme } = useTheme();
  const { 
    products, 
    loading, 
    error, 
    totalProducts,
    currentPage,
    totalPages,
    fetchProducts, 
    deleteProduct,
    clearError 
  } = useProductStore();

  // Estados locales para UI
  const [searchTerm, setSearchTerm] = useState('');
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

  // useEffect para cargar productos
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Funciones de utilidad
  const getStockStatus = (product) => {
    if (!product.state) return 'inactive';
    return 'active'; // Simplificado para la demo
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

  const handleConfirmDelete = async (product) => {
    try {
      await deleteProduct(product.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  };

  const handleModalSuccess = () => {
    fetchProducts(); // Refrescar la lista
    setShowProductModal(false);
    setEditingProduct(null);
  };

  // Lógica de filtrado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.id_category == selectedCategory;
    const matchesStock = selectedStock === 'all' || 
      (selectedStock === 'active' && product.state) ||
      (selectedStock === 'inactive' && !product.state);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Estados de carga y error
  if (loading) {
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

  if (error) {
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
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => {
                  clearError();
                  fetchProducts();
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
            className="text-muted-foreground max-w-2xl mx-auto mb-8"
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

        {/* Filtros */}
        <section 
          className="p-6"
          style={getCardStyles()}
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={isNeoBrutalism ? "BUSCAR PRODUCTOS..." : "Buscar productos..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              className="p-3 border rounded-md bg-background"
              style={isNeoBrutalism ? {
                border: '3px solid var(--border)',
                borderRadius: '0px',
                textTransform: 'uppercase',
                fontWeight: '600'
              } : {}}
            >
              <option value="all">{isNeoBrutalism ? 'TODAS LAS CATEGORÍAS' : 'Todas las categorías'}</option>
              <option value="5">{isNeoBrutalism ? 'CATEGORÍA 5' : 'Categoría 5'}</option>
              <option value="6">{isNeoBrutalism ? 'CATEGORÍA 6' : 'Categoría 6'}</option>
            </select>

            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="p-3 border rounded-md bg-background"
              style={isNeoBrutalism ? {
                border: '3px solid var(--border)',
                borderRadius: '0px',
                textTransform: 'uppercase',
                fontWeight: '600'
              } : {}}
            >
              <option value="all">{isNeoBrutalism ? 'TODOS LOS ESTADOS' : 'Todos los estados'}</option>
              <option value="active">{isNeoBrutalism ? 'ACTIVOS' : 'Activos'}</option>
              <option value="inactive">{isNeoBrutalism ? 'INACTIVOS' : 'Inactivos'}</option>
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
        </section>

        {/* Lista de Productos */}
        <section>
          {filteredProducts.length === 0 ? (
            <div 
              className="text-center py-20"
              style={getCardStyles()}
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
              <button
                onClick={handleCreateProduct}
                style={getButtonStyles('primary')}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isNeoBrutalism ? 'CREAR PRIMER PRODUCTO' : 'Crear Primer Producto'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <div
                    key={product.id}
                    style={getCardStyles()}
                    className="hover:shadow-lg transition-shadow"
                  >
                    {/* Product Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 
                          className="font-semibold mb-2 truncate"
                          style={getTypographyStyles('subheading')}
                        >
                          {product.name}
                        </h3>
                        <div 
                          className="text-xs text-muted-foreground mb-2"
                          style={getTypographyStyles('small')}
                        >
                          ID: {product.id}
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

                    {/* Product Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'CATEGORÍA:' : 'Categoría:'}
                        </span>
                        <span style={getTypographyStyles('small')}>
                          {product.id_category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'TIPO:' : 'Tipo:'}
                        </span>
                        <span style={getTypographyStyles('small')}>
                          {product.product_type || 'PHYSICAL'}
                        </span>
                      </div>
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

        {/* Footer con paginación (placeholder) */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <div 
              className="text-muted-foreground"
              style={getTypographyStyles('small')}
            >
              {isNeoBrutalism ? 
                `MOSTRANDO ${filteredProducts.length} DE ${totalProducts} PRODUCTOS` :
                `Mostrando ${filteredProducts.length} de ${totalProducts} productos`
              }
            </div>
          </div>
        </footer>

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
        onRefresh={fetchProducts}
      />

      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </div>
  );
};

export default Products;
