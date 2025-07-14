/**
 * Página Products optimizada para Neo-Brutalism
 * Sistema de gestión de productos con diseño brutal, grid responsivo y filtros avanzados
 * Incluye helper functions específicas para estilo Neo-Brutalist
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
  
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistCardStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 200ms ease',
    overflow: 'hidden'
  });

  const getBrutalistHeaderStyles = (colorVar = '--brutalist-lime') => ({
    background: `var(${colorVar})`,
    color: colorVar === '--brutalist-lime' ? '#000000' : '#ffffff',
    padding: '16px',
    border: 'none',
    borderBottom: '4px solid var(--border)',
    margin: '-1px -1px 0 -1px'
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
        letterSpacing: '0.025em'
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
        letterSpacing: '0.025em'
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
        letterSpacing: '0.025em'
      },
      electronics: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      },
      clothing: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      },
      home: {
        background: 'var(--brutalist-green)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      },
      sports: {
        background: 'var(--brutalist-orange)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase'
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
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      danger: {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      small: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        borderRadius: '0px',
        padding: '6px 12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.025em',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  const getBrutalistInputStyles = () => ({
    background: 'var(--background)',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    transition: 'all 150ms ease'
  });

  const getBrutalistGridLayout = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '2rem',
    padding: '2rem 0'
  });

  const getBrutalistIconBackground = (colorVar) => ({
    background: `var(${colorVar})`,
    border: '2px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

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

  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': '--brutalist-blue',
      'Clothing': '--brutalist-purple',
      'Home': '--brutalist-green',
      'Sports': '--brutalist-orange'
    };
    return colors[category] || '--brutalist-lime';
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    const matchesStock = selectedStock === 'all' || 
                        (selectedStock === 'in-stock' && product.stock > 10) ||
                        (selectedStock === 'low-stock' && product.stock <= 10 && product.stock > 0) ||
                        (selectedStock === 'out-of-stock' && product.stock === 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleCardHover = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(-3px, -3px)';
      e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleCardLeave = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      const baseBoxShadow = e.target.classList.contains('small-button') ? 
                           '3px 3px 0px 0px rgba(0,0,0,1)' : 
                           '4px 4px 0px 0px rgba(0,0,0,1)';
      e.target.style.boxShadow = baseBoxShadow;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div 
              className="text-primary"
              style={getBrutalistTypography('heading')}
            >
              CARGANDO PRODUCTOS...
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
              style={getBrutalistTypography('heading')}
            >
              ERROR AL CARGAR
            </div>
            <p style={getBrutalistTypography('base')}>
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
        
        {/* Header Neo-Brutalist */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getBrutalistTypography('title')}
          >
            GESTIÓN DE PRODUCTOS
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto mb-8"
            style={getBrutalistTypography('base')}
          >
            ADMINISTRA TU INVENTARIO CON ESTILO NEO-BRUTALIST
          </p>
          
          {/* Botones de acción principal */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getBrutalistButtonStyles('primary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Plus className="w-5 h-5 mr-2" />
              AÑADIR PRODUCTO
            </button>
            <button
              style={getBrutalistButtonStyles('secondary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              ANALYTICS
            </button>
          </div>
        </header>

        {/* Panel de filtros y búsqueda */}
        <section 
          className="p-6"
          style={getBrutalistCardStyles()}
        >
          <div className="grid md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="BUSCAR PRODUCTOS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12"
                style={{
                  ...getBrutalistInputStyles(),
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}
                onFocus={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(-2px, -2px)';
                    e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
                  }
                }}
                onBlur={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(0px, 0px)';
                    e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
                  }
                }}
              />
            </div>

            {/* Filtro por categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                ...getBrutalistInputStyles(),
                textTransform: 'uppercase',
                fontWeight: '600'
              }}
            >
              <option value="all">TODAS LAS CATEGORÍAS</option>
              <option value="Electronics">ELECTRÓNICOS</option>
              <option value="Clothing">ROPA</option>
              <option value="Home">HOGAR</option>
              <option value="Sports">DEPORTES</option>
            </select>

            {/* Filtro por stock */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              style={{
                ...getBrutalistInputStyles(),
                textTransform: 'uppercase',
                fontWeight: '600'
              }}
            >
              <option value="all">TODO EL STOCK</option>
              <option value="in-stock">EN STOCK</option>
              <option value="low-stock">POCO STOCK</option>
              <option value="out-of-stock">SIN STOCK</option>
            </select>

            {/* Estadísticas rápidas */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getBrutalistTypography('heading')}
                >
                  {filteredProducts.length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('small')}
                >
                  PRODUCTOS
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getBrutalistTypography('heading')}
                >
                  {filteredProducts.filter(p => p.stock <= 10).length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('small')}
                >
                  ALERTAS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de productos con estilo Neo-Brutalist */}
        <section style={getBrutalistGridLayout()}>
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground"
                style={getBrutalistTypography('heading')}
              >
                NO SE ENCONTRARON PRODUCTOS
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const StockIcon = getStockIcon(stockStatus);
              const categoryColor = getCategoryColor(product.category);
              
              return (
                <div
                  key={product.id}
                  className="cursor-pointer"
                  style={getBrutalistCardStyles()}
                  onMouseEnter={handleCardHover}
                  onMouseLeave={handleCardLeave}
                >
                  {/* Header de la card */}
                  <div style={getBrutalistHeaderStyles(categoryColor)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={getBrutalistIconBackground('--background')}>
                          <Package className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <h3 style={getBrutalistTypography('subheading')}>
                            {product.name}
                          </h3>
                          <div style={getBrutalistBadgeStyles(product.category.toLowerCase())}>
                            {product.category}
                          </div>
                        </div>
                      </div>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: categoryColor === '--brutalist-lime' ? '#000000' : '#ffffff',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido de la card */}
                  <div className="p-6 space-y-4">
                    
                    {/* Descripción */}
                    <p 
                      className="text-muted-foreground"
                      style={getBrutalistTypography('base')}
                    >
                      {product.description}
                    </p>

                    {/* Precio y stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div 
                          className="text-foreground"
                          style={getBrutalistTypography('price')}
                        >
                          ${product.price}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getBrutalistTypography('small')}
                        >
                          PRECIO
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StockIcon className={`w-5 h-5 ${
                            stockStatus === 'sin-stock' ? 'text-red-500' :
                            stockStatus === 'poco-stock' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span 
                            className="text-foreground"
                            style={getBrutalistTypography('subheading')}
                          >
                            {product.stock}
                          </span>
                        </div>
                        <div style={getBrutalistBadgeStyles(stockStatus)}>
                          {stockStatus === 'sin-stock' ? 'SIN STOCK' :
                           stockStatus === 'poco-stock' ? 'POCO STOCK' :
                           'EN STOCK'}
                        </div>
                      </div>
                    </div>

                    {/* Métricas adicionales */}
                    <div 
                      className="grid grid-cols-2 gap-3 pt-4"
                      style={{
                        borderTop: '2px solid var(--border)'
                      }}
                    >
                      <div className="text-center">
                        <div 
                          className="text-foreground"
                          style={getBrutalistTypography('subheading')}
                        >
                          {product.sold || 0}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getBrutalistTypography('small')}
                        >
                          VENDIDOS
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < (product.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getBrutalistTypography('small')}
                        >
                          RATING
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4">
                      <button
                        style={getBrutalistButtonStyles('small')}
                        onMouseEnter={handleButtonHover}
                        onMouseLeave={handleButtonLeave}
                        className="flex-1 small-button"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        EDITAR
                      </button>
                      <button
                        style={{...getBrutalistButtonStyles('small'), background: 'var(--brutalist-orange)'}}
                        onMouseEnter={handleButtonHover}
                        onMouseLeave={handleButtonLeave}
                        className="flex-1 small-button"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        VENDER
                      </button>
                      <button
                        style={{...getBrutalistButtonStyles('small'), background: 'var(--brutalist-pink)'}}
                        onMouseEnter={handleButtonHover}
                        onMouseLeave={handleButtonLeave}
                        onClick={() => deleteProduct(product.id)}
                        className="small-button"
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

        {/* Footer de acciones avanzadas */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getBrutalistButtonStyles('secondary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Layers className="w-5 h-5 mr-2" />
              GESTIÓN MASIVA
            </button>
            <button
              style={{...getBrutalistButtonStyles('primary'), background: 'var(--brutalist-purple)'}}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Tag className="w-5 h-5 mr-2" />
              ETIQUETAS
            </button>
            <button
              style={{...getBrutalistButtonStyles('primary'), background: 'var(--brutalist-orange)'}}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Zap className="w-5 h-5 mr-2" />
              AUTOMATIZACIÓN
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Products;
