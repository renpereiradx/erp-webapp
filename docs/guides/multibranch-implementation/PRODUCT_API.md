# API de Productos

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 3.3.0
**Fecha:** 2026-05-07
**Endpoint Base:** `http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Headers requeridos (cuando aplica)

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`.

## Contexto de Sucursal en Productos

Los productos son **globales** (la tabla `products.products` NO tiene `branch_id`), pero el **stock sí es por sucursal** (la tabla `products.stock` tiene `branch_id` con UNIQUE constraint en `(id_product, branch_id)`).

Esto significa que:

1. **Endpoints de lectura** (`GET /products/*`): Devuelven el mismo producto en todas las sucursales, pero el `stock_quantity` y `stock_branch_id` corresponden a la sucursal del contexto. Sin `branch_id`, el stock puede ser de cualquier sucursal.
2. **Endpoints de escritura** (`POST /products`, `PUT /products/{id}`): Crean/actualizan el producto globalmente, pero la respuesta incluye el stock filtrado por la sucursal del usuario.
3. **Endpoints de stock** (`POST /stock/{product_id}`, `PUT /stock/{id}`, `PUT /stock/product/{product_id}`): Siempre operan sobre el stock de la sucursal del usuario autenticado.

### Ejemplo: Filtrar stock por sucursal

```http
GET /products/list/1/10?branch_id=1
GET /products/all?branch_id=2
GET /products/abc123?branch_id=1
```

La respuesta incluirá `stock_branch_id: 1` y `stock_quantity` correspondiente a esa sucursal.

## Formato de fechas

- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params de fecha: `YYYY-MM-DD`

## Respuesta estándar

`{ success: bool, data?, message?, error?, pagination? }`

## Paginación estándar

`{ page, page_size, total_items, total_pages, has_next, has_prev }`

## Historial de Cambios

### v3.3.0 - 07 de Mayo de 2026

- **CAMBIO CRITICO**: Todos los endpoints de ProductEnriched ahora filtran stock por sucursal usando el contexto de branch. Sin `branch_id`, el stock puede ser de cualquier sucursal (legacy behavior).
- **CAMBIO CRITICO**: `POST /stock/{product_id}` ahora crea stock con el `branch_id` del usuario autenticado. Antes no asignaba sucursal, causando errores con UNIQUE constraint `(id_product, branch_id)`.
- **CAMBIO CRITICO**: `PUT /stock/{id}` y `PUT /stock/product/{product_id}` ahora filtran por `branch_id`. Solo actualizan stock de la sucursal del usuario.
- **NUEVO**: Campo `stock_branch_id` en respuestas `ProductEnriched`. Indica de qué sucursal es el stock devuelto.
- **NUEVO**: Campo `branch_id` en respuestas de Stock (`GET /stock/{id}`, `GET /stock/product/{product_id}`).
- **NUEVO**: `POST /products` y `PUT /products/{id}` ahora re-fetch con branch context para devolver stock correcto en la respuesta.

### v3.2.0 - 22 de Marzo de 2026

- **NUEVO**: `GET /products/{id}/info` como endpoint legible y completo.
- **NUEVO**: `GET /products/info/barcode/{barcode}` y `GET /products/info/search/{name}`.
- **NUEVO**: `GET /products/{id}/sale` y `GET /products/{id}/purchase` para flujos operativos.
- **CAMBIO**: `info` pasa a ser el endpoint principal de detalle completo.

### v3.1.0 - 18 de Marzo de 2026

- **NUEVO**: `GET /products/{id}/info` como endpoint legible y completo.
- **NUEVO**: `GET /products/info/barcode/{barcode}` y `GET /products/info/search/{name}`.
- **NUEVO**: `GET /products/{id}/sale` y `GET /products/{id}/purchase` para flujos operativos.
- **NUEVO**: Campo `category` expandido con `default_tax_rate_id` y `default_tax_rate`.
- **NUEVO**: Campo `applicable_tax_rate` con la tasa de IVA que aplica al producto.
- **NUEVO**: Campos de pricing: `override_tax_rate_id`, `target_margin_percent`, `pricing_strategy`.
- **CAMBIO**: La lógica de `applicable_tax_rate` es: override del producto > default de categoría.

### v3.0.0 - 24 de Febrero de 2026

