# 💳 API de Métodos de Pago, Monedas y Cajas Registradoras

**Versión:** 1.1
**Fecha:** Marzo 2026
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Este módulo gestiona **métodos de pago**, **monedas con soporte multi-moneda (ISO 4217)**, **tipos de cambio** y **cajas registradoras** con auditorías y movimientos.

### Características Principales

- **Métodos de Pago**: CRUD completo para gestionar efectivo, transferencias, tarjetas, etc.
- **Multi-Moneda**: Soporte ISO 4217 con conversión automática.
- **Tipos de Cambio**: Historial de tasas de cambio con marca de moneda base.
- **Cajas Registradoras**: Apertura, cierre, movimientos y arqueos.
- **Auditorías de Caja**: Conteo de billetes/monedas y resolución de discrepancias.

---

## 🔧 Configuración General

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 1️⃣ Métodos de Pago

Los métodos de pago definen cómo se realizan las transacciones. **CRUD completo disponible.**

### 1.1 Obtener Todos los Métodos de Pago

**Endpoint:** `GET /payment-methods`

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "method_code": "CASH",
    "description": "Pago en efectivo",
    "is_active": true,
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-01T00:00:00Z"
  },
  {
    "id": 2,
    "method_code": "TRANSFER",
    "description": "Transferencia bancaria",
    "is_active": true,
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-01T00:00:00Z"
  }
]
```

---

### 1.2 Obtener Método de Pago por ID

**Endpoint:** `GET /payment-methods/{id}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción           |
| --------- | ---- | --------------------- |
| `id`      | int  | ID del método de pago |

**Response (200 OK):**

```json
{
  "id": 1,
  "method_code": "CASH",
  "description": "Pago en efectivo",
  "is_active": true,
  "created_at": "2026-03-01T00:00:00Z",
  "updated_at": "2026-03-01T00:00:00Z"
}
```

**Error (404):**

```json
{
  "error": "Método de pago no encontrado"
}
```

---

### 1.3 Obtener Método de Pago por Código

**Endpoint:** `GET /payment-methods/code/{code}`

**Parámetros de Ruta:**

| Parámetro | Tipo   | Descripción                                    |
| --------- | ------ | ---------------------------------------------- |
| `code`    | string | Código del método (CASH, TRANSFER, CARD, etc.) |

**Códigos Comunes:**

- `CASH` - Efectivo
- `TRANSFER` - Transferencia bancaria
- `CARD` - Tarjeta de crédito/débito
- `CHECK` - Cheque

---

### 1.4 Crear Método de Pago

