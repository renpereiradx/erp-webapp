# Receivables API (Cuentas por Cobrar)

API para gestión y análisis de cuentas por cobrar.

## Endpoints

### 1. Resumen General (Overview)

```
GET /receivables/overview
```

Obtiene un resumen consolidado de todas las cuentas por cobrar.

#### Response

```json
{
  "success": true,
  "data": {
    "total_pending": 15200000,
    "total_overdue": 3500000,
    "total_count": 45,
    "overdue_count": 8,
    "average_days_to_collect": 28.5,
    "collection_rate": 78.5,
    "currency": "PYG",
    "aging_summary": {
      "current": {
        "amount": 8500000,
        "count": 25,
        "percentage": 55.92
      },
      "days_30_60": {
        "amount": 3200000,
        "count": 12,
        "percentage": 21.05
      },
      "days_60_90": {
        "amount": 2000000,
        "count": 5,
        "percentage": 13.16
      },
      "over_90_days": {
        "amount": 1500000,
        "count": 3,
        "percentage": 9.87
      }
    }
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 2. Lista de Cuentas por Cobrar

```
GET /receivables
```

Obtiene la lista paginada de cuentas por cobrar con filtros.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `client_id` | string | No | Filtrar por cliente |
| `status` | string | No | Estado: `PENDING`, `PARTIAL`, `OVERDUE` |
| `min_amount` | number | No | Monto mínimo pendiente |
| `max_amount` | number | No | Monto máximo pendiente |
| `start_date` | string | No | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | No | Fecha fin (YYYY-MM-DD) |
| `days_overdue` | int | No | Mínimo días de vencimiento |
| `page` | int | No | Número de página. Default: 1 |
| `page_size` | int | No | Items por página. Default: 20, Max: 100 |
| `sort_by` | string | No | Ordenar por: `date`, `amount`, `client`, `days_overdue` |
| `sort_order` | string | No | Orden: `asc`, `desc`. Default: `desc` |

#### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "sale_001",
        "sale_order_id": "sale_001",
        "client_id": "client_123",
        "client_name": "Juan Pérez",
        "client_phone": "0981234567",
        "sale_date": "2025-12-15T10:00:00Z",
        "due_date": "2026-01-14T10:00:00Z",
        "original_amount": 500000,
        "paid_amount": 200000,
        "pending_amount": 300000,
        "days_overdue": 0,
        "status": "PARTIAL",
        "currency": "PYG"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 45,
      "total_pages": 3
    },
    "summary": {
      "total_amount": 15200000,
      "total_pending": 8500000,
      "total_paid": 6700000,
      "item_count": 20
    }
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z",
    "filters": "status=PENDING&page=1"
  }
}
```

---

### 3. Cuenta por Cobrar Específica

```
GET /receivables/{id}
```

Obtiene el detalle de una cuenta por cobrar con historial de pagos.

#### Response

```json
{
  "success": true,
  "data": {
    "id": "sale_001",
    "sale_order_id": "sale_001",
    "client_id": "client_123",
    "client_name": "Juan Pérez",
    "client_phone": "0981234567",
    "sale_date": "2025-12-15T10:00:00Z",
    "due_date": "2026-01-14T10:00:00Z",
    "original_amount": 500000,
    "paid_amount": 200000,
    "pending_amount": 300000,
    "days_overdue": 0,
    "status": "PARTIAL",
    "currency": "PYG",
    "payment_history": [
      {
        "id": "pay_001",
        "amount": 150000,
        "payment_date": "2025-12-20T14:30:00Z",
        "payment_method": "Efectivo",
        "reference": "",
        "processed_by": "María García"
      },
      {
        "id": "pay_002",
        "amount": 50000,
        "payment_date": "2025-12-28T11:00:00Z",
        "payment_method": "Transferencia",
        "reference": "TRF-123456",
        "processed_by": "Carlos López"
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
GET /receivables/overdue
```

