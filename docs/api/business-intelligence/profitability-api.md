# Profitability Analytics API

Sistema de endpoints para análisis de rentabilidad empresarial.

## Endpoints

### Overview - Resumen General de Rentabilidad

#### `GET /profitability/overview`

Obtiene un resumen general de rentabilidad.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_revenue": 500000.00,
      "total_cost": 350000.00,
      "gross_profit": 150000.00,
      "operating_expenses": 50000.00,
      "operating_profit": 100000.00,
      "net_profit": 100000.00,
      "total_transactions": 1500,
      "total_units_sold": 5000,
      "average_ticket": 333.33,
      "profit_per_unit": 30.00
    },
    "margins": {
      "gross_margin_pct": 30.0,
      "operating_margin_pct": 20.0,
      "net_margin_pct": 20.0,
      "average_markup": 42.86,
      "roi": 42.86,
      "contribution_margin": 150000.00
    }
  }
}
```

#### `GET /profitability/overview/date-range`

Obtiene resumen por rango de fechas con comparación opcional.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Fecha fin (YYYY-MM-DD) |
| `compare` | bool | Incluir comparación con período anterior (default: false) |

**Response con comparación (`compare=true`):**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": { ... },
    "margins": { ... },
    "comparison": {
      "previous_period": {
        "start_date": "2025-12-01",
        "end_date": "2025-12-31"
      },
      "revenue_change": 25000.00,
      "revenue_change_pct": 5.26,
      "gross_profit_change": 15000.00,
      "gross_profit_change_pct": 11.11,
      "net_profit_change": 10000.00,
      "net_profit_change_pct": 11.11,
      "margin_change": 1.5
    }
  }
}
```

---

### Product Profitability - Rentabilidad por Producto

#### `GET /profitability/products`

Obtiene análisis de rentabilidad por producto.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |
| `page` | int | Número de página (default: 1) |
| `page_size` | int | Tamaño de página (default: 20, max: 100) |
| `sort_by` | string | Campo de ordenamiento: `profit`, `margin`, `revenue`, `units`, `name` |
| `sort_order` | string | Orden: `ASC` o `DESC` |

#### `GET /profitability/products/date-range`

Obtiene rentabilidad por producto por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Fecha fin (YYYY-MM-DD) |
| `page` | int | Número de página (default: 1) |
| `page_size` | int | Tamaño de página (default: 20, max: 100) |
| `sort_by` | string | Campo de ordenamiento |
| `sort_order` | string | Orden: `ASC` o `DESC` |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_products": 150,
      "profitable_products": 130,
      "unprofitable_products": 20,
      "average_margin": 28.5,
      "total_profit": 150000.00,
      "total_revenue": 500000.00
    },
    "products": [
      {
        "product_id": "123",
        "product_name": "Producto A",
        "sku": "SKU-001",
        "category_id": "1",
        "category_name": "Categoría 1",
        "units_sold": 150,
        "revenue": 15000.00,
        "cost": 9000.00,
        "gross_profit": 6000.00,
        "gross_margin_pct": 40.0,
        "average_price": 100.00,
        "average_cost": 60.00,
        "markup": 66.67,
        "contribution_pct": 4.0,
        "profit_per_unit": 40.00,
        "rank": 1,
        "performance": "EXCELLENT"
      }
    ],
    "top_profitable": [...],
    "losers": [...],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 150,
      "total_pages": 8
    }
  }
}
```

**Performance Classifications:**
- `EXCELLENT`: Margen >= 40%
- `GOOD`: Margen >= 25%
- `AVERAGE`: Margen >= 10%
- `POOR`: Margen > 0%
- `LOSS`: Margen <= 0%

---

### Customer Profitability - Rentabilidad por Cliente

#### `GET /profitability/customers`

Obtiene análisis de rentabilidad por cliente.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |
| `page` | int | Número de página (default: 1) |
| `page_size` | int | Tamaño de página (default: 20, max: 100) |

#### `GET /profitability/customers/date-range`

Obtiene rentabilidad por cliente por rango de fechas.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_customers": 500,
      "active_customers": 350,
      "profitable_customers": 480,
      "average_customer_value": 300.00,
      "total_profit": 150000.00,
      "top_customers_pct": 80.0
    },
    "customers": [
      {
        "customer_id": "456",
        "customer_name": "Cliente Premium",
        "customer_type": "MAYORISTA",
        "total_purchases": 25,
        "total_revenue": 50000.00,
        "total_cost": 35000.00,
        "gross_profit": 15000.00,
        "gross_margin_pct": 30.0,
        "average_ticket": 2000.00,
        "average_profit_per_tx": 600.00,
        "contribution_pct": 10.0,
        "first_purchase": "2025-03-15T00:00:00Z",
        "last_purchase": "2026-01-03T14:00:00Z",
        "days_since_last_purchase": 2,
        "segment": "PLATINUM",
        "rank": 1
      }
    ],
    "top_customers": [...],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 500,
      "total_pages": 25
    }
  }
}
```

**Customer Segments:**
- `PLATINUM`: Top 10% por profit
- `GOLD`: Top 5-10% por profit
- `SILVER`: Top 2-5% por profit
- `BRONZE`: Resto