**Endpoint:** `POST /payment-methods`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "method_code": "CRYPTO",
  "description": "Pago con criptomonedas"
}
```

**Parámetros del Request:**

| Campo         | Tipo   | Requerido | Descripción                                 |
| ------------- | ------ | --------- | ------------------------------------------- |
| `method_code` | string | Sí        | Código único del método (2-20 caracteres)   |
| `description` | string | No        | Descripción del método (max 255 caracteres) |

**Response (201 Created):**

```json
{
  "id": 5,
  "method_code": "CRYPTO",
  "description": "Pago con criptomonedas",
  "is_active": true,
  "created_at": "2026-03-18T18:00:00Z",
  "updated_at": "2026-03-18T18:00:00Z"
}
```

**Errores:**

| Código | Descripción                                       |
| ------ | ------------------------------------------------- |
| 400    | El código del método es requerido / JSON inválido |
| 401    | Token JWT inválido o ausente                      |
| 500    | Error al crear método de pago                     |

---

### 1.5 Actualizar Método de Pago

**Endpoint:** `PUT /payment-methods/{id}`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción                        |
| --------- | ---- | ---------------------------------- |
| `id`      | int  | ID del método de pago a actualizar |

**Request Body:**

```json
{
  "method_code": "CRYPTO",
  "description": "Bitcoin, Ethereum y otras criptomonedas",
  "is_active": true
}
```

**Parámetros del Request:**

| Campo         | Tipo   | Requerido | Descripción                               |
| ------------- | ------ | --------- | ----------------------------------------- |
| `method_code` | string | No        | Código único del método (2-20 caracteres) |
| `description` | string | No        | Descripción del método                    |
| `is_active`   | bool   | No        | Estado activo/inactivo                    |

**Response (200 OK):**

```json
{
  "id": 5,
  "method_code": "CRYPTO",
  "description": "Bitcoin, Ethereum y otras criptomonedas",
  "is_active": true,
  "created_at": "2026-03-18T18:00:00Z",
  "updated_at": "2026-03-18T18:30:00Z"
}
```

**Errores:**

| Código | Descripción                        |
| ------ | ---------------------------------- |
| 400    | ID inválido / JSON inválido        |
| 401    | Token JWT inválido o ausente       |
| 404    | Método de pago no encontrado       |
| 500    | Error al actualizar método de pago |

---

### 1.6 Eliminar Método de Pago (Soft Delete)

**Endpoint:** `DELETE /payment-methods/{id}`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción                      |
| --------- | ---- | -------------------------------- |
| `id`      | int  | ID del método de pago a eliminar |

**Response (200 OK):**

```json
{
  "message": "Método de pago eliminado exitosamente"
}
```

**Nota:** La eliminación es lógica (soft delete). El método se marca como `is_active = false` y permanece en la base de datos para preservar la integridad referencial con transacciones históricas.

**Errores:**

| Código | Descripción                      |
| ------ | -------------------------------- |
| 400    | ID inválido                      |
| 401    | Token JWT inválido o ausente     |
| 404    | Método de pago no encontrado     |
| 500    | Error al eliminar método de pago |

---

## 📊 Resumen de Endpoints - Métodos de Pago

| Método | Endpoint                       | Descripción                       | Auth |
| ------ | ------------------------------ | --------------------------------- | ---- |
| GET    | `/payment-methods`             | Obtener todos los métodos de pago | No   |
| GET    | `/payment-methods/{id}`        | Obtener método por ID             | No   |
| GET    | `/payment-methods/code/{code}` | Obtener método por código         | No   |
| POST   | `/payment-methods`             | Crear nuevo método de pago        | Sí   |
| PUT    | `/payment-methods/{id}`        | Actualizar método de pago         | Sí   |
| DELETE | `/payment-methods/{id}`        | Eliminar método (soft delete)     | Sí   |

---

## 2️⃣ Monedas (Currencies)

Sistema de gestión de monedas con soporte ISO 4217.

### 2.1 Listar Monedas

**Endpoint:** `GET /currencies`

**Query Parameters:**

| Parámetro      | Tipo   | Default | Descripción                    |
| -------------- | ------ | ------- | ------------------------------ |
| `is_active`    | bool   | -       | Filtrar por estado activo      |
| `is_base`      | bool   | -       | Filtrar por moneda base        |
| `country_code` | string | -       | Filtrar por país (ISO 3166-1)  |
| `search`       | string | -       | Buscar por código o nombre     |
| `page`         | int    | 1       | Número de página               |
| `page_size`    | int    | 20      | Elementos por página (max 100) |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "code": "PYG",
      "iso_number": 600,
      "name": "Guaraní Paraguayo",
      "symbol": "₲",
      "decimal_places": 0,
      "is_base": true,
      "is_active": true,
      "country_code": "PY",
      "format_pattern": "{symbol} {value}",
      "thousands_separator": ".",
      "decimal_separator": ",",
      "current_rate": null,
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    },
    {
      "id": 2,
      "code": "USD",
      "iso_number": 840,
      "name": "US Dollar",
      "symbol": "$",
      "decimal_places": 2,
      "is_base": false,
      "is_active": true,
      "country_code": "US",
      "current_rate": 7014.43,
      "rate_date": "2026-03-18T00:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 2.2 Obtener Moneda por ID

**Endpoint:** `GET /currencies/{id}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | int  | ID de la moneda |

---

### 2.3 Obtener Moneda por Código

**Endpoint:** `GET /currencies/code/{code}`

**Parámetros de Ruta:**

