# API de Productos

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 3.8.0
**Fecha:** 2 de Julio de 2026
**Endpoint Base:** `http://localhost:5050`

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Historial de Cambios

### v3.8.0 - 2 de Julio de 2026
- **NUEVO**: Campos `has_variant` (boolean) y `variant_count` (integer) en todas las respuestas de búsqueda de productos.
- **NUEVO**: Los endpoints `GET /products/{id}/purchase` y `GET /products/{id}/sale` ahora incluyen `has_variant`, `variant_count` y el array `variants[]` con las variantes activas del producto.
- **NUEVO**: La vista materializada `mv_product_catalog` ahora incluye `has_variant` y `variant_count` para detección inmediata de variantes en búsquedas.
- **MEJORA**: El frontend ya no necesita hacer una segunda llamada a `GET /products/{id}/variants` para determinar si un producto tiene variantes. La información está disponible directamente en los resultados de búsqueda.

### v3.7.0 - 16 de Junio de 2026
- **NUEVO**: HTTP caching con ETags en todos los endpoints GET de productos. El servidor retorna `ETag` y `Cache-Control: private, max-age=60`. Si el frontend envía `If-None-Match` con el ETag anterior y el contenido no cambió, el servidor responde `304 Not Modified` sin body.
- **NUEVO**: Caché Redis L1 para productos individuales, listados paginados, búsqueda y facetas (TTL 5-15 min).
- **NUEVO**: Refresco asíncrono de la materialized view `mv_product_catalog` via `pg_notify` con debounce de 2s (reemplaza triggers síncronos).
- **NUEVO**: Batch loading de atributos y tags (elimina N+1: de 2N+1 queries a 3 por listado).
- **CORRECCION**: `stock_updated_at` ahora refleja el timestamp real de la última actualización de stock (antes usaba `NOW()` en cada query).

### v3.6.0 - 16 de Junio de 2026
- **NUEVO**: Campos `is_variable_measure` (boolean) y `scale_code` (string | null) en `ProductEnriched` y request bodies de crear/actualizar.
- **NUEVO**: Soporte para productos de medida variable (peso, volumen, área, longitud).
- **NUEVO**: `scale_code` para integración con balanzas EAN-13 (código corto único entre productos de medida variable activos).

### v3.6.0 - 16 de Junio de 2026
- **BREAKING**: El campo `brand` (string) fue eliminado. Usar `brand_id` (number) en `POST /products` y `PUT /products/{id}`.
- **BREAKING**: `ProductEnriched` y `ProductFinancialEnriched` ahora retornan `brand_id`, `brand_name` y `brand_slug` en lugar de `brand`.
- **NUEVO**: Endpoints de búsqueda avanzada `POST /products/search/advanced` y `GET /products/search/facets`.

### v3.5.0 - 5 de Junio de 2026
- **BREAKING**: `base_unit` ahora es **obligatorio** en `POST /products`. El sistema rechaza requests sin este campo.
- **BREAKING**: `base_unit` es **inmutable** después de la creación. `PUT /products/{id}` rechaza cambios a este campo.
- **NUEVO**: `GET /products/{id}/info`, `GET /products/info/barcode/{barcode}`, `GET /products/info/search/{name}` ahora incluyen `base_unit` en la respuesta.

> **Ver guía de flujos:** [PRODUCT_UNIT_FLOWS_GUIDE.md](./PRODUCT_UNIT_FLOWS_GUIDE.md) para todos los flujos operativos de productos con unidades de medida.
>
> **Ver guía end-to-end:** [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) para el flujo completo de registro de productos por kg, asignación de código de balanza, pesaje y escaneo en POS.

