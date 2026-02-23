# Sales Analytics API

API para análisis detallado del comportamiento comercial y tendencias de ventas.

## Base URL

```
/sales-analytics
```

## Autenticación

Todos los endpoints requieren autenticación JWT Bearer Token.

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Rendimiento de Ventas

#### GET /performance

Obtiene métricas de rendimiento de ventas.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período: `today`, `week`, `month`, `year` (default: `month`) |
| `compare` | boolean | Incluir comparación con período anterior |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T23:59:59Z"
    },
    "total_sales": 15000000,
    "total_transactions": 450,
    "average_ticket": 33333.33,
    "total_units": 1200,
    "unique_customers": 180,
    "gross_margin": 4500000,
    "gross_margin_pct": 30.0,
    "returns": {
      "total_returns": 150000,
      "return_count": 5,
      "return_rate": 1.0
    },
    "comparison": {
      "previous_period": {
        "start_date": "2025-12-01T00:00:00Z",
        "end_date": "2025-12-31T23:59:59Z"
      },
      "sales_change": 2000000,
      "sales_change_pct": 15.4,
      "transactions_change": 50,
      "transactions_change_pct": 12.5,
      "ticket_change": 1500,
      "ticket_change_pct": 4.7
    }
  },
  "metadata": {
    "generated_at": "2026-01-04T10:00:00Z",
    "period": "month"
  }
}
```

#### GET /performance/date-range

Obtiene métricas por rango de fechas personalizado.

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |

---

### 2. Tendencias de Ventas

#### GET /trends

Obtiene tendencias de ventas con granularidad configurable.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período: `today`, `week`, `month`, `year` |
| `granularity` | string | `hourly`, `daily`, `weekly`, `monthly` (auto-detectado) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "granularity": "daily",
    "data_points": [
      {
        "timestamp": "2026-01-01T00:00:00Z",
        "label": "01 Ene",
        "sales": 500000,
        "transactions": 15,
        "units": 45,
        "average_ticket": 33333.33
      }
    ],
    "summary": {
      "trend_direction": "UP",
      "growth_rate": 12.5,
      "peak_period": "15 Ene",
      "peak_value": 850000,
      "low_period": "05 Ene",
      "low_value": 280000,
      "volatility": 0.25
    }
  }
}
```

#### GET /trends/date-range

Obtiene tendencias por rango de fechas.

---

### 3. Ventas por Categoría

#### GET /by-category

Obtiene ventas agrupadas por categoría de producto.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período predefinido |
| `limit` | int | Máximo de categorías (default: 20) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "categories": [
      {
        "category_id": "1",
        "category_name": "Electrónicos",
        "sales": 5000000,
        "percentage": 33.3,
        "transactions": 150,
        "units_sold": 200,
        "average_price": 25000,
        "gross_margin": 1500000,
        "gross_margin_pct": 30.0,
        "growth": 5000,
        "growth_pct": 10.5,
        "top_product": "Smartphone XYZ",
        "top_product_sales": 1200000
      }
    ],
    "total_sales": 15000000
  }
}
```

#### GET /by-category/date-range

---

### 4. Ventas por Producto

#### GET /by-product

Obtiene ventas detalladas por producto con paginación.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período predefinido |
| `page` | int | Página (default: 1) |
| `page_size` | int | Tamaño página (default: 20, max: 100) |
| `sort_by` | string | `sales`, `units`, `margin`, `name`, `last_sale` |
| `sort_order` | string | `ASC` o `DESC` |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "products": [
      {
        "product_id": "1",
        "product_name": "Smartphone XYZ",
        "sku": "PHONE-001",
        "category_name": "Electrónicos",
        "sales": 1200000,
        "units_sold": 24,
        "average_price": 50000,
        "cost": 840000,
        "gross_profit": 360000,
        "gross_margin_pct": 30.0,
        "transactions": 20,
        "last_sale_date": "2026-01-03T15:30:00Z",
        "rank": 1,
        "growth_pct": 8.5
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 150,
      "total_pages": 8
    }
  }
}
```

#### GET /by-product/date-range

#### GET /top-bottom-products

