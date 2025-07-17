# Arquitectura del Sistema ERP

## 🏗️ Visión General de la Arquitectura

El sistema ERP está construido siguiendo principios de arquitectura moderna y escalable, con separación clara de responsabilidades y patrones de diseño probados.

## 📐 Patrones de Diseño Implementados

### 1. Component-Based Architecture
- **Componentes Atómicos**: Elementos UI básicos reutilizables
- **Componentes Moleculares**: Combinaciones de componentes atómicos
- **Componentes Organismos**: Secciones complejas de la interfaz
- **Templates**: Estructuras de página
- **Pages**: Instancias específicas de templates

### 2. State Management Pattern
- **Global State**: Zustand para estado compartido entre componentes
- **Local State**: React useState para estado específico de componente
- **Server State**: Caché de datos de API con invalidación automática

### 3. Service Layer Pattern
- **API Services**: Abstracción de llamadas HTTP
- **Business Logic**: Lógica de negocio separada de la UI
- **Data Transformation**: Normalización de datos de API

## 🔧 Estructura de Componentes

### Componentes UI Base (`/components/ui/`)

#### Button.jsx
```jsx
// Variantes: default, destructive, outline, secondary, ghost, link
// Tamaños: default, sm, lg, icon
// Uso de class-variance-authority para variantes tipadas

const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
```

#### Input.jsx
```jsx
// Características:
// - Soporte para iconos izquierdo y derecho
// - Estados de error con estilos visuales
// - Labels y texto de ayuda integrados
// - Responsive design automático

const Input = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  helperText,
  ...props 
}) => {
  // Implementación con estados visuales
};
```

#### Card.jsx
```jsx
// Componentes relacionados:
// - Card: Contenedor principal
// - CardHeader: Encabezado con título y descripción
// - CardContent: Contenido principal
// - CardFooter: Pie con acciones
// - CardTitle: Título responsive
// - CardDescription: Descripción con tipografía adaptativa
```

### Layout Components (`/layouts/`)

#### MainLayout.jsx
```jsx
// Características principales:
// - Sidebar responsive con overlay en móvil
// - Header con búsqueda y notificaciones
// - Navegación contextual
// - Soporte para tema claro/oscuro
// - Breakpoints: lg:hidden, lg:block, lg:w-64

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        {/* Sidebar content */}
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {/* Sidebar content */}
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center">
          {/* Header content */}
        </div>
        
        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
```

## 🗄️ Gestión de Estado

### Zustand Store Architecture

#### useProductStore.js
```javascript
const useProductStore = create(
  devtools(
    (set, get) => ({
      // Estado normalizado
      products: [],
      currentProduct: null,
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      filters: { search: '', category: '', sortBy: 'name', sortOrder: 'asc' },

      // Acciones síncronas
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),

      // Acciones asíncronas
      fetchProducts: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await productService.getProducts(params);
          set({
            products: response.data,
            pagination: response.pagination,
            loading: false,
          });
        } catch (error) {
          set({
            error: error.message,
            loading: false,
          });
        }
      },

      // Operaciones CRUD optimistas
      createProduct: async (productData) => {
        const optimisticProduct = { ...productData, id: Date.now() };
        set((state) => ({
          products: [optimisticProduct, ...state.products]
        }));
        
        try {
          const newProduct = await productService.createProduct(productData);
          set((state) => ({
            products: state.products.map(p => 
              p.id === optimisticProduct.id ? newProduct : p
            )
          }));
        } catch (error) {
          // Revertir cambio optimista
          set((state) => ({
            products: state.products.filter(p => p.id !== optimisticProduct.id),
            error: error.message
          }));
        }
      },
    }),
    { name: 'product-store' }
  )
);
```

### Estado Derivado y Selectores

```javascript
// Selectores para estado derivado
const useProductSelectors = () => {
  const products = useProductStore(state => state.products);
  const filters = useProductStore(state => state.filters);
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      return a[filters.sortBy] > b[filters.sortBy] ? order : -order;
    });
  }, [products, filters]);
  
  return { filteredProducts };
};
```

## 🌐 Capa de Servicios

### API Client Configuration

```javascript
// api.js - Configuración central
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor para autenticación
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Service Layer Pattern

```javascript
// productService.js - Servicio específico
export const productService = {
  // GET con parámetros de consulta
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return await apiService.get(`/productos?${queryParams}`);
  },

  // POST con validación
  createProduct: async (productData) => {
    // Validación local antes de enviar
    if (!productData.name || !productData.price) {
      throw new Error('Nombre y precio son requeridos');
    }
    return await apiService.post('/productos', productData);
  },

  // PUT con optimistic updates
  updateProduct: async (id, productData) => {
    return await apiService.put(`/productos/${id}`, productData);
  },

  // DELETE con confirmación
  deleteProduct: async (id) => {
    return await apiService.delete(`/productos/${id}`);
  },
};
```

## 📱 Responsive Design Strategy

### Breakpoint System
```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Tablet pequeña */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
2xl: 1536px /* Desktop extra grande */
```

### Layout Responsive Patterns

#### 1. Progressive Enhancement
```jsx
// Empezar con móvil, agregar características para desktop
<div className="
  flex flex-col space-y-4
  sm:flex-row sm:space-y-0 sm:space-x-4
  lg:space-x-6
