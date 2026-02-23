# Commissions API

> **ESTADO: DESHABILITADO** — Este módulo está pendiente de implementación. Las rutas no están registradas porque las tablas de base de datos no existen. No usar en producción.

API para gestionar comisiones de vendedores, planes de comisión, y pagos.

## Base URL

```
/commissions
```

## Autenticacion

Todos los endpoints requieren autenticacion JWT Bearer Token.

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Planes de Comision

#### GET /plans

Obtiene todos los planes de comision.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `active_only` | boolean | Filtrar solo planes activos (default: false) |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Plan Estandar",
      "description": "Plan de comision por defecto - 5% sobre venta total",
      "plan_type": "PERCENTAGE",
      "base_rate": 5.0,
      "min_commission": null,
      "max_commission": null,
      "calculation_base": "SALE_TOTAL",
      "is_active": true,
      "priority": 0,
      "valid_from": "2026-01-06",
      "valid_until": null,
      "created_at": "2026-01-06T10:00:00Z",
      "updated_at": "2026-01-06T10:00:00Z"
    }
  ]
}
```

**Tipos de Plan:**

| Tipo | Descripcion |
|------|-------------|
| PERCENTAGE | Porcentaje sobre base de calculo |
| FLAT_RATE | Monto fijo por transaccion |
| TIERED | Por rangos de venta |
| CATEGORY_BASED | Por categoria de producto |
| PRODUCT_BASED | Por producto especifico |

**Bases de Calculo:**

| Base | Descripcion |
|------|-------------|
| SALE_TOTAL | Total de la venta |
| NET_SALE | Venta neta (despues de descuentos) |
| GROSS_PROFIT | Margen bruto |

#### POST /plans

Crea un nuevo plan de comision.

**Body:**

```json
{
  "name": "Plan Premium",
  "description": "Plan para vendedores senior",
  "plan_type": "PERCENTAGE",
  "base_rate": 7.0,
  "min_commission": 1000,
  "max_commission": 50000,
  "calculation_base": "NET_SALE",
  "priority": 1,
  "valid_from": "2026-01-01",
  "valid_until": "2026-12-31"
}
```

#### GET /plans/{id}

Obtiene un plan por ID.

#### PUT /plans/{id}

Actualiza un plan existente.

---

### 2. Asignaciones de Vendedores

#### POST /assignments

Asigna un plan de comision a un vendedor.

**Body:**

```json
{
  "seller_id": "user-123",
  "plan_id": 1,
  "custom_rate": 6.0,
  "assigned_from": "2026-01-01",
  "assigned_until": "2026-12-31"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "seller_id": "user-123",
    "plan_id": 1,
    "plan_name": "Plan Estandar",
    "custom_rate": 6.0,
    "assigned_from": "2026-01-01T00:00:00Z",
    "assigned_until": "2026-12-31T00:00:00Z",
    "is_active": true,
    "created_at": "2026-01-06T10:00:00Z",
    "updated_at": "2026-01-06T10:00:00Z"
  }
}
```

#### GET /assignments/{seller_id}

Obtiene la asignacion actual de un vendedor.

---

### 3. Resumen de Comisiones

#### GET /summary

Obtiene resumen general de comisiones.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-06T10:00:00Z",
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T23:59:59Z"
    },
    "total_commissions": 150000,
    "pending_amount": 50000,
    "approved_amount": 30000,
    "paid_amount": 70000,
    "total_sales": 3000000,
    "total_transactions": 450,
    "avg_commission_rate": 5.0,
    "avg_commission_per_tx": 333.33,
    "top_sellers": [...],
    "comparison": {
      "previous_period": {...},
      "commissions_change": 10000,
      "commissions_change_pct": 7.14
    }
  }
}
```

#### GET /summary/date-range

Obtiene resumen por rango de fechas.

**Parametros Query:**

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `start_date` | string | Si | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Si | Fecha fin (YYYY-MM-DD) |

---

### 4. Mejores Vendedores

#### GET /top-sellers

