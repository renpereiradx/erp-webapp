# API de Reportes Financieros

Endpoints para estados financieros, reportes fiscales y análisis de rentabilidad.

## Base URL

```
/financial-reports
```

## Autenticación

Todos los endpoints requieren JWT Bearer Token.

---

## Endpoints

### 1. Estado de Resultados

#### GET /financial-reports/income-statement

Obtiene el estado de resultados (P&L).

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`, `year`. Default: `month` |
| `compare` | bool | No | Comparar con período anterior |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T00:00:00Z",
      "type": "month"
    },
    "revenue": {
      "gross_sales": 50000000,
      "returns": 500000,
      "discounts": 1000000,
      "net_sales": 48500000,
      "by_category": [
        {
          "category_id": "uuid",
          "category_name": "Electrónicos",
          "amount": 25000000,
          "percentage": 51.5
        }
      ],
      "by_payment_method": [
        {
          "method": "cash",
          "amount": 30000000,
          "percentage": 61.8
        }
      ]
    },
    "cost_of_sales": {
      "purchases": 35000000,
      "purchase_returns": 200000,
      "ending_inventory": 15000000,
      "cost_of_goods_sold": 32000000
    },
    "gross_profit": {
      "amount": 16500000,
      "margin": 34.02,
      "percentage": 34.02
    },
    "operating_income": 16500000,
    "net_income": 16500000,
    "comparison": {
      "previous_period": {...},
      "revenue_change": 2500000,
      "revenue_change_pct": 5.4,
      "net_income_change": 1000000,
      "net_income_change_pct": 6.4
    }
  }
}
```

#### GET /financial-reports/income-statement/date-range

Obtiene el estado de resultados por rango de fechas.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |

---

### 2. Flujo de Efectivo

#### GET /financial-reports/cash-flow

Obtiene el estado de flujo de efectivo.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`, `year`. Default: `month` |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "beginning_cash": 10000000,
    "operating_activities": {
      "cash_from_sales": 35000000,
      "cash_from_receivables": 5000000,
      "cash_paid_to_suppliers": 25000000,
      "cash_paid_for_expenses": 3000000,
      "cash_paid_for_salaries": 5000000,
      "net_operating_cash_flow": 7000000
    },
    "investing_activities": {
      "equipment_purchases": 0,
      "net_investing_cash_flow": 0
    },
    "financing_activities": {
      "loan_payments": 0,
      "net_financing_cash_flow": 0
    },
    "ending_cash": 17000000,
    "net_cash_change": 7000000,
    "daily_breakdown": [
      {
        "date": "2026-01-01",
        "inflows": 1500000,
        "outflows": 800000,
        "net_flow": 700000,
        "balance": 10700000
      }
    ]
  }
}
```

#### GET /financial-reports/cash-flow/date-range

Obtiene el flujo de efectivo por rango de fechas.

---

### 3. Reporte de IVA

#### GET /financial-reports/vat

Obtiene el reporte de IVA.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período: `today`, `week`, `month`, `year`. Default: `month` |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "sales_vat": {
      "gross_sales_10": 40000000,
      "vat_10": 3636364,
      "gross_sales_5": 5000000,
      "vat_5": 238095,
      "exempt_sales": 3500000,
      "total_gross_sales": 48500000,
      "total_vat_debito": 3874459,
      "transaction_count": 250
    },
    "purchases_vat": {
      "gross_purchases_10": 30000000,
      "vat_10": 2727273,
      "gross_purchases_5": 2000000,
      "vat_5": 95238,
      "exempt_purchases": 3000000,
      "total_gross_purchases": 35000000,
      "total_vat_credito": 2822511,
      "transaction_count": 50
    },
    "vat_balance": {
      "vat_debito": 3874459,
      "vat_credito": 2822511,
      "vat_payable": 1051948,
      "credit_carryover": 0,
      "status": "TO_PAY"
    },
    "monthly_breakdown": [
      {
        "month": "2026-01-01",
        "vat_debito": 3874459,
        "vat_credito": 2822511,
        "balance": 1051948,
        "status": "TO_PAY"
      }
    ]
  }
}
```

#### GET /financial-reports/vat/date-range

Obtiene el reporte de IVA por rango de fechas.

#### GET /financial-reports/vat/monthly

Obtiene el reporte de IVA para un mes específico.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | int | No | Año. Default: año actual |
| `month` | int | No | Mes (1-12). Default: mes actual |

---

### 4. Libro de Ventas

#### GET /financial-reports/sales-ledger

Obtiene el libro de ventas.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |
| `page` | int | No | Página. Default: 1 |
| `page_size` | int | No | Registros por página. Default: 50, Max: 500 |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "summary": {
      "total_transactions": 250,
      "total_gross": 48500000,
      "total_vat_10": 3636364,
      "total_vat_5": 238095,
      "total_exempt": 3500000,
      "total_net": 44625541
    },
    "entries": [
      {
        "date": "2026-01-15T10:30:00Z",
        "invoice_number": "001-001-0001234",
        "timbrado": "12345678",
        "client_ruc": "80012345-6",
        "client_name": "Cliente SA",
        "gross_amount": 500000,
        "vat_10": 45455,
        "vat_5": 0,
        "exempt": 0,
        "net_amount": 454545,
        "payment_method": "cash",
        "payment_status": "paid"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total_items": 250,
      "total_pages": 5
    }
  }
}
```

