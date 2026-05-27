# Plan de Ejecución: Integración de Costos, Precios y Transacciones en Base a React Best Practices y TypeScript

Este plan de ejecución detalla los pasos para asegurar una correcta implementación e integración frontend de las APIs de costos y precios, compras y transacciones bajo una arquitectura de TypeScript basada en features/dominio y mejores prácticas de React, incluyendo la resolución de las pruebas unitarias que actualmente fallan.

## Contexto y Estado Actual

Se han diseñado e implementado múltiples APIs en el backend para dar soporte a un contexto multi-sucursal (multi-branch):
1. **API de Costos y Precios (`COST_PRICING_API.md`)**: El historial completo de costos reside en `price_transactions` y `unit_costs` solo mantiene el estado actual (1 fila por producto+unidad).
2. **API de Integración en Compras (`PURCHASE_PRICING_INTREGATION_API.md`)**: Envio de `price_includes_tax` por ítem, desglose fiscal del backend, warnings, soporte a `branch_id`, y manejo de moneda y métodos de pago reales.
3. **API de Transacciones de Precio (`PRICE_TRANSACTION_API.md`)**: Auditoría unificada de precios y costos, consistencia y reportes de varianza.
4. **API de Productos (`PRODUCT_API.md`)**: Enriquecimiento del modelo de productos, jerarquía fiscal para resolución de IVA, y endpoints para flujos de venta y compra.

## Directrices Clave de Implementación

### 1. React Best Practices (Skill `react-best-practices`)
* **Evitar useEffects Innecesarios**: Calcular valores derivados durante el renderizado (ej. márgenes, subtotales, totales de impuestos).
* **Manejo de Eventos**: Desencadenar actualizaciones de estado y llamadas a API directamente desde gestores de eventos (`onClick`, `onSubmit`), no mediante efectos reactivos.
* **Cleanup Completo**: Asegurar cancelación e ignorado de peticiones asíncronas lentas (ej. al buscar productos) usando banderas `ignore` o `AbortController`.
* **Estabilidad de Referencias**: Utilizar callbacks y hooks personalizados para aislar lógica compleja.

### 2. Guías de TypeScript y Estructura (`docs/guides/typescript-migration.md`)
* **Separación Features/Dominio**:
  * `src/features/<feature>/`: Componentes visuales de React (`.tsx`), hooks locales, tipos específicos de UI y llamadas a API (`services/`).
  * `src/domain/<module>/`: Cálculos matemáticos puros, reglas de redondeo de precios, y validaciones sin dependencia alguna de React (`.ts` puro).
* **Tipado Estricto**: Definición de interfaces precisas en `src/types.ts` y contratos de servicio.

### 3. Sistema de Diseño Fluent 2.0 (`docs/design-system/`)
* **Alineación Visual**: Alta densidad de datos, layouts limpios con efecto de vidrio acrílico/mica, y espaciado consistente.
* **Uso de `overflow-hidden`**: Evitar recortes imperfectos en tarjetas con bordes redondeados (`rounded-xl`).
* **Numerical Contrast**: Aplicar la escala de pesos numéricos adecuada en `font-mono` para dar prioridad visual a totales.
* **Layouts Fluidos**: Seguir la regla de no duplicar divs contenedores rígidos en subpáginas; delegar al layout global.

---

## Plan de Trabajo por Fases

### Fase 1: Análisis e Infraestructura de Tipos
* [ ] Validar que los tipos y modelos en `src/types.ts` reflejen con precisión las interfaces enriquecidas de la API:
  * `ProductEnriched` (con clasificación fiscal y campos de stock).
  * `ProductOperationInfoResponse` (con hints contextuales y desglose de IVA).
  * `CostTransactionRequest` / `CostManualAdjustmentRequest` / `CostTransactionResponse`.
* [ ] Verificar que los servicios como `costPricingService.ts` manejen adecuadamente los parámetros de consulta contextuales (`branch_id`).