- **BREAKING**: Campo `id_category` renombrado a `category_id` en request bodies de crear/actualizar.
- **BREAKING**: Campo `price_formatted` eliminado de las respuestas.
- **BREAKING**: Rutas eliminadas: `/products/name/{name}`, `/products/{id}/details`, `/products/{id}/with-description`, `/products/search/details/{name}`, `/products/delete/{id}`, `/products/enriched/*`, `/product_description/*`.
- Nuevo tipo de producto: `PRODUCTION` (ademas de `PHYSICAL` y `SERVICE`).
- Endpoint unificado `GET /products/{id}` reemplaza 3 endpoints anteriores (details, with-description, enriched by ID).
- Endpoint unificado `GET /products/search/{name}` reemplaza 2 endpoints de busqueda.
- Nuevo endpoint simple: `GET /products/{id}/info`.
- N+1 queries eliminadas en todos los endpoints de lectura.

### v2.4.0 - 25 de Enero de 2026

- Soporte para Unidades de Medida: campo `base_unit` para productos medibles.
- Stock con Unidad: campo `stock_unit` en las respuestas.

### v2.3.0 - 28 de Diciembre de 2025

- Trazabilidad de Timestamps: campos `created_at` y `updated_at` en todos los modelos.

---

## 📋 Descripción General

Los productos ahora incluyen información completa de IVA (Impuesto al Valor Agregado) según la Ley 6380/2019 de Paraguay. Cada producto tiene una tasa de IVA aplicable que se determina automáticamente:

1. **Si el producto tiene `override_tax_rate_id`**: usa esa tasa específica
2. **Si no tiene override**: usa el `default_tax_rate` de su categoría

### Códigos de IVA Soportados

| Código        | Descripción                   | Tasa     |
| ------------- | ----------------------------- | -------- |
| `IVA10`       | IVA General                   | 10%      |
| `IVA5`        | IVA Canasta Básica            | 5%       |
| `EXENTO`      | Exento de IVA                 | 0%       |
| `ISC`         | Impuesto Selectivo al Consumo | Variable |
| `IVA_DIGITAL` | IVA para servicios digitales  | 10%      |
| `IMPORT`      | Impuesto de importación       | Variable |

---

---

## Estructuras de Datos

### ProductEnriched

Respuesta estandar para todos los endpoints de productos.

| Campo                   | Tipo           | Descripcion                                             |
| ----------------------- | -------------- | ------------------------------------------------------- |
| `id`                    | string         | ID unico del producto                                   |
| `name`                  | string         | Nombre del producto                                     |
| `barcode`               | string \| null | Codigo de barras                                        |
| `state`                 | boolean        | Estado (activo/inactivo)                                |
| `category`              | object \| null | Ver estructura Category mas abajo                       |
| `product_type`          | string         | `PHYSICAL` \| `SERVICE` \| `PRODUCTION`                 |
| `origin`                | string \| null | `NACIONAL` \| `IMPORTADO`                               |
| `brand`                 | string \| null | Marca del producto                                      |
| `base_unit`             | string \| null | Unidad base: `kg`, `meter`, `l`, `unit`, etc.           |
| `override_tax_rate_id`  | number \| null | ID de tasa de IVA especifica (anula la de categoria)    |
| `target_margin_percent` | number \| null | Porcentaje de margen objetivo (0-100)                   |
| `pricing_strategy`      | string \| null | `MANUAL` \| `AUTOMATIC`                                 |
| `applicable_tax_rate`   | object \| null | Tasa de IVA que aplica al producto                      |
| `created_at`            | string         | Fecha de creacion (ISO 8601)                            |
| `updated_at`            | string         | Fecha de ultima actualizacion (ISO 8601)                |
| `purchase_price`        | number \| null | Precio de compra mas reciente                           |
| `stock_quantity`        | number \| null | Cantidad en stock                                       |
| `stock_unit`            | string \| null | Unidad del stock (ej: `kg`, `l`)                        |
| `stock_branch_id`      | number \| null | ID de la sucursal del stock mostrado                   |
| `stock_status`          | string         | `in_stock`, `low_stock`, `medium_stock`, `out_of_stock` |
| `has_valid_stock`       | boolean        | Si tiene stock registrado                               |
| `has_valid_price`       | boolean        | Si tiene al menos un precio                             |
| `has_unit_pricing`      | boolean        | Si tiene precios por unidad                             |
| `unit_prices`           | array          | Lista de precios por unidad                             |
| `description`           | string \| null | Descripcion del producto                                |