#### GET /financial-reports/sales-ledger/date-range

Obtiene el libro de ventas por rango de fechas.

---

### 5. Libro de Compras

#### GET /financial-reports/purchase-ledger

Obtiene el libro de compras.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |
| `page` | int | No | Página. Default: 1 |
| `page_size` | int | No | Registros por página. Default: 50, Max: 500 |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "summary": {
      "total_transactions": 50,
      "total_gross": 35000000,
      "total_vat_10": 2727273,
      "total_vat_5": 95238,
      "total_exempt": 3000000,
      "total_net": 32177489
    },
    "entries": [
      {
        "date": "2026-01-10T09:00:00Z",
        "invoice_number": "001-001-0005678",
        "timbrado": "87654321",
        "supplier_ruc": "80098765-4",
        "supplier_name": "Proveedor SRL",
        "gross_amount": 1000000,
        "vat_10": 90909,
        "vat_5": 0,
        "exempt": 0,
        "net_amount": 909091,
        "payment_status": "paid"
      }
    ],
    "pagination": {...}
  }
}
```

#### GET /financial-reports/purchase-ledger/date-range

Obtiene el libro de compras por rango de fechas.

---

### 6. Márgenes de Rentabilidad

#### GET /financial-reports/profit-margins

Obtiene el reporte de márgenes de rentabilidad.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |
| `limit` | int | No | Límite de productos. Default: 20, Max: 100 |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "overall": {
      "gross_margin": 16500000,
      "gross_margin_pct": 34.02,
      "operating_margin": 16500000,
      "operating_margin_pct": 34.02,
      "net_margin": 16500000,
      "net_margin_pct": 34.02,
      "average_markup": 51.56
    },
    "by_category": [
      {
        "category_id": "uuid",
        "category_name": "Electrónicos",
        "revenue": 25000000,
        "cost": 15000000,
        "gross_profit": 10000000,
        "gross_margin_pct": 40.0,
        "units_sold": 150,
        "contribution": 60.6
      }
    ],
    "by_product": [...],
    "top_profitable": [
      {
        "product_id": "uuid",
        "product_name": "Producto Premium",
        "sku": "SKU-001",
        "category_name": "Electrónicos",
        "revenue": 5000000,
        "cost": 2500000,
        "gross_profit": 2500000,
        "gross_margin_pct": 50.0,
        "units_sold": 25,
        "average_price": 200000,
        "average_cost": 100000
      }
    ],
    "least_profitable": [...],
    "trends": [
      {
        "date": "2026-01-01",
        "gross_margin_pct": 35.5,
        "revenue": 1500000,
        "cost": 967500
      }
    ]
  }
}
```

#### GET /financial-reports/profit-margins/date-range

Obtiene el reporte de márgenes por rango de fechas.

---

### 7. Resumen Fiscal

#### GET /financial-reports/tax-summary

Obtiene el resumen fiscal.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "vat_summary": {
      "total_debito": 3874459,
      "total_credito": 2822511,
      "net_vat": 1051948,
      "credit_balance": 0
    },
    "total_tax_liability": 1051948,
    "total_tax_credits": 0,
    "net_tax_position": 1051948,
    "monthly_detail": [
      {
        "month": "2026-01-01",
        "vat_debito": 3874459,
        "vat_credito": 2822511,
        "net_vat": 1051948,
        "retentions": 0,
        "total_liability": 1051948
      }
    ]
  }
}
```

#### GET /financial-reports/tax-summary/annual

Obtiene el resumen fiscal anual.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | int | No | Año. Default: año actual |

---

### 8. Resumen Financiero

#### GET /financial-reports/overview

Obtiene el resumen financiero general.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |
| `compare` | bool | No | Comparar con período anterior |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {...},
    "revenue": 48500000,
    "expenses": 32000000,
    "net_income": 16500000,
    "cash_position": 17000000,
    "receivables": 8000000,
    "payables": 5000000,
    "working_capital": 35000000,
    "key_ratios": {
      "current_ratio": 4.0,
      "quick_ratio": 2.5,
      "gross_margin": 34.02,
      "net_margin": 34.02,
      "dso": 0,
      "dpo": 0,
      "inventory_turnover": 0,
      "asset_turnover": 0
    },
    "comparison": {
      "previous_period": {...},
      "revenue_change": 2500000,
      "revenue_change_pct": 5.4,
      "expense_change": 1000000,
      "expense_change_pct": 3.2,
      "net_income_change": 1500000,
      "net_income_change_pct": 10.0
    }
  }
}
```