Obtiene ranking de vendedores por comision.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | Periodo predefinido |
| `limit` | int | Cantidad de resultados (default: 10) |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "seller_id": "user-123",
      "seller_name": "Maria Garcia",
      "total_sales": 500000,
      "total_transactions": 85,
      "total_commission": 25000,
      "pending_commission": 5000,
      "paid_commission": 20000,
      "avg_rate": 5.0,
      "avg_ticket": 5882.35,
      "contribution_pct": 16.67,
      "target_progress": 87.5,
      "rank": 1
    }
  ]
}
```

#### GET /top-sellers/date-range

Obtiene ranking por rango de fechas.

---

### 5. Comisiones por Vendedor

#### GET /seller/{seller_id}

Obtiene comisiones de un vendedor.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | Periodo predefinido |
| `status` | string | Filtrar por status: PENDING, APPROVED, PAID |
| `page` | int | Pagina (default: 1) |
| `page_size` | int | Registros por pagina (default: 20) |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sale_id": "sale-123",
      "seller_id": "user-123",
      "plan_id": 1,
      "plan_name": "Plan Estandar",
      "sale_date": "2026-01-05T14:30:00Z",
      "sale_total": 50000,
      "sale_net": 48000,
      "sale_cost": 35000,
      "gross_profit": 13000,
      "calculation_base": "SALE_TOTAL",
      "base_amount": 50000,
      "rate_applied": 5.0,
      "commission_amount": 2500,
      "bonus_amount": 0,
      "total_commission": 2500,
      "status": "PENDING",
      "created_at": "2026-01-05T14:30:00Z"
    }
  ],
  "metadata": {
    "period": "month",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 85,
      "total_pages": 5
    }
  }
}
```

#### GET /seller/{seller_id}/date-range

Obtiene comisiones por rango de fechas.

#### GET /seller/{seller_id}/summary

Obtiene resumen de comisiones del vendedor.

#### GET /seller/{seller_id}/report

Obtiene reporte detallado del vendedor.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-06T10:00:00Z",
    "period": {...},
    "seller": {
      "id": "user-123",
      "name": "Maria Garcia",
      "email": "maria@email.com",
      "plan_id": 1,
      "plan_name": "Plan Estandar"
    },
    "summary": {
      "seller_id": "user-123",
      "seller_name": "Maria Garcia",
      "total_sales": 500000,
      "total_transactions": 85,
      "total_commission": 25000,
      "pending_commission": 5000,
      "paid_commission": 20000,
      "avg_rate": 5.0,
      "avg_ticket": 5882.35,
      "contribution_pct": 16.67
    },
    "records": [...],
    "by_category": [
      {
        "category_id": "1",
        "category_name": "Electronicos",
        "sales": 200000,
        "commission": 10000,
        "percentage": 40.0
      }
    ],
    "trends": [...],
    "target": {
      "target": {...},
      "current_sales": 500000,
      "sales_progress": 83.33,
      "days_remaining": 15,
      "projected_achievement": 100.0,
      "on_track": true
    },
    "pagination": {...}
  }
}
```

#### GET /seller/{seller_id}/report/date-range

Obtiene reporte por rango de fechas.

---

### 6. Tendencias de Comisiones

#### GET /trends

Obtiene tendencias de comisiones.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | Periodo predefinido |
| `granularity` | string | `daily`, `weekly`, `monthly` |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01T00:00:00Z",
      "label": "01 Ene",
      "sales": 100000,
      "transactions": 15,
      "commission": 5000
    }
  ]
}
```

#### GET /trends/date-range

Obtiene tendencias por rango de fechas.

---

### 7. Aprobacion de Comisiones

#### POST /approve

Aprueba comisiones pendientes.

**Body:**

```json
{
  "commission_ids": [1, 2, 3, 4, 5],
  "notes": "Aprobadas para pago de enero"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "approved": 5,
    "approved_by": "admin-123"
  }
}
```

#### POST /adjust

Ajusta el monto de una comision.

**Body:**

```json
{
  "commission_id": 1,
  "new_amount": 2000,
  "reason": "Ajuste por devolucion parcial"
}
```

---

### 8. Pagos de Comisiones

#### POST /payments

Crea un nuevo pago de comisiones.

**Body:**

```json
{
  "seller_id": "user-123",
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "notes": "Pago de comisiones enero 2026"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "seller_id": "user-123",
    "seller_name": "Maria Garcia",
    "period_start": "2026-01-01T00:00:00Z",
    "period_end": "2026-01-31T00:00:00Z",
    "total_sales": 500000,
    "total_transactions": 85,
    "gross_commission": 25000,
    "adjustments": 0,
    "deductions": 0,
    "net_payment": 25000,
    "status": "DRAFT",
    "created_by": "admin-123",
    "created_at": "2026-01-06T10:00:00Z"
  }
}
```

#### GET /payments/pending

