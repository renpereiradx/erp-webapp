/**
 * Página de Productos del sistema ERP - Multi-tema
 * Soporte para Neo-Brutalism, Material Design y Fluent Design
 * Incluye listado, filtros, búsqueda y acciones CRUD
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  DollarSign,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';

const Products = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');
  
  const {
    products,
    loading,
    error,
    pagination,
    filters,
    categories,
    fetchProducts,
    deleteProduct,
    setFilters,
    clearError,
  } = useProductStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalism) {
      switch(size) {
        case 'display': return 'font-black uppercase tracking-wide text-4xl';
        case 'large-title': return 'font-black uppercase tracking-wide text-3xl';
        case 'title': return 'font-black uppercase tracking-wide text-xl';
        case 'subtitle': return 'font-black uppercase tracking-wide text-lg';
        case 'body-large': return 'font-bold uppercase tracking-wide text-base';
        case 'body': return 'font-bold uppercase tracking-wide text-sm';
        case 'caption': return 'font-bold uppercase tracking-wide text-xs';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluent) {
      switch(size) {
        case 'display': return 'fluent-display';
        case 'large-title': return 'fluent-large-title';
        case 'title': return 'fluent-title';
        case 'subtitle': return 'fluent-subtitle';
        case 'body-large': return 'fluent-body-large';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        case 'caption-strong': return 'fluent-caption-strong';
        default: return 'fluent-title';
      }
    }
    if (isMaterial) {
      switch(size) {
        case 'display': return 'material-display';
        case 'large-title': return 'material-headline-large';
        case 'title': return 'material-headline-medium';
        case 'subtitle': return 'material-headline-small';
        case 'body-large': return 'material-body-large';
        case 'body': return 'material-body-medium';
        case 'caption': return 'material-body-small';
        default: return 'material-headline-medium';
      }
    }
    return 'font-bold';
  };

  const getCardClass = () => {
    if (isNeoBrutalism) return 'border-4 border-foreground shadow-neo-brutal';
    if (isFluent) return 'fluent-elevation-2 fluent-radius-medium fluent-motion-standard';
    if (isMaterial) return 'material-card-elevated';
    return 'border border-border rounded-lg shadow-lg';
  };

  const getButtonClass = () => {
    if (isFluent) return 'fluent-elevation-2 fluent-radius-small';
    if (isMaterial) return 'material-button-elevated';
    return '';
  };

  const getInputClass = () => {
    if (isFluent) return 'fluent-radius-small';
    if (isMaterial) return 'material-input';
    return '';
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Datos para estadísticas
  const statsData = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    lowStock: products.filter(p => p.stock <= p.minStock && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
    fetchProducts({ search: searchTerm });
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { [filterName]: value };
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const getStockStatus = (product) => {
    if (product.stock <= 0) {
      return { icon: XCircle, color: 'text-red-500', label: 'Sin stock', bg: 'bg-red-100 dark:bg-red-900' };
    } else if (product.stock <= product.minStock) {
      return { icon: AlertCircle, color: 'text-yellow-500', label: 'Stock bajo', bg: 'bg-yellow-100 dark:bg-yellow-900' };
    } else {
      return { icon: CheckCircle, color: 'text-green-500', label: 'En stock', bg: 'bg-green-100 dark:bg-green-900' };
    }
  };

  const getStatusBadge = (product) => {
    const stockStatus = getStockStatus(product);
    const Icon = stockStatus.icon;

    if (isFluent) {
      let bgStyle = {};
      if (product.stock <= 0) {
        bgStyle = { backgroundColor: 'var(--fluent-semantic-danger)' };
      } else if (product.stock <= product.minStock) {
        bgStyle = { backgroundColor: 'var(--fluent-semantic-warning)' };
      } else {
        bgStyle = { backgroundColor: 'var(--fluent-semantic-success)' };
      }
      
      return (
        <span 
          className={`px-2 py-1 text-xs font-medium text-white fluent-radius-small ${getTitleClass('caption')}`}
          style={bgStyle}
        >
          {stockStatus.label}
        </span>
      );
    }
    
    if (isMaterial) {
      let bgStyle = {};
      if (product.stock <= 0) {
        bgStyle = { backgroundColor: 'var(--material-error, #B00020)', color: 'white' };
      } else if (product.stock <= product.minStock) {
        bgStyle = { backgroundColor: '#FF9800', color: 'white' };
      } else {
        bgStyle = { backgroundColor: '#4CAF50', color: 'white' };
      }
      
      return (
        <span 
          className={`px-2 py-1 text-xs font-medium rounded-full ${getTitleClass('caption')}`}
          style={bgStyle}
        >
          {stockStatus.label}
        </span>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color} ${getTitleClass('caption')}`}>
        {stockStatus.label}
      </span>
    );
  };

  const ProductCard = ({ product }) => {
    const stockStatus = getStockStatus(product);
    const Icon = stockStatus.icon;

    return (
      <Card className={`hover:shadow-lg transition-all duration-200 ${getCardClass()}`}
            style={isFluent ? { 
              transition: 'all 0.1s var(--fluent-curve-easy-ease)',
              transform: 'translateY(0px)'
            } : isMaterial ? {
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0px)'
            } : {}}
            onMouseEnter={(e) => {
              if (isFluent) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--fluent-shadow-8)';
              } else if (isMaterial) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--material-elevation-8)';
              }
            }}
            onMouseLeave={(e) => {
              if (isFluent) {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = 'var(--fluent-shadow-2)';
              } else if (isMaterial) {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = 'var(--material-elevation-2)';
              }
            }}
      >
        <CardContent className="p-4">
          {/* Imagen del producto */}
          <div className={`mb-3 h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${
            isFluent ? 'fluent-radius-small' : 
            isMaterial ? 'rounded-lg' :
            'rounded-lg'
          }`} style={isFluent ? { backgroundColor: 'var(--fluent-neutral-grey-20)' } : 
                      isMaterial ? { backgroundColor: 'var(--material-surface-variant)' } : {}}>
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className={`h-full w-full object-cover ${
                  isFluent ? 'fluent-radius-small' : 
                  isMaterial ? 'rounded-lg' :
                  'rounded-lg'
                }`}
              />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          
          {/* Header con nombre y estado */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${getTitleClass('subtitle')}`}>{product.name}</h3>
              <p className={`text-muted-foreground text-sm truncate ${getTitleClass('caption')}`}>{product.description}</p>
            </div>
            <div className="flex-shrink-0 ml-2">
              {getStatusBadge(product)}
            </div>
          </div>
          
          {/* Información principal */}
          <div className="space-y-2 mb-3">
            <div className={`flex items-center justify-between text-sm ${getTitleClass('caption')}`}>
              <span className="text-muted-foreground">Precio:</span>
              <span className={`font-semibold text-foreground ${getTitleClass('body')}`}>${product.price.toFixed(2)}</span>
            </div>
            
            <div className={`flex items-center justify-between text-sm ${getTitleClass('caption')}`}>
              <span className="text-muted-foreground">Stock:</span>
              <span className={`font-semibold text-foreground ${getTitleClass('body')}`}>{product.stock} unidades</span>
            </div>
            
            <div className={`flex items-center justify-between text-sm ${getTitleClass('caption')}`}>
              <span className="text-muted-foreground">Categoría:</span>
              <span className={`font-semibold text-foreground truncate ml-2 ${getTitleClass('body')}`}>{product.category}</span>
            </div>
          </div>
          
          {/* Footer con SKU y acciones */}
          <div className={`flex items-center justify-between pt-3 border-t ${
            isFluent ? '' : 
            isMaterial ? '' :
            'border-gray-100 dark:border-gray-700'
          }`} style={isFluent ? { borderColor: 'var(--fluent-neutral-grey-30)' } : 
                     isMaterial ? { borderColor: 'var(--material-outline-variant)' } : {}}>
            <div className={`text-muted-foreground text-xs ${getTitleClass('caption')}`}>
              SKU: {product.sku}
            </div>
            <div className="flex items-center space-x-1">
              <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${getButtonClass()}`}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${getButtonClass()}`}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`h-7 w-7 p-0 ${getButtonClass()}`}
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center ${getTitleClass('body-large')}`}>
          Cargando productos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center text-red-500 min-h-screen flex items-center justify-center ${getTitleClass('body-large')}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-foreground ${getTitleClass('large-title')}`}>
            Productos
          </h1>
          <p className={`mt-2 text-muted-foreground ${getTitleClass('body-large')}`}>
            Gestiona tu inventario y catálogo de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="blue" size="lg" className={getButtonClass()}>
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Total Productos</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>En Stock</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.inStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Stock Bajo</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Sin Stock</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className={getCardClass()}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  className={`pl-10 ${getInputClass()}`}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={getButtonClass()}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className={`mt-4 p-4 border-t ${
              isFluent ? '' : 
              isMaterial ? '' :
              'border-gray-200 dark:border-gray-700'
            }`} style={isFluent ? { borderColor: 'var(--fluent-neutral-grey-30)' } : 
                       isMaterial ? { borderColor: 'var(--material-outline-variant)' } : {}}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={`block mb-2 ${getTitleClass('caption-strong')}`}>Categoría</label>
                  <select
                    className={`w-full p-2 border rounded-md bg-background text-foreground ${getInputClass()}`}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block mb-2 ${getTitleClass('caption-strong')}`}>Estado de Stock</label>
                  <select
                    className={`w-full p-2 border rounded-md bg-background text-foreground ${getInputClass()}`}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="inStock">En Stock</option>
                    <option value="lowStock">Stock Bajo</option>
                    <option value="outOfStock">Sin Stock</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => fetchProducts({ page: pagination.currentPage - 1 })}
            className={getButtonClass()}
          >
            Anterior
          </Button>
          <span className={`px-4 py-2 ${getTitleClass('body')}`}>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchProducts({ page: pagination.currentPage + 1 })}
            className={getButtonClass()}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
};

export default Products;
