# 📦 API de Órdenes de Compra

**Versión:** 2.7
**Fecha:** 19 de Marzo de 2026
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta API gestiona el ciclo de vida completo de las órdenes de compra (Purchase Orders), desde su creación y procesamiento hasta su cancelación. Integra un sistema de costos y precios mejorado, permitiendo una trazabilidad financiera completa, auto-pricing inteligente y manejo de múltiples unidades por producto.

### Características Principales

- ✅ **Creación de Órdenes de Compra**: Permite crear órdenes con detalles de productos, costos y márgenes de ganancia.
- ✅ **Consulta de Órdenes**: Ofrece múltiples endpoints para consultar órdenes por proveedor, ID o rango de fechas.
- ✅ **Cancelación de Órdenes**: Incluye un sistema seguro para previsualizar y ejecutar la cancelación de órdenes, revirtiendo stock y actualizando estados.
- ✅ **Trazabilidad Financiera**: Separa costos y precios, y registra el impacto de cada compra.
- ✅ **Sistema de Clasificación Fiscal**: Resolución automática de tasas de IVA con jerarquía de 6 niveles.
- ✅ **Validación de Datos**: Asegura la integridad de los datos mediante validaciones en el backend.

### Nota de UI

Para cargar productos en el flujo de compras, usar:

- `GET /products/{id}/purchase`
- `GET /products/{id}/info`
- `GET /products/info/barcode/{barcode}`
- `GET /products/info/search/{name}`

Usar `info`, `sale` y `purchase` como rutas principales de consulta.

---

## 📝 Historial de Cambios

### v2.7 - 19 de Marzo de 2026
- ✅ **Validación de Metadata en Backend**: El campo `metadata` ahora es validado contra un JSON Schema en el backend.
- ✅ **Errores Descriptivos**: Si la metadata no cumple con el schema, el API devuelve errores específicos indicando el campo y problema.

### v2.6 - 19 de Marzo de 2026
- ✅ **Sistema de Clasificación Fiscal**: Nueva jerarquía de 6 niveles para resolución de tasas de IVA.
- ✅ **Campo `price_includes_tax`**: Soporte para especificar si el precio incluye o excluye IVA.
- ✅ **Advertencias de Discrepancia**: Respuesta incluye `warnings` cuando se usa una tasa diferente a la esperada.
- ✅ **Endpoints de Tax Classification**: Ver `CATEGORY_IVA_API_GUIDE.md` para gestión de clasificaciones SIFEN.

### v2.8 - 22 de Marzo de 2026
- ✅ **Nombres simples para producto**: `info`, `sale` y `purchase` como endpoints de lectura recomendados.
- ✅ **Rutas principales simples**: `info`, `sale` y `purchase`.

### v2.5 - 25 de Enero de 2026

---

## 📝 Historial de Cambios

### v2.5 - 25 de Enero de 2026
- ✅ **Migración de Unidades en BD**: Agregada columna `unit` en la tabla `purchase_order_details` de la base de datos.
- ✅ **Unidades Permitidas**: `kg`, `g`, `lb`, `oz`, `ton`, `l`, `ml`, `gal`, `meter`, `cm`, `sqm`, `unit`, `pair`, `dozen`, `box`, `pack`, `bag`, `case`, `bundle`, `roll`, `hour`, `day`, `month`, `tray`, `bottle`, `can`, `jar`, `carton`, `stick`, `slice`, `portion`.
- ✅ **Función de Conversión**: Nueva función `products.convert_units()` para conversión entre unidades compatibles.

### v2.4 - 30 de Diciembre de 2025
- ✅ **Fix: `sale_price` en Metadata de Detalles**: Corregido el problema donde `sale_price` retornaba 0 en los detalles de órdenes de compra.
- ✅ **Estructura de Metadata Definida**: El backend ahora define y almacena la estructura exacta del metadata en `purchase_order_details`:
  ```json
  {
    "unit": "string",
    "profit_pct": "number",
    "sale_price": "number",
    "line_total": "number",
    "tax_rate": "number"
  }
  ```
