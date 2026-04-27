# Plan de Implementación: Transacciones de Precio (v1.0) e Integración en Compras (v1.1)

## 1. Background & Motivation
El sistema requiere una auditoría inmutable de todos los cambios de precio para garantizar la consistencia financiera y facilitar análisis de mercado (v1.0). Adicionalmente, el flujo de compras debe integrarse con este sistema para permitir la fijación de precios mediante margen o precio explícito directamente al recibir mercadería (v1.1).

## 2. Scope & Impact
- **Impacto Alto:** Creación de Órdenes de Compra con reglas de pricing dinámicas.
- **Impacto Alto:** Nuevo módulo de Auditoría de Transacciones de Precio.
- **Impacto Medio:** Servicios API de transacciones y compras.
- **Archivos Afectados:**
  - `src/services/purchaseService.ts`
  - `src/services/priceTransactionService.js`
  - `src/pages/Purchases.tsx`
  - `src/pages/PriceTransactions.jsx`
  - `src/hooks/usePriceTransactions.js`

## 3. Proposed Solution
Se implementará una integración bidireccional entre compras y transacciones de precio.

- **Servicios:**
  - `purchaseService.ts`: Se actualizará `createEnhancedPurchaseOrder` para enviar `explicit_sale_price` y `profit_pct` en cada ítem del `order_details`, permitiendo que el backend aplique las reglas de cálculo (v1.1).
  - `priceTransactionService.js`: Se validará que soporte los 8 tipos de transacciones definidos y se refinarán los reportes de varianza.

- **Interfaz de Usuario (UI):**
  - `Purchases.tsx`: Se asegurará que el `handleSavePurchase` envíe los datos de pricing de cada ítem de forma explícita. Se mostrarán los `warnings` fiscales que devuelva el backend tras la creación.
  - `PriceTransactions.jsx`: Se actualizará para usar `transaction_types` dinámicos del backend y se mejorará la visualización de reportes de varianza y volatilidad.

## 4. Implementation Plan

### Fase 1: Sincronización de Servicios
- **purchaseService.ts**:
  - Ajustar el mapeo de `order_details` en `createEnhancedPurchaseOrder` para incluir `explicit_sale_price` y `profit_pct`.
  - Asegurar la captura de `warnings` en la respuesta.
- **priceTransactionService.js**:
  - Verificar que el mapeo de metadatos incluya la versión del sistema.

### Fase 2: Refactorización de la UI de Compras
- **Purchases.tsx**:
  - Actualizar `handleSavePurchase` para mapear correctamente `pricing_mode` a los campos requeridos por el backend (`explicit_sale_price` solo si el modo es precio fijo, `profit_pct` si es por margen).
  - Asegurar que `unit` se envíe normalizado.
  - Implementar visualización de `warnings` del backend (ej. discrepancias de IVA).

### Fase 3: Dashboard de Transacciones de Precio
- **PriceTransactions.jsx**:
  - Integrar el selector de tipos de transacción cargado desde `/price-transactions/types`.
  - Mejorar la visualización del reporte de varianza con los campos `price_volatility` y `total_change_percent`.
  - Sincronizar estados de consistencia con las recomendaciones del backend.

## 5. Verification
1. **Prueba de Compra con Margen**: Crear una compra especificando solo el margen y verificar que el backend calcule el precio de venta.
2. **Prueba de Compra con Precio Explícito**: Crear una compra con precio de venta fijo y verificar que el margen se guarde solo como referencia.
3. **Validación de Transacciones**: Verificar que cada compra genere transacciones de precio visibles en el nuevo dashboard de auditoría.
4. **Consistencia**: Ejecutar el reporte de consistencia y verificar que detecte discrepancias simuladas.

## 6. Migration & Rollback
- **Rollback**: El sistema de transacciones es independiente; si falla, el registro de compras puede continuar operando aunque con auditoría limitada. Los campos de pricing en compras son opcionales en el backend (usan defaults si no vienen), lo que minimiza el riesgo de rotura.