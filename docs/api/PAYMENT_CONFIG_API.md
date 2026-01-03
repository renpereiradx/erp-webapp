# Guía de Integración - APIs de Pagos

## Descripción

Esta guía proporciona información completa para integrar las **APIs de Pagos** del sistema de gestión empresarial. Incluye módulos de: Monedas, Métodos de Pago, Tipos de Cambio y Procesamiento de Pagos.

## 🛠 Tecnologías y Herramientas

- **Backend**: Go REST API
- **Base de datos**: PostgreSQL (schema `payments`)

## 📋 Endpoints Disponibles

### Base URL
```
http://localhost:8080
```

---

## 🚀 Bootstrap - Inicialización del Frontend

> **⚡ RECOMENDADO:** Usa este endpoint para cargar todos los datos necesarios en UNA sola llamada.

```http
GET /payments/bootstrap
```

**Response:**
```json
{
  "currencies": [
    {
      "id": 1,
      "currency_code": "PYG",
      "name": "Guaraní",
      "symbol": "₲",
      "decimal_places": 0,
      "is_base": true
    }
  ],
  "payment_methods": [
    {
      "id": 1,
      "method_code": "CASH",
      "description": "Efectivo",
      "icon": "banknotes"
    }
  ],
  "exchange_rates": {
    "date": "2026-01-03",
    "rates": [
      {"currency_id": 2, "currency_code": "USD", "rate_to_base": 7350.00}
    ]
  },
  "config": {
    "base_currency_id": 1,
    "base_currency_code": "PYG",
    "default_decimals": 0
  },
  "generated_at": "2026-01-03T10:30:00Z"
}
```

---

## 💰 Currencies API

API unificada con filtros por query params.

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/currencies` | Listar todas las monedas |
| GET | `/currencies?id=1` | Obtener por ID |
| GET | `/currencies?code=USD` | Obtener por código |
| GET | `/currencies?enriched=true` | Con datos adicionales |
| POST | `/currencies` | Crear moneda |
| PUT | `/currencies/{id}` | Actualizar moneda |
| DELETE | `/currencies/{id}` | Eliminar moneda |

### Parámetros de Consulta

| Param | Tipo | Descripción |
|-------|------|-------------|
| id | number | Filtrar por ID |
| code | string | Filtrar por código (USD, PYG) |
| enriched | bool | Incluir symbol, decimals, is_base |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "currency_code": "PYG",
      "name": "Guaraní",
      "symbol": "₲",
      "decimal_places": 0,
      "is_base": true
    }
  ],
  "total": 1
}
```

---

## 🔄 Currency Conversion

Convierte montos entre monedas usando el tipo de cambio del día.

```http
GET /currencies/convert?from=USD&to=PYG&amount=100
GET /currencies/convert?from=USD&to=PYG&amount=100&date=2026-01-01
```

### Parámetros

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| from | string | ✅ | Código moneda origen |
| to | string | ✅ | Código moneda destino |
| amount | number | ✅ | Monto a convertir |
| date | string | ❌ | Fecha del tipo de cambio (default: hoy) |

### Response

```json
{
  "success": true,
  "from": {
    "code": "USD",
    "name": "Dólar estadounidense",
    "amount": 100,
    "rate": 7350
  },
  "to": {
    "code": "PYG",
    "name": "Guaraní",
    "amount": 735000,
    "rate": 1
  },
  "date": "2026-01-03",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

## 💱 Exchange Rates API

API unificada para tipos de cambio con múltiples filtros.

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/exchange-rates` | Listar todos (paginado) |
| GET | `/exchange-rates?id=1` | Obtener por ID |
| GET | `/exchange-rates?latest=true` | Más recientes de cada moneda |
| GET | `/exchange-rates?currency_id=2&date=2026-01-03` | Por moneda y fecha |
| GET | `/exchange-rates?code=USD&from=2026-01-01&to=2026-01-03` | Rango de fechas |
| POST | `/exchange-rates` | Crear tipo de cambio |
| PUT | `/exchange-rates/{id}` | Actualizar |
| DELETE | `/exchange-rates/{id}` | Eliminar |

### Parámetros de Consulta

