# API de Productos

**Version:** 3.1.0
**Fecha:** 18 de Marzo de 2026
**Endpoint Base:** `http://localhost:5050`

## Historial de Cambios

### v3.1.0 - 18 de Marzo de 2026
- **NUEVO**: Campo `category` expandido con `default_tax_rate_id` y `default_tax_rate`.
- **NUEVO**: Campo `applicable_tax_rate` con la tasa de IVA que aplica al producto.
- **NUEVO**: Campos de pricing: `override_tax_rate_id`, `target_margin_percent`, `pricing_strategy`.
- **CAMBIO**: La lógica de `applicable_tax_rate` es: override del producto > default de categoría.

### v3.0.0 - 24 de Febrero de 2026
- **BREAKING**: Campo `id_category` renombrado a `category_id` en request bodies de crear/actualizar.
- **BREAKING**: Campo `price_formatted` eliminado de las respuestas.
- **BREAKING**: Rutas eliminadas: `/products/name/{name}`, `/products/financial/{id}`, `/products/{id}/details`, `/products/{id}/with-description`, `/products/search/details/{name}`, `/products/delete/{id}`, `/products/enriched/*`, `/product_description/*`.
- Nuevo tipo de producto: `PRODUCTION` (ademas de `PHYSICAL` y `SERVICE`).
- Endpoint unificado `GET /products/{id}` reemplaza 3 endpoints anteriores (details, with-description, enriched by ID).
- Endpoint unificado `GET /products/search/{name}` reemplaza 2 endpoints de busqueda.
- Nuevo endpoint financiero: `GET /products/{id}/financial` (antes era `/products/financial/{id}`).
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
| `brand` | string \| null | Marca del producto |
| `base_unit` | string \| null | Unidad base: `kg`, `meter`, `l`, `unit`, etc. |
| `override_tax_rate_id` | number \| null | ID de tasa de IVA especifica (anula la de categoria) |
| `target_margin_percent` | number \| null | Porcentaje de margen objetivo (0-100) |
| `pricing_strategy` | string \| null | `MANUAL` \| `AUTOMATIC` |
| `applicable_tax_rate` | object \| null | Tasa de IVA que aplica al producto |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de ultima actualizacion (ISO 8601) |
| `purchase_price` | number \| null | Precio de compra mas reciente |
| `stock_quantity` | number \| null | Cantidad en stock |
| `stock_unit` | string \| null | Unidad del stock (ej: `kg`, `l`) |
| `stock_status` | string | `in_stock`, `low_stock`, `medium_stock`, `out_of_stock` |
| `has_valid_stock` | boolean | Si tiene stock registrado |
| `has_valid_price` | boolean | Si tiene al menos un precio |
| `has_unit_pricing` | boolean | Si tiene precios por unidad |
| `unit_prices` | array | Lista de precios por unidad |
| `description` | string \| null | Descripcion del producto |

### Category

Estructura de categoria en productos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID unico de la categoria |
| `name` | string | Nombre de la categoria |
| `description` | string \| null | Descripcion de la categoria |
| `default_tax_rate_id` | number \| null | ID de la tasa de IVA por defecto |
| `default_tax_rate` | object \| null | Ver estructura TaxRate mas abajo |
| `parent_id` | number \| null | ID de categoria padre (jerarquia) |
| `is_active` | boolean | Estado de la categoria |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de actualizacion (ISO 8601) |

### TaxRate

Estructura de tasa de impuesto.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | number | ID unico de la tasa |
| `tax_name` | string | Nombre del impuesto (ej: "IVA 10%") |
| `code` | string | Codigo: `IVA10`, `IVA5`, `EXENTO`, `ISC`, `IVA_DIGITAL`, `IMPORT` |
| `rate` | number | Porcentaje de la tasa (ej: 10.0, 5.0, 0) |
| `country` | string | Pais (ej: "PY") |
| `jurisdiction_type` | string | Tipo de jurisdiccion |
| `operation_type` | string | Tipo de operacion: `NACIONAL`, `CANASTA`, `EXEMPT`, etc. |
| `description` | string \| null | Descripcion detallada |
| `is_default` | boolean | Si es la tasa por defecto del sistema |
| `is_active` | boolean | Si la tasa esta activa |

### ProductFinancialEnriched