### Category

Estructura de categoria en productos.

| Campo                 | Tipo           | Descripcion                       |
| --------------------- | -------------- | --------------------------------- |
| `id`                  | number         | ID unico de la categoria          |
| `name`                | string         | Nombre de la categoria            |
| `description`         | string \| null | Descripcion de la categoria       |
| `default_tax_rate_id` | number \| null | ID de la tasa de IVA por defecto  |
| `default_tax_rate`    | object \| null | Ver estructura TaxRate mas abajo  |
| `parent_id`           | number \| null | ID de categoria padre (jerarquia) |
| `is_active`           | boolean        | Estado de la categoria            |
| `created_at`          | string         | Fecha de creacion (ISO 8601)      |
| `updated_at`          | string         | Fecha de actualizacion (ISO 8601) |

### TaxRate

Estructura de tasa de impuesto.

| Campo               | Tipo           | Descripcion                                                       |
| ------------------- | -------------- | ----------------------------------------------------------------- |
| `id`                | number         | ID unico de la tasa                                               |
| `tax_name`          | string         | Nombre del impuesto (ej: "IVA 10%")                               |
| `code`              | string         | Codigo: `IVA10`, `IVA5`, `EXENTO`, `ISC`, `IVA_DIGITAL`, `IMPORT` |
| `rate`              | number         | Porcentaje de la tasa (ej: 10.0, 5.0, 0)                          |
| `country`           | string         | Pais (ej: "PY")                                                   |
| `jurisdiction_type` | string         | Tipo de jurisdiccion                                              |
| `operation_type`    | string         | Tipo de operacion: `NACIONAL`, `CANASTA`, `EXEMPT`, etc.          |
| `description`       | string \| null | Descripcion detallada                                             |
| `effective_start`   | string         | Fecha de inicio de vigencia (ISO 8601)                            |
| `effective_end`     | string \| null | Fecha de fin de vigencia (ISO 8601)                               |
| `is_default`        | boolean        | Si es la tasa por defecto del sistema                             |
| `is_active`         | boolean        | Si la tasa esta activa                                            |
| `created_at`        | string         | Fecha de creacion (ISO 8601)                                      |
| `updated_at`        | string         | Fecha de ultima actualizacion (ISO 8601)                          |
| `created_by`        | string \| null | ID del usuario creador                                            |
| `updated_by`        | string \| null | ID del usuario que actualizo                                      |

### ProductOperationInfoResponse

Estructura completa para UI transaccional y detalle de producto.

| Campo                 | Tipo           | Descripcion                                                                       |
| --------------------- | -------------- | --------------------------------------------------------------------------------- | ---------- |
| `product_id`          | string         | ID unico del producto                                                             |
| `product_name`        | string         | Nombre del producto                                                               |
| `barcode`             | string \| null | Codigo de barras                                                                  |
| `state`               | boolean        | Estado (activo/inactivo)                                                          |
| `category`            | object \| null | `{id: number, name: string}`                                                      |
| `product_type`        | string         | `PHYSICAL` \| `SERVICE` \| `PRODUCTION`                                           |
| `origin`              | string \| null | `NACIONAL` \| `IMPORTADO`                                                         |
| `brand`               | string \| null | Marca del producto                                                                |
| `base_unit`           | string \| null | Unidad base                                                                       |
| `created_at`          | string         | Fecha de creacion (ISO 8601)                                                      |
| `updated_at`          | string         | Fecha de ultima actualizacion (ISO 8601)                                          |
| `unit_prices`         | array          | Precios de venta por unidad                                                       |
| `unit_costs_summary`  | array          | Resumen de costos por unidad                                                      |
| `stock_quantity`      | number \| null | Cantidad en stock                                                                 |
| `description`         | string \| null | Descripcion del producto                                                          |
| `tax`                 | object         | `{classification_code, resolution_source, rate}`                                  |
| `context`             | object         | `{operation: sale                                                                 | purchase}` |
| `operation_hints`     | object         | Pistas para frontend por contexto                                                 |
| `financial_health`    | object         | `{has_prices, has_costs, has_stock, price_count, cost_units_count, last_updated}` |
| `stock_status`        | string         | Estado del stock                                                                  |
| `has_valid_stock`     | boolean        | Si tiene stock                                                                    |
| `has_valid_prices`    | boolean        | Si tiene precios                                                                  |
| `has_valid_costs`     | boolean        | Si tiene costos                                                                   |
| `best_margin_unit`    | string \| null | Unidad con mejor margen                                                           |
| `best_margin_percent` | number \| null | Porcentaje del mejor margen                                                       |

