# Guía de API de Costos y Precios para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal (BI)

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

> **Nota:** Los endpoints de costos y precios usan `resolveBIContextFromAuth`. Ver [Guía de Contexto Multi-Sucursal](./MULTI_BRANCH_CONTEXT_GUIDE.md) para reglas detalladas de BI.

---

## Endpoints

### GET /products/{product_id}/pricing-info

**Descripción:** Obtiene información completa de precios y costos de un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

| Campo             | Tipo    | Descripción                  |
| ----------------- | ------- | ---------------------------- |
| product_id        | string  | ID del producto              |
| product_name      | string  | Nombre del producto          |
| unit              | string  | Unidad de medida             |
| current_cost      | decimal | Costo actual (última compra) |
| weighted_avg_cost | decimal | Costo promedio ponderado     |
| selling_price     | decimal | Precio de venta actual       |
| margin_amount     | decimal | Margen en valor absoluto     |
| margin_percent    | decimal | Margen en porcentaje         |
| cost_source       | string  | Fuente del costo             |
| price_source      | string  | Fuente del precio            |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/pricing-info/{unit}

**Descripción:** Obtiene información de precios para una unidad específica.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

Igual estructura que `GET /products/{product_id}/pricing-info`.

---

### POST /products/{product_id}/costs

**Descripción:** Registra un nuevo costo de compra para un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |
| Content-Type  | Sí          | `application/json`          |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Request Body

| Campo              | Tipo     | Requerido | Descripción                                         |
| ------------------ | -------- | --------- | --------------------------------------------------- |
| unit               | string   | Sí        | Unidad de medida (`kg`, `caja`, `unit`, etc.)       |
| cost_per_unit      | decimal  | Sí        | Costo por unidad                                    |
| supplier_id        | string   | No        | ID del proveedor (Party ID)                         |
| purchase_date      | datetime | Sí        | Fecha de compra                                     |
| quantity_purchased | decimal  | Sí        | Cantidad comprada                                   |
| metadata           | object   | No        | Metadatos adicionales (invoice_number, notes, etc.) |

#### Response 201

| Campo                       | Tipo    | Descripción                             |
| --------------------------- | ------- | --------------------------------------- |
| success                     | bool    | `true`                                  |
| cost_id                     | int     | ID del costo registrado                 |
| impact.old_weighted_average | decimal | Promedio ponderado anterior             |
| impact.new_weighted_average | decimal | Nuevo promedio ponderado                |
| impact.margin_change        | decimal | Cambio en el margen                     |
| impact.new_margin_percent   | decimal | Nuevo margen porcentual                 |
| alerts                      | array   | Alertas generadas (cost_increase, etc.) |

#### Errores

| Código | Condición                                                          |
| ------ | ------------------------------------------------------------------ |
| 400    | Body inválido, campos requeridos faltantes, o `branch_id` inválido |
| 401    | Token ausente o inválido                                           |
| 403    | `branch_id` fuera de `allowed_branches`                            |
| 404    | Producto no encontrado                                             |
| 500    | Error interno                                                      |

---

### GET /products/{product_id}/costs/history

**Descripción:** Obtiene el historial de costos de un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo   | Requerido | Descripción                 |
| --------- | ------ | --------- | --------------------------- |
| branch_id | int    | No        | ID de sucursal explícita    |
| unit      | string | No        | Filtrar por unidad          |
| months    | int    | No        | Período en meses (3, 6, 12) |

#### Response 200

| Campo            | Tipo    | Descripción                                     |
| ---------------- | ------- | ----------------------------------------------- |
| product_id       | string  | ID del producto                                 |
| unit             | string  | Unidad de medida                                |
| cost_history     | array   | Lista de entradas de costo                      |
| weighted_average | decimal | Promedio ponderado del período                  |
| cost_trend       | string  | Tendencia: `increasing`, `decreasing`, `stable` |

**Cost History Entry:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del costo |
| cost_per_unit | decimal | Costo por unidad |
| supplier_id | string | ID del proveedor |
| purchase_date | datetime | Fecha de compra |
| quantity_purchased | decimal | Cantidad comprada |
| metadata | object | Metadatos adicionales |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/costs/last

**Descripción:** Obtiene el último costo de compra de un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

Estructura `ProductCost`:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID del costo |
| product_id | string | ID del producto |
| unit | string | Unidad |
| cost_per_unit | decimal | Costo por unidad |
| supplier_id | string | ID del proveedor (nullable) |
| purchase_order_id | int | ID de orden de compra (nullable) |
| purchase_date | datetime | Fecha de compra |
| quantity_purchased | decimal | Cantidad comprada |
| created_by | string | Usuario que registró |
| created_at | datetime | Fecha de registro |
| metadata | object | Metadatos adicionales |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/costs/last-record

**Descripción:** Obtiene el último registro de compra completo.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

Registro de compra completo con detalles adicionales.

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/costs/summary

**Descripción:** Obtiene un resumen de costos de un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

| Campo              | Tipo     | Descripción             |
| ------------------ | -------- | ----------------------- |
| product_id         | string   | ID del producto         |
| total_purchases    | int      | Total de compras        |
| total_quantity     | decimal  | Cantidad total comprada |
| avg_cost           | decimal  | Costo promedio          |
| min_cost           | decimal  | Costo mínimo            |
| max_cost           | decimal  | Costo máximo            |
| last_purchase_date | datetime | Fecha de última compra  |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/cost-trends

**Descripción:** Obtiene tendencias de costos de un producto.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |
| months    | int  | No        | Período en meses         |

#### Response 200