### v3.3.0 - 11 de Mayo de 2026
- **CORRECCION**: Agregados campos faltantes en `ProductEnriched`: `stock_id`, `stock_branch_id`, `stock_updated_at`, `tax_classification`.
- **CORRECCION**: `target_margin_percent` es `string | null` (no `number | null`).
- **CORRECCION**: Estructura `Category` no incluye `description` ni `parent_id`.
- **CORRECCION**: Endpoint `GET /products/{id}/units` retorna objetos `UnitPrice`, no strings.
- **CORRECCION**: Endpoint `GET /products/by-category` retorna `{count, data}` con `ProductEnriched[]`.
- **CORRECCION**: Numeración de endpoints corregida (sin duplicados).
- **NUEVO**: Documentación de endpoints Financial: `GET /products/{id}/financial`, `GET /products/financial/barcode/{barcode}`, `GET /products/financial/search/{name}`.
- **NUEVO**: Estructura `TaxClassification` documentada.

### v3.2.0 - 22 de Marzo de 2026
- **NUEVO**: `GET /products/{id}/info` como endpoint legible y completo.
- **NUEVO**: `GET /products/info/barcode/{barcode}` y `GET /products/info/search/{name}`.
- **NUEVO**: `GET /products/{id}/sale` y `GET /products/{id}/purchase` para flujos operativos.
- **CAMBIO**: `info` pasa a ser el endpoint principal de detalle completo.

### v3.1.0 - 18 de Marzo de 2026
- **NUEVO**: Campo `category` expandido con `default_tax_rate_id` y `default_tax_rate`.
- **NUEVO**: Campo `applicable_tax_rate` con la tasa de IVA que aplica al producto.
- **NUEVO**: Campos de pricing: `override_tax_rate_id`, `target_margin_percent`, `pricing_strategy`.
- **CAMBIO**: La lógica de `applicable_tax_rate` es: override del producto > tax classification > default de categoría > sistema.

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

## Descripción General

Los productos incluyen información completa de IVA (Impuesto al Valor Agregado) según la Ley 6380/2019 de Paraguay. La tasa de IVA aplicable se determina por jerarquía:

1. **Transaction Override** (`order_details.tax_rate_id`) - Tasa explícita en la línea
2. **Product Override** (`products.override_tax_rate_id`) - Tasa específica del producto
3. **Tax Classification** (`product_tax_classifications`) - Clasificación SIFEN (CANASTA, GENERAL, EXENTO, etc.)
4. **Category Default** (`categories.default_tax_rate_id`) - Tasa de la categoría
5. **System Default** (`tax_rates.is_default = true`) - Fallback (IVA10)

### Códigos de IVA Soportados

| Código | Descripción | Tasa |
|--------|-------------|------|
| `IVA10` | IVA General | 10% |
| `IVA5` | IVA Canasta Básica | 5% |
| `EXENTO` | Exento de IVA | 0% |
| `ISC` | Impuesto Selectivo al Consumo | Variable |
| `IVA_DIGITAL` | IVA para servicios digitales | 10% |
| `IMPORT` | Impuesto de importación | Variable |

---

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Contexto de Sucursal
- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

---

## Estructuras de Datos

### ProductEnriched

