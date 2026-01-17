# Dashboard API

API para obtener métricas ejecutivas y KPIs del negocio en tiempo real.

> **Nota (2026-01-16):** Esta documentación ha sido actualizada para reflejar con precisión los esquemas de base de datos, nombres de columnas y parámetros reales de la API. Se han corregido inconsistencias entre la documentación y la implementación actual del código.

## Endpoints

### 1. Resumen Ejecutivo

```
GET /dashboard/summary
```

Obtiene un resumen consolidado del estado actual del negocio.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`, `year`. Default: `today` |

#### Response

```json
{
  "success": true,
  "data": {
    "sales": {
      "total": 15750000,
      "count": 45,
      "average_ticket": 350000,
      "currency": "PYG"
    },
    "purchases": {
      "total": 8500000,
      "count": 12,
      "currency": "PYG"
    },
    "profit": {
      "gross": 7250000,
      "margin_percentage": 46.03
    },
    "inventory": {
      "total_products": 250,
      "low_stock_count": 8,
      "out_of_stock_count": 2,
      "total_value": 45000000
    },
    "cash_registers": {
      "open_count": 2,
      "total_balance": 3500000
    },
    "receivables": {
      "total_pending": 5200000,
      "overdue_count": 3
    },
    "payables": {
      "total_pending": 2800000,
      "due_this_week": 1500000
    },
    "reserves": {
      "today_count": 8,
      "pending_confirmation": 2
    }
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "period": "today"
  }
}
```

---

### 2. KPIs del Negocio

```
GET /dashboard/kpis
```

Obtiene indicadores clave de rendimiento.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período de análisis. Default: `month` |

#### Response

```json
{
  "success": true,
  "data": {
    "sales_kpis": {
      "average_ticket": 350000,
      "sales_per_day": 15,
      "conversion_rate": 65.5,
      "repeat_customer_rate": 42.3
    },
    "inventory_kpis": {
      "turnover_rate": 4.2,
      "days_of_inventory": 28,
      "stockout_rate": 2.1
    },
    "financial_kpis": {
      "gross_margin": 46.03,
      "net_margin": 32.5,
      "operating_expense_ratio": 13.53
    },
    "customer_kpis": {
      "new_customers": 12,
      "active_customers": 85,
      "average_purchase_frequency": 2.3
    },
    "budget_kpis": {
      "budget_to_sale_conversion": 68.5,
      "average_budget_value": 450000,
      "expired_budgets": 5
    }
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "period": "month",
    "period_start": "2025-01-01",
    "period_end": "2025-01-31"
  }
}
```

---

### 3. Tendencias

```
GET /dashboard/trends
```

Obtiene tendencias comparativas entre períodos.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período actual. Default: `month`. Se compara automáticamente con el período anterior. |

#### Response

```json
{
  "success": true,
  "data": {
    "sales": {
      "current": 15750000,
      "previous": 14200000,
      "change_amount": 1550000,
      "change_percentage": 10.92,
      "trend": "up"
    },
    "purchases": {
      "current": 8500000,
      "previous": 9100000,
      "change_amount": -600000,
      "change_percentage": -6.59,
      "trend": "down"
    },
    "gross_margin": {
      "current": 46.03,
      "previous": 42.15,
      "change_amount": 3.88,
      "change_percentage": 9.21,
      "trend": "up"
    },
    "average_ticket": {
      "current": 350000,
      "previous": 320000,
      "change_amount": 30000,
      "change_percentage": 9.38,
      "trend": "up"
    },
    "customer_count": {
      "current": 45,
      "previous": 42,
      "change_amount": 3,
      "change_percentage": 7.14,
      "trend": "up"
    }
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "period": "month",
    "period_start": "2025-01-01",
    "period_end": "2025-01-31",
    "previous_start": "2024-12-01",
    "previous_end": "2024-12-31"
  }
}
```

---

### 4. Alertas Consolidadas

```
GET /dashboard/alerts
```

Obtiene todas las alertas activas del sistema.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `severity` | string | No | Filtrar por severidad: `critical`, `warning`, `info` |
| `category` | string | No | Filtrar por categoría: `inventory`, `financial`, `sales` |

#### Response

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_001",
        "category": "inventory",
        "severity": "critical",
        "title": "Stock agotado",
        "message": "2 productos sin stock disponible",
        "details": {
          "products": [
            {"id": "prod_123", "name": "Producto A"},
            {"id": "prod_456", "name": "Producto B"}
          ]
        },
        "action_url": "/products/out-of-stock",
        "created_at": "2025-01-15T08:00:00Z"
      },
      {
        "id": "alert_002",
        "category": "inventory",
        "severity": "warning",
        "title": "Stock bajo",
        "message": "8 productos con stock bajo el punto de reorden",
        "details": {
          "count": 8
        },
        "action_url": "/analytics/inventory/low-stock",
        "created_at": "2025-01-15T08:00:00Z"
      },
      {
        "id": "alert_003",
        "category": "financial",
        "severity": "warning",
        "title": "Pagos vencidos",
        "message": "3 cuentas por cobrar vencidas por un total de Gs. 1,200,000",
        "details": {
          "count": 3,
          "total": 1200000
        },
        "action_url": "/receivables/overdue",
        "created_at": "2025-01-15T08:00:00Z"
      },
      {
        "id": "alert_004",
        "category": "financial",
        "severity": "critical",
        "title": "Margen negativo",
        "message": "5 productos con margen de ganancia negativo",
        "details": {
          "count": 5
        },
        "action_url": "/margin-alerts",
        "created_at": "2025-01-15T08:00:00Z"
      },
      {
        "id": "alert_005",
        "category": "sales",
        "severity": "info",
        "title": "Presupuestos por vencer",
        "message": "3 presupuestos vencen en los próximos 3 días",
        "details": {
          "count": 3
        },
        "action_url": "/budgets?status=expiring",
        "created_at": "2025-01-15T08:00:00Z"
      }
    ],
    "summary": {
      "total": 5,
      "by_severity": {
        "critical": 2,
        "warning": 2,
        "info": 1
      },
      "by_category": {
        "inventory": 2,
        "financial": 2,
        "sales": 1
      }
    }
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 5. Ventas por Hora (Heatmap)

```
GET /dashboard/sales-heatmap
```

Obtiene la distribución de ventas por hora del día y día de la semana.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `weeks` | int | No | Número de semanas a analizar. Default: 4 |

#### Response

```json
{
  "success": true,
  "data": {
    "heatmap": [
      {"day": 0, "hour": 8, "sales_count": 5, "sales_total": 750000},
      {"day": 0, "hour": 9, "sales_count": 12, "sales_total": 1800000},
      {"day": 0, "hour": 10, "sales_count": 18, "sales_total": 2700000}
    ],
    "peak_times": [
      {"day": "Lunes", "hour": 10, "average_sales": 18},
      {"day": "Sábado", "hour": 11, "average_sales": 25}
    ],
    "slow_times": [
      {"day": "Martes", "hour": 15, "average_sales": 3},
      {"day": "Miércoles", "hour": 14, "average_sales": 4}
    ]
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "weeks_analyzed": 4
  }
}
```

---

### 6. Top Productos del Período

```
GET /dashboard/top-products
```

Obtiene los productos más vendidos del período.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`. Default: `week` |
| `limit` | int | No | Cantidad de productos. Default: 10 |
| `sort_by` | string | No | Ordenar por: `quantity`, `revenue`, `profit`. Default: `revenue` |

