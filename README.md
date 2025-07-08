# Sistema ERP - WebApp

Una aplicación web completa de sistema ERP (Enterprise Resource Planning) desarrollada con tecnologías modernas para la gestión empresarial integral.

## 🚀 Tecnologías Utilizadas

### Frontend Framework
- **React 19.1.0** - Framework de JavaScript para interfaces de usuario
- **Vite 6.3.5** - Herramienta de construcción rápida y moderna
- **React Router DOM 7.6.1** - Enrutamiento para aplicaciones React

### Estilos y UI
- **Tailwind CSS 4.1.7** - Framework CSS utility-first para diseño responsive
- **Shadcn/UI** - Componentes de UI accesibles y personalizables
- **Lucide React** - Iconos SVG para React
- **Framer Motion** - Biblioteca de animaciones para React

### Gestión de Estado
- **Zustand 5.0.5** - Gestión de estado ligera y reactiva
- **Axios 1.10.0** - Cliente HTTP para comunicación con APIs

### Herramientas de Desarrollo
- **pnpm** - Gestor de paquetes rápido y eficiente
- **ESLint** - Linter para mantener código consistente
- **Recharts** - Biblioteca de gráficos para React

## 📋 Características Principales

### ✅ Funcionalidades Implementadas
- **Dashboard Interactivo** - Métricas, gráficos y resumen del negocio
- **Gestión de Productos** - CRUD completo con filtros y búsqueda
- **Gestión de Clientes** - Administración de base de clientes
- **Diseño Responsive** - Adaptable a móvil, tablet y escritorio
- **Navegación Intuitiva** - Sidebar colapsible y navegación fluida
- **Gestión de Estado Global** - Usando Zustand para estado reactivo
- **Componentes Reutilizables** - Arquitectura modular y escalable

### 🔄 Preparado para Backend
- **API RESTful Ready** - Configuración completa de Axios
- **Servicios Modulares** - Separación clara de lógica de API
- **Manejo de Errores** - Interceptores y gestión centralizada
- **Autenticación** - Sistema de tokens JWT preparado

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado) o npm

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd erp-webapp
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env en la raíz del proyecto
   cp .env.example .env
   
   # Editar las variables necesarias
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   pnpm dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia servidor de desarrollo
pnpm dev --host   # Inicia servidor accesible desde red local

# Construcción
pnpm build        # Construye para producción
pnpm preview      # Vista previa de la construcción

# Calidad de código
pnpm lint         # Ejecuta ESLint
```

## 📁 Estructura del Proyecto

```
erp-webapp/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes reutilizables
│   │   └── ui/            # Componentes de UI base
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       └── Card.jsx
│   ├── layouts/           # Componentes de layout
│   │   └── MainLayout.jsx # Layout principal con sidebar
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Dashboard.jsx  # Panel principal
│   │   ├── Products.jsx   # Gestión de productos
│   │   └── Clients.jsx    # Gestión de clientes
│   ├── services/          # Servicios de API
│   │   ├── api.js         # Configuración base de Axios
│   │   ├── productService.js
│   │   └── clientService.js
│   ├── store/             # Stores de Zustand
│   │   ├── useAuthStore.js
│   │   ├── useProductStore.js
│   │   └── useClientStore.js
│   ├── lib/               # Utilidades
│   │   └── utils.js       # Funciones helper
│   ├── assets/            # Recursos estáticos
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos globales
│   └── main.jsx           # Punto de entrada
├── package.json           # Dependencias y scripts
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── README.md              # Documentación
```

## 🎨 Diseño Responsive

### Breakpoints de Tailwind CSS
- **sm**: 640px+ (Tablet pequeña)
- **md**: 768px+ (Tablet)
- **lg**: 1024px+ (Desktop)
- **xl**: 1280px+ (Desktop grande)

### Ejemplos de Clases Responsive

```jsx
// Layout responsive
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Texto responsive
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Padding responsive
<div className="p-4 sm:p-6 lg:p-8">

// Sidebar responsive
<div className="hidden lg:block lg:w-64">
```

## 🔧 Gestión de Estado con Zustand

### Ejemplo de Store

```javascript
import { create } from 'zustand';

const useProductStore = create((set, get) => ({
  // Estado
  products: [],
  loading: false,
  error: null,
  
  // Acciones
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const products = await productService.getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  addProduct: (product) => set((state) => ({
    products: [...state.products, product]
  })),
}));
```

### Uso en Componentes

```jsx
import useProductStore from '@/store/useProductStore';

const ProductList = () => {
  const { products, loading, fetchProducts } = useProductStore();
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

## 🌐 Configuración de API

### Configuración Base (api.js)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autenticación
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Servicios Específicos

```javascript
// productService.js
export const productService = {
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/productos', { params });
    return response.data;
  },
  
  createProduct: async (productData) => {
    const response = await apiClient.post('/productos', productData);
    return response.data;
  },
};
```

## 🎯 Componentes Principales

### MainLayout
- Sidebar responsive con navegación
- Header con búsqueda y notificaciones
- Área de contenido principal
- Soporte para tema claro/oscuro

### Dashboard
- Métricas principales con iconos
- Gráficos interactivos (Recharts)
- Alertas de stock bajo
- Acciones rápidas

### Products
- Lista/tabla responsive
- Filtros avanzados
- Búsqueda en tiempo real
- Estados de stock visuales

### Clients
- Gestión de clientes individuales y empresas
- Información de contacto completa
- Estadísticas de compras
- Estados activo/inactivo

## 🚀 Despliegue

### Construcción para Producción

```bash
# Construir la aplicación
pnpm build

# Los archivos se generan en la carpeta 'dist'
# Subir el contenido de 'dist' a tu servidor web
```

### Variables de Entorno para Producción

```bash
VITE_API_BASE_URL=https://tu-api.com/api
```

## 🔍 Desarrollo y Debugging

### DevTools de Zustand
Los stores incluyen soporte para Redux DevTools:

```javascript
const useStore = create(
  devtools((set, get) => ({
    // store logic
  }), { name: 'store-name' })
);
```

### Logging de API
Los interceptores de Axios registran automáticamente errores:

```javascript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

## 📱 Características Responsive

### Sidebar
- **Desktop**: Sidebar fijo visible
- **Tablet/Mobile**: Sidebar overlay con botón hamburguesa

### Tablas
- **Desktop**: Tabla completa
- **Mobile**: Cards apiladas con información condensada

### Formularios
- **Desktop**: Campos en línea
- **Mobile**: Campos apilados verticalmente

## 🔐 Seguridad

### Autenticación JWT
- Tokens almacenados en localStorage
- Interceptores automáticos para headers
- Redirección automática en token expirado

### Validación
- Validación de formularios con React Hook Form
- Esquemas de validación con Zod
- Sanitización de inputs

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes preguntas o necesitas ayuda:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**Desarrollado con ❤️ usando React, Tailwind CSS, Vite y Zustand**