### Fase 2: Módulo de Compras (Pricing & Tax Integration)
* [ ] **Pantalla de Compras (`src/pages/Purchases.tsx`)**:
  * [ ] Integrar selector explícito de modo de precios: modo margen (calculado por backend via `profit_pct`) vs precio de venta explícito (`explicit_sale_price`).
  * [ ] Configurar el payload de `POST /purchase/complete` para enviar el IVA correspondiente y la propiedad `price_includes_tax` de forma explícita por cada ítem.
  * [ ] Enviar el ID de sucursal (`branch_id`) en el cuerpo del request o via query param.
  * [ ] En la UI de confirmación de compra, mostrar el desglose fiscal final resuelto por el backend (`applied_tax_rate`, `tax_resolution_source`), la sucursal final asignada y advertencias (`warnings`) si existiesen.
  * [ ] Evitar efectos reactivos encadenados para la suma de subtotales; computarlos en caliente durante el renderizado.

### Fase 3: Dashboard de Transacciones y Ajustes Directos
* [ ] **Auditoría y Ajustes (`src/pages/PriceTransactions.jsx`)**:
  * [ ] Incorporar el selector para alternar la vista entre transacciones de "Precios de Venta" y "Costos de Compra".
  * [ ] Para la vista de Costos, consumir `/cost-transactions/by-date` para la tabla general e integrar búsquedas de historial de costos por producto consumiendo `/cost-transactions/product/{id}/history`.
  * [ ] Implementar la funcionalidad de ajuste manual de costos consumiendo `registerManualCostAdjustment` con entrada de justificación obligatoria (`reason`).
  * [ ] Ajustar la presentación visual conforme a Fluent 2 (densidad, bordes limpios, contraste de números).

### Fase 4: Ficha del Producto y Auditoría Rápida
* [ ] **Detalle del Producto (`src/features/products/`)**:
  * [ ] Incorporar en `ProductDetailsModal.tsx` gatillos de acción rápida para ver el historial consolidado de costos y precios, y aplicar ajustes rápidos con control de visualización basado en permisos RBAC (`products:write`).
  * [ ] Implementar componentes específicos (`ProductHistoryModals.tsx`) con visualización tabular densa de transacciones.

### Fase 5: Corrección de Pruebas Unitarias
* [ ] **`inlineEdit.test.jsx`**: Corregir la pulsación del botón `editButtons[1]` (que produce error de elemento DOM no proporcionado al no existir más de un botón de edición en la tarjeta bajo prueba) para que pulse `editButtons[0]`.
* [ ] **`useProductStore.abort.test.js`**: Corregir el espía sobre `productService.searchProducts` para espiar el método real `productService.searchInfo`.
* [ ] **`useProductStore.ttl.expiration.test.js`**: Corregir espías sobre `productService.getProducts` (cambiar a `getProductsPaginated`) y `productService.searchProductsInfo` (cambiar a `searchInfo`).
* [ ] **`useProductStore.cache.test.js`**: Corregir el mock endpoint de MSW `/products/name/:name` a `/products/info/search/:name` para alinearlo con la API de búsquedas operativas enriquecidas real que consume el store.

---

## Plan de Verificación

### Pruebas Automatizadas
* Ejecutar la suite de pruebas del proyecto:
  ```bash
  pnpm test
  ```
* Validar que la compilación de TypeScript no presente errores estáticos en los archivos del dominio y features modificados:
  ```bash
  pnpm tsc --noEmit
  ```

### Verificación Manual
1. **Flujo de Compras**: Crear una orden de compra, alternar entre modos de margen e IVA incluido/excluido, procesarla y verificar que la UI muestre la sucursal, desglose de IVA y warnings correctamente.
2. **Dashboard de Transacciones**: Cambiar al selector de costos, registrar un ajuste manual y validar que aparezca en el historial del producto de manera consistente.
3. **Ficha de Producto**: Validar el funcionamiento del historial rápido y que no se permitan escrituras sin el permiso de edición.
