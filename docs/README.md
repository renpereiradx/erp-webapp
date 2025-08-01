# 📋 ERP Web Application - Documentación General

## 🎯 Resumen del Proyecto

Sistema ERP moderno construido con React + Vite que incluye gestión de clientes, proveedores, productos y autenticación, con soporte para múltiples temas de diseño.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: React 18 + Vite
- **Estado**: Zustand (stores independientes)
- **UI**: Componentes atómicos personalizados
- **Temas**: Sistema multi-tema (Neo Brutalism, Material Design, Fluent Design)
- **API**: Axios con interceptores
- **Autenticación**: JWT con next-themes

### Estructura de Carpetas
```
src/
├── components/          # Componentes UI reutilizables
│   ├── ui/             # Componentes atómicos (Button, Input, Card, etc.)
│   └── [Modales]       # Modales específicos por entidad
├── pages/              # Páginas principales
├── store/              # Stores Zustand por entidad
├── services/           # Servicios API
├── hooks/              # Hooks personalizados
├── layouts/            # Layouts de página
├── themes/             # Archivos CSS de temas
└── utils/              # Utilidades y helpers
```

## 🎨 Sistema de Temas

### Temas Disponibles
- **Neo Brutalism**: Diseño audaz, angular, alto contraste
- **Material Design**: Diseño suave, elevado, capas
- **Fluent Design**: Diseño moderno, translúcido, fluido

### Características
- ✅ 6 variantes (light/dark por tema)
- ✅ Cambio dinámico en tiempo real
- ✅ Persistencia de selección
- ✅ Variables CSS escalables
- ✅ Componentes con conciencia de tema

## 🔐 Autenticación

### Endpoint
```
POST http://localhost:5050/login
```

### Formato de Request
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

### Manejo de Errores
- **401**: Credenciales incorrectas
- **403**: Cuenta bloqueada/sin permisos
- **429**: Demasiados intentos
- **500**: Error interno del servidor
- **ECONNREFUSED**: Problemas de conexión

## 📊 Gestión de Entidades

### Clientes
- ✅ CRUD completo
- ✅ Búsqueda por API y filtrado local
- ✅ Filtros por estado (Activo/Inactivo)
- ✅ Modales para crear/editar/eliminar
- ✅ Integración con store Zustand

### Proveedores
- ✅ CRUD completo
- ✅ Búsqueda y filtrado
- ✅ Modales personalizados
- ✅ Store independiente

### Productos
- ✅ Gestión completa
- ✅ Categorías y subcategorías
- ✅ Búsqueda avanzada
- ✅ Modales especializados

## 🎯 Funcionalidades Principales

### Búsqueda Dual
- **Búsqueda por API**: Consulta directa al servidor
- **Filtrado Local**: Filtrado en tiempo real de resultados cargados
- **Combinación**: Mejor experiencia de usuario

### Sistema de Notificaciones
- Toast notifications personalizadas
- Mensajes de éxito/error contextuales
- Auto-dismiss configurable

### Responsive Design
- Mobile-first approach
- Breakpoints optimizados
- Sidebar responsive con overlay

## 🔧 Configuración y Desarrollo

### Instalación
```bash
npm install
# o
pnpm install
```

### Desarrollo
```bash
npm run dev
# o
pnpm dev
```

### Backend Requerido
- Servidor ejecutándose en `localhost:5050`
- Endpoints de autenticación y CRUD
- Soporte para JWT

## 📝 Patrones de Diseño

### Component-Based Architecture
- **Componentes Atómicos**: Elementos UI básicos
- **Componentes Moleculares**: Combinaciones
- **Componentes Organismos**: Secciones complejas
- **Templates**: Estructuras de página
- **Pages**: Instancias específicas

### State Management
- **Global State**: Zustand para estado compartido
- **Local State**: React useState
- **Server State**: Caché de datos de API

### Service Layer
- **API Services**: Abstracción HTTP
- **Business Logic**: Separada de UI
- **Data Transformation**: Normalización

## 🚀 Características Avanzadas

### Performance
- Lazy loading de componentes
- Optimización de re-renders
- Caché inteligente de datos

### UX/UI
- Transiciones suaves
- Estados de carga
- Feedback visual inmediato
- Accesibilidad mejorada

### Mantenibilidad
- Código modular
- Documentación inline
- Patrones consistentes
- Testing preparado

## 📚 Documentación Específica

Para información detallada sobre temas específicos, consulta:
- `docs/ARCHITECTURE.md` - Arquitectura detallada
- `docs/THEME_SYSTEM.md` - Sistema de temas
- `docs/API_INTEGRATION.md` - Integración con API
- `docs/AUTHENTICATION.md` - Autenticación
- `docs/api/` - Documentación de API

## 🔄 Estado Actual

### ✅ Completado
- Sistema de autenticación
- Gestión de clientes
- Gestión de proveedores
- Sistema de temas
- Componentes UI base
- Integración con API

### 🚧 En Desarrollo
- Optimizaciones de performance
- Testing automatizado
- Documentación adicional

### 📋 Pendiente
- Gestión de usuarios
- Reportes y analytics
- Exportación de datos
- Notificaciones push

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
**Estado**: Producción Ready