Respuesta estandar para todos los endpoints de productos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico del producto |
| `name` | string | Nombre del producto |
| `barcode` | string \| null | Codigo de barras |
| `state` | boolean | Estado (activo/inactivo) |
| `category` | object \| null | Ver estructura Category mas abajo |
| `product_type` | string | `PHYSICAL` \| `SERVICE` \| `PRODUCTION` |
| `origin` | string \| null | `NACIONAL` \| `IMPORTADO` |
| `brand_id` | number \| null | ID de la marca (`products.brands`) |
| `brand_name` | string \| null | Nombre de la marca (JOIN) |
| `brand_slug` | string \| null | Slug de la marca (JOIN) |
| `base_unit` | string \| null | Unidad base: `kg`, `meter`, `l`, `unit`, etc. |
| `is_variable_measure` | boolean | TRUE si el producto se vende por medida variable (peso, volumen, área, longitud). FALSE para productos contables por unidad. |
| `scale_code` | string \| null | Código corto de balanza para barcode EAN-13 (1-5 dígitos). Único entre productos de medida variable activos. |
| `override_tax_rate_id` | number \| null | ID de tasa de IVA especifica (anula la de categoria) |
| `target_margin_percent` | string \| null | Porcentaje de margen objetivo (ej: "30") |
| `pricing_strategy` | string \| null | `MANUAL` \| `AUTOMATIC` |
| `applicable_tax_rate` | object \| null | Ver estructura TaxRate. Tasa de IVA que aplica al producto |
| `tax_classification` | object \| null | Ver estructura TaxClassification. Clasificación SIFEN del producto |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de ultima actualizacion (ISO 8601) |
| `purchase_price` | number | Precio de compra mas reciente (default 0) |
| `stock_quantity` | number \| null | Cantidad en stock |
| `stock_id` | number \| null | ID del registro de stock |
| `stock_unit` | string \| null | Unidad del stock (ej: `kg`, `l`) |
| `stock_branch_id` | number \| null | ID de la sucursal del stock |
| `stock_updated_at` | string \| null | Fecha de actualizacion del stock (ISO 8601) |
| `stock_status` | string | `in_stock`, `low_stock`, `medium_stock`, `out_of_stock` |
| `has_valid_stock` | boolean | Si tiene stock registrado |
| `has_valid_price` | boolean | Si tiene al menos un precio |
| `has_unit_pricing` | boolean | Si tiene precios por unidad |
| `unit_prices` | array | Lista de precios por unidad |
| `description` | string \| null | Descripcion del producto |
| `has_variant` | boolean | TRUE si el producto tiene al menos una variante activa |
| `variant_count` | number | Cantidad de variantes activas del producto |

### Category

Estructura de categoria en productos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID unico de la categoria |
| `name` | string | Nombre de la categoria |
| `default_tax_rate_id` | number \| null | ID de la tasa de IVA por defecto |
| `default_tax_rate` | object \| null | Ver estructura TaxRate |
| `is_active` | boolean | Estado de la categoria |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de actualizacion (ISO 8601) |

### TaxRate

Estructura de tasa de impuesto.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID unico de la tasa |
| `tax_name` | string | Nombre del impuesto (ej: "IVA PY") |
| `code` | string | Codigo: `IVA10`, `IVA5`, `EXENTO`, `ISC`, `IVA_DIGITAL`, `IMPORT` |
| `rate` | number | Porcentaje de la tasa (ej: 10.0, 5.0, 0) |
| `country` | string | Pais |
| `jurisdiction_type` | string | Tipo de jurisdiccion |
| `operation_type` | string | Tipo de operacion |
| `description` | string \| null | Descripcion detallada |
| `is_default` | boolean | Si es la tasa por defecto del sistema |
| `is_active` | boolean | Si la tasa esta activa |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de actualizacion (ISO 8601) |

### TaxClassification

Clasificación fiscal SIFEN del producto.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID unico de la clasificación |
| `product_id` | string | ID del producto |
| `classification_code` | string | `CANASTA`, `GENERAL`, `EXENTO`, `IMPORT`, `DIGITAL`, `TURISMO`, `SELECTIVE` |
| `default_tax_rate_id` | number | ID de la tasa de IVA asociada |
| `default_tax_rate` | object \| null | Ver estructura TaxRate |
| `effective_from` | string | Fecha de vigencia desde (ISO 8601) |
| `effective_to` | string \| null | Fecha de vigencia hasta (ISO 8601), null = vigente |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de actualizacion (ISO 8601) |

### ProductFinancialEnriched

