# 💰 API de Pagos, Monedas y Tipos de Cambio

**Versión:** 1.0
**Fecha:** 10 de Octubre de 2025
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Sistema completo de gestión de pagos, monedas y tipos de cambio que permite administrar métodos de pago, divisas y conversiones entre monedas. Este documento consolida tres subsistemas críticos del sistema de facturación y ventas.

### Características Principales

- ✅ Gestión de métodos de pago (efectivo, tarjetas, transferencias)
- ✅ CRUD completo de monedas con validaciones
- ✅ CRUD completo de tipos de cambio con historial
- ✅ Consultas históricas y por rangos de fecha
- ✅ Vistas enriquecidas con información relacionada
- ✅ Integración con sistema de ventas y precios

### Subsistemas Incluidos

1. **Payment Methods** - Consulta de métodos de pago disponibles (solo lectura)
2. **Currencies** - Gestión completa de monedas
3. **Exchange Rates** - Gestión de tipos de cambio con histórico

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos

**Para endpoints de solo lectura (GET):**
```http
Content-Type: application/json
```

**Para endpoints de creación/modificación (POST/PUT/DELETE):**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 💳 Payment Methods - Métodos de Pago

Sistema de consulta de métodos de pago disponibles. Actualmente soporta **solo operaciones de lectura**.

### Estado del Subsistema

**Operaciones Disponibles:**
- ✅ GET - Listar todos los métodos
- ✅ GET - Buscar por ID
- ✅ GET - Buscar por código

**Operaciones No Disponibles:**
- ❌ POST - Crear método (se configuran en DB)
- ❌ PUT - Actualizar método
- ❌ DELETE - Eliminar método

---

### 1. Listar Todos los Métodos de Pago

**Endpoint:** `GET /payment-methods`

Obtiene la lista completa de métodos de pago disponibles.

**Request:** No requiere body

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "method_code": "efectivo",
    "description": "Pago en efectivo"
  },
  {
    "id": 5,
    "method_code": "CASH",
    "description": "Efectivo"
  },
  {
    "id": 8,
    "method_code": "CREDIT_CARD",
    "description": "Tarjeta de Crédito"
  }
]
```

**Campos de Response:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único del método de pago |
| `method_code` | string | Código único (ej: "CASH", "CREDIT_CARD") |
| `description` | string | Descripción legible del método |

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Error al obtener métodos de pago: [detalle]` | 500 | Error interno del servidor |

---

### 2. Obtener Método de Pago por ID

**Endpoint:** `GET /payment-methods/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del método de pago |

**Ejemplo Request:**
```
GET /payment-methods/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "method_code": "efectivo",
  "description": "Pago en efectivo"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `ID inválido` | 400 | El ID no es un número válido |
| `Método de pago no encontrado` | 404 | No existe un método con ese ID |

---

### 3. Obtener Método de Pago por Código

