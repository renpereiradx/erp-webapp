# Guía de API de Transacciones de Costo para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo gestiona el registro y consulta de transacciones de costo. Proporciona un historial detallado de cambios de costo por producto, incluyendo ajustes manuales y registro de costos de compra.

### Características Principales

- ✅ Registro de transacciones de costo (compras y ajustes manuales)
- ✅ Historial completo de costos por producto
- ✅ Ajuste manual de costos
- ✅ Consulta por rango de fechas

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

## Endpoints

### POST /cost-transactions/
**Descripción:** Registra una nueva transacción de costo.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| unit | string | Sí | Unidad de medida |
| cost_per_unit | decimal | Sí | Costo por unidad |
| transaction_type | string | Sí | Tipo: `PURCHASE`, `MANUAL_ADJUSTMENT` |
| reference_type | string | No | Tipo de referencia (purchase_order, manual) |
| reference_id | string | No | ID de referencia |
| effective_date | string | No | Fecha efectiva (ISO 8601, default: NOW()) |
| notes | string | No | Notas |
| metadata | object | No | Metadatos adicionales |

### GET /cost-transactions/product/{product_id}/history
**Descripción:** Obtiene el historial de costos de un producto.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |
| page | int | Número de página |
| page_size | int | Resultados por página |

### GET /cost-transactions/by-date
**Descripción:** Transacciones de costo por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| from | string | Sí | Fecha inicio (YYYY-MM-DD) |
| to | string | Sí | Fecha fin (YYYY-MM-DD) |
| page | int | No | Número de página |
| page_size | int | No | Resultados por página |

### POST /cost-transactions/adjustment
**Descripción:** Realiza un ajuste manual de costo.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| unit | string | Sí | Unidad de medida |
| new_cost | decimal | Sí | Nuevo costo por unidad |
| reason | string | Sí | Motivo del ajuste |
| notes | string | No | Notas adicionales |

### GET /cost-transactions/{id}
**Descripción:** Obtiene una transacción de costo por ID.

---

## Diferencia con COST_PRICING_API_GUIDE

| Guía | Endpoints | Propósito |
|------|-----------|-----------|
| COST_PRICING_API_GUIDE | `/products/{id}/costs/*` | Estado actual de costos y precios, pricing-info |
| **Esta guía** | `/cost-transactions/*` | Historial detallado de transacciones de costo |

Usar `COST_PRICING_API_GUIDE` para obtener el costo actual de un producto.
Usar esta guía para auditoría e historial de cambios de costo.

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos | Verificar campos requeridos |
| 401 | Token JWT inválido | Verificar header Authorization |
| 403 | Sin permisos o branch inválida | Verificar rol y branch |
| 404 | Transacción no encontrada | Verificar el ID |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