- ✅ **Migración 000004**: Aplicada migración para actualizar registros existentes con `sale_price` calculado.
- ✅ **Función `process_complete_purchase_order` v1.2**: Actualizada para incluir `sale_price` en el metadata al momento de crear los detalles.

### v2.3 - 30 de Diciembre de 2025
- ✅ **Estructura Unificada para TODOS los Endpoints de Consulta**: Todos los endpoints GET ahora devuelven la estructura `PurchaseWithFullDetails`, unificando la respuesta de la API.
- ✅ **Endpoints Actualizados**:
  - `GET /purchase/{id}` - Ahora devuelve `PurchaseWithFullDetails` (antes: `PurchaseWithDetails`)
  - `GET /purchase/{id}/supplier/{supplier_name}` - Ahora devuelve `PurchaseWithFullDetails` (antes: `PurchaseWithDetails`)
  - `GET /purchase/date_range/` - Ahora devuelve `[]*PurchaseWithFullDetails` (antes: `[]*PurchaseWithDetails`)
- ✅ **Información Adicional Disponible**: Todos los endpoints ahora incluyen `payments`, `cost_info` y `metadata` en sus respuestas.

### v2.2 - 19 de Noviembre de 2025
- ✅ **Respuesta Enriquecida para `GET /purchase/supplier_name/{supplier_name}`**: El endpoint ahora devuelve la estructura `PurchaseWithFullDetails`, que incluye resúmenes de pago e información de costos, igualando la respuesta de `GET /purchase/supplier_id/{supplier_id}`.
- ✅ **Documentación Corregida**: Se actualizó la documentación para `GET /purchase/supplier_id/{supplier_id}` y `GET /purchase/supplier_name/{supplier_name}` para reflejar la estructura de respuesta correcta (`PurchaseWithFullDetails`).
- ✅ **Nuevos Modelos de Datos**: Se agregaron a la documentación los modelos `PurchaseWithFullDetails`, `PurchasePaymentSummary`, `PurchaseCostInfo`, y `PurchaseItemFullRiched`.

### v2.1 - 17 de Noviembre de 2025
- ✅ **Refactorización de Modelos de Datos**: Se mejoró la precisión y se eliminó redundancia en la sección "Modelos de Datos (JSON)".
- ✅ **Clarificación de Respuestas GET**: Las descripciones de las respuestas de los endpoints GET ahora referencian directamente los modelos de datos definidos.

### v2.0 - 17 de Noviembre de 2025
- ⚠️ **Breaking**: Documentación reestructurada completamente para seguir los estándares de `FRONTEND_API_DOCUMENTATION_GUIDE.md`.
- ✅ Agregado el endpoint `GET /purchase/{id}/supplier/{supplier_name}`.
- ✅ Secciones de código de implementación (React) eliminadas.
- ✅ Modelos de datos presentados en formato JSON.
- ✅ Estandarización de formato de endpoints, errores y parámetros.

### v1.4 - 22 de Septiembre de 2025
- ✅ **SISTEMA DE CANCELACIÓN**: Agregados endpoints para previsualizar y cancelar órdenes.
- ✅ Nuevos endpoints: `GET /purchase/{id}/preview-cancellation` y `POST /purchase/cancel`.

