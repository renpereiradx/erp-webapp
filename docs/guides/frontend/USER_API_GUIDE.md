# Guía de API de Administración de Usuarios para Frontend

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `users:read` |
| POST / PUT / DELETE / PATCH | `users:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Base URL
`http://localhost:5050`

## Autenticación
- Header: `Authorization: Bearer <jwt_token>`
- Permisos requeridos según endpoint (ver cada sección)

---

## Response Wrapper

Todos los endpoints de `/api/v1/users` usan el wrapper estándar:

```json
{
    "success": true,
    "data": { ... },
    "message": "Usuario creado exitosamente"
}
```

En errores:
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

## 1. Listar Usuarios

**GET /api/v1/users**

### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| search | string | — | Búsqueda por nombre o email |
| status | string | — | `active`, `inactive`, `suspended`, `pending` |
| role_id | string | — | Filtrar por ID de rol |
| sort_by | string | `created_at` | `created_at`, `first_name`, `last_name`, `email` |
| sort_order | string | `desc` | `asc` o `desc` |
| page | int | 1 | Número de página |
| page_size | int | 20 | Resultados por página (max 100) |

### Response 200

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
                { "id": "admin", "name": "Administrador" }
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

## 2. Obtener Usuario por ID

**GET /api/v1/users/{id}**

### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID único del usuario |

### Response 200

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
        "failed_login_attempts": 0,
        "locked_until": null,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "roles": [
            { "id": "admin", "name": "Administrador" }
        ],
        "sessions_count": 3
    }
}
```

### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token JWT inválido o ausente |
| 404 | Usuario no encontrado |

---

## 3. Crear Usuario

**POST /api/v1/users**

### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| first_name | string | Sí | Nombre |
| last_name | string | Sí | Apellido |
| email | string | Sí | Email único |
| username | string | Sí | Username único (max 50 caracteres) |
| password | string | Sí | Contraseña (mínimo 6 caracteres) |
| phone | string | No | Teléfono |
| status | string | No | Estado inicial (default: `active`) |
| role_ids | array | No | IDs de roles a asignar |

### Request

```json
{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "password": "SecurePass123",
    "phone": "+1987654321",
    "role_ids": ["user"]
}
```

### Response 201

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
            { "id": "user", "name": "Usuario" }
        ]
    },
    "message": "Usuario creado exitosamente"
}
```

### Errores

| Código | Condición |
|--------|-----------|
| 400 | Campos requeridos vacíos o contraseña inválida |
| 401 | Token JWT inválido o ausente |
| 409 | Email o username ya existe |

---

## 4. Actualizar Usuario

**PUT /api/v1/users/{id}**

### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID único del usuario |

### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| first_name | string | No | Nombre |
| last_name | string | No | Apellido |
| email | string | No | Email (debe ser único) |
| username | string | No | Username (debe ser único) |
| phone | string | No | Teléfono |
| avatar_url | string | No | URL del avatar |

### Request (parcial — solo lo enviado se actualiza)

```json
{
    "first_name": "John",
    "last_name": "Doe Updated",
    "phone": "+1111111111"
}
```

### Response 200

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

## 5. Eliminar Usuario (Soft Delete)

**DELETE /api/v1/users/{id}**

### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID único del usuario |

### Response 200

```json
{
    "success": true,
    "message": "Usuario eliminado exitosamente"
}
```

### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token JWT inválido o ausente |
| 403 | No se puede eliminar a sí mismo |
| 404 | Usuario no encontrado |

---

## 6. Activar / Desactivar Usuario

**POST /api/v1/users/{id}/activate**
**POST /api/v1/users/{id}/deactivate**

### Response 200

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

### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token JWT inválido o ausente |
| 403 | No se puede modificar a sí mismo |
| 404 | Usuario no encontrado |

---

## 7. Cambiar Contraseña (Admin)

**POST /api/v1/users/{id}/change-password**

### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| new_password | string | Sí | Nueva contraseña |
| force_logout | boolean | No | Cerrar sesiones activas (default: true) |

### Request

```json
{
    "new_password": "NewSecurePass456",
    "force_logout": true
}
```

### Response 200

```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "sessions_revoked": 3
}
```

---

## 8. Gestión de Roles

### GET /api/v1/users/{id}/roles

Retorna los roles asignados al usuario.

```json
{
    "success": true,
    "data": [
        {
            "id": "admin",
            "name": "Administrador",
            "assigned_at": "2024-01-01T00:00:00Z",
            "assigned_by": "system"
        }
    ]
}
```

### POST /api/v1/users/{id}/roles

Asigna un rol al usuario.

**Request Body:** `{ "role_id": "manager" }`

**Errores:** 409 si ya tiene el rol.

### DELETE /api/v1/users/{id}/roles/{roleId}

Remueve un rol del usuario.

---

## Notas

- **Login:** Los usuarios pueden usar `/login` con `username` o `email` + `password`. Ver [USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md](./USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md).
- **Party Model:** Internamente los usuarios tienen un registro en `users.parties` con `party_type: "INTERNAL"`. El modelo `User` expone `first_name`, `last_name`, `email`.
- **Sistema cerrado:** No hay auto-registro público. Solo administradores crean usuarios.
- **Soft delete:** Los usuarios eliminados se marcan como inactivos, no se borran físicamente.

---

*Última actualización: 2026-05-08*
