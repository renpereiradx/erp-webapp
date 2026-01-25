# API de Administración de Usuarios

## Resumen

Esta API permite la gestión completa de usuarios en el sistema. **NO existe auto-registro público** - solo los administradores pueden crear usuarios nuevos.

Para crear el primer usuario administrador, consulta la [guía de bootstrap](../guides/backend/BOOTSTRAP_ADMIN_USER.md).

## Base URL

```
/api/v1/users
```

## Autenticación

Todos los endpoints requieren autenticación JWT en el header:

```
Authorization: Bearer <token>
```

### Login con Username o Email

El sistema soporta login usando **username** o **email** junto con la contraseña:

**Opción 1: Login con Username**
```json
POST /login
{
  "username": "johndoe",
  "password": "mypassword"
}
```

**Opción 2: Login con Email** (mantiene compatibilidad con versiones anteriores)
```json
POST /login
{
  "email": "john@example.com",
  "password": "mypassword"
}
```

> **Nota:** Debe proporcionar al menos uno de los dos: `username` o `email`.

---

## Endpoints

### 1. Listar Usuarios

Lista todos los usuarios con soporte para filtros, búsqueda y paginación.

**Endpoint:** `GET /api/v1/users`

**Permisos:** `users:read`

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `search` | string | No | - | Búsqueda por nombre o email |
| `status` | string | No | - | Filtrar por estado: `active`, `inactive`, `suspended`, `pending` |
| `role_id` | string | No | - | Filtrar por ID de rol |
| `created_from` | string | No | - | Fecha mínima de creación (ISO 8601) |
| `created_to` | string | No | - | Fecha máxima de creación (ISO 8601) |
| `sort_by` | string | No | `created_at` | Campo para ordenar: `created_at`, `first_name`, `last_name`, `email` |
| `sort_order` | string | No | `desc` | Dirección: `asc`, `desc` |
| `page` | int | No | 1 | Número de página |
| `page_size` | int | No | 20 | Resultados por página (max: 100) |

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/users?search=john&status=active&page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": "abc123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "username": "johndoe",
            "phone": "+1234567890",
            "avatar_url": null,
            "status": "active",
            "email_verified": true,
            "last_login_at": "2024-01-15T10:30:00Z",
            "created_at": "2024-01-01T00:00:00Z",
            "roles": [
                {
                    "id": "admin",
                    "name": "Administrador"
                }
            ]
        }
    ],
    "pagination": {
        "page": 1,
        "page_size": 20,
        "total_items": 150,
        "total_pages": 8,
        "has_next": true,
        "has_prev": false
    }
}
```

---

### 2. Obtener Usuario por ID

Obtiene el detalle completo de un usuario específico.

**Endpoint:** `GET /api/v1/users/{id}`

**Permisos:** `users:read`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del usuario |

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/users/abc123" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "phone": "+1234567890",
        "avatar_url": "https://example.com/avatar.jpg",
        "status": "active",
        "email_verified": true,
        "last_login_at": "2024-01-15T10:30:00Z",
        "password_changed_at": "2024-01-01T00:00:00Z",
        "failed_login_attempts": 0,
        "locked_until": null,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "roles": [
            {
                "id": "admin",
                "name": "Administrador"
            }
        ],
        "sessions_count": 3
    }
}
```

#### Response (404 Not Found)

```json
{
    "success": false,
    "error": {
        "code": "USER_NOT_FOUND",
        "message": "El usuario solicitado no existe"
    }
}
```

---

### 3. Crear Usuario

Crea un nuevo usuario en el sistema.

**Endpoint:** `POST /api/v1/users`

**Permisos:** `users:create`

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `first_name` | string | Sí | Nombre (max 100 caracteres) |
| `last_name` | string | Sí | Apellido (max 100 caracteres) |
| `email` | string | Sí | Email único y válido |
| `username` | string | Sí | Username único (max 50 caracteres) |
| `password` | string | Sí | Contraseña (min 8 chars, 1 mayúscula, 1 minúscula, 1 número) |
| `phone` | string | No | Teléfono |
| `status` | string | No | Estado inicial (default: `active`) |
| `role_ids` | array | No | IDs de roles a asignar |

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "password": "SecurePass123",
    "phone": "+1987654321",
    "role_ids": ["user"]
  }'
