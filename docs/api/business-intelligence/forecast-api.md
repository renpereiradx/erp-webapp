# Forecast API - Sistema de Pronósticos

API para pronósticos empresariales basados en datos históricos.

## Descripción General

El módulo de Forecasting proporciona capacidades de pronóstico predictivo para:

- **Pronóstico de Ventas**: Proyecciones de ventas futuras con análisis de estacionalidad
- **Pronóstico de Inventario**: Predicción de demanda y riesgo de agotamiento
- **Pronóstico de Demanda**: Análisis de demanda por categoría y producto
- **Pronóstico de Ingresos**: Proyecciones de ingresos con escenarios

## Métodos de Pronóstico

| Método        | Descripción               |
| ------------- | ------------------------- |
| `LINEAR`      | Regresión lineal simple   |
| `MOVING_AVG`  | Promedio móvil            |
| `EXPONENTIAL` | Suavizado exponencial     |
| `SEASONAL`    | Descomposición estacional |

## Compatibilidad de Rutas

Todos los endpoints de Forecast están disponibles en ambos prefijos:

- `/api/v1/forecast/*` (ruta principal)
- `/forecast/*` (ruta legacy para compatibilidad con frontend BI)

Ejemplo equivalente:

- `GET /api/v1/forecast/sales`
- `GET /forecast/sales`

## Validación Estricta de Parámetros (HTTP 400)

El módulo aplica validación estricta de query params. Si un valor es inválido, se responde `400` (ya no se ignora silenciosamente).

| Parámetro           | Regla                                             |
| ------------------- | ------------------------------------------------- |
| `history_months`    | Entero positivo (`> 0`)                           |
| `forecast_months`   | Entero positivo (`> 0`)                           |
| `forecast_days`     | Entero positivo (`> 0`)                           |
| `top_n`             | Entero positivo (`> 0`)                           |
| `method`            | `LINEAR`, `MOVING_AVG`, `EXPONENTIAL`, `SEASONAL` |
| `granularity`       | `DAILY`, `WEEKLY`, `MONTHLY`                      |
| `include_inactive`  | `true` o `false`                                  |
| `include_scenarios` | `true` o `false`                                  |

**Ejemplos de error 400:**

```json
{
  "success": false,
  "error": "invalid granularity. allowed values: DAILY, WEEKLY, MONTHLY"
}
```

```json
{
  "success": false,
  "error": "forecast_months must be a positive integer"
}
```

## Endpoints

### 1. Pronóstico de Ventas

```
GET /api/v1/forecast/sales
```

Genera pronóstico de ventas basado en datos históricos.

**Parámetros de Query:**

