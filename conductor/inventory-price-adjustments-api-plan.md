# Plan de Implementación: APIs de Ajustes de Inventario y Precios (v4.3 y v2.1)

## 1. Background & Motivation
El backend ha actualizado significativamente las APIs para gestionar **Ajustes de Inventario** (v4.3) y **Ajustes Manuales de Precios** (v2.1). Estas actualizaciones introducen requisitos estrictos de validación en los metadatos (`metadata`) de cada operación. 

Actualmente, el frontend envía metadatos, pero algunas versiones (ej. `4.2.0-frontend`) y valores de enums (ej. `OTHER` en categorías de razón) no están completamente alineados con los nuevos JSON Schemas del backend, lo que resultará en errores `400 Bad Request`. Adicionalmente, el frontend debe soportar los nuevos campos introducidos en la versión 2.1 de precios (como la normalización de unidades).

## 2. Scope & Impact
- **Impacto Alto:** Creación de Ajustes de Inventario Manuales y Creación de Inventarios Físicos.
- **Impacto Alto:** Creación de Ajustes de Precios Manuales.
- **Impacto Bajo:** Visualización del historial de transacciones (ya implementado, requiere pequeños ajustes de mapeo).
- **Archivos Afectados:**
  - `src/constants/inventoryDefaults.js`
  - `src/services/inventoryService.js`
  - `src/services/priceAdjustmentService.js`
  - `src/pages/PriceAdjustmentDetail.jsx`
  - `src/pages/InventoryAdjustmentManual.jsx`

## 3. Proposed Solution
La solución implica una refactorización de las constantes compartidas y la adaptación de los servicios API para construir y validar correctamente los metadatos. En los componentes UI, se garantizará que los selectores proporcionen opciones válidas.

- **inventoryDefaults.js:** Se actualizará `REASON_OPTIONS` y `DEFAULT_METADATA_TEMPLATES` para utilizar la versión `4.3.0-frontend`. Se eliminarán o mapearán los valores no permitidos en el enum de `adjustment_type` (como `OTHER`).
- **inventoryService.js:** Se actualizarán los metadatos base para que envíen `system_version: '4.3.0-frontend'`.
- **priceAdjustmentService.js:** Se adaptará el payload de `createPriceAdjustment` para cumplir con la versión `2.1.0-frontend`, asegurando la inyección de metadatos robustos y la unidad en minúscula.
- **Componentes UI:** Se actualizará la generación dinámica de metadatos en `PriceAdjustmentDetail.jsx` e `InventoryAdjustmentManual.jsx` basándose en las nuevas constantes.

## 4. Alternatives Considered
- **Generar metadatos en el backend:** Se consideró depender de la autogeneración de metadatos en el backend. Sin embargo, para auditoría completa y registro del "operador", es mejor que el frontend construya explícitamente los metadatos enriquecidos en lugar de enviar un objeto vacío.
- **Validación JSON Schema en Frontend:** Se podría incorporar una librería para validar el JSON schema antes de enviarlo. Sin embargo, esto incrementa el peso del bundle. En su lugar, usaremos validación estricta en los formularios de UI mediante enums mapeados.

## 5. Implementation Plan

### Fase 1: Constantes y Metadatos (Stock)
- Actualizar `src/constants/inventoryDefaults.js`:
  - Cambiar `system_version` en `DEFAULT_METADATA_TEMPLATES` a `4.3.0-frontend`.
  - Remover la opción `OTHER` de `REASON_OPTIONS` o mapearla internamente a `CORRECTION` para asegurar que el request cumpla con el enum (`INVENTORY_COUNT, DAMAGE, EXPIRY, THEFT, RETURN, CORRECTION, INITIAL_COUNT`).

### Fase 2: Servicios API
- Modificar `src/services/inventoryService.js`:
  - En `createInventory`: Validar y asegurar que los metadatos incluyan `system_version: '4.3.0-frontend'` y se pase a través de la red correctamente.
  - En `createManualAdjustment`: Mapear correctamente la `reasonCategory` a un `adjustment_type` válido y forzar `system_version`.
- Modificar `src/services/priceAdjustmentService.js`:
  - Actualizar `createPriceAdjustment` para usar `system_version: '2.1.0-frontend'`.
  - Asegurar que `unit` se envíe normalizada (`toLowerCase()`).
  - Completar los campos requeridos en el metadata de precios (`adjustment_type`, `old_price`, `new_price`, `price_difference`).

### Fase 3: Interfaz de Usuario
- Actualizar `src/pages/PriceAdjustmentDetail.jsx`:
  - Modificar `handleSubmit` para estructurar la metadata con el enum correcto (`MARKET_UPDATE, COMPETITOR_ADJUSTMENT, PROMOTION, COST_CHANGE, CURRENCY_ADJUSTMENT, CORRECTION, SEASONAL`).
- Actualizar `src/pages/InventoryAdjustmentManual.jsx`:
  - Revisar la generación del payload de metadatos en `handleSubmit` para asegurar compatibilidad con la nueva validación.

## 6. Verification
1. **Prueba de Creación de Inventario:** Ejecutar la creación de un conteo de inventario asegurando un retorno 200 OK y que el `metadata` fue guardado.
2. **Prueba de Ajuste de Precio:** Verificar que al ajustar el precio de "UNIT" la llamada se procesa, y que `unit` se envía como "unit".
3. **Manejo de Errores:** Simular una respuesta 400 por "metadata inválida" y confirmar que la UI la muestra adecuadamente.

## 7. Migration & Rollback
- **Rollback:** El esquema es aditivo y compatible hacia atrás. En caso de fallar el guardado, el backend puede generar un fallback automático de metadata, o bien, restaurar las constantes previas es seguro ya que no altera la base de datos subyacente.