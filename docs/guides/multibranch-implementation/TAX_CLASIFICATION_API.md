# Guía de API de Clasificación Fiscal para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

---

## Endpoints

### GET /tax-classification/info

**Descripción:** Obtiene información de los códigos de clasificación fiscal SIFEN.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo | Tipo  | Descripción                       |
| ----- | ----- | --------------------------------- |
| data  | array | Lista de códigos de clasificación |

**Clasificación:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| code | string | Código SIFEN |
| name | string | Nombre |
| description | string | Descripción |
| default_tax_rate_id | int | ID de tasa default |
| default_tax_rate_code | string | Código de tasa default |
| default_rate_percent | float | Porcentaje default |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### GET /tax-classification/defaults

**Descripción:** Obtiene las tasas impositivas default por clasificación.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo | Tipo   | Descripción                   |
| ----- | ------ | ----------------------------- |
| data  | object | Mapa de código → tasa default |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### GET /tax-classification/{id}

**Descripción:** Obtiene una clasificación fiscal por ID.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo               | Tipo     | Descripción                      |
| ------------------- | -------- | -------------------------------- |
| id                  | int      | ID de la clasificación           |
| product_id          | string   | ID del producto                  |
| classification_code | string   | Código SIFEN                     |
| default_tax_rate_id | int      | ID de tasa default               |
| effective_from      | datetime | Fecha inicio de vigencia         |
| effective_to        | datetime | Fecha fin de vigencia (nullable) |
| notes               | string   | Notas                            |
| created_by          | string   | Usuario creador                  |
| created_at          | datetime | Fecha de creación                |
| updated_at          | datetime | Fecha de actualización           |

#### Errores

| Código | Condición                   |
| ------ | --------------------------- |
| 400    | `id` inválido               |
| 401    | Token ausente o inválido    |
| 404    | Clasificación no encontrada |
| 500    | Error interno               |

---

### GET /tax-classification/product/{product_id}

**Descripción:** Obtiene la clasificación fiscal activa de un producto.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo               | Tipo     | Descripción            |
| ------------------- | -------- | ---------------------- |
| id                  | int      | ID de la clasificación |
| product_id          | string   | ID del producto        |
| classification_code | string   | Código SIFEN           |
| default_tax_rate_id | int      | ID de tasa default     |
| effective_from      | datetime | Fecha inicio           |
| effective_to        | datetime | Fecha fin (nullable)   |
| notes               | string   | Notas                  |

#### Errores

| Código | Condición                              |
| ------ | -------------------------------------- |
| 400    | `product_id` vacío                     |
| 401    | Token ausente o inválido               |
| 404    | Producto no tiene clasificación activa |
| 500    | Error interno                          |

---

### GET /tax-classification/code/{code}

**Descripción:** Lista clasificaciones por código SIFEN.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción                                                                         |
| --------- | ------ | --------- | ----------------------------------------------------------------------------------- |
| code      | string | Sí        | Código: `CANASTA`, `GENERAL`, `EXENTO`, `IMPORT`, `DIGITAL`, `TURISMO`, `SELECTIVE` |

#### Response 200

| Campo | Tipo  | Descripción                             |
| ----- | ----- | --------------------------------------- |
| data  | array | Lista de clasificaciones con ese código |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 400    | `code` vacío             |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### POST /tax-classification/assign

**Descripción:** Asigna una clasificación fiscal a un producto.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo     | Requerido | Descripción                                                    |
| ------------------- | -------- | --------- | -------------------------------------------------------------- |
| product_id          | string   | Sí        | ID del producto                                                |
| classification_code | string   | Sí        | Código SIFEN                                                   |
| tax_rate_id         | int      | No        | ID de tasa específica. Si se omite, usa la default del código. |
| effective_from      | datetime | No        | Fecha inicio de vigencia. Default: fecha actual.               |
| effective_to        | datetime | No        | Fecha fin de vigencia                                          |
| notes               | string   | No        | Notas                                                          |

#### Response 201

| Campo               | Tipo   | Descripción                   |
| ------------------- | ------ | ----------------------------- |
| id                  | int    | ID de la clasificación creada |
| product_id          | string | ID del producto               |
| classification_code | string | Código asignado               |
| tax_rate_id         | int    | ID de tasa aplicada           |
| message             | string | Confirmación                  |

#### Errores

| Código | Condición                                            |
| ------ | ---------------------------------------------------- |
| 400    | Body inválido, `product_id` vacío, o código inválido |
| 401    | Token ausente o inválido                             |
| 404    | Producto no encontrado                               |
| 409    | El producto ya tiene una clasificación activa        |
| 500    | Error interno                                        |

---

### POST /tax-classification/bulk-assign

**Descripción:** Asigna clasificaciones fiscales a múltiples productos.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo   | Requerido | Descripción               |
| ------------------- | ------ | --------- | ------------------------- |
| product_ids         | array  | Sí        | Lista de IDs de productos |
| classification_code | string | Sí        | Código SIFEN a asignar    |
| tax_rate_id         | int    | No        | ID de tasa específica     |
| notes               | string | No        | Notas                     |