| Parámetro         | Tipo   | Default | Descripción                           |
| ----------------- | ------ | ------- | ------------------------------------- |
| `history_months`  | int    | 6       | Meses de historial a usar             |
| `forecast_months` | int    | 3       | Meses a pronosticar                   |
| `method`          | string | LINEAR  | Método de pronóstico                  |
| `granularity`     | string | MONTHLY | Granularidad (DAILY, WEEKLY, MONTHLY) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "forecast_period": {
      "start_date": "2026-01-07T00:00:00Z",
      "end_date": "2026-04-07T00:00:00Z"
    },
    "history_period": {
      "start_date": "2025-07-07T00:00:00Z",
      "end_date": "2026-01-07T00:00:00Z"
    },
    "method": "LINEAR",
    "granularity": "MONTHLY",
    "summary": {
      "total_historical": 150000.0,
      "total_forecast": 175000.0,
      "average_historical": 25000.0,
      "average_forecast": 29166.67,
      "growth_rate": 16.67,
      "trend": "INCREASING",
      "confidence_level": 85.5
    },
    "historical_data": [
      {
        "date": "2025-08-01T00:00:00Z",
        "label": "Ago 2025",
        "value": 24500.0,
        "is_actual": true,
        "is_forecast": false
      }
    ],
    "forecast_data": [
      {
        "date": "2026-02-01T00:00:00Z",
        "label": "Feb 2026",
        "value": 28500.0,
        "is_actual": false,
        "is_forecast": true
      }
    ],
    "confidence": {
      "level": 85.5,
      "mae": 1250.5,
      "mape": 4.5,
      "rmse": 1580.25,
      "r2": 0.92,
      "lower_bound": 0.9,
      "upper_bound": 1.1
    },
    "seasonality": {
      "has_seasonality": true,
      "seasonal_period": "MONTHLY",
      "peak_periods": ["Diciembre", "Marzo"],
      "low_periods": ["Febrero", "Agosto"],
      "seasonal_factors": [
        { "period": "Enero", "factor": 0.95, "label": "Enero" }
      ]
    }
  }
}
```

---

### 2. Pronóstico de Inventario

```
GET /api/v1/forecast/inventory
```

Genera pronóstico de inventario con análisis de riesgo de agotamiento.

**Parámetros de Query:**

| Parámetro          | Tipo   | Default | Descripción                 |
| ------------------ | ------ | ------- | --------------------------- |
| `forecast_days`    | int    | 30      | Días a pronosticar          |
| `category_id`      | string | -       | Filtrar por categoría       |
| `include_inactive` | bool   | false   | Incluir productos inactivos |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "forecast_period": {
      "start_date": "2026-01-07T00:00:00Z",
      "end_date": "2026-02-06T00:00:00Z"
    },
    "products": [
      {
        "product_id": "abc123",
        "product_name": "Producto A",
        "current_stock": 50,
        "average_daily_sales": 5.5,
        "projected_demand": 165,
        "days_until_stockout": 9,
        "reorder_point": 25,
        "suggested_reorder": 150,
        "safety_stock": 15,
        "stockout_risk": "HIGH",
        "reorder_date": "2026-01-12T00:00:00Z",
        "trend": "INCREASING"
      }
    ],
    "summary": {
      "total_products": 100,
      "high_risk_products": 5,
      "medium_risk_products": 12,
      "low_risk_products": 83,
      "total_projected_demand": 15000,
      "total_current_stock": 45000,
      "overall_coverage": 90.0
    },
    "alerts": [
      {
        "type": "STOCKOUT_IMMINENT",
        "severity": "HIGH",
        "product_id": "abc123",
        "product_name": "Producto A",
        "message": "Stock se agotara en 9 dias",
        "days_to_act": 9
      }
    ]
  }
}
```

---

### 3. Pronóstico de Demanda

```
GET /api/v1/forecast/demand
```

Genera pronóstico de demanda por categoría y productos principales.

**Parámetros de Query:**

| Parámetro         | Tipo   | Default | Descripción               |
| ----------------- | ------ | ------- | ------------------------- |
| `history_months`  | int    | 6       | Meses de historial        |
| `forecast_months` | int    | 3       | Meses a pronosticar       |
| `category_id`     | string | -       | Filtrar por categoría     |
| `top_n`           | int    | 20      | Top N productos a incluir |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "forecast_period": {
      "start_date": "2026-01-07T00:00:00Z",
      "end_date": "2026-04-07T00:00:00Z"
    },
    "categories": [
      {
        "category_id": "cat1",
        "category_name": "Electrónica",
        "historical_units": 5000,
        "forecast_units": 5750,
        "growth_rate": 15.0,
        "trend": "INCREASING",
        "confidence": 88.5
      }
    ],
    "top_products": [
      {
        "product_id": "prod1",
        "product_name": "Laptop Pro",
        "category_name": "Electrónica",
        "historical_units": 500,
        "forecast_units": 575,
        "growth_rate": 15.0,
        "trend": "INCREASING",
        "confidence": 85.0
      }
    ],
    "trends": []
  }
}
```

---

### 4. Pronóstico de Ingresos

```
GET /api/v1/forecast/revenue
```

Genera pronóstico de ingresos con análisis de escenarios.

**Parámetros de Query:**

| Parámetro           | Tipo | Default | Descripción                    |
| ------------------- | ---- | ------- | ------------------------------ |
| `history_months`    | int  | 12      | Meses de historial             |
| `forecast_months`   | int  | 6       | Meses a pronosticar            |
| `include_scenarios` | bool | false   | Incluir análisis de escenarios |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "forecast_period": {
      "start_date": "2026-01-07T00:00:00Z",
      "end_date": "2026-07-07T00:00:00Z"
    },
    "history_period": {
      "start_date": "2025-01-07T00:00:00Z",
      "end_date": "2026-01-07T00:00:00Z"
    },
    "summary": {
      "historical_revenue": 1200000.0,
      "forecast_revenue": 650000.0,
      "annual_projection": 1300000.0,
      "growth_rate": 8.33,
      "confidence_level": 82.5,
      "trend": "INCREASING"
    },
    "by_month": [
      {
        "month": "2026-02-01T00:00:00Z",
        "label": "Feb 2026",
        "actual": 0,
        "forecast": 108000.0,
        "lower_bound": 97200.0,
        "upper_bound": 118800.0,
        "is_forecast": true
      }
    ],
    "by_category": [
      {
        "category_id": "cat1",
        "category_name": "Electrónica",
        "historical": 500000.0,
        "forecast": 541650.0,
        "growth_rate": 8.33,
        "percentage": 41.67
      }
    ],
    "scenarios": [
      {
        "name": "PESSIMISTIC",
        "probability": 20,
        "forecast_amount": 552500.0,
        "growth_rate": -6.67,
        "description": "Escenario conservador considerando posibles factores adversos"
      },
      {
        "name": "BASELINE",
        "probability": 60,
        "forecast_amount": 650000.0,
        "growth_rate": 8.33,
        "description": "Proyeccion basada en tendencias actuales"
      },
      {
        "name": "OPTIMISTIC",
        "probability": 20,
        "forecast_amount": 747500.0,
        "growth_rate": 23.33,
        "description": "Escenario optimista con condiciones favorables"
      }
    ]
  }
}
```

