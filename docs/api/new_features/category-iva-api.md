# 📂 API de Categorías e IVA (Impuesto al Valor Agregado)

**Versión:** 1.1
**Fecha:** Marzo 2026
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Este módulo gestiona la **organización de productos mediante categorías** y la **configuración de tasas impositivas (IVA)** según la legislación de Paraguay (Ley 6380/2019).

### Características Principales

- **Categorías Jerárquicas**: Soporte para categorías padre e hijo con herencia fiscal.
- **Tasas de IVA Predefinidas**: IVA 10%, IVA 5%, Exento, ISC.
- **Herencia Fiscal**: Los productos heredan automáticamente el IVA de su categoría.
- **Operaciones por Tipo**: NACIONAL, CANASTA (básicos), EXEMPT, IMPORT, DIGITAL, SELECTIVE.
- **CRUD Completo**: Crear, leer, actualizar y eliminar categorías y tasas de IVA.

---

## 🗂️ Categorías de Productos

Las categorías permiten organizar el catálogo y definir comportamientos por defecto para los productos.

### 1. Obtener Todas las Categorías

**Endpoint:** `GET /category/`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electrónicos",
      "description": "Productos electrónicos y tecnología",
      "default_tax_rate_id": 1,
      "parent_id": null,
      "is_active": true,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### 2. Obtener Categoría por ID

**Endpoint:** `GET /category/{id}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la categoría |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Electrónicos",
  "description": "Productos electrónicos y tecnología",
  "default_tax_rate_id": 1,
  "parent_id": null,
  "is_active": true,
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z"
}
```

**Error (404):**
```json
{
  "error": "Categoría no encontrada"
}
```

---

### 3. Crear Categoría

**Endpoint:** `POST /category/`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Lácteos",
  "description": "Productos lácteos y derivados",
  "default_tax_rate_id": 2,
  "parent_id": null
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la categoría |
| `description` | string | No | Descripción de la categoría |
| `default_tax_rate_id` | int | No | ID de la tasa de IVA por defecto |
| `parent_id` | int | No | ID de la categoría padre (para jerarquía) |

