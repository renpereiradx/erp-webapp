# API de Variantes de Producto (FASE 3)

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 1.0.0
**Fecha:** 16 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo implementa la **FASE 3** del sistema de atributos dinámicos: **Variantes de Producto (SKUs)**. Permite crear múltiples variantes de un producto padre (ej: misma camisa en rojo/M y azul/L), cada una con SKU, barcode, stock y precio independientes.

### Conceptos Clave

- **Producto Padre:** Producto base que agrupa variantes. Sin cambios en su funcionamiento actual.
- **Variante:** SKU hija con atributos específicos (color, talla, etc.). Tiene su propio stock y precio.
- **Stock por Variante:** El stock se registra a nivel de variante, no de producto padre.
- **Precio por Variante:** Los precios pueden diferir por variante, con fallback al precio del padre.
- **Retrocompatibilidad:** Productos sin variantes siguen funcionando exactamente igual.

### Jerarquía de Resolución de Precios

1. Precio explícito en transacción (`order_details.unit_price`)
2. Precio de la variante (`unit_prices WHERE variant_id = X`)
3. Precio del producto padre (`unit_prices WHERE product_id = X AND variant_id IS NULL`)
4. Resolución fiscal existente (tax_rate)

### Lógica de Stock con Variantes

- **Producto SIN variantes:** stock sigue funcionando como antes (`product_id + branch_id`)
- **Producto CON variantes:**
  - Stock se registra **por variante** (`variant_id + branch_id`)
  - Stock del padre = `SUM(stock)` de todas sus variantes activas
  - Venta requiere seleccionar variante específica
  - Compra puede ser por variante o genérica

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.

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

### ProductVariant

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único (KSUID) |
| `parent_product_id` | string | ID del producto padre |
| `sku` | string | SKU único (auto-generado si no se especifica) |
| `variant_name` | string | Nombre de la variante (auto-generado: "Camisa Polo - color: rojo / talla: M") |
| `barcode` | string \| null | Código de barras (validado contra productos + variantes) |
| `variant_attributes` | object | Atributos distintivos: `{"color": "rojo", "talla": "M"}` |
| `is_active` | boolean | Estado de la variante |
| `display_order` | number | Orden de visualización |
| `stock_quantity` | number \| null | Cantidad en stock. **No incluido en GET /products/{id}/variants.** Usar `GET /api/v1/variants/{id}/stock?branch_id=X` para consultar stock. |
| `current_price` | number \| null | Precio actual. **No incluido en GET /products/{id}/variants.** Usar `GET /products/{id}/units` o el endpoint de pricing del producto padre. |
| `created_at` | string | Fecha de creación (ISO 8601) |
| `updated_at` | string | Fecha de última actualización (ISO 8601) |

### VariantStockSum

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `parent_product_id` | string | ID del producto padre |
| `branch_id` | number \| null | ID de sucursal (null = todas) |
| `total_stock` | number | Stock total (suma de variantes) |
| `variant_count` | number | Cantidad de variantes activas con stock |

---

## Endpoints de Variantes

### 1. Crear Variante

**`POST /products/{id}/variants`**

Crea una nueva variante bajo un producto padre. El SKU y variant_name se auto-generan si no se especifican.