| Parámetro | Tipo   | Descripción                           |
| --------- | ------ | ------------------------------------- |
| `code`    | string | Código ISO 4217 (PYG, USD, EUR, etc.) |

---

### 2.4 Crear Moneda

**Endpoint:** `POST /currencies`

**Request Body:**

```json
{
  "code": "USD",
  "iso_number": 840,
  "name": "US Dollar",
  "symbol": "$",
  "decimal_places": 2,
  "is_base": false,
  "country_code": "US",
  "format_pattern": "{symbol}{value}",
  "thousands_separator": ",",
  "decimal_separator": "."
}
```

**Parámetros del Request:**

| Campo            | Tipo   | Requerido | Validación              | Descripción             |
| ---------------- | ------ | --------- | ----------------------- | ----------------------- |
| `code`           | string | Sí        | 3 letras mayúsculas     | Código ISO 4217         |
| `iso_number`     | int    | No        | 1-999                   | Código numérico ISO     |
| `name`           | string | Sí        | 2-100 caracteres        | Nombre completo         |
| `symbol`         | string | No        | max 10 caracteres       | Símbolo monetario       |
| `decimal_places` | int    | No        | 0-4 (default: 2)        | Decimales               |
| `is_base`        | bool   | No        | Solo una puede ser base | Moneda base del sistema |
| `country_code`   | string | No        | 2 letras mayúsculas     | Código ISO 3166-1       |

**Response (201 Created):**

```json
{
  "id": 3,
  "code": "USD",
  "name": "US Dollar",
  "symbol": "$",
  "is_base": false
}
```

---

### 2.5 Actualizar Moneda

**Endpoint:** `PUT /currencies/{id}`

**Request Body:**

```json
{
  "name": "US Dollar (Actualizado)",
  "symbol": "US$"
}
```

---

### 2.6 Eliminar Moneda (Soft Delete)

**Endpoint:** `DELETE /currencies/{id}`

La moneda se desactiva en lugar de eliminarse.

**Response (200 OK):**

```json
{
  "message": "Moneda desactivada exitosamente"
}
```

---

### 2.7 Conversión de Moneda

**Endpoint:** `GET /currencies/convert`

**Query Parameters:**

| Parámetro       | Tipo   | Requerido | Descripción              |
| --------------- | ------ | --------- | ------------------------ |
| `amount`        | float  | Sí        | Monto a convertir        |
| `from_currency` | string | Sí        | Código de moneda origen  |
| `to_currency`   | string | Sí        | Código de moneda destino |

**Ejemplo:**

```
GET /currencies/convert?amount=100&from_currency=USD&to_currency=PYG
```

**Response (200 OK):**

```json
{
  "original_amount": 100.0,
  "original_currency": "USD",
  "converted_amount": 701443.0,
  "target_currency": "PYG",
  "exchange_rate": 7014.43,
  "rate_date": "2026-03-18T00:00:00Z",
  "formatted_original": "$100.00",
  "formatted_converted": "₲ 701.443"
}
```

---

## 3️⃣ Tipos de Cambio (Exchange Rates)

### 3.1 Listar Tipos de Cambio

**Endpoint:** `GET /exchange-rates`

**Query Parameters:**

| Parámetro            | Tipo   | Default | Descripción               |
| -------------------- | ------ | ------- | ------------------------- |
| `from_currency_code` | string | -       | Código de moneda origen   |
| `to_currency_code`   | string | -       | Código de moneda destino  |
| `is_current`         | bool   | -       | Solo tasas actuales       |
| `start_date`         | date   | -       | Fecha inicio (YYYY-MM-DD) |
| `end_date`           | date   | -       | Fecha fin (YYYY-MM-DD)    |
| `page`               | int    | 1       | Número de página          |
| `page_size`          | int    | 20      | Elementos por página      |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "from_currency_id": 2,
      "to_currency_id": 1,
      "from_currency_code": "USD",
      "to_currency_code": "PYG",
      "rate": 7014.43,
      "rate_date": "2026-03-18T00:00:00Z",
      "source": "Banco Central",
      "is_current": true,
      "notes": "Tasa oficial del día",
      "created_at": "2026-03-18T08:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

