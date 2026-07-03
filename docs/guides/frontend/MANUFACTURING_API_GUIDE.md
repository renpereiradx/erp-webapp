# Guía de API de Manufactura e Insumos para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo gestiona el sistema de manufactura: insumos (supplies), compras de insumos, recetas de productos, lotes de producción y reportes de producción/rentabilidad.

### Características Principales

- ✅ CRUD de insumos (supplies) con seguimiento de stock
- ✅ Registro de compras de insumos
- ✅ Gestión de recetas de productos (ingredientes)
- ✅ Registro de lotes de producción manual
- ✅ Reportes de compras de insumos, producción y rentabilidad

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `manufacturing:read` |
| POST / PUT / DELETE / PATCH | `manufacturing:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Endpoints de Insumos (Supplies)

### POST /manufacturing/supplies
**Descripción:** Crea un nuevo insumo.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del insumo |
| unit | string | Sí | Unidad de medida (kg, L, unit, etc.) |
| stock_quantity | decimal | No | Cantidad en stock inicial |
| min_stock | decimal | No | Stock mínimo |
| description | string | No | Descripción |

### GET /manufacturing/supplies
**Descripción:** Lista todos los insumos.

### GET /manufacturing/supplies/{id}
**Descripción:** Obtiene un insumo por ID.

### PUT /manufacturing/supplies/{id}
**Descripción:** Actualiza un insumo.

### DELETE /manufacturing/supplies/{id}
**Descripción:** Elimina un insumo.

---

## Endpoints de Compras de Insumos

### POST /manufacturing/purchases
**Descripción:** Registra una compra de insumos.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| supply_id | int | Sí | ID del insumo |
| quantity | decimal | Sí | Cantidad comprada |
| unit_cost | decimal | Sí | Costo por unidad |
| supplier_id | string | No | Proveedor |
| purchase_date | string | No | Fecha de compra (ISO 8601) |
| notes | string | No | Notas |

### GET /manufacturing/purchases
**Descripción:** Lista las compras de insumos.

---

## Endpoints de Producción

### POST /manufacturing/production
**Descripción:** Registra un lote de producción manual.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto producido |
| quantity | decimal | Sí | Cantidad producida |
| unit | string | Sí | Unidad de medida |
| production_date | string | No | Fecha de producción |
| notes | string | No | Notas |

### GET /manufacturing/production/batches
**Descripción:** Lista los lotes de producción.

---

## Endpoints de Recetas

### GET /manufacturing/recipes/{product_id}
**Descripción:** Obtiene la receta de un producto (lista de ingredientes).

### POST /manufacturing/recipes/{product_id}/ingredients
**Descripción:** Agrega un ingrediente a la receta de un producto.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| supply_id | int | Sí | ID del insumo |
| quantity | decimal | Sí | Cantidad necesaria |
| unit | string | Sí | Unidad de medida |

### DELETE /manufacturing/recipes/{product_id}/ingredients/{supply_id}
**Descripción:** Elimina un ingrediente de la receta.

---

## Endpoints de Reportes

### GET /manufacturing/reports/supply-purchases
**Descripción:** Reporte de compras de insumos (resumen).

### GET /manufacturing/reports/production
**Descripción:** Reporte de producción (resumen).

### GET /manufacturing/reports/profitability
**Descripción:** Reporte de rentabilidad de productos manufacturados.

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos o validación fallida | Verificar el body y campos requeridos |
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Recurso no encontrado | Verificar el ID |
| 500 | Error interno del servidor | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