### v1.2 - Fecha anterior
- ✅ **FUNCIÓN ORIGINAL RESTAURADA**: Se confirma que el cálculo de precios original sin doble IVA es correcto.
- ✅ Endpoints de consulta mejorados con parsing de metadata.

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
  "message": "Descripción legible del error.",
  "details": {
    "campo_con_error": "valor_problematico",
    "info_adicional": "..."
  }
}
```

---

## 🔗 Endpoints de la API

### 1. Crear Orden de Compra

#### 1.1. 🛒 Crear y Procesar una Orden de Compra

**Endpoint:** `POST /purchase/complete`

Crea una nueva orden de compra y la procesa. Esta operación crea registros de costos, actualiza el stock de productos y, opcionalmente, actualiza los precios de venta.

> Para mostrar el producto en pantalla antes de confirmar la compra, usar `GET /products/{id}/purchase`.

**Request Body:**
*Ver modelo `PurchaseOrderRequest` en la sección "Modelos de Datos (JSON)".*
```json
{
  "supplier_id": 13,
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PROD_BANANA_001",
      "quantity": 50.0,
      "unit_price": 2500.00,
      "unit": "kg",
      "profit_pct": 35.0,
      "tax_rate_id": null
    },
    {
      "product_id": "FL8K0xxRzjX0VAND78u842kzKcM",
      "quantity": 20.0,
      "unit_price": 5000.00,
      "unit": "unit",
      "profit_pct": 40.0
    }
  ],
  "payment_method_id": 1,
  "currency_id": 2,
  "auto_update_prices": true,
  "default_profit_margin": 30.0,
  "metadata": {
    "purchase_notes": "Compra urgente",
    "supplier_contact": "juan@proveedor.com"
  }
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `supplier_id` | number | ✅ Sí | ID del proveedor. Debe estar activo. |
| `status` | string | ✅ Sí | Estado de la orden. Valores: `PENDING`, `COMPLETED`, `CANCELLED`. |
| `order_details` | array | ✅ Sí | Lista de productos en la orden. Mínimo 1. |
| `order_details[].product_id` | string | ✅ Sí | ID del producto. |
| `order_details[].quantity` | number | ✅ Sí | Cantidad comprada. Debe ser > 0. |
| `order_details[].unit_price` | number | ✅ Sí | Costo por unidad. Debe ser > 0. |
| `order_details[].unit` | string | ❌ No | Unidad de medida (e.g., `kg`, `unit`). Default: `unit`. |
| `order_details[].profit_pct` | number | ❌ No | Margen de ganancia para este producto. Si no se provee, se usa `default_profit_margin`. |
| `order_details[].tax_rate_id`| number | ❌ No | ID de la tasa de impuesto aplicable. Si se omite, se resuelve automáticamente. |
| `order_details[].price_includes_tax` | boolean | ❌ No | Si el precio incluye IVA. Default: `true`. Ver sección "Sistema de IVA". |
| `payment_method_id` | number | ❌ No | ID del método de pago. |
| `currency_id` | number | ❌ No | ID de la moneda. |
| `auto_update_prices` | boolean | ❌ No | Si es `true`, actualiza el precio de venta del producto. Default: `true`. |
| `default_profit_margin` | number | ❌ No | Margen de ganancia a aplicar si un item no tiene `profit_pct`. Default: `30.0`. |
| `metadata` | object | ❌ No | Objeto para datos adicionales. Ver sección "Validación de Metadata". |

---

## 📋 Validación de Metadata

El campo `metadata` en `POST /purchase/complete` es validado contra un JSON Schema en el backend. Si la estructura no es válida, el API devuelve un error 400 con detalles.

### Estructura Válida para Metadata de Orden de Compra

```json
{
  "auto_update_prices": "boolean (opcional)",
  "default_profit_margin": "number 0-100 (opcional)",
  "system_version": "string (opcional)",
  "created_at": "string ISO datetime (opcional)",
  "completed_at": "string ISO datetime (opcional)",
  "total_items": "integer (opcional)",
  "cost_entries_created": "integer (opcional)",
  "prices_updated": "integer (opcional)",
  "stock_updated": "integer (opcional)",
  "cancelled_at": "string ISO datetime (opcional)",
  "cancelled_by": "string (opcional)",
  "cancellation_reason": "string (opcional)",
  "original_status": "string (opcional)",
  "original_total": "number (opcional)",
  "items_reverted": "integer (opcional)",
  "stock_items_reverted": "integer (opcional)",
  "payments_cancelled": "integer (opcional)",
  "force_cancel_used": "boolean (opcional)",
  "insufficient_stock_products": "array of strings (opcional)",
  "preserved_tax_discrepancy_warnings": "array (opcional)",
  "cancelled_by_system_version": "string (opcional)"
}
```

### Ejemplo de Metadata Válida

```json
{
  "auto_update_prices": true,
  "default_profit_margin": 30.0,
  "purchase_notes": "Compra urgente",
  "supplier_contact": "juan@proveedor.com"
}
```