Obtiene productos más y menos vendidos.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período predefinido |
| `limit` | int | Cantidad por lista (default: 10) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "top_sellers": [...],
    "bottom_sellers": [...],
    "top_by_margin": [...],
    "top_by_volume": [...]
  }
}
```

---

### 5. Ventas por Cliente

#### GET /by-customer

Obtiene ventas por cliente con segmentación.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período predefinido |
| `page` | int | Página (default: 1) |
| `page_size` | int | Tamaño página (default: 20) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "customers": [
      {
        "customer_id": "1",
        "customer_name": "Juan Pérez",
        "customer_ruc": "1234567-8",
        "total_purchases": 2500000,
        "transaction_count": 12,
        "average_ticket": 208333.33,
        "last_purchase": "2026-01-03T14:00:00Z",
        "first_purchase": "2025-06-15T10:00:00Z",
        "frequency": "REGULAR",
        "segment": "PREMIUM",
        "growth_pct": 15.0,
        "top_category": "Electrónicos",
        "top_product": "Smartphone XYZ"
      }
    ],
    "summary": {
      "total_customers": 180,
      "new_customers": 25,
      "returning_customers": 155,
      "average_lifetime_value": 850000,
      "top_customer_revenue": 5000000,
      "customer_retention_rate": 86.1
    },
    "pagination": {...}
  }
}
```

**Segmentos de Cliente:**

| Segmento | Criterio |
|----------|----------|
| VIP | Compras >= 1,000,000 |
| PREMIUM | Compras >= 500,000 |
| STANDARD | Compras >= 100,000 |
| NEW | Compras < 100,000 |

**Frecuencia de Compra:**

| Frecuencia | Criterio |
|------------|----------|
| FREQUENT | Promedio <= 7 días |
| REGULAR | Promedio <= 30 días |
| OCCASIONAL | Promedio > 30 días |
| NEW | Solo una compra |

#### GET /by-customer/date-range

---

### 6. Ventas por Vendedor

#### GET /by-seller

Obtiene rendimiento por vendedor.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "sellers": [
      {
        "seller_id": "1",
        "seller_name": "María García",
        "total_sales": 3500000,
        "transaction_count": 85,
        "units_sold": 220,
        "average_ticket": 41176.47,
        "gross_margin": 1050000,
        "gross_margin_pct": 30.0,
        "rank": 1,
        "target_progress": 87.5,
        "top_category": "Electrónicos",
        "conversion_rate": 0.0
      }
    ],
    "rankings": {
      "by_sales": [...],
      "by_transactions": [...],
      "by_margin": [...]
    }
  }
}
```

#### GET /by-seller/date-range

---

### 7. Ventas por Método de Pago

#### GET /by-payment-method

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "payment_methods": [
      {
        "method": "cash",
        "display_name": "Efectivo",
        "sales": 8000000,
        "percentage": 53.3,
        "transaction_count": 280,
        "average_ticket": 28571.43,
        "growth_pct": 5.2
      },
      {
        "method": "credit_card",
        "display_name": "Tarjeta de Crédito",
        "sales": 4500000,
        "percentage": 30.0,
        "transaction_count": 100,
        "average_ticket": 45000,
        "growth_pct": 12.8
      }
    ],
    "total_sales": 15000000
  }
}
```

#### GET /by-payment-method/date-range

---

### 8. Ventas por Tiempo

#### GET /by-hour

Obtiene distribución de ventas por hora del día.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "hourly_data": [
      {
        "hour": 9,
        "sales": 1200000,
        "transactions": 35,
        "percentage": 8.0
      }
    ],
    "peak_hour": 12,
    "peak_sales": 2500000
  }
}
```

#### GET /by-hour/date-range

#### GET /by-day-of-week

Obtiene distribución por día de la semana.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "daily_data": [
      {
        "day_of_week": 1,
        "day_name": "Lunes",
        "sales": 2500000,
        "transactions": 75,
        "average_ticket": 33333.33,
        "percentage": 16.7
      }
    ],
    "best_day": "Sábado",
    "best_sales": 3500000
  }
}
```

#### GET /by-day-of-week/date-range

---

### 9. Mapa de Calor de Ventas

#### GET /heatmap

Obtiene matriz de ventas por día/hora para visualización de mapa de calor.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "data": [
      [0, 0, 0, 0, 0, 0, 0, 0, 100000, 250000, ...],
      [0, 0, 0, 0, 0, 0, 0, 0, 150000, 300000, ...]
    ],
    "labels": {
      "days": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
      "hours": ["00:00", "01:00", ..., "23:00"]
    },
    "summary": {
      "peak_day": "Sábado",
      "peak_hour": 12,
      "peak_value": 450000,
      "quiet_day": "Domingo",
      "quiet_hour": 5,
      "quiet_value": 0
    }
  }
}
```

#### GET /heatmap/date-range

---

### 10. Velocidad de Ventas

#### GET /velocity

Obtiene métricas de velocidad de ventas.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "overall": {
      "sales_per_day": 500000,
      "sales_per_hour": 20833.33,
      "transactions_per_day": 15,
      "transactions_per_hour": 0.625,
      "units_per_day": 40,
      "units_per_hour": 1.67,
      "avg_minutes_between_sales": 96
    },
    "by_category": [
      {
        "category_id": "1",
        "category_name": "Electrónicos",
        "units_per_day": 8,
        "sales_per_day": 200000,
        "days_to_sellout": 45
      }
    ],
    "by_product": [
      {
        "product_id": "1",
        "product_name": "Smartphone XYZ",
        "units_per_day": 2.5,
        "sales_per_day": 125000,
        "current_stock": 50,
        "days_to_sellout": 20,
        "velocity": "FAST"
      }
    ]
  }
}
```

