# Estado General de Refactorización UI/UX y Arquitectura

Este documento mantiene el estado real y progreso de las tareas definidas en `plan_refactorizacion_ui_ux.md`, basado en la inspección del repositorio.

## 📦 1. Módulo de Productos (`/productos`)
- [x] **Migración Completa a TSX:** Renombrar `Products.jsx` a `Products.tsx`, y `ProductFormModal.jsx` a `ProductFormModal.tsx`. Definir interfaces estrictas para los estados de los formularios.
- [x] **Mejora UI/UX en Modales:**
  - [x] Añadir soporte para Zod en la validación de `ProductFormModal` para dar feedback visual instantáneo (error states).
  - [x] Aplicar el efecto `glass-mica` o `glass-acrylic` en el backdrop de los modales para mayor profundidad.
- [x] **Refinamiento de Hooks:** Extraer funciones del componente de formulario a hooks puros para evitar cálculos derivados en el body.

## 🛒 2. Módulo de Compras (`/compras`)
- [x] **Desacoplamiento (Feature-Sliced Design):**
  - [x] Crear `src/features/purchases/` con `components/`, `hooks/`, `types/`. *(Implementado: `PurchaseCartTable.tsx`, `usePurchasesLogic.ts`, etc.)*
  - [x] Mover lógica de negocio de compras (cálculos de impuestos y totales) a reglas de dominio. *(Implementado en `src/domain/purchase/pricing/`)*
- [x] **Refactor de Estados:** Reemplazar el abanico de `useState` por `useReducer` o hooks modulares. *(Implementado con `usePurchasesLogic.ts`)*
- [x] **Mejoras UI/UX:**
  - [x] Extraer el modal de búsqueda de productos a un componente dedicado `PurchaseProductModal.tsx`. *(Completado)*
  - [x] Implementar Shimmers (Skeletons de carga) mientras se obtienen datos.
  - [x] Reorganizar la Command Bar y el Data Grid con espaciado generoso y hovers sutiles propios de Fluent 2.

## 💳 3. Módulo de Ventas (`/ventas`)
- [~] **Estructura Modular:**
  - [~] Crear `src/features/sales/` para componentes visuales y estados (Extracción de `useSalesLogic.ts` en proceso y scripts creados).
  - [x] Mover reglas de dominio a `src/domain/sale/calculations` (descuentos y totales).
- [x] **Limpieza de Hooks:**
  - [x] Extraer la lógica del escáner de código de barras a un hook `useBarcodeScanner.ts`.
  - [x] Limpiar efectos acoplados de eventos de teclado (F2/F3).
- [x] **Mejoras UI/UX:**
  - [x] Extraer la UI del carrito a un componente `SalesCartGrid.tsx`.
  - [x] Separar el modal de "Cobro Inmediato" (`InstantPaymentDialog`) y de Reservas, añadiendo las capas de desenfoque y elevación Fluent.
  - [x] Usar Message Bars discretos para alertas (ej. cliente sin crédito) en lugar de "Toasts" bloqueantes para acciones naturales.

---
_Nota: `[x]` indica tarea completada. `[~]` indica que la tarea se encuentra actualmente en progreso._