---

## Endpoints de Stock

### Stock — Estructura de Datos

| Campo           | Tipo           | Descripcion                                              |
| --------------- | -------------- | ------------------------------------------------------- |
| `id`            | number         | ID unico del registro de stock                          |
| `product_id`    | string         | ID del producto                                         |
| `quantity`      | number         | Cantidad en stock (soporta decimales)                   |
| `unit`          | string \| null | Unidad de medida del stock (ej: `kg`, `l`, `unit`)      |
| `effective_date` | string        | Fecha de vigencia del registro (ISO 8601)               |
| `user_id`       | string         | ID del usuario que creó/actualizó el registro           |
| `branch_id`     | number \| null | ID de la sucursal del stock                             |
| `metadata`      | object \| null | Metadatos adicionales en JSON                           |

> **Nota sobre `branch_id`**: Al crear stock (`POST /stock/{product_id}`), el sistema asigna automáticamente el `branch_id` del usuario autenticado. Al actualizar (`PUT /stock/{id}` o `PUT /stock/product/{product_id}`), solo se actualiza el stock de la sucursal del usuario. Al consultar (`GET /stock/{id}` o `GET /stock/product/{product_id}`), se filtra por la sucursal del contexto.

### Crear Stock

**`POST /stock/{product_id}`**

Crea un registro de stock para un producto en la sucursal del usuario autenticado.

**Parámetros de URL:**

| Campo         | Tipo   | Descripcion        |
| ------------- | ------ | ------------------ |
| `product_id`  | string | ID del producto    |

**Request Body:**

```json
{
  "quantity": 100,
  "unit": "unit",
  "metadata": {}
}
```

**Parámetros:**

| Campo      | Tipo   | Requerido | Descripcion                          |
| ---------- | ------ | --------- | ------------------------------------ |
| `quantity`  | number | Si        | Cantidad de stock                    |
| `unit`      | string | No        | Unidad de medida                     |
| `metadata`  | object | No        | Metadatos adicionales en JSON        |

> **Importante:** El `branch_id` se toma automáticamente del contexto de sucursal del usuario. No se envía en el body.

**Response (200 OK):**

```json
{
  "message": "Stock added"
}
```

**Errores:**

| HTTP Status | Descripcion                                      |
| ----------- | ------------------------------------------------ |
| 400         | Datos invalidos                                  |
| 401         | Token JWT invalido o ausente                     |
| 500         | Error interno (ej: UNIQUE violation si ya existe stock para ese producto en esa sucursal) |

---

### Obtener Stock por ID

**`GET /stock/{id}`**

Retorna el registro de stock filtrado por la sucursal del usuario.

---

### Obtener Stock por Producto

**`GET /stock/product/{product_id}`**

Retorna el registro de stock más reciente del producto, filtrado por la sucursal del contexto.

---

### Actualizar Stock por ID

**`PUT /stock/{id}`**

Actualiza un registro de stock. Solo actualiza si el registro pertenece a la sucursal del usuario.

**Request Body:**

```json
{
  "quantity": 150,
  "unit": "unit",
  "metadata": {}
}
```

**Errores:**

| HTTP Status | Descripcion                                                   |
| ----------- | ------------------------------------------------------------- |
| 404         | Stock no encontrado o no pertenece a la sucursal del usuario |
| 401         | Token JWT invalido o ausente                                  |

---

### Actualizar Stock por Producto

**`PUT /stock/product/{product_id}`**

Actualiza el registro de stock más reciente del producto en la sucursal del usuario.

---

## Endpoints CRUD

### 1. Crear Producto

**`POST /products`**

Crea un nuevo producto con su descripcion de forma atomica.

**Request Body:**

```json
{
  "name": "Coca-Cola 2L",
  "description": "Gaseosa Coca-Cola 2 litros",
  "category_id": 10,
  "product_type": "PHYSICAL",
  "barcode": "7891234567890",
  "origin": "IMPORTADO",
  "brand": "Coca-Cola",
  "base_unit": "unit"
}
```