| Param | Tipo | Descripción |
|-------|------|-------------|
| id | number | Filtrar por ID |
| currency_id | number | Filtrar por ID de moneda |
| code | string | Filtrar por código de moneda |
| date | string | Fecha específica (YYYY-MM-DD) |
| from | string | Fecha inicio del rango |
| to | string | Fecha fin del rango |
| latest | bool | Solo el más reciente por moneda |
| page | number | Número de página (default: 1) |
| page_size | number | Tamaño de página (default: 20, max: 100) |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "currency_id": 2,
      "currency_code": "USD",
      "currency_name": "Dólar estadounidense",
      "rate_to_base": 7350.00,
      "date": "2026-01-03",
      "source": "manual"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

---

## 💳 Payment Methods API

```http
GET /payment-methods              # Listar todos
GET /payment-methods/{id}         # Por ID
GET /payment-methods/code/{code}  # Por código
```

### Response

```json
[
  {
    "id": 1,
    "method_code": "CASH",
    "description": "Efectivo"
  },
  {
    "id": 2,
    "method_code": "CARD",
    "description": "Tarjeta de crédito/débito"
  }
]
```

---

## 💵 Payment Processing API

### Procesar Pago

```http
POST /payment/process
```

**Request Body:**
```json
{
  "sale_id": 123,
  "payments": [
    {
      "method_id": 1,
      "currency_id": 1,
      "amount": 150000.00
    }
  ]
}
```

### Procesar Pago Parcial

```http
POST /payment/process-partial
```

**Request Body:**
```json
{
  "sale_id": 123,
  "payments": [
    {
      "method_id": 1,
      "currency_id": 1,
      "amount": 50000.00
    }
  ]
}
```

### Consultas de Pagos

```http
GET /payment/details/{saleId}      # Detalles de pago por venta
GET /payment/{paymentId}           # Pago por ID
GET /payment/statistics/change     # Estadísticas de vueltos dados
GET /payment/totals/sales          # Totales de ventas por rango
GET /payment/totals/purchases      # Totales de compras por rango
```

---

## Estructuras de Datos

### Currency
```typescript
interface Currency {
  id: number;
  currency_code: string;
  name: string;
}
```

### CurrencyEnriched
```typescript
interface CurrencyEnriched extends Currency {
  symbol: string;        // ₲, $, €
  decimal_places: number; // 0-2
  is_base: boolean;
}
```

### ExchangeRate
```typescript
interface ExchangeRate {
  id: number;
  currency_id: number;
  rate_to_base: number;
  date: string;          // ISO 8601
  source?: string;
  created_at: string;
}
```

### ExchangeRateEnriched
```typescript
interface ExchangeRateEnriched extends ExchangeRate {
  currency_code: string;
  currency_name: string;
}
```

### PaymentMethod
```typescript
interface PaymentMethod {
  id: number;
  method_code: string;
  description: string;
}
```

---

## Manejo de Errores

Todas las APIs devuelven errores estructurados:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Moneda no encontrada"
  }
}
```

### Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| INVALID_ID | 400 | ID no es número válido |
| MISSING_PARAMS | 400 | Parámetros requeridos faltantes |
| INVALID_AMOUNT | 400 | Monto no es número válido |
| NOT_FOUND | 404 | Recurso no encontrado |
| CURRENCY_NOT_FOUND | 404 | Moneda no existe |
| FROM_RATE_NOT_FOUND | 404 | Tipo cambio origen no encontrado |
| TO_RATE_NOT_FOUND | 404 | Tipo cambio destino no encontrado |
| DB_ERROR | 500 | Error de base de datos |

---

## Resumen de Endpoints

| Módulo | Endpoint | Métodos |
|--------|----------|---------|
| Bootstrap | `/payments/bootstrap` | GET |
| Currencies | `/currencies` | GET, POST |
| Currencies | `/currencies/{id}` | PUT, DELETE |
| Currencies | `/currencies/convert` | GET |
| Exchange Rates | `/exchange-rates` | GET, POST |
| Exchange Rates | `/exchange-rates/{id}` | PUT, DELETE |
| Payment Methods | `/payment-methods` | GET |
| Payment Processing | `/payment/*` | GET, POST |

---

**Guía actualizada**: 3 de Enero de 2026  
**Versión de APIs**: v1.0 (Consolidada)

**Equipo de desarrollo**: Business Management Team
