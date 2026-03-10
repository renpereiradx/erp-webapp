# Business Intelligence - Endpoints Empresariales

Sistema de endpoints para análisis empresarial, reportes y toma de decisiones.

## Descripcion General

Este módulo agrega capacidades de inteligencia de negocios al ERP, permitiendo:

- **Dashboard Ejecutivo**: Visión consolidada del estado del negocio
- **Cuentas por Cobrar/Pagar**: Control de flujo de efectivo
- **Analytics de Ventas**: Análisis detallado de comportamiento comercial
- **Analytics de Inventario**: Optimización de stock y capital de trabajo
- **Análisis de Rentabilidad**: Identificación de productos y clientes rentables
- **Reportes Financieros**: Estados financieros y cumplimiento fiscal
- **Gestión de Comisiones**: Control de incentivos a vendedores
- **Fidelización**: Programas de retención de clientes
- **Auditoría**: Trazabilidad completa de operaciones
- **Forecasting**: Proyecciones basadas en histórico
- **Gestión de Metas**: Seguimiento de objetivos

## Módulos

| Módulo                   | Estado        | Documentación                                            |
| ------------------------ | ------------- | -------------------------------------------------------- |
| Dashboard                | Completado    | [dashboard-api.md](dashboard-api.md)                     |
| Cuentas por Cobrar       | Completado    | [receivables-api.md](receivables-api.md)                 |
| Cuentas por Pagar        | Completado    | [payables-api.md](payables-api.md)                       |
| Reportes Financieros     | Completado    | [financial-reports-api.md](financial-reports-api.md)     |
| Analytics de Ventas      | Completado    | [sales-analytics-api.md](sales-analytics-api.md)         |
| Analytics de Inventario  | Completado    | [inventory-analytics-api.md](inventory-analytics-api.md) |
| Análisis de Rentabilidad | Completado    | [profitability-api.md](profitability-api.md)             |
| Comisiones               | Deshabilitado | [commissions-api.md](commissions-api.md)                 |
| Fidelización             | Deshabilitado | [loyalty-api.md](loyalty-api.md)                         |
| Auditoría                | Completado    | [audit-api.md](audit-api.md)                             |
| Forecasting              | Completado    | [forecast-api.md](forecast-api.md)                       |
| Metas                    | Deshabilitado | [goals-api.md](goals-api.md)                             |

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (handlers/)                     │
├─────────────────────────────────────────────────────────────┤
│  dashboard_handler.go  │  analytics_handler.go  │  ...      │
└────────────────────────┴────────────────────────┴───────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (services/)                   │
├─────────────────────────────────────────────────────────────┤
│  DashboardService  │  AnalyticsService  │  ReportService    │
└────────────────────┴────────────────────┴───────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Repository Layer (repository/)                │
├─────────────────────────────────────────────────────────────┤
│  Queries optimizadas con agregaciones y CTEs               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
├─────────────────────────────────────────────────────────────┤
│  Vistas materializadas  │  Funciones agregadas  │  Índices  │
└─────────────────────────┴───────────────────────┴───────────┘
```

## Convenciones

### Endpoints

- Base path: `/api/v1/` (para nuevos endpoints de BI)
- Compatibilidad Forecast: también se exponen rutas legacy en `/forecast/*`
- Autenticación: JWT Bearer Token requerido
- Formato: JSON
- Fechas: ISO 8601 (`2025-01-15T10:30:00Z`)

### Compatibilidad de Rutas (Forecast)

Para mantener compatibilidad con frontend BI existente, el módulo de pronósticos acepta ambos prefijos:

- `/api/v1/forecast/*` (principal)
- `/forecast/*` (legacy)

Ejemplos equivalentes:

- `/api/v1/forecast/sales` y `/forecast/sales`
- `/api/v1/forecast/dashboard` y `/forecast/dashboard`

### Parámetros de Fecha Comunes

| Parámetro    | Descripción                   | Ejemplo                          |
| ------------ | ----------------------------- | -------------------------------- |
| `start_date` | Fecha inicio del período      | `2025-01-01`                     |
| `end_date`   | Fecha fin del período         | `2025-01-31`                     |
| `period`     | Período predefinido           | `today`, `week`, `month`, `year` |
| `compare`    | Comparar con período anterior | `true/false`                     |

### Respuestas Estándar

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "period": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  }
}
```

## Prioridad de Implementación

1. **Fase 1 - Core** (Completado)
   - Dashboard Ejecutivo
   - Alertas básicas

2. **Fase 2 - Financiero** (Completado)
   - Cuentas por Cobrar
   - Cuentas por Pagar
   - Reportes Financieros

3. **Fase 3 - Analytics** (Completado)
   - Analytics de Ventas (Completado)
   - Analytics de Inventario (Completado)
   - Análisis de Rentabilidad (Completado)

4. **Fase 4 - Avanzado** (Parcial)
   - Comisiones (Deshabilitado — tablas de BD no creadas)
   - Fidelización (Deshabilitado — tablas de BD no creadas)
   - Auditoría (Completado)
   - Forecasting (Completado)
   - Metas (Deshabilitado — tablas de BD no creadas)

---

**Última actualización:** 2026-03-09
