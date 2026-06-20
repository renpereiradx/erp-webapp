# API de Marcas, Atributos y Etiquetas (FASE 1)

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 2.0.0
**Fecha:** 16 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo implementa la **FASE 1** del sistema de atributos dinámicos de productos para e-commerce. Incluye:

1. **Marcas normalizadas** (`products.brands`): Reemplaza el campo `brand` texto libre por una tabla dedicada con slug, logo y descripción.
2. **Atributos dinámicos** (`products.attribute_definitions` + `products.product_attributes`): Patrón EAV controlado con tipos de datos fuertes (STRING, NUMBER, BOOLEAN, DATE, LIST).
3. **Etiquetas transversales** (`products.tags` + `products.product_tags`): Sistema de tags para clasificación flexible (Nuevo, Oferta, Destacado, Eco-friendly, etc.).

### Características Principales

- ✅ CRUD completo de marcas con slug automático
- ✅ Definiciones de atributos vinculados a categoría (o globales con `category_id = NULL`)
- ✅ Asignación de atributos por producto con tipos fuertes
- ✅ Asignación masiva (bulk) de atributos a un producto
- ✅ CRUD de etiquetas con asignación a productos
- ✅ Migración automática de datos: `brand` texto → `brand_id` referencia
- ✅ Producto enriquecido incluye `brand_id`, `brand_name`, `attributes`, `tags` en respuesta JSON

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

---

## Headers Requeridos

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

### Brand

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único de la marca |
| `name` | string | Nombre de la marca |
| `slug` | string | Slug para URLs y búsqueda normalizada |
| `logo_url` | string \| null | URL del logo |
| `description` | string \| null | Descripción de la marca |
| `is_active` | boolean | Estado de la marca |
| `created_at` | string | Fecha de creación (ISO 8601) |
| `updated_at` | string | Fecha de última actualización (ISO 8601) |

### AttributeDefinition

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único |
| `category_id` | number \| null | ID de categoría (NULL = global) |
| `name` | string | Nombre del atributo (ej: "Color") |
| `code` | string | Código del atributo (ej: "color") |
| `data_type` | string | `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `LIST` |
| `is_required` | boolean | Si es obligatorio |
| `is_filterable` | boolean | Si aparece en filtros de búsqueda |
| `is_visible` | boolean | Si es visible en ficha de producto |
| `display_order` | number | Orden de visualización |
| `options` | array \| null | Opciones para tipo LIST |
| `validation_rules` | object \| null | Reglas de validación JSON |
| `unit_suffix` | string \| null | Sufijo de unidad (ej: "GB", "cm") |
| `is_active` | boolean | Estado del atributo |
| `created_at` | string | Fecha de creación (ISO 8601) |
| `updated_at` | string | Fecha de última actualización (ISO 8601) |

### ProductAttribute

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único |
| `product_id` | string | ID del producto |
| `attribute_id` | number | ID de la definición de atributo |
| `value_text` | string \| null | Valor para STRING/LIST |
| `value_number` | number \| null | Valor para NUMBER |
| `value_boolean` | boolean \| null | Valor para BOOLEAN |
| `value_date` | string \| null | Valor para DATE (ISO 8601) |
| `attribute_name` | string | Nombre del atributo (JOIN) |
| `attribute_code` | string | Código del atributo (JOIN) |
| `data_type` | string | Tipo de datos del atributo (JOIN) |
| `unit_suffix` | string \| null | Sufijo de unidad (JOIN) |
| `created_at` | string | Fecha de creación (ISO 8601) |
| `updated_at` | string | Fecha de última actualización (ISO 8601) |

### Tag

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único |
| `name` | string | Nombre de la etiqueta |
| `slug` | string | Slug para URLs |
| `color` | string \| null | Color HEX para UI (ej: "#FF5733") |
| `icon` | string \| null | Icono opcional (ej: "star", "fire") |
| `tag_type` | string | `GENERAL`, `PROMOTION`, `STATUS`, `SEASON` |
| `is_active` | boolean | Estado de la etiqueta |
| `created_at` | string | Fecha de creación (ISO 8601) |

---

## Endpoints de Marcas

### 1. Crear Marca

**`POST /api/v1/brands`**

**Request Body:**
```json
{
  "name": "Nike",
  "logo_url": "https://example.com/nike-logo.png",
  "description": "Marca de ropa deportiva"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Nike",
  "slug": "nike",
  "logo_url": "https://example.com/nike-logo.png",
  "description": "Marca de ropa deportiva",
  "is_active": true,
  "created_at": "2026-06-12T10:00:00Z",
  "updated_at": "2026-06-12T10:00:00Z"
}
```

**Errores:**

| HTTP Status | Descripción |
|-------------|-------------|
| 400 | Nombre vacío |
| 401 | No autorizado |

---

### 2. Listar Marcas

**`GET /api/v1/brands`**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Nike",
    "slug": "nike",
    "is_active": true
  }
]
```