```

#### Response (201 Created)

```json
{
    "success": true,
    "data": {
        "id": "xyz789",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "username": "janesmith",
        "phone": "+1987654321",
        "status": "active",
        "email_verified": false,
        "created_at": "2024-01-16T12:00:00Z",
        "roles": [
            {
                "id": "user",
                "name": "Usuario"
            }
        ]
    },
    "message": "Usuario creado exitosamente"
}
```

#### Response (409 Conflict)

```json
{
    "success": false,
    "error": {
        "code": "USER_ALREADY_EXISTS",
        "message": "Ya existe un usuario con este email"
    }
}
```

#### Response (400 Bad Request)

```json
{
    "success": false,
    "error": {
        "code": "INVALID_PASSWORD",
        "message": "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
    }
}
```

---

### 4. Actualizar Usuario

Actualiza los datos de un usuario existente.

**Endpoint:** `PUT /api/v1/users/{id}`

**Permisos:** `users:update`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del usuario |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `first_name` | string | No | Nombre |
| `last_name` | string | No | Apellido |
| `email` | string | No | Email (debe ser único) |
| `username` | string | No | Username (debe ser único) |
| `phone` | string | No | Teléfono |
| `avatar_url` | string | No | URL del avatar |

#### Request

```bash
curl -X PUT "http://localhost:8080/api/v1/users/abc123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe Updated",
    "phone": "+1111111111"
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "first_name": "John",
        "last_name": "Doe Updated",
        "email": "john@example.com",
        "phone": "+1111111111",
        "status": "active",
        "updated_at": "2024-01-16T12:30:00Z"
    },
    "message": "Usuario actualizado exitosamente"
}
```

---

### 5. Eliminar Usuario (Soft Delete)

Marca un usuario como eliminado sin borrarlo físicamente.

**Endpoint:** `DELETE /api/v1/users/{id}`

**Permisos:** `users:delete`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del usuario |

#### Request

```bash
curl -X DELETE "http://localhost:8080/api/v1/users/abc123" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Usuario eliminado exitosamente"
}
```

#### Response (403 Forbidden)

```json
{
    "success": false,
    "error": {
        "code": "CANNOT_DELETE_SELF",
        "message": "No puede eliminar su propia cuenta"
    }
}
```

---

### 6. Activar Usuario

Cambia el estado de un usuario a `active`.

**Endpoint:** `POST /api/v1/users/{id}/activate`

**Permisos:** `users:update`

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users/abc123/activate" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "status": "active",
        "updated_at": "2024-01-16T12:30:00Z"
    },
    "message": "Usuario activado exitosamente"
}
```

---

### 7. Desactivar Usuario

Cambia el estado de un usuario a `inactive`.

**Endpoint:** `POST /api/v1/users/{id}/deactivate`

**Permisos:** `users:update`

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users/abc123/deactivate" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "status": "inactive",
        "updated_at": "2024-01-16T12:30:00Z"
    },
    "message": "Usuario desactivado exitosamente"
}
```

#### Response (403 Forbidden)

```json
{
    "success": false,
    "error": {
        "code": "CANNOT_MODIFY_SELF",
        "message": "No puede desactivar su propia cuenta"
    }
}
```

---

### 8. Cambiar Contraseña (Admin)

Permite a un administrador cambiar la contraseña de un usuario.

**Endpoint:** `POST /api/v1/users/{id}/change-password`

**Permisos:** `users:update`

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `new_password` | string | Sí | Nueva contraseña |
| `force_logout` | boolean | No | Cerrar todas las sesiones (default: true) |

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users/abc123/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_password": "NewSecurePass456",
    "force_logout": true
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "sessions_revoked": 3
}
```

---

### 9. Obtener Roles del Usuario

Lista los roles asignados a un usuario.

**Endpoint:** `GET /api/v1/users/{id}/roles`

**Permisos:** `users:read`

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/users/abc123/roles" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": "admin",
            "name": "Administrador",
            "assigned_at": "2024-01-01T00:00:00Z",
            "assigned_by": "system"
        },
        {
            "id": "manager",
            "name": "Gerente",
            "assigned_at": "2024-01-10T00:00:00Z",
            "assigned_by": "xyz789"
        }
    ]
}
```

---

### 10. Asignar Rol a Usuario

Asigna un nuevo rol a un usuario.

**Endpoint:** `POST /api/v1/users/{id}/roles`

**Permisos:** `users:assign-role`

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `role_id` | string | Sí | ID del rol a asignar |

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users/abc123/roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "manager"
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Rol asignado exitosamente",
    "data": {
        "user_id": "abc123",
        "role_id": "manager",
        "assigned_at": "2024-01-16T12:30:00Z"
    }
}
```

