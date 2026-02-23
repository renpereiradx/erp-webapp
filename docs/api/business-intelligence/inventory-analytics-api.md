# Inventory Analytics API

Sistema de endpoints para análisis avanzado de inventario.

## Endpoints

### Overview - Resumen General

#### `GET /inventory-analytics/overview`

Obtiene un resumen general del estado del inventario.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "total_products": 150,
    "total_units": 5000,
    "total_value": 250000.00,
    "total_cost": 180000.00,
    "potential_profit": 70000.00,
    "stock_status": {
      "in_stock": 120,
      "low_stock": 20,
      "out_of_stock": 5,
      "overstock": 5,
      "in_stock_pct": 80.0,
      "low_stock_pct": 13.3,
      "out_of_stock_pct": 3.3,
      "overstock_pct": 3.3
    },
    "valuation": {
      "total_cost_value": 180000.00,
      "total_retail_value": 250000.00,
      "potential_margin": 70000.00,
      "potential_margin_pct": 28.0,
      "average_cost": 1200.00,
      "average_retail": 1666.67
    },
    "turnover": {
      "turnover_rate": 4.2,
      "days_of_inventory": 87,
      "stockout_rate": 3.3,
      "fill_rate": 96.7
    }
  }
}
```

---

### Stock Levels - Niveles de Stock

#### `GET /inventory-analytics/stock-levels`

Obtiene niveles de stock detallados con filtros y paginación.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar por estado: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `OVERSTOCK` |
| `page` | int | Número de página (default: 1) |
| `page_size` | int | Tamaño de página (default: 20, max: 100) |
| `sort_by` | string | Campo de ordenamiento: `stock`, `name`, `value`, `category`, `days` |
| `sort_order` | string | Orden: `ASC` o `DESC` |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "summary": {
      "total_products": 150,
      "total_units": 5000,
      "total_value": 250000.00,
      "average_stock": 33.3
    },
    "products": [
      {
        "product_id": "123",
        "product_name": "Producto A",
        "sku": "SKU-001",
        "category_name": "Categoría 1",
        "current_stock": 15,
        "min_stock": 10,
        "max_stock": 50,
        "reorder_point": 15,
        "status": "LOW_STOCK",
        "days_of_stock": 7.5,
        "unit_cost": 100.00,
        "unit_price": 150.00,
        "stock_value": 1500.00,
        "last_movement": "2026-01-03T14:00:00Z",
        "last_sale": "2026-01-04T09:30:00Z"
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

---

### Turnover Analysis - Análisis de Rotación

#### `GET /inventory-analytics/turnover`

Obtiene análisis de rotación de inventario por período predefinido.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |
| `limit` | int | Límite de resultados (default: 20) |

#### `GET /inventory-analytics/turnover/date-range`

Obtiene análisis de rotación por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Fecha fin (YYYY-MM-DD) |
| `limit` | int | Límite de resultados (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "overall": {
      "turnover_rate": 4.2,
      "days_of_inventory": 87,
      "average_inventory": 180000.00,
      "cost_of_goods_sold": 756000.00
    },
    "by_category": [
      {
        "category_id": "1",
        "category_name": "Categoría 1",
        "turnover_rate": 6.5,
        "days_of_inventory": 56,
        "total_units": 1500,
        "total_value": 75000.00,
        "units_sold": 450,
        "performance": "EXCELLENT"
      }
    ],
    "by_product": [
      {
        "product_id": "123",
        "product_name": "Producto A",
        "sku": "SKU-001",
        "category_name": "Categoría 1",
        "turnover_rate": 8.2,
        "days_of_inventory": 44,
        "current_stock": 50,
        "units_sold": 120,
        "average_stock": 55.0,
        "performance": "EXCELLENT"
      }
    ]
  }
}
```

**Performance Classifications:**
- `EXCELLENT`: Turnover >= 4
- `GOOD`: Turnover >= 2
- `AVERAGE`: Turnover >= 1
- `POOR`: Turnover < 1

---

### ABC Analysis - Análisis ABC

#### `GET /inventory-analytics/abc`

Obtiene análisis ABC del inventario por período predefinido.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

#### `GET /inventory-analytics/abc/date-range`

Obtiene análisis ABC por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Fecha fin (YYYY-MM-DD) |

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
      "total_value": 500000.00,
      "class_a_count": 15,
      "class_a_value": 400000.00,
      "class_a_value_pct": 80.0,
      "class_b_count": 35,
      "class_b_value": 75000.00,
      "class_b_value_pct": 15.0,
      "class_c_count": 100,
      "class_c_value": 25000.00,
      "class_c_value_pct": 5.0
    },
    "class_a": [...],
    "class_b": [...],
    "class_c": [...]
  }
}
```

---

### Dead Stock - Stock Muerto

#### `GET /inventory-analytics/dead-stock`

Obtiene análisis de productos sin movimiento (stock muerto).

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `days_threshold` | int | Días sin movimiento para considerar muerto (default: 90) |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "summary": {
      "total_products": 25,
      "total_units": 800,
      "total_value": 45000.00,
      "percentage_of_stock": 18.0,
      "average_days_idle": 135,
      "potential_loss": 13500.00
    },
    "products": [
      {
        "product_id": "456",
        "product_name": "Producto Muerto",
        "sku": "SKU-456",
        "category_name": "Categoría 2",
        "current_stock": 50,
        "stock_value": 2500.00,
        "last_sale_date": "2025-08-15T00:00:00Z",
        "days_since_last_sale": 143,
        "last_movement_date": "2025-09-01T00:00:00Z",
        "days_since_movement": 126,
        "recommendation": "Considerar liquidación o descontinuar"
      }
    ],
    "recommendations": [
      "Alto porcentaje de stock muerto. Revisar política de compras.",
      "Evaluar descontinuación de productos sin movimiento."
    ]
  }
}
```