Estructura completa para endpoints de info, financial, sale y purchase.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `product_id` | string | ID unico del producto |
| `product_name` | string | Nombre del producto |
| `barcode` | string \| null | Codigo de barras |
| `state` | boolean | Estado (activo/inactivo) |
| `category_id` | number | ID de la categoria |
| `category_name` | string \| null | Nombre de la categoria |
| `category` | object \| null | Ver estructura Category |
| `product_type` | string | `PHYSICAL` \| `SERVICE` \| `PRODUCTION` |
| `origin` | string \| null | `NACIONAL` \| `IMPORTADO` |
| `brand_id` | number \| null | ID de la marca (`products.brands`) |
| `brand_name` | string \| null | Nombre de la marca (JOIN) |
| `brand_slug` | string \| null | Slug de la marca (JOIN) |
| `base_unit` | string \| null | Unidad base |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de ultima actualizacion (ISO 8601) |
| `unit_prices` | array | Precios de venta por unidad |
| `unit_costs_summary` | array | Resumen de costos por unidad |
| `stock_quantity` | number \| null | Cantidad en stock |
| `stock_updated_at` | string \| null | Fecha de actualizacion del stock |
| `description` | string \| null | Descripcion del producto |
| `financial_health` | object | `{has_prices, has_costs, has_stock, price_count, cost_units_count, last_updated}` |
| `stock_status` | string | Estado del stock |
| `has_valid_stock` | boolean | Si tiene stock |
| `has_valid_prices` | boolean | Si tiene precios |
| `has_valid_costs` | boolean | Si tiene costos |
| `best_margin_unit` | string \| null | Unidad con mejor margen |
| `best_margin_percent` | number \| null | Porcentaje del mejor margen |

### ProductOperationInfoResponse

Extiende `ProductFinancialEnriched` con datos de operación (sale/purchase).

Campos adicionales a `ProductFinancialEnriched`:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `tax` | object | `{classification_code, resolution_source, rate: TaxRate}` |
| `context` | object | `{operation: "sale" \| "purchase"}` |
| `operation_hints` | object | Pistas para frontend según contexto |

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
  "brand_id": 13,
  "base_unit": "unit",
  "is_variable_measure": false,
  "scale_code": null
}
```

**Parametros:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `name` | string | Si | Nombre del producto |
| `description` | string | Si | Descripcion del producto |
| `category_id` | number | Si | ID de la categoria (debe ser > 0) |
| `product_type` | string | No | `PHYSICAL`, `SERVICE` o `PRODUCTION`. Default: `PHYSICAL` |
| `barcode` | string | No | Codigo de barras |
| `origin` | string | No | `NACIONAL` o `IMPORTADO` |
| `brand_id` | number | No | ID de la marca (`products.brands`) |
| `base_unit` | string | Si | Unidad base: `kg`, `l`, `meter`, `unit`, etc. **Obligatorio.** |
| `is_variable_measure` | boolean | No | TRUE para productos de medida variable. Default: `false` |
| `scale_code` | string | No | Código corto de balanza (1-5 dígitos). Solo para productos con `is_variable_measure=true` |

> **Nota sobre IVA:** El IVA se determina automaticamente desde la tax classification o la categoria. Si necesitas sobrescribirlo, usa `PUT /products/{id}` con `override_tax_rate_id`.

**Response (201 Created):** Retorna `ProductEnriched`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 400 | Datos invalidos, nombre vacio, category_id invalido, product_type o origin no validos |
| 401 | Token JWT invalido o ausente |

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
  "brand_id": 13,
  "base_unit": "unit",
  "is_variable_measure": false,
  "scale_code": null
}
```

**Parametros adicionales al crear:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `state` | boolean | Si | Estado del producto (true=activo, false=inactivo) |
| `is_variable_measure` | boolean | No | TRUE para productos de medida variable. Default: `false` |
| `scale_code` | string | No | Código corto de balanza (1-5 dígitos). Solo para productos con `is_variable_measure=true` |

> **Nota:** Para sobrescribir el IVA de la categoria, actualizar via base de datos o usar endpoints administrativos.
>
> **Nota sobre `base_unit`:** El campo `base_unit` es **inmutable** después de la creación. Si se envía un valor diferente al existente, el sistema retorna error 400: `"base_unit cannot be changed after product creation"`.

