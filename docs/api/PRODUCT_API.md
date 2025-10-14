# 🛍️ API de Productos

**Versión:** 2.2.0
**Fecha:** 13 de Octubre de 2025
**Endpoint Base:** `http://localhost:5050`

## 📝 Historial de Cambios

### v2.2.0 - 13 de Octubre de 2025
- ✅ **Refactorización Estricta**: Documentación 100% alineada con la guía `FRONTEND_API_DOCUMENTATION_GUIDE.md`.

- ✅ **Ejemplos Completos**: Se expandieron todos los ejemplos de JSON para ser completos y realistas.
- ✅ **Endpoints Individuales**: Se eliminaron las tablas de resumen de endpoints; cada endpoint ahora está documentado individualmente con todos sus detalles.
- ✅ **Documentación de Errores**: Se aseguró que cada endpoint tenga su tabla de `Errores Posibles`.


### v2.1.0 - 13 de Octubre de 2025

### v2.0.0 - 9 de Septiembre, 2025

- ✅ **Agregado**: Endpoints de productos financieramente enriquecidos (`/products/financial/*`).



Esta API gestiona todos los aspectos de los productos, desde su creación básica hasta la consulta de datos financieros complejos. Permite manejar productos físicos y servicios, gestionar stock, precios, costos y más.


---



### Base URL

```

```


### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>