**Parametros:**

| Campo          | Tipo   | Requerido | Descripcion                                               |
| -------------- | ------ | --------- | --------------------------------------------------------- |
| `name`         | string | Si        | Nombre del producto                                       |
| `description`  | string | Si        | Descripcion del producto                                  |
| `category_id`  | number | Si        | ID de la categoria (debe ser > 0)                         |
| `product_type` | string | No        | `PHYSICAL`, `SERVICE` o `PRODUCTION`. Default: `PHYSICAL` |
| `barcode`      | string | No        | Codigo de barras                                          |
| `origin`       | string | No        | `NACIONAL` o `IMPORTADO`                                  |
| `brand`        | string | No        | Marca del producto                                        |
| `base_unit`    | string | No        | Unidad base: `kg`, `l`, `meter`, `unit`, etc.             |

> **Nota sobre IVA:** El IVA se determina automaticamente desde la categoria. Si necesitas sobrescribirlo, usa `PUT /products/{id}` con `override_tax_rate_id`.

**Response (201 Created):**

```json
{
  "id": "abc123def456",
  "name": "Coca-Cola 2L",
  "barcode": "7891234567890",
  "state": true,
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand": "Coca-Cola",
  "base_unit": "unit",
  "override_tax_rate_id": null,
  "target_margin_percent": null,
  "pricing_strategy": null,
  "created_at": "2026-02-24T15:30:00Z",
  "updated_at": "2026-02-24T15:30:00Z",
  "category": {
    "id": 10,
    "name": "Bebidas",
    "default_tax_rate_id": 1,
    "default_tax_rate": {
      "id": 1,
      "tax_name": "IVA 10%",
      "code": "IVA10",
      "rate": 10.0,
      "is_default": true,
      "is_active": true
    },
    "is_active": true
  },
  "applicable_tax_rate": {
    "id": 1,
    "tax_name": "IVA 10%",
    "code": "IVA10",
    "rate": 10.0,
    "is_default": true,
    "is_active": true
  },
  "description": "Gaseosa Coca-Cola 2 litros",
  "purchase_price": null,
  "stock_quantity": null,
  "stock_status": "out_of_stock",
  "has_valid_stock": false,
  "has_valid_price": false,
  "has_unit_pricing": false,
  "unit_prices": null
}
```

**Errores:**

| HTTP Status | Descripcion                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| 400         | Datos invalidos, nombre vacio, category_id invalido, product_type o origin no validos |
| 401         | Token JWT invalido o ausente                                                          |

---

### 2. Actualizar Producto

**`PUT /products/{id}`**

Actualiza los datos de un producto y su descripcion.

**Request Body:**

```json
{
  "name": "Coca-Cola 2L - Edicion Especial",
  "description": "Gaseosa Coca-Cola 2 litros edicion especial",
  "state": true,
  "category_id": 10,
  "product_type": "PHYSICAL",
  "origin": "NACIONAL",
  "brand": "Coca-Cola",
  "base_unit": "unit"
}
```

**Parametros adicionales al crear:**

| Campo   | Tipo    | Requerido | Descripcion                                       |
| ------- | ------- | --------- | ------------------------------------------------- |
| `state` | boolean | Si        | Estado del producto (true=activo, false=inactivo) |

> **Nota:** Para sobrescribir el IVA de la categoria, actualizar via base de datos o usar endpoints administrativos.

**Response (200 OK):** Retorna `ProductEnriched` con los datos actualizados.

**Errores:**

| HTTP Status | Descripcion                          |
| ----------- | ------------------------------------ |
| 400         | Datos invalidos o validacion fallida |
| 401         | No autorizado                        |

---

### 3. Eliminar Producto (borrado logico)

**`DELETE /products/{id}`**

Desactiva el producto (cambia `state` a `false`).

**Response (200 OK):**

```json
{
  "message": "Producto eliminado exitosamente"
}
```

**Errores:**

| HTTP Status | Descripcion                |
| ----------- | -------------------------- |
| 401         | No autorizado              |
| 500         | Error al eliminar producto |

---

### 4. Obtener Producto por ID

**`GET /products/{id}`**