#### Response

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_001",
        "name": "Producto Premium",
        "category": "Electrónica",
        "quantity_sold": 45,
        "revenue": 4500000,
        "profit": 1350000,
        "margin_percentage": 30.0,
        "trend": "up",
        "trend_percentage": 15.2
      },
      {
        "id": "prod_002",
        "name": "Producto Estrella",
        "category": "Accesorios",
        "quantity_sold": 120,
        "revenue": 3600000,
        "profit": 1800000,
        "margin_percentage": 50.0,
        "trend": "stable",
        "trend_percentage": 2.1
      }
    ],
    "total_revenue": 15750000,
    "total_profit": 7250000
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "period": "week",
    "limit": 10,
    "sort_by": "revenue"
  }
}
```

---

### 7. Actividad Reciente

```
GET /dashboard/recent-activity
```

Obtiene las últimas actividades del sistema.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | int | No | Cantidad de actividades. Default: 20 |
| `types` | string | No | Tipos separados por coma: `sale,purchase,payment,adjustment` |

#### Response

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act_001",
        "type": "sale",
        "description": "Venta #1234 completada",
        "amount": 450000,
        "user": "Juan Pérez",
        "timestamp": "2025-01-15T10:25:00Z",
        "details": {
          "sale_id": "sale_1234",
          "client": "Cliente ABC",
          "items_count": 3
        }
      },
      {
        "id": "act_002",
        "type": "payment",
        "description": "Pago recibido para Venta #1230",
        "amount": 350000,
        "user": "María García",
        "timestamp": "2025-01-15T10:20:00Z",
        "details": {
          "sale_id": "sale_1230",
          "payment_method": "Efectivo"
        }
      },
      {
        "id": "act_003",
        "type": "purchase",
        "description": "Orden de compra #567 recibida",
        "amount": 1200000,
        "user": "Carlos López",
        "timestamp": "2025-01-15T10:15:00Z",
        "details": {
          "purchase_id": "pur_567",
          "supplier": "Proveedor XYZ",
          "items_count": 15
        }
      }
    ]
  },
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "limit": 20
  }
}
```

---

## Modelos de Datos

### DashboardSummary

