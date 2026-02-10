# Payables API (Cuentas por Pagar)

API para gestión y análisis de cuentas por pagar a proveedores.

> **Nota (2026-01-23):** Esta documentación ha sido actualizada para reflejar con precisión los esquemas de base de datos, nombres de columnas y parámetros reales de la API. Se han corregido inconsistencias entre la documentación y la implementación actual del código.

## Endpoints

### 1. Resumen General (Overview)

```
GET /payables/overview
```

Obtiene un resumen consolidado de todas las cuentas por pagar.

#### Response

```json
{
  "success": true,
  "data": {
    "total_pending": 8500000,
    "total_overdue": 1200000,
    "total_count": 25,
    "overdue_count": 3,
    "due_this_week": 2500000,
    "due_this_month": 5000000,
    "average_days_to_pay": 32.5,
    "payment_rate": 85.5,
    "currency": "PYG",
    "aging_summary": {
      "current": {
        "amount": 5500000,
        "count": 15,
        "percentage": 64.71
      },
      "days_30_60": {
        "amount": 1800000,
        "count": 7,
        "percentage": 21.18
      },
      "days_60_90": {
        "amount": 800000,
        "count": 2,
        "percentage": 9.41
      },
      "over_90_days": {
        "amount": 400000,
        "count": 1,
        "percentage": 4.71
      }
    }
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 2. Lista de Cuentas por Pagar

```
GET /payables
```

Obtiene la lista paginada de cuentas por pagar con filtros.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `supplier_id` | string | No | Filtrar por proveedor |
| `status` | string | No | Estado: `PENDING`, `PARTIAL`, `OVERDUE` |
| `priority` | string | No | Prioridad: `URGENT`, `HIGH`, `MEDIUM`, `LOW` |
| `min_amount` | number | No | Monto mínimo pendiente |
| `max_amount` | number | No | Monto máximo pendiente |
| `start_date` | string | No | Fecha inicio compra (YYYY-MM-DD) |
| `end_date` | string | No | Fecha fin compra (YYYY-MM-DD) |
| `due_before` | string | No | Vencimiento antes de (YYYY-MM-DD) |
| `page` | int | No | Número de página. Default: 1 |
| `page_size` | int | No | Items por página. Default: 20, Max: 100 |
| `sort_by` | string | No | Ordenar por: `date`, `amount`, `supplier`, `due_date`, `priority` |
| `sort_order` | string | No | Orden: `asc`, `desc`. Default: `asc` |

#### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "po_001",
        "purchase_order_id": "po_001",
        "supplier_id": "sup_123",
        "supplier_name": "Proveedor ABC",
        "supplier_contact": "0981234567",
        "order_date": "2025-12-10T10:00:00Z",
        "due_date": "2026-01-09T10:00:00Z",
        "original_amount": 1500000,
        "paid_amount": 500000,
        "pending_amount": 1000000,
        "days_until_due": 6,
        "days_overdue": 0,
        "status": "PARTIAL",
        "priority": "HIGH",
        "currency": "PYG"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 25,
      "total_pages": 2
    },
    "summary": {
      "total_amount": 8500000,
      "total_pending": 5000000,
      "total_paid": 3500000,
      "item_count": 20
    }
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 3. Cuenta por Pagar Específica

```
GET /payables/{id}
```

Obtiene el detalle de una cuenta por pagar con historial de pagos.

#### Response

```json
{
  "success": true,
  "data": {
    "id": "po_001",
    "purchase_order_id": "po_001",
    "supplier_id": "sup_123",
    "supplier_name": "Proveedor ABC",
    "supplier_contact": "0981234567",
    "purchase_date": "2025-12-10T10:00:00Z",
    "due_date": "2026-01-09T10:00:00Z",
    "original_amount": 1500000,
    "paid_amount": 500000,
    "pending_amount": 1000000,
    "days_until_due": 6,
    "days_overdue": 0,
    "status": "PARTIAL",
    "priority": "HIGH",
    "currency": "PYG",
    "payment_history": [
      {
        "id": "pp_001",
        "amount": 500000,
        "payment_date": "2025-12-20T14:30:00Z",
        "payment_method": "Transferencia",
        "reference": "TRF-98765",
        "processed_by": "Juan Pérez"
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 4. Cuentas Vencidas

```
GET /payables/overdue
```

Obtiene solo las cuentas con más de 30 días de vencimiento.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | int | No | Número de página. Default: 1 |
| `page_size` | int | No | Items por página. Default: 20 |

---

### 5. Pagos Urgentes

```
GET /payables/urgent
```

Obtiene las cuentas urgentes (vencidas o próximas a vencer en 7 días).

---

### 6. Principales Proveedores con Deuda

```
GET /payables/top-suppliers
```

Obtiene los proveedores con mayor deuda pendiente.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | int | No | Cantidad de proveedores. Default: 10, Max: 50 |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "supplier_id": "sup_123",
      "supplier_name": "Proveedor ABC",
      "total_pending": 2500000,
      "total_overdue": 500000,
      "pending_count": 5,
      "payment_history": "GOOD"
    }
  ],
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 7. Cuentas por Proveedor

```
GET /payables/supplier/{supplier_id}
```

Obtiene todas las cuentas por pagar de un proveedor específico.

#### Response

```json
{
  "success": true,
  "data": {
    "supplier_id": "sup_123",
    "supplier_name": "Proveedor ABC",
    "supplier_contact": "0981234567",
    "total_pending": 2500000,
    "total_overdue": 500000,
    "pending_count": 5,
    "oldest_order_date": "2025-11-15T10:00:00Z",
    "credit_terms": 30,
    "payment_history": "GOOD",
    "average_days_to_pay": 28.5,
    "payables": [...]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 8. Análisis de Proveedor

```
GET /payables/supplier/{supplier_id}/analysis
```

Obtiene análisis detallado de la relación con un proveedor.

#### Response

```json
{
  "success": true,
  "data": {
    "supplier_id": "sup_123",
    "supplier_name": "Proveedor ABC",
    "total_pending": 2500000,
    "total_overdue": 500000,
    "pending_count": 5,
    "payment_history": "GOOD",
    "avg_days_to_pay": 28.5,
    "share_percentage": 29.41,
    "importance": "HIGH",
    "credit_terms": 30,
    "oldest_order_date": "2025-11-15T10:00:00Z"
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

**Niveles de Importancia:**
- `CRITICAL`: >30% de la deuda total
- `HIGH`: 15-30% de la deuda total
- `MEDIUM`: 5-15% de la deuda total
- `LOW`: <5% de la deuda total

---

### 9. Calendario de Pagos

```
GET /payables/schedule
```

Obtiene el calendario de pagos programados.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `days` | int | No | Días a proyectar. Default: 30, Max: 90 |

#### Response

```json
{
  "success": true,
  "data": {
    "start_date": "2026-01-03",
    "end_date": "2026-02-02",
    "total_due": 5000000,
    "schedule": [
      {
        "date": "2026-01-05",
        "day_of_week": "Domingo",
        "total_due": 800000,
        "item_count": 2,
        "items": [
          {
            "payable_id": "po_001",
            "supplier_name": "Proveedor ABC",
            "amount": 500000,
            "priority": "HIGH",
            "days_until_due": 2
          }
        ]
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 10. Resumen de Envejecimiento (Aging Summary)

```
GET /payables/aging/summary
```

Obtiene el resumen de envejecimiento de cuentas por pagar.

---

### 11. Reporte de Envejecimiento Detallado

```
GET /payables/aging/report
```

Obtiene el reporte de envejecimiento desglosado por proveedor.

#### Response

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-03T10:30:00Z",
    "summary": {
      "current": { "amount": 5500000, "count": 15, "percentage": 64.71 },
      "days_30_60": { "amount": 1800000, "count": 7, "percentage": 21.18 },
      "days_60_90": { "amount": 800000, "count": 2, "percentage": 9.41 },
      "over_90_days": { "amount": 400000, "count": 1, "percentage": 4.71 }
    },
    "by_supplier": [
      {
        "supplier_id": "sup_123",
        "supplier_name": "Proveedor ABC",
        "current": 300000,
        "days_30_60": 200000,
        "days_60_90": 0,
        "over_90_days": 0,
        "total": 500000
      }
    ],
    "total_amount": 8500000
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 12. Recordatorios de Pago

```
GET /payables/reminders
```

Obtiene los recordatorios de pago pendientes.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `priority` | string | No | Filtrar por prioridad: `URGENT`, `HIGH`, `MEDIUM`, `LOW` |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "payable_id": "po_001",
      "supplier_id": "sup_123",
      "supplier_name": "Proveedor ABC",
      "supplier_contact": "0981234567",
      "pending_amount": 1000000,
      "due_date": "2026-01-09T10:00:00Z",
      "days_until_due": 6,
      "days_overdue": 0,
      "priority": "HIGH"
    }
  ],
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 13. Recordatorios Urgentes

```
GET /payables/reminders/urgent
```

Obtiene solo los recordatorios urgentes (vencidos).

---

### 14. Estadísticas por Período

```
GET /payables/statistics
```

Obtiene estadísticas de cuentas por pagar.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`, `year`. Default: `month` |

#### Response

```json
{
  "success": true,
  "data": {
    "period": "2025-12-01 - 2025-12-31",
    "total_purchased": 15000000,
    "total_paid": 12825000,
    "payment_rate": 85.5,
    "average_dpo": 32.5,
    "overdue_percentage": 14.12,
    "top_suppliers": [...],
    "payment_trend": [
      {
        "date": "2025-12-01",
        "purchased": 3000000,
        "paid": 2500000,
        "balance": 500000
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z",
    "period": "month"
  }
}
```

---

### 15. Estadísticas por Rango de Fechas

```
GET /payables/statistics/date-range
```

Obtiene estadísticas para un rango de fechas específico.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |

---

### 16. Proyección de Flujo de Caja

```
GET /payables/cash-flow
```

Obtiene la proyección de flujo de caja (ingresos esperados vs egresos).

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `days` | int | No | Días a proyectar. Default: 30, Max: 90 |

#### Response

```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "expected_inflows": 12000000,
    "expected_outflows": 8500000,
    "net_cash_flow": 3500000,
    "cumulative_flow": 3500000,
    "projection_days": [
      {
        "date": "2026-01-03",
        "inflows": 500000,
        "outflows": 300000,
        "net_flow": 200000,
        "cumulative_flow": 200000
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 17. Análisis de Capacidad de Pago

```
GET /payables/payment-capacity
```

Analiza la capacidad de pago y genera recomendaciones.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `days` | int | No | Días a analizar. Default: 30 |

#### Response

```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "expected_inflows": 12000000,
    "expected_outflows": 8500000,
    "net_cash_flow": 3500000,
    "coverage_ratio": 141.18,
    "status": "HEALTHY",
    "total_pending": 8500000,
    "total_overdue": 1200000,
    "due_this_week": 2500000,
    "due_this_month": 5000000,
    "recommendations": [
      "Mantener política actual de pagos",
      "Considerar pagos anticipados para obtener descuentos"
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

**Estados de Capacidad:**
- `HEALTHY`: Coverage ratio >= 100%
- `WARNING`: Coverage ratio 80-100%
- `CRITICAL`: Coverage ratio < 80%

---

## Modelos de Datos

### PayablesStatus

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Sin pagos registrados |
| `PARTIAL` | Pagado parcialmente |
| `PAID` | Pagado completamente |
| `OVERDUE` | Vencido (>30 días) |

### PayablesPriority

| Prioridad | Descripción |
|-----------|-------------|
| `URGENT` | Vencido |
| `HIGH` | Vence en 7 días |
| `MEDIUM` | Vence en 15 días |
| `LOW` | Vence en más de 15 días |

### PaymentHistory

| Comportamiento | Descripción |
|----------------|-------------|
| `EXCELLENT` | Paga antes o a tiempo |
| `GOOD` | Paga dentro de 15 días de vencido |
| `REGULAR` | Paga dentro de 30 días de vencido |
| `POOR` | Paga después de 30 días de vencido |

---

## Ejemplos de Uso

### cURL - Obtener Overview

```bash
curl -X GET "http://localhost:8080/payables/overview" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Calendario de Pagos (próximos 15 días)

```bash
curl -X GET "http://localhost:8080/payables/schedule?days=15" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Análisis de Capacidad de Pago

```bash
curl -X GET "http://localhost:8080/payables/payment-capacity?days=30" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Proyección de Flujo de Caja

```bash
curl -X GET "http://localhost:8080/payables/cash-flow?days=60" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## Implementación

### Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `models/payables.go` | Modelos de datos |
| `services/payables.go` | Lógica de negocio |
| `handlers/payables.go` | Handlers HTTP |
| `repository/payables.go` | Queries a la base de datos |

### Características Implementadas

- Resumen general con aging summary
- Lista paginada con filtros múltiples
- Detalle con historial de pagos
- Calendario de pagos programados
- Proyección de flujo de caja
- Análisis de capacidad de pago con recomendaciones
- Análisis de importancia de proveedores
- Reportes de envejecimiento por proveedor
- Sistema de recordatorios por prioridad
- Estadísticas y tendencias (DPO)
- Queries optimizadas con CTEs

---

## Notas Técnicas

### Correcciones de Esquemas de Base de Datos (2026-01-23)

Se actualizaron todas las consultas SQL en `repository/payables.go` para incluir los esquemas correctos de PostgreSQL y nombres de columnas precisos:

#### Cambios en Referencias de Tablas

| Referencia Anterior | Referencia Actualizada |
|---------------------|------------------------|
| `purchase_orders` | `transactions.purchase_orders` |
| `purchase_payments` | `transactions.purchase_payments` |
| `sales_orders` | `transactions.sales_orders` |
| `sale_payments` | `transactions.sale_payments` |
| `suppliers` | `clients.suppliers` |

#### Correcciones de Nombres de Columnas

| Tabla | Columna Anterior | Columna Correcta | Descripción |
|-------|------------------|------------------|-------------|
| `transactions.purchase_orders` | `purchase_date` | `order_date` | Fecha de la orden de compra |
| `transactions.purchase_payments` | `amount` | `amount_paid` | Monto pagado |
| `clients.suppliers` | `phone` | `contact_info` (JSON) | La información de contacto se almacena como JSON |

#### Impacto en Respuestas de API

- El campo `"purchase_date"` en respuestas ahora se llama `"order_date"`
- El cálculo de `due_date` se hace como `order_date + INTERVAL '30 days'`
- La información de contacto del proveedor se obtiene del campo `contact_info` (JSON) en lugar de un campo `phone` simple

---

**Estado:** Completado
**Última actualización:** 2026-01-23