---

### 3.2 Obtener Tipos de Cambio Actuales

**Endpoint:** `GET /exchange-rates/latest`

Retorna las tasas más recientes para cada par de monedas.

---

### 3.3 Crear Tipo de Cambio

**Endpoint:** `POST /exchange-rates`

**Request Body:**

```json
{
  "from_currency_code": "USD",
  "to_currency_code": "PYG",
  "rate": 7014.43,
  "source": "Banco Central",
  "notes": "Tasa oficial del día"
}
```

**Parámetros del Request:**

| Campo                | Tipo   | Requerido | Descripción              |
| -------------------- | ------ | --------- | ------------------------ |
| `from_currency_code` | string | Sí        | Código de moneda origen  |
| `to_currency_code`   | string | Sí        | Código de moneda destino |
| `rate`               | float  | Sí        | Tasa de cambio           |
| `source`             | string | No        | Fuente de la tasa        |
| `notes`              | string | No        | Notas adicionales        |

---

### 3.4 Actualizar Tipo de Cambio

**Endpoint:** `PUT /exchange-rates/{id}`

---

### 3.5 Eliminar Tipo de Cambio

**Endpoint:** `DELETE /exchange-rates/{id}`

---

## 4️⃣ Cajas Registradoras

Sistema completo de gestión de cajas con apertura, cierre, movimientos y auditorías.

### 4.1 Abrir Caja Registradora

**Endpoint:** `POST /cash-registers/open`

**Request Body:**

```json
{
  "name": "Caja Principal",
  "initial_balance": 500000,
  "location": "Sucursal Centro"
}
```

**Parámetros del Request:**

| Campo             | Tipo   | Requerido | Descripción       |
| ----------------- | ------ | --------- | ----------------- |
| `name`            | string | Sí        | Nombre de la caja |
| `initial_balance` | float  | Sí        | Saldo inicial     |
| `location`        | string | No        | Ubicación física  |

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "Caja Principal",
  "status": "OPEN",
  "initial_balance": 500000,
  "current_balance": 500000,
  "opened_at": "2026-03-18T08:00:00Z",
  "opened_by": "user_123"
}
```

---

### 4.2 Obtener Caja Activa del Usuario

**Endpoint:** `GET /cash-registers/active`

Retorna la caja abierta del usuario autenticado.

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Caja Principal",
  "status": "OPEN",
  "initial_balance": 500000,
  "current_balance": 1250000,
  "opened_at": "2026-03-18T08:00:00Z"
}
```

**Response (204 No Content):** Si no hay caja abierta.

---

### 4.3 Listar Cajas Registradoras

**Endpoint:** `GET /cash-registers`

**Query Parameters:**

| Parámetro | Tipo   | Default | Descripción                       |
| --------- | ------ | ------- | --------------------------------- |
| `status`  | string | -       | Filtrar por estado (OPEN, CLOSED) |
| `limit`   | int    | 10      | Límite de resultados (max 100)    |
| `offset`  | int    | 0       | Offset para paginación            |

---

### 4.4 Obtener Caja por ID

**Endpoint:** `GET /cash-registers/{id}`

---

### 4.5 Cerrar Caja Registradora

**Endpoint:** `PUT /cash-registers/{id}/close`

**Request Body (Opcional):**

```json
{
  "final_notes": "Cierre del día",
  "counted_cash": 1250000
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "status": "CLOSED",
  "initial_balance": 500000,
  "final_balance": 1250000,
  "difference": 0,
  "total_income": 950000,
  "total_expenses": 200000,
  "closed_at": "2026-03-18T18:00:00Z"
}
```

---

### 4.6 Registrar Movimiento de Efectivo

**Endpoint:** `POST /cash-movements`

**Tipos de Movimiento:**

- `INCOME` - Ingreso (venta, retiro de caja chica)
- `EXPENSE` - Egreso (compra, gasto)

**Request Body:**

