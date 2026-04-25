# Plan de Implementación: Suite de Business Intelligence (BI)

## Objetivo
Refactorizar y completar la suite de servicios de BI para cumplir con la guía `BI_API.md`, asegurando soporte para visión multi-sucursal, filtrado por fechas y tipado estricto.

## Tareas

### 1. Definir Tipos Base de BI (`src/types/bi.ts`)
Crear un nuevo archivo de tipos para no saturar `src/types.ts`.
*   `BIParams`: `branch_id`, `start_date`, `end_date`.
*   `DashboardSummary`, `KPIData`, `SalesPerformance`, `StockLevels`, etc.

### 2. Refactorizar/Crear Servicios de BI
Mover y migrar a TypeScript los siguientes servicios:
*   `dashboardService.ts`: Implementar `/dashboard/summary`, `/dashboard/kpis`, etc.
*   `receivablesService.ts`: `/receivables/overview`, `/receivables/aging/report`, etc.
*   `payablesService.ts`: `/payables/overview`, `/payables/cash-flow`, etc.
*   `financialReportsService.ts`: `/financial-reports/vat`, `/financial-reports/income-statement`, etc.
*   `salesAnalyticsService.ts`: `/sales-analytics/performance`, `/sales-analytics/heatmap`, etc.
*   `inventoryAnalyticsService.ts`: `/inventory-analytics/stock-levels`, `/inventory-analytics/turnover`, etc.

### 3. Estandarización de Llamadas
Todos los métodos seguirán este patrón:
```typescript
async getX(params: BIParams = {}): Promise<T> {
  return await apiClient.get('/endpoint', { params });
}
```

### 4. Soporte para Modo DEMO
Mantener la capacidad de fallback a datos locales si la API falla o estamos en modo demo, pero de forma más limpia (usando interceptores o decoradores).

## Consideraciones de Seguridad (RBAC)
*   Integrar validaciones de rol en los servicios para prevenir llamadas innecesarias que terminarán en 403.
*   ADMIN: puede omitir `branch_id` para visión global.
*   Non-ADMIN: `branch_id` es obligatorio (el cliente lo inyectará automáticamente si está seleccionado).

## Aprobación
¿Deseas que proceda con la creación de la estructura de servicios BI en `src/services/bi/` y la definición de tipos?