Retorna un producto enriquecido con stock, precios, descripcion, categoria e IVA.

**Response (200 OK):** Retorna `ProductEnriched`.

```json
{
  "id": "abc123def456",
  "name": "Coca-Cola 2L",
  "barcode": "7891234567890",
  "state": true,
  "category": {
    "id": 10,
    "name": "Bebidas",
    "description": "Bebidas gaseosas y jugos",
    "default_tax_rate_id": 1,
    "default_tax_rate": {
      "id": 1,
      "tax_name": "IVA 10%",
      "code": "IVA10",
      "rate": 10.0,
      "country": "PY",
      "jurisdiction_type": "NATIONAL",
      "operation_type": "NACIONAL",
      "description": "Impuesto al Valor Agregado - Tasa General",
      "is_default": true,
      "is_active": true
    },
    "is_active": true,
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-03-18T14:30:00Z"
  },
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand": "Coca-Cola",
  "base_unit": "unit",
  "override_tax_rate_id": null,
  "target_margin_percent": null,
  "pricing_strategy": null,
  "applicable_tax_rate": {
    "id": 1,
    "tax_name": "IVA 10%",
    "code": "IVA10",
    "rate": 10.0,
    "country": "PY",
    "jurisdiction_type": "NATIONAL",
    "operation_type": "NACIONAL",
    "description": "Impuesto al Valor Agregado - Tasa General",
    "is_default": true,
    "is_active": true
  },
  "created_at": "2026-02-24T15:30:00Z",
  "updated_at": "2026-02-24T15:30:00Z",
  "purchase_price": 8500,
  "stock_quantity": 50,
  "stock_unit": "unit",
  "stock_branch_id": 1,
  "stock_status": "in_stock",
  "has_valid_stock": true,
  "has_valid_price": true,
  "has_unit_pricing": true,
  "unit_prices": [
    {
      "id": 1,
      "product_id": "abc123def456",
      "unit": "unit",
      "price_per_unit": 12000,
      "effective_date": "2026-02-24T15:30:00Z"
    }
  ],
  "description": "Gaseosa Coca-Cola 2 litros"
}
```

> **Nota:** El campo `applicable_tax_rate` es la tasa de IVA que aplica a este producto. Si el producto tiene `override_tax_rate_id`, esa tasa tiene prioridad. De lo contrario, se usa el `default_tax_rate` de la categoria.

**Errores:**

| HTTP Status | Descripcion            |
| ----------- | ---------------------- |
| 401         | No autorizado          |
| 404         | Producto no encontrado |
| 500         | Error interno          |

---

### 5. Obtener Producto por Codigo de Barras

**`GET /products/barcode/{barcode}`**

Retorna un producto enriquecido buscado por su codigo de barras.

**Response (200 OK):** Retorna `ProductEnriched`.

**Errores:**

| HTTP Status | Descripcion            |
| ----------- | ---------------------- |
| 401         | No autorizado          |
| 404         | Producto no encontrado |
| 500         | Error interno          |

---

### 6. Buscar Productos por Nombre

**`GET /products/search/{name}`**

Busqueda parcial case-insensitive por nombre. Retorna todos los productos que coincidan.

**Response (200 OK):** Retorna `ProductEnriched[]` (array vacio si no hay coincidencias).

**Errores:**

| HTTP Status | Descripcion   |
| ----------- | ------------- |
| 401         | No autorizado |
| 500         | Error interno |

---

### 7. Listar Productos con Paginacion

**`GET /products/list/{page}/{pageSize}`**

Lista paginada de productos activos enriquecidos, ordenados por nombre.

**Parametros de URL:**

| Campo      | Tipo   | Descripcion                |
| ---------- | ------ | -------------------------- |
| `page`     | number | Numero de pagina (desde 1) |
| `pageSize` | number | Cantidad por pagina        |

**Ejemplos:**

```
GET /products/list/1/10   # Primeros 10 productos
GET /products/list/2/20   # Segunda pagina, 20 por pagina
```

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion                         |
| ----------- | ----------------------------------- |
| 400         | Numero de pagina o tamanio invalido |
| 401         | No autorizado                       |
| 500         | Error interno                       |

---

### 8. Listar Todos los Productos

**`GET /products/all`**

Retorna todos los productos activos sin paginacion. Util para selectores y catalogos.

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion   |
| ----------- | ------------- |
| 401         | No autorizado |
| 500         | Error interno |