```json
{
  "cash_register_id": 1,
  "movement_type": "INCOME",
  "amount": 150000,
  "category": "SALE",
  "description": "Venta producto #123",
  "reference_type": "SALE",
  "reference_id": "SALE-123"
}
```

**Parámetros del Request:**

| Campo              | Tipo   | Requerido | Descripción                                  |
| ------------------ | ------ | --------- | -------------------------------------------- |
| `cash_register_id` | int    | Sí        | ID de la caja                                |
| `movement_type`    | string | Sí        | INCOME o EXPENSE                             |
| `amount`           | float  | Sí        | Monto del movimiento                         |
| `category`         | string | No        | Categoría (SALE, PURCHASE, ADJUSTMENT, etc.) |
| `description`      | string | No        | Descripción del movimiento                   |
| `reference_type`   | string | No        | Tipo de referencia (SALE, PURCHASE)          |
| `reference_id`     | string | No        | ID de la referencia                          |

**Response (201 Created):**

```json
{
  "id": 15,
  "cash_register_id": 1,
  "movement_type": "INCOME",
  "amount": 150000,
  "category": "SALE",
  "running_balance": 650000,
  "created_at": "2026-03-18T10:30:00Z"
}
```

---

### 4.7 Obtener Movimientos de una Caja

**Endpoint:** `GET /cash-registers/{id}/movements`

**Response (200 OK):**

```json
[
  {
    "id": 15,
    "cash_register_id": 1,
    "movement_type": "INCOME",
    "amount": 150000,
    "category": "SALE",
    "description": "Venta producto #123",
    "running_balance": 650000,
    "is_voided": false,
    "created_at": "2026-03-18T10:30:00Z",
    "created_by_name": "Juan Pérez"
  }
]
```

---

### 4.8 Obtener Movimientos Filtrados

**Endpoint:** `GET /cash-registers/{id}/movements/filter`

**Query Parameters:**

| Parámetro   | Tipo   | Descripción                                    |
| ----------- | ------ | ---------------------------------------------- |
| `type`      | string | Filtrar por tipo (INCOME, EXPENSE)             |
| `date_from` | string | Fecha desde (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) |
| `date_to`   | string | Fecha hasta                                    |
| `limit`     | int    | Límite de resultados (default: 50, max: 200)   |
| `offset`    | int    | Offset para paginación                         |

---

### 4.9 Anular Movimiento

**Endpoint:** `POST /cash-movements/{id}/void`

**Request Body:**

```json
{
  "reason": "Error en el registro del monto"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "voided_movement_id": 15,
  "reversal_movement_id": 16,
  "message": "Movimiento anulado exitosamente"
}
```

---

### 4.10 Reporte de Caja

**Endpoint:** `GET /cash-registers/{id}/report`

**Response (200 OK):**

```json
{
  "cash_register": {
    "id": 1,
    "name": "Caja Principal",
    "status": "OPEN",
    "initial_balance": 500000,
    "current_balance": 1250000
  },
  "summary": {
    "total_income": 950000,
    "total_expenses": 200000,
    "net_change": 750000,
    "transaction_count": 15
  },
  "by_category": {
    "SALE": 900000,
    "PURCHASE": 150000,
    "ADJUSTMENT": 0
  }
}
```

---

## 5️⃣ Auditorías de Caja (Arqueos)

### 5.1 Crear Auditoría

**Endpoint:** `POST /cash-audits`

**Request Body:**

```json
{
  "cash_register_id": 1,
  "counted_amount": 1245000,
  "notes": "Conteo final del día",
  "denominations": [
    { "denomination": 100000, "count": 5, "type": "BILL" },
    { "denomination": 50000, "count": 10, "type": "BILL" },
    { "denomination": 10000, "count": 45, "type": "BILL" }
  ]
}
```

**Parámetros del Request:**

| Campo              | Tipo   | Requerido | Descripción                 |
| ------------------ | ------ | --------- | --------------------------- |
| `cash_register_id` | int    | Sí        | ID de la caja               |
| `counted_amount`   | float  | Sí        | Monto contado físicamente   |
| `notes`            | string | No        | Notas del conteo            |
| `denominations`    | array  | No        | Detalle de billetes/monedas |