**Response (200 OK):** Retorna `ProductEnriched` con los datos actualizados.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 400 | Datos invalidos o validacion fallida |
| 401 | No autorizado |

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

> **Nota:** Retorna 200 incluso si el producto no existe (borrado logico idempotente).

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |

---

### 4. Obtener Producto por ID

**`GET /products/{id}`**

Retorna un producto enriquecido con stock, precios, descripcion, categoria e IVA.

**Response (200 OK):** Retorna `ProductEnriched`.

```json
{
  "id": "A-7oarkDR",
  "name": "Coca Cola 500ml",
  "barcode": null,
  "state": true,
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand_id": 13,
  "brand_name": "Coca Cola",
  "brand_slug": "coca-cola",
  "target_margin_percent": "30",
  "pricing_strategy": "MANUAL",
  "created_at": "2025-12-28T10:34:07.877247Z",
  "updated_at": "2025-12-28T10:34:07.877247Z",
  "category": {
    "id": 7,
    "name": "Bebidas",
    "is_active": true,
    "created_at": "2026-03-16T16:01:23.691181-03:00",
    "updated_at": "2026-03-16T16:01:23.691181-03:00"
  },
  "stock_quantity": 7,
  "stock_id": 6,
  "stock_branch_id": 1,
  "stock_updated_at": "2026-02-08T18:26:58.330108Z",
  "purchase_price": 10000,
  "unit_prices": [
    {
      "id": 7,
      "product_id": "A-7oarkDR",
      "unit": "unit",
      "price_per_unit": 10000,
      "updated_at": "2025-11-14T15:04:36.97626Z"
    }
  ],
  "has_unit_pricing": true,
  "description": "Gaseosa Coca Cola",
  "tax_classification": {
    "id": 12,
    "product_id": "A-7oarkDR",
    "classification_code": "GENERAL",
    "default_tax_rate_id": 1,
    "default_tax_rate": {
      "id": 1,
      "tax_name": "IVA PY",
      "code": "IVA10",
      "rate": 10,
      "country": "",
      "jurisdiction_type": "",
      "operation_type": "",
      "description": "IVA General Paraguay 10%",
      "is_default": true,
      "is_active": true,
      "created_at": "0001-01-01T00:00:00Z",
      "updated_at": "0001-01-01T00:00:00Z"
    },
    "effective_from": "2026-04-21T19:38:27.176971-03:00",
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z"
  },
  "applicable_tax_rate": {
    "id": 1,
    "tax_name": "IVA PY",
    "code": "IVA10",
    "rate": 10,
    "country": "",
    "jurisdiction_type": "",
    "operation_type": "",
    "description": "IVA General Paraguay 10%",
    "is_default": true,
    "is_active": true,
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z"
  },
  "stock_status": "medium_stock",
  "has_valid_stock": true,
  "has_valid_price": true
}
```

> **Nota:** El campo `applicable_tax_rate` es la tasa de IVA que aplica a este producto resuelta por jerarquía (ver sección de Descripción General).

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 5. Obtener Producto por Codigo de Barras

**`GET /products/barcode/{barcode}`**

Retorna un producto enriquecido buscado por su codigo de barras.

**Response (200 OK):** Retorna `ProductEnriched`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 6. Buscar Productos por Nombre

**`GET /products/search/{name}`**

Busqueda parcial case-insensitive por nombre. Retorna todos los productos que coincidan (activos e inactivos).

**Response (200 OK):** Retorna `ProductEnriched[]` (array vacio si no hay coincidencias).

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

### 6.1. Búsqueda Avanzada

**`POST /products/search/advanced`**

Búsqueda con filtros combinados: nombre/barcode, categoría (incluye subcategorías), marcas, tags, atributos dinámicos, rango de precios y stock.

**Request Body:**
```json
{
    "search": "camisa",
    "category_id": 5,
    "brand_ids": [1, 3, 7],
    "tag_slugs": ["oferta", "nuevo"],
    "attributes": {
        "color": ["rojo", "azul"],
        "talla": ["M", "L"]
    },
    "in_stock_only": true,
    "price_min": "50000",
    "price_max": "200000",
    "sort_by": "price_asc",
    "page": 1,
    "page_size": 20,
    "branch_id": 1
}
```