---

### 9. Listar Canchas (Service Courts)

**`GET /products/service-courts`**

Retorna productos de tipo `SERVICE` cuya categoria corresponda a canchas deportivas.

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion   |
| ----------- | ------------- |
| 401         | No autorizado |
| 500         | Error interno |

---

## Endpoints de Informacion de Producto

### 10. Obtener Informacion Completa por ID

**`GET /products/{id}/info`**

Retorna informacion completa: categoria, IVA, costos, precios, stock, auditoria y metadatos de operacion.

**Response (200 OK):** Retorna `ProductOperationInfoResponse`.

```json
{
  "product_id": "abc123def456",
  "product_name": "Coca-Cola 2L",
  "barcode": "7891234567890",
  "state": true,
  "category": {
    "id": 10,
    "name": "Bebidas"
  },
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand": "Coca-Cola",
  "base_unit": "unit",
  "created_at": "2026-02-24T15:30:00Z",
  "updated_at": "2026-02-24T15:30:00Z",
  "unit_prices": [
    {
      "id": 1,
      "product_id": "abc123def456",
      "unit": "unit",
      "price_per_unit": 12000,
      "effective_date": "2026-02-24T15:30:00Z"
    }
  ],
  "unit_costs_summary": [
    {
      "unit": "unit",
      "last_cost": 8500,
      "last_purchase_date": "2026-02-20T10:00:00Z",
      "weighted_avg_cost_6m": 8300,
      "total_purchases": 5,
      "cost_variance_percent": 2.4
    }
  ],
  "stock_quantity": 50,
  "description": "Gaseosa Coca-Cola 2 litros",
  "tax": {
    "classification_code": "GENERAL",
    "resolution_source": "TAX_CLASSIFICATION",
    "rate": {
      "id": 1,
      "tax_name": "IVA 10%",
      "code": "IVA10",
      "rate": 10
    }
  },
  "financial_health": {
    "has_prices": true,
    "has_costs": true,
    "has_stock": true,
    "price_count": 1,
    "cost_units_count": 1,
    "last_updated": "2026-02-24T15:30:00Z"
  },
  "stock_status": "in_stock",
  "has_valid_stock": true,
  "has_valid_prices": true,
  "has_valid_costs": true,
  "best_margin_unit": "unit",
  "best_margin_percent": 29.17
}
```

**Errores:**

| HTTP Status | Descripcion            |
| ----------- | ---------------------- |
| 401         | No autorizado          |
| 404         | Producto no encontrado |
| 500         | Error interno          |

---

### 11. Obtener Informacion Completa por Codigo de Barras

**`GET /products/info/barcode/{barcode}`**

Retorna informacion completa usando el codigo de barras.

**Response (200 OK):** Retorna `ProductOperationInfoResponse`.

**Errores:**

| HTTP Status | Descripcion            |
| ----------- | ---------------------- |
| 401         | No autorizado          |
| 404         | Producto no encontrado |
| 500         | Error interno          |

---

### 12. Buscar Productos por Nombre

**`GET /products/info/search/{name}?limit=50`**

Busca productos con informacion completa por nombre.

**Parametros:**

| Campo   | Tipo   | Ubicacion | Descripcion                        |
| ------- | ------ | --------- | ---------------------------------- |
| `name`  | string | path      | Texto de busqueda                  |
| `limit` | number | query     | Limite de resultados (default: 50) |

**Response (200 OK):** Retorna `ProductOperationInfoResponse[]`.

**Errores:**

| HTTP Status | Descripcion   |
| ----------- | ------------- |
| 401         | No autorizado |
| 500         | Error interno |

---

## Endpoints de Pricing

### 13. Obtener Productos por Categoria

**`GET /products/by-category?categories=1,2,3`**

Retorna productos con precios filtrados por categorias.

**Parametros:**

| Campo        | Tipo   | Ubicacion | Descripcion                          |
| ------------ | ------ | --------- | ------------------------------------ |
| `categories` | string | query     | IDs de categorias separados por coma |

**Response (200 OK):**

```json
{
  "data": [...],
    "count": 15
  }
```

### 14. Obtener Producto para Venta

**`GET /products/{id}/sale`**

Retorna el producto completo optimizado para la carga del flujo de venta.