Obtiene solo las cuentas con más de 30 días de vencimiento.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | int | No | Número de página. Default: 1 |
| `page_size` | int | No | Items por página. Default: 20 |

---

### 5. Principales Deudores

```
GET /receivables/top-debtors
```

Obtiene los clientes con mayor deuda pendiente.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | int | No | Cantidad de deudores. Default: 10, Max: 50 |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "client_id": "client_123",
      "client_name": "Empresa ABC",
      "total_pending": 2500000,
      "total_overdue": 800000,
      "pending_count": 5,
      "payment_behavior": "REGULAR"
    }
  ],
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 6. Cuentas por Cliente

```
GET /receivables/client/{client_id}
```

Obtiene todas las cuentas por cobrar de un cliente específico.

#### Response

```json
{
  "success": true,
  "data": {
    "client_id": "client_123",
    "client_name": "Juan Pérez",
    "client_phone": "0981234567",
    "total_pending": 500000,
    "total_overdue": 0,
    "pending_count": 2,
    "oldest_debt": "2025-12-01T10:00:00Z",
    "payment_behavior": "GOOD",
    "average_days_to_pay": 25.5,
    "receivables": [
      {
        "id": "sale_001",
        "sale_date": "2025-12-15T10:00:00Z",
        "original_amount": 300000,
        "pending_amount": 200000,
        "status": "PARTIAL"
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 7. Análisis de Riesgo de Cliente

```
GET /receivables/client/{client_id}/risk
```

Analiza el riesgo crediticio de un cliente.

#### Response

```json
{
  "success": true,
  "data": {
    "client_id": "client_123",
    "client_name": "Juan Pérez",
    "risk_score": 35.5,
    "risk_level": "LOW",
    "payment_behavior": "GOOD",
    "total_pending": 500000,
    "total_overdue": 0,
    "avg_days_to_pay": 25.5,
    "recommendations": [
      "Mantener condiciones actuales",
      "Considerar aumentar límite de crédito si aplica"
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

**Niveles de Riesgo:**
- `LOW`: Score < 40 - Cliente confiable
- `MEDIUM`: Score 40-70 - Requiere monitoreo
- `HIGH`: Score > 70 - Alto riesgo de incobrabilidad

---

### 8. Resumen de Envejecimiento (Aging Summary)

```
GET /receivables/aging/summary
```

Obtiene el resumen de envejecimiento de cuentas por buckets.

#### Response

```json
{
  "success": true,
  "data": {
    "current": {
      "amount": 8500000,
      "count": 25,
      "percentage": 55.92
    },
    "days_30_60": {
      "amount": 3200000,
      "count": 12,
      "percentage": 21.05
    },
    "days_60_90": {
      "amount": 2000000,
      "count": 5,
      "percentage": 13.16
    },
    "over_90_days": {
      "amount": 1500000,
      "count": 3,
      "percentage": 9.87
    }
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

**Buckets de Envejecimiento:**
- `current`: 0-30 días
- `days_30_60`: 31-60 días
- `days_60_90`: 61-90 días
- `over_90_days`: Más de 90 días

---

### 9. Reporte de Envejecimiento Detallado

```
GET /receivables/aging/report
```

Obtiene el reporte de envejecimiento desglosado por cliente.

#### Response

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-03T10:30:00Z",
    "summary": {
      "current": { "amount": 8500000, "count": 25, "percentage": 55.92 },
      "days_30_60": { "amount": 3200000, "count": 12, "percentage": 21.05 },
      "days_60_90": { "amount": 2000000, "count": 5, "percentage": 13.16 },
      "over_90_days": { "amount": 1500000, "count": 3, "percentage": 9.87 }
    },
    "by_client": [
      {
        "client_id": "client_123",
        "client_name": "Empresa ABC",
        "current": 500000,
        "days_30_60": 300000,
        "days_60_90": 0,
        "over_90_days": 0,
        "total": 800000
      }
    ],
    "total_amount": 15200000
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

---

### 10. Recordatorios de Cobro

```
GET /receivables/collection/reminders
```

Obtiene los recordatorios de cobro pendientes.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `priority` | string | No | Filtrar por prioridad: `HIGH`, `MEDIUM`, `LOW` |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "receivable_id": "sale_001",
      "client_id": "client_123",
      "client_name": "Juan Pérez",
      "client_phone": "0981234567",
      "pending_amount": 300000,
      "days_overdue": 15,
      "due_date": "2025-12-15T10:00:00Z",
      "priority": "MEDIUM"
    }
  ],
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z"
  }
}
```

**Prioridades:**
- `HIGH`: Más de 60 días vencido
- `MEDIUM`: 31-60 días vencido
- `LOW`: 0-30 días vencido

---

### 11. Recordatorios de Alta Prioridad

```
GET /receivables/collection/high-priority
```

Obtiene solo los recordatorios de alta prioridad (>60 días vencidos).

---

### 12. Estadísticas por Período

```
GET /receivables/statistics
```

Obtiene estadísticas de cuentas por cobrar para un período predefinido.

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
    "total_billed": 25000000,
    "total_collected": 19625000,
    "collection_rate": 78.5,
    "average_dso": 28.5,
    "overdue_percentage": 23.03,
    "top_debtors": [
      {
        "client_id": "client_123",
        "client_name": "Empresa ABC",
        "total_pending": 2500000,
        "payment_behavior": "REGULAR"
      }
    ],
    "collection_trend": [
      {
        "date": "2025-12-01",
        "billed": 5000000,
        "collected": 4000000,
        "balance": 1000000
      }
    ]
  },
  "metadata": {
    "generated_at": "2026-01-03T10:30:00Z",
    "period": "month",
    "period_start": "2025-12-01",
    "period_end": "2025-12-31"
  }
}
```

---

### 13. Estadísticas por Rango de Fechas

```
GET /receivables/statistics/date-range
```

Obtiene estadísticas para un rango de fechas específico.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |

---

## Modelos de Datos

### ReceivablesStatus

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Sin pagos registrados |
| `PARTIAL` | Pagado parcialmente |
| `PAID` | Pagado completamente |
| `OVERDUE` | Vencido (>30 días sin pagar) |

### PaymentBehavior

| Comportamiento | Descripción |
|----------------|-------------|
| `EXCELLENT` | Paga antes o a tiempo |
| `GOOD` | Paga dentro de 15 días de vencido |
| `REGULAR` | Paga dentro de 30 días de vencido |
| `POOR` | Paga después de 30 días de vencido |

### CollectionPriority

| Prioridad | Descripción |
|-----------|-------------|
| `HIGH` | Más de 60 días vencido |
| `MEDIUM` | 31-60 días vencido |
| `LOW` | 0-30 días vencido |

---

## Ejemplos de Uso

### cURL - Obtener Overview

```bash
curl -X GET "http://localhost:8080/receivables/overview" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Listar Cuentas Vencidas

```bash
curl -X GET "http://localhost:8080/receivables?status=OVERDUE&sort_by=days_overdue&sort_order=desc" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Análisis de Riesgo de Cliente

```bash
curl -X GET "http://localhost:8080/receivables/client/client_123/risk" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Reporte de Envejecimiento

```bash
curl -X GET "http://localhost:8080/receivables/aging/report" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## Implementación

### Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `models/receivables.go` | Modelos de datos |
| `services/receivables.go` | Lógica de negocio |
| `handlers/receivables.go` | Handlers HTTP |
| `repository/receivables.go` | Queries a la base de datos |

### Características Implementadas

- Resumen general con aging summary
- Lista paginada con filtros múltiples
- Detalle con historial de pagos
- Análisis de riesgo por cliente
- Reportes de envejecimiento
- Sistema de recordatorios de cobro
- Estadísticas y tendencias de cobranza
- Cálculo de DSO (Days Sales Outstanding)

---

**Estado:** Completado
**Última actualización:** 2026-01-03