```


---

## 📦 Estructuras de Datos (Modelos)

### Producto Enriquecido (`ProductEnriched`)
Contiene información completa del producto, ideal para la mayoría de las interfaces de usuario.



| Campo | Tipo | Descripción |

|-------|------|-------------|
| `id` | string | ID único del producto |
| `name` | string | Nombre del producto |
| `barcode` | string \| null | Código de barras |
| `state` | boolean | Estado (activo/inactivo) |
| `category` | object | Objeto de la categoría (`{id, name}`) |
| `product_type` | string | `PHYSICAL` \| `SERVICE` |
| `origin` | string \| null | `NACIONAL` \| `IMPORTADO` |
| `brand` | string \| null | Marca del producto |
| `purchase_price`| number | Precio de compra |
| `stock_quantity`| number \| null | Cantidad en stock |
| `stock_status` | string | `in_stock`, `low_stock`, `out_of_stock`, etc. |
| `unit_prices` | array | Lista de precios por unidad |
| `description` | string \| null | Descripción del producto |
| `price_formatted`| string | Precio formateado (ej: "PYG 15,000") |


### Producto Financieramente Enriquecido (`ProductFinancialEnriched`)

La estructura más completa, con análisis financiero.


| Campo | Tipo | Descripción |
|-------|------|-------------|
| `product_id` | string | ID único del producto |
| `product_name` | string | Nombre del producto |
| `barcode` | string \| null | Código de barras |
| `state` | boolean | Estado (activo/inactivo) |
| `category` | object | Objeto de la categoría (`{id, name}`) |
| `product_type` | string | `PHYSICAL` \| `SERVICE` |
| `origin` | string \| null | `NACIONAL` \| `IMPORTADO` |
| `brand` | string \| null | Marca del producto |
| `unit_prices` | array | Lista de precios de venta por unidad |
| `unit_costs_summary` | array | Resumen de costos por unidad (`{last_cost, weighted_avg_cost_6m}`) |
| `stock_quantity`| number \| null | Cantidad en stock |
| `financial_health` | object | Indicadores de salud financiera (`{has_prices, has_costs, has_stock}`) |
| `best_margin_unit` | string \| null | Unidad con el mejor margen de ganancia |
| `best_margin_percent` | number \| null | Porcentaje del mejor margen encontrado |


---



## 🛍️ Endpoints de Productos



### 1. Crear Producto

**Endpoint:** `POST /products`

Crea un nuevo producto en el sistema.

**Request Body:**
```json
{
  "name": "Coca-Cola 2L",
  "barcode": "7891234567890",
  "id_category": 10,
  "product_type": "PHYSICAL",
  "description": "Gaseosa Coca-Cola 2 litros",
  "purchase_price": 8500,
  "origin": "IMPORTADO",
  "brand": "Coca-Cola"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ Sí | Nombre del producto |

| `id_category` | number | ✅ Sí | ID de la categoría |

| `purchase_price`| number | ✅ Sí | Precio de compra del producto |
| `description` | string | ✅ Sí | Descripción del producto |
| `barcode` | string | ❌ No | Código de barras (máx 50 caracteres) |
| `product_type` | string | ❌ No | `PHYSICAL` o `SERVICE`. Default: `PHYSICAL` |
| `origin` | string | ❌ No | Origen: `NACIONAL` o `IMPORTADO` |
| `brand` | string | ❌ No | Marca del producto (máx 100 caracteres) |

**Response (201 Created):**
```json
{

  "success": true,
  "message": "Product and description added successfully",
  "data": {
    "id": "clw2s0q5j00003b6k8z4h9j2g"
  }
}
```


**Errores Posibles:**



| Error | HTTP Status | Descripción |

|-------|-------------|-------------|
| `Invalid request body` | 400 | El cuerpo de la solicitud es inválido. |
| `El origen debe ser NACIONAL o IMPORTADO` | 400 | Valor incorrecto para el campo `origin`. |
| `Internal server error` | 500 | Error interno al crear el producto. |

---

### 2. Actualizar Producto
**Endpoint:** `PUT /products/:id`


Actualiza la información de un producto existente.


**Request Body:**
```json
{
  "name": "Coca-Cola 2L - Edición Especial",
  "state": true,

  "id_category": 10,

  "description": "Gaseosa Coca-Cola 2 litros - Edición especial",
  "origin": "NACIONAL",
  "brand": "Coca-Cola"
}


**Response (200 OK):**

```json

{

  "success": true,

  "message": "Product and description updated successfully"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Product not found` | 404 | El producto con el ID especificado no existe. |
| `El origen debe ser NACIONAL o IMPORTADO` | 400 | Valor incorrecto para el campo `origin`. |

---

### 3. Obtener Producto Enriquecido por ID
**Endpoint:** `GET /products/:id`

Obtiene un producto **enriquecido** con información completa.

**Response (200 OK):**
```json
{
  "id": "clw2s0q5j00003b6k8z4h9j2g",
  "name": "Coca-Cola 2L",
  "barcode": "7891234567890",
  "state": true,
  "category": {

    "id": 10,

    "name": "Bebidas"
  },
  "product_type": "PHYSICAL",

  "brand": "Coca-Cola",
  "purchase_price": 8500.0,

  "stock_quantity": 50,

  "description": "Gaseosa Coca-Cola 2 litros",

  "price_formatted": "PYG 12,000",

  "stock_status": "in_stock",
  "unit_prices": [
    {
      "unit": "unit",
      "price_per_unit": 12000
    }
  ]
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Product not found` | 404 | El producto con el ID especificado no existe. |

---

### 4. Obtener Producto Financiero por ID
**Endpoint:** `GET /products/financial/:id`

Obtiene un producto **financieramente enriquecido** con análisis de costos y márgenes.

**Response (200 OK):**
```json
{
  "product_id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  "product_name": "Onion - Dried",
  "barcode": null,
  "state": true,
  "category": {
    "id": 1,
    "name": "Vegetables"
  },
  "product_type": "PHYSICAL",
  "origin": "NACIONAL",
  "brand": "Genérica",
  "unit_prices": [
    {

      "id": 18,

      "product_id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
      "unit": "unit",
      "price_per_unit": 24.05

  ],
  "unit_costs_summary": [

    {

      "unit": "unit",

      "last_cost": 18.50,

      "last_purchase_date": "2025-09-04T13:08:47.529294Z",

      "weighted_avg_cost_6m": 18.50
    }
  ],
  "stock_quantity": 50.0,
  "financial_health": {
    "has_prices": true,
    "has_costs": true,
    "has_stock": true
  },
  "best_margin_unit": "unit",
  "best_margin_percent": 23.06
}

```


**Errores Posibles:**


|-------|-------------|-------------|
| `Product not found` | 404 | El producto con el ID especificado no existe. |

### 5. Buscar Producto Enriquecido por Nombre

**Endpoint:** `GET /products/name/:name`

Busca productos enriquecidos por nombre (búsqueda parcial).

*Retorna un array de objetos `ProductEnriched`.*
```json

[

  {

    "id": "clw2s0q5j00003b6k8z4h9j2g",

    "name": "Coca-Cola 2L",
    "origin": "IMPORTADO",
    "brand": "Coca-Cola",
    "stock_quantity": 50,
    "stock_status": "in_stock"
  }

]

```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|

| `No products found` | 404 | No se encontraron productos que coincidan. |






Obtiene **todos** los productos enriquecidos sin paginación. Útil para selectores.



**Response (200 OK):**
*Retorna un array de objetos `ProductEnriched`.*


**Errores Posibles:**

| Error | HTTP Status | Descripción |

| `Internal server error` | 500 | Error al consultar la base de datos. |


---

### 7. Eliminar Producto
**Endpoint:** `DELETE /products/:id`

Realiza una eliminación lógica del producto.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product and description deleted successfully"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| `Product not found` | 404 | El producto con el ID especificado no existe. |

---

## 🔍 Validaciones y Reglas de Negocio

### Campo `origin`
- **Valores permitidos**: `"NACIONAL"` o `"IMPORTADO"` (mayúsculas).
- Si se envía otro valor, la API retornará un error 400.

### Campo `brand`
- **Longitud máxima**: 100 caracteres.

---

## 🎯 Recomendaciones de Implementación

### Cuándo Usar Cada Tipo de Producto

1.  **Para Análisis Financiero y Administración:**
    - Usa los endpoints **financieramente enriquecidos** (`/products/financial/*`).
    - **Casos de uso**: Reportes de rentabilidad, dashboards de gestión, análisis de costos y márgenes.

2.  **Para Interfaces de Usuario Generales:**
    - Usa los endpoints **enriquecidos** (`/products/name/*`, `/products/:id`, etc.).
    - **Casos de uso**: Catálogos de productos, puntos de venta (POS), selectores de productos.

---

## ❌ Códigos de Error Comunes

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `Product not found` | 404 | El recurso no existe. | Verificar el ID o código de barras. |
| `Invalid request body` | 400 | Los datos enviados son incorrectos. | Validar la estructura y tipos de datos. |
| `Unauthorized` | 401 | Token JWT inválido o ausente. | Verificar que el token se esté enviando. |
| `Internal server error` | 500 | Error en el servidor. | Reportar el error al equipo de backend. |