### 15. Obtener Producto para Compra

**`GET /products/{id}/purchase`**

Retorna el producto completo optimizado para la carga del flujo de compra.

---

### 14. Obtener Unidades de un Producto

**`GET /products/{id}/units`**

Retorna las unidades de medida con precios asignados.

**Response (200 OK):**

```json
{
  "data": ["unit", "kg", "dozen"]
}
```

---

### 15. Crear Precio por Unidad

**`POST /products/{id}/units`**

Asigna un precio de venta a una unidad de medida.

**Request Body:**

```json
{
  "unit": "kg",
  "price_per_unit": 15000
}
```

**Response (200 OK):**

```json
{
  "message": "Unit price created successfully",
  "data": {
    "id": 0,
    "product_id": "abc123",
    "unit": "kg",
    "price_per_unit": 15000,
    "effective_date": "2026-02-24T15:30:00Z"
  }
}
```

---

### 16. Obtener Informacion Financiera del Producto

**`GET /products/{id}/financial`**

Retorna datos financieros completos del producto: costos, márgenes, rentabilidad, histórico de compras.

---

### 17. Obtener Informacion Financiera por Codigo de Barras

**`GET /products/financial/barcode/{barcode}`**

Equivalente a `GET /products/{id}/financial` pero usando código de barras.

---

### 18. Buscar Productos Financieros por Nombre

**`GET /products/financial/search/{name}`**

Busca productos con su información financiera completa.

---

### 19. Obtener Alertas de Margen

**`GET /products/{id}/margin-alert`**

Retorna alertas sobre márgenes del producto (margen bajo, negativo, etc.).

---

### 20. Reporte de Margen

**`GET /products/{id}/margin-report`**

Reporte detallado de márgenes del producto (histórico, tendencia, comparativa).

---

### 21. Comparativa de Proveedores

**`GET /products/{id}/supplier-comparison`**

Comparativa de costos entre proveedores para el producto.

---

### 22. Costo Promedio Ponderado

**`GET /products/{id}/weighted-average`**

Retorna el costo promedio ponderado calculado del producto.

---

## Validaciones

| Campo          | Regla                                        |
| -------------- | -------------------------------------------- |
| `name`         | Requerido, no puede estar vacio              |
| `category_id`  | Requerido, debe ser > 0                      |
| `product_type` | `PHYSICAL`, `SERVICE` o `PRODUCTION`         |
| `origin`       | `NACIONAL` o `IMPORTADO` (si se proporciona) |

---

## Guia de Migracion desde v2.x

| Antes (v2.x)                            | Ahora (v3.2)                                  |
| --------------------------------------- | --------------------------------------------- |
| `"id_category": 10`                     | `"category_id": 10`                           |
| `"price_formatted": "PYG 12,000"`       | Campo eliminado                               |
| `GET /products/name/{name}`             | `GET /products/search/{name}`                 |
| `GET /products/{id}/details`            | `GET /products/{id}`                          |
| `GET /products/{id}/with-description`   | `GET /products/{id}`                          |
| `PUT /products/delete/{id}`             | `DELETE /products/{id}`                       |
| `GET /products/enriched/all`            | `GET /products/all`                           |
| `GET /products/enriched/service-courts` | `GET /products/service-courts`                |
| `POST/GET/PUT /product_description/*`   | Eliminado (descripcion integrada en producto) |

---

## Codigos de Error Comunes

| HTTP Status | Descripcion                          | Solucion                                       |
| ----------- | ------------------------------------ | ---------------------------------------------- |
| 400         | Datos invalidos o validacion fallida | Verificar el body y los campos requeridos      |
| 401         | Token JWT invalido o ausente         | Verificar que se envia el header Authorization |
| 403         | `branch_id` fuera de `allowed_branches` | Verificar contexto de sucursal               |
| 404         | Producto no encontrado               | Verificar el ID o codigo de barras             |
| 409         | Conflicto de estado                  | Reintentar o validar transicion                |
| 500         | Error interno del servidor           | Reportar al equipo de backend                  |

---

_Última actualización: 2026-05-07 — v3.3.0: Stock ahora filtra por sucursal en todos los endpoints. Nuevo campo `stock_branch_id` en ProductEnriched. Nuevo campo `branch_id` en respuestas de Stock. Endpoints de stock documentados con branch context._
