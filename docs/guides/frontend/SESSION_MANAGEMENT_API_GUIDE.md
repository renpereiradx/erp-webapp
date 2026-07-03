# Guía de API de Gestión de Sesiones para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo permite gestionar las sesiones activas de los usuarios. Incluye consulta de sesiones activas, historial, revocación de sesiones y configuración de expiración. Complementa la guía de autenticación [USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md](./USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md).

### Características Principales

- ✅ Consulta de sesiones activas del usuario autenticado
- ✅ Historial de sesiones
- ✅ Revocación de sesiones individuales o todas
- ✅ Registro de actividad del usuario
- ✅ Configuración de expiración de sesiones
- ✅ Limpieza de sesiones expiradas
- ✅ Administración global de sesiones (admin)

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `sessions:admin` (para admin) |
| POST | `sessions:admin` (para admin) |

- Los endpoints de sesiones propias (`/sessions/*`) requieren autenticación.
- Los endpoints de administración (`/admin/sessions/*`) requieren `sessions:admin`.
- El endpoint `/admin/sessions/cleanup` requiere `sessions:admin`.

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Endpoints de Sesiones Propias

### GET /sessions/active
**Descripción:** Obtiene las sesiones activas del usuario autenticado.

### GET /sessions/history
**Descripción:** Obtiene el historial de sesiones del usuario autenticado.

### POST /sessions/{id}/revoke
**Descripción:** Revoca una sesión específica del usuario autenticado.

**Path Parameters:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la sesión a revocar |

### POST /sessions/revoke-all
**Descripción:** Revoca todas las sesiones activas del usuario autenticado (excepto la actual).

### GET /sessions/activity
**Descripción:** Obtiene el registro de actividad del usuario autenticado.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| from | string | Fecha inicio (YYYY-MM-DD) |
| to | string | Fecha fin (YYYY-MM-DD) |
| page | int | Número de página |
| page_size | int | Resultados por página |

### GET /sessions/config
**Descripción:** Obtiene la configuración de sesión del usuario (tiempo de expiración, etc.).

---

## Endpoints de Administración de Sesiones

### POST /admin/sessions/cleanup
**Descripción:** Limpia sesiones expiradas del sistema. Requiere `sessions:admin`. También se ejecuta automáticamente cada 30 minutos vía goroutine en segundo plano.

### GET /admin/sessions/all
**Descripción:** Obtiene todas las sesiones activas del sistema. Requiere `sessions:admin`.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| user_id | string | Filtrar por usuario |
| page | int | Número de página |
| page_size | int | Resultados por página |

### POST /admin/sessions/{id}/revoke
**Descripción:** Revoca cualquier sesión del sistema. Requiere `sessions:admin`.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la sesión a revocar |

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos de administración | Requiere `sessions:admin` |
| 404 | Sesión no encontrada | Verificar el ID |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