---

### Category Profitability - Rentabilidad por Categoría

#### `GET /profitability/categories`

Obtiene análisis de rentabilidad por categoría.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

#### `GET /profitability/categories/date-range`

Obtiene rentabilidad por categoría por rango de fechas.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_categories": 15,
      "most_profitable_id": "1",
      "most_profitable_name": "Electrónica",
      "least_profitable_id": "15",
      "least_profitable_name": "Accesorios",
      "average_margin": 25.5,
      "total_profit": 150000.00
    },
    "categories": [
      {
        "category_id": "1",
        "category_name": "Electrónica",
        "product_count": 50,
        "units_sold": 1200,
        "revenue": 180000.00,
        "cost": 108000.00,
        "gross_profit": 72000.00,
        "gross_margin_pct": 40.0,
        "contribution_pct": 48.0,
        "average_markup": 66.67,
        "revenue_share": 36.0,
        "profit_share": 48.0,
        "performance": "EXCELLENT",
        "rank": 1
      }
    ]
  }
}
```

---

### Profitability Trends - Tendencias de Rentabilidad

#### `GET /profitability/trends`

Obtiene tendencias de rentabilidad en el tiempo.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |
| `granularity` | string | `daily`, `weekly`, `monthly` (auto-calculado si no se especifica) |

#### `GET /profitability/trends/date-range`

Obtiene tendencias por rango de fechas.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "granularity": "daily",
    "data_points": [
      {
        "date": "2026-01-01T00:00:00Z",
        "label": "01 Ene",
        "revenue": 15000.00,
        "cost": 9000.00,
        "gross_profit": 6000.00,
        "gross_margin_pct": 40.0,
        "net_profit": 6000.00,
        "net_margin_pct": 40.0,
        "transactions": 50,
        "units_sold": 150
      }
    ],
    "summary": {
      "average_revenue": 16129.03,
      "average_profit": 4838.71,
      "average_margin": 30.0,
      "highest_revenue_date": "15 Ene",
      "highest_profit_date": "15 Ene",
      "lowest_margin_date": "02 Ene",
      "trend_direction": "UP",
      "growth_rate": 15.5
    }
  }
}
```

**Trend Direction:**
- `UP`: Crecimiento > 5%
- `DOWN`: Decrecimiento > 5%
- `STABLE`: Variación <= 5%

---

### Seller Profitability - Rentabilidad por Vendedor

#### `GET /profitability/sellers`

Obtiene análisis de rentabilidad por vendedor.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

#### `GET /profitability/sellers/date-range`

Obtiene rentabilidad por vendedor por rango de fechas.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_sellers": 10,
      "total_profit": 150000.00,
      "average_profit_per_seller": 15000.00,
      "top_seller_id": "789",
      "top_seller_name": "Juan Pérez"
    },
    "sellers": [
      {
        "seller_id": "789",
        "seller_name": "Juan Pérez",
        "total_sales": 150,
        "total_revenue": 75000.00,
        "total_cost": 45000.00,
        "gross_profit": 30000.00,
        "gross_margin_pct": 40.0,
        "average_ticket": 500.00,
        "contribution_pct": 20.0,
        "rank": 1
      }
    ]
  }
}
```

---

### Dashboard - Dashboard Consolidado de Rentabilidad

#### `GET /profitability/dashboard`

Obtiene dashboard consolidado con KPIs y alertas de rentabilidad.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

#### `GET /profitability/dashboard/date-range`

Obtiene dashboard por rango de fechas.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "kpis": {
      "total_revenue": 500000.00,
      "total_profit": 150000.00,
      "gross_margin_pct": 30.0,
      "net_margin_pct": 20.0,
      "roi": 42.86,
      "profit_per_transaction": 100.00,
      "revenue_growth": 5.26,
      "profit_growth": 11.11,
      "margin_change": 1.5
    },
    "top_products": [...],
    "top_customers": [...],
    "top_categories": [...],
    "trends": [...],
    "break_even_status": {
      "revenue_to_break_even": 0,
      "units_to_break_even": 0,
      "has_reached_break_even": true,
      "break_even_date": "2026-01-05",
      "performance_status": "ABOVE_BREAK_EVEN"
    },
    "alerts": [
      {
        "type": "PROFIT_GROWTH",
        "category": "GROWTH",
        "message": "Excelente crecimiento de beneficios: +11.11%",
        "value": 11.11,
        "threshold": 20,
        "severity": "LOW"
      }
    ]
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros inválidos |
| 401 | No autorizado |
| 500 | Error interno del servidor |

---

## Alert Types

| Tipo | Descripción | Severidad |
|------|-------------|-----------|
| `LOW_MARGIN` | Margen bruto por debajo del umbral | HIGH |
| `DECLINING_PROFIT` | Beneficio en declive | HIGH |
| `UNPROFITABLE_PRODUCTS` | Productos generando pérdidas | MEDIUM |
| `PROFIT_GROWTH` | Crecimiento positivo de beneficios | LOW |

---

**Última actualización:** 2026-01-05
