# Guía de API de Business Intelligence (BI) para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal (BI)

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

> **IMPORTANTE:** Los endpoints de BI usan `resolveBIContextFromAuth`, que tiene reglas más estrictas que los endpoints transaccionales.

### Reglas de Branch Context para BI

| Condición                                           | Comportamiento                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Usuario **ADMIN** sin enviar `branch_id`            | Puede consultar **todas** las sucursales (branch context = `nil`) |
| Usuario **non-ADMIN** sin enviar `branch_id`        | `400 Bad Request` — debe especificar sucursal                     |
| Usuario con `branch_id` fuera de `allowed_branches` | `403 Forbidden`                                                   |
| `branch_id` inválido (no es entero positivo)        | `400 Bad Request`                                                 |

### RBAC Financiero

| Rol        | Dashboard | Cuentas por Cobrar/Pagar | Reportes Financieros | Análisis de Ventas | Análisis de Inventario | Rentabilidad |
| ---------- | --------- | ------------------------ | -------------------- | ------------------ | ---------------------- | ------------ |
| `ADMIN`    | ✅        | ✅                       | ✅                   | ✅                 | ✅                     | ✅           |
| `BUYER`    | ✅        | ✅ Lectura               | ✅ Lectura           | ✅                 | ✅ Lectura             | ✅ Lectura   |
| `SUPPLIES` | ✅        | ❌                       | ❌                   | ✅                 | ✅                     | ❌           |
| `VENDOR`   | ❌        | ❌                       | ❌                   | ❌                 | ❌                     | ❌           |
| `CLIENT`   | ❌        | ❌                       | ❌                   | ❌                 | ❌                     | ❌           |

> Roles `SUPPLIES`, `VENDOR` y `CLIENT` reciben `403 Forbidden` en endpoints financieros sensibles.

---

## Endpoints

### Dashboard

#### GET /dashboard/summary

**Descripción:** Resumen ejecutivo del dashboard.

#### GET /dashboard/kpis

**Descripción:** Indicadores clave de rendimiento.

#### GET /dashboard/trends

**Descripción:** Tendencias del negocio.

#### GET /dashboard/alerts

**Descripción:** Alertas activas.

#### GET /dashboard/top-products

**Descripción:** Productos más vendidos.

#### GET /dashboard/sales-heatmap

**Descripción:** Mapa de calor de ventas.

#### GET /dashboard/recent-activity

**Descripción:** Actividad reciente.

---

### Cuentas por Cobrar (Receivables)

#### GET /receivables/overview

**Descripción:** Resumen de cuentas por cobrar.

#### GET /receivables/overdue

**Descripción:** Facturas vencidas.

#### GET /receivables/top-debtors

**Descripción:** Principales deudores.

#### GET /receivables/aging/summary

**Descripción:** Resumen de antigüedad de deudas.

#### GET /receivables/aging/report

**Descripción:** Reporte detallado de antigüedad.

#### GET /receivables/collection/reminders

**Descripción:** Recordatorios de cobranza.

#### GET /receivables/collection/high-priority

**Descripción:** Cobranzas de alta prioridad.

#### GET /receivables/statistics

**Descripción:** Estadísticas de cobranza.

#### GET /receivables/statistics/date-range

**Descripción:** Estadísticas en rango de fechas.

#### GET /receivables/client/{client_id}/risk

**Descripción:** Análisis de riesgo de un cliente.

#### GET /receivables/client/{client_id}

**Descripción:** Cuentas por cobrar de un cliente.

#### GET /receivables/{id}

**Descripción:** Obtiene una cuenta por cobrar por ID.

#### GET /receivables

**Descripción:** Lista cuentas por cobrar.

---

### Cuentas por Pagar (Payables)

#### GET /payables/overview

**Descripción:** Resumen de cuentas por pagar.

#### GET /payables/overdue

**Descripción:** Facturas vencidas.

#### GET /payables/urgent

**Descripción:** Pagos urgentes.

#### GET /payables/top-suppliers

**Descripción:** Principales proveedores.

#### GET /payables/schedule

**Descripción:** Cronograma de pagos.

#### GET /payables/aging/summary

**Descripción:** Resumen de antigüedad.

#### GET /payables/aging/report

**Descripción:** Reporte detallado de antigüedad.

