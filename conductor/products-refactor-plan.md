# Plan de Refactorización de la Página de Productos

## 1. Background & Motivación
Actualmente, la página principal de gestión de productos (`src/pages/Products.jsx`) es un monolito de casi 700 líneas de código. Concentra lógica de estado complejo, renderizado de tablas, paginación, filtros de búsqueda y comunicación directa con el store global. Esto dificulta el mantenimiento, el testing unitario y la escalabilidad, contraviniendo el principio de Separación de Responsabilidades y la arquitectura basada en Features. 

Además, existen archivos redundantes o de pruebas en `dev-tools/` que aumentan la fragmentación del código base.

## 2. Objetivo
Refactorizar la página de Productos hacia una arquitectura modular dentro de `src/features/products/`. El objetivo es transformar `src/pages/Products.jsx` en un simple "contenedor delegado" que ensamble subcomponentes funcionales más pequeños, independientes y testeables.

**Consideración Dual (JS vs TS):** Este plan ha sido diseñado para implementarse en JavaScript (mantenimiento continuo) o bien integrarse con el Plan de Migración a TypeScript (`docs/guides/typescript-migration.md`). 
**Regla Estricta:** Si se opta por migrar la página a TypeScript o si se añaden nuevos módulos a la funcionalidad de productos, es **obligatorio** seguir esta arquitectura modular utilizando las extensiones `.ts` y `.tsx`.

## 3. Scope & Impact
**Archivos Afectados:**
- `src/pages/Products.jsx` (Reducción drástica a un componente contenedor).
- `src/features/products/components/*` (Nuevos componentes de UI).
- `src/features/products/hooks/*` (Nuevos Custom Hooks para la lógica de la página).
- `dev-tools/Products*.jsx` (Limpieza de archivos obsoletos).

## 4. Proposed Solution & Architecture

### 4.0. Principios Pragmáticos de Arquitectura Limpia (DDD Ligero)
Para mantener el código escalable sin caer en la sobre-ingeniería, aplicaremos estos tres principios en el módulo:
1. **Aislamiento de Efectos Secundarios:** La capa `src/domain/` será 100% pura y determinista. Todo efecto secundario (`fetch`, manipulación del DOM, `localStorage`) ocurrirá estrictamente en los `hooks/` o `services/`.
2. **Modelos vs DTOs (Data Transfer Objects):** Los datos crudos del backend (DTOs) serán capturados por la capa `services/` y "mapeados" hacia un Modelo de Dominio limpio definido en `src/domain/models.ts` antes de ser consumidos por la UI.
3. **Componentes "Listos" vs "Tontos" (Smart vs Dumb Components):** Extraeremos la mayor cantidad de interfaz posible hacia componentes tontos en `components/` (que solo reciban `props` y no sepan de dónde vienen los datos), mientras que el hook `useProductsLogic` y la página actuarán como los componentes "listos" que inyectan la información.

### 4.1. Extracción de Lógica a Custom Hooks
- **`useProductsLogic.[js|ts]`**: Mover toda la lógica de filtrado, paginación, selección múltiple y comunicación con `useProductStore` a un hook en `src/features/products/hooks/useProductsLogic`. Esto separará completamente la lógica de negocio de la capa de renderizado.

### 4.2. Creación y Consolidación de Subcomponentes de UI (`src/features/products/components/`)
Actualmente, existen múltiples componentes de modales dispersos en `src/components/` (ej. `ProductFormModal.jsx`, `ProductDetailsModal.tsx`, `DeleteProductModal.jsx`). Como parte de esta refactorización, **todos los modales exclusivos del dominio de productos** deben ser reubicados y/o consolidados aquí:
- **`ProductsHeader.[jsx|tsx]`**: Contendrá el título, los breadcrumbs y los botones de acciones principales (Nuevo Producto, Refrescar, Exportar).
- **`ProductsFilters.[jsx|tsx]`**: Contendrá la barra de búsqueda y los selectores de filtros (Categoría, Estado) para reducir la complejidad visual de la cabecera.
- **`ProductsTable.[jsx|tsx]`**: Extraer la tabla principal (con su cabecera y renderizado de filas). Recibirá como props los productos a mostrar, la configuración de selección y las acciones de borrado/edición.
- **`ProductsPagination.[jsx|tsx]`**: Aislar los controles de paginación de la interfaz de Fluent 2 / Tailwind.
- **`ProductsEmptyState.[jsx|tsx]`**: Componente para los estados de "cargando" y "sin resultados", centralizando las comprobaciones de visibilidad.
- **Modales Consolidados (`ProductFormModal`, `ProductDetailsModal`, etc.):** Moverlos desde `src/components/` hacia `src/features/products/components/`. El estado de apertura/cierre de estos modales será manejado por el custom hook.