">
```

#### 2. Conditional Rendering
```jsx
// Mostrar diferentes componentes según el tamaño
<div>
  {/* Vista móvil */}
  <div className="block md:hidden">
    <MobileProductList />
  </div>
  
  {/* Vista desktop */}
  <div className="hidden md:block">
    <ProductTable />
  </div>
</div>
```

#### 3. Adaptive Grid
```jsx
// Grid que se adapta automáticamente
<div className="
  grid gap-4
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
```

### Typography Scale
```jsx
// Tipografía responsive
<h1 className="
  text-2xl font-bold
  sm:text-3xl
  lg:text-4xl
  xl:text-5xl
">

<p className="
  text-sm
  sm:text-base
  lg:text-lg
">
```

## 🔄 Data Flow Architecture

### Unidirectional Data Flow

```
User Action → Component → Store Action → API Service → Store Update → Component Re-render
```

#### Ejemplo Completo:
```jsx
// 1. User Action
const handleCreateProduct = async (productData) => {
  // 2. Component calls Store Action
  try {
    await createProduct(productData);
    // 5. Component handles success
    showSuccessMessage('Producto creado exitosamente');
  } catch (error) {
    // 5. Component handles error
    showErrorMessage(error.message);
  }
};

// 3. Store Action calls API Service
const createProduct = async (productData) => {
  set({ loading: true });
  try {
    const newProduct = await productService.createProduct(productData);
    // 4. Store Update
    set((state) => ({
      products: [newProduct, ...state.products],
      loading: false,
    }));
  } catch (error) {
    set({ error: error.message, loading: false });
    throw error;
  }
};
```

## 🎨 Theming Architecture

### CSS Custom Properties
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... más variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... variables para tema oscuro */
}
```

### Tailwind Integration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
      },
    },
  },
};
```

## 🚀 Performance Optimizations

### Code Splitting
```jsx
// Lazy loading de páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/productos" element={<Products />} />
  </Routes>
</Suspense>
```

### Memoization
```jsx
// Memoización de componentes costosos
const ProductCard = memo(({ product }) => {
  return (
    <Card>
      {/* Contenido del producto */}
    </Card>
  );
});

// Memoización de cálculos
const filteredProducts = useMemo(() => {
  return products.filter(/* filtros */);
}, [products, filters]);
```

### Virtual Scrolling (Para listas grandes)
```jsx
// Implementación con react-window
import { FixedSizeList as List } from 'react-window';

const ProductList = ({ products }) => (
  <List
    height={600}
    itemCount={products.length}
    itemSize={80}
    itemData={products}
  >
    {ProductRow}
  </List>
);
```

## 🔐 Security Best Practices

### Input Sanitization
```javascript
// Sanitización en servicios
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const createProduct = async (productData) => {
  const sanitizedData = {
    ...productData,
    name: sanitizeInput(productData.name),
    description: sanitizeInput(productData.description),
  };
  return await apiService.post('/productos', sanitizedData);
};
```

### Token Management
```javascript
// Manejo seguro de tokens
const tokenManager = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token) => localStorage.setItem('auth_token', token),
  removeToken: () => localStorage.removeItem('auth_token'),
  isTokenExpired: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  },
};
```

## 📊 Monitoring and Analytics

### Error Tracking
```javascript
// Error boundary para capturar errores
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Enviar error a servicio de monitoreo
    console.error('Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Performance Monitoring
```javascript
// Métricas de rendimiento
const performanceMonitor = {
  measurePageLoad: (pageName) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`${pageName} cargó en ${endTime - startTime} ms`);
    };
  },
  
  measureAPICall: async (apiCall, operationName) => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      console.log(`${operationName} completado en ${endTime - startTime} ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`${operationName} falló en ${endTime - startTime} ms:`, error);
      throw error;
    }
  },
};
```

## 🧪 Testing Strategy

### Component Testing
```jsx
// Ejemplo de test con React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Store Testing
```javascript
// Test de Zustand store
import { renderHook, act } from '@testing-library/react';
import useProductStore from '@/store/useProductStore';

describe('useProductStore', () => {
  test('should add product', () => {
    const { result } = renderHook(() => useProductStore());
    
    act(() => {
      result.current.addProduct({ id: 1, name: 'Test Product' });
    });
    
    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].name).toBe('Test Product');
  });
});
```

Esta arquitectura proporciona una base sólida y escalable para el sistema ERP, con patrones probados y mejores prácticas implementadas en cada capa de la aplicación.