Obtiene pagos pendientes.

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "seller_id": "user-123",
      "seller_name": "Maria Garcia",
      "period_start": "2026-01-01T00:00:00Z",
      "period_end": "2026-01-31T00:00:00Z",
      "total_sales": 500000,
      "total_transactions": 85,
      "gross_commission": 25000,
      "adjustments": 0,
      "deductions": 0,
      "net_payment": 25000,
      "status": "PENDING_APPROVAL",
      "payment_method": null,
      "payment_reference": null,
      "created_by": "admin-123",
      "approved_by": null,
      "approved_at": null,
      "paid_by": null,
      "paid_at": null
    }
  ]
}
```

**Estados de Pago:**

| Estado | Descripcion |
|--------|-------------|
| DRAFT | Borrador, aun no enviado |
| PENDING_APPROVAL | Pendiente de aprobacion |
| APPROVED | Aprobado, listo para pagar |
| PROCESSING | En proceso de pago |
| PAID | Pagado |
| CANCELLED | Cancelado |

#### POST /payments/process

Procesa un pago (marca como pagado).

**Body:**

```json
{
  "payment_id": 1,
  "payment_method": "TRANSFERENCIA",
  "payment_reference": "TRF-2026-001",
  "notes": "Pago realizado via transferencia bancaria"
}
```

---

### 9. Dashboard de Comisiones

#### GET /dashboard

Obtiene dashboard consolidado de comisiones.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-06T10:00:00Z",
    "period": {...},
    "kpis": {
      "total_commissions": 150000,
      "commissions_growth": 7.14,
      "pending_commissions": 50000,
      "paid_commissions": 70000,
      "avg_commission_rate": 5.0,
      "total_sellers": 10,
      "active_sellers": 8,
      "avg_commission_per_seller": 15000,
      "highest_earner": "Maria Garcia",
      "highest_earner_amount": 25000
    },
    "top_sellers": [...],
    "by_status": [
      {
        "status": "PENDING",
        "count": 120,
        "amount": 50000,
        "percentage": 33.33
      },
      {
        "status": "APPROVED",
        "count": 80,
        "amount": 30000,
        "percentage": 20.0
      },
      {
        "status": "PAID",
        "count": 250,
        "amount": 70000,
        "percentage": 46.67
      }
    ],
    "pending_payments": [...],
    "recent_commissions": [...],
    "trends": [...],
    "alerts": [
      {
        "type": "HIGH_PENDING",
        "category": "PAYMENT",
        "message": "Comisiones pendientes elevadas: 50000",
        "value": 50000,
        "severity": "MEDIUM"
      },
      {
        "type": "POSITIVE_GROWTH",
        "category": "GROWTH",
        "message": "Excelente crecimiento: +7.14%",
        "value": 7.14,
        "severity": "LOW"
      }
    ]
  }
}
```

**Tipos de Alerta:**

| Tipo | Descripcion |
|------|-------------|
| HIGH_PENDING | Muchas comisiones pendientes de pago |
| DECLINING_COMMISSIONS | Comisiones en declive |
| POSITIVE_GROWTH | Crecimiento positivo |
| INACTIVE_SELLERS | Vendedores sin ventas recientes |

**Severidad:**

| Severidad | Descripcion |
|-----------|-------------|
| HIGH | Alta prioridad |
| MEDIUM | Prioridad media |
| LOW | Baja prioridad |

#### GET /dashboard/date-range

Obtiene dashboard por rango de fechas.

---

## Codigos de Error

| Codigo | Descripcion |
|--------|-------------|
| 400 | Parametros invalidos o solicitud incorrecta |
| 401 | No autorizado |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Ejemplo de Uso con cURL

```bash
# Obtener planes de comision
curl -X GET "http://localhost:8080/commissions/plans?active_only=true" \
  -H "Authorization: Bearer <token>"

# Asignar plan a vendedor
curl -X POST "http://localhost:8080/commissions/assignments" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"seller_id": "user-123", "plan_id": 1}'

# Obtener resumen de comisiones
curl -X GET "http://localhost:8080/commissions/summary?period=month" \
  -H "Authorization: Bearer <token>"

# Obtener comisiones de un vendedor
curl -X GET "http://localhost:8080/commissions/seller/user-123?period=month&status=PENDING" \
  -H "Authorization: Bearer <token>"

# Aprobar comisiones
curl -X POST "http://localhost:8080/commissions/approve" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"commission_ids": [1, 2, 3]}'

# Obtener dashboard
curl -X GET "http://localhost:8080/commissions/dashboard?period=month" \
  -H "Authorization: Bearer <token>"
```

---

## Flujo de Trabajo Tipico

1. **Configuracion inicial:**
   - Crear planes de comision (`POST /plans`)
   - Asignar planes a vendedores (`POST /assignments`)

2. **Operacion diaria:**
   - Las comisiones se calculan automaticamente al registrar ventas
   - Consultar comisiones por vendedor (`GET /seller/{seller_id}`)

3. **Cierre de periodo:**
   - Revisar resumen de comisiones (`GET /summary`)
   - Aprobar comisiones pendientes (`POST /approve`)
   - Crear pago de comisiones (`POST /payments`)
   - Procesar pago (`POST /payments/process`)

---

**Ultima actualizacion:** 2026-01-06