### 4.3. Integración con Fluent 2.0 (Design System)
Toda refactorización de UI debe adherirse estrictamente a las guías de `docs/design-system/`.
- **Estructura Delegada:** `src/pages/Products.jsx` debe actuar como contenedor inyectado usando `<div className="flex flex-col gap-6 animate-in fade-in duration-500">`. No crear `divs` redundantes que dupliquen paddings o interfieran con el `MainLayout`.
- **Estilos:** Usar `glass-acrylic` para fondos translucidos, sombras `shadow-fluent-2` o `shadow-fluent-8` y colores semánticos (`bg-primary`, `bg-background-base`). Las tarjetas deben tener `rounded-xl` y `overflow-hidden` (Clip Content rule).
- **Tipografía:** Usar la jerarquía de `Inter` para la vista y `JetBrains Mono` (`font-mono`) con `font-bold` o `font-semibold` para los precios, cantidades e IDs en las tablas.

### 4.4. Adaptación a la API de Productos v3.3.0
El refactor en la capa `src/features/products/services/` debe adecuarse a las últimas firmas de la API.
- **Data Fetching:** Se utilizará el endpoint `GET /products/list/{page}/{pageSize}` para obtener la lista paginada de productos de manera eficiente.
- **Tipado Base:** Basarse en la estructura `ProductEnriched` documentada para definir la interfaz principal en `src/domain/products/models.ts`. El servicio se encargará de mapear desde el endpoint hasta esta interfaz pura.
- **Flujos especializados:** Para cargar la vista de detalle en modales o subpáginas, emplear `GET /products/{id}/info` (que devuelve `ProductFinancialEnriched`).
- **Estados de Stock:** Respetar los estados (`in_stock`, `low_stock`, `out_of_stock`) para aplicar los "Badges" visuales propuestos en Fluent 2 (verde, naranja, rojo).

### 4.5. Limpieza de Código Obsoleto
Eliminar versiones anteriores no utilizadas del proceso de diseño para evitar deudas técnicas:
- `dev-tools/Products_final.jsx`
- `dev-tools/ProductsNew.jsx`
- `dev-tools/ProductsRediseñada.jsx`

## 5. Integración con Migración a TypeScript (Opcional/Requerido)
Tal como establece el documento `@docs/guides/typescript-migration.md`:
1. **Si no se migra:** Toda la refactorización puede ejecutarse mediante archivos `.js` y `.jsx`, mejorando la estructura y el mantenimiento.
2. **Si se migra (Recomendado):** Al realizar estos cambios, se crearán los nuevos archivos como `.ts` y `.tsx`.
   - Se deberán definir interfaces estrictas en `src/features/products/types/` (e.g., `Product`, `ProductFilters`, `PaginationState`).
   - El hook `useProductsLogic.ts` deberá tipar rigurosamente su valor de retorno y los eventos (e.g., `onChange`, `onClick`).
3. **Módulos Nuevos:** Cualquier característica adicional (ej: Gestión avanzada de precios o lotes dentro de productos) **debe** generarse siguiendo esta misma estructura de carpetas en `features/products` y estar tipado en TypeScript si la migración global está en curso.

## 6. Implementation Steps
1. Revisar y auditar la compatibilidad del componente actual en `Products.jsx`.
2. Crear los subcomponentes "tontos" (presentacionales) en `features/products/components/`.
3. Desarrollar el hook `useProductsLogic` e integrarlo temporalmente con los componentes extraídos.
4. Ensamblar los componentes presentacionales y el hook en `src/pages/Products.jsx`, verificando que el comportamiento UI se mantenga 100% igual.
5. Ejecutar la batería de tests existentes en `src/pages/__tests__/` (e.g., `Products.delete.test.jsx`, `Products.dataState.test.jsx`) para confirmar que nada se ha roto.
6. Eliminar el código basura de la carpeta `dev-tools/`.

## 7. Verification & Testing
- Comprobar que los test E2E y de integración (Vitest/Playwright) continúan pasando correctamente sin falsos positivos en las búsquedas del DOM.
- Verificar que el rendimiento (re-renders innecesarios) no empeora; idealmente mejorará por el encapsulamiento de estado en componentes más pequeños con `memo` si aplica.