#### Response (409 Conflict)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_ALREADY_ASSIGNED",
        "message": "El usuario ya tiene este rol asignado"
    }
}
```

---

### 11. Remover Rol de Usuario

Remueve un rol de un usuario.

**Endpoint:** `DELETE /api/v1/users/{id}/roles/{roleId}`

**Permisos:** `users:assign-role`

#### Request

```bash
curl -X DELETE "http://localhost:8080/api/v1/users/abc123/roles/manager" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Rol removido exitosamente"
}
```

#### Response (400 Bad Request)

```json
{
    "success": false,
    "error": {
        "code": "CANNOT_REMOVE_LAST_ROLE",
        "message": "El usuario debe tener al menos un rol"
    }
}
```

---

## Endpoints de Perfil (Usuario Autenticado)

### 12. Obtener Mi Perfil

Obtiene el perfil del usuario autenticado.

**Endpoint:** `GET /api/v1/users/me`

**Permisos:** Usuario autenticado

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "phone": "+1234567890",
        "avatar_url": null,
        "status": "active",
        "email_verified": true,
        "last_login_at": "2024-01-15T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "roles": [
            {
                "id": "admin",
                "name": "Administrador"
            }
        ]
    }
}
```

---

### 13. Actualizar Mi Perfil

Actualiza el perfil del usuario autenticado.

**Endpoint:** `PUT /api/v1/users/me`

**Permisos:** Usuario autenticado

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `first_name` | string | No | Nombre |
| `last_name` | string | No | Apellido |
| `phone` | string | No | Teléfono |
| `avatar_url` | string | No | URL del avatar |

> **Nota:** No se permite cambiar email ni status a través de este endpoint.

#### Request

```bash
curl -X PUT "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe Updated",
    "phone": "+1111111111"
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "first_name": "John",
        "last_name": "Doe Updated",
        "phone": "+1111111111",
        "updated_at": "2024-01-16T12:30:00Z"
    },
    "message": "Perfil actualizado exitosamente"
}
```

---

### 14. Cambiar Mi Contraseña

Permite al usuario cambiar su propia contraseña.

**Endpoint:** `POST /api/v1/users/me/change-password`

**Permisos:** Usuario autenticado

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `current_password` | string | Sí | Contraseña actual |
| `new_password` | string | Sí | Nueva contraseña |
| `logout_other_sessions` | boolean | No | Cerrar otras sesiones (default: false) |

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/users/me/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPass123",
    "new_password": "NewSecurePass456",
    "logout_other_sessions": true
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "sessions_revoked": 2
}
```

#### Response (401 Unauthorized)

```json
{
    "success": false,
    "error": {
        "code": "WRONG_PASSWORD",
        "message": "La contraseña actual es incorrecta"
    }
}
```

---

## Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | Usuario no encontrado |
| `USER_ALREADY_EXISTS` | 409 | Email ya registrado |
| `INVALID_PASSWORD` | 400 | Contraseña no cumple requisitos |
| `WRONG_PASSWORD` | 401 | Contraseña actual incorrecta |
| `INVALID_EMAIL` | 400 | Formato de email inválido |
| `USER_INACTIVE` | 403 | Usuario desactivado |
| `USER_SUSPENDED` | 403 | Usuario suspendido |
| `CANNOT_MODIFY_SELF` | 403 | No puede modificar su propio estado |
| `CANNOT_DELETE_SELF` | 403 | No puede eliminar su propia cuenta |
| `CANNOT_REMOVE_LAST_ROLE` | 400 | Usuario debe tener al menos un rol |
| `ROLE_ALREADY_ASSIGNED` | 409 | Rol ya asignado al usuario |
| `ROLE_NOT_FOUND` | 404 | Rol no existe |
| `INSUFFICIENT_PERMISSIONS` | 403 | Sin permisos para la acción |
| `ACCOUNT_LOCKED` | 423 | Cuenta bloqueada por intentos fallidos |
| `VALIDATION_ERROR` | 400 | Error de validación de datos |

---

## Ejemplos de Uso

### Flujo: Crear Usuario y Asignar Roles

```bash
# 1. Crear usuario
USER_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "password": "SecurePass123"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.data.id')

# 2. Asignar rol adicional
curl -X POST "http://localhost:8080/api/v1/users/$USER_ID/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role_id": "manager"}'
```

### Flujo: Buscar y Filtrar Usuarios

```bash
# Buscar usuarios activos que sean administradores
curl -X GET "http://localhost:8080/api/v1/users?search=john&status=active&role_id=admin&page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Flujo: Desactivar Usuario y Revocar Sesiones

```bash
# 1. Desactivar usuario
curl -X POST "http://localhost:8080/api/v1/users/abc123/deactivate" \
  -H "Authorization: Bearer $TOKEN"

# 2. Revocar todas sus sesiones (opcional, ya debería estar incluido)
curl -X POST "http://localhost:8080/sessions/revoke-all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "abc123"}'
```
