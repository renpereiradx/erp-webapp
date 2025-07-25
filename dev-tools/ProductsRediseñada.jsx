/**
 * Página Products Rediseñada - Business Management API
 * Gestión completa de productos siguiendo el plan de rediseño UI/UX
 * Integra la especificación OpenAPI y estructura SQL
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
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Estados para feedback visual
  const [successMessage, setSuccessMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper functions para estilos temáticos
  const getCardStyles = () => {
    if (isNeoBrutalism) return {
      background: 'var(--background)',
      border: '4px solid var(--border)',
      borderRadius: '0px',
      boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      transition: 'all 200ms ease',
      overflow: 'hidden'
    };
    if (isMaterial) return {
      background: 'var(--md-surface-main, var(--card))',
      border: 'none',
      borderRadius: 'var(--md-corner-medium, 12px)',
      boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
      transition: 'all 200ms ease',
      overflow: 'hidden'
    };
    if (isFluent) return {
      background: 'var(--fluent-surface-card, var(--card))',
      border: '1px solid var(--fluent-border-neutral, var(--border))',
      borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
      boxShadow: 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))',
      transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)',
      overflow: 'hidden'
    };
    return {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 200ms ease',
      overflow: 'hidden'
    };
  };

  const getTypographyStyles = (level = 'base') => {
    if (isNeoBrutalism) {
      const styles = {
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
      };
      return styles[level] || styles.base;
    }
    
    if (isMaterial) {
      const styles = {
        title: {
          fontSize: '3rem',
          fontWeight: '400',
          letterSpacing: '-0.025em',
          lineHeight: '1.1',
          marginBottom: '1.5rem'
        },
        heading: {
          fontSize: '1.5rem',
          fontWeight: '500',
          letterSpacing: '0.0125em',
          lineHeight: '1.33',
          marginBottom: '1rem'
        },
        subheading: {
          fontSize: '1rem',
          fontWeight: '500',
          letterSpacing: '0.0094em',
          marginBottom: '0.5rem'
        },
        base: {
          fontSize: '0.875rem',
          fontWeight: '400',
          letterSpacing: '0.0178em'
        },
        small: {
          fontSize: '0.75rem',
          fontWeight: '400',
          letterSpacing: '0.033em'
        }
      };
      return styles[level] || styles.base;
    }
    
    if (isFluent) {
      const styles = {
        title: {
          fontSize: '2.5rem',
          fontWeight: '600',
          letterSpacing: '-0.02em',
          lineHeight: '1.2',
          marginBottom: '1.5rem'
        },
        heading: {
          fontSize: '1.25rem',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          lineHeight: '1.3',
          marginBottom: '1rem'
        },
        subheading: {
          fontSize: '1rem',
          fontWeight: '600',
          letterSpacing: '0em',
          marginBottom: '0.5rem'
        },
        base: {
          fontSize: '0.875rem',
          fontWeight: '400',
          letterSpacing: '0em'
        },
        small: {
          fontSize: '0.75rem',
          fontWeight: '400',
          letterSpacing: '0em'
        }
      };
      return styles[level] || styles.base;
    }

    // Default styles
    const styles = {
      title: { fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem' },
      heading: { fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' },
      subheading: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' },
      base: { fontSize: '1rem', fontWeight: '400' },
      small: { fontSize: '0.875rem', fontWeight: '400' }
    };
    return styles[level] || styles.base;
  };

  const getBadgeStyles = (type) => {
    const getBackgroundColor = () => {
      switch (type) {
        case 'en-stock': return isNeoBrutalism ? 'var(--brutalist-lime)' : 
                               isMaterial ? 'var(--md-color-green-500)' : 
                               isFluent ? 'var(--fluent-color-green-500)' : '#10b981';
        case 'poco-stock': return isNeoBrutalism ? 'var(--brutalist-orange)' : 
                                 isMaterial ? 'var(--md-color-orange-500)' : 
                                 isFluent ? 'var(--fluent-color-orange-500)' : '#f59e0b';
        case 'sin-stock': return isNeoBrutalism ? 'var(--brutalist-pink)' : 
                                isMaterial ? 'var(--md-color-red-500)' : 
                                isFluent ? 'var(--fluent-color-red-500)' : '#ef4444';
        default: return isNeoBrutalism ? 'var(--brutalist-lime)' : '#10b981';
      }
    };

    if (isNeoBrutalism) {
      return {
        background: getBackgroundColor(),
        color: type === 'en-stock' ? '#000000' : '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap'
      };
    }

    return {
      background: getBackgroundColor(),
      color: '#ffffff',
      border: 'none',
      padding: '4px 12px',
      borderRadius: isMaterial ? '16px' : isFluent ? '2px' : '6px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) {
      const buttons = {
        primary: {
          background: 'var(--brutalist-lime)',
          color: '#000000',
          border: '3px solid var(--border)',
          borderRadius: '0px',
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          cursor: 'pointer',
          boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
          transition: 'all 150ms ease'
        },
        secondary: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '3px solid var(--border)',
          borderRadius: '0px',
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          cursor: 'pointer',
          boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
          transition: 'all 150ms ease'
        },
        small: {
          background: 'var(--brutalist-blue)',
          color: '#ffffff',
          border: '2px solid var(--border)',
          borderRadius: '0px',
          padding: '8px 16px',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          cursor: 'pointer',
          boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
          transition: 'all 150ms ease'
        }
      };
      return buttons[variant] || buttons.primary;
    }

    return {}; // Default button styles from component
  };

  // useEffect para cargar productos
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 10 });
  }, [fetchProducts]);

  // useEffect para limpiar mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Funciones de utilidad para productos
  const getStockStatus = (stock) => {
    if (stock === 0) return 'sin-stock';
    if (stock <= 10) return 'poco-stock';
    return 'en-stock';
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'sin-stock': return <XCircle className="w-4 h-4" />;
      case 'poco-stock': return <AlertCircle className="w-4 h-4" />;
      case 'en-stock': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStockText = (status) => {
    switch (status) {
      case 'sin-stock': return isNeoBrutalism ? 'SIN STOCK' : 'Sin Stock';
      case 'poco-stock': return isNeoBrutalism ? 'POCO STOCK' : 'Poco Stock';
      case 'en-stock': return isNeoBrutalism ? 'EN STOCK' : 'En Stock';
      default: return 'Desconocido';
    }
  };

  // Funciones de eventos para modales
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setSelectedProduct(product);
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

  const handleProductModalSuccess = (message) => {
    setShowProductModal(false);
    setSuccessMessage(message);
    fetchProducts({ page: currentPage || 1, pageSize: 10 });
  };

  const handleDeleteModalSuccess = (message) => {
    setShowDeleteModal(false);
    setSuccessMessage(message);
    fetchProducts({ page: currentPage || 1, pageSize: 10 });
  };

  // Funciones de eventos para interacciones
  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0, 0)';
      e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
    }
  };

  // Lógica de filtrado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const stockStatus = getStockStatus(product.stock || 0);
    const matchesStock = selectedStock === 'all' || 
                        (selectedStock === 'in-stock' && stockStatus === 'en-stock') ||
                        (selectedStock === 'low-stock' && stockStatus === 'poco-stock') ||
                        (selectedStock === 'out-of-stock' && stockStatus === 'sin-stock');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Ordenamiento de productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortBy] || '';
    const bValue = b[sortBy] || '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Componente de estadísticas rápidas
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card style={getCardStyles()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div 
                className="text-foreground text-2xl font-bold mb-1"
                style={getTypographyStyles('heading')}
              >
                {filteredProducts.length}
              </div>
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'PRODUCTOS TOTALES' : 'Productos Totales'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={getCardStyles()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div 
                className="text-foreground text-2xl font-bold mb-1"
                style={getTypographyStyles('heading')}
              >
                {filteredProducts.filter(p => getStockStatus(p.stock || 0) === 'en-stock').length}
              </div>
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'EN STOCK' : 'En Stock'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={getCardStyles()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div 
                className="text-foreground text-2xl font-bold mb-1"
                style={getTypographyStyles('heading')}
              >
                {filteredProducts.filter(p => getStockStatus(p.stock || 0) === 'poco-stock').length}
              </div>
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'POCO STOCK' : 'Poco Stock'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={getCardStyles()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div 
                className="text-foreground text-2xl font-bold mb-1"
                style={getTypographyStyles('heading')}
              >
                {filteredProducts.filter(p => getStockStatus(p.stock || 0) === 'sin-stock').length}
              </div>
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'SIN STOCK' : 'Sin Stock'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Componente de tarjeta de producto
  const ProductCard = ({ product }) => {
    const stockStatus = getStockStatus(product.stock || 0);
    
    return (
      <Card style={getCardStyles()} className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 
                className="text-foreground font-semibold mb-1"
                style={getTypographyStyles('subheading')}
              >
                {product.name}
              </h3>
              <p 
                className="text-muted-foreground mb-2"
                style={getTypographyStyles('small')}
              >
                SKU: {product.sku || 'N/A'}
              </p>
              <p 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                Categoría: {product.category || 'Sin categoría'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span 
                className="mb-2"
                style={{
                  ...getBadgeStyles(stockStatus),
                  fontSize: '0.75rem'
                }}
              >
                {getStockText(stockStatus)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewProduct(product)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-foreground font-bold text-lg"
                style={getTypographyStyles('subheading')}
              >
                ${product.price?.toFixed(2) || '0.00'}
              </p>
              <p 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                Stock: {product.stock || 0} unidades
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditProduct(product)}
                style={isNeoBrutalism ? getButtonStyles('small') : {}}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteProduct(product)}
                style={isNeoBrutalism ? getButtonStyles('small') : {}}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p 
                className="text-muted-foreground"
                style={getTypographyStyles('base')}
              >
                {isNeoBrutalism ? 'CARGANDO PRODUCTOS...' : 'Cargando productos...'}
              </p>
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
          <Card style={getCardStyles()}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 
                className="text-red-600 mb-2"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'ERROR AL CARGAR PRODUCTOS' : 'Error al cargar productos'}
              </h2>
              <p 
                className="text-muted-foreground mb-4"
                style={getTypographyStyles('base')}
              >
                {error}
              </p>
              <Button
                onClick={() => {
                  clearError();
                  fetchProducts({ page: 1, pageSize: 10 });
                }}
                style={isNeoBrutalism ? getButtonStyles('primary') : {}}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isNeoBrutalism ? 'REINTENTAR' : 'Reintentar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-6">
            <div 
              className="p-4 rounded-lg bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800"
              style={isNeoBrutalism ? {
                borderRadius: '0px',
                border: '3px solid var(--border)',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.5)'
              } : {}}
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p 
                  className="text-green-800 dark:text-green-200"
                  style={getTypographyStyles('base')}
                >
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

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
             isMaterial ? 'Administra tu inventario con Business Management API' :
             'Manage your inventory with Business Management API'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleCreateProduct}
              style={isNeoBrutalism ? getButtonStyles('primary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'AÑADIR PRODUCTO' : 'Añadir Producto'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchProducts({ page: currentPage || 1, pageSize: 10 })}
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ACTUALIZAR' : 'Actualizar'}
            </Button>
          </div>
        </header>

        {/* Estadísticas */}
        <StatsCards />

        {/* Filtros y búsqueda */}
        <section style={getCardStyles()}>
          <div className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isNeoBrutalism ? "BUSCAR PRODUCTOS..." : "Buscar productos..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 p-3 border rounded-md bg-background text-foreground"
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
                className="p-3 border rounded-md bg-background text-foreground"
                style={isNeoBrutalism ? {
                  border: '3px solid var(--border)',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                } : {}}
              >
                <option value="all">{isNeoBrutalism ? 'TODAS LAS CATEGORÍAS' : 'Todas las categorías'}</option>
                <option value="Electronics">{isNeoBrutalism ? 'ELECTRÓNICOS' : 'Electrónicos'}</option>
                <option value="Clothing">{isNeoBrutalism ? 'ROPA' : 'Ropa'}</option>
                <option value="Home">{isNeoBrutalism ? 'HOGAR' : 'Hogar'}</option>
                <option value="Sports">{isNeoBrutalism ? 'DEPORTES' : 'Deportes'}</option>
              </select>

              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="p-3 border rounded-md bg-background text-foreground"
                style={isNeoBrutalism ? {
                  border: '3px solid var(--border)',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                } : {}}
              >
                <option value="all">{isNeoBrutalism ? 'TODO EL STOCK' : 'Todo el stock'}</option>
                <option value="in-stock">{isNeoBrutalism ? 'EN STOCK' : 'En stock'}</option>
                <option value="low-stock">{isNeoBrutalism ? 'POCO STOCK' : 'Poco stock'}</option>
                <option value="out-of-stock">{isNeoBrutalism ? 'SIN STOCK' : 'Sin stock'}</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-3 border rounded-md bg-background text-foreground"
                style={isNeoBrutalism ? {
                  border: '3px solid var(--border)',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                } : {}}
              >
                <option value="name">{isNeoBrutalism ? 'ORDENAR POR NOMBRE' : 'Ordenar por nombre'}</option>
                <option value="price">{isNeoBrutalism ? 'ORDENAR POR PRECIO' : 'Ordenar por precio'}</option>
                <option value="stock">{isNeoBrutalism ? 'ORDENAR POR STOCK' : 'Ordenar por stock'}</option>
                <option value="category">{isNeoBrutalism ? 'ORDENAR POR CATEGORÍA' : 'Ordenar por categoría'}</option>
              </select>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('small')}
              >
                {sortedProducts.length} {isNeoBrutalism ? 'PRODUCTOS ENCONTRADOS' : 'productos encontrados'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={isNeoBrutalism ? getButtonStyles('small') : {}}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                {sortOrder === 'asc' ? 
                  (isNeoBrutalism ? 'ASC' : 'Ascendente') : 
                  (isNeoBrutalism ? 'DESC' : 'Descendente')
                }
                {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 ml-2" /> : <TrendingDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </section>

        {/* Lista de productos */}
        <section>
          {sortedProducts.length === 0 ? (
            <Card style={getCardStyles()}>
              <CardContent className="p-20 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 
                  className="text-muted-foreground mb-2"
                  style={getTypographyStyles('heading')}
                >
                  {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
                </h3>
                <p 
                  className="text-muted-foreground mb-4"
                  style={getTypographyStyles('base')}
                >
                  {isNeoBrutalism ? 'INTENTA AJUSTAR LOS FILTROS O CREAR UN NUEVO PRODUCTO' : 
                   'Intenta ajustar los filtros o crear un nuevo producto'}
                </p>
                <Button
                  onClick={handleCreateProduct}
                  style={isNeoBrutalism ? getButtonStyles('primary') : {}}
                  onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                  onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {isNeoBrutalism ? 'CREAR PRIMER PRODUCTO' : 'Crear primer producto'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Paginación placeholder */}
        {sortedProducts.length > 0 && (
          <section className="flex justify-center items-center gap-4 py-8">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              {isNeoBrutalism ? 'ANTERIOR' : 'Anterior'}
            </Button>
            <span 
              className="text-muted-foreground"
              style={getTypographyStyles('base')}
            >
              Página {currentPage || 1} de {totalPages || 1}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              {isNeoBrutalism ? 'SIGUIENTE' : 'Siguiente'}
            </Button>
          </section>
        )}

        {/* Footer con acciones adicionales */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="outline"
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Layers className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'GESTIÓN MASIVA' : 'Gestión Masiva'}
            </Button>
            <Button
              variant="outline"
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Tag className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ETIQUETAS' : 'Etiquetas'}
            </Button>
            <Button
              variant="outline"
              style={isNeoBrutalism ? getButtonStyles('secondary') : {}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
            </Button>
          </div>
        </footer>

      </div>

      {/* Modales */}
      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={editingProduct}
          onSuccess={handleProductModalSuccess}
        />
      )}

      {showDetailModal && (
        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {showDeleteModal && (
        <DeleteProductModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          product={selectedProduct}
          onSuccess={handleDeleteModalSuccess}
        />
      )}
    </div>
  );
};

export default Products;