#### Response 200

| Campo           | Tipo  | Descripción                      |
| --------------- | ----- | -------------------------------- |
| success         | bool  | `true`                           |
| processed_count | int   | Cantidad de productos procesados |
| failed_count    | int   | Cantidad de fallidos             |
| failures        | array | Lista de errores por producto    |

#### Errores

| Código | Condición                   |
| ------ | --------------------------- |
| 400    | Body inválido o lista vacía |
| 401    | Token ausente o inválido    |
| 500    | Error interno               |

---

### POST /tax-classification/auto-classify

**Descripción:** Clasifica automáticamente productos según su categoría.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo   | Requerido | Descripción        |
| ------------------- | ------ | --------- | ------------------ |
| category_id         | int    | Sí        | ID de la categoría |
| classification_code | string | Sí        | Código a asignar   |

#### Response 200

| Campo            | Tipo   | Descripción            |
| ---------------- | ------ | ---------------------- |
| success          | bool   | `true`                 |
| classified_count | int    | Productos clasificados |
| message          | string | Confirmación           |

#### Errores

| Código | Condición                                |
| ------ | ---------------------------------------- |
| 400    | `category_id` inválido o código inválido |
| 401    | Token ausente o inválido                 |
| 404    | Categoría no encontrada                  |
| 500    | Error interno                            |

---

### PUT /tax-classification/{id}

**Descripción:** Actualiza una clasificación fiscal existente.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo               | Tipo     | Requerido | Descripción        |
| ------------------- | -------- | --------- | ------------------ |
| classification_code | string   | No        | Nuevo código SIFEN |
| tax_rate_id         | int      | No        | Nueva tasa         |
| effective_from      | datetime | No        | Nueva fecha inicio |
| effective_to        | datetime | No        | Nueva fecha fin    |
| notes               | string   | No        | Notas              |

#### Response 200

Estructura de clasificación actualizada.

#### Errores

| Código | Condición                     |
| ------ | ----------------------------- |
| 400    | `id` inválido o body inválido |
| 401    | Token ausente o inválido      |
| 404    | Clasificación no encontrada   |
| 500    | Error interno                 |

---

### DELETE /tax-classification/{id}

**Descripción:** Elimina una clasificación fiscal.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 204

Sin contenido.

#### Errores

| Código | Condición                   |
| ------ | --------------------------- |
| 400    | `id` inválido               |
| 401    | Token ausente o inválido    |
| 404    | Clasificación no encontrada |
| 500    | Error interno               |

---

## Jerarquía de Resolución de IVA

Cuando el sistema determina la tasa de IVA para un producto en una transacción, aplica la siguiente jerarquía (de mayor a menor prioridad):

1. **Override transaccional** (`order_details.tax_rate_id`) - Tasa explícita en la línea
2. **Override de precio** (`unit_prices.effective_tax_rate_id`) - Tasa para precio específico
3. **Override de producto** (`products.override_tax_rate_id`) - Tasa específica del producto
4. **Clasificación fiscal** (`product_tax_classifications`) - Según código SIFEN
5. **Default de categoría** (`categories.default_tax_rate_id`) - Tasa de la categoría
6. **Default del sistema** (`tax_rates.is_default = true`) - Fallback (IVA 10%)

---

## Códigos SIFEN

| Código      | Nombre              | Descripción                          | Tasa Default |
| ----------- | ------------------- | ------------------------------------ | ------------ |
| `CANASTA`   | Canasta Básica      | Productos de canasta básica          | 5%           |
| `GENERAL`   | General             | Bienes y servicios generales         | 10%          |
| `EXENTO`    | Exento              | Exportaciones, transporte, educación | 0%           |
| `IMPORT`    | Importaciones       | Bienes importados                    | 10%          |
| `DIGITAL`   | Servicios Digitales | Servicios digitales internacionales  | 10%          |
| `TURISMO`   | Turismo             | Servicios turísticos                 | Variable     |
| `SELECTIVE` | ISC                 | Impuesto selectivo al consumo        | Variable     |

---

## Resumen de Endpoints

| Método | Endpoint                                   | Descripción                      |
| ------ | ------------------------------------------ | -------------------------------- |
| GET    | `/tax-classification/info`                 | Info de códigos SIFEN            |
| GET    | `/tax-classification/defaults`             | Tasas default por código         |
| GET    | `/tax-classification/{id}`                 | Clasificación por ID             |
| GET    | `/tax-classification/product/{product_id}` | Clasificación activa de producto |
| GET    | `/tax-classification/code/{code}`          | Clasificaciones por código       |
| POST   | `/tax-classification/assign`               | Asignar a producto               |
| POST   | `/tax-classification/bulk-assign`          | Asignación masiva                |
| POST   | `/tax-classification/auto-classify`        | Auto-clasificar por categoría    |
| PUT    | `/tax-classification/{id}`                 | Actualizar clasificación         |
| DELETE | `/tax-classification/{id}`                 | Eliminar clasificación           |

---

_Última actualización: 2026-04-22 — Creada desde cero post-Multi-Branch + Party Model._
