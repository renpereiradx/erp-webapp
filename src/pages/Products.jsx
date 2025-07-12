/**
 * Página de Productos del sistema ERP
 * Demuestra el uso de Zustand store, componentes responsive y gestión de estado
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
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';

const Products = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  
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

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Datos para las estadísticas (usar los productos del store)
  const statsData = {
    total: products.length,
    inStock: products.filter(p => p.stock > p.minStock).length,
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
        // Mostrar notificación de éxito
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const getStatusIcon = (status, stock, minStock) => {
    if (status === 'out_of_stock' || stock === 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (status === 'low_stock' || stock <= minStock) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (status, stock, minStock) => {
    if (status === 'out_of_stock' || stock === 0) {
      return 'Sin Stock';
    } else if (status === 'low_stock' || stock <= minStock) {
      return 'Stock Bajo';
    }
    return 'En Stock';
  };

  const ProductCard = ({ product, isNeoBrutalism }) => (
    <Card className="product-card hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6 pt-4">
        <div className="flex items-center space-x-4">
          {/* Imagen del producto */}
          <div 
            className={`w-16 h-16 flex-shrink-0 flex items-center justify-center bg-muted ${
              isNeoBrutalism ? '' : 'rounded-lg'
            }`}
          >
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  SKU: {product.sku}
                </p>
                <p className="text-sm text-muted-foreground">
                  Categoría: {product.category}
                </p>
              </div>
              
              {/* Estado del producto */}
              <div className="flex items-center space-x-1.5 ml-3 flex-shrink-0">
                {getStatusIcon(product.status, product.stock, product.minStock)}
                <span className="text-xs font-medium text-foreground">
                  {getStatusText(product.status, product.stock, product.minStock)}
                </span>
              </div>
            </div>
            
            {/* Precio y stock */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-lg font-bold text-foreground mb-1 flex items-center">
                  ${product.price}
                </p>
                <p className="text-sm text-muted-foreground flex items-center">
                  Stock: <span className="font-medium text-foreground ml-1">{product.stock}</span> unidades
                </p>
              </div>
              
              {/* Acciones */}
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="products-page space-y-6 w-full max-w-full overflow-x-hidden" data-component="products-page" data-testid="products-page">
      {/* Header */}
      <div className="products-header flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4" data-component="products-header" data-testid="products-header">
        <div className="products-title-section" data-component="products-title" data-testid="products-title">
          <h1 className={`products-title text-2xl sm:text-3xl tracking-tight ${
            isNeoBrutalism ? 'font-black uppercase tracking-wide' : 'font-bold'
          } text-foreground`} data-testid="products-title-text">Productos</h1>
          <p className={`products-subtitle mt-1 text-sm sm:text-base ${
            isNeoBrutalism ? 'font-bold uppercase tracking-wide' : 'font-normal'
          } text-muted-foreground`} data-testid="products-subtitle">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button className="products-new-btn w-full sm:w-auto whitespace-nowrap" data-testid="new-product-btn">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Producto</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="products-search-section" data-component="products-search" data-testid="products-search">
        <CardContent className="p-4">
          <div className="products-search-controls flex flex-col sm:flex-row gap-4" data-component="search-controls" data-testid="search-controls">
            {/* Búsqueda */}
            <div className="products-search-input-section flex-1" data-component="search-input-section" data-testid="search-input-section">
              <Input
                placeholder="Buscar productos por nombre, SKU o categoría..."
                leftIcon={<Search className="h-4 w-4" />}
                onChange={(e) => handleSearch(e.target.value)}
                className="products-search-input"
                data-testid="products-search-input"
              />
            </div>
            
            {/* Botón de filtros */}
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
          
          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Categoría
                </label>
                <select 
                  className="w-full p-2 border rounded-md bg-input text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories?.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Estado
                </label>
                <select 
                  className="w-full p-2 border rounded-md bg-input text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="active">En Stock</option>
                  <option value="low_stock">Stock Bajo</option>
                  <option value="out_of_stock">Sin Stock</option>
                </select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Ordenar por
                </label>
                <select 
                  className="w-full p-2 border rounded-md bg-input text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="name">Nombre</option>
                  <option value="price">Precio</option>
                  <option value="stock">Stock</option>
                  <option value="category">Categoría</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="products-stats-grid">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : pagination.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Productos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : statsData.inStock}
                </p>
                <p className="text-sm text-muted-foreground">
                  En Stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : statsData.lowStock}
                </p>
                <p className="text-sm text-muted-foreground">
                  Stock Bajo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : statsData.outOfStock}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sin Stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span>Cargando productos...</span>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-destructive">
                Error: {error}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No se encontraron productos
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} isNeoBrutalism={isNeoBrutalism} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {products.length} de {pagination.total} productos
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Products;

