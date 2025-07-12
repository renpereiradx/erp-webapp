/**
 * Store de Zustand para la gestión de productos en el ERP
 * Incluye estado local y funciones para interactuar con la API
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';

// Datos mock para demostración
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
    barcode: '123456789012',
    supplier: 'Apple Inc.',
    location: 'A-1-01',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  },
  {
    id: 2,
    name: 'Laptop Dell XPS 13',
    sku: 'DELL-XPS13',
    category: 'Computadoras',
    price: 1299.99,
    stock: 8,
    minStock: 15,
    status: 'low_stock',
    image: '/api/placeholder/100/100',
    description: 'Laptop Dell XPS 13 Intel i7 16GB RAM',
    barcode: '123456789013',
    supplier: 'Dell Technologies',
    location: 'B-2-05',
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
  },
  {
    id: 3,
    name: 'Auriculares Sony WH-1000XM4',
    sku: 'SONY-WH1000',
    category: 'Audio',
    price: 349.99,
    stock: 0,
    minStock: 5,
    status: 'out_of_stock',
    image: '/api/placeholder/100/100',
    description: 'Auriculares inalámbricos con cancelación de ruido',
    barcode: '123456789014',
    supplier: 'Sony Electronics',
    location: 'C-1-03',
    createdAt: '2024-01-17T16:20:00Z',
    updatedAt: '2024-01-25T08:15:00Z',
  },
  {
    id: 4,
    name: 'Monitor Samsung 27" 4K',
    sku: 'SAM-M27-4K',
    category: 'Accesorios',
    price: 449.99,
    stock: 12,
    minStock: 8,
    status: 'active',
    image: '/api/placeholder/100/100',
    description: 'Monitor Samsung 27 pulgadas 4K UHD',
    barcode: '123456789015',
    supplier: 'Samsung Electronics',
    location: 'A-3-02',
    createdAt: '2024-01-18T12:45:00Z',
    updatedAt: '2024-01-26T15:30:00Z',
  },
  {
    id: 5,
    name: 'Teclado Mecánico Corsair',
    sku: 'COR-K95-RGB',
    category: 'Accesorios',
    price: 179.99,
    stock: 3,
    minStock: 10,
    status: 'low_stock',
    image: '/api/placeholder/100/100',
    description: 'Teclado mecánico gaming RGB Cherry MX',
    barcode: '123456789016',
    supplier: 'Corsair',
    location: 'C-2-01',
    createdAt: '2024-01-19T14:10:00Z',
    updatedAt: '2024-01-27T09:45:00Z',
  },
  {
    id: 6,
    name: 'Mouse Logitech MX Master 3',
    sku: 'LOG-MX3',
    category: 'Accesorios',
    price: 99.99,
    stock: 20,
    minStock: 15,
    status: 'active',
    image: '/api/placeholder/100/100',
    description: 'Mouse inalámbrico para productividad',
    barcode: '123456789017',
    supplier: 'Logitech',
    location: 'C-2-02',
    createdAt: '2024-01-20T11:25:00Z',
    updatedAt: '2024-01-28T13:20:00Z',
  },
  {
    id: 7,
    name: 'Tablet iPad Air',
    sku: 'IPAD-AIR-256',
    category: 'Electrónicos',
    price: 749.99,
    stock: 15,
    minStock: 12,
    status: 'active',
    image: '/api/placeholder/100/100',
    description: 'iPad Air 256GB WiFi + Cellular',
    barcode: '123456789018',
    supplier: 'Apple Inc.',
    location: 'A-1-03',
    createdAt: '2024-01-21T08:30:00Z',
    updatedAt: '2024-01-29T16:10:00Z',
  },
  {
    id: 8,
    name: 'Impresora HP LaserJet',
    sku: 'HP-LJ-PRO',
    category: 'Oficina',
    price: 299.99,
    stock: 6,
    minStock: 8,
    status: 'low_stock',
    image: '/api/placeholder/100/100',
    description: 'Impresora láser monocromática',
    barcode: '123456789019',
    supplier: 'HP Inc.',
    location: 'D-1-01',
    createdAt: '2024-01-22T15:40:00Z',
    updatedAt: '2024-01-30T10:25:00Z',
  },
  {
    id: 9,
    name: 'Webcam Logitech C920',
    sku: 'LOG-C920-HD',
    category: 'Accesorios',
    price: 79.99,
    stock: 0,
    minStock: 5,
    status: 'out_of_stock',
    image: '/api/placeholder/100/100',
    description: 'Webcam HD 1080p para videoconferencias',
    barcode: '123456789020',
    supplier: 'Logitech',
    location: 'C-3-01',
    createdAt: '2024-01-23T13:15:00Z',
    updatedAt: '2024-01-31T14:45:00Z',
  },
  {
    id: 10,
    name: 'Disco SSD Samsung 1TB',
    sku: 'SAM-SSD-1TB',
    category: 'Almacenamiento',
    price: 129.99,
    stock: 18,
    minStock: 20,
    status: 'active',
    image: '/api/placeholder/100/100',
    description: 'SSD NVMe M.2 1TB alta velocidad',
    barcode: '123456789021',
    supplier: 'Samsung Electronics',
    location: 'B-1-02',
    createdAt: '2024-01-24T10:50:00Z',
    updatedAt: '2024-02-01T12:30:00Z',
  },
  {
    id: 11,
    name: 'Router WiFi 6 ASUS',
    sku: 'ASUS-AX6000',
    category: 'Redes',
    price: 199.99,
    stock: 7,
    minStock: 5,
    status: 'active',
    image: '/api/placeholder/100/100',
    description: 'Router inalámbrico WiFi 6 AX6000',
    barcode: '123456789022',
    supplier: 'ASUS',
    location: 'E-1-01',
    createdAt: '2024-01-25T09:20:00Z',
    updatedAt: '2024-02-02T11:15:00Z',
  },
  {
    id: 12,
    name: 'Cámara Canon EOS R5',
    sku: 'CAN-EOSR5',
    category: 'Fotografía',
    price: 3899.99,
    stock: 2,
    minStock: 3,
    status: 'low_stock',
    image: '/api/placeholder/100/100',
    description: 'Cámara mirrorless profesional 45MP',
    barcode: '123456789023',
    supplier: 'Canon Inc.',
    location: 'F-1-01',
    createdAt: '2024-01-26T14:35:00Z',
    updatedAt: '2024-02-03T16:20:00Z',
  }
];

const mockCategories = [
  'Electrónicos',
  'Computadoras', 
  'Audio',
  'Ropa',
  'Muebles',
  'Accesorios'
];

const useProductStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial
      products: [],
      categories: [],
      currentProduct: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: '',
        category: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },

      // Acciones para manejo de loading y errores
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Acciones para filtros y paginación
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      })),

      // Obtener productos con filtros y paginación
      fetchProducts: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const { filters } = get();
          const queryParams = {
            ...filters,
            ...params,
          };

          // Usar datos mock para demostración
          // En producción, descomentar la línea siguiente:
          // const response = await productService.getProducts(queryParams);
          
          // Simulamos llamada a API con datos mock
          await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay de red
          
          let filteredProducts = [...mockProducts];
          
          // Aplicar filtros
          if (queryParams.search) {
            const searchTerm = queryParams.search.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
              product.name.toLowerCase().includes(searchTerm) ||
              product.sku.toLowerCase().includes(searchTerm) ||
              product.category.toLowerCase().includes(searchTerm) ||
              product.description.toLowerCase().includes(searchTerm)
            );
          }
          
          if (queryParams.category) {
            filteredProducts = filteredProducts.filter(product => 
              product.category === queryParams.category
            );
          }
          
          if (queryParams.status) {
            filteredProducts = filteredProducts.filter(product => {
              if (queryParams.status === 'active') {
                return product.stock > product.minStock;
              } else if (queryParams.status === 'low_stock') {
                return product.stock <= product.minStock && product.stock > 0;
              } else if (queryParams.status === 'out_of_stock') {
                return product.stock === 0;
              }
              return true;
            });
          }
          
          // Aplicar ordenamiento
          if (queryParams.sortBy) {
            filteredProducts.sort((a, b) => {
              const aValue = a[queryParams.sortBy];
              const bValue = b[queryParams.sortBy];
              
              if (queryParams.sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
              }
              return aValue > bValue ? 1 : -1;
            });
          }
          
          // Aplicar paginación
          const page = queryParams.page || 1;
          const limit = queryParams.limit || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
          
          set({
            products: paginatedProducts,
            categories: mockCategories,
            pagination: {
              page: page,
              limit: limit,
              total: filteredProducts.length,
              totalPages: Math.ceil(filteredProducts.length / limit),
            },
            loading: false,
          });
        } catch (error) {
          set({
            error: error.message || 'Error al cargar productos',
            loading: false,
          });
        }
      },

      // Obtener un producto por ID
      fetchProductById: async (id) => {
        set({ loading: true, error: null });
        try {
          const product = await productService.getProductById(id);
          set({
            currentProduct: product,
            loading: false,
          });
          return product;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Crear nuevo producto
      createProduct: async (productData) => {
        set({ loading: true, error: null });
        try {
          const newProduct = await productService.createProduct(productData);
          
          set((state) => ({
            products: [newProduct, ...state.products],
            loading: false,
          }));
          
          return newProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al crear producto',
            loading: false,
          });
          throw error;
        }
      },

      // Actualizar producto existente
      updateProduct: async (id, productData) => {
        set({ loading: true, error: null });
        try {
          const updatedProduct = await productService.updateProduct(id, productData);
          
          set((state) => ({
            products: state.products.map(product =>
              product.id === id ? updatedProduct : product
            ),
            currentProduct: state.currentProduct?.id === id ? updatedProduct : state.currentProduct,
            loading: false,
          }));
          
          return updatedProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al actualizar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Eliminar producto
      deleteProduct: async (id) => {
        set({ loading: true, error: null });
        try {
          await productService.deleteProduct(id);
          
          set((state) => ({
            products: state.products.filter(product => product.id !== id),
            currentProduct: state.currentProduct?.id === id ? null : state.currentProduct,
            loading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al eliminar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener categorías
      fetchCategories: async () => {
        try {
          const categories = await productService.getCategories();
          set({ categories });
          return categories;
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      },

      // Actualizar stock de producto
      updateProductStock: async (id, stockData) => {
        set({ loading: true, error: null });
        try {
          const updatedProduct = await productService.updateStock(id, stockData);
          
          set((state) => ({
            products: state.products.map(product =>
              product.id === id ? { ...product, ...updatedProduct } : product
            ),
            loading: false,
          }));
          
          return updatedProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al actualizar stock',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener productos con stock bajo
      fetchLowStockProducts: async (threshold = 10) => {
        set({ loading: true, error: null });
        try {
          const lowStockProducts = await productService.getLowStockProducts(threshold);
          set({ loading: false });
          return lowStockProducts;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar productos con stock bajo',
            loading: false,
          });
          throw error;
        }
      },

      // Limpiar producto actual
      clearCurrentProduct: () => set({ currentProduct: null }),

      // Reset del store
      reset: () => set({
        products: [],
        categories: [],
        currentProduct: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        filters: {
          search: '',
          category: '',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      }),
    }),
    {
      name: 'product-store', // Nombre para DevTools
    }
  )
);

export default useProductStore;

