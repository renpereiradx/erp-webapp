/**
 * Página de Productos del sistema ERP
 * Demuestra el uso de Zustand store, componentes responsive y gestión de estado
 * Incluye listado, filtros, búsqueda y acciones CRUD
 */

import React, { useEffect, useState } from 'react';
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
  const {
    products,
    loading,
    error,
    pagination,
    filters,
    fetchProducts,
    deleteProduct,
    setFilters,
    clearError,
  } = useProductStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Datos de ejemplo para demostración (se usarían datos reales de la API)
  const mockProducts = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      sku: 'IPH15P-128',
      category: 'Electrónicos',
      price: 999.99,
      stock: 25,
      minStock: 10,
      status: 'active',
      image: '/api/placeholder/100/100',
      description: 'Smartphone Apple iPhone 15 Pro 128GB',
    },
    {
      id: 2,
      name: 'Laptop Dell XPS 13',
      sku: 'DELL-XPS13',
      category: 'Computadoras',
      price: 1299.99,
      stock: 8,
      minStock: 15,
      status: 'active',
      image: '/api/placeholder/100/100',
      description: 'Laptop Dell XPS 13 Intel i7 16GB RAM',
    },
    {
      id: 3,
      name: 'Auriculares Sony WH-1000XM4',
      sku: 'SONY-WH1000',
      category: 'Audio',
      price: 349.99,
      stock: 3,
      minStock: 20,
      status: 'low_stock',
      image: '/api/placeholder/100/100',
      description: 'Auriculares inalámbricos con cancelación de ruido',
    },
    {
      id: 4,
      name: 'Camiseta Nike Dri-FIT',
      sku: 'NIKE-DFIT-M',
      category: 'Ropa',
      price: 29.99,
      stock: 150,
      minStock: 50,
      status: 'active',
      image: '/api/placeholder/100/100',
      description: 'Camiseta deportiva Nike Dri-FIT talla M',
    },
    {
      id: 5,
      name: 'Mesa de Oficina IKEA',
      sku: 'IKEA-DESK-120',
      category: 'Muebles',
      price: 199.99,
      stock: 0,
      minStock: 5,
      status: 'out_of_stock',
      image: '/api/placeholder/100/100',
      description: 'Mesa de oficina IKEA 120x60cm color blanco',
    },
  ];

  // Simular carga de productos
  useEffect(() => {
    // En una aplicación real, esto cargaría datos de la API
    // fetchProducts();
    console.log('Cargando productos...');
  }, []);

  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
    // fetchProducts({ search: searchTerm });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ [filterName]: value });
    // fetchProducts({ [filterName]: value });
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

  const ProductCard = ({ product }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Imagen del producto */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          
          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              
              {/* Estado del producto */}
              <div className="flex items-center space-x-1 ml-2">
                {getStatusIcon(product.status, product.stock, product.minStock)}
                <span className="text-xs font-medium">
                  {getStatusText(product.status, product.stock, product.minStock)}
                </span>
              </div>
            </div>
            
            {/* Precio y stock */}
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">${product.price}</p>
                <p className="text-sm text-muted-foreground">
                  Stock: {product.stock} unidades
                </p>
              </div>
              
              {/* Acciones */}
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar productos por nombre, SKU o categoría..."
                leftIcon={<Search className="h-4 w-4" />}
                onChange={(e) => handleSearch(e.target.value)}
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
            <div className="mt-4 pt-4 border-t grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  <option value="Electrónicos">Electrónicos</option>
                  <option value="Computadoras">Computadoras</option>
                  <option value="Audio">Audio</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Muebles">Muebles</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="active">En Stock</option>
                  <option value="low_stock">Stock Bajo</option>
                  <option value="out_of_stock">Sin Stock</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ordenar por</label>
                <select 
                  className="w-full p-2 border rounded-md"
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockProducts.length}</p>
                <p className="text-sm text-muted-foreground">Total Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {mockProducts.filter(p => p.stock > p.minStock).length}
                </p>
                <p className="text-sm text-muted-foreground">En Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {mockProducts.filter(p => p.stock <= p.minStock && p.stock > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {mockProducts.filter(p => p.stock === 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4">
        {/* Vista de escritorio - Tabla */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Producto</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Categoría</th>
                      <th className="text-left p-2">Precio</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-sm">{product.sku}</td>
                        <td className="p-2 text-sm">{product.category}</td>
                        <td className="p-2 text-sm font-medium">${product.price}</td>
                        <td className="p-2 text-sm">{product.stock}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(product.status, product.stock, product.minStock)}
                            <span className="text-xs">
                              {getStatusText(product.status, product.stock, product.minStock)}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vista móvil - Cards */}
        <div className="md:hidden space-y-4">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {mockProducts.length} de {mockProducts.length} productos
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Products;

