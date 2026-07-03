# Guía de API de Auditoría para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo proporciona acceso completo al sistema de auditoría. Registra todas las operaciones del sistema (creación, modificación, eliminación de entidades) con trazabilidad completa: quién, qué, cuándo y desde dónde.

### Características Principales

- ✅ Consulta de logs de auditoría con filtros avanzados
- ✅ Resumen y tendencias de actividad
- ✅ Historial por entidad (producto, venta, etc.)
- ✅ Reportes de actividad por usuario
- ✅ Dashboard consolidado de auditoría
- ✅ Exportación de logs
- ✅ Constantes del sistema (categorías, acciones, niveles, tipos de entidad)

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `audit:read` |
| POST | `audit:read` (solo lectura) |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Endpoints de Logs

### GET /api/v1/audit/logs
**Descripción:** Lista los registros de auditoría con filtros.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| entity_type | string | Filtrar por tipo de entidad |
| entity_id | string | Filtrar por ID de entidad |
| action | string | Filtrar por acción (CREATE, UPDATE, DELETE) |
| user_id | string | Filtrar por usuario |
| level | string | Filtrar por nivel (INFO, WARNING, ERROR) |
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |
| page | int | Número de página |
| page_size | int | Resultados por página |

### GET /api/v1/audit/logs/{id}
**Descripción:** Obtiene un registro de auditoría por ID.

---

## Endpoints de Resumen

### GET /api/v1/audit/summary
**Descripción:** Resumen global de actividad de auditoría.

### GET /api/v1/audit/summary/range
**Descripción:** Resumen de actividad en un rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |

---

## Endpoints de Tendencias

### GET /api/v1/audit/trends
**Descripción:** Tendencias de actividad de auditoría.

### GET /api/v1/audit/trends/range
**Descripción:** Tendencias en un rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |

---

## Endpoints de Historial por Entidad

### GET /api/v1/audit/entity/{entity_type}/{entity_id}/history
**Descripción:** Obtiene el historial completo de cambios de una entidad específica.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| entity_type | string | Tipo de entidad (product, sale, purchase, user, etc.) |
| entity_id | string | ID de la entidad |

---

## Endpoints de Actividad de Usuario

### GET /api/v1/audit/users/top
**Descripción:** Usuarios con mayor actividad en el sistema.

### GET /api/v1/audit/users/{user_id}/activity
**Descripción:** Actividad de un usuario específico.

### GET /api/v1/audit/users/{user_id}/activity/range
**Descripción:** Actividad de un usuario en un rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |

---

## Endpoints de Dashboard

### GET /api/v1/audit/dashboard
**Descripción:** Dashboard consolidado de auditoría con métricas clave.

### GET /api/v1/audit/dashboard/range
**Descripción:** Dashboard en un rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |

---

## Endpoints de Exportación

### POST /api/v1/audit/export
**Descripción:** Exporta logs de auditoría.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| format | string | Sí | Formato de exportación (csv, json) |
| from | string | No | Fecha inicio |
| to | string | No | Fecha fin |
| filters | object | No | Filtros adicionales |

---

## Endpoints de Constantes

### GET /api/v1/audit/categories
**Descripción:** Lista las categorías de auditoría disponibles.

### GET /api/v1/audit/actions
**Descripción:** Lista las acciones de auditoría disponibles (CREATE, UPDATE, DELETE, etc.).

### GET /api/v1/audit/levels
**Descripción:** Lista los niveles de auditoría disponibles (INFO, WARNING, ERROR).

### GET /api/v1/audit/entity-types
**Descripción:** Lista los tipos de entidad auditables.

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Parámetros inválidos | Verificar query params |
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Log no encontrado | Verificar el ID |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