**Response (200 OK):**
```json
{
    "data": [ /* ProductEnriched[] */ ],
    "total": 42,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
}
```

### 6.2. Facetas de Búsqueda

**`GET /products/search/facets?category_id=5&branch_id=1`**

Retorna facetas para construir la UI de filtros: marcas, categorías, atributos filtrables y rango de precios.

**Response (200 OK):**
```json
{
    "facets": [
        {
            "code": "brand",
            "name": "Marca",
            "type": "list",
            "options": [
                {"value": "1", "label": "Nike", "count": 45}
            ]
        },
        {
            "code": "color",
            "name": "Color",
            "type": "list",
            "options": [
                {"value": "rojo", "label": "Rojo", "count": 23}
            ]
        },
        {
            "code": "price",
            "name": "Precio",
            "type": "range",
            "options": [
                {"value": "min", "label": "50000"},
                {"value": "max", "label": "500000"}
            ]
        }
    ]
}
```

---

### 7. Listar Productos con Paginacion

**`GET /products/list/{page}/{pageSize}`**

Lista paginada de productos activos enriquecidos, ordenados por nombre.

**Parametros de URL:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Numero de pagina (desde 1) |
| `pageSize` | number | Cantidad por pagina |

**Ejemplos:**
```
GET /products/list/1/10   # Primeros 10 productos
GET /products/list/2/20   # Segunda pagina, 20 por pagina
```

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 400 | Numero de pagina o tamanio invalido |
| 401 | No autorizado |
| 500 | Error interno |

---

### 8. Listar Todos los Productos

**`GET /products/all`**

Retorna todos los productos activos sin paginacion. Util para selectores y catalogos.

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

---

### 9. Listar Canchas (Service Courts)

**`GET /products/service-courts`**

Retorna productos de tipo `SERVICE` cuya categoria corresponda a canchas deportivas.

**Response (200 OK):** Retorna `ProductEnriched[]`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

---

## Endpoints de Informacion de Producto

### 10. Obtener Informacion Completa por ID

**`GET /products/{id}/info`**

Retorna informacion completa: categoria, IVA, costos, precios, stock, auditoria y metadatos.

**Response (200 OK):** Retorna `ProductFinancialEnriched`.

```json
{
  "product_id": "A-7oarkDR",
  "product_name": "Coca Cola 500ml",
  "state": true,
  "category_id": 7,
  "category_name": "Bebidas",
  "category": {
    "id": 7,
    "name": "Bebidas",
    "is_active": false,
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z"
  },
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand_id": 13,
  "brand_name": "Coca Cola",
  "brand_slug": "coca-cola",
  "created_at": "2025-12-28T10:34:07.877247Z",
  "updated_at": "2025-12-28T10:34:07.877247Z",
  "unit_prices": [
    {
      "id": 7,
      "product_id": "",
      "unit": "unit",
      "price_per_unit": 10000,
      "updated_at": "2025-11-14T15:04:36.97626Z"
    }
  ],
  "unit_costs_summary": [
    {
      "unit": "unit",
      "last_cost": 7000,
      "last_purchase_date": "2025-11-14T15:04:36.97626Z",
      "weighted_avg_cost_6m": 7000,
      "total_purchases": 1,
      "cost_variance_percent": 0
    }
  ],
  "stock_quantity": 7,
  "stock_updated_at": "2026-02-08T18:26:58.330108Z",
  "description": "Gaseosa Coca Cola",
  "financial_health": {
    "has_prices": true,
    "has_costs": true,
    "has_stock": true,
    "price_count": 1,
    "cost_units_count": 1,
    "last_updated": "2026-02-08T18:26:58Z"
  },
  "stock_status": "medium_stock",
  "has_valid_stock": true,
  "has_valid_prices": true,
  "has_valid_costs": true,
  "best_margin_unit": "unit",
  "best_margin_percent": 30
}
```

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 11. Obtener Informacion Completa por Codigo de Barras

