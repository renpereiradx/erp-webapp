# Plan de Integración: Manejo de Precios y Costos (Multi-Branch) - v2.0 (Mayo 2026)

Este plan de implementación detalla cómo integrar los cambios de la API para el manejo de precios y costos en el frontend, basándose en los documentos de referencia actualizados al 2026-05-23.

---

## 1. Background & Motivation
El sistema requiere una auditoría inmutable de todos los cambios de precios y costos a nivel de sucursal para garantizar la consistencia financiera global y de BI (Business Intelligence).
- **unit_costs** ahora usa versionado temporal (`effective_from`/`effective_to`).
- Se han removido datos de proveedor y orden de compra de `unit_costs`; ahora la fuente canónica es `purchase_order_details`.
- Los cambios de costo manuales se auditan de forma unificada en `price_transactions` con `price_type='cost_price'`.
- La integración en compras (`POST /purchase/complete`) requiere soportar parámetros fiscales como `price_includes_tax` (por ítem), devolver códigos reales de monedas/métodos de pago, y procesar advertencias y sucursales asignadas en la confirmación.

---

## 2. Scope & Impact
- **Impacto Alto:** Integración de pricing e IVA en compras (`Purchases.tsx`).
- **Impacto Alto:** Pantalla de Transacciones de Precios (`PriceTransactions.jsx`) con soporte completo de costos.
- **Impacto Medio:** Modales de Auditoría y Ajuste en la Ficha del Producto (`ProductDetailsModal.tsx`).
- **Impacto Medio:** Capa de servicios (`costPricingService.ts`, `types.ts`).
- **Archivos Afectados:**
  - `src/types.ts`
  - `src/services/costPricingService.ts`
  - `src/hooks/useCostTransactions.js` (Nuevo)
  - `src/features/products/components/ProductDetailsModal.tsx`
  - `src/features/products/components/ProductHistoryModals.tsx` (Nuevo)
  - `src/pages/PriceTransactions.jsx`
  - `src/pages/Purchases.tsx`

---

## 3. Proposed Changes

### Fase 1: Servicios y Tipos (Core)
- **src/types.ts**:
  - Registrar endpoints de la API `/cost-transactions` en `API_ENDPOINTS`.
  - Definir interfaces TypeScript para `CostTransactionRequest`, `CostManualAdjustmentRequest` y `CostTransactionResponse`.
- **src/services/costPricingService.ts**:
  - Corregir bug de ámbito en `getCostMethods` inyectando `productId` como parámetro.
  - Implementar métodos HTTP para todos los nuevos endpoints de `/cost-transactions` (historial, registro, ajuste manual, etc.).
- **src/hooks/useCostTransactions.js** [NEW]:
  - Hook especializado para aislar el consumo de la API de transacciones de costos.

### Fase 2: Ajuste y Auditoría Directa en Productos
- **ProductDetailsModal.tsx**:
  - Agregar disparadores visuales para abrir el historial y realizar ajustes manuales rápidos (precios y costos) desde la ficha del producto.
- **ProductHistoryModals.tsx** [NEW]:
  - Diálogos Fluent 2/Tailwind para visualizar el historial detallado de precios/costos y realizar ajustes manuales requiriendo un motivo (`reason`).
  - Control de visibilidad de botones mediante permisos RBAC (`products:write`).

### Fase 3: Soporte de Costos en el Dashboard de Transacciones
- **PriceTransactions.jsx**:
  - Implementar un toggle global (Ventas vs Costos).
  - Al seleccionar "Costos", cargar las transacciones recientes consumiendo `/cost-transactions/by-date` y el historial por producto mediante la nueva API de costos.
  - Implementar el formulario de ajuste manual de costo consumiendo `/cost-transactions/manual-adjustment` con validaciones robustas.

### Fase 4: Integración en Compras (Pricing & Tax)
- **Purchases.tsx**:
  - Enviar `price_includes_tax` (neto vs bruto) de forma explícita por cada ítem.
  - Enviar `explicit_sale_price` solo en modo explícito y `profit_pct` en modo margen.
  - Soportar el parámetro `branch_id` en el body o query param.
  - Renderizar el desglose fiscal retornado (`applied_tax_rate`, `tax_resolution_source`) en la confirmación.
  - Mostrar alertas persistentes y detalladas cuando la API retorne `warnings`.
  - Mostrar la sucursal asignada final en la UI.
  - Utilizar los códigos reales del método de pago (`CASH`, `TRANSFER`) y moneda (`PYG`, `USD`) retornados.

---

## 4. Verification Plan

### Automated Tests
- Ejecutar pruebas en utilidades de moneda:
  `npm run test tests/unit/currencyUtils.test.js`
- Probar el mapeo de llamadas HTTP en el servicio:
  `npm run test tests/unit/costPricingService.test.ts`

### Manual Verification
1. **Compras:** Completar una compra y validar el procesamiento correcto del desglose fiscal, alertas en warnings, y asignación de sucursal.
2. **Historial y Ajuste de Producto:** Probar los ajustes directos en la modal de detalles del producto, verificando que los cambios se reflejen en la base de datos y se auditen en el historial.
3. **Dashboard Unificado:** Verificar el funcionamiento del selector Ventas/Costos en el panel de auditoría general.