---

### 9. Score de Salud Financiera

#### GET /financial-reports/health-score

Obtiene el score de salud financiera del negocio.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period` | string | No | Período. Default: `month` |

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 85,
    "status": "EXCELLENT",
    "period": {...},
    "revenue": 48500000,
    "expenses": 32000000,
    "net_income": 16500000,
    "cash_position": 17000000,
    "working_capital": 35000000,
    "key_ratios": {...},
    "recommendations": [
      "Situación financiera óptima",
      "Considerar oportunidades de crecimiento o inversión"
    ]
  }
}
```

**Estados de Salud:**

| Status | Score | Descripción |
|--------|-------|-------------|
| `EXCELLENT` | 80-100 | Situación financiera óptima |
| `GOOD` | 60-79 | Buena salud financiera |
| `FAIR` | 40-59 | Situación estable pero mejorable |
| `POOR` | 20-39 | Requiere atención |
| `CRITICAL` | 0-19 | Situación crítica |

---

### 10. Comparar Períodos

#### GET /financial-reports/compare-periods

Compara dos períodos financieros.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `period1_start` | string | Sí | Inicio período 1 (YYYY-MM-DD) |
| `period1_end` | string | Sí | Fin período 1 (YYYY-MM-DD) |
| `period2_start` | string | Sí | Inicio período 2 (YYYY-MM-DD) |
| `period2_end` | string | Sí | Fin período 2 (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "data": {
    "period_1": {
      "start": "2025-12-01",
      "end": "2025-12-31",
      "revenue": 45000000,
      "expenses": 30000000,
      "net_income": 15000000
    },
    "period_2": {
      "start": "2026-01-01",
      "end": "2026-01-31",
      "revenue": 48500000,
      "expenses": 32000000,
      "net_income": 16500000
    },
    "changes": {
      "revenue_change": 3500000,
      "revenue_change_pct": 7.78,
      "expense_change": 2000000,
      "expense_change_pct": 6.67,
      "net_income_change": 1500000,
      "net_income_change_pct": 10.0
    }
  }
}
```

---

## Notas de Implementación

### Cálculos de IVA (Paraguay)

- **IVA 10%**: Tasa estándar para la mayoría de productos
- **IVA 5%**: Tasa reducida para productos específicos
- **Exento**: Productos sin IVA

### Ratios Financieros

| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| Current Ratio | Activos Corrientes / Pasivos Corrientes | >1 es saludable |
| Quick Ratio | (Caja + Cuentas por Cobrar) / Pasivos Corrientes | >1 es ideal |
| Gross Margin | (Ingresos - Costo) / Ingresos * 100 | % de utilidad bruta |
| Net Margin | Utilidad Neta / Ingresos * 100 | % de utilidad neta |

### Estados de Balance IVA

| Estado | Descripción |
|--------|-------------|
| `TO_PAY` | IVA a pagar (débito > crédito) |
| `CREDIT` | Crédito fiscal a favor |
| `BALANCED` | Débito = Crédito |

---

## Archivos de Implementación

| Archivo | Descripción |
|---------|-------------|
| `models/financial_reports.go` | Modelos de datos |
| `repository/financial_reports.go` | Queries SQL |
| `services/financial_reports.go` | Lógica de negocio |
| `handlers/financial_reports.go` | Handlers HTTP |

---

## Notas de Versión

### v1.1 (2026-02-23)
- **Fix**: Corrección de valores por defecto en paginación — `page` y `page_size` ahora usan defaults correctos (1 y 50) cuando no se pasan parámetros en `/sales-ledger`, `/purchase-ledger` y `/sales-ledger/date-range`, `/purchase-ledger/date-range`
- **Fix**: Corrección de valor por defecto para `limit` — ahora usa default 20 cuando no se pasa en `/profit-margins` y `/profit-margins/date-range`

### v1.0 (2026-01-03)
- Versión inicial

---

**Última actualización:** 2026-02-23