**Response (201 Created):**

```json
{
  "id": 1,
  "cash_register_id": 1,
  "expected_balance": 1250000,
  "counted_amount": 1245000,
  "difference": -5000,
  "status": "DISCREPANCY",
  "created_at": "2026-03-18T18:00:00Z"
}
```

---

### 5.2 Obtener Plantillas de Denominaciones

**Endpoint:** `GET /cash-audits/denominations`

Retorna plantillas predefinidas para conteo de efectivo.

**Response (200 OK):**

```json
{
  "PYG": {
    "bills": [100000, 50000, 20000, 10000, 5000, 2000],
    "coins": [1000, 500, 100, 50]
  },
  "USD": {
    "bills": [100, 50, 20, 10, 5, 1],
    "coins": [0.25, 0.1, 0.05, 0.01]
  }
}
```

---

### 5.3 Resolver Discrepancia

**Endpoint:** `POST /cash-audits/{id}/resolve`

**Request Body:**

```json
{
  "resolution_type": "ADJUSTMENT",
  "notes": "Diferencia por error de conteo"
}
```

**Tipos de Resolución:**

- `ADJUSTMENT` - Ajustar el saldo
- `VERIFIED` - Confirmar que el conteo es correcto

---

### 5.4 Obtener Auditorías de una Caja

**Endpoint:** `GET /cash-registers/{id}/audits`

---

## 6️⃣ Bootstrap de Pagos

Endpoint único para inicializar todos los datos necesarios para el módulo de pagos.

### Obtener Bootstrap

**Endpoint:** `GET /payments/bootstrap`

**Response (200 OK):**

```json
{
  "currencies": [
    { "id": 1, "code": "PYG", "name": "Guaraní Paraguayo", "is_base": true },
    { "id": 2, "code": "USD", "name": "US Dollar", "current_rate": 7014.43 }
  ],
  "payment_methods": [
    {
      "id": 1,
      "method_code": "CASH",
      "description": "Efectivo",
      "is_active": true
    },
    {
      "id": 2,
      "method_code": "TRANSFER",
      "description": "Transferencia",
      "is_active": true
    }
  ],
  "exchange_rates": [
    { "from": "USD", "to": "PYG", "rate": 7014.43, "date": "2026-03-18" }
  ]
}
```

---

## ❌ Manejo de Errores

| Código                          | HTTP | Descripción                         |
| ------------------------------- | ---- | ----------------------------------- |
| `INVALID_CURRENCY_CODE`         | 400  | Código debe ser 3 letras mayúsculas |
| `CURRENCY_NOT_FOUND`            | 404  | Moneda no encontrada                |
| `CANNOT_DELETE_BASE`            | 400  | No se puede eliminar la moneda base |
| `EXCHANGE_RATE_NOT_FOUND`       | 404  | No hay tipo de cambio para el par   |
| `CASH_REGISTER_NOT_FOUND`       | 404  | Caja no encontrada                  |
| `CASH_REGISTER_NOT_OPEN`        | 400  | La caja no está abierta             |
| `INSUFFICIENT_FUNDS`            | 400  | Fondos insuficientes en la caja     |
| `PAYMENT_METHOD_NOT_FOUND`      | 404  | Método de pago no encontrado        |
| `DUPLICATE_PAYMENT_METHOD_CODE` | 400  | El código del método ya existe      |

---

## 📝 Historial de Cambios

### v1.1 - Marzo 2026

- **CRUD completo para Métodos de Pago**: Agregados endpoints POST, PUT, DELETE.
- **Soft delete**: Los métodos de pago usan eliminación lógica (`is_active = false`).
- **Timestamps**: Agregados `created_at` y `updated_at` a métodos de pago.
- **Validación de código único**: Restricción UNIQUE en `method_code`.

### v1.0 - Marzo 2026

- Documentación inicial unificada de Métodos de Pago, Monedas y Cajas.
- Soporte para multi-moneda en ventas y compras.
- Sistema de auditorías de caja con denominaciones.