#### GET /payables/reminders/urgent

**Descripción:** Recordatorios urgentes.

#### GET /payables/statistics

**Descripción:** Estadísticas de pagos.

#### GET /payables/statistics/date-range

**Descripción:** Estadísticas en rango de fechas.

#### GET /payables/cash-flow

**Descripción:** Proyección de flujo de caja.

#### GET /payables/payment-capacity

**Descripción:** Análisis de capacidad de pago.

#### GET /payables/supplier/{supplier_id}/analysis

**Descripción:** Análisis de un proveedor.

#### GET /payables/supplier/{supplier_id}

**Descripción:** Cuentas por pagar de un proveedor.

#### GET /payables/{id}

**Descripción:** Obtiene una cuenta por pagar por ID.

#### GET /payables

**Descripción:** Lista cuentas por pagar.

---

### Reportes Financieros

#### GET /financial-reports/income-statement

**Descripción:** Estado de resultados.

#### GET /financial-reports/income-statement/date-range

**Descripción:** Estado de resultados en rango de fechas.

#### GET /financial-reports/cash-flow

**Descripción:** Estado de flujo de efectivo.

#### GET /financial-reports/cash-flow/date-range

**Descripción:** Flujo de efectivo en rango.

#### GET /financial-reports/vat

**Descripción:** Reporte de IVA.

#### GET /financial-reports/vat/date-range

**Descripción:** IVA en rango de fechas.

#### GET /financial-reports/vat/monthly

**Descripción:** IVA mensual.

#### GET /financial-reports/sales-ledger

**Descripción:** Libro de ventas.

#### GET /financial-reports/sales-ledger/date-range

**Descripción:** Libro de ventas en rango.

#### GET /financial-reports/purchase-ledger

**Descripción:** Libro de compras.

#### GET /financial-reports/purchase-ledger/date-range

**Descripción:** Libro de compras en rango.

#### GET /financial-reports/profit-margins

**Descripción:** Márgenes de rentabilidad.

#### GET /financial-reports/profit-margins/date-range

**Descripción:** Márgenes en rango de fechas.

#### GET /financial-reports/tax-summary

**Descripción:** Resumen fiscal.

#### GET /financial-reports/tax-summary/annual

**Descripción:** Resumen fiscal anual.

#### GET /financial-reports/overview

**Descripción:** Resumen financiero general.

#### GET /financial-reports/health-score

**Descripción:** Score de salud financiera.

#### GET /financial-reports/compare-periods

**Descripción:** Comparación de períodos.

---

### Análisis de Ventas

#### GET /sales-analytics/performance

**Descripción:** Rendimiento de ventas.

#### GET /sales-analytics/performance/date-range

**Descripción:** Rendimiento en rango.

#### GET /sales-analytics/trends

**Descripción:** Tendencias de ventas.

#### GET /sales-analytics/trends/date-range

**Descripción:** Tendencias en rango.

#### GET /sales-analytics/by-category

**Descripción:** Ventas por categoría.

#### GET /sales-analytics/by-category/date-range

**Descripción:** Ventas por categoría en rango.

#### GET /sales-analytics/by-product

**Descripción:** Ventas por producto.

#### GET /sales-analytics/by-product/date-range

**Descripción:** Ventas por producto en rango.

#### GET /sales-analytics/top-bottom-products

**Descripción:** Productos top y bottom.

#### GET /sales-analytics/by-customer

**Descripción:** Ventas por cliente.

#### GET /sales-analytics/by-customer/date-range

**Descripción:** Ventas por cliente en rango.

#### GET /sales-analytics/by-seller

**Descripción:** Ventas por vendedor.

#### GET /sales-analytics/by-seller/date-range

**Descripción:** Ventas por vendedor en rango.

#### GET /sales-analytics/by-payment-method

**Descripción:** Ventas por método de pago.

#### GET /sales-analytics/by-payment-method/date-range

**Descripción:** Ventas por método de pago en rango.

#### GET /sales-analytics/by-hour

**Descripción:** Ventas por hora.

#### GET /sales-analytics/by-hour/date-range

**Descripción:** Ventas por hora en rango.

#### GET /sales-analytics/by-day-of-week

**Descripción:** Ventas por día de la semana.

#### GET /sales-analytics/by-day-of-week/date-range