---

### 3. Obtener Marca por ID

**`GET /api/v1/brands/{id}`**

**Response (200 OK):** Retorna `Brand`.

---

### 4. Actualizar Marca

**`PUT /api/v1/brands/{id}`**

**Request Body:**
```json
{
  "name": "Nike Paraguay",
  "description": "Nueva descripción"
}
```

**Response (200 OK):**
```json
{
  "message": "Marca actualizada exitosamente"
}
```

---

### 5. Eliminar Marca

**`DELETE /api/v1/brands/{id}`**

**Response (200 OK):**
```json
{
  "message": "Marca eliminada exitosamente"
}
```

---

## Endpoints de Atributos

### 6. Crear Definición de Atributo

**`POST /api/v1/attributes/definitions`**

**Request Body:**
```json
{
  "category_id": 1,
  "name": "Color",
  "code": "color",
  "data_type": "LIST",
  "is_required": false,
  "is_filterable": true,
  "is_visible": true,
  "display_order": 1,
  "options": ["Rojo", "Azul", "Verde", "Negro"]
}
```

**Response (201 Created):** Retorna `AttributeDefinition`.

---

### 7. Listar Definiciones de Atributos

**`GET /api/v1/attributes/definitions?category_id=1`**

Si `category_id` se omite, retorna todos los atributos activos.

**Response (200 OK):** Retorna `AttributeDefinition[]`.

---

### 8. Obtener Definición por ID

**`GET /api/v1/attributes/definitions/{id}`**

**Response (200 OK):** Retorna `AttributeDefinition`.

---

### 9. Obtener Definiciones por Categoría

**`GET /api/v1/attributes/definitions/category/{categoryId}`**

**Response (200 OK):** Retorna `AttributeDefinition[]`.

---

### 10. Actualizar Definición de Atributo

**`PUT /api/v1/attributes/definitions/{id}`**

**Request Body:**
```json
{
  "name": "Color Principal",
  "is_required": true
}
```

**Response (200 OK):**
```json
{
  "message": "Atributo actualizado exitosamente"
}
```

---

### 11. Eliminar Definición de Atributo

**`DELETE /api/v1/attributes/definitions/{id}`**

**Response (200 OK):**
```json
{
  "message": "Atributo eliminado exitosamente"
}
```

---

## Endpoints de Atributos de Producto

### 12. Obtener Atributos de un Producto