```go
type DashboardSummary struct {
    Sales         SalesSummary         `json:"sales"`
    Purchases     PurchasesSummary     `json:"purchases"`
    Profit        ProfitSummary        `json:"profit"`
    Inventory     InventorySummary     `json:"inventory"`
    CashRegisters CashRegistersSummary `json:"cash_registers"`
    Receivables   ReceivablesSummary   `json:"receivables"`
    Payables      PayablesSummary      `json:"payables"`
    Reserves      ReservesSummary      `json:"reserves"`
}
```

### Alert

```go
type Alert struct {
    ID        string                 `json:"id"`
    Category  string                 `json:"category"`
    Severity  string                 `json:"severity"`
    Title     string                 `json:"title"`
    Message   string                 `json:"message"`
    Details   map[string]interface{} `json:"details"`
    ActionURL string                 `json:"action_url"`
    CreatedAt time.Time              `json:"created_at"`
}
```

### TrendData

```go
type TrendData struct {
    Current          float64 `json:"current"`
    Previous         float64 `json:"previous"`
    ChangeAmount     float64 `json:"change_amount"`
    ChangePercentage float64 `json:"change_percentage"`
    Trend            string  `json:"trend"` // "up", "down", "stable"
}
```

---

## Implementación

### Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `models/dashboard.go` | Modelos de datos del dashboard |
| `services/dashboard_service.go` | Lógica de negocio |
| `handlers/dashboard_handler.go` | Handlers HTTP |
| `repository/dashboard_repository.go` | Queries a la base de datos |

### Queries Optimizadas

El dashboard utiliza:
- **CTEs (Common Table Expressions)** para consultas complejas
- **Agregaciones** en la base de datos para reducir transferencia de datos
- **Caché opcional** para datos que no cambian frecuentemente

---

## Ejemplos de Uso

### cURL - Obtener Resumen

```bash
curl -X GET "http://localhost:8080/dashboard/summary?period=today" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### cURL - Obtener Alertas Críticas

```bash
curl -X GET "http://localhost:8080/dashboard/alerts?severity=critical" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## Notas Técnicas

### Correcciones de Esquemas de Base de Datos (2026-01-16)

Se actualizaron todas las consultas SQL en `repository/dashboard.go` para incluir los esquemas correctos de PostgreSQL y nombres de columnas precisos:

#### Cambios en Referencias de Tablas

| Referencia Anterior | Referencia Actualizada |
|---------------------|------------------------|
| `sales_orders` | `transactions.sales_orders` |
| `purchase_orders` | `transactions.purchase_orders` |
| `sale_payments` | `transactions.sale_payments` |
| `sales_order_details` | `transactions.sales_order_details` |
| `budget_orders` | `transactions.budget_orders` |
| `reserves` | `transactions.reserves` |
| `cash_registers` | `transactions.cash_registers` |
| `cash_movements` | `transactions.cash_movements` |
| `products` | `products.products` |
| `stock` | `products.stock` |
| `prices` (antes `pricing`) | `products.prices` |
| `clients` | `clients.clients` |
| `suppliers` | `clients.suppliers` |
| `users` | `users.users` |
| `categories` | `public.categories` |

#### Correcciones de Nombres de Columnas

| Tabla | Columna Anterior | Columna Correcta |
|-------|------------------|------------------|
| `transactions.sales_orders` | `created_at` | `sale_date` |
| `transactions.purchase_orders` | `created_at` | `order_date` |
| `transactions.purchase_orders` | `purchase_date` | `order_date` |
| `transactions.sales_orders` | `user_id` | `id_user` |
| `transactions.purchase_orders` | `user_id` | `id_user` |
| `transactions.sale_payments` | `id` | `payment_id` |
| `clients.clients` | `first_name`, `last_name` | `name`, `last_name` |
| `products.products` | `is_active` | `state` |
| `products.products` | `category_id` | `id_category` |
| `products.stock` | `product_id` | `id_product` |
| `products.prices` | `product_id` | `id_product` |
| `products.prices` | `sale_price` | `selling_price` |
| `transactions.cash_registers` | `current_balance` | Se calcula dinámicamente sumando `initial_balance` + movimientos |

#### Mejora en Cálculo de Balance de Caja

El balance actual de cajas registradoras ahora se calcula dinámicamente usando un CTE:

```sql
WITH cash_balances AS (
    SELECT
        cr.id,
        cr.status,
        cr.initial_balance,
        COALESCE(
            cr.initial_balance + (
                SELECT COALESCE(SUM(
                    CASE
                        WHEN cm.movement_type = 'INCOME' THEN cm.amount
                        WHEN cm.movement_type = 'EXPENSE' THEN -cm.amount
                        ELSE 0
                    END
                ), 0)
                FROM transactions.cash_movements cm
                WHERE cm.cash_register_id = cr.id
            ),
            cr.initial_balance
        ) as current_balance
    FROM transactions.cash_registers cr
)
```

Esto permite obtener el balance real de las cajas abiertas sin necesidad de una columna `current_balance` en la tabla.

---

**Estado:** En producción
**Última actualización:** 2026-01-16
