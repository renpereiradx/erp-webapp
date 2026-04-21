# Plan de Refactorización de ProfitabilityDashboard

## Objetivo
Refactorizar el componente `/profitability/dashboard` para alinearlo con el sistema de diseño Fluent ERP 2.0. El refactor asegurará que no haya datos hardcodeados en el UI y que todos los valores numéricos estén formateados con un máximo de 2 decimales y fuentes monoespaciadas. Todos los datos, incluyendo el gráfico, provendrán del endpoint `getDashboard`.

## Archivos Clave & Contexto
- `src/features/profitability/components/ProfitabilityDashboard.jsx`: Componente principal a refactorizar.
- `src/data/profitabilityMocks.js`: Archivo de mocks donde se consolidarán los datos faltantes en la estructura `dashboard`.
- `@docs/design-system/README.md`: Documentación del sistema de diseño (Fluent 2.0).

## Pasos de Implementación

### 1. Actualización de `profitabilityMocks.js`
- Agregar al objeto `dashboard` de los mocks la propiedad `efficiency_trend` con un array `data_points` que contenga pares de meses y porcentajes de eficiencia (e.g. `{ label: "ENE", performance: 60 }`).
- Agregar en `dashboard.kpis` las propiedades `net_margin_growth`, `roi_growth` y `profit_per_tx_growth` para reemplazar los valores de tendencia "0.5", "3.1" y "0".
- Agregar en `dashboard.break_even_status` la propiedad `coverage_required` (e.g., `18`) para reemplazar el texto hardcodeado en la interfaz.

### 2. Refactorización UI de `ProfitabilityDashboard.jsx` (Fluent 2.0)
- **Fuentes**: Aplicar `font-sans` (Inter) para la tipografía principal del UI y `font-mono` (JetBrains Mono) exclusivamente a la visualización de datos numéricos (KPIs y montos) para mejor legibilidad, alineado al sistema de diseño.
- **Formateo de Números**: Revisar que todo valor numérico renderizado (como el ROI en el bloque de Punto de Equilibrio `+${kpis.roi}%`) pase por la función `formatPercent()` o `formatPYG()`. La función `formatPercent` ya está configurada a 2 decimales como máximo, pero debe usarse consistentemente en todo el código.

### 3. Eliminación de Datos Hardcodeados
- **Tarjetas KPI**: 
  - Cambiar `<KPICard ... trendValue='0.5' />` para el Margen Neto a usar `kpis.net_margin_growth`.
  - Cambiar `<KPICard ... trendValue='3.1' />` para ROI Auditado a usar `kpis.roi_growth`.
  - Cambiar `<KPICard ... trendValue='0' />` para Ganancia / Tx a usar `kpis.profit_per_tx_growth`.
- **Gráfico de Tendencia de Eficiencia**:
  - Reemplazar los arrays estáticos `[60, 75, 65, ...]` y `['ENE', 'FEB', 'MAR', ...]` mapeando los datos de `data.efficiency_trend.data_points`.
- **Punto de Equilibrio**:
  - Reemplazar el número "18%" por `{break_even_status.coverage_required}%` o dejar un fallback de seguridad para cuando este valor sea devuelto por la API.

### 4. Componentes UI Identificados
- **Header**: Navegación y título principal (`glass-acrylic`).
- **Selector de Período**: Opciones temporales (`Hoy`, `Semana`, `Mes`, `Año`).
- **KPICard**: Componente reutilizable con indicadores y flechas de tendencia (`shadow-fluent-2`, `hover:shadow-fluent-16`).
- **Gráfico (Tendencia de Eficiencia)**: Gráfico de barras implementado manualmente.
- **Punto de Equilibrio (Break Even)**: Tarjeta de alto contraste lateral.
- **Alertas Críticas**: Lista de notificaciones de margen y rentabilidad.
- **Estados (Loading/Error)**: Componentes integrados para UX de carga e interrupción de red.

## Verificación & Pruebas
1. Revisar visualmente la página `/profitability/dashboard` asegurando que todos los estilos Fluent 2.0 apliquen correctamente (desenfoque acrílico, elevación y fuentes).
2. Confirmar que las tarjetas KPI y el gráfico de tendencias se ajusten a los datos mock actualizados sin valores hardcodeados.
3. Verificar que los números no superen los 2 decimales en ninguna de sus presentaciones.
