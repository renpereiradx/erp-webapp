# Plan de Refactorización: Dashboard de Analítica de Inventario

Este plan aborda la eliminación de datos hardcodeados y la normalización del formato numérico en la página `/inventory-analytics/dashboard`.

## Objetivo
- Eliminar contenido estático (tendencias, insignias, textos) que no provenga de la API.
- Asegurar que todos los datos numéricos utilicen un máximo de dos decimales con redondeo preciso.
- Mantener la compatibilidad con los modos `api` y `demo`.

## Archivos Afectados
- `src/pages/InventoryAnalytics/InventoryDashboard.tsx`
- `src/types/inventoryAnalytics.ts` (opcional, para añadir campos de tendencia si se decide soportarlos)

## Cambios Propuestos

### 1. Limpieza de `InventoryDashboard.tsx`
- **KPIs:**
    - Eliminar `trend` y `trendType` de los `KPIWidget` ya que no existen en el modelo de datos actual de la API (`InventoryDashboardData`).
    - Eliminar `badge` de los `KPIWidget` (ej: "En Meta", "Alerta Moderada").
    - Refactorizar `potentialProfit`: Eliminar el fallback hardcodeado `(data.kpis.total_value * 0.28)` y usar `0` o un cálculo basado estrictamente en datos existentes si `overview` no está disponible.
- **Header:**
    - Cambiar "Periodo: Actual" por un valor dinámico o eliminar si no hay control de periodo implementado.
- **Formato Numérico:**
    - Revisar todos los lugares donde se muestran números y aplicar `.toFixed(2)` o `Intl.NumberFormat` con `maximumFractionDigits: 2`.
    - En el Resumen ABC, asegurar que el cálculo de `value` (en Gs.) sea preciso.

### 2. Actualización de Tipos (Opcional pero Recomendado)
- Si se desea soportar tendencias en el futuro, añadir campos opcionales `trend` y `trend_type` a la interfaz `InventoryDashboardData` en `src/types/inventoryAnalytics.ts`. Por ahora, el enfoque es limpiar lo hardcodeado.

## Verificación y Pruebas
1. **Modo Demo:** Verificar que los datos se cargan correctamente desde los mocks y que no aparecen las tendencias/insignias eliminadas.
2. **Modo API:** Asegurar que la página no rompa si la API real no envía ciertos campos opcionales.
3. **Formato:** Validar visualmente que todos los números tengan como máximo 2 decimales (ej: 4.20x en lugar de 4.2x si se prefiere consistencia, o simplemente asegurar que no excedan 2).
4. **Cálculos:** Verificar que `potentialProfit` y los valores del ABC cuadren con los totales.

## Cronograma de Implementación
1. Identificación de strings hardcodeados.
2. Aplicación de formatos numéricos.
3. Eliminación de props estáticas en componentes.
4. Validación final.