**Endpoint:** `GET /payment-methods/code/{code}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Código del método (ej: "CASH") |

**Ejemplo Request:**
```
GET /payment-methods/code/CASH
```

**Response (200 OK):**
```json
{
  "id": 5,
  "method_code": "CASH",
  "description": "Efectivo"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Método de pago no encontrado` | 404 | No existe un método con ese código |

---

## 💰 Currencies - Monedas

Sistema completo de gestión de monedas con CRUD completo.

### Modelo de Datos

```json
{
  "id": 1,
  "currency_code": "PYG",
  "name": "Guaranies"
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único de la moneda (auto-generado) |
| `currency_code` | string | Código ISO 4217 (ej: "USD", "PYG") - Único |
| `name` | string | Nombre completo de la moneda |

---

### 4. Listar Todas las Monedas

**Endpoint:** `GET /currencies`

**Request:** No requiere body

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "currency_code": "PYG",
    "name": "Guaranies"
  },
  {
    "id": 2,
    "currency_code": "BRL",
    "name": "Real brasileño"
  },
  {
    "id": 3,
    "currency_code": "ARS",
    "name": "Peso argentino"
  },
  {
    "id": 5,
    "currency_code": "USD",
    "name": "Dólar estadounidense"
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Error al obtener monedas: [detalle]` | 500 | Error interno del servidor |

---

### 5. Obtener Moneda por ID

**Endpoint:** `GET /currencies/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la moneda |

**Ejemplo Request:**
```
GET /currencies/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "currency_code": "PYG",
  "name": "Guaranies"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `ID inválido` | 400 | El ID no es un número válido |
| `Moneda no encontrada` | 404 | No existe una moneda con ese ID |

---

### 6. Obtener Moneda por Código

**Endpoint:** `GET /currencies/code/{code}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Código ISO de la moneda (ej: "USD") |

**Ejemplo Request:**
```
GET /currencies/code/ARS
```

**Response (200 OK):**
```json
{
  "id": 3,
  "currency_code": "ARS",
  "name": "Peso argentino"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Moneda no encontrada` | 404 | No existe una moneda con ese código |

---

### 7. Crear Moneda

**Endpoint:** `POST /currencies`

**Request Body:**
```json
{
  "currency_code": "EUR",
  "name": "Euro"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `currency_code` | string | ✅ Sí | Código ISO 4217 (3 letras mayúsculas, único) |
| `name` | string | ❌ No | Nombre completo de la moneda |

**Response (201 Created):**
```json
{
  "id": 10,
  "currency_code": "EUR",
  "name": "Euro"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `Datos inválidos: [detalle]` | 400 | JSON malformado o tipos incorrectos |
| `El código de moneda es requerido` | 400 | No se proporcionó currency_code |
| `Error al crear moneda: [detalle]` | 500 | Código duplicado o error DB |

**Validaciones Recomendadas:**

1. ✅ `currency_code` debe tener exactamente 3 caracteres mayúsculas
2. ✅ Verificar que el código no exista antes de crear
3. ✅ Validar contra códigos ISO 4217 estándar (opcional pero recomendado)

---

### 8. Actualizar Moneda

**Endpoint:** `PUT /currencies/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la moneda a actualizar |

**Request Body:**
```json
{
  "currency_code": "EUR",
  "name": "Euro Europeo"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `currency_code` | string | ✅ Sí | Código ISO 4217 de la moneda |
| `name` | string | ❌ No | Nombre completo de la moneda |

**Response (200 OK):**
```json
{
  "id": 10,
  "currency_code": "EUR",
  "name": "Euro Europeo"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `ID inválido` | 400 | El ID no es un número válido |
| `Datos inválidos: [detalle]` | 400 | JSON malformado |
| `El código de moneda es requerido` | 400 | No se proporcionó currency_code |
| `Moneda no encontrada` | 404 | No existe una moneda con ese ID |

---

### 9. Eliminar Moneda

**Endpoint:** `DELETE /currencies/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la moneda a eliminar |

**Ejemplo Request:**
```
DELETE /currencies/10
```

**Response (200 OK):**
```json
{
  "message": "Moneda eliminada exitosamente"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `ID inválido` | 400 | El ID no es un número válido |
| `moneda no encontrada` | 404 | No existe una moneda con ese ID |
| `Error al eliminar moneda: [detalle]` | 500 | La moneda tiene tipos de cambio o precios asociados |

**Validaciones Recomendadas:**

1. ⚠️ **Importante**: Verificar que no tenga tipos de cambio asociados
2. ⚠️ **Importante**: Verificar que no tenga precios activos
3. 💡 Considerar "desactivación lógica" en lugar de eliminación física

---

## 📈 Exchange Rates - Tipos de Cambio

Sistema de gestión de tipos de cambio con soporte para histórico y consultas por fecha.

### Modelo de Datos

```json
{
  "id": 1,
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-08T10:30:00Z"
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único del registro (auto-generado) |
| `currency_id` | number | ID de la moneda (FK a currencies) |
| `rate_to_base` | number | Tasa de conversión a moneda base |
| `date` | string (ISO 8601) | Fecha de vigencia del tipo de cambio |
| `source` | string | Fuente del tipo (ej: "BCP", "Manual") |
| `created_at` | string (ISO 8601) | Timestamp de creación (auto-generado) |

### Modelo Enriquecido

```json
{
  "id": 1,
  "currency_id": 2,
  "currency_code": "USD",
  "currency_name": "Dólar Estadounidense",
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-08T10:30:00Z"
}
```

---

### 10. Listar Todos los Tipos de Cambio

**Endpoint:** `GET /exchange-rate`

Obtiene todos los tipos de cambio sin paginación.

**Request:** No requiere body

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "currency_id": 2,
    "rate_to_base": 7350.50,
    "date": "2025-10-08T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-08T10:30:00Z"
  },
  {
    "id": 2,
    "currency_id": 3,
    "rate_to_base": 1450.25,
    "date": "2025-10-08T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-08T10:30:00Z"
  }
]
```

⚠️ **Advertencia:** Este endpoint puede retornar muchos registros. Para consultas con paginación usar `/exchange-rate/enriched`.

---

### 11. Obtener Tipos de Cambio Enriquecidos (Paginado)

**Endpoint:** `GET /exchange-rate/enriched`

Obtiene tipos de cambio con información de moneda incluida y paginación.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | string (YYYY-MM-DD) | ❌ No | Filtrar por fecha específica |
| `page` | number | ❌ No | Número de página (default: 1) |
| `page_size` | number | ❌ No | Registros por página (default: 20, max: 100) |

**Ejemplo Request:**
```
GET /exchange-rate/enriched?date=2025-10-08&page=1&page_size=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "currency_id": 2,
      "currency_code": "USD",
      "currency_name": "Dólar Estadounidense",
      "rate_to_base": 7350.50,
      "date": "2025-10-08T00:00:00Z",
      "source": "BCP",
      "created_at": "2025-10-08T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10,
  "total_pages": 2
}
```

**Campos Adicionales de Response:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `data` | array | Lista de tipos de cambio enriquecidos |
| `total` | number | Total de registros disponibles |
| `page` | number | Página actual |
| `page_size` | number | Registros por página |
| `total_pages` | number | Total de páginas |

---

### 12. Obtener Tipos de Cambio Más Recientes

**Endpoint:** `GET /exchange-rate/latest`

Obtiene el tipo de cambio más reciente de cada moneda.

**Request:** No requiere body

**Response (200 OK):**
```json
[
  {
    "id": 45,
    "currency_id": 2,
    "currency_code": "USD",
    "currency_name": "Dólar Estadounidense",
    "rate_to_base": 7350.50,
    "date": "2025-10-08T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-08T10:30:00Z"
  },
  {
    "id": 46,
    "currency_id": 3,
    "currency_code": "BRL",
    "currency_name": "Real Brasileño",
    "rate_to_base": 1450.25,
    "date": "2025-10-08T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-08T10:30:00Z"
  }
]
```

**Uso Recomendado:**
- Mostrar tipos de cambio actuales en dashboard
- Calcular precios en múltiples monedas
- Validar conversiones antes de procesar transacciones

---

### 13. Obtener Tipo de Cambio por ID

**Endpoint:** `GET /exchange-rate/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del registro de tipo de cambio |

**Ejemplo Request:**
```
GET /exchange-rate/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-08T10:30:00Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `ID inválido` | 400 | El ID no es un número válido |
| `Tipo de cambio no encontrado` | 404 | No existe un registro con ese ID |

---

### 14. Obtener Tipo de Cambio por Fecha

**Endpoint:** `GET /exchange-rate/currency/{currency_id}`

Obtiene el tipo de cambio de una moneda en una fecha específica.

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `currency_id` | number | ID de la moneda |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | string (YYYY-MM-DD) | ❌ No | Fecha a consultar (default: hoy) |

**Ejemplo Request:**
```
GET /exchange-rate/currency/2?date=2025-10-01
```

**Response (200 OK):**
```json
{
  "id": 1,
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "date": "2025-10-01T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-01T08:00:00Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `currency_id inválido` | 400 | El currency_id no es un número válido |
| `No se encontró tipo de cambio` | 404 | No hay tipo de cambio para esa moneda/fecha |

**Validaciones Recomendadas:**

1. ✅ Validar formato de fecha (YYYY-MM-DD)
2. ✅ Verificar que currency_id existe
3. 💡 Si no se encuentra, buscar el tipo de cambio más cercano (fecha anterior)

---

### 15. Obtener Tipos de Cambio por Rango de Fechas

**Endpoint:** `GET /exchange-rate/currency/{currency_id}/range`

Obtiene los tipos de cambio de una moneda en un rango de fechas.

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `currency_id` | number | ID de la moneda |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha inicial del rango |
| `end_date` | string (YYYY-MM-DD) | ✅ Sí | Fecha final del rango |

**Ejemplo Request:**
```
GET /exchange-rate/currency/2/range?start_date=2025-10-01&end_date=2025-10-08
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "currency_id": 2,
    "rate_to_base": 7340.00,
    "date": "2025-10-01T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-01T08:00:00Z"
  },
  {
    "id": 5,
    "currency_id": 2,
    "rate_to_base": 7345.50,
    "date": "2025-10-05T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-05T08:00:00Z"
  },
  {
    "id": 8,
    "currency_id": 2,
    "rate_to_base": 7350.50,
    "date": "2025-10-08T00:00:00Z",
    "source": "BCP",
    "created_at": "2025-10-08T08:00:00Z"
  }
]
```

**Uso Recomendado:**
- Gráficas de evolución del tipo de cambio
- Análisis de tendencias
- Reportes históricos

**Validaciones Recomendadas:**

1. ✅ Validar que `start_date` ≤ `end_date`
2. ✅ Validar formato de fechas
3. ⚠️ Considerar límite de rango (ej: máximo 1 año)

---

### 16. Crear Tipo de Cambio

**Endpoint:** `POST /exchange-rate`

**Request Body:**
```json
{
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `currency_id` | number | ✅ Sí | ID de la moneda (debe existir) |
| `rate_to_base` | number | ✅ Sí | Tasa de conversión (> 0) |
| `date` | string (ISO 8601) | ❌ No | Fecha de aplicación (default: hoy) |
| `source` | string | ❌ No | Fuente del tipo de cambio |

**Response (201 Created):**
```json
{
  "id": 47,
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-08T14:25:30Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `Datos inválidos: [detalle]` | 400 | JSON malformado o tipos incorrectos |
| `El ID de moneda es requerido` | 400 | No se proporcionó currency_id |
| `El tipo de cambio es requerido` | 400 | No se proporcionó rate_to_base o es 0 |
| `Error al crear tipo de cambio: [detalle]` | 500 | currency_id no existe |

**Validaciones Recomendadas:**

1. ✅ Validar que `currency_id` existe
2. ✅ Validar que `rate_to_base > 0`
3. ✅ Validar formato de fecha si se proporciona
4. ⚠️ Advertir si ya existe un tipo para esa moneda/fecha
5. 💡 Validar que la tasa sea razonable (ejemplo: USD entre 6500-8500)

---

### 17. Actualizar Tipo de Cambio

**Endpoint:** `PUT /exchange-rate/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del registro a actualizar |

**Request Body:**
```json
{
  "rate_to_base": 7360.00,
  "source": "BCP Actualizado"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `rate_to_base` | number | ✅ Sí | Nueva tasa de conversión (> 0) |
| `date` | string (ISO 8601) | ❌ No | Nueva fecha de aplicación |
| `source` | string | ❌ No | Nueva fuente |

⚠️ **Nota:** `currency_id` no se puede cambiar. Para asociar a otra moneda, crear nuevo registro.

**Response (200 OK):**
```json
{
  "id": 47,
  "currency_id": 2,
  "rate_to_base": 7360.00,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP Actualizado",
  "created_at": "2025-10-08T14:25:30Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `ID inválido` | 400 | El ID no es un número válido |
| `Datos inválidos: [detalle]` | 400 | JSON malformado |
| `El tipo de cambio es requerido` | 400 | No se proporcionó rate_to_base o es 0 |
| `Tipo de cambio no encontrado` | 404 | No existe un registro con ese ID |

**Validaciones Recomendadas:**

1. ✅ Verificar que el registro existe
2. ✅ Validar que `rate_to_base > 0`
3. ⚠️ Advertir si se cambia un tipo histórico (puede afectar reportes)
4. 💡 Considerar crear nuevo registro en lugar de actualizar históricos

---

### 18. Eliminar Tipo de Cambio

**Endpoint:** `DELETE /exchange-rate/{id}`

**Parámetros de URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del registro a eliminar |

**Ejemplo Request:**
```
DELETE /exchange-rate/47
```

**Response (200 OK):**
```json
{
  "message": "Tipo de cambio eliminado exitosamente"
}
```

**Errores Posibles:**

| Error | HTTP Status | Causa |
|-------|-------------|-------|
| `ID inválido` | 400 | El ID no es un número válido |
| `tipo de cambio no encontrado` | 404 | No existe un registro con ese ID |
| `Error al eliminar tipo de cambio: [detalle]` | 500 | El tipo está siendo usado en transacciones |

**Validaciones Recomendadas:**

1. ⚠️ **Importante**: No eliminar tipos usados en transacciones históricas
2. ⚠️ Verificar que no haya precios o ventas que dependan de este registro
3. 💡 Considerar marcar como "inactivo" en lugar de eliminar
4. 💡 Solo permitir eliminar registros recientes sin referencias

---

## 🔄 Casos de Uso

### Caso 1: Mostrar Métodos de Pago en UI

**Escenario:** Frontend necesita listar métodos de pago en un formulario.

```
GET /payment-methods
```

**Uso:**
- Poblar dropdown de selección
- Mostrar opciones disponibles
- Validar métodos antes de procesar pago

---

### Caso 2: Configurar Monedas del Sistema

**Escenario:** Configurar las monedas que el sistema manejará.

**Paso 1 - Crear moneda base:**
```json
POST /currencies
{
  "currency_code": "PYG",
  "name": "Guaraní Paraguayo"
}
```

**Paso 2 - Crear monedas secundarias:**
```json
POST /currencies
{
  "currency_code": "USD",
  "name": "Dólar Estadounidense"
}
```

---

### Caso 3: Actualizar Tipos de Cambio Diarios

**Escenario:** Actualizar tipos de cambio cada mañana.

**Crear tipo USD:**
```json
POST /exchange-rate
{
  "currency_id": 2,
  "rate_to_base": 7350.50,
  "source": "BCP"
}
```

**Crear tipo BRL:**
```json
POST /exchange-rate
{
  "currency_id": 3,
  "rate_to_base": 1450.25,
  "source": "BCP"
}
```

---

### Caso 4: Calcular Precio en Moneda Extranjera

**Escenario:** Producto cuesta 100,000 PYG, calcular en USD.

**Paso 1 - Obtener tipo actual:**
```
GET /exchange-rate/currency/2
```

**Response:**
```json
{
  "currency_id": 2,
  "rate_to_base": 7350.50
}
```

**Paso 2 - Calcular:**
```
Precio USD = 100,000 / 7,350.50 = 13.61 USD
```

---

### Caso 5: Mostrar Tipos de Cambio en Dashboard

**Escenario:** Mostrar tipos vigentes en pantalla principal.

```
GET /exchange-rate/latest
```

**Uso en UI:**
```
Tipos de Cambio Hoy:
USD: ₲ 7,350.50
BRL: ₲ 1,450.25
ARS: ₲ 195.30
```

---

## 🔍 Validaciones del Sistema

### Pre-Procesamiento (Validar en Frontend)

**Payment Methods:**
1. ✅ Verificar que el método seleccionado existe
2. ✅ Validar ID o código antes de usar en pagos

**Currencies:**
1. ✅ `currency_code` debe tener 3 caracteres mayúsculas
2. ✅ Verificar unicidad de código antes de crear
3. ✅ Validar contra ISO 4217 (recomendado)

**Exchange Rates:**
1. ✅ `currency_id` debe existir
2. ✅ `rate_to_base` debe ser > 0
3. ✅ Validar formato de fecha (YYYY-MM-DD o ISO 8601)
4. ✅ Validar que la tasa esté en rango razonable
5. ⚠️ Advertir si ya existe tipo para misma moneda/fecha

### Post-Procesamiento (El Backend Garantiza)

**Currencies:**
1. ✅ `id` generado automáticamente
2. ✅ Unicidad de `currency_code`
3. ✅ Integridad referencial

**Exchange Rates:**
1. ✅ `id` y `created_at` generados automáticamente
2. ✅ `date` usa fecha actual si no se proporciona
3. ✅ Integridad referencial con currencies

### Reglas de Negocio Importantes

**Payment Methods:**
- Solo lectura desde API
- Nuevos métodos se configuran en DB

**Currencies:**
- Código único en todo el sistema
- No eliminar monedas con tipos de cambio o precios asociados

**Exchange Rates:**
- Históricos, no modificar tipos antiguos
- Puede haber múltiples registros para misma moneda/fecha (diferentes fuentes)
- Usar tipo de cambio de la fecha de la transacción

---

## ❌ Códigos de Error Consolidados

| Error | HTTP Status | Aplica a | Prevención |
|-------|-------------|----------|------------|
| `ID inválido` | 400 | Todos | Validar número entero positivo |
| `Datos inválidos: [detalle]` | 400 | POST/PUT | Validar estructura JSON |
| `El código de moneda es requerido` | 400 | Currencies | Campo obligatorio |
| `El ID de moneda es requerido` | 400 | Exchange Rates | Campo obligatorio |
| `El tipo de cambio es requerido` | 400 | Exchange Rates | Validar rate_to_base > 0 |
| `currency_id inválido` | 400 | Exchange Rates | Validar número |
| `start_date y end_date son requeridos` | 400 | Exchange Rates | Enviar ambas fechas |
| `[Recurso] no encontrado` | 404 | Todos | Verificar existencia antes |
| `Error al [acción]: [detalle]` | 500 | Todos | Error DB, verificar FK |

---

## 🎯 Recomendaciones de Implementación

### 1. Caché de Métodos de Pago

Los métodos de pago son **estáticos**:

```
1. Cargar lista completa al inicio: GET /payment-methods
2. Guardar en estado global
3. Usar caché durante toda la sesión
4. Refrescar solo al reiniciar aplicación
```

### 2. Caché de Monedas

Las monedas cambian raramente:

```
1. Cargar al inicio: GET /currencies
2. Mantener en estado global
3. Refrescar solo al crear/actualizar/eliminar
```

### 3. Caché de Tipos de Cambio Actuales

```
1. Al inicio: GET /exchange-rate/latest
2. Guardar en estado global
3. Refrescar cada X horas o al detectar cambio
4. Usar para cálculos de conversión
```

### 4. Validación de Tasas Razonables

```javascript
const RANGES = {
  USD: { min: 6500, max: 8500 },
  BRL: { min: 1200, max: 1800 },
  EUR: { min: 7500, max: 9500 }
};

// Validar antes de crear
if (rate < RANGES[code].min || rate > RANGES[code].max) {
  showWarning("Tasa fuera del rango esperado");
}
```

### 5. Conversión de Monedas

**Fórmulas:**

```javascript
// Moneda base a extranjera
foreignAmount = baseAmount / rateToBase;

// Extranjera a moneda base
baseAmount = foreignAmount * rateToBase;

// Ejemplo: 100,000 PYG a USD (rate = 7350.50)
usdAmount = 100000 / 7350.50; // = 13.61 USD
```

---

## 📊 Estructura de Datos

### PaymentMethod
```json
{
  "id": number,
  "method_code": string,
  "description": string
}
```

### Currency
```json
{
  "id": number,
  "currency_code": string,
  "name": string
}
```

### ExchangeRate
```json
{
  "id": number,
  "currency_id": number,
  "rate_to_base": number,
  "date": string,
  "source": string,
  "created_at": string
}
```

### ExchangeRateEnriched
```json
{
  "id": number,
  "currency_id": number,
  "currency_code": string,
  "currency_name": string,
  "rate_to_base": number,
  "date": string,
  "source": string,
  "created_at": string
}
```

---

## 🔗 APIs Relacionadas

- **Ventas**: Uso de payment_methods en transacciones
- **Precios**: Definición de precios en múltiples monedas
- **Reportes**: Conversión de montos para análisis

---

## 📝 Ejemplo cURL Completo

### Payment Methods
```bash
# Listar todos
curl -X GET http://localhost:5050/payment-methods

# Por ID
curl -X GET http://localhost:5050/payment-methods/1

# Por código
curl -X GET http://localhost:5050/payment-methods/code/CASH
```

### Currencies
```bash
# Listar todas
curl -X GET http://localhost:5050/currencies

# Crear
curl -X POST http://localhost:5050/currencies \
  -H "Content-Type: application/json" \
  -d '{"currency_code": "EUR", "name": "Euro"}'

# Actualizar
curl -X PUT http://localhost:5050/currencies/10 \
  -H "Content-Type: application/json" \
  -d '{"currency_code": "EUR", "name": "Euro Europeo"}'

# Eliminar
curl -X DELETE http://localhost:5050/currencies/10
```

### Exchange Rates
```bash
# Listar todos
curl -X GET http://localhost:5050/exchange-rate

# Más recientes
curl -X GET http://localhost:5050/exchange-rate/latest

# Enriquecidos con paginación
curl -X GET "http://localhost:5050/exchange-rate/enriched?page=1&page_size=10"

# Por fecha
curl -X GET "http://localhost:5050/exchange-rate/currency/2?date=2025-10-08"

# Por rango
curl -X GET "http://localhost:5050/exchange-rate/currency/2/range?start_date=2025-10-01&end_date=2025-10-08"

# Crear
curl -X POST http://localhost:5050/exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"currency_id": 2, "rate_to_base": 7350.50, "source": "BCP"}'

# Actualizar
curl -X PUT http://localhost:5050/exchange-rate/47 \
  -H "Content-Type: application/json" \
  -d '{"rate_to_base": 7360.00}'

# Eliminar
curl -X DELETE http://localhost:5050/exchange-rate/47
```

---

## 💡 Mejores Prácticas

### 1. No Modificar Históricos

⚠️ **Evitar editar tipos de cambio antiguos** ya usados en transacciones:
- Afecta cálculos históricos
- Descuadra reportes
- Genera inconsistencias

**Alternativa:** Crear nuevo registro documentando la corrección.

### 2. Documentar Fuentes

Siempre documentar origen del tipo de cambio:
- ✅ "BCP" - Banco Central del Paraguay
- ✅ "Manual" - Ingreso manual
- ✅ "API_XYZ" - API externa

### 3. Validación Cruzada

Antes de aplicar tipo en transacción:
1. Verificar que existe tipo para la fecha
2. Si no existe, usar el más reciente anterior
3. Nunca usar tipos futuros
4. Registrar qué tipo se usó

### 4. Alertas de Variación

Implementar alertas:
- ⚠️ Variación > 5% en un día
- ⚠️ Variación > 20% en una semana

---

## 📝 Historial de Cambios

### v1.0 - 10 de Octubre de 2025
- ✅ Documentación consolidada de tres subsistemas
- ✅ Payment Methods con operaciones de lectura
- ✅ Currencies con CRUD completo
- ✅ Exchange Rates con CRUD y consultas históricas
- ✅ Casos de uso y validaciones documentados
- ✅ Ejemplos con datos reales del sistema

---

**Última actualización:** 10 de Octubre de 2025
**Versión:** 1.0
**Mantenido por:** Equipo Backend
**Testing Completo:** ✅ Verificado con scripts automatizados
