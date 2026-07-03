# Guía de API de Pronósticos para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo proporciona pronósticos basados en datos históricos del sistema: ventas, inventario, demanda e ingresos. Los endpoints están disponibles tanto en `/api/v1/forecast/*` como en `/forecast/*` (compatibilidad legacy).

### Características Principales

- ✅ Pronóstico de ventas
- ✅ Pronóstico de inventario
- ✅ Pronóstico de demanda
- ✅ Pronóstico de ingresos
- ✅ Dashboard consolidado de pronósticos

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `analytics:read` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Contexto de Sucursal (BI)

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

> **Nota:** Los endpoints de pronósticos usan contexto BI. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md) para reglas detalladas.

---

## Endpoints

Cada endpoint está disponible en dos paths (el segundo es alias legacy):

| Endpoint | Alias Legacy |
|----------|-------------|
| `GET /api/v1/forecast/sales` | `GET /forecast/sales` |
| `GET /api/v1/forecast/inventory` | `GET /forecast/inventory` |
| `GET /api/v1/forecast/demand` | `GET /forecast/demand` |
| `GET /api/v1/forecast/revenue` | `GET /forecast/revenue` |
| `GET /api/v1/forecast/dashboard` | `GET /forecast/dashboard` |

### GET /api/v1/forecast/sales
**Descripción:** Pronóstico de ventas proyectadas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| period | string | Período: `daily`, `weekly`, `monthly` |
| days | int | Número de días a pronosticar (default: 30) |
| branch_id | int | ID de sucursal |

### GET /api/v1/forecast/inventory
**Descripción:** Pronóstico de niveles de inventario.

### GET /api/v1/forecast/demand
**Descripción:** Pronóstico de demanda de productos.

### GET /api/v1/forecast/revenue
**Descripción:** Pronóstico de ingresos proyectados.

### GET /api/v1/forecast/dashboard
**Descripción:** Dashboard consolidado con todos los pronósticos.

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Parámetros inválidos | Verificar query params |
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos o branch fuera de allowed_branches | Verificar rol y branch |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