**Descripción:** Ventas por día en rango.

#### GET /sales-analytics/heatmap

**Descripción:** Mapa de calor de ventas.

#### GET /sales-analytics/heatmap/date-range

**Descripción:** Mapa de calor en rango.

#### GET /sales-analytics/velocity

**Descripción:** Velocidad de ventas.

#### GET /sales-analytics/velocity/date-range

**Descripción:** Velocidad en rango.

#### GET /sales-analytics/compare

**Descripción:** Comparación de períodos.

#### GET /sales-analytics/dashboard

**Descripción:** Dashboard consolidado de ventas.

#### GET /sales-analytics/dashboard/date-range

**Descripción:** Dashboard en rango.

---

### Análisis de Inventario

#### GET /inventory-analytics/overview

**Descripción:** Resumen de inventario.

#### GET /inventory-analytics/stock-levels

**Descripción:** Niveles de stock.

#### GET /inventory-analytics/turnover

**Descripción:** Análisis de rotación.

#### GET /inventory-analytics/turnover/date-range

**Descripción:** Rotación en rango.

#### GET /inventory-analytics/abc

**Descripción:** Análisis ABC.

#### GET /inventory-analytics/abc/date-range

**Descripción:** ABC en rango.

#### GET /inventory-analytics/dead-stock

**Descripción:** Stock muerto.

#### GET /inventory-analytics/reorder

**Descripción:** Análisis de reabastecimiento.

#### GET /inventory-analytics/aging

**Descripción:** Antigüedad del stock.

#### GET /inventory-analytics/movements

**Descripción:** Movimientos de stock.

#### GET /inventory-analytics/movements/date-range

**Descripción:** Movimientos en rango.

#### GET /inventory-analytics/forecast

**Descripción:** Pronóstico de stock.

#### GET /inventory-analytics/dashboard

**Descripción:** Dashboard de inventario.

---

### Rentabilidad

#### GET /profitability/overview

**Descripción:** Resumen de rentabilidad.

#### GET /profitability/overview/date-range

**Descripción:** Rentabilidad en rango.

#### GET /profitability/products

**Descripción:** Rentabilidad por producto.

#### GET /profitability/products/date-range

**Descripción:** Rentabilidad por producto en rango.

#### GET /profitability/customers

**Descripción:** Rentabilidad por cliente.

#### GET /profitability/customers/date-range

**Descripción:** Rentabilidad por cliente en rango.

#### GET /profitability/categories

**Descripción:** Rentabilidad por categoría.

#### GET /profitability/categories/date-range

**Descripción:** Rentabilidad por categoría en rango.

#### GET /profitability/trends

**Descripción:** Tendencias de rentabilidad.

#### GET /profitability/trends/date-range

**Descripción:** Tendencias en rango.

#### GET /profitability/sellers

**Descripción:** Rentabilidad por vendedor.

#### GET /profitability/sellers/date-range

**Descripción:** Rentabilidad por vendedor en rango.

---

### Costos y Tendencias Globales

#### GET /cost-trends

**Descripción:** Tendencias globales de costos.

#### GET /suppliers/{supplier_id}/cost-analysis

**Descripción:** Análisis de costos por proveedor.

---

## Parámetros Comunes de Query

La mayoría de endpoints de BI aceptan:

| Parámetro  | Tipo | Requerido   | Descripción                                 |
| ---------- | ---- | ----------- | ------------------------------------------- |
| branch_id  | int  | Condicional | ID de sucursal (obligatorio para non-ADMIN) |
| start_date | date | No          | Fecha inicio (YYYY-MM-DD)                   |
| end_date   | date | No          | Fecha fin (YYYY-MM-DD)                      |
| page       | int  | No          | Número de página                            |
| page_size  | int  | No          | Elementos por página                        |

## Errores Comunes

| Código | Condición                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| 400    | `branch_id` ausente (non-ADMIN), inválido, o parámetros incorrectos          |
| 401    | Token ausente o inválido                                                     |
| 403    | Rol no autorizado para el recurso, o `branch_id` fuera de `allowed_branches` |
| 404    | Recurso no encontrado                                                        |
| 500    | Error interno                                                                |

---

_Última actualización: 2026-04-22 — Creada desde cero post-Multi-Branch + Party Model._
