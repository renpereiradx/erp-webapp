# Guía de API de Transacciones de Stock para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo gestiona el registro y consulta de transacciones de stock. Proporciona un registro histórico detallado de todos los movimientos de inventario, herramientas de validación de consistencia y reportes de discrepancias.

### Características Principales

- ✅ Registro de transacciones de stock con tipos normalizados
- ✅ Historial completo de movimientos por producto
- ✅ Validación de consistencia de stock
- ✅ Reporte de discrepancias entre stock esperado vs real
- ✅ Resumen de movimientos por período
- ✅ Consulta por rango de fechas
- ✅ Catálogo de tipos de transacción

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `inventory:read` |
| POST / PUT / DELETE / PATCH | `inventory:write` |

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

## Diferencia entre `/stock/*` y `/stock-transactions/*`

| Path | Propósito | Tabla |
|------|-----------|-------|
| `/stock/*` | **Estado actual** del stock (CRUD: crear, leer, actualizar stock de un producto) | `products.stock` |
| `/stock-transactions/*` | **Historial** de movimientos de stock (transacciones, auditoría) | `products.stock_transactions` |

Usar `/stock/*` para consultar el stock actual de un producto. Usar `/stock-transactions/*` para auditoría e historial.

## Endpoints de Stock Actual

### POST /stock/{product_id}
**Descripción:** Crea un registro de stock para un producto.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| quantity | decimal | Sí | Cantidad en stock |
| branch_id | int | Sí | ID de sucursal |
| unit | string | No | Unidad de medida |

### GET /stock/{id}
**Descripción:** Obtiene un registro de stock por ID.

### GET /stock/product_id/{product_id}
**Descripción:** Obtiene el stock actual de un producto.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| branch_id | int | ID de sucursal |

### PUT /stock/{id}
**Descripción:** Actualiza la cantidad de stock por ID de registro.

### PUT /stock/product_id/{product_id}
**Descripción:** Actualiza el stock de un producto directamente.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| quantity | decimal | Sí | Nueva cantidad |
| branch_id | int | Sí | ID de sucursal |

---

## Endpoints de Transacciones de Stock

### POST /stock-transactions/
**Descripción:** Registra una nueva transacción de stock.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| variant_id | string | No | ID de variante (si aplica) |
| quantity | decimal | Sí | Cantidad (positiva = entrada, negativa = salida) |
| transaction_type | string | Sí | Tipo de transacción (ver `GET /stock-transactions/types`) |
| reference_type | string | No | Tipo de referencia (PURCHASE, SALE, ADJUSTMENT, etc.) |
| reference_id | string | No | ID de referencia |
| unit | string | No | Unidad de medida |
| branch_id | int | Sí | ID de sucursal |
| notes | string | No | Notas |
| metadata | object | No | Metadatos adicionales |

### GET /stock-transactions/product/{product_id}
**Descripción:** Obtiene el historial de transacciones de un producto.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |
| page | int | Número de página |
| page_size | int | Resultados por página |

### GET /stock-transactions/validate-consistency
**Descripción:** Valida la consistencia del stock calculado vs el stock registrado.

### GET /stock-transactions/discrepancy-report
**Descripción:** Reporte de discrepancias de inventario.

### GET /stock-transactions/movement-summary
**Descripción:** Resumen de movimientos de stock.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |

### GET /stock-transactions/by-date
**Descripción:** Transacciones de stock por rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| from | string | Sí | Fecha inicio (YYYY-MM-DD) |
| to | string | Sí | Fecha fin (YYYY-MM-DD) |
| page | int | No | Número de página |
| page_size | int | No | Resultados por página |

### GET /stock-transactions/types
**Descripción:** Lista los tipos de transacción de stock disponibles.

### GET /stock-transactions/{id}
**Descripción:** Obtiene una transacción de stock por ID.

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