---

### Reorder Analysis - Análisis de Reabastecimiento

#### `GET /inventory-analytics/reorder`

Obtiene análisis de productos que necesitan reabastecimiento.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "summary": {
      "total_needing_reorder": 35,
      "urgent_count": 10,
      "soon_count": 25,
      "estimated_cost": 50000.00
    },
    "urgent_reorders": [
      {
        "product_id": "789",
        "product_name": "Producto Urgente",
        "sku": "SKU-789",
        "category_name": "Categoría 3",
        "current_stock": 2,
        "min_stock": 10,
        "reorder_point": 10,
        "reorder_quantity": 18,
        "estimated_cost": 1800.00,
        "days_until_stockout": 1.5,
        "priority": "URGENT"
      }
    ],
    "soon_reorders": [...]
  }
}
```

**Priority Levels:**
- `URGENT`: Stock = 0
- `HIGH`: Stock <= 50% del mínimo
- `MEDIUM`: Stock <= mínimo
- `LOW`: Stock cerca del punto de reorden

---

### Stock Aging - Antigüedad del Stock

#### `GET /inventory-analytics/aging`

Obtiene reporte de antigüedad del stock.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "summary": {
      "total_products": 150,
      "total_units": 5000,
      "total_value": 250000.00,
      "average_age_days": 45,
      "old_stock_value": 35000.00,
      "old_stock_pct": 14.0
    },
    "buckets": [
      {
        "label": "0-30 días",
        "min_days": 0,
        "max_days": 30,
        "product_count": 80,
        "total_units": 3000,
        "total_value": 150000.00,
        "percentage": 60.0
      },
      {
        "label": "31-60 días",
        "min_days": 31,
        "max_days": 60,
        "product_count": 40,
        "total_units": 1200,
        "total_value": 65000.00,
        "percentage": 26.0
      }
    ],
    "products": [...]
  }
}
```

---

### Stock Movements - Movimientos de Stock

#### `GET /inventory-analytics/movements`

Obtiene reporte de movimientos de stock por período.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |

#### `GET /inventory-analytics/movements/date-range`

Obtiene movimientos por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Fecha fin (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_movements": 500,
      "total_inbound": 2000,
      "total_outbound": 1800,
      "total_adjustments": 50,
      "net_change": 200,
      "inbound_value": 100000.00,
      "outbound_value": 90000.00
    },
    "by_type": [
      {
        "type": "SALE",
        "count": 300,
        "units": 1500,
        "value": 75000.00,
        "percentage": 60.0
      },
      {
        "type": "PURCHASE",
        "count": 150,
        "units": 1800,
        "value": 90000.00,
        "percentage": 36.0
      }
    ],
    "daily": [
      {
        "date": "2026-01-01",
        "label": "01 Ene",
        "inbound": 100,
        "outbound": 80,
        "net_change": 20
      }
    ]
  }
}
```

---

### Stock Forecast - Pronóstico de Stock

#### `GET /inventory-analytics/forecast`

Obtiene pronóstico de stock basado en demanda histórica.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `forecast_days` | int | Días a pronosticar (default: 30, max: 365) |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "forecast_days": 30,
    "summary": {
      "products_at_risk": 15,
      "high_risk_count": 5,
      "medium_risk_count": 10,
      "estimated_stockouts": 3,
      "reorder_value": 25000.00
    },
    "risk_products": [
      {
        "product_id": "123",
        "product_name": "Producto Riesgo",
        "sku": "SKU-123",
        "current_stock": 20,
        "daily_demand": 3.5,
        "days_until_stockout": 5.7,
        "stockout_date": "2026-01-11",
        "forecasted_stock": 0,
        "recommended_order": 85,
        "risk": "HIGH"
      }
    ],
    "products": [...]
  }
}
```

**Risk Levels:**
- `HIGH`: Stockout en <= 7 días
- `MEDIUM`: Stockout en <= 14 días
- `LOW`: Stockout en <= 30 días
- `NONE`: Sin riesgo de stockout

---

### Dashboard - Dashboard Consolidado

#### `GET /inventory-analytics/dashboard`

Obtiene dashboard consolidado con KPIs y alertas de inventario.

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-05T10:30:00Z",
    "kpis": {
      "total_value": 250000.00,
      "turnover_rate": 4.2,
      "days_of_inventory": 87,
      "stockout_rate": 3.3,
      "fill_rate": 96.7,
      "dead_stock_pct": 15.0
    },
    "stock_status": {
      "in_stock": 120,
      "low_stock": 20,
      "out_of_stock": 5,
      "overstock": 5,
      "in_stock_pct": 80.0,
      "low_stock_pct": 13.3,
      "out_of_stock_pct": 3.3,
      "overstock_pct": 3.3
    },
    "top_movers": [...],
    "slow_movers": [...],
    "reorder_alerts": [...],
    "dead_stock_value": 37500.00,
    "abc_summary": {
      "class_a_count": 15,
      "class_a_value_pct": 80.0,
      "class_b_count": 35,
      "class_b_value_pct": 15.0,
      "class_c_count": 100,
      "class_c_value_pct": 5.0
    },
    "alerts": [
      {
        "type": "OUT_OF_STOCK",
        "message": "5 productos sin stock",
        "severity": "CRITICAL"
      },
      {
        "type": "LOW_STOCK",
        "message": "20 productos con stock bajo",
        "severity": "HIGH"
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

**Última actualización:** 2026-01-05