| Campo                         | Tipo    | Descripción                          |
| ----------------------------- | ------- | ------------------------------------ |
| product_id                    | string  | ID del producto                      |
| product_name                  | string  | Nombre del producto                  |
| trend_analysis.direction      | string  | `increasing`, `decreasing`, `stable` |
| trend_analysis.change_percent | decimal | Porcentaje de cambio                 |
| trend_analysis.volatility     | string  | `low`, `medium`, `high`              |
| monthly_averages              | array   | Promedios mensuales                  |

**Monthly Average:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| month | string | Mes (YYYY-MM) |
| average_cost | decimal | Costo promedio |
| purchase_count | int | Cantidad de compras |
| total_quantity | decimal | Cantidad total |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 404    | Producto no encontrado                  |
| 500    | Error interno                           |

---

### GET /products/{product_id}/cost-methods

**Descripción:** Obtiene los métodos de cálculo de costos disponibles.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Response 200

| Campo   | Tipo  | Descripción                 |
| ------- | ----- | --------------------------- |
| methods | array | Lista de métodos de cálculo |

**Method:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| code | string | Código del método |
| name | string | Nombre del método |
| description | string | Descripción |

#### Errores

| Código | Condición                |
| ------ | ------------------------ |
| 401    | Token ausente o inválido |
| 500    | Error interno            |

---

### GET /suppliers/{supplier_id}/cost-analysis

**Descripción:** Análisis de costos por proveedor.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción              |
| --------- | ---- | --------- | ------------------------ |
| branch_id | int  | No        | ID de sucursal explícita |

#### Response 200

| Campo           | Tipo    | Descripción          |
| --------------- | ------- | -------------------- |
| supplier_id     | string  | ID del proveedor     |
| supplier_name   | string  | Nombre del proveedor |
| total_purchases | int     | Total de compras     |
| total_amount    | decimal | Monto total          |
| avg_cost        | decimal | Costo promedio       |
| products        | array   | Productos comprados  |

#### Errores

| Código | Condición                                     |
| ------ | --------------------------------------------- |
| 400    | `supplier_id` inválido o `branch_id` inválido |
| 401    | Token ausente o inválido                      |
| 403    | `branch_id` fuera de `allowed_branches`       |
| 404    | Proveedor no encontrado                       |
| 500    | Error interno                                 |

---

### GET /cost-trends

**Descripción:** Tendencias globales de costos.

#### Headers

| Header        | Requerido   | Descripción                 |
| ------------- | ----------- | --------------------------- |
| Authorization | Sí          | Bearer token                |
| X-Branch-ID   | Condicional | Si no se envía `?branch_id` |

#### Query Parameters

| Parámetro | Tipo   | Requerido | Descripción                         |
| --------- | ------ | --------- | ----------------------------------- |
| branch_id | int    | No        | ID de sucursal explícita            |
| period    | string | No        | Período: `month`, `quarter`, `year` |

#### Response 200

| Campo  | Tipo  | Descripción         |
| ------ | ----- | ------------------- |
| trends | array | Lista de tendencias |

**Trend:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| period | string | Período |
| avg_cost_change | decimal | Cambio promedio de costo |
| products_affected | int | Productos afectados |
| top_increases | array | Mayores aumentos |
| top_decreases | array | Mayores disminuciones |

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `branch_id` inválido                    |
| 401    | Token ausente o inválido                |
| 403    | `branch_id` fuera de `allowed_branches` |
| 500    | Error interno                           |

---

## Modelo de Datos

### ProductCost

| Campo              | Tipo     | Descripción                      |
| ------------------ | -------- | -------------------------------- |
| id                 | int      | ID único                         |
| product_id         | string   | ID del producto                  |
| unit               | string   | Unidad de medida                 |
| cost_per_unit      | decimal  | Costo por unidad                 |
| supplier_id        | string   | ID del proveedor (nullable)      |
| purchase_order_id  | int      | ID de orden de compra (nullable) |
| purchase_date      | datetime | Fecha de compra                  |
| quantity_purchased | decimal  | Cantidad comprada                |
| created_by         | string   | Usuario creador                  |
| created_at         | datetime | Fecha de creación                |
| metadata           | object   | Metadatos adicionales            |

### PricingInfo

| Campo             | Tipo    | Descripción              |
| ----------------- | ------- | ------------------------ |
| product_id        | string  | ID del producto          |
| product_name      | string  | Nombre del producto      |
| unit              | string  | Unidad                   |
| current_cost      | decimal | Costo actual             |
| weighted_avg_cost | decimal | Costo promedio ponderado |
| selling_price     | decimal | Precio de venta          |
| margin_amount     | decimal | Margen en valor          |
| margin_percent    | decimal | Margen en porcentaje     |
| cost_source       | string  | Fuente del costo         |
| price_source      | string  | Fuente del precio        |

---

## Resumen de Endpoints

| Método | Endpoint                             | Descripción                |
| ------ | ------------------------------------ | -------------------------- |
| GET    | `/products/{id}/pricing-info`        | Info completa de precios   |
| GET    | `/products/{id}/pricing-info/{unit}` | Info de precios por unidad |
| POST   | `/products/{id}/costs`               | Registrar nuevo costo      |
| GET    | `/products/{id}/costs/history`       | Historial de costos        |
| GET    | `/products/{id}/costs/last`          | Último costo               |
| GET    | `/products/{id}/costs/last-record`   | Último registro completo   |
| GET    | `/products/{id}/costs/summary`       | Resumen de costos          |
| GET    | `/products/{id}/cost-trends`         | Tendencias de costos       |
| GET    | `/products/{id}/cost-methods`        | Métodos de cálculo         |
| GET    | `/suppliers/{id}/cost-analysis`      | Análisis por proveedor     |
| GET    | `/cost-trends`                       | Tendencias globales        |

---

_Última actualización: 2026-04-22 — Reescrita post-Party Model + Multi-Branch. Eliminados ejemplos de código JS. `supplier_id` corregido a `string`._