**`GET /products/info/barcode/{barcode}`**

Retorna informacion completa usando el codigo de barras.

**Response (200 OK):** Retorna `ProductFinancialEnriched`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 12. Buscar Informacion por Nombre

**`GET /products/info/search/{name}?limit=50`**

Busca productos con informacion completa por nombre.

**Parametros:**

| Campo | Tipo | Ubicacion | Descripcion |
|-------|------|-----------|-------------|
| `name` | string | path | Texto de busqueda |
| `limit` | number | query | Limite de resultados (default: 50) |

**Response (200 OK):** Retorna `ProductFinancialEnriched[]`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

---

## Endpoints Financial

### 13. Obtener Financial por ID

**`GET /products/{id}/financial`**

Retorna informacion financiera completa de un producto por ID. Mismo formato que `/info`.

**Response (200 OK):** Retorna `ProductFinancialEnriched`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 14. Obtener Financial por Codigo de Barras

**`GET /products/financial/barcode/{barcode}`**

Retorna informacion financiera completa usando el codigo de barras.

**Response (200 OK):** Retorna `ProductFinancialEnriched`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 15. Buscar Financial por Nombre

**`GET /products/financial/search/{name}?limit=50`**

Busca productos con informacion financiera por nombre.

**Parametros:**

| Campo | Tipo | Ubicacion | Descripcion |
|-------|------|-----------|-------------|
| `name` | string | path | Texto de busqueda |
| `limit` | number | query | Limite de resultados (default: 50) |

**Response (200 OK):** Retorna `ProductFinancialEnriched[]`.

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

---

## Endpoints de Flujo Operativo

### 16. Obtener Producto para Venta

**`GET /products/{id}/sale`**

Retorna el producto completo optimizado para el flujo de venta. Incluye `tax`, `context` y `operation_hints`.

**Response (200 OK):** Retorna `ProductOperationInfoResponse`.

```json
{
  "product_id": "A-7oarkDR",
  "product_name": "Coca Cola 500ml",
  "description": "Gaseosa Coca Cola",
  "state": true,
  "product_type": "PHYSICAL",
  "origin": "IMPORTADO",
  "brand_id": 13,
  "brand_name": "Coca Cola",
  "brand_slug": "coca-cola",
  "category": {
    "id": 7,
    "name": "Bebidas",
    "is_active": false,
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z"
  },
  "tax": {
    "classification_code": "GENERAL",
    "resolution_source": "TAX_CLASSIFICATION",
    "rate": {
      "id": 1,
      "tax_name": "IVA PY",
      "code": "IVA10",
      "rate": 10
    }
  },
  "unit_prices": [...],
  "unit_costs_summary": [...],
  "stock_quantity": 7,
  "financial_health": {...},
  "context": {
    "operation": "sale"
  },
  "operation_hints": {
    "allow_line_tax_override": true,
    "default_price_includes_tax": true,
    "uses_sale_price": true
  }
}
```

---

### 17. Obtener Producto para Compra

**`GET /products/{id}/purchase`**

Retorna el producto completo optimizado para el flujo de compra. Incluye `tax`, `context` y `operation_hints`.

**Response (200 OK):** Retorna `ProductOperationInfoResponse`.

```json
{
  "context": {
    "operation": "purchase"
  },
  "operation_hints": {
    "auto_update_prices_supported": true,
    "default_price_includes_tax": true,
    "uses_purchase_cost": true
  }
}
```

---

## Endpoints de Pricing y Unidades

### 18. Obtener Productos por Categoria

**`GET /products/by-category?categories=1,2,3`**

Retorna productos filtrados por categorias.

**Parametros:**

| Campo | Tipo | Ubicacion | Descripcion |
|-------|------|-----------|-------------|
| `categories` | string | query | IDs de categorias separados por coma |