Estructura completa con analisis financiero.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `product_id` | string | ID unico del producto |
| `product_name` | string | Nombre del producto |
| `barcode` | string \| null | Codigo de barras |
| `state` | boolean | Estado (activo/inactivo) |
| `category` | object \| null | `{id: number, name: string}` |
| `product_type` | string | `PHYSICAL` \| `SERVICE` \| `PRODUCTION` |
| `origin` | string \| null | `NACIONAL` \| `IMPORTADO` |
| `brand` | string \| null | Marca del producto |
| `base_unit` | string \| null | Unidad base |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de ultima actualizacion (ISO 8601) |
| `unit_prices` | array | Precios de venta por unidad |
| `unit_costs_summary` | array | Resumen de costos por unidad |
| `stock_quantity` | number \| null | Cantidad en stock |
| `description` | string \| null | Descripcion del producto |
| `financial_health` | object | `{has_prices, has_costs, has_stock, price_count, cost_units_count, last_updated}` |
| `stock_status` | string | Estado del stock |
| `has_valid_stock` | boolean | Si tiene stock |
| `has_valid_prices` | boolean | Si tiene precios |
| `has_valid_costs` | boolean | Si tiene costos |
| `best_margin_unit` | string \| null | Unidad con mejor margen |
| `best_margin_percent` | number \| null | Porcentaje del mejor margen |

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

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `name` | string | Si | Nombre del producto |
| `description` | string | Si | Descripcion del producto |
| `category_id` | number | Si | ID de la categoria (debe ser > 0) |
| `product_type` | string | No | `PHYSICAL`, `SERVICE` o `PRODUCTION`. Default: `PHYSICAL` |
| `barcode` | string | No | Codigo de barras |
| `origin` | string | No | `NACIONAL` o `IMPORTADO` |
| `brand` | string | No | Marca del producto |
| `base_unit` | string | No | Unidad base: `kg`, `l`, `meter`, `unit`, etc. |

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
  "brand": "Coca-Cola",
  "base_unit": "unit"
}
```

**Parametros adicionales al crear:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `state` | boolean | Si | Estado del producto (true=activo, false=inactivo) |

> **Nota:** Para sobrescribir el IVA de la categoria, actualizar via base de datos o usar endpoints administrativos.

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

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error al eliminar producto |

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

Busqueda parcial case-insensitive por nombre. Retorna todos los productos que coincidan.

**Response (200 OK):** Retorna `ProductEnriched[]` (array vacio si no hay coincidencias).

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 500 | Error interno |

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

## Endpoints Financieros

### 10. Obtener Producto Financiero por ID

**`GET /products/{id}/financial`**

Retorna informacion financiera completa: costos, margenes, precios por unidad y salud financiera.

**Response (200 OK):** Retorna `ProductFinancialEnriched`.

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

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | No autorizado |
| 404 | Producto no encontrado |
| 500 | Error interno |

---

### 11. Obtener Producto Financiero por Codigo de Barras

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

### 12. Buscar Productos Financieros por Nombre

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

## Endpoints de Pricing

### 13. Obtener Productos por Categoria

**`GET /products/by-category?categories=1,2,3`**

Retorna productos con precios filtrados por categorias.

**Parametros:**

| Campo | Tipo | Ubicacion | Descripcion |
|-------|------|-----------|-------------|
| `categories` | string | query | IDs de categorias separados por coma |

**Response (200 OK):**
```json
{
  "data": [...],
  "count": 15
}
```

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

## Validaciones

| Campo | Regla |
|-------|-------|
| `name` | Requerido, no puede estar vacio |
| `category_id` | Requerido, debe ser > 0 |
| `product_type` | `PHYSICAL`, `SERVICE` o `PRODUCTION` |
| `origin` | `NACIONAL` o `IMPORTADO` (si se proporciona) |

---

## Guia de Migracion desde v2.x

| Antes (v2.x) | Ahora (v3.0) |
|---------------|--------------|
| `"id_category": 10` | `"category_id": 10` |
| `"price_formatted": "PYG 12,000"` | Campo eliminado |
| `GET /products/financial/{id}` | `GET /products/{id}/financial` |
| `GET /products/name/{name}` | `GET /products/search/{name}` |
| `GET /products/financial/name/{name}` | `GET /products/financial/search/{name}` |
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