**Response (201 Created):**
```json
{
  "message": "Categoría creada exitosamente"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | El nombre es requerido / JSON inválido |
| 401 | Token JWT inválido o ausente |
| 500 | Error al crear categoría |

---

### 4. Actualizar Categoría

**Endpoint:** `PUT /category/{id}`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la categoría a actualizar |

**Request Body:**
```json
{
  "name": "Lácteos y Derivados",
  "description": "Productos lácteos actualizados",
  "default_tax_rate_id": 3,
  "parent_id": 5,
  "is_active": true
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | No | Nombre de la categoría |
| `description` | string | No | Descripción de la categoría |
| `default_tax_rate_id` | int | No | ID de la tasa de IVA por defecto |
| `parent_id` | int | No | ID de la categoría padre |
| `is_active` | bool | No | Estado activo/inactivo |

**Response (200 OK):**
```json
{
  "message": "Categoría actualizada exitosamente"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | ID inválido / JSON inválido |
| 401 | Token JWT inválido o ausente |
| 404 | Categoría no encontrada |
| 500 | Error al actualizar categoría |

---

### 5. Eliminar Categoría (Soft Delete)

**Endpoint:** `DELETE /category/{id}`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la categoría a eliminar |

**Response (200 OK):**
```json
{
  "message": "Categoría eliminada exitosamente"
}
```

**Nota:** La eliminación es lógica (soft delete). La categoría se marca como `is_active = false` y permanece en la base de datos.

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | ID inválido |
| 401 | Token JWT inválido o ausente |
| 404 | Categoría no encontrada |
| 500 | Error al eliminar categoría |

---

## 💰 Tasas de IVA (Tax Rates)

El sistema automatiza el desglose de IVA incluido y el cálculo de precios.

### Tasas Configuradas

| Código | Tasa | Operation Type | Aplicación Común |
|--------|------|----------------|------------------|
| **IVA10** | 10% | NACIONAL | Electrónicos, indumentaria, servicios |
| **IVA5** | 5% | CANASTA | Productos básicos (leche, arroz, carne) |
| **EXENTO** | 0% | EXEMPT | Libros, exportaciones, educación |
| **ISC** | Variable | SELECTIVE | Productos selectivos (alcohol, tabaco) |
| **IVA_DIGITAL** | 10% | DIGITAL | Servicios digitales |
| **IMPORT** | Variable | IMPORT | Importaciones |

### Jerarquía de Aplicación

1. **Producto Individual**: Verifica si tiene `override_tax_rate_id`.
2. **Categoría**: Si no hay override, usa `default_tax_rate_id` de su categoría.
3. **Fallback Global**: Si no hay ninguno, aplica **IVA 10%** por defecto.

---

### 1. Obtener Tasas de IVA (Paginado)

**Endpoint:** `GET /tax_rate/{page}/{pageSize}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | - | Número de página (mínimo 1) |
| `pageSize` | int | - | Elementos por página (máximo 100) |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "tax_name": "IVA General",
    "code": "IVA10",
    "rate": 10.0,
    "country": "PY",
    "jurisdiction_type": "NATIONAL",
    "operation_type": "NACIONAL",
    "description": "Impuesto al Valor Agregado - Tasa General",
    "effective_start": "2024-01-01T00:00:00Z",
    "effective_end": null,
    "is_default": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Obtener Tasa de IVA por ID

**Endpoint:** `GET /tax_rate/{id}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la tasa de IVA |

**Response (200 OK):**
```json
{
  "id": 1,
  "tax_name": "IVA General",
  "code": "IVA10",
  "rate": 10.0,
  "country": "PY",
  "jurisdiction_type": "NATIONAL",
  "operation_type": "NACIONAL",
  "description": "Impuesto al Valor Agregado - Tasa General",
  "effective_start": "2024-01-01T00:00:00Z",
  "effective_end": null,
  "is_default": true,
  "is_active": true
}
```

---

### 3. Obtener Tasa de IVA por Código

**Endpoint:** `GET /tax_rate/code/{code}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Código de la tasa (IVA10, IVA5, EXENTO, etc.) |

**Códigos Válidos:**
- `IVA10` - IVA General 10%
- `IVA5` - IVA Canasta Básica 5%
- `EXENTO` - Exento de IVA
- `ISC` - Impuesto Selectivo al Consumo
- `IVA_DIGITAL` - IVA para servicios digitales
- `IMPORT` - Importación

---

### 4. Obtener Tasa por Nombre

**Endpoint:** `GET /tax_rate/name/{name}`

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `name` | string | Nombre de la tasa (búsqueda parcial) |

---

### 5. Obtener Tasa por Defecto

**Endpoint:** `GET /tax_rate/default`

Retorna la tasa de IVA configurada como default del sistema.

**Response (200 OK):**
```json
{
  "id": 1,
  "tax_name": "IVA General",
  "code": "IVA10",
  "rate": 10.0,
  "is_default": true
}
```

---

### 6. Crear Tasa de IVA

**Endpoint:** `POST /tax_rate/`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tax_name": "IVA Especial",
  "code": "IVA_ESPECIAL",
  "rate": 8.5,
  "country": "PY",
  "jurisdiction_type": "NATIONAL",
  "operation_type": "NACIONAL",
  "description": "Tasa especial para productos específicos",
  "effective_start": "2026-03-01",
  "effective_end": null,
  "is_default": false,
  "is_active": true
}
```

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tax_name` | string | Sí | Nombre descriptivo de la tasa |
| `code` | string | Sí | Código único (IVA10, IVA5, EXENTO, etc.) |
| `rate` | float | Sí | Porcentaje de la tasa (0-100) |
| `country` | string | Sí | País (PY para Paraguay) |
| `jurisdiction_type` | string | Sí | Tipo de jurisdicción (NATIONAL, STATE, LOCAL) |
| `operation_type` | string | Sí | Tipo de operación |
| `description` | string | No | Descripción detallada |
| `effective_start` | string | Sí | Fecha de vigencia (YYYY-MM-DD) |
| `effective_end` | string | No | Fecha de fin de vigencia |
| `is_default` | bool | No | Si es la tasa por defecto (default: false) |
| `is_active` | bool | No | Si está activa (default: true) |

**Response (200 OK):**
```json
{
  "message": "Tax rate added"
}
```

---

### 7. Actualizar Tasa de IVA

