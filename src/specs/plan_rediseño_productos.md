# Plan de Rediseño UI/UX para la Página de Productos

## Objetivo
Rediseñar la página de productos para interactuar eficientemente con la Business Management API, permitiendo crear, editar, listar y eliminar productos, descripciones, precios y stock. El diseño debe cumplir con las especificaciones OpenAPI y reflejar la estructura SQL real.

---

## 1. Arquitectura General
- **Framework:** React + Vite
- **Autenticación:** JWT (Bearer Token)
- **Gestión de Estado:** Context API o Zustand
- **Diseño:** Modular, responsivo y accesible
- **Internacionalización:** Español e inglés

---

## 2. Estructura de Componentes
- **ProductList**: Listado paginado de productos con filtros
- **ProductForm**: Crear/editar productos con validación
- **ProductDetail**: Vista detallada con tabs (Descripción, Precios, Stock)
- **DescriptionForm**: Crear/editar descripciones
- **PriceForm**: Crear/editar precios
- **StockForm**: Crear/editar stock
- **DeleteDialog**: Confirmación de eliminación (soft delete)
- **AuthProvider**: Gestión de sesión y token JWT
- **Notification/Snackbar**: Feedback visual de acciones
- **Revisión de componentes existentes**: Identificar componentes reutilizables

---

## 3. Flujos de Usuario
### 3.1. Listar Productos
- Mostrar productos paginados (`GET /products`)
- Filtros avanzados por nombre, categoría y estado
- Botón destacado para "Nuevo Producto"

### 3.2. Crear Producto
- Formulario con validación (`POST /products`)
- Campos clave: nombre, categoría, estado, tipo
- Redirección automática a la vista detallada tras la creación

### 3.3. Editar Producto
- Formulario editable (`PUT /products/{productId}`)
- Actualización en tiempo real con feedback visual

### 3.4. Eliminar Producto
- Soft delete (`PUT /products/delete/{productId}`)
- Confirmación visual con opción de deshacer

### 3.5. Gestión de Descripciones
- Listar y editar descripciones (`GET/POST/PUT /product_description/{productId|descId}`)

### 3.6. Gestión de Precios
- Listar, crear y editar precios (`GET/POST/PUT /product_price/product_id/{productId}`)

### 3.7. Gestión de Stock
- Listar, crear y editar stock (`GET/POST/PUT /stock/product_id/{productId}`)

---

## 4. Integración API
- **Interceptors:** Añadir JWT automáticamente a cada request
- **Manejo de errores:** Mensajes claros y consistentes
- **Mocking:** Uso de ejemplos Swagger para desarrollo local

---

## 5. Diseño Visual
- **Tema:** Uso de temas predefinidos del sistema
- **Componentes reutilizables:** Cards, tablas, formularios
- **Navegación por tabs:** Descripción, Precios y Stock
- **Feedback visual:** Loaders, estados vacíos, mensajes de error
- **Accesibilidad:** Navegación por teclado y etiquetas ARIA

---

## 6. Seguridad y UX
- Validación de JWT antes de mostrar datos sensibles
- Confirmaciones claras para acciones destructivas (soft delete)
- Opción de deshacer en acciones críticas

---

## 7. Roadmap de Implementación
1. Definir estructura de carpetas y componentes
2. Implementar autenticación JWT
3. Crear ProductList y ProductForm
4. Integrar API para CRUD de productos
5. Añadir gestión de descripciones, precios y stock
6. Mejorar feedback visual y accesibilidad
7. Realizar pruebas completas y optimizar la UI

---

## 8. Referencias
- [Especificación OpenAPI](./product_open_api.md)
- [Estructura SQL](./product_open_api.md)

---

> Este plan asegura una experiencia moderna, segura y alineada con las mejores prácticas de desarrollo frontend y diseño UX para la gestión de productos mediante API.