**`GET /products/{id}/attributes`**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "product_id": "A-7oarkDR",
    "attribute_id": 1,
    "value_text": "Rojo",
    "attribute_name": "Color",
    "attribute_code": "color",
    "data_type": "LIST",
    "created_at": "2026-06-12T10:00:00Z"
  }
]
```

---

### 13. Asignar Atributo a Producto

**`PUT /products/{id}/attributes/{attrId}`**

**Request Body:**
```json
{
  "value_text": "Rojo"
}
```

Para atributos de tipo NUMBER:
```json
{
  "value_number": 16
}
```

Para atributos de tipo BOOLEAN:
```json
{
  "value_boolean": true
}
```

Para atributos de tipo DATE:
```json
{
  "value_date": "2026-06-12"
}
```

**Response (200 OK):**
```json
{
  "message": "Atributo asignado exitosamente"
}
```

---

### 14. Eliminar Atributo de Producto

**`DELETE /products/{id}/attributes/{attrId}`**

**Response (200 OK):**
```json
{
  "message": "Atributo eliminado del producto"
}
```

---

### 15. Asignar Atributos en Bulk

**`POST /products/{id}/attributes`**

**Request Body:**
```json
{
  "attributes": [
    {
      "attribute_id": 1,
      "value_text": "Rojo"
    },
    {
      "attribute_id": 2,
      "value_text": "M"
    },
    {
      "attribute_id": 3,
      "value_number": 16
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Atributos asignados exitosamente"
}
```

---

## Endpoints de Etiquetas

### 16. Crear Etiqueta

**`POST /api/v1/tags`**

**Request Body:**
```json
{
  "name": "Nuevo",
  "color": "#FF5733",
  "icon": "star",
  "tag_type": "STATUS"
}
```

**Response (201 Created):** Retorna `Tag`.

---

### 17. Listar Etiquetas

**`GET /api/v1/tags`**

**Response (200 OK):** Retorna `Tag[]`.

---

### 18. Obtener Etiqueta por ID

**`GET /api/v1/tags/{id}`**

**Response (200 OK):** Retorna `Tag`.

---

### 19. Actualizar Etiqueta

**`PUT /api/v1/tags/{id}`**

**Request Body:**
```json
{
  "name": "En Oferta",
  "color": "#00FF00"
}
```

**Response (200 OK):**
```json
{
  "message": "Etiqueta actualizada exitosamente"
}
```

---

### 20. Eliminar Etiqueta

**`DELETE /api/v1/tags/{id}`**

**Response (200 OK):**
```json
{
  "message": "Etiqueta eliminada exitosamente"
}
```

---

### 21. Asignar Etiqueta a Producto

**`POST /products/{id}/tags/{tagId}`**

**Response (200 OK):**
```json
{
  "message": "Etiqueta asignada al producto"
}
```

---

### 22. Eliminar Etiqueta de Producto

**`DELETE /products/{id}/tags/{tagId}`**

**Response (200 OK):**
```json
{
  "message": "Etiqueta removida del producto"
}
```

---

### 23. Obtener Etiquetas de Producto

**`GET /products/{id}/tags`**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Nuevo",
    "slug": "nuevo",
    "color": "#FF5733",
    "tag_type": "STATUS"
  }
]
```

---

## FASE 2: Búsqueda Avanzada y Facetas

### 24. Búsqueda Avanzada

**`POST /products/search/advanced`**

Filtra productos por nombre/barcode, categoría (incluye subcategorías), marcas, tags y atributos dinámicos. Requiere permiso `products:read`.

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

### 25. Facetas de Filtros

**`GET /products/search/facets?category_id=5&branch_id=1`**

Retorna facetas de marca, categoría, atributos filtrables y rango de precios para construir la UI de filtros.

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

## FASE 4: Herencia de Atributos y Plantillas

### 26. Plantillas de Atributos

**`GET /api/v1/attributes/templates`**
Lista plantillas predefinidas por tipo de negocio (`ROPA`, `ELECTRONICA`, `FERRETERIA`, `ALIMENTOS`).

**`POST /api/v1/attributes/templates`**
Crea una plantilla personalizada.

**`GET /api/v1/attributes/templates/{id}`**
Obtiene una plantilla.

**`DELETE /api/v1/attributes/templates/{id}`**
Elimina una plantilla.

### 27. Aplicar Plantilla

**`POST /api/v1/attributes/templates/{id}/apply`**

Aplica las definiciones de una plantilla a una categoría específica o globalmente.

```json
{
    "category_id": 5
}
```

### 28. Atributos Aplicables de un Producto

**`GET /products/{id}/applicable-attributes`**

Retorna los atributos que le corresponden a un producto considerando su categoría, categorías ancestros y atributos globales. Útil para saber qué campos mostrar en la ficha.

**Response (200 OK):**
```json
[
    {
        "attribute_id": 1,
        "name": "Color",
        "code": "color",
        "data_type": "LIST",
        "is_required": false,
        "category_id": 5,
        "category_name": "Ropa",
        "inherited": false
    }
]
```

---

## Cambios en Producto Enriquecido

Los endpoints de producto que retornan `ProductEnriched` ahora incluyen campos adicionales:

```json
{
  "id": "A-7oarkDR",
  "name": "Coca Cola 500ml",
  "brand_id": 13,
  "brand_name": "Coca Cola",
  "brand_slug": "coca-cola",
  "attributes": [
    {
      "id": 1,
      "attribute_id": 1,
      "value_text": "Rojo",
      "attribute_name": "Color",
      "attribute_code": "color",
      "data_type": "LIST"
    }
  ],
  "tags": [
    {
      "id": 1,
      "name": "Nuevo",
      "slug": "nuevo",
      "color": "#FF5733"
    }
  ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `brand_id` | number \| null | FK a `products.brands` |
| `brand_name` | string \| null | Nombre de la marca (JOIN) |
| `brand_slug` | string \| null | Slug de la marca (JOIN) |
| `attributes` | array | Lista de `ProductAttribute` |
| `tags` | array | Lista de `Tag` |

> **Nota:** El campo `brand` (string) fue eliminado en FASE 5. Usar `brand_id`, `brand_name` o `brand_slug`.

---

## Validaciones

| Campo | Regla |
|-------|-------|
| `name` (marca) | Requerido, no puede estar vacío |
| `name` (atributo) | Requerido, no puede estar vacío |
| `code` (atributo) | Requerido, único por categoría |
| `data_type` | Requerido, debe ser `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, o `LIST` |
| `name` (tag) | Requerido, no puede estar vacío |

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos o validación fallida | Verificar el body y los campos requeridos |
| 401 | Token JWT inválido o ausente | Verificar que se envía el header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Recurso no encontrado | Verificar el ID |
| 409 | Conflicto (slug duplicado, etc.) | El recurso ya existe |
| 500 | Error interno del servidor | Reportar al equipo de backend |

---

## Historial de Cambios

### v2.0.0 - 16 de Junio de 2026

- ✅ FASE 2: Endpoints `/products/search/advanced` y `/products/search/facets`
- ✅ FASE 4: Herencia de atributos, plantillas y endpoint `/products/{id}/applicable-attributes`
- ✅ FASE 5: Campo `brand` legacy eliminado; usar `brand_id`, `brand_name`, `brand_slug`
- ✅ Producto enriquecido lee desde `products.mv_product_catalog` para mejor performance

### v1.0.0 - 12 de Junio de 2026

- ✅ Implementación FASE 1: Marcas, Atributos, Tags
- ✅ Tabla `products.brands` con normalización de marcas
- ✅ Tabla `products.attribute_definitions` con tipos fuertes
- ✅ Tabla `products.product_attributes` (EAV controlado)
- ✅ Tablas `products.tags` y `products.product_tags`
- ✅ Migración automática de `brand` texto → `brand_id`
- ✅ Producto enriquecido incluye `brand_id`, `brand_name`, `attributes`, `tags`
- ✅ Nuevos endpoints: `/api/v1/brands`, `/api/v1/attributes/definitions`, `/api/v1/tags`, `/products/{id}/attributes`, `/products/{id}/tags`

---

**Última actualización:** 16 de Junio de 2026
**Versión:** 2.0.0
**Estado:** ✅ Production Ready