---

### 5. Dashboard de Pronósticos

```
GET /api/v1/forecast/dashboard
```

Dashboard consolidado con todos los pronósticos, insights y recomendaciones.

**Parámetros de Query:**

| Parámetro         | Tipo | Default | Descripción         |
| ----------------- | ---- | ------- | ------------------- |
| `forecast_months` | int  | 3       | Meses a pronosticar |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "forecast_period": {
      "start_date": "2026-01-07T00:00:00Z",
      "end_date": "2026-04-07T00:00:00Z"
    },
    "sales_forecast": { ... },
    "revenue_forecast": { ... },
    "inventory_forecast": { ... },
    "demand_forecast": { ... },
    "key_insights": [
      {
        "type": "SALES_TREND",
        "category": "SALES",
        "title": "Tendencia de ventas: INCREASING",
        "description": "Se proyecta un crecimiento de 15.5% en ventas",
        "impact": "HIGH",
        "value": 15.5,
        "trend": "INCREASING"
      },
      {
        "type": "INVENTORY_RISK",
        "category": "INVENTORY",
        "title": "Productos en riesgo de agotamiento",
        "description": "5 productos con riesgo alto de quedarse sin stock",
        "impact": "HIGH",
        "value": 5
      }
    ],
    "recommendations": [
      {
        "priority": "HIGH",
        "category": "INVENTORY",
        "title": "Reabastecer productos criticos",
        "description": "Hay 5 productos con riesgo alto de agotamiento",
        "action": "Generar ordenes de compra para productos en riesgo",
        "potential_impact": "Evitar perdida de ventas por falta de stock"
      },
      {
        "priority": "MEDIUM",
        "category": "SALES",
        "title": "Prepararse para temporada alta",
        "description": "Se detectan picos de ventas en: [Diciembre, Marzo]",
        "action": "Asegurar inventario y personal para periodos de alta demanda",
        "potential_impact": "Maximizar ventas en temporada alta"
      }
    ]
  }
}
```

---

## Métricas de Confianza

| Métrica | Descripción                               |
| ------- | ----------------------------------------- |
| `level` | Nivel de confianza general (0-100%)       |
| `mae`   | Error Absoluto Medio                      |
| `mape`  | Error Porcentual Absoluto Medio           |
| `rmse`  | Raíz del Error Cuadrático Medio           |
| `r2`    | Coeficiente de determinación (R-cuadrado) |

## Niveles de Riesgo de Inventario

| Nivel    | Descripción                      |
| -------- | -------------------------------- |
| `HIGH`   | Stock crítico, se agotará pronto |
| `MEDIUM` | Stock bajo, requiere atención    |
| `LOW`    | Stock adecuado                   |
| `NONE`   | Sin riesgo de agotamiento        |

## Tendencias

| Tendencia    | Criterio            |
| ------------ | ------------------- |
| `INCREASING` | Crecimiento > 5%    |
| `DECREASING` | Decrecimiento < -5% |
| `STABLE`     | Entre -5% y 5%      |

## Códigos de Error

| Código | Descripción                                |
| ------ | ------------------------------------------ |
| 400    | Parámetros inválidos (validación estricta) |
| 401    | No autorizado                              |
| 500    | Error interno del servidor                 |

---

**Última actualización:** 2026-03-09
