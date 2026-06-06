# Plan de Revisión y Refactorización UI/UX

Este plan detalla el estado actual y las mejoras propuestas para las páginas de **Productos**, **Compras** y **Ventas**, basándonos en:
1. **Design System (Fluent 2.0)** (`docs/design-system/README.md`)
2. **TypeScript Migration Guide** (`docs/guides/typescript-migration.md`)
3. **React Best Practices** (`.agents/skills/react-best-practices/SKILL.md`)

---

## 1. Módulo de Productos (`/productos`)

### Estado Actual:
- **Estructura TS:** Es el módulo mejor estructurado. Ya usa el patrón Feature-Sliced Design delegando a `src/features/products/`. Sin embargo, todavía existen archivos `.jsx` y `.js` (ej. `Products.jsx`, `ProductFormModal.jsx`, `useProductFilters.js`).
- **Design System:** Ya usa clases orientadas a Fluent 2 como `shadow-fluent-16`, `bg-slate-50`, tipografía modular y micro-animaciones (`animate-in fade-in`).
- **React Best Practices:** Los efectos en `ProductFormModal` para cargar categorías e impuestos en el mount son correctos, pero la validación se hace a mano y no hay tipado estricto.

### Plan de Acción (UI/UX y Arquitectura):
1. **Migración Completa a TSX:** Renombrar `Products.jsx` a `Products.tsx`, y `ProductFormModal.jsx` a `ProductFormModal.tsx`. Definir interfaces estrictas para los estados de los formularios.
2. **Mejora UI/UX en Modales:** 
   - Añadir soporte para Zod en la validación de `ProductFormModal` para dar feedback visual instantáneo (error states).
   - Aplicar el efecto `glass-mica` o `glass-acrylic` en el backdrop de los modales para mayor profundidad.
3. **Refinamiento de Hooks:** Extraer funciones del componente de formulario a hooks puros si crecen demasiado y evitar cálculos derivados en el body del componente.

---

## 2. Módulo de Compras (`/compras`)

### Estado Actual:
- **Estructura TS:** Es un archivo **monolítico masivo** (`src/pages/Purchases.tsx`, ~2300 líneas). Viola completamente la regla de orquestador delegado.
- **Design System:** Mezcla estilos básicos de Tailwind con algunos componentes UI. Faltan efectos de elevación Fluent 2 reales y espaciado consistente.
- **React Best Practices:** Contiene casi 40 estados `useState` y grandes cadenas de `useEffect` (Effect chains) para búsquedas de proveedores y cálculos. No utiliza funciones puras en `src/domain/`.

### Plan de Acción (UI/UX y Arquitectura):
1. **Desacoplamiento (Feature-Sliced Design):**
   - Crear `src/features/purchases/` con `components/`, `hooks/`, `types/`.
   - Mover lógica de negocio de compras (cálculos de impuestos y totales) a `src/domain/purchases/`.
2. **Refactor de Estados:** Reemplazar el abanico de `useState` por `useReducer` o hooks modulares (`usePurchaseCart`, `useSupplierSearch`).
3. **Mejoras UI/UX:**
   - **Modales:** Extraer el modal de búsqueda de productos a un componente dedicado `PurchaseProductModal.tsx`.
   - **Feedback Visual:** Implementar Shimmers (Skeletons de carga) mientras se obtienen datos del proveedor o productos, en lugar de bloquear la UI.
   - **Layout:** Reorganizar la Command Bar y el Data Grid con espaciado generoso y hovers sutiles propios de Fluent 2.

---

## 3. Módulo de Ventas (`/ventas`)

### Estado Actual:
- **Estructura TS:** Similar a compras, `SalesNew.tsx` es extremadamente grande (~2400 líneas). Mezcla el carrito, modales de reserva, lector de código de barras y UI.
- **Design System:** Usa algunos componentes base como `Badge`, `Select`, `Card`, pero la densidad de información asfixia la interfaz.
- **React Best Practices:** Manejadores de teclado acoplados con `useEffect`. Cálculos de descuentos (`saleTotals`) en el render que podrían aislarse. 

### Plan de Acción (UI/UX y Arquitectura):
1. **Estructura Modular:** Crear `src/features/sales/` para componentes visuales y `src/domain/sales/calculations` para descuentos y totales.
2. **Limpieza de Hooks:**
   - Extraer la lógica del escáner de código de barras a un hook `useBarcodeScanner.ts`.
   - Limpiar efectos acoplados de eventos `F2`/`F3`.
3. **Mejoras UI/UX:**
   - **Interacciones:** Mejorar la UI del carrito separándola en un componente `SalesCartGrid.tsx`.
   - **Modales:** Separar el modal de "Cobro Inmediato" (`InstantPaymentDialog`) y de Reservas, añadiendo las capas de desenfoque y elevación Fluent.
   - **Jerarquías Limpias:** Usar Message Bars discretos para alertas (ej. cliente sin crédito) en lugar de "Toasts" bloqueantes para acciones naturales.

---

## Siguiente Paso
Si estás de acuerdo con este plan, procederé a implementarlo progresivamente, empezando por desacoplar o refinar un módulo a la vez (recomendación: empezar por limpiar el de `/productos` a `.tsx` completo o iniciar el gran split de `/compras`). 

¿Por dónde prefieres que empecemos?
