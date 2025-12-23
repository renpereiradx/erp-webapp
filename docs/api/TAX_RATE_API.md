# 🪙 API de Tasas de Impuesto (Tax Rates)

**Versión:** 1.0
**Fecha:** 17 de Noviembre de 2025
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta API proporciona una interfaz para la gestión completa de las tasas de impuesto en el sistema. Permite crear, consultar, actualizar y listar las diferentes tasas impositivas que se utilizan en otras partes del sistema, como en las órdenes de compra.

### Características Principales

- ✅ **Crear y actualizar** tasas de impuesto.
- ✅ **Consultar** una tasa específica por su ID o nombre.
- ✅ **Listar** todas las tasas de impuesto de forma paginada.
- ✅ Definir tasas por **país y tipo de jurisdicción**.
- ✅ Establecer **períodos de vigencia** (`effective_start`, `effective_end`).

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Formato de Respuesta de Error Estándar
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descripción legible del error."
}
```

---

## 🔗 Endpoints de la API

### 1. Listar Tasas de Impuesto (Paginado)

**Endpoint:** `GET /tax_rate/{page}/{pageSize}`

Obtiene una lista paginada de todas las tasas de impuesto disponibles en el sistema.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `page` | number | ✅ Sí | Número de la página que se desea obtener. Mínimo: 1. |
| `pageSize` | number | ✅ Sí | Cantidad de resultados por página. |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tax_name": "IVA General",
    "rate": 10.0,
    "country": "Paraguay",
    "jurisdiction_type": "Nacional",
    "description": "Impuesto al Valor Agregado general para la mayoría de productos y servicios.",
    "effective_start": "2020-01-01T00:00:00Z",
    "effective_end": "",
    "is_default": true
  },
  {
    "id": 2,
    "tax_name": "IVA Reducido",
    "rate": 5.0,
    "country": "Paraguay",
    "jurisdiction_type": "Nacional",
    "description": "IVA para productos de la canasta básica familiar.",
    "effective_start": "2020-01-01T00:00:00Z",
    "effective_end": "",
    "is_default": false
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Invalid page number` | 400 Bad Request | El número de página no es un entero válido. |
| `Invalid page size` | 400 Bad Request | El tamaño de página no es un entero válido. |
| `No tax rates found` | 404 Not Found | No se encontraron tasas de impuesto. |

---

### 2. Obtener Tasa de Impuesto por ID

**Endpoint:** `GET /tax_rate/{id}`

Obtiene los detalles de una tasa de impuesto específica utilizando su ID numérico.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | ID único de la tasa de impuesto. |

**Response (200 OK):**
```json
{
  "id": 1,
  "tax_name": "IVA General",
  "rate": 10.0,
  "country": "Paraguay",
  "jurisdiction_type": "Nacional",
  "description": "Impuesto al Valor Agregado general para la mayoría de productos y servicios.",
  "effective_start": "2020-01-01T00:00:00Z",
  "effective_end": "",
  "is_default": true
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Invalid ID` | 400 Bad Request | El ID proporcionado no es un número entero válido. |
| `Tax rate not found` | 404 Not Found | No se encontró ninguna tasa de impuesto con el ID especificado. |

---

### 3. Buscar Tasas de Impuesto por Nombre

**Endpoint:** `GET /tax_rate/name/{name}`

Busca y devuelve una lista de tasas de impuesto que coincidan (parcial o totalmente) con el nombre proporcionado.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | ✅ Sí | Nombre o parte del nombre de la tasa a buscar (URL-encoded). |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tax_name": "IVA General",
    "rate": 10.0,
    "country": "Paraguay",
    "jurisdiction_type": "Nacional",
    "description": "Impuesto al Valor Agregado general para la mayoría de productos y servicios.",
    "effective_start": "2020-01-01T00:00:00Z",
    "effective_end": "",
    "is_default": true
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `No tax rates found` | 404 Not Found | No se encontraron tasas que coincidan con el nombre. |

---

### 4. Crear Nueva Tasa de Impuesto

**Endpoint:** `POST /tax_rate/`

Crea una nueva tasa de impuesto en el sistema.

**Request Body:**
```json
{
  "tax_name": "IVA Fronterizo",
  "rate": 7.5,
  "country": "Paraguay",
  "jurisdiction_type": "Regional",
  "description": "Tasa especial para zonas fronterizas.",
  "effective_start": "2026-01-01T00:00:00Z",
  "effective_end": "2030-12-31T23:59:59Z",
  "is_default": false
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `tax_name` | string | ✅ Sí | Nombre único para la tasa de impuesto. |
| `rate` | number | ✅ Sí | El porcentaje de la tasa (ej: `10.0` para 10%). |
| `country` | string | ✅ Sí | País donde aplica la tasa. |
| `jurisdiction_type` | string | ✅ Sí | Tipo de jurisdicción (ej: `Nacional`, `Regional`, `Municipal`). |
| `description` | string | ❌ No | Descripción opcional de la tasa. |
| `effective_start` | string | ✅ Sí | Fecha de inicio de vigencia en formato ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`). |
| `effective_end` | string | ❌ No | Fecha de fin de vigencia en formato ISO 8601. Si se omite, no tiene fin. |
| `is_default` | boolean | ✅ Sí | Indica si esta es la tasa por defecto para su jurisdicción. |

**Response (200 OK):**
```json
{
  "Message": "Tax rate added"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Bad Request` | 400 Bad Request | El cuerpo de la solicitud (JSON) está malformado o faltan campos requeridos. |
| `Internal Server Error` | 500 Internal Server Error | Error al intentar guardar la tasa en la base de datos (ej: `tax_name` duplicado). |

---

### 5. Actualizar Tasa de Impuesto

**Endpoint:** `PUT /tax_rate/{id}`

Actualiza los datos de una tasa de impuesto existente, identificada por su ID.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | ID de la tasa de impuesto a actualizar. |

**Request Body:**
*La estructura es idéntica a la de `POST /tax_rate/`.*
```json
{
  "tax_name": "IVA Fronterizo (Actualizado)",
  "rate": 8.0,
  "country": "Paraguay",
  "jurisdiction_type": "Regional",
  "description": "Tasa especial para zonas fronterizas, actualizada.",
  "effective_start": "2026-01-01T00:00:00Z",
  "effective_end": "",
  "is_default": false
}
```

**Response (200 OK):**
```json
{
  "Message": "Tax rate updated"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Invalid ID` | 400 Bad Request | El ID en la URL no es un número entero válido. |
| `Bad Request` | 400 Bad Request | El cuerpo de la solicitud (JSON) está malformado. |
| `Internal Server Error` | 500 Internal Server Error | Error al actualizar en la base de datos. |

---

## 📊 Modelos de Datos (JSON)

### TaxRate
Representa una tasa de impuesto en el sistema.

```json
{
  "id": "number",
  "tax_name": "string",
  "rate": "number",
  "country": "string",
  "jurisdiction_type": "string",
  "description": "string, omitempty",
  "effective_start": "string (ISO 8601)",
  "effective_end": "string (ISO 8601), omitempty",
  "is_default": "boolean"
}
```