**Response (200 OK):**
```json
{
  "count": 15,
  "data": [...ProductEnriched...]
}
```

---

### 19. Obtener Unidades de un Producto

**`GET /products/{id}/units`**

Retorna las unidades de medida con precios asignados.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 7,
      "product_id": "A-7oarkDR",
      "unit": "unit",
      "price_per_unit": 10000,
      "updated_at": "2025-11-14T15:04:36.97626Z"
    }
  ]
}
```

---

### 20. Crear Precio por Unidad

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
      "updated_at": "2026-02-24T15:30:00Z"
    }
  }
}
```

---

## Validaciones

| Campo | Regla |
|-------|-------|
| `name` | Requerido, no puede estar vacio |
| `category_id` | Requerido, debe ser > 0 |
| `product_type` | `PHYSICAL`, `SERVICE` o `PRODUCTION` |
| `origin` | `NACIONAL` o `IMPORTADO` (si se proporciona) |

---

## HTTP Caching con ETags

Todos los endpoints GET de productos retornan headers de caché, **excepto `/products/all`** (excluido porque retorna payloads grandes sin paginación):

```http
ETag: "ce9c619fb85c70cc"
Cache-Control: private, max-age=60
```

### Cómo usar ETags en el frontend

**Primer request** — el servidor retorna `200` con el body y el header `ETag`:

```js
const response = await fetch('/products/FbIEjozDg', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const product = await response.json();
const etag = response.headers.get('ETag'); // Guardar este valor
```

**Segundo request** — enviar `If-None-Match` con el ETag guardado:

```js
const response = await fetch('/products/FbIEjozDg', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'If-None-Match': etag  // ETag del request anterior
  }
});

if (response.status === 304) {
  // El contenido no cambió, usar el cache local
  return cachedProduct;
} else {
  // El contenido cambió, actualizar cache
  const product = await response.json();
  const newEtag = response.headers.get('ETag');
  return product;
}
```

### Comportamiento por método HTTP

| Método | ETag | Descripción |
|--------|------|-------------|
| `GET` | ✅ | Retorna `ETag` header. Soporta `If-None-Match` → `304`. **Excepción:** `GET /products/all` no retorna ETag |
| `POST` | ❌ | No usa ETag |
| `PUT` | ❌ | No usa ETag (pero invalida el caché del producto) |
| `DELETE` | ❌ | No usa ETag (pero invalida el caché del producto) |

### Cuándo invalidar el cache local

El frontend debe descartar su cache local cuando:
- Recibe un `200` en vez de `304` (el contenido cambió)
- El usuario crea, actualiza o elimina un producto
- El usuario modifica stock, precios, atributos o tags de un producto

---

## Guia de Migracion desde v2.x

| Antes (v2.x) | Ahora (v3.3) |
|---------------|--------------|
| `"id_category": 10` | `"category_id": 10` |
| `"price_formatted": "PYG 12,000"` | Campo eliminado |
| `GET /products/name/{name}` | `GET /products/search/{name}` |
| `GET /products/{id}/details` | `GET /products/{id}` |
| `GET /products/{id}/with-description` | `GET /products/{id}` |
| `PUT /products/delete/{id}` | `DELETE /products/{id}` |
| `GET /products/enriched/all` | `GET /products/all` |
| `GET /products/enriched/service-courts` | `GET /products/service-courts` |
| `POST/GET/PUT /product_description/*` | Eliminado (descripcion integrada en producto) |

---

## Codigos de Error Comunes

| HTTP Status | Descripcion | Solucion |
|-------------|-------------|----------|
| 400 | Datos invalidos o validacion fallida | Verificar el body y los campos requeridos |
| 401 | Token JWT invalido o ausente | Verificar que se envia el header Authorization |
| 404 | Producto no encontrado | Verificar el ID o codigo de barras |
| 500 | Error interno del servidor | Reportar al equipo de backend |
