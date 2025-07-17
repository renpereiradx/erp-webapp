/**
 * Página Products - Multi-tema optimizada
 * Sistema de gestión de productos con soporte completo para Neo-Brutalism, Material Design y Fluent Design
 * Incluye helper functions específicas para cada sistema de diseño
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';

const Products = () => {
  const { theme } = useTheme();
  const { products, loading, error, fetchProducts, deleteProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  
  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistCardStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 200ms ease',
    overflow: 'hidden'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
      },
      heading: {
        fontSize: '1.5rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      subheading: {
        fontSize: '1.125rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      base: {
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      price: {
        fontSize: '1.25rem',
        fontWeight: '900',
        letterSpacing: '0.025em'
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistBadgeStyles = (type) => {
    const badges = {
      'en-stock': {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'poco-stock': {
        background: 'var(--brutalist-orange)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'sin-stock': {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    };
    return badges[type] || badges['en-stock'];
  };

  const getBrutalistButtonStyles = (variant = 'primary') => {
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
  };

  // Helper functions universales que se adaptan al tema activo
  const getCardStyles = () => {
    if (isNeoBrutalism) return getBrutalistCardStyles();
    if (isMaterial) return {
      background: 'var(--md-sys-color-surface)',
      borderRadius: 'var(--md-corner-large, 16px)',
      boxShadow: 'var(--md-elevation-1)',
      transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      overflow: 'hidden'
    };
    if (isFluent) return {
      background: 'var(--fluent-control-fill-default)',
      borderRadius: 'var(--fluent-control-corner-radius, 8px)',
      border: '1px solid var(--fluent-control-stroke-default)',
      transition: 'all 100ms cubic-bezier(0.1, 0.9, 0.2, 1)',
      overflow: 'hidden'
    };
    return getBrutalistCardStyles();
  };

  const getTypographyStyles = (level = 'base') => {
    if (isNeoBrutalism) return getBrutalistTypography(level);
    if (isMaterial) return {
      fontSize: level === 'title' ? '2rem' : level === 'heading' ? '1.5rem' : level === 'subheading' ? '1.125rem' : level === 'price' ? '1.25rem' : level === 'small' ? '0.75rem' : '0.875rem',
      fontWeight: level === 'title' ? '500' : level === 'heading' ? '500' : level === 'price' ? '600' : '400',
      fontFamily: 'Roboto, sans-serif',
      letterSpacing: '0.00938em',
      color: 'var(--md-sys-color-on-surface)'
    };
    if (isFluent) return {
      fontSize: level === 'title' ? '2rem' : level === 'heading' ? '1.5rem' : level === 'subheading' ? '1.125rem' : level === 'price' ? '1.25rem' : level === 'small' ? '0.75rem' : '0.875rem',
      fontWeight: level === 'title' ? '600' : level === 'heading' ? '600' : level === 'price' ? '600' : '400',
      fontFamily: 'Segoe UI, sans-serif',
      color: 'var(--fluent-text-primary)'
    };
    return getBrutalistTypography(level);
  };

  const getBadgeStyles = (type) => {
    if (isNeoBrutalism) return getBrutalistBadgeStyles(type);
    if (isMaterial) return {
      background: type === 'en-stock' ? 'var(--md-sys-color-primary)' : type === 'poco-stock' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-error)',
      color: type === 'en-stock' ? 'var(--md-sys-color-on-primary)' : type === 'poco-stock' ? 'var(--md-sys-color-on-secondary)' : 'var(--md-sys-color-on-error)',
      borderRadius: 'var(--md-corner-small, 4px)',
      padding: '4px 8px',
      fontSize: '0.75rem',
      fontWeight: '500',
      minWidth: '90px',
      width: '90px',
      maxWidth: '90px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    };
    if (isFluent) return {
      background: type === 'en-stock' ? 'var(--fluent-accent-default)' : type === 'poco-stock' ? 'var(--fluent-warning-default)' : 'var(--fluent-danger-default)',
      color: 'white',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '0.75rem',
      fontWeight: '400',
      minWidth: '90px',
      width: '90px',
      maxWidth: '90px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    };
    return getBrutalistBadgeStyles(type);
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return getBrutalistButtonStyles(variant);
    if (isMaterial) return {
      background: variant === 'primary' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
      color: variant === 'primary' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
      borderRadius: 'var(--md-corner-full, 24px)',
      padding: variant === 'small' ? '8px 16px' : '12px 24px',
      fontSize: variant === 'small' ? '0.75rem' : '0.875rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
    if (isFluent) return {
      background: variant === 'primary' ? 'var(--fluent-accent-default)' : 'var(--fluent-control-fill-default)',
      color: variant === 'primary' ? 'var(--fluent-text-on-accent-primary)' : 'var(--fluent-text-primary)',
      borderRadius: '4px',
      padding: variant === 'small' ? '6px 12px' : '8px 16px',
      fontSize: variant === 'small' ? '0.75rem' : '0.875rem',
      fontWeight: '400',
      border: '1px solid var(--fluent-control-stroke-default)',
      cursor: 'pointer',
      transition: 'all 100ms cubic-bezier(0.1, 0.9, 0.2, 1)'
    };
    return getBrutalistButtonStyles(variant);
  };

  // useEffect para cargar productos
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Funciones de utilidad para productos
  const getStockStatus = (stock) => {
    if (stock === 0) return 'sin-stock';
    if (stock <= 10) return 'poco-stock';
    return 'en-stock';
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'sin-stock': return AlertTriangle;
      case 'poco-stock': return TrendingDown;
      default: return TrendingUp;
    }
  };

  // Funciones de eventos
  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
    }
  };

  // Lógica de filtrado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           product.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const stockStatus = getStockStatus(product.stock);
    const matchesStock = selectedStock === 'all' ||
                        (selectedStock === 'in-stock' && stockStatus === 'en-stock') ||
                        (selectedStock === 'low-stock' && stockStatus === 'poco-stock') ||
                        (selectedStock === 'out-of-stock' && stockStatus === 'sin-stock');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div 
              className="text-primary"
              style={getTypographyStyles('heading')}
            >
              {isNeoBrutalism ? 'CARGANDO PRODUCTOS...' : 'Cargando productos...'}
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
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <div 
              className="text-red-500 mb-4"
              style={getTypographyStyles('heading')}
            >
              {isNeoBrutalism ? 'ERROR AL CARGAR' : 'Error al cargar'}
            </div>
            <p style={getTypographyStyles('base')}>
              {error}
            </p>
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
            {isNeoBrutalism ? 'ADMINISTRA TU INVENTARIO CON ESTILO NEO-BRUTALIST' :
             isMaterial ? 'Administra tu inventario con Material Design' :
             'Manage your inventory with Fluent Design'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getButtonStyles('primary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'AÑADIR PRODUCTO' : 'Añadir Producto'}
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

        {/* Panel de filtros */}
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
              <option value="Electronics">{isNeoBrutalism ? 'ELECTRÓNICOS' : 'Electrónicos'}</option>
              <option value="Clothing">{isNeoBrutalism ? 'ROPA' : 'Ropa'}</option>
              <option value="Home">{isNeoBrutalism ? 'HOGAR' : 'Hogar'}</option>
              <option value="Sports">{isNeoBrutalism ? 'DEPORTES' : 'Deportes'}</option>
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
              <option value="all">{isNeoBrutalism ? 'TODO EL STOCK' : 'Todo el stock'}</option>
              <option value="in-stock">{isNeoBrutalism ? 'EN STOCK' : 'En stock'}</option>
              <option value="low-stock">{isNeoBrutalism ? 'POCO STOCK' : 'Poco stock'}</option>
              <option value="out-of-stock">{isNeoBrutalism ? 'SIN STOCK' : 'Sin stock'}</option>
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

        {/* Grid de productos */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const StockIcon = getStockIcon(stockStatus);
              
              return (
                <div
                  key={product.id}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  style={getCardStyles()}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 style={getTypographyStyles('subheading')}>
                        {product.name}
                      </h3>
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <p 
                      className="text-muted-foreground"
                      style={getTypographyStyles('base')}
                    >
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <div 
                          className="text-foreground font-bold"
                          style={getTypographyStyles('price')}
                        >
                          ${product.price}
                        </div>
                        <div 
                          className="text-muted-foreground text-sm"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'PRECIO' : 'Precio'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <StockIcon className={`w-4 h-4 ${
                            stockStatus === 'sin-stock' ? 'text-red-500' :
                            stockStatus === 'poco-stock' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span style={getTypographyStyles('base')}>{product.stock}</span>
                        </div>
                        <div style={getBadgeStyles(stockStatus)}>
                          {stockStatus === 'sin-stock' ? (isNeoBrutalism ? 'SIN STOCK' : 'Sin stock') :
                           stockStatus === 'poco-stock' ? (isNeoBrutalism ? 'POCO STOCK' : 'Poco stock') :
                           (isNeoBrutalism ? 'EN STOCK' : 'En stock')}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        style={getButtonStyles('small')}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                      </button>
                      <button
                        style={{
                          ...getButtonStyles('small'), 
                          background: isMaterial ? 'var(--md-sys-color-error)' : 
                                     isFluent ? 'var(--fluent-danger-default)' : 
                                     'var(--brutalist-pink)'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getButtonStyles('secondary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Layers className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'GESTIÓN MASIVA' : 'Gestión Masiva'}
            </button>
            <button
              style={{...getButtonStyles('primary'), background: isMaterial ? 'var(--md-sys-color-tertiary)' : isFluent ? 'var(--fluent-accent-default)' : 'var(--brutalist-purple)'}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Tag className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ETIQUETAS' : 'Etiquetas'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Products;