**Request Body:**
```json
{
  "variant_attributes": {
    "color": "rojo",
    "talla": "M"
  },
  "sku": "CAMISA-ROJO-M",
  "variant_name": "Camisa Polo Rojo Talla M",
  "barcode": "1234567890123",
  "display_order": 1,
  "initial_stock": 50.0,
  "initial_price": 25000.00,
  "stock_branch_id": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `variant_attributes` | object | **Sí** | Atributos distintivos (ej: `{"color":"rojo","talla":"M"}`). Debe coincidir con atributos definidos para la categoría. |
| `sku` | string | No | SKU único. Auto-generado si se omite: `{parent_6chars}-{VALOR1}-{VALOR2}` |
| `variant_name` | string | No | Nombre descriptivo. Auto-generado si se omite: `"{padre} - color: rojo / talla: M"` |
| `barcode` | string | No | Código de barras (validado contra productos + otras variantes) |
| `display_order` | number | No | Orden de visualización. Default: `0` |
| `initial_stock` | number | No | Stock inicial. Requiere `stock_branch_id`. |
| `initial_price` | number | No | Precio inicial. Requiere `stock_branch_id`. |
| `stock_branch_id` | number | No | Sucursal para stock/precio inicial. Requiere `initial_stock` o `initial_price`. |

**Validaciones:**
- `variant_attributes` debe ser un objeto JSON no vacío
- Los atributos se validan contra las definiciones existentes (tipo de dato, opciones LIST)
- `barcode` debe ser único entre todas las variantes y productos
- `initial_stock` e `initial_price` requieren `stock_branch_id` (deben ir juntos)

**Response (201 Created):** Retorna `ProductVariant`.

```json
{
  "id": "Vp8xK3mN",
  "parent_product_id": "PROD_001",
  "sku": "PROD_0-rojo-M",
  "variant_name": "Camisa Polo - color: rojo / talla: M",
  "barcode": null,
  "variant_attributes": {
    "color": "rojo",
    "talla": "M"
  },
  "is_active": true,
  "display_order": 0,
  "created_at": "2026-06-16T10:00:00Z",
  "updated_at": "2026-06-16T10:00:00Z"
}
```

**Errores:**

| HTTP Status | Descripción |
|-------------|-------------|
| 400 | Datos inválidos, atributos vacíos, barcode duplicado, stock/price sin branch_id |
| 401 | No autorizado |
| 404 | Producto padre no encontrado |

---

### 2. Listar Variantes de un Producto

**`GET /products/{id}/variants?include_inactive=false`**

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `include_inactive` | bool | No | Incluir variantes inactivas. Default: `false` |

**Response (200 OK):**
```json
{
  "variants": [
    {
      "id": "VAR_001",
      "parent_product_id": "PROD_001",
      "sku": "PROD_0-rojo-M",
      "variant_name": "Camisa Polo - color: rojo / talla: M",
      "variant_attributes": { "color": "rojo", "talla": "M" },
      "is_active": true,
      "display_order": 0,
      "created_at": "2026-06-16T10:00:00Z",
      "updated_at": "2026-06-16T10:00:00Z"
    }
  ],
  "total": 1
}
```

> **Nota:** `stock_quantity` y `current_price` no se incluyen en esta respuesta. Para obtener el stock de una variante usar `GET /api/v1/variants/{id}/stock?branch_id=X`. Para el precio, consultar `GET /products/{id}/units`.

---

### 3. Obtener Variante por ID

**`GET /api/v1/variants/{id}`**

**Response (200 OK):** Retorna `ProductVariant`.

**Errores:**

| HTTP Status | Descripción |
|-------------|-------------|
| 404 | Variante no encontrada |

---

### 4. Actualizar Variante

**`PUT /api/v1/variants/{id}`**

Todos los campos son opcionales. Solo se actualizan los campos enviados.

**Request Body:**
```json
{
  "sku": "CAMISA-AZUL-L",
  "variant_name": "Camisa Polo Azul Talla L",
  "barcode": "9999999999999",
  "variant_attributes": { "color": "azul", "talla": "L" },
  "is_active": true,
  "display_order": 2
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sku` | string | SKU único (validado contra otras variantes) |
| `variant_name` | string | Nombre descriptivo |
| `barcode` | string \| null | Código de barras (enviar `""` para limpiar) |
| `variant_attributes` | object | Atributos distintivos (validados contra definiciones) |
| `is_active` | boolean | Activar/desactivar variante |
| `display_order` | number | Orden de visualización |

**Response (200 OK):**
```json
{
  "message": "Variante actualizada exitosamente"
}
```

---

### 5. Eliminar Variante (Soft Delete)

**`DELETE /api/v1/variants/{id}`**

Desactiva la variante (`is_active = false`). No se elimina físicamente para preservar integridad referencial.

**Response (200 OK):**
```json
{
  "message": "Variante eliminada exitosamente"
}
```

---

### 6. Obtener Stock de Variante

**`GET /api/v1/variants/{id}/stock?branch_id=1`**

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `branch_id` | int | No | Filtrar por sucursal. Sin filtro = suma de todas. |

**Response (200 OK):**
```json
{
  "parent_product_id": "PROD_001",
  "branch_id": null,
  "total_stock": 100.0,
  "variant_count": 1
}
```

---

### 7. Stock Total del Producto (Suma de Variantes)

**`GET /products/{id}/total-stock?branch_id=1`**

Retorna el stock agregado de todas las variantes activas del producto.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `branch_id` | int | No | Filtrar por sucursal. Sin filtro = suma global. |

**Response (200 OK):**
```json
{
  "parent_product_id": "PROD_001",
  "branch_id": null,
  "total_stock": 250.0,
  "variant_count": 3
}
```

---

## Integración con Ventas y Compras

Cuando un producto tiene variantes, las transacciones (ventas/compras) pueden especificar `variant_id` opcional en cada línea de detalle.

### En Ventas (`product_details`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `variant_id` | string | No | ID de la variante seleccionada. Obligatorio si el producto tiene variantes activas. |

### En Compras (`order_details`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `variant_id` | string | No | ID de la variante seleccionada. Opcional, permite compra genérica para distribución. |

> **Nota:** Las transacciones existentes sin `variant_id` (productos sin variantes) siguen funcionando exactamente igual.

---

## Guía de Uso para Frontend

### Flujo: Mostrar variantes en ficha de producto

1. `GET /products/{id}` — Obtener producto padre
2. `GET /products/{id}/variants` — Listar variantes activas
3. Por cada variante, mostrar:
   - `variant_name` (ej: "Camisa Polo - color: rojo / talla: M")
   - Atributos de `variant_attributes` para filtros visuales (color swatch, talla selector)
4. Para disponibilidad de stock por sucursal: `GET /api/v1/variants/{id}/stock?branch_id=X`
5. Para precio por variante: `GET /products/{id}/units` (el precio de variante se resuelve en ese endpoint)

### Flujo: Crear producto con variantes

1. `POST /products` — Crear producto padre (sin variantes)
2. `POST /products/{id}/variants` — Crear cada variante con sus atributos
3. Opcional: `PUT /products/{id}/variants/{varId}` para ajustar stock/precio

### Flujo: Venta de variante

1. Usuario selecciona producto con variantes
2. UI muestra selector de atributos (color, talla)
3. Al confirmar, enviar `variant_id` en `product_details`
4. Sistema descuenta stock de la variante específica

### Auto-generación de SKU

Cuando no se envía `sku`, el sistema genera automáticamente:
```
{6 primeros chars del ID padre en mayúsculas}-{ATTR1_VALOR}-{ATTR2_VALOR}
```
Ejemplo: `PROD_0-ROJO-M`

Si hay colisión, añade sufijo numérico (`-1`, `-2`, etc.).

---

## Validaciones

| Campo | Regla |
|-------|-------|
| `variant_attributes` | Requerido, objeto JSON no vacío |
| `sku` | Único entre todas las variantes. Auto-generado si se omite. |
| `barcode` | Único entre variantes y productos |
| `initial_stock` | No negativo. Requiere `stock_branch_id`. |
| `initial_price` | No negativo. Requiere `stock_branch_id`. |
| `stock_branch_id` | Requerido si se envía `initial_stock` o `initial_price` |

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos o validación fallida | Verificar el body y campos requeridos |
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Producto o variante no encontrada | Verificar el ID |
| 409 | SKU o barcode duplicado | El valor ya existe en otra variante o producto |

---

## 12. Ajustes Manuales con Variantes

Los endpoints de ajustes manuales ahora soportan `variant_id` para operaciones granulares:

| Endpoint | Uso con Variante | Guía |
|---|---|---|
| `POST /manual_adjustment/` | Enviar `variant_id` para ajustar stock de una variante específica | [Inventory Adjustments Guide](INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md) |
| `POST /manual_adjustment/price` | Enviar `variant_id` para ajustar precio de una variante | [Manual Price Adjustments Guide](MANUAL_PRICE_ADJUSTMENTS_API_GUIDE.md) |
| `POST /inventory/` | Enviar `variant_id` en cada item para conteo físico por variante | [Inventory Adjustments Guide](INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md) |

**Comportamiento:**
- Si `variant_id` se omite → opera sobre el producto padre (retrocompatibilidad)
- Si `variant_id` se especifica → opera sobre esa variante específica
- Los historiales de ajustes y transacciones ahora retornan `variant_id` para auditoría

---

## Historial de Cambios

### v1.0.0 - 16 de Junio de 2026

- Implementación FASE 3: Sistema de Variantes de Producto
- CRUD completo de variantes bajo producto padre
- Stock y precios independientes por variante
- Auto-generación de SKU y nombre de variante
- Validación de atributos contra definiciones de categoría
- Integración con ventas y compras via `variant_id` opcional
- Stock rollup: `GET /products/{id}/total-stock`

---

**Última actualización:** 16 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