**Endpoint:** `PUT /tax_rate/{id}`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tax_name": "IVA General Actualizado",
  "rate": 10.5,
  "description": "Nueva descripción",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "message": "Tax rate updated"
}
```

---

### 8. Eliminar Tasa de IVA (Soft Delete)

**Endpoint:** `DELETE /tax_rate/{id}`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la tasa de IVA a eliminar |

**Response (200 OK):**
```json
{
  "message": "Tasa de IVA eliminada exitosamente"
}
```

**Nota:** La eliminación es lógica (soft delete). La tasa se marca como `is_active = false` y permanece en la base de datos.

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | ID inválido |
| 401 | Token JWT inválido o ausente |
| 404 | Tasa de IVA no encontrada |
| 500 | Error al eliminar tasa de IVA |

---

## 🧮 Fórmulas de Cálculo de IVA

### Desglose de Precio (Precio con IVA → Precio Neto)

```
Precio Neto = Precio Total / (1 + Tasa IVA)
IVA Incluido = Precio Total - Precio Neto
```

**Ejemplo (IVA 10%):**
```
Precio Total: ₲ 110.000
Precio Neto: 110.000 / 1.10 = ₲ 100.000
IVA: 110.000 - 100.000 = ₲ 10.000
```

### Cálculo de Precio Sugerido

```
Precio Venta = (Costo Neto + Margen) × (1 + Tasa IVA)
```

**Ejemplo:**
```
Costo Neto: ₲ 80.000
Margen: 25% → ₲ 20.000
Subtotal: ₲ 100.000
IVA 10%: ₲ 10.000
Precio Final: ₲ 110.000
```

---

## 🔗 Integración con Ventas y Compras

### En Compras

| Campo | Descripción |
|-------|-------------|
| `unit_price_without_tax` | Precio neto (crédito fiscal) |
| `unit_price_with_tax` | Precio de factura (con IVA) |
| `tax_amount` | Monto del IVA |
| `applied_tax_rate` | Tasa aplicada |

### En Ventas

| Campo | Descripción |
|-------|-------------|
| `unit_price` | Precio con IVA incluido |
| `unit_price_without_tax` | Precio neto (sin IVA) |
| `tax_amount` | IVA de la línea |
| `applied_tax_rate` | Tasa aplicada |

---

## 🔒 Autenticación

Todos los endpoints requieren autenticación JWT. No hay endpoints públicos.

### Headers Requeridos

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## ❌ Manejo de Errores

| Código | Descripción |
|--------|-------------|
| 401 | Token JWT inválido o ausente |
| 404 | Tasa de IVA o categoría no encontrada |
| 400 | Datos de entrada inválidos |
| 500 | Error interno del servidor |

**Ejemplo de Error:**
```json
{
  "error": "Tax rate not found"
}
```

---

## 📊 Resumen de Endpoints

### Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/category/` | Obtener todas las categorías |
| GET | `/category/{id}` | Obtener categoría por ID |
| POST | `/category/` | Crear nueva categoría |
| PUT | `/category/{id}` | Actualizar categoría |
| DELETE | `/category/{id}` | Eliminar categoría (soft delete) |

### Tasas de IVA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tax_rate/{page}/{pageSize}` | Obtener tasas paginadas |
| GET | `/tax_rate/{id}` | Obtener tasa por ID |
| GET | `/tax_rate/code/{code}` | Obtener tasa por código |
| GET | `/tax_rate/name/{name}` | Obtener tasa por nombre |
| GET | `/tax_rate/default` | Obtener tasa por defecto |
| POST | `/tax_rate/` | Crear nueva tasa |
| PUT | `/tax_rate/{id}` | Actualizar tasa |
| DELETE | `/tax_rate/{id}` | Eliminar tasa (soft delete) |

---

## 📝 Historial de Cambios

### v1.1 - Marzo 2026
- **CRUD completo para Categorías**: Agregados endpoints GET by ID, PUT, DELETE.
- **CRUD completo para Tasas de IVA**: Agregado endpoint DELETE.
- **Mejora en creación de categorías**: Ahora permite asignar `default_tax_rate_id` y `parent_id`.
- **Soft delete**: Ambos módulos usan eliminación lógica (`is_active = false`).
- **Corrección de rutas**: Endpoint `/categories` cambiado a `/category/` con subrouter.

### v1.0 - Marzo 2026
- Documentación inicial unificada de Categorías e IVA.
- Actualización con campos de IVA desglosados en ventas y compras.
- Soporte para multi-moneda con tasas de IVA.