**Nota:** El frontend puede agregar campos adicionales (como `purchase_notes` o `supplier_contact`) ya que el schema permite `additionalProperties: true`.

### Ejemplo de Error de Metadata

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed: invalid metadata: default_profit_margin: Invalid type"
}
```

---

## 💰 Sistema de IVA y Clasificación Fiscal

### Resolución de Tasas de IVA (Jerarquía de 6 Niveles)

Cuando `tax_rate_id` no se especifica, el sistema resuelve automáticamente la tasa:

| Prioridad | Fuente | Campo | Descripción |
|-----------|--------|-------|-------------|
| 1 | **Transacción** | `order_details.tax_rate_id` | Override explícito en la línea |
| 2 | **Precio** | `unit_prices.effective_tax_rate_id` | Tasa para precio específico |
| 3 | **Producto** | `products.override_tax_rate_id` | Override del producto |
| 4 | **Clasificación Fiscal** | `product_tax_classifications` | Clasificación SIFEN (CANASTA, GENERAL, EXENTO) |
| 5 | **Categoría** | `categories.default_tax_rate_id` | Tasa de la categoría |
| 6 | **Sistema** | `tax_rates.is_default = true` | Fallback (IVA 10%) |

Ver `CATEGORY_IVA_API_GUIDE.md` para gestión de clasificaciones fiscales.

### Campo `price_includes_tax`

| Valor | Comportamiento | Ejemplo (IVA 10%) |
|-------|----------------|-------------------|
| `true` (default) | Precio incluye IVA → se extrae | Costo 1100 con IVA → Neto 1000, IVA 100 |
| `false` | Precio sin IVA → se agrega | Costo 1000 sin IVA → Neto 1000, IVA 100, Total 1100 |

**Prioridad:**
1. `price_includes_tax` en `order_details`
2. `price_includes_tax` del producto en `unit_prices`
3. Default: `true` (Paraguay)

### Advertencias de Discrepancia de Tasas

Si se especifica `tax_rate_id` diferente al esperado, la respuesta incluye warnings:

```json
{
  "success": true,
  "purchase_order_id": 123,
  "warnings": [
    {
      "type": "TAX_DISCREPANCY",
      "product_id": "PROD_001",
      "product_name": "Producto Ejemplo",
      "expected": {"id": 1, "code": "IVA10"},
      "actual": {"id": 2, "code": "IVA5"},
      "source": "TAX_CLASSIFICATION"
    }
  ]
}
```

---

**Response (201 Created):**
*Ver modelo `PurchaseOrderCreationResponse` en la sección "Modelos de Datos (JSON)".*
```json
{
  "success": true,
  "purchase_order_id": 12,
  "total_amount": 225000.00,
  "items_processed": 2,
  "cost_entries_created": 2,
  "prices_updated": 1,
  "message": "Purchase order created successfully"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `INVALID_PRODUCT_ID` | 409 Conflict | Uno o más IDs de producto no existen. |
| `SUPPLIER_INACTIVE` | 400 Bad Request | El proveedor está inactivo y no puede recibir nuevas órdenes. |
| `INVALID_QUANTITY` | 400 Bad Request | La cantidad de un producto es menor o igual a cero. |
| `Token inválido` | 401 Unauthorized | El token JWT es inválido o ha expirado. |

---

### 2. Consultar Órdenes de Compra

#### 2.1. 🆔 Por ID de Orden

**Endpoint:** `GET /purchase/{id}`

Obtiene una orden de compra específica por su ID, con información enriquecida que incluye detalles financieros y un resumen de pagos.

> El detalle de producto para la interfaz debe venir de `GET /products/{id}/purchase` o `GET /products/{id}/info`.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | ID de la orden de compra. |

**Response (200 OK):**
*Retorna un objeto `PurchaseWithFullDetails` (ver sección "Modelos de Datos (JSON)").*

*La estructura de la respuesta es idéntica a la de un elemento del array retornado por `GET /purchase/supplier_id/{supplier_id}`.*

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `sql: no rows in result set` | 500 Internal Server Error | La orden de compra con el ID dado no existe. |

#### 2.2. 🗂️ Por ID de Proveedor

**Endpoint:** `GET /purchase/supplier_id/{supplier_id}`

Obtiene todas las órdenes de compra para un proveedor específico, con información enriquecida que incluye detalles financieros y un resumen de pagos.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `supplier_id` | number | ✅ Sí | ID del proveedor a consultar. |

**Response (200 OK):**
*Retorna un array de objetos `PurchaseWithFullDetails` (ver sección "Modelos de Datos (JSON)").*
```json
[
  {
    "purchase": {
      "id": 123,
      "order_date": "2025-11-18T10:00:00Z",
      "total_amount": 350000.00,
      "status": "COMPLETED",
      "supplier_id": 10,
      "supplier_name": "Proveedor ABC",
      "supplier_status": true,
      "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
      "user_name": "Pedro Sanchez"
    },
    "details": [
      {
        "id": 456,
        "purchase_id": 123,
        "product_id": "PROD_BANANA_001",
        "product_name": "Banana Premium",
        "quantity": 50.0,
        "unit_price": 7000.00,
        "subtotal": 350000.00,
        "sale_price": 9100.00,
        "profit_pct": 30.0,
        "unit": "kg",
        "tax_rate_id": 1,
        "tax_rate": 10.0,
        "exp_date": "2026-01-01T00:00:00Z",
        "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
        "user_name": "Pedro Sanchez",
        "line_total": 350000,
        "metadata": {}
      }
    ],
    "payments": {
      "total_paid": 350000.00,
      "outstanding_amount": 0,
      "payment_count": 1,
      "last_payment_date": "2025-11-18T10:05:00Z",
      "payment_status": "complete",
      "is_fully_paid": true
    },
    "cost_info": {
      "total_cost": 350000.00,
      "total_sale_value": 455000.00,
      "average_profit_pct": 30.0,
      "total_tax_amount": 35000.00
    },
    "metadata": {}
  }
]
```

#### 2.3. 🗂️ Por Nombre de Proveedor

**Endpoint:** `GET /purchase/supplier_name/{supplier_name}`

Obtiene todas las órdenes de compra para un proveedor específico por su nombre, con información enriquecida que incluye detalles financieros y un resumen de pagos.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `supplier_name` | string | ✅ Sí | Nombre del proveedor (URL-encoded). |

**Response (200 OK):**
*Retorna un array de objetos `PurchaseWithFullDetails` (ver sección "Modelos de Datos (JSON)").*

*La estructura de la respuesta es idéntica a la del endpoint `GET /purchase/supplier_id/{supplier_id}`.*

#### 2.4. 📅 Por Rango de Fechas

**Endpoint:** `GET /purchase/date_range/`

Obtiene órdenes de compra paginadas dentro de un rango de fechas, con información enriquecida que incluye detalles financieros y un resumen de pagos.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `start_date` | string | ✅ Sí | Fecha de inicio en formato `YYYY-MM-DD`. |
| `end_date` | string | ✅ Sí | Fecha de fin en formato `YYYY-MM-DD`. |
| `page` | number | ✅ Sí | Número de página a obtener. Mínimo: 1. |
| `page_size` | number | ✅ Sí | Cantidad de resultados por página. Máximo: 1000. |

**Response (200 OK):**
*Retorna un array de objetos `PurchaseWithFullDetails` (ver sección "Modelos de Datos (JSON)").*

*La estructura de la respuesta es idéntica a la del endpoint `GET /purchase/supplier_id/{supplier_id}`.*

#### 2.5. 🆔 Por ID de Orden y Nombre de Proveedor

**Endpoint:** `GET /purchase/{id}/supplier/{supplier_name}`

Obtiene una orden de compra específica, validando que pertenezca al proveedor indicado. Devuelve información enriquecida que incluye detalles financieros y un resumen de pagos.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | ID de la orden de compra. |
| `supplier_name` | string | ✅ Sí | Nombre del proveedor a validar (URL-encoded). |

**Response (200 OK):**
*Retorna un objeto `PurchaseWithFullDetails` (ver sección "Modelos de Datos (JSON)").*

*La estructura de la respuesta es idéntica a la de un elemento del array retornado por `GET /purchase/supplier_id/{supplier_id}`.*

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Purchase order does not belong to supplier` | 404 Not Found | La orden no pertenece al proveedor especificado. |
| `sql: no rows in result set` | 500 Internal Server Error | La orden de compra con el ID dado no existe. |

---

### 3. Cancelar Órdenes de Compra

#### 3.1. 🔍 Previsualizar Cancelación

**Endpoint:** `GET /purchase/{id}/preview-cancellation`

Analiza el impacto de cancelar una orden de compra **sin ejecutar la cancelación**. Devuelve información sobre el stock a revertir, pagos a cancelar y posibles problemas.

**Parámetros de URL:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | ID de la orden de compra a analizar. |

**Response (200 OK):**
*Ver modelo `PurchaseOrderCancellationPreviewResponse` en la sección "Modelos de Datos (JSON)".*
```json
{
  "success": true,
  "generated_at": "2025-09-22T15:29:57.762549-03:00",
  "purchase_info": {
    "purchase_order_id": 42,
    "supplier_name": "Proveedor ABC",
    "current_status": "PENDING",
    "total_amount": 14000.00
  },
  "stock_impact": [
    {
      "product_id": "Zyf1OBCNg",
      "product_name": "Shampoo Sedal Rizos Perfectos 500 ML",
      "quantity_to_revert": 1.0,
      "current_stock": 3.0,
      "stock_after_cancellation": 2.0,
      "sufficient_stock": true
    }
  ],
  "payment_impact": [],
  "impact_analysis": {
    "products_with_insufficient_stock": 0,
    "requires_payment_reversal": false,
    "requires_force_cancel": false
  },
  "can_be_cancelled": true,
  "cancellation_issues": [],
  "warnings": [],
  "recommendations": [
    "La orden puede cancelarse de forma segura sin problemas de stock."
  ]
}
```

#### 3.2. 🚫 Ejecutar Cancelación

**Endpoint:** `POST /purchase/cancel`

Cancela una orden de compra de forma definitiva. **Esta acción es irreversible**. Revierte el stock, cancela los pagos asociados y actualiza el estado de la orden.

**Request Body:**
*Ver modelo `PurchaseOrderCancellationRequest` en la sección "Modelos de Datos (JSON)".*
```json
{
  "purchase_order_id": 38,
  "user_id": "2prrJIgRvgaFVbuu49ua9QJVu8n",
  "cancellation_reason": "Cliente canceló pedido",
  "force_cancel": false
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `purchase_order_id` | number | ✅ Sí | ID de la orden a cancelar. |
| `user_id` | string | ✅ Sí | ID del usuario que realiza la operación (extraído del token). |
| `cancellation_reason` | string | ❌ No | Motivo de la cancelación. Recomendado para auditoría. |
| `force_cancel` | boolean | ❌ No | Si es `true`, permite la cancelación aunque el stock sea insuficiente (puede generar stock negativo). Default: `false`. |

**Response (200 OK):**
*Ver modelo `PurchaseOrderCancellationResponse` en la sección "Modelos de Datos (JSON)".*
```json
{
  "success": true,
  "message": "Purchase order cancelled successfully",
  "cancelled_order_id": 38,
  "cancellation_details": {
    "items_reverted": 1,
    "stock_items_updated": 1,
    "payments_cancelled": 0,
    "cancelled_at": "2025-09-22T15:29:21.577672Z",
    "cancelled_by": "2prrJIgRvgaFVbuu49ua9QJVu8n",
    "force_cancel_used": false,
    "tax_warnings_preserved": 0
  }
}
```

**Nota sobre datos fiscales:**
La cancelación preserva automáticamente los datos fiscales para auditoría:
- `tax_discrepancy_warnings`: Advertencias de discrepancia de tasas de IVA
- `tax_rate_id`: ID de la tasa de IVA aplicada
- `applied_tax_rate`: Tasa de IVA aplicada en cada línea
- Todos los datos fiscales se registran en `stock_transactions.metadata`

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `PURCHASE_ORDER_ALREADY_CANCELLED` | 400 Bad Request | La orden de compra ya ha sido cancelada previamente. |
| `INSUFFICIENT_STOCK` | 400 Bad Request | No hay suficiente stock para revertir la compra. Se requiere `force_cancel: true`. |
| `Purchase order not found` | 404 Not Found | El ID de la orden de compra no existe. |

---

## 📊 Modelos de Datos (JSON)

A continuación se presentan las estructuras de datos clave en formato JSON.

### PurchaseOrderRequest
```json
{
  "supplier_id": "number",
  "status": "string",
  "order_details": [
    {
      "product_id": "string",
      "quantity": "number",
      "unit_price": "number",
      "unit": "string",
      "profit_pct": "number",
      "tax_rate_id": "number"
    }
  ],
  "payment_method_id": "number",
  "currency_id": "number",
  "auto_update_prices": "boolean",
  "default_profit_margin": "number",
  "metadata": "object"
}
```

### PurchaseOrderCreationResponse
```json
{
  "success": "boolean",
  "purchase_order_id": "number",
  "total_amount": "number",
  "items_processed": "number",
  "cost_entries_created": "number",
  "prices_updated": "number",
  "message": "string"
}
```

### PurchaseRiched

```json
{
  "id": "number",
  "order_date": "string (ISO 8601)",
  "total_amount": "number",
  "status": "string",
  "supplier_id": "number",
  "supplier_name": "string",
  "supplier_status": "boolean",
  "user_id": "string",
  "user_name": "string",
  "payment_method_id": "number | null",
  "payment_method": "string",
  "currency_id": "number | null",
  "currency": "string",
  "metadata": "object"
}
```

### PurchaseWithFullDetails

```json
{
  "purchase": "PurchaseRiched",
  "details": "array (PurchaseItemFullRiched)",
  "payments": "PurchasePaymentSummary",
  "cost_info": "PurchaseCostInfo",
  "metadata": "object"
}
```

### PurchaseItemFullRiched
```json
{
  "id": "number",
  "purchase_id": "number",
  "product_id": "string",
  "product_name": "string",
  "quantity": "number",
  "unit_price": "number",
  "subtotal": "number",
  "sale_price": "number",
  "profit_pct": "number",
  "unit": "string",
  "tax_rate_id": "number",
  "tax_rate": "number",
  "exp_date": "string (ISO 8601)",
  "user_id": "string",
  "user_name": "string",
  "line_total": "number",
  "metadata": "PurchaseOrderDetailMetadata"
}
```

### PurchaseOrderDetailMetadata
Estructura del metadata almacenado en cada detalle de orden de compra. Esta estructura es definida por el backend al procesar la orden.

```json
{
  "unit": "string",
  "profit_pct": "number",
  "sale_price": "number",
  "line_total": "number",
  "tax_rate": "number"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `unit` | string | Unidad de medida del producto (ej: `kg`, `unit`). |
| `profit_pct` | number | Porcentaje de margen de ganancia aplicado. |
| `sale_price` | number | Precio de venta calculado (redondeado para PYG). |
| `line_total` | number | Total de la línea (quantity * unit_price). |
| `tax_rate` | number | Tasa de impuesto aplicada (0.00 si no aplica). |

### PurchasePaymentSummary
```json
{
  "total_paid": "number",
  "outstanding_amount": "number",
  "payment_count": "number",
  "last_payment_date": "string (ISO 8601)",
  "payment_status": "string",
  "is_fully_paid": "boolean"
}
```

### PurchaseCostInfo
```json
{
  "total_cost": "number",
  "total_sale_value": "number",
  "average_profit_pct": "number",
  "total_tax_amount": "number",
  "currency_id": "number",
  "currency_code": "string",
  "payment_method_id": "number",
  "payment_method_name": "string"
}
```

### PurchaseOrderCancellationPreviewResponse
```json
{
  "success": "boolean",
  "generated_at": "string (ISO 8601)",
  "purchase_info": {
    "purchase_order_id": "number",
    "supplier_name": "string",
    "current_status": "string",
    "total_amount": "number"
  },
  "stock_impact": [
    {
      "product_id": "string",
      "product_name": "string",
      "quantity_to_revert": "number",
      "current_stock": "number",
      "stock_after_cancellation": "number",
      "sufficient_stock": "boolean"
    }
  ],
  "payment_impact": "array",
  "impact_analysis": {
    "products_with_insufficient_stock": "number",
    "requires_payment_reversal": "boolean",
    "requires_force_cancel": "boolean"
  },
  "can_be_cancelled": "boolean",
  "cancellation_issues": "array",
  "warnings": "array",
  "recommendations": "array"
}
```

### PurchaseOrderCancellationRequest
```json
{
  "purchase_order_id": "number",
  "user_id": "string",
  "cancellation_reason": "string",
  "force_cancel": "boolean"
}
```

### PurchaseOrderCancellationResponse
```json
{
  "success": "boolean",
  "message": "string",
  "cancelled_order_id": "number",
  "cancellation_details": {
    "items_reverted": "number",
    "stock_items_updated": "number",
    "payments_cancelled": "number",
    "cancelled_at": "string (ISO 8601)",
    "cancelled_by": "string",
    "force_cancel_used": "boolean",
    "tax_warnings_preserved": "number"
  }
}
```

**Campos de cancelación actualizados (v2.6):**
El campo `tax_warnings_preserved` indica cuántas advertencias de discrepancia fiscal se preservaron para auditoría. Los datos fiscales completos (`tax_rate_id`, `applied_tax_rate`) se registran en las transacciones de stock para cumplimiento fiscal.

---

## 🔍 Lógica de Negocio y Reglas

### IVA en Precios de Compra (Contexto Paraguay)

> **"El precio del proveedor YA incluye IVA"**

- **Regla Clave**: En Paraguay, los precios de los proveedores para negocios generalmente ya incluyen el IVA. El sistema está diseñado bajo esta premisa.
- **Cálculo de Precio de Venta**: El sistema calcula el precio de venta aplicando el margen de ganancia (`profit_pct`) directamente sobre el costo unitario (`unit_price`), que ya tiene el IVA.
- **Fórmula Correcta**: `precio_venta = costo_unitario * (1 + margen / 100)`
- **Función del IVA en el Sistema**: El campo `tax_rate` se almacena con fines de registro fiscal y auditoría, pero **no se usa para calcular el precio de venta final** y así evitar una doble imposición de impuestos.

### Carga de producto en UI

Para la pantalla de compra, la UI debe consultar el producto con:

- `GET /products/{id}/purchase` para detalle operativo.
- `GET /products/{id}/info` para detalle general.

### Auto-Pricing
- Si `auto_update_prices` es `true`, el sistema crea o actualiza un registro en `products.unit_prices` después de una compra.
- **Protección de precios**: Por defecto, el sistema no reducirá un precio de venta existente si una nueva compra tiene un costo menor.

### Cancelación de Órdenes
- **Stock**: La cancelación revierte el ingreso de stock. Si los productos ya se vendieron, el stock puede volverse negativo si se usa `force_cancel: true`.
- **Pagos**: Los pagos asociados a la orden se marcan como `CANCELLED`, pero esto no inicia un reembolso monetario real. Es un cambio de estado interno.
- **Irreversibilidad**: Una vez cancelada, una orden no puede ser reactivada.

---

## 🔐 Autenticación y Permisos

### Obtención de Token
Para interactuar con la API, se debe obtener un token JWT a través del endpoint `POST /login`.

**Request Body (`POST /login`):**
```json
{
  "email": "testuser@example.com",
  "password": "test123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role_id": "JZkiQB"
}
```

### Permisos Requeridos
Las operaciones en esta API pueden requerir los siguientes permisos, dependiendo del rol del usuario:
- `purchase_orders:create`
- `purchase_orders:read`
- `purchase_orders:cancel`
- `stock:adjust`
- `prices:auto_update`
