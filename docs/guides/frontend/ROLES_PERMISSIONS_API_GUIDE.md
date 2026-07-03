# Guía de API de Roles y Permisos para Frontend

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo gestiona los roles del sistema y sus permisos asociados. Permite crear roles personalizados, asignar permisos a roles y listar todos los permisos disponibles en el sistema.

### Características Principales

- ✅ CRUD completo de roles del sistema
- ✅ Asignación y remoción de permisos a roles
- ✅ Listado de todos los permisos disponibles
- ✅ Integración con el sistema RBAC por módulo

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `users:read` |
| POST / PUT / DELETE / PATCH | `users:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Endpoints de Roles

### POST /api/v1/roles
**Descripción:** Crea un nuevo rol.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del rol |
| description | string | No | Descripción |

### GET /api/v1/roles
**Descripción:** Lista todos los roles del sistema.

### GET /api/v1/roles/{id}
**Descripción:** Obtiene un rol por ID.

### PUT /api/v1/roles/{id}
**Descripción:** Actualiza un rol.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | No | Nombre del rol |
| description | string | No | Descripción |

### DELETE /api/v1/roles/{id}
**Descripción:** Elimina un rol.

---

## Endpoints de Permisos de Rol

### GET /api/v1/roles/{id}/permissions
**Descripción:** Obtiene los permisos asignados a un rol.

### POST /api/v1/roles/{id}/permissions
**Descripción:** Asigna un permiso a un rol.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| permission_id | int | Sí | ID del permiso a asignar |

### DELETE /api/v1/roles/{id}/permissions/{permissionId}
**Descripción:** Remueve un permiso de un rol.

---

## Endpoints de Permisos

### GET /api/v1/permissions
**Descripción:** Lista todos los permisos disponibles en el sistema.

**Response 200:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "resource": "products",
            "action": "read",
            "description": "Ver productos"
        },
        {
            "id": 2,
            "resource": "products",
            "action": "write",
            "description": "Crear/editar productos"
        }
    ]
}
```

---

## Relación con USER_API_GUIDE

Para asignar roles a usuarios, usar los endpoints en `USER_API_GUIDE.md`:

| Acción | Endpoint |
|--------|----------|
| Asignar rol a usuario | `POST /api/v1/users/{id}/roles` |
| Remover rol de usuario | `DELETE /api/v1/users/{id}/roles/{roleId}` |
| Ver roles de usuario | `GET /api/v1/users/{id}/roles` |

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos | Verificar el body |
| 401 | Token JWT inválido o ausente | Verificar header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Rol o permiso no encontrado | Verificar el ID |
| 409 | Conflicto (permiso ya asignado) | El permiso ya existe en el rol |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