**Clasificación de Velocidad:**

| Velocidad | Criterio |
|-----------|----------|
| FAST | >= 5 unidades/día |
| MEDIUM | >= 1 unidad/día |
| SLOW | < 1 unidad/día |

#### GET /velocity/date-range

---

### 11. Comparación de Períodos

#### GET /compare

Compara métricas entre dos períodos.

**Parámetros Query:**

Para comparación con período anterior automático:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` |

Para comparación personalizada:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start1` | string | Inicio período 1 (YYYY-MM-DD) |
| `end1` | string | Fin período 1 |
| `start2` | string | Inicio período 2 |
| `end2` | string | Fin período 2 |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "period_1": {
      "period": {...},
      "total_sales": 15000000,
      "total_transactions": 450,
      "total_units": 1200,
      "average_ticket": 33333.33,
      "unique_customers": 180,
      "gross_margin": 4500000
    },
    "period_2": {
      "period": {...},
      "total_sales": 13000000,
      "total_transactions": 400,
      "total_units": 1050,
      "average_ticket": 32500,
      "unique_customers": 165,
      "gross_margin": 3900000
    },
    "differences": {
      "sales_change": 2000000,
      "sales_change_pct": 15.38,
      "transactions_change": 50,
      "transactions_change_pct": 12.5,
      "units_change": 150,
      "units_change_pct": 14.29,
      "ticket_change": 833.33,
      "ticket_change_pct": 2.56,
      "customers_change": 15,
      "customers_change_pct": 9.09,
      "margin_change": 600000,
      "margin_change_pct": 15.38
    }
  }
}
```

---

### 12. Dashboard de Analytics

#### GET /dashboard

Obtiene dashboard consolidado con todas las métricas principales.

**Parámetros Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | Período: `today`, `week`, `month`, `year` |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-04T10:00:00Z",
    "period": {...},
    "kpis": {
      "total_sales": 15000000,
      "sales_growth_pct": 15.4,
      "total_transactions": 450,
      "transactions_growth_pct": 12.5,
      "average_ticket": 33333.33,
      "ticket_growth_pct": 2.5,
      "gross_margin_pct": 30.0,
      "margin_growth_pct": 0.5,
      "unique_customers": 180,
      "customers_growth_pct": 9.1,
      "sales_per_employee": 0
    },
    "trends": [
      {
        "timestamp": "2026-01-01T00:00:00Z",
        "label": "01 Ene",
        "sales": 500000,
        "transactions": 15,
        "units": 45,
        "average_ticket": 33333.33
      }
    ],
    "top_products": [...],
    "top_categories": [...],
    "payment_mix": [...],
    "alerts": [
      {
        "type": "POSITIVE",
        "category": "SALES",
        "message": "Las ventas aumentaron un 15.4% respecto al período anterior",
        "value": 15.4,
        "threshold": 20,
        "severity": "HIGH"
      }
    ]
  }
}
```

**Tipos de Alerta:**

| Tipo | Descripción |
|------|-------------|
| POSITIVE | Indicador positivo |
| NEGATIVE | Indicador negativo |
| WARNING | Advertencia |

**Categorías de Alerta:**

| Categoría | Descripción |
|-----------|-------------|
| SALES | Relacionado a ventas |
| MARGIN | Relacionado a margen |
| PRODUCT | Relacionado a productos |
| CUSTOMER | Relacionado a clientes |

**Severidad:**

| Severidad | Descripción |
|-----------|-------------|
| HIGH | Alta prioridad |
| MEDIUM | Prioridad media |
| LOW | Baja prioridad |

#### GET /dashboard/date-range

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros inválidos |
| 401 | No autorizado |
| 500 | Error interno del servidor |

## Ejemplo de Uso con cURL

```bash
# Obtener rendimiento del mes actual
curl -X GET "http://localhost:8080/sales-analytics/performance?period=month&compare=true" \
  -H "Authorization: Bearer <token>"

# Obtener tendencias por rango de fechas
curl -X GET "http://localhost:8080/sales-analytics/trends/date-range?start_date=2026-01-01&end_date=2026-01-15&granularity=daily" \
  -H "Authorization: Bearer <token>"

# Obtener dashboard ejecutivo
curl -X GET "http://localhost:8080/sales-analytics/dashboard?period=month" \
  -H "Authorization: Bearer <token>"
```

---

**Última actualización:** 2026-01-04
