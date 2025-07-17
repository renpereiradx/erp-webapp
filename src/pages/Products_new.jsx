/**
 * Página Products optimizada para multi-tema
 * Sistema de gestión de productos con soporte para Neo-Brutalism, Material Design y Fluent Design
 * Utiliza helpers centralizados para consistencia entre temas
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
import { 
  getThemeTypography, 
  getThemeCardStyles, 
  getThemeButtonStyles, 
  getThemeInputStyles,
  getThemeGridLayout,
  getThemeHoverEffects 
} from '@/utils/themeUtils';

const Products = () => {
  const { theme } = useTheme();
  const { products, loading, error, fetchProducts, deleteProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Funciones de utilidad para productos
  const getStockStatus = (stock) => {
    if (stock === 0) return 'sin-stock';
    if (stock <= 10) return 'poco-stock';
    return 'en-stock';
  };

  const getStockColor = (status) => {
    const isNeoBrutalist = theme?.includes('neo-brutalism');
    const isMaterial = theme?.includes('material');
    const isFluent = theme?.includes('fluent');

    if (isNeoBrutalist) {
      const colors = {
        'en-stock': { bg: '#00FF00', color: '#000000', border: '2px solid #000000' },
        'poco-stock': { bg: '#FFA500', color: '#000000', border: '2px solid #000000' },
        'sin-stock': { bg: '#FF0000', color: '#FFFFFF', border: '2px solid #000000' }
      };
      return colors[status] || colors['en-stock'];
    } else if (isMaterial) {
      const colors = {
        'en-stock': { bg: '#4CAF50', color: '#FFFFFF', border: 'none' },
        'poco-stock': { bg: '#FF9800', color: '#FFFFFF', border: 'none' },
        'sin-stock': { bg: '#F44336', color: '#FFFFFF', border: 'none' }
      };
      return colors[status] || colors['en-stock'];
    } else if (isFluent) {
      const colors = {
        'en-stock': { bg: '#107C10', color: '#FFFFFF', border: '1px solid transparent' },
        'poco-stock': { bg: '#F7630C', color: '#FFFFFF', border: '1px solid transparent' },
        'sin-stock': { bg: '#D13438', color: '#FFFFFF', border: '1px solid transparent' }
      };
      return colors[status] || colors['en-stock'];
    } else {
      const colors = {
        'en-stock': { bg: '#10B981', color: '#FFFFFF', border: '1px solid transparent' },
        'poco-stock': { bg: '#F59E0B', color: '#FFFFFF', border: '1px solid transparent' },
        'sin-stock': { bg: '#EF4444', color: '#FFFFFF', border: '1px solid transparent' }
      };
      return colors[status] || colors['en-stock'];
    }
  };

  const getStatusBadgeStyles = (status) => {
    const baseColor = getStockColor(status);
    const isNeoBrutalist = theme?.includes('neo-brutalism');

    return {
      ...baseColor,
      padding: isNeoBrutalist ? '4px 12px' : '4px 8px',
      borderRadius: isNeoBrutalist ? '0px' : theme?.includes('material') ? '16px' : '4px',
      fontSize: '0.75rem',
      fontWeight: isNeoBrutalist ? '800' : '500',
      textTransform: isNeoBrutalist ? 'uppercase' : 'none',
      letterSpacing: isNeoBrutalist ? '0.025em' : 'normal',
      boxShadow: isNeoBrutalist ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
      display: 'inline-block'
    };
  };

  const getPriceStyles = () => {
    const isNeoBrutalist = theme?.includes('neo-brutalism');
    const isMaterial = theme?.includes('material');
    const isFluent = theme?.includes('fluent');

    if (isNeoBrutalist) {
      return {
        background: '#8A2BE2',
        color: '#FFFFFF',
        padding: '8px 16px',
        border: '3px solid #000000',
        borderRadius: '0px',
        fontWeight: '900',
        fontSize: '1.25rem',
        letterSpacing: '0.025em',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        textAlign: 'center',
        textTransform: 'uppercase'
      };
    } else if (isMaterial) {
      return {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        padding: '8px 12px',
        borderRadius: '8px',
        fontWeight: '500',
        fontSize: '1.125rem',
        textAlign: 'center'
      };
    } else if (isFluent) {
      return {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var(--primary-foreground))',
        padding: '6px 12px',
        borderRadius: '4px',
        fontWeight: '400',
        fontSize: '1rem',
        textAlign: 'center'
      };
    } else {
      return {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontWeight: '500',
        fontSize: '1rem',
        textAlign: 'center'
      };
    }
  };

  // Filtros
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStock = selectedStock === 'all' || getStockStatus(product.stock) === selectedStock;
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={getThemeTypography('base', theme)}>Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p style={getThemeTypography('heading', theme)} className="text-red-600 mb-4">Error al cargar productos</p>
          <p style={getThemeTypography('base', theme)} className="text-muted-foreground">{error}</p>
          <Button 
            onClick={() => fetchProducts()}
            style={getThemeButtonStyles('primary', theme)}
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 
            style={getThemeTypography('title', theme)}
            className="text-4xl font-bold"
          >
            {theme?.includes('neo-brutalism') ? 'GESTIÓN DE PRODUCTOS' : 'Gestión de productos'}
          </h1>
          <p 
            style={getThemeTypography('subtitle', theme)}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            {theme?.includes('neo-brutalism') 
              ? 'ADMINISTRA TU INVENTARIO CON TOTAL CONTROL'
              : 'Administra tu inventario con total control'
            }
          </p>
        </section>

        {/* Controles y filtros */}
        <section className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={theme?.includes('neo-brutalism') ? 'BUSCAR PRODUCTOS...' : 'Buscar productos...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={getThemeInputStyles(theme)}
                className="pl-10"
              />
            </div>

            {/* Filtro de categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={getThemeInputStyles(theme)}
              className="min-w-[140px]"
            >
              <option value="all">{theme?.includes('neo-brutalism') ? 'TODAS' : 'Todas las categorías'}</option>
              <option value="electronics">{theme?.includes('neo-brutalism') ? 'ELECTRÓNICOS' : 'Electrónicos'}</option>
              <option value="clothing">{theme?.includes('neo-brutalism') ? 'ROPA' : 'Ropa'}</option>
              <option value="books">{theme?.includes('neo-brutalism') ? 'LIBROS' : 'Libros'}</option>
              <option value="home">{theme?.includes('neo-brutalism') ? 'HOGAR' : 'Hogar'}</option>
            </select>

            {/* Filtro de stock */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              style={getThemeInputStyles(theme)}
              className="min-w-[120px]"
            >
              <option value="all">{theme?.includes('neo-brutalism') ? 'TODO' : 'Todo stock'}</option>
              <option value="en-stock">{theme?.includes('neo-brutalism') ? 'EN STOCK' : 'En stock'}</option>
              <option value="poco-stock">{theme?.includes('neo-brutalism') ? 'POCO STOCK' : 'Poco stock'}</option>
              <option value="sin-stock">{theme?.includes('neo-brutalism') ? 'SIN STOCK' : 'Sin stock'}</option>
            </select>
          </div>
          
          <Button
            style={getThemeButtonStyles('primary', theme)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {theme?.includes('neo-brutalism') ? 'NUEVO PRODUCTO' : 'Nuevo producto'}
          </Button>
        </section>

        {/* Lista de productos */}
        <section>
          <h2 
            style={getThemeTypography('heading', theme)}
            className="text-2xl font-semibold mb-6 flex items-center gap-2"
          >
            <Package className="w-6 h-6" />
            {theme?.includes('neo-brutalism') ? 'PRODUCTOS REGISTRADOS' : 'Productos registrados'}
            <span className="text-sm text-muted-foreground">({filteredProducts.length})</span>
          </h2>
          
          <div style={getThemeGridLayout(theme)}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <div
                  key={product.id || index}
                  style={{
                    ...getThemeCardStyles(theme),
                    transition: 'all 0.2s ease-in-out'
                  }}
                  className="overflow-hidden cursor-pointer"
                  {...getThemeHoverEffects(theme)}
                >
                  {/* Header del producto */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h3 
                          style={getThemeTypography('subtitle', theme)}
                          className="text-lg font-semibold"
                        >
                          {product.name || `Producto ${index + 1}`}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          <span style={getThemeTypography('small', theme)}>
                            {product.category || 'Sin categoría'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          style={getThemeButtonStyles('secondary', theme)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span style={getThemeTypography('small', theme)} className="text-muted-foreground">
                          Stock:
                        </span>
                        <div className="flex items-center gap-2">
                          <span 
                            style={{
                              ...getStatusBadgeStyles(getStockStatus(product.stock))
                            }}
                          >
                            {product.stock || 0} {theme?.includes('neo-brutalism') ? 'UNIDADES' : 'unidades'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span style={getThemeTypography('small', theme)} className="text-muted-foreground">
                          Precio:
                        </span>
                        <div 
                          style={getPriceStyles()}
                        >
                          ${product.price?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {product.description && (
                        <div>
                          <span style={getThemeTypography('small', theme)} className="text-muted-foreground">
                            Descripción:
                          </span>
                          <p style={getThemeTypography('small', theme)} className="mt-1 text-sm">
                            {product.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer con acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        <span style={getThemeTypography('caption', theme)}>
                          SKU: {product.sku || `PRD-${String(index + 1).padStart(3, '0')}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          style={getThemeButtonStyles('primary', theme)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          {theme?.includes('neo-brutalism') ? 'VENDER' : 'Vender'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 
                  style={getThemeTypography('heading', theme)}
                  className="text-lg font-semibold mb-2"
                >
                  {theme?.includes('neo-brutalism') ? 'NO HAY PRODUCTOS' : 'No hay productos'}
                </h3>
                <p 
                  style={getThemeTypography('base', theme)}
                  className="text-muted-foreground mb-6"
                >
                  {searchTerm || selectedCategory !== 'all' || selectedStock !== 'all'
                    ? theme?.includes('neo-brutalism')
                      ? 'NO SE ENCONTRARON PRODUCTOS CON ESTOS FILTROS'
                      : 'No se encontraron productos con estos filtros'
                    : theme?.includes('neo-brutalism')
                      ? 'AGREGA TU PRIMER PRODUCTO PARA COMENZAR'
                      : 'Agrega tu primer producto para comenzar'
                  }
                </p>
                <Button
                  style={getThemeButtonStyles('primary', theme)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {theme?.includes('neo-brutalism') ? 'AGREGAR PRODUCTO' : 'Agregar producto'}
                </Button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Products;
